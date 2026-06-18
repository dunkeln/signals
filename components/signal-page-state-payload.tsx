import type { SignalPageState } from "@/lib/signal/page-state";

interface SignalPageStatePayloadProps {
  state: SignalPageState;
}

export function SignalPageStatePayload({
  state,
}: SignalPageStatePayloadProps) {
  return (
    <script
      id="signals-signal-page-state"
      type="application/json"
      dangerouslySetInnerHTML={{ __html: serializeJsonForHtml(state) }}
    />
  );
}

function serializeJsonForHtml(value: SignalPageState) {
  return JSON.stringify(value).replace(/[<>&]/g, (char) => {
    switch (char) {
      case "<":
        return "\\u003c";
      case ">":
        return "\\u003e";
      case "&":
        return "\\u0026";
      default:
        return char;
    }
  });
}
