interface GraphLegendProps {
  totalMemories: number;
  selectedId: number | null;
  visibleLinkCount: number;
}

export function GraphLegend({ totalMemories, selectedId, visibleLinkCount }: GraphLegendProps) {
  return (
    <div className="graph-legend">
      <div className="graph-legend__header"><span>Memory field</span><strong>{totalMemories} nodes</strong></div>
      <div className="graph-legend__types">
        <div><i className="is-semantic" /><span>Semantic</span></div>
        <div><i className="is-episodic" /><span>Episodic</span></div>
      </div>
      {selectedId !== null && <p>{visibleLinkCount} visible connection{visibleLinkCount === 1 ? "" : "s"}</p>}
    </div>
  );
}
