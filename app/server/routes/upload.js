import express from "express";
import multer from "multer";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import supabase from "../db.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const s3 = new S3Client({
  region: process.env.AWS_S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_BACKEND_KEY,
    secretAccessKey: process.env.AWS_BACKEND_SECRET,
  },
});

// POST /api/upload/file
router.post("/file", upload.array("files"), async (req, res) => {
  try {
    const patientId = req.user.sub;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "At least one file is required" });
    }

    const uploaded = [];

    for (const file of files) {
      const s3Key = `uploads/${uuidv4()}-${file.originalname}`;

      await s3.send(new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: s3Key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }));

      const { error } = await supabase.rpc("Insert_File_Upload", {
        p_file_name: file.originalname,
        p_s3_key: s3Key,
        p_patient_uid: patientId,
      });

      if (error) {
        console.error("Supabase error:", error);
        throw new Error(error.message);
      }

      uploaded.push({ fileName: file.originalname, s3Key });
    }

    res.json({ ok: true, uploaded });
  } catch (err) {
    console.error("File upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/upload/text
router.post("/text", async (req, res) => {
  const patientId = req.user.sub;
  const { text } = req.body;

  if (!text || text.trim() === "") {
    return res.status(400).json({ error: "Text content is required" });
  }

  try {
    const { error } = await supabase.rpc("Insert_Text_Upload", {
      p_text_content: text.trim(),
      p_patient_uid: patientId,
    });

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ ok: true, message: "Text saved successfully" });
  } catch (err) {
    console.error("Text upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/upload/file - get patient's file upload history
router.get("/file", async (req, res) => {
  const patientId = req.user.sub;

  try {
    const { data, error } = await supabase.rpc("Get_File_Uploads", {
      p_patient_uid: patientId,
    });

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ ok: true, uploads: data });
  } catch (err) {
    console.error("Error fetching file uploads:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/upload/text - get patient's text upload history
router.get("/text", async (req, res) => {
  const patientId = req.user.sub;

  try {
    const { data, error } = await supabase.rpc("Get_Text_Uploads", {
      p_patient_uid: patientId,
    });

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ ok: true, uploads: data });
  } catch (err) {
    console.error("Error fetching text uploads:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/upload/signed-url
router.get("/signed-url", async (req, res) => {
  const { key } = req.query;

  if (!key) return res.status(400).json({ error: "key is required" });

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 300 });
    res.json({ ok: true, url });
  } catch (err) {
    console.error("Error generating signed URL:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/upload/download
router.get("/download", async (req, res) => {
  const { key } = req.query;
  const fileName = key.split("/").pop();

  if (!key) return res.status(400).json({ error: "key is required" });

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
    });

    const s3Response = await s3.send(command);

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Type", s3Response.ContentType || "application/octet-stream");

    s3Response.Body.pipe(res);
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;