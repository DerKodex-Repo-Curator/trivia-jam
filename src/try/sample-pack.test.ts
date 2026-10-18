import { describe, expect, it } from "vitest";
import { GameClientEventSchema } from "~/game.schemas";
import { SAMPLE_PACK, samplePackEvent } from "./sample-pack";

describe("the try path's sample pack: a stranger plays without writing questions", () => {
  it("is a valid QUESTIONS_PARSED event (the host sends it as is)", () => {
    expect(GameClientEventSchema.safeParse(samplePackEvent()).success).toBe(true);
  });

  it("is keyed q1…q8: the machine asks question n as `q${n}`", () => {
    expect(Object.keys(SAMPLE_PACK)).toEqual(["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8"]);
  });

  it("is eight numeric questions with whole-number answers, keyed by id", () => {
    const questions = Object.values(SAMPLE_PACK);
    expect(questions).toHaveLength(8);
    for (const q of questions) {
      expect(SAMPLE_PACK[q.id]).toBe(q);
      expect(q.questionType).toBe("numeric");
      expect(Number.isInteger(q.correctAnswer)).toBe(true);
      expect(q.text.endsWith("?")).toBe(true);
    }
  });
});
