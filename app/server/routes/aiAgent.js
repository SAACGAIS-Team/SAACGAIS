import express from "express";
import dotenv from "dotenv";
import multer from "multer";
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from "@aws-sdk/client-bedrock-agent-runtime";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import supabase from "../db.js";
import authzContext from "../middleware/authzContext.js";
import authorize from "../middleware/authorize.js";


dotenv.config();
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

// ============================================
// Helper — stream S3 object to string
// ============================================
async function s3ObjectToString(s3Key) {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: s3Key,
  });
  const response = await s3.send(command);
  const chunks = [];
  for await (const chunk of response.Body) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf-8");
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

  try {
    return JSON.parse(fullReply.trim());
  } catch {
    throw new Error(`Agent response was not valid JSON: ${fullReply}`);
  }
}

// ============================================
// Helper — fetch all records for a patient (S3 files + text entries)
// ============================================
async function fetchPatientRecords(patientUid) {
  // Fetch file uploads metadata from Supabase
  const { data: fileUploads, error: fileError } = await supabase.rpc("Get_File_Uploads", {
    p_patient_uid: patientUid,
  });
  if (fileError) throw new Error(`Failed to fetch file uploads: ${fileError.message}`);

  // Fetch text uploads from Supabase
  const { data: textUploads, error: textError } = await supabase.rpc("Get_Text_Uploads", {
    p_patient_uid: patientUid,
  });
  if (textError) throw new Error(`Failed to fetch text uploads: ${textError.message}`);

  // Read each file from S3
  const fileRecords = await Promise.all(
    (fileUploads || []).map(async (file) => {
      try {
        const content = await s3ObjectToString(file.s3_key);
        return {
          id: file.s3_key,
          type: "file",
          fileName: file.file_name,
          content,
          uploadedAt: file.uploaded_at,
        };
      } catch (err) {
        console.error(`Failed to read S3 file ${file.s3_key}:`, err.message);
        return null;
      }
    })
  );

  // Map text uploads to same shape
  const textRecords = (textUploads || []).map((t) => ({
    id: t.id || t.created_at,
    type: "text",
    fileName: null,
    content: t.text_content,
    uploadedAt: t.created_at,
  }));

  // Filter out any S3 files that failed to load
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
    // Fetch provider's authorized patients from Supabase
    const { data: authorizedPatients, error: authError } = await supabase.rpc("get_provider_patients", {
      provider_uid: providerUid,
    });

    if (authError) throw new Error(authError.message);

    // Build a set of authorized patient UIDs
    const authorizedUids = new Set(authorizedPatients.map((p) => p.patient_uid));

    // Silently drop any requested patients not in the authorized set
    const allowedPatientIds = patientIds.filter((id) => authorizedUids.has(id));

    if (allowedPatientIds.length === 0) {
      return res.status(403).json({ error: "None of the requested patients are authorized" });
    }

    // Build patient metadata map
    const patientMap = Object.fromEntries(
      authorizedPatients.map((p) => [p.patient_uid, p])
    );

    // Run both agents for each authorized patient in parallel
    const results = await Promise.all(
      allowedPatientIds.map(async (patientUid) => {
        const patient = patientMap[patientUid];

        // Fetch records from S3 + Supabase
        let records;
        try {
          records = await fetchPatientRecords(patientUid);
        } catch (err) {
          console.error(`Failed to fetch records for ${patientUid}:`, err.message);
          return { patientUid, name: `${patient.given_name} ${patient.family_name}`, error: "Failed to fetch records" };
        }

        // ── Agent 1: Clinical Summary ──────────────────────────
        let summaryResult;
        try {
          summaryResult = await invokeAgent(
            process.env.AWS_AGENT1_ID,
            process.env.AWS_AGENT1_ALIAS_ID,
            `summary-${patientUid}-${Date.now()}`,
            JSON.stringify({
              query,
              records: records.map((r) => ({ id: r.id, content: r.content })),
            })
          );
        } catch (err) {
          console.error(`Agent 1 failed for ${patientUid}:`, err.message);
          return { patientUid, name: `${patient.given_name} ${patient.family_name}`, error: "Failed to generate summary" };
        }

        const { summary, citedRecordIDs = [] } = summaryResult;

        // Resolve cited records to their full metadata for the frontend
        const citedRecords = records
          .filter((r) => citedRecordIDs.includes(r.id))
          .map((r) => ({
            id: r.id,
            type: r.type,
            fileName: r.fileName,
            uploadedAt: r.uploadedAt,
          }));

        // ── Agent 2: Healthcare Suggestions ───────────────────
        let suggestionsResult;
        try {
          suggestionsResult = await invokeAgent(
            process.env.AWS_AGENT2_ID,
            process.env.AWS_AGENT2_ALIAS_ID,
            `suggestions-${patientUid}-${Date.now()}`,
            JSON.stringify({
              summary,
              patientAge: patient.age ?? null,
              knownConditions: patient.known_conditions ?? [],
            })
          );
        } catch (err) {
          console.error(`Agent 2 failed for ${patientUid}:`, err.message);
          suggestionsResult = { suggestions: [] };
        }

        return {
          patientUid,
          name: `${patient.given_name} ${patient.family_name}`,
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