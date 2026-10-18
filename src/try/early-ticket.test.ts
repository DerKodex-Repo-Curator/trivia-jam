import { afterEach, describe, expect, it } from "vitest";
import { EARLY_TICKET_SCRIPT, hideEarlyTicket } from "./early-ticket";

/** The shell's empty ticket element, then the inline script, as the root document renders them. */
function load(path: string) {
  window.history.replaceState(null, "", path);
  document.body.innerHTML = '<div data-try-ticket="" style="display:none"></div>';
  new Function(EARLY_TICKET_SCRIPT)();
  const el = document.querySelector<HTMLElement>("[data-try-ticket]");
  if (!el) throw new Error("no ticket element");
  return el;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("the early ticket: the try TV's game code at first paint, before the app's scripts", () => {
  it("shows the code from ?code= on a spectate page, with where to join", () => {
    const el = load("/spectate/2bdf96fc-ab51-48a2-a91c-1a6c43e73310?ref=hn&code=KVXH");
    expect(el.style.display).not.toBe("none");
    expect(el.textContent).toContain("KVXH");
    expect(el.textContent).toContain(`${location.host}/j/KVXH`);
  });
  it("stays hidden without a valid code (production never has one) or off the spectate page", () => {
    expect(load("/spectate/abc").style.display).toBe("none");
    expect(load("/spectate/abc?code=<b>x").style.display).toBe("none");
    expect(load("/games/abc?code=KVXH").style.display).toBe("none");
  });
  it("the code is its own element, so a test (or a reader) finds exactly the code", () => {
    const el = load("/spectate/x?code=KVXH");
    expect([...el.querySelectorAll("*")].some((n) => n.textContent === "KVXH")).toBe(true);
  });
  it("hides once the app shows the code itself", () => {
    const el = load("/spectate/x?code=KVXH");
    hideEarlyTicket();
    expect(el.style.display).toBe("none");
  });
});
