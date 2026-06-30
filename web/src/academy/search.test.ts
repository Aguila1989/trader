import { describe, it, expect } from "vitest";
import { searchLessons, highlightParts, MIN_QUERY } from "./search";
import type { Chapter } from "./types";

const chapters: Chapter[] = [
  {
    id: "c1",
    number: 1,
    level: "BASIC",
    title: "Getting Started",
    description: "A gentle intro to the platform.",
    lessons: [
      {
        id: "c1-l1",
        title: "What is a wallet?",
        paragraphs: ["A wallet holds your assets.", "It signs transactions."],
        example: "Your XLM lives in a wallet.",
      },
      {
        id: "c1-l2",
        title: "Placing your first trade",
        paragraphs: ["A trade swaps one asset for another."],
        example: "Buy XLM with USDC.",
      },
    ],
    quiz: [
      { id: "c1-q1", prompt: "What does a wallet do?", options: [{ text: "x", explanation: "y" }], correctIndex: 0 },
    ],
  },
  {
    id: "c5",
    number: 5,
    level: "ADVANCED",
    title: "Stop Losses",
    description: "Capping the downside.",
    lessons: [
      {
        id: "c5-l1",
        title: "What is a stop loss?",
        paragraphs: ["A stop loss is a pre-set exit that caps a loss."],
        example: "Set a stop at 0.11.",
      },
    ],
    quiz: [
      { id: "c5-q1", prompt: "When does a stop loss fire?", options: [{ text: "x", explanation: "y" }], correctIndex: 0 },
    ],
  },
];

describe("searchLessons", () => {
  it("returns nothing below the minimum query length", () => {
    expect(searchLessons(chapters, "a".repeat(MIN_QUERY - 1))).toEqual([]);
    expect(searchLessons(chapters, "")).toEqual([]);
  });

  it("matches lesson titles", () => {
    const r = searchLessons(chapters, "stop loss");
    expect(r.some((x) => x.lessonId === "c5-l1")).toBe(true);
  });

  it("matches lesson body content", () => {
    const r = searchLessons(chapters, "signs transactions");
    expect(r.map((x) => x.lessonId)).toContain("c1-l1");
  });

  it("matches chapter title/description", () => {
    const r = searchLessons(chapters, "downside");
    expect(r.some((x) => x.chapterId === "c5")).toBe(true);
  });

  it("matches quiz prompts", () => {
    const r = searchLessons(chapters, "does a wallet do");
    expect(r.some((x) => x.lessonId === "c1-l1")).toBe(true);
  });

  it("is case-insensitive and carries chapter + level metadata", () => {
    const r = searchLessons(chapters, "STOP LOSS");
    const hit = r.find((x) => x.lessonId === "c5-l1");
    expect(hit).toBeTruthy();
    expect(hit!.level).toBe("ADVANCED");
    expect(hit!.chapterNumber).toBe(5);
    expect(hit!.excerpt.toLowerCase()).toContain("stop loss");
  });

  it("ranks title matches above body matches", () => {
    // "trade" hits the c1-l2 TITLE ("Placing your first trade") and the c1-l2
    // BODY; a title match should sort first.
    const r = searchLessons(chapters, "trade");
    expect(r[0]?.lessonId).toBe("c1-l2");
  });

  it("returns at most one result per lesson", () => {
    const r = searchLessons(chapters, "wallet"); // title + body + quiz of c1-l1
    const ids = r.map((x) => x.lessonId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("highlightParts", () => {
  it("splits text into hit / non-hit segments (case-insensitive)", () => {
    const parts = highlightParts("A Stop loss caps the loss", "loss");
    expect(parts.filter((p) => p.hit).length).toBe(2);
    expect(parts.map((p) => p.text).join("")).toBe("A Stop loss caps the loss");
    for (const p of parts) if (p.hit) expect(p.text.toLowerCase()).toBe("loss");
  });

  it("returns the whole string as one non-hit part when query is empty", () => {
    expect(highlightParts("hello", "")).toEqual([{ text: "hello", hit: false }]);
  });

  it("never emits markup (XSS-safe parts)", () => {
    const parts = highlightParts("<script>alert(1)</script> loss", "loss");
    // The matched part is exactly the query text; nothing is interpreted as HTML.
    expect(parts.find((p) => p.hit)?.text).toBe("loss");
    expect(parts.map((p) => p.text).join("")).toContain("<script>");
  });
});
