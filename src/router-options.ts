/** The router's options (src/router.tsx), apart from the route tree, so they can be tested alone. */
export const ROUTER_OPTIONS = {
  scrollRestoration: true,
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  // No pending UI exists, so the router's 500 ms minimum pending time only kept the page blank while
  // data-only routes hydrated (a phone's join form showed 500 ms late, the TV's code too).
  defaultPendingMinMs: 0,
} as const;
