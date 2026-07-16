import { type FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, CheckCircle2, KeyRound, Loader2, Save, Settings, SlidersHorizontal } from "lucide-react";
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
      toast.success("Provider configuration saved");
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
      <SettingsShell>
        <div className="settings-access">
          <Settings size={27} />
          <p className="section-kicker">Restricted control surface</p>
          <h1>Administrator access required.</h1>
          <p>Add your account email to <code>ADMIN_EMAILS</code> on the API server to manage global model providers.</p>
          <Link href="/dashboard"><ArrowLeft size={15} /> Return to the observatory</Link>
        </div>
      </SettingsShell>
    );
  }

  return (
    <SettingsShell>
      <main className="settings-page">
        <header className="settings-page__intro">
          <div>
            <p className="section-kicker">System configuration</p>
            <h1>Provider control.</h1>
            <p>Configure the global language and embedding models used by the memory pipeline.</p>
          </div>
          <div className="settings-health"><CheckCircle2 size={16} /><span>Configuration store</span><strong>Connected</strong></div>
        </header>

        {loading ? (
          <div className="settings-loading"><Loader2 className="animate-spin" size={24} /><span>Reading provider configuration</span></div>
        ) : (
          <form onSubmit={handleSubmit} className="settings-form">
            {error && <div className="form-error settings-form__error" role="alert"><AlertCircle size={16} /><span>{error}</span></div>}

            <section className="settings-section">
              <header><span>01</span><div><h2>Inference provider</h2><p>Select the API boundary used for chat completion requests.</p></div></header>
              <div className="provider-segment" role="group" aria-label="Language model provider">
                <ProviderOption label="OpenAI" detail="Direct model access" active={form.llmProvider === "openai"} onClick={() => setForm((current) => ({ ...current, llmProvider: "openai" }))} />
                <ProviderOption label="OpenRouter" detail="Multi-provider routing" active={form.llmProvider === "openrouter"} onClick={() => setForm((current) => ({ ...current, llmProvider: "openrouter" }))} />
              </div>
            </section>

            <section className="settings-section">
              <header><span>02</span><div><h2>Model assignment</h2><p>Models are applied to all newly processed requests.</p></div></header>
              <div className="settings-fields">
                <Field label="Language model" htmlFor="llm-model"><Input id="llm-model" required value={form.llmModel} onChange={(event) => setForm((current) => ({ ...current, llmModel: event.target.value }))} /></Field>
                <Field label="Embedding model" htmlFor="embedding-model"><Input id="embedding-model" required value={form.embeddingModel} onChange={(event) => setForm((current) => ({ ...current, embeddingModel: event.target.value }))} /></Field>
              </div>
            </section>

            <section className="settings-section">
              <header><span>03</span><div><h2>System credentials</h2><p>Leave saved credentials blank to keep the current encrypted value.</p></div></header>
              <div className="settings-fields">
                <Field label="OpenAI API key" htmlFor="openai-key" saved={settings?.hasOpenaiApiKey}><Input id="openai-key" type="password" autoComplete="new-password" placeholder={settings?.hasOpenaiApiKey ? "Encrypted value retained" : "sk-..."} value={form.openaiApiKey} onChange={(event) => setForm((current) => ({ ...current, openaiApiKey: event.target.value }))} /></Field>
                <Field label="OpenRouter API key" htmlFor="openrouter-key" saved={settings?.hasOpenrouterApiKey}><Input id="openrouter-key" type="password" autoComplete="new-password" placeholder={settings?.hasOpenrouterApiKey ? "Encrypted value retained" : "sk-or-v1-..."} value={form.openrouterApiKey} onChange={(event) => setForm((current) => ({ ...current, openrouterApiKey: event.target.value }))} /></Field>
              </div>
            </section>

            <section className="settings-section settings-section--compact">
              <header><span>04</span><div><h2>Diagnostic logging</h2><p>Enable verbose server logs while investigating provider behavior.</p></div></header>
              <button type="button" role="switch" aria-checked={form.debug} className={`settings-toggle ${form.debug ? "is-on" : ""}`} onClick={() => setForm((current) => ({ ...current, debug: !current.debug }))}><span /><strong>{form.debug ? "Enabled" : "Disabled"}</strong></button>
            </section>

            <footer className="settings-form__actions">
              <div><KeyRound size={15} /><span>Credentials are encrypted before storage.</span></div>
              <Button type="submit" disabled={saving}>{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save configuration</Button>
            </footer>
          </form>
        )}
      </main>
    </SettingsShell>
  );
}

function ProviderOption({ label, detail, active, onClick }: { label: string; detail: string; active: boolean; onClick: () => void }) {
  return <button type="button" className={active ? "is-active" : ""} onClick={onClick}><span>{active ? <CheckCircle2 size={16} /> : <SlidersHorizontal size={16} />}</span><div><strong>{label}</strong><small>{detail}</small></div></button>;
}

function Field({ label, htmlFor, saved, children }: { label: string; htmlFor: string; saved?: boolean; children: React.ReactNode }) {
  return <div className="field-stack settings-field"><div><Label htmlFor={htmlFor}>{label}</Label>{saved && <span>Saved</span>}</div>{children}</div>;
}

function SettingsShell({ children }: { children: React.ReactNode }) {
  return <div className="settings-shell"><header><Logo size={29} /><Link href="/dashboard"><ArrowLeft size={15} /> Observatory</Link></header>{children}</div>;
}
