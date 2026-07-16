import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Check, Copy, Database, GitBranch, KeyRound, MessageSquareText, Network, ShieldCheck } from "lucide-react";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { Button } from "@/components/ui/button";

const navigation = [
  { id: "overview", label: "Overview" },
  { id: "installation", label: "Installation" },
  { id: "quick-start", label: "Quick start" },
  { id: "basic-usage", label: "Basic usage" },
  { id: "chat-example", label: "Chat example" },
  { id: "memory-types", label: "Memory types" },
  { id: "self-host", label: "Self-host" },
  { id: "api-reference", label: "API reference" },
  { id: "publishing", label: "Publishing" }
];

const installCommands = `bun add @recalllayer/core @recalllayer/db @recalllayer/shared @prisma/client

# npm users
npm install @recalllayer/core @recalllayer/db @recalllayer/shared @prisma/client`;

const envConfig = `DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
OPENROUTER_API_KEY="sk-or-v1-..."
# or
OPENAI_API_KEY="sk-..."

LLM_PROVIDER="openrouter"
LLM_MODEL="openai/gpt-4o-mini"
EMBEDDING_MODEL="openai/text-embedding-3-small"`;

const quickStart = `import { prisma, ensurePgVector } from "@recalllayer/db";
import { createRecallLayerServices, runWithLlmOverride } from "@recalllayer/core";

await ensurePgVector();

const recall = createRecallLayerServices(prisma);
const conversation = await recall.stores.conversationStore.create();

await runWithLlmOverride(
  {
    provider: "openrouter",
    apiKey: process.env.OPENROUTER_API_KEY!,
    llmModel: "openai/gpt-4o-mini",
    embeddingModel: "openai/text-embedding-3-small"
  },
  async () => {
    await recall.services.contextMemory.add(
      [
        { role: "user", content: "I prefer concise TypeScript examples." },
        { role: "assistant", content: "Got it. I will keep examples concise." }
      ],
      conversation.id
    );

    const memories = await recall.services.contextMemory.search(
      "How should I explain code to this user?",
      conversation.id,
      5
    );

    console.log(memories.results);
  }
);`;

const addMemory = `await recall.services.contextMemory.add(
  [
    { role: "user", content: "My name is Ada and I deploy services on Neon." },
    { role: "assistant", content: "Nice to meet you, Ada." }
  ],
  conversation.id
);

// Stores semantic facts such as:
// - User name is Ada
// - User deploys services on Neon`;

const searchMemory = `const results = await recall.services.contextMemory.search(
  "What database does the user use in production?",
  conversation.id,
  5
);

for (const result of results.results) {
  console.log(result.memory, result.score);
}`;

const updateDelete = `await recall.services.contextMemory.update(
  42,
  "User deploys TypeScript services on Neon"
);

await recall.services.contextMemory.delete(42);`;

const chatExample = `import OpenAI from "openai";
import { prisma, ensurePgVector } from "@recalllayer/db";
import { createRecallLayerServices, runWithLlmOverride } from "@recalllayer/core";

await ensurePgVector();

const recall = createRecallLayerServices(prisma);
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1"
});

async function chat(message: string, conversationId: number) {
  return runWithLlmOverride(
    {
      provider: "openrouter",
      apiKey: process.env.OPENROUTER_API_KEY!,
      llmModel: "openai/gpt-4o-mini",
      embeddingModel: "openai/text-embedding-3-small"
    },
    async () => {
      const memories = await recall.services.contextMemory.search(message, conversationId, 5);
      const memoryText = memories.results.map((item) => "- " + item.memory).join("\\n");

      const response = await openai.chat.completions.create({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Use these memories when relevant:\\n" + (memoryText || "No memories yet.")
          },
          { role: "user", content: message }
        ]
      });

      const answer = response.choices[0]?.message?.content ?? "";

      await recall.services.contextMemory.add(
        [
          { role: "user", content: message },
          { role: "assistant", content: answer }
        ],
        conversationId
      );

      return answer;
    }
  );
}`;

const selfHostCommands = `git clone https://github.com/vasantkr97/recalllayer.ai.git
cd recalllayer.ai

bun install
cp .env.example .env
bun run db:generate
bun run db:deploy
bun run dev`;

const publishCommands = `bun run typecheck
bun test
bun run build

npm publish packages/shared --access public
npm publish packages/db --access public
npm publish packages/core --access public`;

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
          <div className="docs-sidebar__meta"><span>Package</span><strong>TypeScript SDK</strong></div>
          <a className="docs-sidebar__github" href="https://github.com/vasantkr97/recalllayer.ai" target="_blank" rel="noreferrer">View source <ArrowRight size={14} /></a>
        </aside>

        <main className="docs-content">
          <section id="overview" className="docs-hero">
            <p className="section-kicker">RecallLayer package</p>
            <h1>Install memory into your agent.</h1>
            <p>RecallLayer is a TypeScript long-term memory layer for AI products. It extracts durable facts from conversation turns, stores them in PostgreSQL with pgvector, updates stale memories, and retrieves the right context before the next response.</p>
            <div className="docs-hero__actions">
              <Button asChild><a href="#installation">Install package <ArrowRight size={16} /></a></Button>
              <Link href="/demo">Open visual demo</Link>
            </div>
            <div className="docs-capabilities">
              <Capability icon={<Database size={17} />} title="PostgreSQL + pgvector" copy="A production-shaped database and vector search layer instead of local-only files." />
              <Capability icon={<Network size={17} />} title="Semantic and episodic" copy="Stable facts and time-bound memories are stored separately but connected." />
              <Capability icon={<ShieldCheck size={17} />} title="Replace stale context" copy="Contradictions and preference changes are handled before retrieval." />
            </div>
          </section>

          <DocSection id="installation" number="01" title="Installation" intro="Use RecallLayer as a TypeScript package inside your own AI app, worker, or agent runtime. Bun is the first-class runtime, but the package API is normal ESM TypeScript.">
            <CodeBlock filename="terminal" language="shell" code={installCommands} />
            <Callout title="Current repo status">If the npm packages are not published yet, use the monorepo workspace locally. The package names and public API are the install target.</Callout>
          </DocSection>

          <DocSection id="quick-start" number="02" title="Quick start" intro="Create the service graph once, then call the core memory API. The database stores messages, memories, embeddings, summaries, and provider settings.">
            <CodeBlock filename="quickstart.ts" language="typescript" code={quickStart} />
            <CodeBlock filename=".env" language="shell" code={envConfig} />
          </DocSection>

          <DocSection id="basic-usage" number="03" title="Basic usage" intro="The main interface is contextMemory. It has the same shape as the old Python package: add, search, update, and delete.">
            <div className="docs-concept-row">
              <Concept icon={<MessageSquareText size={16} />} label="Add" value="extract facts" />
              <Concept icon={<Network size={16} />} label="Search" value="retrieve context" />
              <Concept icon={<GitBranch size={16} />} label="Update" value="replace stale memory" />
            </div>
            <CodeBlock filename="add.ts" language="typescript" code={addMemory} />
            <CodeBlock filename="search.ts" language="typescript" code={searchMemory} />
            <CodeBlock filename="update-delete.ts" language="typescript" code={updateDelete} />
          </DocSection>

          <DocSection id="chat-example" number="04" title="Full chat example" intro="A typical agent turn retrieves memories first, writes a model response with those memories, then stores new memories from the completed user/assistant pair.">
            <CodeBlock filename="chat-with-memory.ts" language="typescript" code={chatExample} />
          </DocSection>

          <DocSection id="memory-types" number="05" title="Memory types" intro="RecallLayer stores two kinds of memory. Semantic facts are durable user truths. Episodic memories are moments that matter and can connect back to facts.">
            <div className="docs-memory-types">
              <article><span className="is-semantic" /><div><h3>Semantic fact</h3><p>Name, preferences, skills, tools, roles, locations, constraints, and durable background context.</p></div></article>
              <article><span className="is-episodic" /><div><h3>Episodic memory</h3><p>Important events, decisions, deadlines, bugs, blockers, and moments that need future follow-up.</p></div></article>
            </div>
            <div className="docs-flow" aria-label="Memory pipeline">
              {[
                ["01", "Extract", "Read only the latest interaction."],
                ["02", "Classify", "Choose ADD, UPDATE, REPLACE, or NOOP."],
                ["03", "Embed", "Store vectors in pgvector."],
                ["04", "Retrieve", "Rank active memories per conversation."]
              ].map(([number, title, copy]) => <div key={number}><span>{number}</span><strong>{title}</strong><p>{copy}</p></div>)}
            </div>
          </DocSection>

          <DocSection id="self-host" number="06" title="Self-host the dashboard" intro="Use the full monorepo when you want the hosted-style product: Express API, React memory observatory, auth, encrypted user API keys, and settings UI.">
            <CodeBlock filename="terminal" language="shell" code={selfHostCommands} />
            <Callout title="Neon recommended">For the production-like path, use Neon PostgreSQL with the vector extension enabled and run <code>bun run db:deploy</code>.</Callout>
          </DocSection>

          <DocSection id="api-reference" number="07" title="API reference" intro="The package API is intentionally small. Most apps only need to create services, add completed turns, search memories, and occasionally update or delete memory rows.">
            <div className="docs-memory-types">
              <article><span className="is-semantic" /><div><h3>createRecallLayerServices(db)</h3><p>Builds stores and services around a Prisma client.</p></div></article>
              <article><span className="is-episodic" /><div><h3>runWithLlmOverride(config, fn)</h3><p>Runs a memory operation with a request-scoped provider, model, and API key.</p></div></article>
            </div>
            <div className="docs-architecture">
              <ArchitectureNode label="contextMemory.add" detail="extract and store" />
              <ArrowRight size={17} />
              <ArchitectureNode label="contextMemory.search" detail="retrieve relevant facts" />
              <ArrowRight size={17} />
              <ArchitectureNode label="contextMemory.update" detail="edit memory text" />
              <ArrowRight size={17} />
              <ArchitectureNode label="contextMemory.delete" detail="soft delete" />
            </div>
          </DocSection>

          <DocSection id="publishing" number="08" title="Publishing path" intro="The TypeScript package should be published to npm first. A Python pip package should come later as a small client SDK that talks to the RecallLayer API, not as a second core implementation.">
            <CodeBlock filename="release-checklist.sh" language="shell" code={publishCommands} />
            <Callout title="Do not fake pip support">Use <code>pip install recalllayer</code> only after building a real Python client. For the current product, lead with <code>bun add @recalllayer/core</code>.</Callout>
          </DocSection>

          <footer className="docs-footer">
            <div><p className="section-kicker">Ready to inspect it live?</p><h2>Open the memory observatory.</h2></div>
            <Button asChild variant="outline"><Link href="/demo">View live memory <ArrowRight size={16} /></Link></Button>
          </footer>
        </main>

        <aside className="docs-rail" aria-label="Page status">
          <div><span>Status</span><strong><i /> Beta</strong></div>
          <div><span>Runtime</span><strong>Bun / Node</strong></div>
          <div><span>Install</span><strong>npm package</strong></div>
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
