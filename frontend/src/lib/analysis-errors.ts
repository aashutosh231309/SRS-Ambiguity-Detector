/**
 * Analysis error-code → user-facing copy (docs/API_CONTRACT.md §2: the frontend
 * switches on `code`, NEVER on `message`). Server strings are never displayed.
 * Field-detail traversal is shared with `lib/auth-errors.ts` (no duplication).
 */

import { ApiRequestError } from "./api";
import { validationFieldErrors } from "./auth-errors";

const GENERIC_FALLBACK = "Something went wrong. Please try again.";

export function analysisErrorMessage(err: unknown): string {
  if (!(err instanceof ApiRequestError)) return GENERIC_FALLBACK;
  switch (err.code) {
    case "no_requirements_detected":
      return "We couldn't find any requirements in that text. Numbered, bulleted, or ID-tagged statements (with words like “shall” or “must”) segment best.";
    case "text_too_large":
      return "That input produced more requirements than a single analysis can hold. Split it into smaller parts and analyze each one.";
    case "document_analysis_unavailable":
      return "Document analysis is not available yet.";
    case "analysis_not_found":
      return "That analysis doesn't exist or belongs to a different account.";
    case "validation_error":
      return "Please check your input and try again.";
    case "email_unverified":
      return "Please verify your email to continue.";
    case "unauthenticated":
      return "Your session has expired. Please log in again.";
    case "rate_limited":
      return "Too many analyses. Please wait a moment and try again.";
    case "forbidden":
      return "You don't have permission to do that.";
    case "network_unreachable":
    case "request_timeout":
    case "bad_response":
      // Our own client's codes — messages are safe by construction (lib/api.ts).
      return err.message;
    default:
      return GENERIC_FALLBACK;
  }
}

/** Backend field names the analyzer maps `validation_error` details onto. */
const ANALYSIS_FIELDS = {
  known: new Set(["title", "text"]),
  copy: {
    title: "Keep the title under 200 characters.",
    text: "Keep your SRS under 200,000 characters.",
  } as Record<string, string>,
};

/**
 * Extract per-field errors from an analysis `validation_error` envelope.
 * Unknown shapes → {} (same contract as the auth variant).
 */
export function analysisFieldErrors(err: unknown): Partial<Record<string, string>> {
  return validationFieldErrors(err, ANALYSIS_FIELDS);
}
