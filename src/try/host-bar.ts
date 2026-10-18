export type HostBarState = "waiting" | "parsing" | "ready" | "prep" | "active" | "finished";
type HostEvent = "START_GAME" | "NEXT_QUESTION" | "END_GAME";

export type HostBar =
  | { kind: "load" }
  | { kind: "again" }
  | { kind: "button"; label: string; events: HostEvent[]; enabled: boolean; hint: string | null };

/**
 * The try path (strangers, no host phone): the laptop TV is the host, with one button that does the
 * next thing. It loads the sample pack itself, starts once a phone has joined, asks each question,
 * then shows the final scores. Live questions run on their own (auto-advance when all have answered).
 */
export function hostBar(input: { state: HostBarState; players: number; questionNumber: number; total: number }): HostBar | null {
  const aboard = `${input.players} player${input.players === 1 ? "" : "s"} aboard`;
  switch (input.state) {
    case "waiting":
      return { kind: "load" };
    case "ready":
      return input.players > 0
        ? { kind: "button", label: "Start the game", events: ["START_GAME", "NEXT_QUESTION"], enabled: true, hint: aboard }
        : { kind: "button", label: "Start", events: [], enabled: false, hint: "Waiting for a phone to join" };
    case "prep":
      return input.questionNumber >= input.total
        ? { kind: "button", label: "Final scores", events: ["END_GAME"], enabled: true, hint: null }
        : { kind: "button", label: "Next question", events: ["NEXT_QUESTION"], enabled: true, hint: `Question ${input.questionNumber + 1} of ${input.total}` };
    case "finished":
      return { kind: "again" };
    default:
      return null;
  }
}
