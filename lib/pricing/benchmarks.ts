/**
 * Reference projects. They double as test fixtures and as the source of every price the site
 * quotes in copy, so marketing claims can't drift away from what the planner calculates.
 */
import { normalize } from "./scope.ts";
import type { Scope } from "./types.ts";

export const BENCHMARKS = {
  landingPage: normalize({ goals: ["online"], build: ["website"], pages: 1, starting: ["brand"] }),
  businessSite: normalize({ goals: ["online", "leads"], build: ["website"], pages: 6 }),
  customSite: normalize({ goals: ["online", "leads"], build: ["website"], pages: 8, design: "custom" }),
  businessSystem: normalize({
    goals: ["operations", "sales"],
    build: ["internal"],
    features: ["admin", "crm", "dashboard"],
    roles: 3,
    starting: ["brand"],
  }),
  shopifyStore: normalize({ goals: ["sales"], build: ["store"], products: "m", integrations: ["shipping"] }),
  customStore: normalize({
    goals: ["sales"],
    build: ["store"],
    storeApproach: "custom",
    products: "l",
    features: ["accounts"],
    integrations: ["shipping", "whatsapp"],
    design: "custom",
  }),
  bookingApp: normalize({
    goals: ["product"],
    build: ["app"],
    features: ["accounts", "booking", "payments", "admin"],
    design: "custom",
  }),
  saasMvp: normalize({
    goals: ["product"],
    build: ["saas"],
    features: ["accounts", "payments", "dashboard", "admin"],
    design: "custom",
  }),
} satisfies Record<string, Scope>;

export type BenchmarkId = keyof typeof BENCHMARKS;
