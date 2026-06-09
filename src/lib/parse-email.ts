/** Split AI-generated email content into subject + body (expects "Subject: ..." on line 1). */
export function parseGeneratedEmail(content: string): { subject: string; body: string } {
  const trimmed = content.trim();
  const lines = trimmed.split("\n");
  const firstLine = lines[0]?.trim() ?? "";

  if (/^subject:\s*/i.test(firstLine)) {
    const subject = firstLine.replace(/^subject:\s*/i, "").trim();
    const body = lines.slice(1).join("\n").replace(/^\n+/, "");
    return { subject: subject || "Message from VoiceFlow", body };
  }

  return { subject: "Message from VoiceFlow", body: trimmed };
}
