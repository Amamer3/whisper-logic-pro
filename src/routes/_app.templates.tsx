import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Pencil, X, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/templates")({
  head: () => ({ meta: [{ title: "Templates — VoiceFlow" }] }),
  component: TemplatesPage,
});

interface Template {
  id: string;
  name: string;
  description: string | null;
  prompt: string;
}

function TemplatesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Template | null>(null);
  const [creating, setCreating] = useState(false);

  const { data } = useQuery({
    queryKey: ["templates", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("prompt_templates")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return (data ?? []) as Template[];
    },
  });

  async function save(t: Partial<Template> & { name: string; prompt: string }) {
    if (!user) return;
    if (t.id) {
      const { error } = await supabase.from("prompt_templates").update({
        name: t.name, description: t.description ?? null, prompt: t.prompt,
      }).eq("id", t.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("prompt_templates").insert({
        user_id: user.id, name: t.name, description: t.description ?? null, prompt: t.prompt,
      });
      if (error) return toast.error(error.message);
    }
    toast.success("Saved");
    setEditing(null); setCreating(false);
    qc.invalidateQueries({ queryKey: ["templates"] });
  }

  async function remove(id: string) {
    const { error } = await supabase.from("prompt_templates").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["templates"] });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 md:p-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Prompt templates</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Save reusable instructions you can apply in the AI Studio.
          </p>
        </div>
        <Button onClick={() => setCreating(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New template
        </Button>
      </div>

      {creating && <Editor onCancel={() => setCreating(false)} onSave={save} />}

      <div className="grid gap-3">
        {data?.length === 0 && !creating && (
          <Card className="p-10 text-center text-sm text-muted-foreground">
            No templates yet. Create your first one to speed up AI Studio.
          </Card>
        )}
        {data?.map((t) =>
          editing?.id === t.id ? (
            <Editor key={t.id} initial={t} onCancel={() => setEditing(null)} onSave={save} />
          ) : (
            <Card key={t.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{t.name}</div>
                  {t.description && <div className="mt-0.5 text-xs text-muted-foreground">{t.description}</div>}
                  <pre className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground line-clamp-3">{t.prompt}</pre>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => setEditing(t)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(t.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </Card>
          ),
        )}
      </div>
    </div>
  );
}

function Editor({
  initial, onSave, onCancel,
}: {
  initial?: Template;
  onSave: (t: Partial<Template> & { name: string; prompt: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [prompt, setPrompt] = useState(initial?.prompt ?? "");
  return (
    <Card className="space-y-3 p-4">
      <Input placeholder="Template name (e.g. 'Formal customer apology')" value={name} onChange={(e) => setName(e.target.value)} />
      <Input placeholder="Short description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
      <Textarea
        placeholder="Instructions, e.g. 'Convert the transcript into a formal apology email to a customer…'"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="min-h-[120px]"
      />
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel} className="gap-1.5"><X className="h-3.5 w-3.5" /> Cancel</Button>
        <Button size="sm" onClick={() => save()} disabled={!name.trim() || !prompt.trim()} className="gap-1.5">
          <Save className="h-3.5 w-3.5" /> Save
        </Button>
      </div>
    </Card>
  );

  function save() {
    onSave({ id: initial?.id, name: name.trim(), description: description.trim(), prompt: prompt.trim() });
  }
}
