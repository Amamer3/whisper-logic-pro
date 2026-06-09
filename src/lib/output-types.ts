export const OUTPUT_TYPES = [
  { id: "email", label: "Professional Email", icon: "✉️", system: "Convert the transcript into a polished, professional email. Include a clear subject line on the first line as 'Subject: ...', then a greeting, body, and signature. Be concise and action-oriented." },
  { id: "meeting_notes", label: "Meeting Minutes", icon: "📋", system: "Convert the transcript into structured meeting minutes with sections: Attendees (if mentioned), Agenda, Discussion, Decisions, and Action Items (with owners and due dates when mentioned). Use clean markdown." },
  { id: "tasks", label: "Task List", icon: "✅", system: "Extract every actionable item from the transcript and format as a markdown checklist. Group by owner if multiple people are mentioned. Be specific and outcome-focused." },
  { id: "daily_report", label: "Daily Report", icon: "📅", system: "Convert the transcript into a daily standup-style report with sections: Done today, Doing tomorrow, Blockers." },
  { id: "weekly_report", label: "Weekly Report", icon: "🗓️", system: "Convert into a weekly status report with: Highlights, Progress, Risks, Next Week's Plan." },
  { id: "project_update", label: "Project Update", icon: "🚀", system: "Write a project update suitable for stakeholders: status (Green/Yellow/Red), what shipped, what's next, asks." },
  { id: "summary", label: "Executive Summary", icon: "📊", system: "Write a tight executive summary in 3-5 bullet points highlighting key insights, decisions, and next steps." },
  { id: "blog", label: "Blog Draft", icon: "✍️", system: "Turn the transcript into a well-structured blog post draft with a compelling title, intro hook, 3-5 sections with subheadings, and a conclusion. Use clean prose." },
  { id: "journal", label: "Journal Entry", icon: "📔", system: "Convert into a reflective, first-person journal entry. Preserve tone and insights; do not invent details." },
  { id: "social", label: "Social Media Post", icon: "📱", system: "Write a punchy social media post (LinkedIn or X style) based on the transcript. Maximum 280 characters where possible, with line breaks for readability." },
  { id: "custom", label: "Custom Output", icon: "✨", system: "Follow the user's custom instructions exactly to transform the transcript." },
] as const;

export type OutputTypeId = (typeof OUTPUT_TYPES)[number]["id"];
