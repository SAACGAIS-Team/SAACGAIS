import express from "express";
import multer from "multer";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import * as db from "../services/supabaseService.js";

const router = express.Router();

const ALLOWED_EXTENSIONS = [".pdf", ".txt", ".md", ".csv", ".json", ".xml", ".html"];
const ALLOWED_MIMETYPES = [
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "text/xml",
  "application/xml",
  "text/html",
];

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const ext = "." + file.originalname.split(".").pop().toLowerCase();
    if (ALLOWED_EXTENSIONS.includes(ext) || ALLOWED_MIMETYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed. Allowed types: ${ALLOWED_EXTENSIONS.join(", ")}`));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const s3 = new S3Client({
  region: process.env.AWS_S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_BACKEND_KEY,
    secretAccessKey: process.env.AWS_BACKEND_SECRET,
  },
});

// POST /api/upload/file
router.post("/file", (req, res, next) => {
  upload.array("files")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req, res) => {
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

      await db.insertFileUpload(file.originalname, s3Key, patientId);
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
    await db.insertTextUpload(text.trim(), patientId);
    res.json({ ok: true, message: "Text saved successfully" });
  } catch (err) {
    console.error("Text upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/upload/file
router.get("/file", async (req, res) => {
  try {
    const data = await db.getFileUploads(req.user.sub);
    res.json({ ok: true, uploads: data });
  } catch (err) {
    console.error("Error fetching file uploads:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/upload/text
router.get("/text", async (req, res) => {
  try {
    const data = await db.getTextUploads(req.user.sub);
    res.json({ ok: true, uploads: data });
  } catch (err) {
    console.error("Error fetching text uploads:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/upload/text/:id
router.get("/text/:id", async (req, res) => {
  const requesterId = req.user.sub;
  const { id } = req.params;

  try {
    const record = await db.getTextUploadById(id, requesterId);

    if (record === null) {
      return res.status(404).json({ error: "Record not found" });
    }

    res.json({ ok: true, text: record.Text_Content, uploadedAt: record.Upload_Time });
  } catch (err) {
    console.error("Error fetching text upload by ID:", err);
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
  if (!key) return res.status(400).json({ error: "key is required" });

  const fileName = key.split("/").pop();

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