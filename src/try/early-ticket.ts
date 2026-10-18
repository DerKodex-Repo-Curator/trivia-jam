/**
 * The try TV's game code at first paint. The spectate route renders no HTML on the server (data-only),
 * so the code waited for the app's scripts and its socket (2.5 s on Fast 4G). The root shell renders
 * an empty `[data-try-ticket]` element and this inline script fills it from `?code=` (only the try
 * path ever sets one: src/try/codes.ts). The app hides it when it shows the code itself
 * (SpectatorView). Plain ES5, text only: nothing from the URL is parsed as HTML.
 */
export const EARLY_TICKET_SCRIPT = `(function(){
var el=document.querySelector("[data-try-ticket]");
var code=new URLSearchParams(location.search).get("code");
if(!el||!/^\\/spectate\\//.test(location.pathname)||!code||!/^[A-Z]{4}$/.test(code))return;
function line(text,css){var d=document.createElement("div");d.textContent=text;d.style.cssText=css;el.appendChild(d);return d}
line("Game code","font-size:1.4rem;opacity:.8;letter-spacing:.08em;text-transform:uppercase");
line(code,"font-size:clamp(3rem,12vh,8rem);font-weight:800;letter-spacing:.15em");
line("Join at "+location.host+"/j/"+code,"font-size:1.3rem;opacity:.85");
el.style.cssText="position:fixed;inset:0;z-index:50;display:grid;place-content:center;gap:1rem;text-align:center;color:#fff;background:#0b0f1a;font-family:system-ui,sans-serif";
})();`;

/** The app shows the code now: the early ticket steps aside. */
export function hideEarlyTicket(): void {
  const el = document.querySelector<HTMLElement>("[data-try-ticket]");
  if (el) el.style.display = "none";
}
