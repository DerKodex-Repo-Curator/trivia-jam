import { describe, expect, it } from "vitest";
import { ROUTER_OPTIONS } from "./router-options";

describe("the router", () => {
  it("doesn't hold hydration for a minimum pending time (data-only routes showed a blank page for 500 ms)", () => {
    expect(ROUTER_OPTIONS.defaultPendingMinMs).toBe(0);
  });
});
