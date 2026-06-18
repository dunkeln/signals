import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { z } from "zod";

const dataPathProps = z.object({
  dataPath: z.string(),
  title: z.string().optional(),
});

export const signalCatalog = defineCatalog(schema, {
  components: {
    SignalFrame: {
      props: z.object({
        title: z.string(),
        description: z.string().optional(),
      }),
      description:
        "Frame for Signal intelligence views rendered from deterministic state.",
    },
    DomainCoverageChart: {
      props: dataPathProps,
      description:
        "Stacked bar chart over Signal domain dimensions found in telemetry.",
    },
    ServiceFlowSankey: {
      props: dataPathProps,
      description:
        "Sankey chart over precomputed telemetry kind to Signal lane links.",
    },
    SourceEvidenceTable: {
      props: dataPathProps,
      description:
        "Source evidence table with Signal references preserved from ingress.",
    },
    GeneratedBarChart: {
      props: dataPathProps,
      description:
        "Bar chart over a validated generated chart dataset with evidence preserved.",
    },
  },
  actions: {},
});
