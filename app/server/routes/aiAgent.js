import express from "express";
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from "@aws-sdk/client-bedrock-agent-runtime";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import * as db from "../services/supabaseService.js";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

const router = express.Router();

const client = new BedrockAgentRuntimeClient({
  region: process.env.AWS_BEDROCK_REGION || "us-east-2",
});

const s3 = new S3Client({
  region: process.env.AWS_S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_BACKEND_KEY,
    secretAccessKey: process.env.AWS_BACKEND_SECRET,
  },
});

function validateSummaryResult(parsed) {
  if (!parsed || typeof parsed !== "object") return false;
  if (!parsed.summary || typeof parsed.summary !== "object") return false;
  if (!Array.isArray(parsed.citedRecordIDs)) return false;
  if (!parsed.citedRecordIDs.every((id) => typeof id === "string")) return false;
  if (Object.keys(parsed.summary).length === 0) return false;
  return true;
}

// ============================================
// Helper — stream S3 object to buffer
// ============================================
async function s3FileToBuffer(s3Key) {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: s3Key,
  });
  const response = await s3.send(command);
  const chunks = [];
  for await (const chunk of response.Body) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

// ============================================
// Helper — extract text from file buffer
// ============================================
async function extractTextFromFile(buffer, fileName) {
  const ext = fileName.toLowerCase();

  if (ext.endsWith(".pdf")) {
    try {
      const uint8Array = new Uint8Array(buffer);
      const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
      const pdf = await loadingTask.promise;

      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => item.str).join(" ");
        fullText += pageText + "\n";
      }

      return fullText.trim();
    } catch (err) {
      console.error(`Failed to parse PDF ${fileName}:`, err.message);
      return `[PDF could not be parsed: ${fileName}]`;
    }
  }

  if (
    ext.endsWith(".txt") ||
    ext.endsWith(".md") ||
    ext.endsWith(".csv") ||
    ext.endsWith(".json") ||
    ext.endsWith(".xml") ||
    ext.endsWith(".html")
  ) {
    return buffer.toString("utf-8");
  }

  return `[Binary file — content not readable: ${fileName}]`;
}

// ============================================
// Helper — invoke a Bedrock agent and return parsed JSON
// ============================================
async function invokeAgent(agentId, agentAliasId, sessionId, inputText) {
  const command = new InvokeAgentCommand({
    agentId,
    agentAliasId,
    sessionId,
    inputText,
  });

  const response = await client.send(command);

  let fullReply = "";
  for await (const chunkEvent of response.completion) {
    if (chunkEvent.chunk) {
      fullReply += new TextDecoder().decode(chunkEvent.chunk.bytes);
    }
  }

  const jsonStart = fullReply.indexOf("{");
  const jsonEnd = fullReply.lastIndexOf("}");

  if (jsonStart === -1 || jsonEnd === -1) {
    // Return null to signal no JSON — caller handles the message
    return { parsed: null, rawMessage: fullReply.trim() };
  }

  try {
    return { parsed: JSON.parse(fullReply.slice(jsonStart, jsonEnd + 1)), rawMessage: null };
  } catch {
    return { parsed: null, rawMessage: fullReply.trim() };
  }
}

// ============================================
// Helper — fetch all records for a patient (S3 files + text entries)
// ============================================
async function fetchPatientRecords(patientUid) {
  const fileUploads = await db.getFileUploads(patientUid);
  const textUploads = await db.getTextUploads(patientUid);

  const fileRecords = await Promise.all(
    fileUploads.map(async (file) => {
      try {
        const buffer = await s3FileToBuffer(file.S3_Key);
        const content = await extractTextFromFile(buffer, file.File_Name);
        return {
          id: file.S3_Key,
          type: "file",
          fileName: file.File_Name,
          content,
          uploadedAt: file.Upload_Time,
        };
      } catch (err) {
        console.error(`Failed to read S3 file ${file.S3_Key}:`, err.message);
        return null;
      }
    })
  );

  const textRecords = textUploads.map((t) => ({
    id: String(t.Text_Upload_ID),
    type: "text",
    fileName: null,
    content: t.Text_Content,
    uploadedAt: t.Upload_Time,
  }));

  return [...fileRecords.filter(Boolean), ...textRecords];
}

// ============================================
// POST /api/ai/query
// Body: { query: string, patientIds: string[] }
// ============================================
router.post("/query", async (req, res) => {
  const providerUid = req.user.sub;
  const userRoles = req.user.roles || [];
  const { query, patientIds } = req.body;

  if (!userRoles.includes("Healthcare-Provider")) {
    return res.status(403).json({ error: "Only providers can use this endpoint" });
  }

  if (!query || !Array.isArray(patientIds) || patientIds.length === 0) {
    return res.status(400).json({ error: "query and patientIds array are required" });
  }

  try {
    const authorizedPatients = await db.getProviderPatients(providerUid);

    const authorizedUids = new Set(authorizedPatients.map((p) => p.sub));
    const allowedPatientIds = patientIds.filter((id) => authorizedUids.has(id));

    if (allowedPatientIds.length === 0) {
      return res.status(403).json({ error: "None of the requested patients are authorized" });
    }

    const patientMap = Object.fromEntries(
      authorizedPatients.map((p) => [p.sub, p])
    );

    const results = await Promise.all(
      allowedPatientIds.map(async (patientUid) => {
        const patient = patientMap[patientUid];

        let records;
        try {
          records = await fetchPatientRecords(patientUid);
        } catch (err) {
          console.error(`Failed to fetch records for ${patientUid}:`, err.message);
          return { patientUid, name: `${patient.firstName} ${patient.lastName}`, error: "Failed to fetch records" };
        }

        // ── Agent 1: Clinical Summary ──────────────────────────
        let summaryResult;
        try {
          const { parsed, rawMessage } = await invokeAgent(
            process.env.AWS_AGENT1_ID,
            process.env.AWS_AGENT1_ALIAS_ID,
            `summary-${patientUid}-${Date.now()}`,
            JSON.stringify({
              query,
              records: records.map((r) => ({ id: r.id, content: r.content })),
            })
          );

          if (!parsed || !validateSummaryResult(parsed)) {
            return {
              patientUid,
              name: `${patient.firstName} ${patient.lastName}`,
              error: rawMessage || "No relevant records found for this query.",
            };
          }

          summaryResult = parsed;
        } catch (err) {
          console.error(`Agent 1 failed for ${patientUid}:`, err.message);
          return { patientUid, name: `${patient.firstName} ${patient.lastName}`, error: err.message };
        }

        const { summary, citedRecordIDs = [] } = summaryResult;

        const validRecordIds = new Set(records.map((r) => r.id));
        const safeCitedRecordIDs = Array.isArray(citedRecordIDs)
          ? citedRecordIDs.filter((id) => typeof id === "string" && validRecordIds.has(id))
          : [];

        const citedRecords = records
          .filter((r) => safeCitedRecordIDs.includes(r.id))
          .map((r) => ({
            id: r.id,
            type: r.type,
            fileName: r.fileName,
            uploadedAt: r.uploadedAt,
          }));

        // ── Agent 2: Healthcare Suggestions ───────────────────
        let suggestionsResult;
        try {
          const { parsed } = await invokeAgent(
            process.env.AWS_AGENT2_ID,
            process.env.AWS_AGENT2_ALIAS_ID,
            `suggestions-${patientUid}-${Date.now()}`,
            JSON.stringify({
              summary,
              patientAge: patient.birthdate ?? null,
              knownConditions: [],
            })
          );
          suggestionsResult = parsed || { suggestions: [] };
        } catch (err) {
          console.error(`Agent 2 failed for ${patientUid}:`, err.message);
          suggestionsResult = { suggestions: [] };
        }

        return {
          patientUid,
          name: `${patient.firstName} ${patient.lastName}`,
          summary,
          citedRecords,
          suggestions: suggestionsResult.suggestions || [],
        };
      })
    );

    res.json({ ok: true, results });
  } catch (err) {
    console.error("Error in AI query:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;