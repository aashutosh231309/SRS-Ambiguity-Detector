// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ResendForm } from "./ResendForm";

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function envelope(code: string, status: number): Response {
  return jsonResponse({ error: { code, message: `server ${code}` } }, status);
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("ResendForm", () => {
  it("blocks invalid email with no request", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async () => jsonResponse({}));
    vi.stubGlobal("fetch", fetchMock);
    render(<ResendForm />);
    await user.click(screen.getByRole("button", { name: "Resend verification email" }));
    expect(screen.getByText("Enter your email address.")).not.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("prefills the default email", () => {
    render(<ResendForm defaultEmail="ada@example.com" />);
    expect((screen.getByLabelText("Email") as HTMLInputElement).value).toBe("ada@example.com");
  });

  it("succeeds with non-committal copy and starts the cooldown", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async () => jsonResponse({}));
    vi.stubGlobal("fetch", fetchMock);
    render(<ResendForm />);
    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.click(screen.getByRole("button", { name: "Resend verification email" }));
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toBe(
        "If this address can receive mail, a verification link is on its way.",
      ),
    );
    const resend = screen.getByRole("button", { name: "Resend in 30s" });
    expect(resend.getAttribute("disabled")).not.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    // Second submit during cooldown is blocked.
    await user.click(resend);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("re-enables after the 30s cooldown", async () => {
    // fireEvent (sync) under fake timers — user-event's internal waits hang here.
    vi.useFakeTimers();
    try {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => jsonResponse({})),
      );
      render(<ResendForm />);
      fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ada@example.com" } });
      fireEvent.click(screen.getByRole("button", { name: "Resend verification email" }));
      await act(async () => {});
      expect(
        screen.getByRole("button", { name: "Resend in 30s" }).getAttribute("disabled"),
      ).not.toBeNull();
      act(() => {
        vi.advanceTimersByTime(30_000);
      });
      expect(
        screen.getByRole("button", { name: "Resend verification email" }).getAttribute("disabled"),
      ).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("maps rate_limited honestly", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => envelope("rate_limited", 429)),
    );
    render(<ResendForm />);
    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.click(screen.getByRole("button", { name: "Resend verification email" }));
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toBe(
        "Too many attempts. Please try again later.",
      ),
    );
  });
});
