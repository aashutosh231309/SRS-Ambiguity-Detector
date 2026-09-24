/**
 * Document domain types — mirrored from docs/API_CONTRACT.md §4.4
 * (Stage 08: upload+analyze; metadata only — the binary and the storage
 * key are never exposed to clients). Backend: `app/schemas/documents.py`.
 * Same names, same optionality.
 */

import type { AnalysisResult } from "./analysis";

/** Verified file type (server-proved: extension + MIME + magic bytes). */
export type DocumentFileType = "pdf" | "docx" | "txt";

/** Extraction outcome. `pending`/`failed` are future async states. */
export type DocumentExtractionStatus = "pending" | "ok" | "failed";

/** One owned upload's metadata (GET result + upload-response half). */
export interface DocumentMetadata {
  id: string;
  filename: string;
  file_type: DocumentFileType;
  mime_type: string;
  byte_size: number;
  sha256: string;
  extracted_chars: number;
  extraction_status: DocumentExtractionStatus;
  created_at: string;
}

/** POST /documents/upload result: the stored file + its full analysis. */
export interface DocumentUploadResponse {
  document: DocumentMetadata;
  analysis: AnalysisResult;
}
