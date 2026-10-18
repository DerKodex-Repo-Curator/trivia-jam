import { useState } from "react";
import { PhoneShell } from "~/components/phone/PhoneShell";
import { parseCode } from "./codes";

/** Type the 4-letter code on the big screen (src/try/codes.ts). */
export function TryCodeForm() {
  const [raw, setRaw] = useState("");
  const code = parseCode(raw);
  return (
    <form
      className="pcard flex flex-col gap-3 p-5 text-left"
      onSubmit={(e) => {
        e.preventDefault();
        if (code) location.assign(`/j/${code}`);
      }}
    >
      <label htmlFor="try-code" className="text-xl font-extrabold">
        Join a game: type the code on the big screen
      </label>
      <span className="flex gap-3">
        <input
          id="try-code"
          aria-label="Game code"
          className="pfield min-w-0 flex-1 text-center text-2xl tracking-[0.3em] uppercase"
          value={raw}
          onChange={(e) => setRaw(e.target.value.toUpperCase().slice(0, 4))}
          placeholder="ABCD"
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
        <button type="submit" className="pbtn pbtn-primary" disabled={!code}>
          Join
        </button>
      </span>
    </form>
  );
}

/**
 * The try path opened on a phone (most people read HN there): this phone is a player, and the game
 * needs a big screen. Say where the TV goes, and offer to send the link to the laptop.
 */
export function TryPhoneLanding() {
  const [copied, setCopied] = useState(false);
  const link = typeof location === "undefined" ? "" : `${location.origin}/`;
  const host = typeof location === "undefined" ? "" : location.host;
  const sendLink = async () => {
    const share = Reflect.get(navigator, "share");
    if (typeof share === "function") {
      await navigator.share({ title: "Trivia Jam", url: link }).catch(() => undefined);
      return;
    }
    await navigator.clipboard?.writeText(link).catch(() => undefined);
    setCopied(true);
  };
  return (
    <PhoneShell className="relative flex flex-col justify-center gap-5 px-5 py-8 text-center">
      <p className="pslug">A numbers game for the whole room</p>
      <h1 className="pposter-title lav-text">Trivia Jam</h1>
      <p className="text-lg text-gray-200">
        The questions show on a big screen: open{" "}
        <b>
          {host.split(".").map((part, i, all) => (
            <span key={i} className="whitespace-nowrap">
              {part}
              {i < all.length - 1 && (
                <>
                  .<wbr />
                </>
              )}
            </span>
          ))}
        </b>{" "}
        on a laptop (or a TV browser), then scan its code with your
        phone. Everyone guesses a number; closest wins. No app, no account.
      </p>
      <button type="button" className="pbtn pbtn-primary pbtn-lg pbtn-block" onClick={() => void sendLink()}>
        {copied ? "Link copied" : "Send the link to your laptop"}
      </button>
      <TryCodeForm />
    </PhoneShell>
  );
}
