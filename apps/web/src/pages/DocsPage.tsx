import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Copy,
  Database,
  GitBranch,
  KeyRound,
  MessageSquareText,
  Network,
  ShieldCheck
} from "lucide-react";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { Button } from "@/components/ui/button";

const navigation = [
  { id: "overview", label: "Overview" },
  { id: "features", label: "Features" },
  { id: "installation", label: "Installation" },
  { id: "quick-start", label: "Quick start" },
  { id: "basic-usage", label: "Basic usage" },
  { id: "memory-types", label: "Memory types" },
  { id: "configuration", label: "Configuration" },
  { id: "api-reference", label: "API reference" },
  { id: "how-it-works", label: "How it works" }
];

const installCommands = `git clone https://github.com/vasantkr97/givememory.ai.git recalllayer
cd recalllayer

bun install
cp .env.example .env
bun run db:generate
bun run db:deploy
bun run dev`;

const envConfig = `DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
WEB_ORIGIN="http://localhost:5173"
CORS_ORIGINS="http://localhost:5173"
VITE_API_URL="http://localhost:4000"

JWT_SECRET_KEY="replace-with-a-long-random-secret"
ENCRYPTION_KEY="replace-with-a-different-long-random-secret"

LLM_PROVIDER="openrouter"
OPENROUTER_API_KEY="sk-or-v1-..."
LLM_MODEL="openai/gpt-4o-mini"
EMBEDDING_MODEL="openai/text-embedding-3-small"`;

const signUpExample = `const API_URL = "http://localhost:4000/api";

const response = await fetch(\`\${API_URL}/auth/signup\`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Ada",
    email: "ada@example.com",
    password: "a-secure-password"
  })
});

const { access_token } = await response.json();`;

const chatExample = `const response = await fetch(\`\${API_URL}/chat\`, {
  method: "POST",
  headers: {
    "Authorization": \`Bearer \${access_token}\`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    message: "I prefer concise TypeScript examples."
  })
});

const turn = await response.json();
console.log(turn.response);
console.log(turn.extracted_memories);`;

const searchExample = `const conversationsResponse = await fetch(
  \`\${API_URL}/conversations\`,
  { headers: { "Authorization": \`Bearer \${access_token}\` } }
);

const { conversations } = await conversationsResponse.json();
const conversationId = conversations[0].id;

const searchResponse = await fetch(\`\${API_URL}/memory/search\`, {
  method: "POST",
  headers: {
    "Authorization": \`Bearer \${access_token}\`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    conversationId,
    query: "How should answers be written for this user?",
    limit: 5,
    includeConnections: true
  })
});

const memories = await searchResponse.json();`;

const apiEndpoints = [
  ["POST", "/api/auth/signup", "Create an account and receive access and refresh tokens."],
  ["POST", "/api/auth/signin", "Sign in and receive a fresh token pair."],
  ["POST", "/api/chat", "Run one memory-aware conversation turn."],
  ["GET", "/api/conversations", "List conversations owned by the current user."],
  ["POST", "/api/memory/add", "Extract and store memories from a completed turn."],
  ["POST", "/api/memory/search", "Retrieve relevant memories with vector search."],
  ["PATCH", "/api/memory/:id", "Update a stored memory and regenerate its embedding."],
  ["DELETE", "/api/memory/:id", "Soft-delete a memory so it is no longer retrieved."]
];

export default function DocsPage() {
  return (
    <div className="observatory-page docs-shell">
      <MarketingHeader active="docs" />
      <div className="docs-layout">
        <aside className="docs-sidebar">
          <p>Documentation</p>
          <nav aria-label="Documentation sections">
            {navigation.map((item, index) => (
              <a href={`#${item.id}`} key={item.id}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                {item.label}
              </a>
            ))}
          </nav>
          <div className="docs-sidebar__meta"><span>Stack</span><strong>TypeScript / Bun</strong></div>
          <a
            className="docs-sidebar__github"
            href="https://github.com/vasantkr97/givememory.ai"
            target="_blank"
            rel="noreferrer"
          >
            View source <ArrowRight size={14} />
          </a>
        </aside>

        <main className="docs-content">
          <section id="overview" className="docs-hero">
            <p className="section-kicker">RecallLayer documentation</p>
            <h1>Persistent memory for AI agents.</h1>
            <p>RecallLayer extracts durable knowledge from conversation, stores it in PostgreSQL with pgvector, resolves stale facts, and retrieves the context that matters for each new turn.</p>
            <div className="docs-hero__actions">
              <Button asChild><a href="#installation">Get started <ArrowRight size={16} /></a></Button>
              <Link href="/demo">Open visual demo</Link>
            </div>
          </section>

          <DocSection id="features" number="01" title="Features" intro="A complete memory pipeline designed for conversational products and long-running agents.">
            <div className="docs-capabilities">
              <Capability icon={<Database size={17} />} title="PostgreSQL + pgvector" copy="Store application data and vector embeddings in one production database." />
              <Capability icon={<Network size={17} />} title="Meaning-based retrieval" copy="Find useful memories even when the current prompt uses different words." />
              <Capability icon={<GitBranch size={17} />} title="Connected memories" copy="Preserve relationships between semantic facts and episodic events." />
              <Capability icon={<ShieldCheck size={17} />} title="Conflict resolution" copy="Deactivate stale preferences before they can pollute future context." />
              <Capability icon={<KeyRound size={17} />} title="Provider controls" copy="Use OpenAI or OpenRouter with encrypted per-user API key storage." />
              <Capability icon={<MessageSquareText size={17} />} title="Inspectable conversations" copy="Review messages, extracted memories, and retrieval behavior in one place." />
            </div>
          </DocSection>

          <DocSection id="installation" number="02" title="Installation" intro="Run RecallLayer locally or deploy it against a managed PostgreSQL database such as Neon.">
            <CodeBlock filename="terminal" language="shell" code={installCommands} />
            <Callout title="Database requirement">Enable the <code>vector</code> extension before starting the API. The checked-in migrations create the application schema and vector indexes.</Callout>
          </DocSection>

          <DocSection id="quick-start" number="03" title="Quick start" intro="After the API and web app are running, create an account and send the first memory-aware message.">
            <CodeBlock filename="signup.ts" language="typescript" code={signUpExample} />
            <CodeBlock filename="chat.ts" language="typescript" code={chatExample} />
            <Callout title="Local URLs">The React app runs at <code>http://localhost:5173</code> and the Express API runs at <code>http://localhost:4000</code>.</Callout>
          </DocSection>

          <DocSection id="basic-usage" number="04" title="Basic usage" intro="Every turn can extract new memories automatically. You can also search the memory store directly when building custom agent workflows.">
            <div className="docs-concept-row">
              <Concept icon={<MessageSquareText size={16} />} label="Chat" value="complete a turn" />
              <Concept icon={<Network size={16} />} label="Extract" value="store durable context" />
              <Concept icon={<GitBranch size={16} />} label="Search" value="recover relevant memory" />
            </div>
            <CodeBlock filename="search-memory.ts" language="typescript" code={searchExample} />
          </DocSection>

          <DocSection id="memory-types" number="05" title="Memory types" intro="RecallLayer separates stable knowledge from time-bound experiences so retrieval can preserve both identity and chronology.">
            <div className="docs-memory-types">
              <article><span className="is-semantic" /><div><h3>Semantic facts</h3><p>Names, preferences, skills, tools, roles, locations, constraints, and other durable truths.</p></div></article>
              <article><span className="is-episodic" /><div><h3>Episodic memories</h3><p>Events, decisions, deadlines, milestones, blockers, and moments that may matter later.</p></div></article>
            </div>
          </DocSection>

          <DocSection id="configuration" number="06" title="Configuration" intro="Keep infrastructure, security, and model settings in environment variables. Provider settings can also be managed from the authenticated settings screen.">
            <CodeBlock filename=".env" language="shell" code={envConfig} />
            <Callout title="Production secrets">Use independent, high-entropy values for <code>JWT_SECRET_KEY</code> and <code>ENCRYPTION_KEY</code>. Never commit the populated <code>.env</code> file.</Callout>
          </DocSection>

          <DocSection id="api-reference" number="07" title="API reference" intro="Authenticated endpoints require an access token in the Authorization header using the Bearer scheme.">
            <div className="docs-memory-types docs-api-list">
              {apiEndpoints.map(([method, path, description]) => (
                <article key={`${method}-${path}`}>
                  <span className={method === "GET" ? "is-episodic" : "is-semantic"} />
                  <div><h3>{method} {path}</h3><p>{description}</p></div>
                </article>
              ))}
            </div>
          </DocSection>

          <DocSection id="how-it-works" number="08" title="How it works" intro="Each completed turn moves through a small, inspectable pipeline before its memories are available to future prompts.">
            <div className="docs-flow" aria-label="Memory pipeline">
              {[
                ["01", "Extract", "Identify durable facts and meaningful events."],
                ["02", "Resolve", "Add new knowledge or replace stale facts."],
                ["03", "Embed", "Generate vectors and store them in pgvector."],
                ["04", "Retrieve", "Rank active memories for the next turn."]
              ].map(([number, title, copy]) => <div key={number}><span>{number}</span><strong>{title}</strong><p>{copy}</p></div>)}
            </div>
            <div className="docs-architecture">
              <ArchitectureNode label="Conversation" detail="user and assistant turn" />
              <ArrowRight size={17} />
              <ArchitectureNode label="Memory pipeline" detail="extract, resolve, embed" />
              <ArrowRight size={17} />
              <ArchitectureNode label="PostgreSQL" detail="facts, events, vectors" />
              <ArrowRight size={17} />
              <ArchitectureNode label="Prompt context" detail="relevant memories only" />
            </div>
          </DocSection>

          <footer className="docs-footer">
            <div><p className="section-kicker">See the pipeline in motion</p><h2>Open the memory observatory.</h2></div>
            <Button asChild variant="outline"><Link href="/demo">View live memory <ArrowRight size={16} /></Link></Button>
          </footer>
        </main>

        <aside className="docs-rail" aria-label="Documentation summary">
          <div><span>Runtime</span><strong>Bun / Node.js</strong></div>
          <div><span>API</span><strong>Express</strong></div>
          <div><span>Database</span><strong>PostgreSQL</strong></div>
        </aside>
      </div>
    </div>
  );
}

function DocSection({ id, number, title, intro, children }: { id: string; number: string; title: string; intro: string; children: ReactNode }) {
  return <section id={id} className="docs-section"><header><span>{number}</span><div><h2>{title}</h2><p>{intro}</p></div></header><div className="docs-section__body">{children}</div></section>;
}

function CodeBlock({ filename, language, code }: { filename: string; language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return <div className="docs-code"><header><span>{filename}</span><small>{language}</small><button type="button" onClick={() => void copy()} aria-label={`Copy ${filename}`}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "Copied" : "Copy"}</button></header><pre><code>{code}</code></pre></div>;
}

function Callout({ title, children }: { title: string; children: ReactNode }) {
  return <aside className="docs-callout"><strong>{title}</strong><p>{children}</p></aside>;
}

function Capability({ icon, title, copy }: { icon: ReactNode; title: string; copy: string }) {
  return <article>{icon}<div><strong>{title}</strong><p>{copy}</p></div></article>;
}

function Concept({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div>{icon}<span>{label}</span><strong>{value}</strong></div>;
}

function ArchitectureNode({ label, detail }: { label: string; detail: string }) {
  return <div><strong>{label}</strong><span>{detail}</span></div>;
}
