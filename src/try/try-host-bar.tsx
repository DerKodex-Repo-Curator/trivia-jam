import { offerThisComputer, openPlayerWindow } from "@open-game-system/try-kit/browser";
import { useEffect, useRef } from "react";
import { GameContext } from "~/game.context";
import { hostBar, type HostBarState } from "./host-bar";
import { samplePackEvent } from "./sample-pack";

/**
 * The try path's host on the laptop TV (no host phone): one button that does the next thing, and
 * the Space bar does the same. Sits in the TV's bottom-right corner, clear of the question and the
 * number line. See host-bar.ts for the rules.
 */
export function TryHostBar() {
  const send = GameContext.useSend();
  const waiting = GameContext.useMatches({ lobby: "waitingForQuestions" });
  const parsing = GameContext.useMatches({ lobby: "parsingDocument" });
  const ready = GameContext.useMatches({ lobby: "ready" });
  const prep = GameContext.useMatches({ active: "questionPrep" });
  const finished = GameContext.useMatches("finished");
  const players = GameContext.useSelector((s) => s.public.players.length);
  const questionNumber = GameContext.useSelector((s) => s.public.questionNumber);
  const total = GameContext.useSelector((s) => Object.keys(s.public.questions).length);
  const gameId = GameContext.useSelector((s) => s.public.id);
  const state: HostBarState = waiting ? "waiting" : parsing ? "parsing" : ready ? "ready" : prep ? "prep" : finished ? "finished" : "active";
  const bar = hostBar({ state, players, questionNumber, total });

  // An empty lobby gets the sample pack once.
  const loaded = useRef(false);
  useEffect(() => {
    if (bar?.kind !== "load" || loaded.current) return;
    loaded.current = true;
    send(samplePackEvent());
  }, [bar, send]);

  const act = () => {
    if (bar?.kind === "again") {
      location.assign(`/${location.search}`);
      return;
    }
    if (bar?.kind !== "button" || !bar.enabled) return;
    for (const type of bar.events) send({ type });
  };
  const actRef = useRef(act);
  actRef.current = act;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return;
      e.preventDefault();
      actRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!bar || bar.kind === "load") return null;
  const label = bar.kind === "again" ? "Play again" : bar.label;
  const hint = bar.kind === "again" ? "New game, same link" : bar.hint;
  // No phone handy (a skeptic at a laptop): a player's screen opens in a window on this computer.
  // Not on a touch-screen TV (an iPad as the TV): the window would cover it.
  const noPhone = offerThisComputer({ plainBrowserTv: true, touchTv: matchMedia("(pointer: coarse)").matches, needsPlayer: state === "ready" && players === 0 });
  return (
    <div className="try-host-bar" role="group" aria-label="Host controls">
      {noPhone && (
        <button type="button" className="pbtn try-no-phone" onClick={() => openPlayerWindow(`/games/${gameId}?play=1`, "trivia-jam-player")}>
          No phone handy? Play on this computer
        </button>
      )}
      {hint && <span className="try-host-hint">{hint}</span>}
      <button type="button" className="pbtn pbtn-primary pbtn-lg" disabled={bar.kind === "button" && !bar.enabled} onClick={act}>
        {label} <kbd>Space</kbd>
      </button>
    </div>
  );
}
