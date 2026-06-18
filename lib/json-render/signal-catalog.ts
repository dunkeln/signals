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
    WorkflowMapSankey: {
      props: dataPathProps,
      description:
        "Sankey chart over canonical entity-instance flow with evidence-backed edges.",
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
