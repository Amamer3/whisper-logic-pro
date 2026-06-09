import { parseAiOutputBlocks } from "@/lib/format-ai-output";
import { cn } from "@/lib/utils";

function InlineText({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\])/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("[") && part.endsWith("]") ? (
          <span key={i} className="text-muted-foreground italic">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

type FormattedOutputProps = {
  content: string;
  className?: string;
  emptyPlaceholder?: string;
};

export function FormattedOutput({ content, className, emptyPlaceholder }: FormattedOutputProps) {
  if (!content.trim()) {
    return (
      <div className={cn("text-sm text-muted-foreground", className)}>
        {emptyPlaceholder ?? "No content yet."}
      </div>
    );
  }

  const blocks = parseAiOutputBlocks(content);

  return (
    <div className={cn("space-y-1 text-sm leading-relaxed", className)}>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "title":
            return (
              <h2 key={i} className="text-lg font-semibold tracking-tight text-foreground pb-1">
                <InlineText text={block.text} />
              </h2>
            );
          case "section":
            return (
              <h3
                key={i}
                className="pt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground first:pt-0"
              >
                <InlineText text={block.text} />
              </h3>
            );
          case "bullet":
            return (
              <div
                key={i}
                className={cn(
                  "flex gap-2 text-foreground/90",
                  block.indent === 1 && "pl-4",
                  block.indent >= 2 && "pl-8",
                )}
              >
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
                <p className="flex-1">
                  <InlineText text={block.text} />
                </p>
              </div>
            );
          case "text":
            return (
              <p key={i} className="text-foreground/90">
                <InlineText text={block.text} />
              </p>
            );
          case "spacer":
            return <div key={i} className="h-2" />;
          default:
            return null;
        }
      })}
    </div>
  );
}
