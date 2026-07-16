import Link from "next/link";
import { ArrowRight, ArrowUpRight, Braces, Database, GitBranch, ScanSearch, ShieldCheck, Sparkles } from "lucide-react";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { Button } from "@/components/ui/button";
import { ContextLens } from "@/components/visualization/ContextLens";
import { LandingHeroGraph } from "@/components/visualization/LandingHeroGraph";
import { DEMO_DATA } from "@/lib/demo-data";

const stages = [
  {
    number: "01",
    label: "Observe",
    title: "A conversation happens",
    copy: "RecallLayer receives the same user and assistant messages your application already produces.",
    icon: Braces
  },
  {
    number: "02",
    label: "Structure",
    title: "Useful facts emerge",
    copy: "The extraction pipeline separates durable semantic facts from time-bound episodic events.",
    icon: Sparkles
  },
  {
    number: "03",
    label: "Recall",
    title: "Meaning finds meaning",
    copy: "pgvector ranks conversation-scoped memories and returns only the context relevant to the next turn.",
    icon: ScanSearch
  },
  {
    number: "04",
    label: "Respond",
    title: "The model continues",
    copy: "Retrieved evidence joins the prompt, giving the agent continuity without replaying its entire history.",
    icon: GitBranch
  }
];

export default function LandingPage() {
  return (
    <div className="observatory-page landing-page">
      <MarketingHeader active="home" />

      <main>
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-hero__lens" aria-label="Interactive memory context visualization">
            <ContextLens>
              <LandingHeroGraph data={DEMO_DATA} />
            </ContextLens>
          </div>

          <div className="landing-hero__content">
            <p className="section-kicker">Long-term memory infrastructure</p>
            <h1 id="landing-title">RecallLayer<span>.ai</span></h1>
            <p className="landing-hero__statement">
              Your AI agent can finally remember what matters.
            </p>
            <p className="landing-hero__copy">
              Extract durable facts from conversation, retrieve them by meaning, and place the right evidence back into the model&apos;s working context.
            </p>
            <div className="landing-hero__actions">
              <Button asChild size="lg"><Link href="/signup">Start building <ArrowRight size={17} /></Link></Button>
              <Link href="/demo" className="landing-text-link">
                Watch memory form <ArrowUpRight size={16} />
              </Link>
            </div>
            <div className="landing-hero__assurance" aria-label="Platform qualities">
              <span><Database size={14} /> PostgreSQL native</span>
              <span><ShieldCheck size={14} /> Self-hostable</span>
              <span><Braces size={14} /> TypeScript first</span>
            </div>
          </div>

          <div className="landing-hero__telemetry" aria-label="Retrieval trace example">
            <div><span>Memory field</span><strong>12 facts</strong></div>
            <div><span>Lens acquired</span><strong>3 memories</strong></div>
            <div><span>Prompt payload</span><strong>468 tokens</strong></div>
            <div><span>Context state</span><strong className="is-live">Ready</strong></div>
          </div>
        </section>

        <section className="landing-manifesto" aria-labelledby="manifesto-title">
          <div>
            <p className="section-kicker">The problem</p>
            <h2 id="manifesto-title">Context windows forget. Memory systems recover.</h2>
          </div>
          <div className="landing-manifesto__copy">
            <p>
              Larger prompts are not durable memory. They are expensive snapshots. RecallLayer keeps an inspectable record outside the model, then selects what deserves attention now.
            </p>
            <p className="landing-manifesto__aside">Finite attention. Growing knowledge.</p>
          </div>
        </section>

        <section className="memory-pipeline" aria-labelledby="pipeline-title">
          <header className="memory-pipeline__header">
            <div>
              <p className="section-kicker">One turn, end to end</p>
              <h2 id="pipeline-title">A memory pipeline you can inspect</h2>
            </div>
            <p>Every stage maps to working product behavior, from message ingestion to vector-ranked recall.</p>
          </header>

          <div className="memory-pipeline__stages">
            {stages.map(({ number, label, title, copy, icon: Icon }) => (
              <article className="pipeline-stage" key={number}>
                <div className="pipeline-stage__meta"><span>{number}</span><Icon size={17} /></div>
                <p>{label}</p>
                <h3>{title}</h3>
                <div className="pipeline-stage__signal" aria-hidden="true"><span /></div>
                <p className="pipeline-stage__copy">{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="retrieval-proof" aria-labelledby="proof-title">
          <div className="retrieval-proof__copy">
            <p className="section-kicker">Retrieval trace</p>
            <h2 id="proof-title">See why the model remembered.</h2>
            <p>
              RecallLayer exposes the selected facts, their relationships, and the resulting working set. No invisible personalization layer. No mystery state.
            </p>
            <Link href="/demo" className="landing-text-link landing-text-link--light">
              Open the live observatory <ArrowRight size={16} />
            </Link>
          </div>

          <div className="retrieval-console" aria-label="Example retrieval output">
            <div className="retrieval-console__topbar">
              <span>retrieval.trace</span>
              <span>143 ms</span>
            </div>
            <div className="retrieval-console__query">
              <span>QUERY</span>
              <p>“Which stack should I use for the deployment?”</p>
            </div>
            <div className="retrieval-console__results">
              <TraceRow rank="01" score="0.94" type="SEMANTIC" text="User builds production services with TypeScript" />
              <TraceRow rank="02" score="0.89" type="SEMANTIC" text="User deploys PostgreSQL workloads on Neon" />
              <TraceRow rank="03" score="0.83" type="EPISODIC" text="Discussed a Bun and Express deployment" />
            </div>
            <div className="retrieval-console__footer">
              <span>3 selected / 12 searched</span>
              <strong>Context assembled</strong>
            </div>
          </div>
        </section>

        <section className="architecture-strip" aria-label="Technology architecture">
          <div className="architecture-strip__intro">
            <p className="section-kicker">Production-shaped foundations</p>
            <h2>Memory infrastructure built from parts you already trust.</h2>
          </div>
          <div className="architecture-strip__stack">
            <StackItem value="Bun + Express" label="Typed API boundary" />
            <StackItem value="PostgreSQL" label="Durable source of truth" />
            <StackItem value="pgvector" label="Similarity retrieval" />
            <StackItem value="OpenRouter" label="Model portability" />
          </div>
        </section>

        <section className="landing-cta">
          <div>
            <p className="section-kicker">Give your agent continuity</p>
            <h2>Build the next conversation on everything the agent has learned.</h2>
          </div>
          <div className="landing-cta__actions">
            <Button asChild size="lg"><Link href="/signup">Create a memory space <ArrowRight size={17} /></Link></Button>
            <Link href="/docs">Read the API docs</Link>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div><span>RecallLayer.ai</span><p>Persistent context infrastructure for AI agents.</p></div>
        <div><Link href="/docs">Docs</Link><Link href="/demo">Demo</Link><a href="https://github.com/vasantkr97/recalllayer.ai" target="_blank" rel="noreferrer">GitHub</a></div>
        <span className="landing-footer__status"><i /> Public beta</span>
      </footer>
    </div>
  );
}

function TraceRow({ rank, score, type, text }: { rank: string; score: string; type: string; text: string }) {
  return (
    <div className="trace-row">
      <span>{rank}</span>
      <strong>{score}</strong>
      <small>{type}</small>
      <p>{text}</p>
    </div>
  );
}

function StackItem({ value, label }: { value: string; label: string }) {
  return <div><strong>{value}</strong><span>{label}</span></div>;
}
