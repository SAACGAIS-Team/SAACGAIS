import express from "express";
import dotenv from "dotenv";
import multer from "multer";
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from "@aws-sdk/client-bedrock-agent-runtime";
import authenticate from "../middleware/authenticate.js";
import authzContext from "../middleware/authzContext.js";
import authorize from "../middleware/authorize.js";

dotenv.config();
const router = express.Router();

const client = new BedrockAgentRuntimeClient({
  region: process.env.AWS_REGION || "us-east-2",
  customUserAgent: `bedrock-api-key/${process.env.BEDROCK_API_KEY}`,
});

const upload = multer({ storage: multer.memoryStorage() });

// Builds the OPA target from the request.
// Clinicians pass patientSub in the body; Patients are checked against their own sub.
function getAgentTarget(req) {
  return {
    patient_sub: req.body?.patientSub ?? null,
    owner_sub: req.user?.sub ?? null,
    session_id: req.body?.sessionId ?? null,
  };
}

router.post(
  "/upload",
  upload.single("file"),
  authenticate,
  authzContext("invoke", "ai_agent", getAgentTarget),
  authorize(),
  async (req, res) => {
    try {
      const fileContents = req.file?.buffer.toString("utf-8");
      const userMessage = req.body?.userMessage;

      if (!fileContents && (!userMessage || userMessage.trim() === "")) {
        return res.status(400).json({ error: "At least a file or a message must be provided" });
      }

      let combinedInput = "";
      if (userMessage && userMessage.trim() !== "") combinedInput += userMessage.trim();
      if (fileContents) combinedInput += `\n\nFile content:\n${fileContents}`;

      const command = new InvokeAgentCommand({
        agentId: process.env.AWS_AGENT_ID,
        agentAliasId: process.env.AWS_AGENT_ALIAS_ID,
        sessionId: `session-${Date.now()}`,
        inputText: combinedInput,
      });

      const response = await client.send(command);

      let fullReply = "";
      for await (const chunkEvent of response.completion) {
        if (chunkEvent.chunk) {
          fullReply += new TextDecoder().decode(chunkEvent.chunk.bytes);
        }
      }

      res.json({ reply: fullReply.trim() });
    } catch (err) {
      console.error("Error processing uploaded file or message:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

export default router;
