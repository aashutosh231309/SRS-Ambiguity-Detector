// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AuthProvider } from "./AuthProvider";
import { VerifyEmailForm } from "./VerifyEmailForm";

const nav = vi.hoisted(() => ({ search: "", replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: nav.replace,
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(nav.search),
}));
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const TOKEN = "v".repeat(43);
const USER = {
  id: "user-1",
  email: "ada@example.com",
  display_name: "Ada",
  is_verified: true,
  is_active: true,
  created_at: "2026-09-24T00:00:00Z",
};

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function envelope(code: string, status: number): Response {
  return jsonResponse({ error: { code, message: `server ${code}` } }, status);
}

function stubFetch(handler: (url: string) => Response | Promise<Response>) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => handler(String(input)));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  nav.search = "";
  nav.replace.mockClear();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("VerifyEmailForm", () => {
  it("shows the invalid-link panel without a token and sends no request", async () => {
    const fetchMock = stubFetch((url) =>
      url.includes("/auth/me") ? envelope("unauthenticated", 401) : envelope("invalid_token", 400),
    );
    render(
      <AuthProvider>
        <VerifyEmailForm />
      </AuthProvider>,
    );
    expect(screen.getByRole("heading", { name: "Invalid verification link" })).not.toBeNull();
    expect(screen.getByRole("form", { name: "Resend verification email" })).not.toBeNull();
    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/auth/me"))).toBe(true),
    );
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/auth/verify-email"))).toBe(
      false,
    );
  });

  it("rejects a malformed token without requesting", () => {
    nav.search = "token=short";
    const fetchMock = stubFetch((url) =>
      url.includes("/auth/me") ? envelope("unauthenticated", 401) : envelope("invalid_token", 400),
    );
    render(
      <AuthProvider>
        <VerifyEmailForm />
      </AuthProvider>,
    );
    expect(screen.getByRole("heading", { name: "Invalid verification link" })).not.toBeNull();
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/auth/verify-email"))).toBe(
      false,
    );
  });

  it("auto-verifies once, refreshes identity, and continues to the landing path", async () => {
    nav.search = `token=${TOKEN}`;
    const user = userEvent.setup();
    const fetchMock = stubFetch((url) => {
      if (url.includes("/auth/verify-email")) {
        return jsonResponse({ id: "user-1", email: USER.email, is_verified: true });
      }
      if (url.includes("/auth/me")) return jsonResponse(USER);
      return envelope("invalid_token", 400);
    });
    render(
      <AuthProvider>
        <VerifyEmailForm />
      </AuthProvider>,
    );
    expect(screen.getByText("Verifying your email…")).not.toBeNull();
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Email verified" })).not.toBeNull(),
    );
    expect(
      fetchMock.mock.calls.filter(([url]) => String(url).includes("/auth/verify-email")),
    ).toHaveLength(1);
    expect(document.body.textContent?.includes(TOKEN)).toBe(false);
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(nav.replace).toHaveBeenCalledWith("/dashboard");
  });

  it("offers resend recovery on an expired link (token never shown)", async () => {
    nav.search = `token=${TOKEN}`;
    const user = userEvent.setup();
    stubFetch((url) => {
      if (url.includes("/auth/verify-email")) return envelope("invalid_token", 400);
      if (url.includes("/auth/resend-verification")) return jsonResponse({});
      if (url.includes("/auth/me")) return envelope("unauthenticated", 401);
      return envelope("invalid_token", 400);
    });
    render(
      <AuthProvider>
        <VerifyEmailForm />
      </AuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Verification failed" })).not.toBeNull(),
    );
    expect(screen.getByRole("alert").textContent).toBe(
      "This verification link is invalid or has expired.",
    );
    expect(document.body.textContent?.includes(TOKEN)).toBe(false);
    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.click(screen.getByRole("button", { name: "Resend verification email" }));
    await waitFor(() => expect(screen.getByRole("status")).not.toBeNull());
  });
});
