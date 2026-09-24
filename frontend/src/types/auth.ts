/**
 * Auth domain types — mirrored from docs/API_CONTRACT.md §4.2
 * (backend: `app/schemas/auth.py`). Same names, same optionality.
 * Sessions ride httpOnly cookies; these shapes carry identity only, never tokens.
 */

/** GET /auth/me — safe identity subset (never hashes/tokens/keys). */
export interface User {
  id: string;
  email: string;
  display_name: string | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
}

/**
 * POST register/login/verify-email/refresh — session proof, cookies do the work.
 * (Register returns this shape but sets NO cookies — it never logs in. §4.2.)
 */
export interface AuthSession {
  id: string;
  email: string;
  is_verified: boolean;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  turnstile_token?: string;
}

export interface LoginInput {
  email: string;
  password: string;
  turnstile_token?: string;
}

export interface VerifyEmailInput {
  token: string;
}

export interface ResendVerificationInput {
  email: string;
  turnstile_token?: string;
}

export interface ForgotPasswordInput {
  email: string;
  turnstile_token?: string;
}

export interface ResetPasswordInput {
  token: string;
  new_password: string;
  turnstile_token?: string;
}

export interface ChangePasswordInput {
  current_password: string;
  new_password: string;
}

/** Empty-object success bodies (`202 {}` / `200 {}`) — key presence is meaningless. */
export type EmptyResponse = Record<string, never>;

/** AuthProvider resolution state — the single source of auth truth. */
export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthState {
  status: AuthStatus;
  /** Non-null if and only if `status === "authenticated"`. */
  user: User | null;
}
