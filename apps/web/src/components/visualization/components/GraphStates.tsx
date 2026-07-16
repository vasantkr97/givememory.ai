import { AlertCircle, Database, Loader2 } from "lucide-react";

export function GraphLoading() {
  return <State icon={<Loader2 className="animate-spin" size={25} />} title="Mapping memory field" copy="Retrieving nodes and relationships." />;
}

export function GraphError() {
  return <State tone="error" icon={<AlertCircle size={25} />} title="Memory field unavailable" copy="The graph could not be loaded. Check the API connection and try again." />;
}

export function GraphEmpty() {
  return (
    <div className="graph-state graph-state--empty">
      <div>
        <div className="graph-state__empty-mark"><Database size={21} /></div>
        <span className="section-kicker">Empty memory field</span>
        <strong>Start with one durable fact.</strong>
        <p>Use the conversation panel to tell the agent a preference, decision, project, or event.</p>
      </div>
    </div>
  );
}

function State({ icon, title, copy, tone }: { icon: React.ReactNode; title: string; copy: string; tone?: "error" }) {
  return <div className={`graph-state ${tone === "error" ? "graph-state--error" : ""}`}><div>{icon}<strong>{title}</strong><p>{copy}</p></div></div>;
}
