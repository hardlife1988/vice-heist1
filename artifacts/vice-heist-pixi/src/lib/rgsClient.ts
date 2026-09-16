/**
 * Stake Engine RGS client.
 * Endpoints and money format follow math-sdk/docs/rgs_docs/RGS.md.
 */

export interface AuthenticateResponse {
  balance: { amount: number; currency: string };
  config: {
    minBet: number;
    maxBet: number;
    stepBet: number;
    defaultBetLevel?: number;
    betLevels: number[];
    jurisdiction?: Record<string, unknown>;
  };
  round?: {
    mode?: string;
    state?: "COMPLETE" | "IN_PROGRESS";
    payoutMultiplier?: number;
    book?: { id?: number; payoutMultiplier?: number; events?: Array<Record<string, unknown>> };
    events?: Array<Record<string, unknown>>;
  };
}

export interface PlayResponse {
  balance: { amount: number; currency: string };
  round: Record<string, unknown> & {
    mode?: string;
    state?: "COMPLETE" | "IN_PROGRESS";
    payoutMultiplier?: number;
    book?: { id?: number; payoutMultiplier?: number; events?: Array<Record<string, unknown>> };
    events?: Array<Record<string, unknown>>;
  };
}

export interface BalanceResponse {
  balance: { amount: number; currency: string };
}

function param(key: string): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get(key) || "";
}

function rgsOrigin(): string {
  const raw = param("rgs_url").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw.replace(/\/$/, "");
  return `https://${raw.replace(/\/$/, "")}`;
}

class RGSClient {
  get sessionID(): string {
    return param("sessionID") || param("sessionId") || "";
  }

  get hasSession(): boolean {
    return Boolean(this.sessionID && param("rgs_url"));
  }

  get language(): string {
    return param("lang") || param("language") || "en";
  }

  get currency(): string {
    return param("currency") || "USD";
  }

  get device(): string {
    return param("device") || "desktop";
  }

  private async request<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
    const origin = rgsOrigin();
    if (!origin) throw new Error("Missing rgs_url — launch from Stake Engine Developer → Start game session.");
    const response = await fetch(`${origin}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await response.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      throw new Error(`RGS ${endpoint} returned non-JSON (${response.status})`);
    }
    if (!response.ok) {
      const msg =
        (data as { status?: { statusMessage?: string }; message?: string; error?: string })?.status
          ?.statusMessage ||
        (data as { message?: string }).message ||
        (data as { error?: string }).error ||
        text.slice(0, 180);
      throw new Error(`RGS ${endpoint} ${response.status}: ${msg}`);
    }
    return data as T;
  }

  async authenticate(): Promise<AuthenticateResponse> {
    return this.request<AuthenticateResponse>("/wallet/authenticate", {
      sessionID: this.sessionID,
      language: this.language,
    });
  }

  async getBalance(): Promise<BalanceResponse> {
    return this.request<BalanceResponse>("/wallet/balance", {
      sessionID: this.sessionID,
    });
  }

  async play(amount: number, mode: "BASE" | "BONUS" = "BASE"): Promise<PlayResponse> {
    return this.request<PlayResponse>("/wallet/play", {
      sessionID: this.sessionID,
      amount,
      mode,
      currency: this.currency,
    });
  }

  async endRound(): Promise<BalanceResponse> {
    return this.request<BalanceResponse>("/wallet/end-round", {
      sessionID: this.sessionID,
    });
  }
}

export const rgsClient = new RGSClient();
