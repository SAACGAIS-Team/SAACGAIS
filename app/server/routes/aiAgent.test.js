import express from "express";
import request from "supertest";
import multer from "multer";
import uploadRoute from "./aiAgent.js";

jest.mock("@aws-sdk/client-bedrock-agent-runtime", () => {
  return {
    BedrockAgentRuntimeClient: jest.fn(() => ({
      send: jest.fn(async (command) => {
        if (command.inputText.includes("fail")) {
          throw new Error("Mock API failure");
        }
        return {
          completion: [
            { chunk: { bytes: new TextEncoder().encode("Hello") } },
            { chunk: { bytes: new TextEncoder().encode(" from AI") } },
          ],
        };
      }),
    })),
    InvokeAgentCommand: jest.fn((params) => params),
  };
});

describe("File Upload AI route", () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use("/api/ai", uploadRoute);
  });

  test("POST /api/ai/upload with message returns AI reply", async () => {
    const res = await request(app)
      .post("/api/ai/upload")
      .send({ userMessage: "Hello AI" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ reply: "Hello from AI" });
  });

  test("POST /api/ai/upload with file returns AI reply", async () => {
    const res = await request(app)
      .post("/api/ai/upload")
      .attach("file", Buffer.from("This is file content"), "test.txt");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ reply: "Hello from AI" });
  });

  test("POST /api/ai/upload with both file and message returns combined reply", async () => {
    const res = await request(app)
      .post("/api/ai/upload")
      .field("userMessage", "Hello AI")
      .attach("file", Buffer.from("File content here"), "test.txt");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ reply: "Hello from AI" });
  });

  test("POST /api/ai/upload without file or message returns 400", async () => {
    const res = await request(app).post("/api/ai/upload").send({});
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "At least a file or a message must be provided" });
  });

  test("POST /api/ai/upload handles API failure", async () => {
    const res = await request(app)
      .post("/api/ai/upload")
      .send({ userMessage: "fail" });

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("error", "Mock API failure");
  });
});