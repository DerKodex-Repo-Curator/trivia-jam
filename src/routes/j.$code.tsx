import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { tryGetActorRuntimeEnv } from "~/server-env";
import { parseCode, resolveCode } from "~/try/codes";
import { TryCodeForm } from "~/try/try-phone-landing";

const resolve = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ code: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const code = parseCode(data.code);
    const kv = tryGetActorRuntimeEnv()?.KV_STORAGE;
    const gameId = code && kv ? await resolveCode(kv, code) : null;
    return { code, gameId };
  });

/** The try path: a typed game code (src/try/codes.ts) → that game's join page, or a page saying it's unknown. */
export const Route = createFileRoute("/j/$code")({
  loader: async ({ params }) => {
    const found = await resolve({ data: params });
    if (found.gameId) throw redirect({ to: "/games/$gameId", params: { gameId: found.gameId } });
    return found;
  },
  component: UnknownCode,
});

function UnknownCode() {
  const { code } = Route.useLoaderData();
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-5 p-6 text-center">
      <h1 className="pposter-title lav-text">Trivia Jam</h1>
      <p className="text-lg">
        <b>No game with that code{code ? ` (${code})` : ""}.</b> Check the code on the big screen, or start your own game on a laptop.
      </p>
      <TryCodeForm />
    </main>
  );
}
