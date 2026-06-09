import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ELEVEN_VOICES } from "@/lib/tts.functions";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — VoiceFlow" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [voiceId, setVoiceId] = useState(ELEVEN_VOICES[0].id);
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data?.display_name) setDisplayName(data.display_name);
    });
    const v = typeof window !== "undefined" ? localStorage.getItem("vf_voice") : null;
    if (v) setVoiceId(v);
  }, [user]);

  async function saveProfile() {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ display_name: displayName }).eq("id", user.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
  }

  async function changePassword() {
    if (!password) return;
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast.error(error.message);
    setPassword("");
    toast.success("Password updated");
  }

  function savePrefs() {
    localStorage.setItem("vf_voice", voiceId);
    localStorage.setItem("vf_notify", String(notify));
    toast.success("Preferences saved");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 md:p-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your profile, password, and preferences.</p>
      </div>

      <Card className="space-y-4 p-6">
        <h2 className="text-sm font-semibold">Profile</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={user?.email ?? ""} disabled />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dn">Display name</Label>
            <Input id="dn" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={saveProfile} disabled={busy}>Save profile</Button>
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className="text-sm font-semibold">Password</h2>
        <div className="space-y-1.5">
          <Label htmlFor="pw">New password</Label>
          <Input id="pw" type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <div className="flex justify-end">
          <Button variant="outline" onClick={changePassword} disabled={busy || !password}>Change password</Button>
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className="text-sm font-semibold">Preferences</h2>
        <div className="space-y-1.5">
          <Label>Default AI voice (TTS)</Label>
          <Select value={voiceId} onValueChange={setVoiceId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ELEVEN_VOICES.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label>In-app notifications</Label>
            <p className="text-xs text-muted-foreground">When processing & generations complete.</p>
          </div>
          <Switch checked={notify} onCheckedChange={setNotify} />
        </div>
        <div className="flex justify-end">
          <Button onClick={savePrefs}>Save preferences</Button>
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className="text-sm font-semibold">Account</h2>
        <p className="text-sm text-muted-foreground">Sign out of VoiceFlow on this device.</p>
        <div className="flex justify-end">
          <Button variant="destructive" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
            Sign out
          </Button>
        </div>
      </Card>
    </div>
  );
}
