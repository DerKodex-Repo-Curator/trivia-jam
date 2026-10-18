/** The part of a WebSocket the probe uses (so tests can pass a stand-in). */
export interface SocketLike {
  addEventListener(type: "open" | "error" | "close", listener: () => void): void;
  close(): void;
}
type SocketCtor = new (url: string) => SocketLike;

/**
 * Opens one WebSocket to the game's echo route and reports whether it opened within `timeoutMs`.
 * Some office and school networks (and proxies) block WebSockets: the game can't work there, and
 * without this the page just sits still.
 */
export function probeWebSocket(url: string, timeoutMs: number, Socket: SocketCtor): Promise<"ok" | "blocked"> {
  return new Promise((resolve) => {
    let settled = false;
    const socket = new Socket(url);
    const done = (verdict: "ok" | "blocked") => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.close();
      resolve(verdict);
    };
    const timer = setTimeout(() => done("blocked"), timeoutMs);
    socket.addEventListener("open", () => done("ok"));
    socket.addEventListener("error", () => done("blocked"));
    socket.addEventListener("close", () => done("blocked"));
  });
}
