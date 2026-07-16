import { Calendar, GitBranch, Link as LinkIcon, X } from "lucide-react";
import { getBubbleColor, getBubbleTextColor } from "@/lib/utils";
import type { Memory } from "@/types/memory";

interface MemoryDetailPanelProps {
  memory: Memory | null;
  linkedMemories: Memory[];
  onClose: () => void;
  onSelectMemory: (id: number) => void;
  useConstantColor?: boolean;
}

export function MemoryDetailPanel({ memory, linkedMemories, onClose, onSelectMemory, useConstantColor = false }: MemoryDetailPanelProps) {
  if (!memory) return null;

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function bubbleColor(item: Memory) {
    return getBubbleColor(item.type === "semantic" ? "semantic" : "bubble", item.created_at, useConstantColor);
  }

  return (
    <>
      <button type="button" className="memory-inspector__backdrop" onClick={onClose} aria-label="Close memory inspector" />
      <aside className="memory-inspector animate-slide-in-right" aria-label={`Memory ${memory.local_id} details`}>
        <header className="memory-inspector__header">
          <div className="memory-inspector__eyebrow"><span>Selected node</span><strong>#{String(memory.local_id).padStart(2, "0")}</strong></div>
          <button type="button" onClick={onClose} aria-label="Close memory inspector"><X size={17} /></button>
        </header>

        <div className="memory-inspector__body">
          <div className="memory-inspector__identity">
            <div className="memory-inspector__node" style={{ backgroundColor: bubbleColor(memory), color: getBubbleTextColor(memory.type === "semantic" ? "semantic" : "bubble") }}>{memory.local_id}</div>
            <div>
              <span>{memory.type === "semantic" ? "Semantic fact" : "Episodic memory"}</span>
              <time><Calendar size={12} /> {formatDate(memory.created_at)}</time>
            </div>
          </div>

          <section className="memory-inspector__content">
            <p className="section-kicker">Stored content</p>
            <h2>{memory.text}</h2>
          </section>

          <section className="memory-inspector__metrics" aria-label="Memory metrics">
            <div><span>Importance</span><strong>{Math.round(memory.importance * 100)}%</strong></div>
            <div><span>Connections</span><strong>{linkedMemories.length}</strong></div>
            <div><span>Status</span><strong className="is-active">Active</strong></div>
          </section>

          <section className="memory-inspector__connections">
            <div className="memory-inspector__section-title"><span><GitBranch size={14} /> Related context</span><strong>{linkedMemories.length}</strong></div>
            {linkedMemories.length > 0 ? (
              <div className="memory-inspector__list">
                {linkedMemories.map((linkedMemory) => (
                  <button type="button" key={linkedMemory.id} onClick={() => onSelectMemory(linkedMemory.id)}>
                    <span className="memory-inspector__linked-node" style={{ backgroundColor: bubbleColor(linkedMemory), color: getBubbleTextColor(linkedMemory.type === "semantic" ? "semantic" : "bubble") }}>{linkedMemory.local_id}</span>
                    <span><strong>{linkedMemory.text}</strong><small>{linkedMemory.type} · {formatDate(linkedMemory.created_at)}</small></span>
                    <LinkIcon size={13} />
                  </button>
                ))}
              </div>
            ) : (
              <p className="memory-inspector__empty">No related memories have crossed the similarity threshold yet.</p>
            )}
          </section>
        </div>
      </aside>
    </>
  );
}
