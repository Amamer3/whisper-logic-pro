import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SendEmailInput = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(998),
  text: z.string().min(1).max(2_000_000),
});

/**
 * Send an email via MailerSend. Requires MAILERSEND_API_KEY and MAILERSEND_FROM_EMAIL.
 */
export const sendEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => SendEmailInput.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.MAILERSEND_API_KEY;
    const fromEmail = process.env.MAILERSEND_FROM_EMAIL;
    const fromName = process.env.MAILERSEND_FROM_NAME;

    if (!apiKey) throw new Error("MAILERSEND_API_KEY is not configured");
    if (!fromEmail) throw new Error("MAILERSEND_FROM_EMAIL is not configured");

    const html = data.text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>");

    const res = await fetch("https://api.mailersend.com/v1/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: {
          email: fromEmail,
          ...(fromName ? { name: fromName } : {}),
        },
        to: [{ email: data.to }],
        subject: data.subject,
        text: data.text,
        html: `<div style="font-family:sans-serif;line-height:1.5">${html}</div>`,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      if (res.status === 422) {
        throw new Error(
          "MailerSend rejected the email — verify your sender domain and from address in MailerSend.",
        );
      }
      if (res.status === 429) throw new Error("Email rate limit reached. Please try again shortly.");
      throw new Error(`Failed to send email (${res.status}): ${errText.slice(0, 200)}`);
    }

    const messageId = res.headers.get("x-message-id");
    return { success: true as const, messageId };
  });
