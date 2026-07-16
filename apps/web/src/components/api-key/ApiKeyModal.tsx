import { useState } from "react";
import { AlertCircle, Check, CheckCircle2, ExternalLink, KeyRound, Loader2, LockKeyhole, ShieldCheck, X, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ApiKeyModalProps {
  onSuccess?: () => void;
  onClose?: () => void;
  canClose?: boolean;
}

export function ApiKeyModal({ onSuccess, onClose, canClose = false }: ApiKeyModalProps) {
  const { refreshApiKeyStatus } = useAuth();
  const [apiKey, setApiKey] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; message: string } | null>(null);
  const [error, setError] = useState("");

  async function handleValidate() {
    if (!apiKey.trim()) return;
    setIsValidating(true);
    setValidationResult(null);
    setError("");

    try {
      setValidationResult(await api.validateApiKey(apiKey.trim()));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The key could not be validated");
    } finally {
      setIsValidating(false);
    }
  }

  async function handleSave() {
    if (!apiKey.trim() || !validationResult?.valid) return;
    setIsSaving(true);
    setError("");

    try {
      await api.storeApiKey(apiKey.trim());
      await refreshApiKeyStatus();
      onSuccess?.();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The key could not be saved");
    } finally {
      setIsSaving(false);
    }
  }

  const stage = validationResult?.valid ? 3 : apiKey.trim() ? 2 : 1;

  return (
    <div className="key-dialog" role="presentation">
      <button className="key-dialog__backdrop" type="button" onClick={canClose ? onClose : undefined} aria-label={canClose ? "Close API key setup" : undefined} />
      <section className="key-dialog__panel" role="dialog" aria-modal="true" aria-labelledby="api-key-title">
        <header className="key-dialog__header">
          <div><span>Provider credential</span><strong>OpenRouter</strong></div>
          {canClose && onClose && <button type="button" onClick={onClose} aria-label="Close"><X size={18} /></button>}
        </header>

        <div className="key-dialog__body">
          <div className="key-dialog__intro">
            <span className="key-dialog__icon"><KeyRound size={22} /></span>
            <p className="section-kicker">Continue with your model access</p>
            <h2 id="api-key-title">Connect OpenRouter securely.</h2>
            <p>Your key authorizes model requests after the included trial. It is encrypted before it is stored and is never returned to the browser.</p>
          </div>

          <ol className="key-dialog__stages" aria-label="API key setup progress">
            <Stage number={1} label="Enter" active={stage >= 1} complete={stage > 1} />
            <Stage number={2} label="Verify" active={stage >= 2} complete={stage > 2} />
            <Stage number={3} label="Encrypt" active={stage >= 3} complete={false} />
          </ol>

          {error && <div className="form-error" role="alert"><AlertCircle size={16} /><span>{error}</span></div>}

          <div className="field-stack key-dialog__field">
            <Label htmlFor="apiKey">OpenRouter API key</Label>
            <Input
              id="apiKey"
              type="password"
              autoComplete="off"
              placeholder="sk-or-v1-..."
              value={apiKey}
              onChange={(event) => {
                setApiKey(event.target.value);
                setValidationResult(null);
              }}
              disabled={isValidating || isSaving}
              autoFocus
            />
          </div>

          {validationResult && (
            <div className={`key-dialog__validation ${validationResult.valid ? "is-valid" : "is-invalid"}`} role="status">
              {validationResult.valid ? <CheckCircle2 size={17} /> : <XCircle size={17} />}
              <span>{validationResult.message}</span>
            </div>
          )}

          <div className="key-dialog__actions">
            <Button variant="outline" onClick={() => void handleValidate()} disabled={!apiKey.trim() || isValidating || isSaving}>
              {isValidating ? <><Loader2 size={16} className="animate-spin" /> Verifying</> : <><ShieldCheck size={16} /> Verify key</>}
            </Button>
            <Button onClick={() => void handleSave()} disabled={!validationResult?.valid || isSaving}>
              {isSaving ? <><Loader2 size={16} className="animate-spin" /> Encrypting</> : <><LockKeyhole size={16} /> Save securely</>}
            </Button>
          </div>

          <div className="key-dialog__security">
            <span><Check size={13} /> Authenticated encryption at rest</span>
            <span><Check size={13} /> Key value never exposed by the API</span>
          </div>
        </div>

        <footer className="key-dialog__footer">
          <span>Need a key?</span>
          <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer">Open OpenRouter <ExternalLink size={13} /></a>
        </footer>
      </section>
    </div>
  );
}

function Stage({ number, label, active, complete }: { number: number; label: string; active: boolean; complete: boolean }) {
  return <li className={active ? "is-active" : ""}><span>{complete ? <Check size={12} /> : number}</span><strong>{label}</strong></li>;
}
