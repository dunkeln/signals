import type { Spec } from "@json-render/core";

import { compileSignalChartSpec } from "@/lib/json-render/signal-chart-protocol";

export function buildSignalSpec(): Spec {
  return compileSignalChartSpec();
}
