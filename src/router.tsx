import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { ROUTER_OPTIONS } from "./router-options";

export function getRouter() {
  const router = createTanStackRouter({ routeTree, ...ROUTER_OPTIONS });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
