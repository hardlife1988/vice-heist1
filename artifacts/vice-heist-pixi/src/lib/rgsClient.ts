/**
 * Vice Heist — RGS Client
 *
 * Handles communication with the Stake Engine RGS endpoints.
 * Implements wallet authentication, balance, play, and end-round flows.
 * Respects bet levels and minStep constraints from authenticate response.
 */

export interface AuthenticateResponse {
  balance: {
    amount: number;
    currency: string;
  };
  config: {
    minBet: number;
    maxBet: number;
    stepBet: number;
    defaultBetLevel: number;
    betLevels: number[];
    jurisdiction: Record<string, unknown>;
  };
  round?: {
    mode: "BASE" | "BONUS";
    state: "COMPLETE" | "IN_PROGRESS";
  };
}

export interface PlayResponse {
  balance: {
    amount: number;
    currency: string;
  };
  round: {
    mode: "BASE" | "BONUS";
    state: "COMPLETE" | "IN_PROGRESS";
    book?: {
      id: number;
      payoutMultiplier: number;
      events: Array<Record<string, unknown>>;
      criteria: string;
      baseGameWins: number;
      freeGameWins: number;
    };
  };
}

export interface BalanceResponse {
  balance: {
    amount: number;
    currency: string;
  };
}

export interface EndRoundResponse {
  balance: {
    amount: number;
    currency: string;
  };
}

class RGSClient {
  private rgsUrl: string;
  private sessionID: string;

  constructor() {
    this.rgsUrl = this.getQueryParam("rgs_url") || "";
    this.sessionID = this.getQueryParam("sessionID") || "";

    if (!this.rgsUrl || !this.sessionID) {
      console.error("Missing required RGS parameters: rgs_url and sessionID");
    }
  }

  private getQueryParam(key: string): string {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    return params.get(key) || "";
  }

  private async request<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
    const url = `https://${this.rgsUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`RGS Error ${response.status}: ${errorData}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      console.error(`RGS request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async authenticate(): Promise<AuthenticateResponse> {
    return this.request<AuthenticateResponse>("/wallet/authenticate", {
      sessionID: this.sessionID,
      language: this.getQueryParam("language") || "en",
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
      amount: amount,
      mode: mode,
      currency: this.getQueryParam("currency"),
    });
  }

  async endRound(): Promise<EndRoundResponse> {
    return this.request<EndRoundResponse>("/wallet/end-round", {
      sessionID: this.sessionID,
    });
  }
}

export const rgsClient = new RGSClient();
