import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { atom } from "nanostores";
import { useState } from "react";
import { getDeviceType } from "~/utils/deviceType";
import { HomePageContent } from "~/components/homepage-content";
import { TryPhoneLanding } from "~/try/try-phone-landing";
import { isTryPath, tryGetActorRuntimeEnv } from "~/server-env";
import { claimCode } from "~/try/codes";

const loadIndex = createServerFn({ method: "GET" }).handler(async () => {
  const request = getRequest();
  const gameId = crypto.randomUUID();
  const deviceType = getDeviceType(request.headers.get("user-agent"));
  const ref = new URL(request.url).searchParams.get("ref");
  const tryPath = isTryPath();
  // The try path's TV gets a 4-letter code a phone can type (src/try/codes.ts).
  const kv = tryGetActorRuntimeEnv()?.KV_STORAGE;
  const code = tryPath && deviceType === "desktop" && kv ? await claimCode(kv, gameId) : null;
  return { gameId, deviceType, tryPath, code, ref: ref && /^[a-z0-9_-]{1,32}$/i.test(ref) ? ref.toLowerCase() : null };
});

export const Route = createFileRoute("/")({
  loader: async () => {
    const data = await loadIndex();
    // The try path: a laptop opening the link becomes the TV of a new game (it hosts; src/try).
    if (data.tryPath && data.deviceType === "desktop") {
      throw redirect({ to: "/spectate/$gameId", params: { gameId: data.gameId }, search: { ...(data.ref ? { ref: data.ref } : {}), ...(data.code ? { code: data.code } : {}) } });
    }
    return data;
  },
  component: Index,
});

function Index() {
  const { gameId, deviceType, tryPath } = Route.useLoaderData();
  if (tryPath) return <TryPhoneLanding />;
  const [$showHelp] = useState(() => atom<boolean>(false));

  return (
    <HomePageContent
      newGameId={gameId}
      deviceType={deviceType}
      $showHelp={$showHelp}
    />
  );
}
