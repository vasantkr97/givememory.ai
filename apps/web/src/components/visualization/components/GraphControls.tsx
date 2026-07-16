import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

interface GraphControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
}

export function GraphControls({ onZoomIn, onZoomOut, onResetView }: GraphControlsProps) {
  return (
    <div className="graph-controls" aria-label="Graph view controls">
      <Control label="Zoom in" onClick={onZoomIn}><ZoomIn size={16} /></Control>
      <Control label="Zoom out" onClick={onZoomOut}><ZoomOut size={16} /></Control>
      <Control label="Reset graph view" onClick={onResetView}><RotateCcw size={16} /></Control>
    </div>
  );
}

function Control({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" className="graph-controls__button" onClick={onClick} title={label} aria-label={label}>{children}</button>;
}
