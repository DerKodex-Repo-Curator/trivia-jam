import { useEffect, useState } from "react";
import { probeWebSocket } from "./connection-probe";

const PROBE_MS = 8000;

/**
 * Says so when this network can't reach the game's WebSockets (connection-probe.ts), instead of a
 * page that never moves. On every page (the root layout).
 */
export function NetworkBanner() {
  const [blocked, setBlocked] = useState(false);
  useEffect(() => {
    const url = `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws-probe`;
    void probeWebSocket(url, PROBE_MS, WebSocket).then((v) => setBlocked(v === "blocked"));
  }, []);
  if (!blocked) return null;
  return (
    <p className="network-banner" role="alert">
      <b>Can't reach the game.</b> This network seems to block WebSockets, which the game needs (some office and school networks do). Try
      another network, or your phone's mobile data.
    </p>
  );
}
