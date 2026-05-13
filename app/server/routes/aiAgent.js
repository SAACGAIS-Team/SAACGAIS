import express from "express";
import logger from "../services/logger.js";
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from "@aws-sdk/client-bedrock-agent-runtime";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import * as db from "../services/supabaseService.js";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { createRequire } from "module";
import path from "path";
import { pathToFileURL } from "url";

// Suppress non-fatal font warnings — pdfjs-dist v5 attempts to load
// Liberation fonts via file:// URL which Node.js fetch does not support.
// Text extraction is unaffected since disableFontFace is set.
const originalWarn = console.warn.bind(console);
console.warn = (...args) => {
  if (typeof args[0] === "string" &&
      args[0].includes("UnknownErrorException") &&
      args[0].includes("Unable to load font data")) return;
  originalWarn(...args);
};

const _require = createRequire(import.meta.url);
const STANDARD_FONT_DATA_URL = pathToFileURL(
  path.join(path.dirname(_require.resolve("pdfjs-dist/package.json")), "standard_fonts", "/")
).href;

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
      const loadingTask = pdfjsLib.getDocument({
        data: uint8Array,
        standardFontDataUrl: STANDARD_FONT_DATA_URL,
        disableFontFace: true,
      });
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
      logger.error("Failed to parse PDF", { fileName, error: err.message });
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
  if (jsonStart === -1) {
    return { parsed: null, rawMessage: fullReply.trim() };
  }

  // Walk forward from the opening brace to find its matching closing brace,
  // ignoring any trailing content Agent 3 appends after the JSON object.
  let depth = 0;
  let jsonEnd = -1;
  for (let i = jsonStart; i < fullReply.length; i++) {
    if (fullReply[i] === "{") depth++;
    else if (fullReply[i] === "}") {
      depth--;
      if (depth === 0) { jsonEnd = i; break; }
    }
  }

  if (jsonEnd === -1) {
    return { parsed: null, rawMessage: fullReply.trim() };
  }

  try {
    const rawJson = fullReply.slice(jsonStart, jsonEnd + 1);
    return { parsed: JSON.parse(rawJson), rawMessage: null };
  } catch {
    try {
      const sanitized = sanitizeJsonString(fullReply.slice(jsonStart, jsonEnd + 1));
      return { parsed: JSON.parse(sanitized), rawMessage: null };
    } catch {
      return { parsed: null, rawMessage: fullReply.trim() };
    }
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
          id: String(file.File_Upload_ID),
          type: "file",
          fileName: file.File_Name,
          content,
          uploadedAt: file.Upload_Time,
        };
      } catch (err) {
        logger.error("Failed to read S3 file", { s3Key: file.S3_Key, error: err.message });
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
          logger.error("Failed to fetch records for patient", { patientUid, error: err.message });
          return { patientUid, name: `${patient.firstName} ${patient.lastName}`, error: "Failed to fetch records" };
        }

        // ── Agent 1: Clinical Summary ──────────────────────────
        // Possessive/browse phrases like "my asthma records" or "show me my files"
        // cause Agent 1 to narrate instead of returning structured JSON.
        // Normalize them into a clinical summarization request it can handle.
        const RECORD_REQUEST_RE = /^(?:(?:show|get|give|list|view|see|check|pull|display)\s+(?:me\s+)?(?:my\s+)?|my\s+)/i;

        let agent1Query = query;
        if (RECORD_REQUEST_RE.test(query.trim())) {
          // Strip the possessive/browse prefix, then strip trailing filler words
          const stripped = query.trim()
            .replace(RECORD_REQUEST_RE, "")
            .replace(/\s+(records?|files?|documents?|history|uploads?|data)$/i, "")
            .trim();

          agent1Query = stripped
            ? `Please summarize the patient's medical records related to ${stripped}.`
            : "Please provide a comprehensive clinical summary of the patient's uploaded medical records and documents.";
        }

        let summaryResult;
        try {
          const { parsed, rawMessage } = await invokeAgent(
            process.env.AWS_AGENT1_ID,
            process.env.AWS_AGENT1_ALIAS_ID,
            `summary-${patientUid}-${Date.now()}`,
            JSON.stringify({
              query: agent1Query,
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
          logger.error("Agent 1 failed", { patientUid, error: err.message });
          return { patientUid, name: `${patient.firstName} ${patient.lastName}`, error: "Clinical summary failed." };
        }

        const { summary, citedRecordIDs = [] } = summaryResult;

        const validRecordIds = new Set(records.map((r) => String(r.id)));
        const safeCitedRecordIDs = Array.isArray(citedRecordIDs)
          ? citedRecordIDs.map(String).filter((id) => validRecordIds.has(id))
          : [];

        const citedRecords = records
          .filter((r) => safeCitedRecordIDs.includes(String(r.id)))
          .map((r) => ({
            id: String(r.id),
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
          logger.error("Agent 2 failed", { patientUid, error: err.message });
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
    logger.error("Error in AI query", { error: err.message, providerUid });
    res.status(500).json({ error: "An unexpected error occurred." });
  }
});

// ============================================
// POST /api/ai/patient-self-query
// Body: { query: string }
// ============================================
router.post("/patient-self-query", async (req, res) => {
  const patientUid = req.user.sub;
  const userRoles = req.user.roles || [];
  const { query, conversationHistory = [] } = req.body;

  if (!userRoles.includes("Patient")) {
    return res.status(403).json({ error: "Only patients can use this endpoint" });
  }
  if (!query?.trim()) {
    return res.status(400).json({ error: "query is required" });
  }

  // ── Emergency pre-check ───────────────────────────────────────────────────
  const EMERGENCY_KEYWORDS = [
    "chest pain", "can't breathe", "cannot breathe", "heart attack",
    "stroke", "unconscious", "overdose", "suicidal", "kill myself",
    "severe bleeding", "seizure", "anaphylaxis", "allergic reaction",
  ];
  if (EMERGENCY_KEYWORDS.some((kw) => query.toLowerCase().includes(kw))) {
    return res.json({
      ok: true,
      result: {
        patientUid,
        emergency: true,
        emergencyMessage:
          "This sounds like it could be a medical emergency. Please call 911 immediately " +
          "or have someone take you to the nearest emergency room. Do not drive yourself. " +
          "I am an AI assistant and cannot provide emergency medical care.",
      },
    });
  }

  try {
    // ── Phase 1: Agent 3 — intent detection + general health response ─────────
    let phase1Response = null;
    let phase1RawMessage = null;
    try {
      const { parsed, rawMessage } = await invokeAgent(
        process.env.AWS_AGENT3_ID,
        process.env.AWS_AGENT3_ALIAS_ID,
        `patient-intent-${patientUid}-${Date.now()}`,
        JSON.stringify({
          patientMessage: query,
          sessionContext: { conversationHistory },
        })
      );
      phase1Response = parsed;
      phase1RawMessage = rawMessage;
    } catch (err) {
      logger.error("Agent 3 phase 1 failed", { patientUid, error: err.message });
    }

    if (!phase1Response && phase1RawMessage) {
      // invokeAgent failed to parse — attempt one more time on the raw message
      // in case the agent output valid JSON with surrounding whitespace or text.
      try {
        const start = phase1RawMessage.indexOf("{");
        const end = phase1RawMessage.lastIndexOf("}");
        if (start !== -1 && end !== -1) {
          const sanitized = sanitizeJsonString(phase1RawMessage.slice(start, end + 1));
          phase1Response = JSON.parse(sanitized);
        }
      } catch {
        // still not parseable — fall through to agentMessage
      }

      if (!phase1Response) {
        return res.json({
          ok: true,
          result: { patientUid, agentMessage: phase1RawMessage },
        });
      }
    }

    if (!phase1Response?.requiresRecordLookup) {
      return res.json({
        ok: true,
        result: { patientUid, patientResponse: phase1Response },
      });
    }

    // ── Phase 2: Record pipeline — Agents 1 and 2 ─────────────────────────────
    let records;
    try {
      records = await fetchPatientRecords(patientUid);
    } catch (err) {
      logger.error("Failed to fetch records for patient", { patientUid, error: err.message });
      return res.status(500).json({ error: "Failed to fetch your records." });
    }

    // ── Agent 1: Clinical Summary ──────────────────────────
    // Possessive/browse phrases like "my asthma records" or "show me my files"
    // cause Agent 1 to narrate instead of returning structured JSON.
    // Normalize them into a clinical summarization request it can handle.
    const RECORD_REQUEST_RE = /^(?:(?:show|get|give|list|view|see|check|pull|display)\s+(?:me\s+)?(?:my\s+)?|my\s+)/i;

    let agent1Query = query;
    if (RECORD_REQUEST_RE.test(query.trim())) {
      const stripped = query.trim()
        .replace(RECORD_REQUEST_RE, "")
        .replace(/\s+(records?|files?|documents?|history|uploads?|data)$/i, "")
        .trim();

      agent1Query = stripped
        ? `Please summarize the patient's medical records related to ${stripped}.`
        : "Please provide a comprehensive clinical summary of the patient's uploaded medical records and documents.";
    }

    let summaryResult;
    try {
      const { parsed, rawMessage } = await invokeAgent(
        process.env.AWS_AGENT1_ID,
        process.env.AWS_AGENT1_ALIAS_ID,
        `summary-${patientUid}-${Date.now()}`,
        JSON.stringify({
          query: agent1Query,
          records: records.map((r) => ({ id: r.id, content: r.content })),
        })
      );
      if (!parsed || !validateSummaryResult(parsed)) {
        return res.json({
          ok: true,
          result: {
            patientUid,
            error: rawMessage || "No relevant records found for this query.",
          },
        });
      }
      summaryResult = parsed;
    } catch (err) {
      logger.error("Agent 1 failed in patient self-query", { patientUid, error: err.message });
      return res.status(500).json({ error: "An unexpected error occurred." });
    }

    const { summary, citedRecordIDs = [] } = summaryResult;

    const validRecordIds = new Set(records.map((r) => String(r.id)));
    const safeCitedRecordIDs = Array.isArray(citedRecordIDs)
      ? citedRecordIDs.map(String).filter((id) => validRecordIds.has(id))
      : [];
    const citedRecords = records
      .filter((r) => safeCitedRecordIDs.includes(String(r.id)))
      .map((r) => ({
        id: String(r.id),
        type: r.type,
        fileName: r.fileName,
        uploadedAt: r.uploadedAt,
      }));

    let suggestionsResult;
    try {
      const { parsed } = await invokeAgent(
        process.env.AWS_AGENT2_ID,
        process.env.AWS_AGENT2_ALIAS_ID,
        `suggestions-${patientUid}-${Date.now()}`,
        JSON.stringify({ summary, patientAge: null, knownConditions: [] })
      );
      suggestionsResult = parsed || { suggestions: [] };
    } catch (err) {
      logger.error("Agent 2 failed in patient self-query", { patientUid, error: err.message });
      suggestionsResult = { suggestions: [] };
    }

    const hasGeneralContent =
      phase1Response?.response?.SymptomAssessment ||
      phase1Response?.response?.PossibleCauses ||
      phase1Response?.response?.SelfCareGuidance;

    res.json({
      ok: true,
      result: {
        patientUid,
        patientResponse: hasGeneralContent ? phase1Response : null,
        summary,
        citedRecords,
        suggestions: suggestionsResult.suggestions || [],
      },
    });
  } catch (err) {
    logger.error("Error in patient self-query", { patientUid, error: err.message });
    res.status(500).json({ error: "An unexpected error occurred." });
  }
});

export default router;