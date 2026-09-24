import { describe, expect, it } from "vitest";

import { ApiRequestError } from "./api";
import { analysisErrorMessage, analysisFieldErrors } from "./analysis-errors";

function apiError(code: string, details: unknown = null): ApiRequestError {
  return new ApiRequestError(400, { code, message: `server ${code}`, details });
}

describe("analysisErrorMessage", () => {
  it("maps no_requirements_detected to segmentation guidance", () => {
    expect(analysisErrorMessage(apiError("no_requirements_detected"))).toContain(
      "couldn't find any requirements",
    );
  });

  it("maps text_too_large to a split-and-retry hint", () => {
    expect(analysisErrorMessage(apiError("text_too_large"))).toContain(
      "Split it into smaller parts",
    );
  });

  it("maps document_analysis_unavailable honestly", () => {
    expect(analysisErrorMessage(apiError("document_analysis_unavailable"))).toBe(
      "Document analysis is not available yet.",
    );
  });

  it("maps session/permission codes", () => {
    expect(analysisErrorMessage(apiError("unauthenticated"))).toContain("log in again");
    expect(analysisErrorMessage(apiError("email_unverified"))).toContain("verify your email");
    expect(analysisErrorMessage(apiError("rate_limited"))).toContain("Too many analyses");
    expect(analysisErrorMessage(apiError("forbidden"))).toContain("don't have permission");
    expect(analysisErrorMessage(apiError("validation_error"))).toContain("check your input");
  });

  it("passes client-own codes through (safe by construction)", () => {
    const timeout = new ApiRequestError(0, {
      code: "request_timeout",
      message: "The request timed out. Please try again.",
    });
    expect(analysisErrorMessage(timeout)).toBe("The request timed out. Please try again.");
  });

  it("falls back generically for unknown codes and non-API errors", () => {
    expect(analysisErrorMessage(apiError("something_new"))).toBe(
      "Something went wrong. Please try again.",
    );
    expect(analysisErrorMessage(new Error("kaboom"))).toBe(
      "Something went wrong. Please try again.",
    );
    expect(analysisErrorMessage(null)).toBe("Something went wrong. Please try again.");
  });

  it("never surfaces server message strings", () => {
    const message = analysisErrorMessage(apiError("no_requirements_detected"));
    expect(message).not.toContain("server no_requirements_detected");
  });
});

describe("analysisFieldErrors", () => {
  it("maps title/text validation details to our copy", () => {
    const err = apiError("validation_error", [
      { loc: ["body", "text"], msg: "String too long" },
      { loc: ["body", "title"], msg: "String too long" },
    ]);
    expect(analysisFieldErrors(err)).toEqual({
      text: "Keep your SRS under 200,000 characters.",
      title: "Keep the title under 200 characters.",
    });
  });

  it("ignores unknown fields, shapes, and codes", () => {
    expect(analysisFieldErrors(apiError("validation_error", [{ loc: ["body", "nope"] }]))).toEqual(
      {},
    );
    expect(analysisFieldErrors(apiError("validation_error", "garbage"))).toEqual({});
    expect(analysisFieldErrors(apiError("no_requirements_detected"))).toEqual({});
    expect(analysisFieldErrors(new Error("x"))).toEqual({});
  });
});
