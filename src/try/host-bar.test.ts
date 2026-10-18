import { describe, expect, it } from "vitest";
import { hostBar } from "./host-bar";

describe("hostBar: the laptop TV hosts the try path with one button", () => {
  it("an empty lobby loads the sample pack by itself", () => {
    expect(hostBar({ state: "waiting", players: 0, questionNumber: 0, total: 0 })).toEqual({ kind: "load" });
  });

  it("with questions but nobody aboard, Start waits for phones", () => {
    expect(hostBar({ state: "ready", players: 0, questionNumber: 0, total: 8 })).toEqual({ kind: "button", label: "Start", events: [], enabled: false, hint: "Waiting for a phone to join" });
  });

  it("with a player, Start begins the game and asks question 1", () => {
    expect(hostBar({ state: "ready", players: 2, questionNumber: 0, total: 8 })).toEqual({ kind: "button", label: "Start the game", events: ["START_GAME", "NEXT_QUESTION"], enabled: true, hint: "2 players aboard" });
  });

  it("between questions, Next asks the next one", () => {
    expect(hostBar({ state: "prep", players: 2, questionNumber: 3, total: 8 })).toEqual({ kind: "button", label: "Next question", events: ["NEXT_QUESTION"], enabled: true, hint: "Question 4 of 8" });
  });

  it("after the last question, it shows the final scores", () => {
    expect(hostBar({ state: "prep", players: 2, questionNumber: 8, total: 8 })).toEqual({ kind: "button", label: "Final scores", events: ["END_GAME"], enabled: true, hint: null });
  });

  it("while a question is live, the bar gets out of the way", () => {
    expect(hostBar({ state: "active", players: 2, questionNumber: 1, total: 8 })).toBeNull();
  });

  it("at the end, play again", () => {
    expect(hostBar({ state: "finished", players: 2, questionNumber: 8, total: 8 })).toEqual({ kind: "again" });
  });

  it("one player reads as one", () => {
    expect(hostBar({ state: "ready", players: 1, questionNumber: 0, total: 8 })).toMatchObject({ hint: "1 player aboard" });
  });
});
