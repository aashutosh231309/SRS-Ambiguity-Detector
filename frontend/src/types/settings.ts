/**
 * Settings domain types — mirrored from docs/API_CONTRACT.md §4.7
 * (backend: `app/schemas/settings.py`). Same names, same optionality.
 * Identity only, never secrets: the profile shape carries no hashes/tokens.
 */

/** GET/PATCH /settings/profile — the caller's own profile. */
export interface Profile {
  email: string;
  display_name: string | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
}

/** PATCH /settings/profile — `display_name` is the only settable field. */
export interface UpdateProfileInput {
  display_name: string | null;
}
