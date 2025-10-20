// uploadHandler.ts
export type SortKey = 1 | 2 | 3;              // 1 username, 2 score, 3 date
export type SortType = SortKey | -1 | -2 | -3;

export type ScoreRow = {
  rank: number;
  username: string;
  score: number;
  date: string; // ISO string
};

const url: string = "https://breakout.george.richmnd.uk/api";

const getScoresPath = "https://breakout.george.richmnd.uk/api/scores" as const;
const saveScorePath = "https://breakout.george.richmnd.uk/api/saveScore" as const;
const getEntriesPath = "https://breakout.george.richmnd.uk/api/entries" as const;
const getScoresFromUsernamePath = "https://breakout.george.richmnd.uk/api/scoresFromUsername" as const;
const getHashedPasswordPath = "http://localhost:3000/hashedPassword" as const; // not used here, kept for completeness
const signupPath = "http://localhost:3000/signup" as const;                     // not used here, kept for completeness
const getScoreFromUsernamePath = "https://breakout.george.richmnd.uk/api/scoreFromUsername" as const;

async function fetchJSON<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export class UploadHandler {
  static async uploadScore(score: number, name: string): Promise<void> {
    try {
      await fetch(saveScorePath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: name, score }),
      });
    } catch (err) {
      console.error((err as Error).message);
    }
  }

  /** Get a page of scores. Returns [] on error. */
  static async getScores(
    sortType: SortType,
    start: number,
    end: number
  ): Promise<ScoreRow[]> {
    try {
      const url = `${getScoresPath}?start=${start}&end=${end}&sortType=${Number(
        sortType
      )}`;
      return await fetchJSON<ScoreRow[]>(url);
    } catch (err) {
      console.error((err as Error).message);
      return [];
    }
  }

  /**
   * Get the page index for a username (0-based). Returns null if not found/error.
   * Your backend should return a number (page index) or something falsy when missing.
   */
  static async getScoresFromUsername(
    username: string,
    itemsPerPage: number
  ): Promise<number | null> {
    try {
      const url = `${getScoresFromUsernamePath}?itemsPerPage=${itemsPerPage}&username=${encodeURIComponent(
        username
      )}`;
      // Assuming API returns: { page: number } OR a plain number. Adjust if needed.
      const data = await fetchJSON<number | { page: number }>(url);
      if (typeof data === "number") return data >= 0 ? data : null;
      if (typeof data === "object" && data && typeof data.page === "number") {
        return data.page >= 0 ? data.page : null;
      }
      return null;
    } catch (err) {
      console.error((err as Error).message);
      return null;
    }
  }

  /** Get total number of entries. Returns 0 on error. */
  static async getNEntries(): Promise<number> {
    try {
      const data = await fetchJSON<number>(getEntriesPath);
      return typeof data === "number" ? data : 0;
    } catch (err) {
      console.error((err as Error).message);
      return 0;
    }
  }

  /** Get a single user’s score (or 0 on error/not found). */
  static async getScoreFromUsername(username: string): Promise<number> {
    try {
      const url = `${getScoreFromUsernamePath}?username=${encodeURIComponent(
        username
      )}`;
      const data = await fetchJSON<number>(url);
      return typeof data === "number" ? data : 0;
    } catch (err) {
      console.error((err as Error).message);
      return 0;
    }
  }
}
