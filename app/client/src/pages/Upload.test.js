import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import Upload from "./Upload";
import { uploadService } from "../api.js";

// 1. Mock the API service
jest.mock("../api.js", () => ({
  uploadService: {
    getFileUploads: jest.fn(),
    getTextUploads: jest.fn(),
    uploadFiles: jest.fn(),
    uploadText: jest.fn(),
  },
}));

// 2. Mock your local AuthContext instead of the external library
jest.mock("../context/AuthContext.js", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id_token: "mock-token" },
  }),
}));

describe("Upload component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default successful empty state for history calls
    uploadService.getFileUploads.mockResolvedValue({ uploads: [] });
    uploadService.getTextUploads.mockResolvedValue({ uploads: [] });
  });

  test("renders correct headings", async () => {
    await act(async () => {
      render(<Upload />);
    });
    expect(screen.getByRole("heading", { name: /File Upload/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Text Upload/i })).toBeInTheDocument();
  });

  test("uploads files and displays success message", async () => {
    uploadService.uploadFiles.mockResolvedValueOnce({ ok: true });
    
    await act(async () => {
      render(<Upload />);
    });

    const file = new File(["dummy"], "test.txt", { type: "text/plain" });
    const fileInput = document.getElementById("file-upload");
    
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    const uploadButton = screen.getByRole("button", { name: /Upload Files/i });
    
    await act(async () => {
      fireEvent.click(uploadButton);
    });

    const successMessage = await screen.findByText(/1 file\(s\) uploaded successfully/i);
    expect(successMessage).toBeInTheDocument();
  });
});