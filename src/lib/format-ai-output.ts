/** Strip markdown heading markers and bold syntax from AI output for clean plain text. */
export function cleanAiOutputText(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      const heading = line.match(/^#{1,6}\s+(.+)$/);
      if (heading) return heading[1].replace(/\*\*/g, "");
      return line.replace(/\*\*(.+?)\*\*/g, "$1");
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

type Block =
  | { type: "title"; text: string }
  | { type: "section"; text: string }
  | { type: "bullet"; text: string; indent: number }
  | { type: "text"; text: string }
  | { type: "spacer" };

const SECTION_LABELS =
  /^(attendees|agenda|discussion|decisions|action items|highlights|progress|risks|blockers|done today|doing tomorrow|next week'?s plan|status|asks|summary|subject|tasks?)$/i;

function isSectionLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length > 60 || trimmed.includes(".")) return false;
  if (SECTION_LABELS.test(trimmed)) return true;
  if (/^[A-Z][a-zA-Z\s/&'-]+$/.test(trimmed) && trimmed.length < 40) return true;
  return false;
}

export function parseAiOutputBlocks(content: string): Block[] {
  const lines = content.split("\n");
  const blocks: Block[] = [];
  let seenTitle = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      if (blocks.at(-1)?.type !== "spacer") blocks.push({ type: "spacer" });
      continue;
    }

    const heading = trimmed.match(/^#{1,6}\s+(.+)$/);
    if (heading) {
      const text = heading[1].replace(/\*\*/g, "");
      blocks.push({ type: seenTitle ? "section" : "title", text });
      seenTitle = true;
      continue;
    }

    const bulletMatch = line.match(/^(\s*)[-*•]\s+(.+)$/);
    if (bulletMatch) {
      const indent = Math.min(2, Math.floor(bulletMatch[1].length / 2));
      blocks.push({ type: "bullet", text: bulletMatch[2], indent });
      seenTitle = true;
      continue;
    }

    if (!seenTitle) {
      blocks.push({ type: "title", text: trimmed });
      seenTitle = true;
      continue;
    }

    if (isSectionLine(trimmed)) {
      blocks.push({ type: "section", text: trimmed });
      continue;
    }

    blocks.push({ type: "text", text: trimmed });
  }

  return blocks;
}
