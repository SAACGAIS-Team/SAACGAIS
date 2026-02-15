import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import Upload from "./Upload";

// Mock the api module
jest.mock("../api.js", () => ({
  aiService: {
    uploadFile: jest.fn(),
  },
}));

import { aiService } from "../api.js";

describe("Upload component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders heading and description", () => {
    render(<Upload />);
    expect(
      screen.getByText(/Upload Documents & Send Message/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Message to AI/i)).toBeInTheDocument();
  });

  test("displays AI reply after sending a message", async () => {
    const mockReply = { reply: "Hello from AI!" };
    aiService.uploadFile.mockResolvedValueOnce(mockReply);

    render(<Upload />);

    // Enter a message
    const input = screen.getByLabelText(/Message to AI/i);
    fireEvent.change(input, { target: { value: "Hi AI" } });

    // Click the Send button
    const sendButton = screen.getByRole("button", { name: /Send to AI/i });
    fireEvent.click(sendButton);

    // Loading indicator should appear
    expect(screen.getByRole("progressbar")).toBeInTheDocument();

    // Wait for AI reply
    await waitFor(() =>
      expect(
        screen.getByText((content) => content.includes("Hello from AI!"))
      ).toBeInTheDocument()
    );

    // Loading indicator should disappear
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  test("displays error if API fails", async () => {
    const error = new Error("Something went wrong");
    error.response = { data: { error: "Something went wrong" } };
    aiService.uploadFile.mockRejectedValueOnce(error);

    render(<Upload />);

    const input = screen.getByLabelText(/Message to AI/i);
    fireEvent.change(input, { target: { value: "Hi AI" } });

    const sendButton = screen.getByRole("button", { name: /Send to AI/i });
    fireEvent.click(sendButton);

    await waitFor(() =>
      expect(
        screen.getByText((content) =>
          content.includes("Error: Something went wrong")
        )
      ).toBeInTheDocument()
    );
  });

  test("displays network error if fetch fails", async () => {
    aiService.uploadFile.mockRejectedValueOnce(new Error("Network failure"));

    render(<Upload />);

    const input = screen.getByLabelText(/Message to AI/i);
    fireEvent.change(input, { target: { value: "Hi AI" } });

    const sendButton = screen.getByRole("button", { name: /Send to AI/i });
    fireEvent.click(sendButton);

    await waitFor(() =>
      expect(
        screen.getByText((content) =>
          content.includes("Error: Network failure")
        )
      ).toBeInTheDocument()
    );
  });

  test("can select a file and display its name", () => {
    render(<Upload />);

    const file = new File(["dummy content"], "example.txt", {
      type: "text/plain",
    });

    const fileInput = document.getElementById("file-upload");
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(screen.getByText(/Selected file: example.txt/i)).toBeInTheDocument();
  });

  test("send button disabled when no message or file", () => {
    render(<Upload />);
    const sendButton = screen.getByRole("button", { name: /Send to AI/i });
    expect(sendButton).toBeDisabled();
  });
});