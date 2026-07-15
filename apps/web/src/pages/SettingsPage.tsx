import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Save, Settings } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import type { ProviderSettings } from "@/types/api";

type SettingsForm = {
  llmProvider: "openai" | "openrouter";
  llmModel: string;
  embeddingModel: string;
  openaiApiKey: string;
  openrouterApiKey: string;
  debug: boolean;
};

const EMPTY_FORM: SettingsForm = {
  llmProvider: "openai",
  llmModel: "gpt-4o-mini",
  embeddingModel: "text-embedding-3-small",
  openaiApiKey: "",
  openrouterApiKey: "",
  debug: false
};

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<ProviderSettings | null>(null);
  const [form, setForm] = useState<SettingsForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.is_admin) {
      setLoading(false);
      return;
    }

    api.getProviderSettings()
      .then((value) => {
        setSettings(value);
        setForm({
          llmProvider: value.llmProvider,
          llmModel: value.llmModel,
          embeddingModel: value.embeddingModel,
          openaiApiKey: "",
          openrouterApiKey: "",
          debug: value.debug
        });
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load settings"))
      .finally(() => setLoading(false));
  }, [user?.is_admin]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const updated = await api.updateProviderSettings({
        llmProvider: form.llmProvider,
        llmModel: form.llmModel.trim(),
        embeddingModel: form.embeddingModel.trim(),
        debug: form.debug,
        ...(form.openaiApiKey.trim() ? { openaiApiKey: form.openaiApiKey.trim() } : {}),
        ...(form.openrouterApiKey.trim() ? { openrouterApiKey: form.openrouterApiKey.trim() } : {})
      });
      setSettings(updated);
      setForm((current) => ({ ...current, openaiApiKey: "", openrouterApiKey: "" }));
      toast.success("Provider settings saved");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Unable to save settings";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  if (!user?.is_admin) {
    return (
      <PageShell>
        <div className="mx-auto max-w-xl px-6 py-20 text-center">
          <Settings className="mx-auto mb-4 h-8 w-8 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">Admin access required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Add your account email to ADMIN_EMAILS on the API server to manage global providers.
          </p>
          <Link href="/dashboard" className="mt-6 inline-flex items-center gap-2 text-sm font-medium hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm text-muted-foreground">System configuration</p>
          <h1 className="mt-1 text-3xl font-semibold">Provider Settings</h1>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 border-t border-border pt-6">
            {error && <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

            <Field label="Provider" htmlFor="provider">
              <select
                id="provider"
                value={form.llmProvider}
                onChange={(event) => setForm((current) => ({ ...current, llmProvider: event.target.value as SettingsForm["llmProvider"] }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="openai">OpenAI</option>
                <option value="openrouter">OpenRouter</option>
              </select>
            </Field>

            <Field label="LLM model" htmlFor="llm-model">
              <Input id="llm-model" required value={form.llmModel} onChange={(event) => setForm((current) => ({ ...current, llmModel: event.target.value }))} />
            </Field>

            <Field label="Embedding model" htmlFor="embedding-model">
              <Input id="embedding-model" required value={form.embeddingModel} onChange={(event) => setForm((current) => ({ ...current, embeddingModel: event.target.value }))} />
            </Field>

            <Field label={`OpenAI API key${settings?.hasOpenaiApiKey ? " (saved)" : ""}`} htmlFor="openai-key">
              <Input id="openai-key" type="password" autoComplete="new-password" placeholder={settings?.hasOpenaiApiKey ? "Leave blank to keep the saved key" : "sk-..."} value={form.openaiApiKey} onChange={(event) => setForm((current) => ({ ...current, openaiApiKey: event.target.value }))} />
            </Field>

            <Field label={`OpenRouter API key${settings?.hasOpenrouterApiKey ? " (saved)" : ""}`} htmlFor="openrouter-key">
              <Input id="openrouter-key" type="password" autoComplete="new-password" placeholder={settings?.hasOpenrouterApiKey ? "Leave blank to keep the saved key" : "sk-or-v1-..."} value={form.openrouterApiKey} onChange={(event) => setForm((current) => ({ ...current, openrouterApiKey: event.target.value }))} />
            </Field>

            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" checked={form.debug} onChange={(event) => setForm((current) => ({ ...current, debug: event.target.checked }))} className="h-4 w-4 accent-amber-500" />
              Enable debug logging
            </label>

            <Button type="submit" disabled={saving} className="w-full sm:w-auto">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save settings
            </Button>
          </form>
        )}
      </main>
    </PageShell>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label htmlFor={htmlFor}>{label}</Label>{children}</div>;
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Logo size={30} />
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
