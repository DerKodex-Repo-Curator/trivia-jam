/**
 * `/ws-probe`: a WebSocket echo, so a page can tell whether this network lets WebSockets through
 * (connection-probe.ts). Some office and school networks block them, and the game needs them.
 */
export function wsProbe(req: Request): Response {
  if (req.headers.get("Upgrade")?.toLowerCase() !== "websocket") return new Response("expected websocket", { status: 426 });
  const { 0: client, 1: server } = new WebSocketPair();
  server.accept();
  server.addEventListener("message", (e) => server.send(`echo:${String(e.data)}`));
  return new Response(null, { status: 101, webSocket: client });
}
