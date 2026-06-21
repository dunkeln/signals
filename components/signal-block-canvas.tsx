"use client";

import * as React from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Renderer, useStateStore, useStateValue } from "@json-render/react";
import type { Spec } from "@json-render/core";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  GripVerticalIcon,
  LoaderCircleIcon,
  PlusIcon,
  SparklesIcon,
  Trash2Icon,
} from "lucide-react";

import {
  GeneratedChartView,
  signalRegistry,
} from "@/components/json-render/signal-registry";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  executeChartInstruction,
  type GeneratedChartDataset,
} from "@/lib/protocol/v0";
import { submitSignalPrompt } from "@/lib/signal/agent-client";
import type { SignalIntelligenceState } from "@/lib/signal/intelligence";
import type { SignalWorkflowMapData } from "@/lib/signal/workflow-map";
import { cn } from "@/lib/utils";

type SignalBlock =
  | {
      id: "workflow-map";
      kind: "workflow";
    }
  | {
      id: string;
      kind: "note";
      text: string;
    }
  | {
      id: string;
      kind: "chart";
      dataset: GeneratedChartDataset;
    };

interface SignalBlockCanvasProps {
  clientSlug: string;
  workflowSpec: Spec;
}

export function SignalBlockCanvas({
  clientSlug,
  workflowSpec,
}: SignalBlockCanvasProps) {
  const { set } = useStateStore();
  const documentTitle = useStateValue<string | undefined>("/document/title");
  const signal = useStateValue<SignalIntelligenceState | undefined>("/signal");
  const workflowMap = useStateValue<SignalWorkflowMapData | undefined>("/workflowMap");
  const [blocks, setBlocks] = React.useState<SignalBlock[]>([
    { id: "workflow-map", kind: "workflow" },
    { id: "note-1", kind: "note", text: "" },
  ]);
  const [runningBlockId, setRunningBlockId] = React.useState<string | null>(null);
  const nextNoteId = React.useRef(2);
  const documentTitleStorageKey = `signal:document-title:${clientSlug}`;
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  React.useEffect(() => {
    const savedTitle = window.localStorage.getItem(documentTitleStorageKey);

    if (savedTitle) {
      set("/document/title", savedTitle);
    }
  }, [documentTitleStorageKey, set]);

  function updateDocumentTitle(title: string) {
    set("/document/title", title);
    window.localStorage.setItem(documentTitleStorageKey, title);
    window.dispatchEvent(
      new CustomEvent("signal-document-title-change", {
        detail: { clientSlug, title },
      }),
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    setBlocks((current) => {
      const from = current.findIndex((block) => block.id === active.id);
      const to = current.findIndex((block) => block.id === over.id);

      return from === -1 || to === -1 ? current : arrayMove(current, from, to);
    });
  }

  function addNote() {
    const id = `note-${nextNoteId.current++}`;

    setBlocks((current) => [...current, { id, kind: "note", text: "" }]);
  }

  function updateNote(id: string, text: string) {
    setBlocks((current) =>
      current.map((block) =>
        block.id === id && block.kind === "note" ? { ...block, text } : block,
      ),
    );
  }

  function updateChartTitle(id: string, title: string) {
    setBlocks((current) =>
      current.map((block) =>
        block.id === id && block.kind === "chart"
          ? { ...block, dataset: { ...block.dataset, title } }
          : block,
      ),
    );
  }

  function deleteBlock(id: string) {
    setBlocks((current) => current.filter((block) => block.id !== id));
  }

  async function runAgent(block: Extract<SignalBlock, { kind: "note" }>) {
    const prompt = agentPrompt(block.text);

    if (!prompt || runningBlockId || !signal || !workflowMap) {
      return;
    }

    setRunningBlockId(block.id);

    try {
      const runtimeResult = await submitSignalPrompt({
        clientSlug,
        message: prompt,
      });
      const dataset = executeChartInstruction({
        instruction: runtimeResult.instruction,
        workflowMap,
        knownEvidenceSourceIds: signal.evidenceRows.map((row) => row.sourceId),
      });

      setBlocks((current) =>
        current.map((candidate) =>
          candidate.id === block.id
            ? { id: block.id, kind: "chart", dataset }
            : candidate,
        ),
      );
      set("/runtimeErrorMessage", null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "The chart runtime could not complete this request.";

      set("/runtimeErrorMessage", message);
    } finally {
      setRunningBlockId(null);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 pb-8">
      <input
        aria-label="Document title"
        value={documentTitle ?? ""}
        onChange={(event) => updateDocumentTitle(event.currentTarget.value)}
        className="w-full bg-transparent text-xl font-semibold text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
        placeholder="Untitled report"
      />
      <DndContext
        id="signal-block-canvas"
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={blocks.map((block) => block.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-3">
            {blocks.map((block) => (
              <SortableBlockShell
                key={block.id}
                id={block.id}
                canDelete={block.kind !== "workflow"}
                onDelete={() => deleteBlock(block.id)}
              >
                {block.kind === "workflow" ? (
                  <Renderer spec={workflowSpec} registry={signalRegistry} />
                ) : block.kind === "note" ? (
                  <NoteBlock
                    block={block}
                    isRunning={runningBlockId === block.id}
                    onChange={updateNote}
                    onRun={runAgent}
                  />
                ) : (
                  <GeneratedChartView
                    dataset={block.dataset}
                    onTitleChange={(title) => updateChartTitle(block.id, title)}
                  />
                )}
              </SortableBlockShell>
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <button
        type="button"
        onClick={addNote}
        className="flex h-10 w-full items-center gap-2 border border-dashed border-border bg-background px-4 text-left text-sm text-muted-foreground outline-none transition-colors hover:border-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <PlusIcon className="size-4" />
        New section
      </button>
    </div>
  );
}

function SortableBlockShell({
  id,
  canDelete,
  onDelete,
  children,
}: {
  id: string;
  canDelete: boolean;
  onDelete: () => void;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const [menuPosition, setMenuPosition] = React.useState<{
    x: number;
    y: number;
  } | null>(null);

  React.useEffect(() => {
    if (!menuPosition) {
      return;
    }

    function closeMenu() {
      setMenuPosition(null);
    }

    window.addEventListener("pointerdown", closeMenu);
    window.addEventListener("keydown", closeMenu);
    window.addEventListener("scroll", closeMenu, true);

    return () => {
      window.removeEventListener("pointerdown", closeMenu);
      window.removeEventListener("keydown", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
    };
  }, [menuPosition]);

  return (
    <div
      ref={setNodeRef}
      onContextMenu={(event) => {
        if (!canDelete) {
          return;
        }

        event.preventDefault();
        setMenuPosition({ x: event.clientX, y: event.clientY });
      }}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "group relative min-w-0 border border-border bg-background p-4 pl-11 shadow-sm",
        isDragging && "z-20 opacity-80",
      )}
    >
      <div className="absolute left-2 top-3 flex flex-col gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
        <IconTooltipButton
          label="Rearrange"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
        >
          <GripVerticalIcon />
        </IconTooltipButton>
      </div>
      {children}
      {menuPosition ? (
        <div
          className="fixed z-50 min-w-28 rounded-md bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10"
          style={{ left: menuPosition.x, top: menuPosition.y }}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className="flex w-full items-center gap-1.5 rounded-sm px-2 py-1.5 text-sm text-destructive outline-none hover:bg-destructive/10 focus-visible:bg-destructive/10"
            onClick={() => {
              setMenuPosition(null);
              onDelete();
            }}
          >
            <Trash2Icon className="size-4" />
            Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}

function NoteBlock({
  block,
  isRunning,
  onChange,
  onRun,
}: {
  block: Extract<SignalBlock, { kind: "note" }>;
  isRunning: boolean;
  onChange: (id: string, text: string) => void;
  onRun: (block: Extract<SignalBlock, { kind: "note" }>) => void;
}) {
  const canRun = agentPrompt(block.text).length > 0 && !isRunning;
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [isEditing, setIsEditing] = React.useState(block.text.trim().length === 0);
  const shouldPreview =
    block.text.trim().length > 0 && !isEditing && !isAgentCommand(block.text);

  React.useLayoutEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [block.text]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter" && canRun) {
      event.preventDefault();
      void onRun(block);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setIsEditing(false);
      event.currentTarget.blur();
      return;
    }

    if (event.key === "Enter" && !event.shiftKey && !isAgentCommand(block.text)) {
      event.preventDefault();
      setIsEditing(false);
      event.currentTarget.blur();
    }
  }

  if (shouldPreview) {
    return (
      <button
        type="button"
        className="block min-h-6 w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        onClick={() => setIsEditing(true)}
      >
        <MarkdownNote>{block.text}</MarkdownNote>
      </button>
    );
  }

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        aria-label="Notes"
        rows={1}
        value={block.text}
        onBlur={() => setIsEditing(false)}
        onFocus={() => setIsEditing(true)}
        onInput={(event) => onChange(block.id, event.currentTarget.value)}
        onKeyDown={handleKeyDown}
        placeholder="hint: use @agent to generate chart data"
        className="block min-h-6 w-full resize-none overflow-hidden bg-transparent text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground"
      />
      {isAgentCommand(block.text) ? (
        <div className="absolute bottom-0 right-0">
          <IconTooltipButton
            label="Run agent"
            onClick={() => void onRun(block)}
            disabled={!canRun}
          >
            {isRunning ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <SparklesIcon />
            )}
          </IconTooltipButton>
        </div>
      ) : null}
    </div>
  );
}

function MarkdownNote({ children }: { children: string }) {
  return (
    <div className="text-sm leading-6 text-foreground [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_code]:rounded-sm [&_code]:bg-muted [&_code]:px-1 [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:text-base [&_h3]:font-semibold [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}

const IconTooltipButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    label: string;
  }
>(function IconTooltipButton({ label, className, children, ...props }, ref) {
  return (
    <Tooltip>
      <TooltipTrigger
        ref={ref}
        type="button"
        aria-label={label}
        className={cn(
          "inline-flex size-7 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4",
          className,
        )}
        {...props}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
});

function isAgentCommand(text: string) {
  return /(^|\s)@agent\b/i.test(text);
}

function agentPrompt(text: string) {
  return text.replace(/(^|\s)@agent\b[:\s-]*/i, " ").trim();
}
