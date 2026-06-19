import type { Spec } from "@json-render/core";

import { compileChartSpec } from "@/lib/protocol/v0";

export function buildSignalSpec(): Spec {
  return compileChartSpec();
}
