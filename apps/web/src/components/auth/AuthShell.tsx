import type { ReactNode } from "react";
import Link from "next/link";
import { Check, Database, ScanSearch } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthShell({ eyebrow, title, description, children }: AuthShellProps) {
  return (
    <main className="auth-shell">
      <section className="auth-shell__story" aria-label="RecallLayer product overview">
        <div className="auth-shell__grid" aria-hidden="true" />
        <Link href="/" className="auth-shell__brand"><Logo size={30} /></Link>
        <div className="auth-shell__narrative">
          <p className="section-kicker">Persistent context infrastructure</p>
          <h2>Your agent should remember what the user already told it.</h2>
          <div className="auth-memory-trace" aria-hidden="true">
            <div className="auth-memory-trace__node auth-memory-trace__node--one">01</div>
            <div className="auth-memory-trace__line" />
            <div className="auth-memory-trace__node auth-memory-trace__node--two">02</div>
            <div className="auth-memory-trace__line auth-memory-trace__line--two" />
            <div className="auth-memory-trace__node auth-memory-trace__node--three">03</div>
          </div>
          <ul className="auth-shell__proof">
            <li><Check size={15} /> Semantic fact extraction</li>
            <li><ScanSearch size={15} /> Meaning-based retrieval</li>
            <li><Database size={15} /> PostgreSQL + pgvector persistence</li>
          </ul>
        </div>
        <p className="auth-shell__footnote">Your data stays inspectable. Your context stays portable.</p>
      </section>

      <section className="auth-shell__form">
        <div className="auth-shell__form-inner">
          <div className="auth-shell__mobile-brand"><Logo size={30} /></div>
          <p className="section-kicker">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="auth-shell__description">{description}</p>
          <div className="auth-shell__fields">{children}</div>
          <p className="auth-shell__security">Encrypted credentials · Isolated conversations · Revocable sessions</p>
        </div>
      </section>
    </main>
  );
}
