import { useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { Braces, Focus, GitBranch } from "lucide-react";

type ContextLensProps = {
  children: ReactNode;
};

type LensStyle = CSSProperties & {
  "--lens-x": string;
  "--lens-y": string;
};

const workingSet = [
  { id: "#03", label: "Dreams of opening a bookstore", icon: Braces },
  { id: "#07", label: "Bringing her sister to the viewing", icon: GitBranch },
  { id: "#11", label: "Collecting favorite childhood books", icon: Focus }
];

export function ContextLens({ children }: ContextLensProps) {
  const [position, setPosition] = useState({ x: 66, y: 43 });

  function moveLens(event: PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const horizontalInset = Math.min(112, bounds.width / 2);
    const verticalInset = Math.min(112, bounds.height / 2);
    const x = Math.max(horizontalInset, Math.min(bounds.width - horizontalInset, event.clientX - bounds.left));
    const y = Math.max(verticalInset, Math.min(bounds.height - verticalInset, event.clientY - bounds.top));

    setPosition({
      x: (x / bounds.width) * 100,
      y: (y / bounds.height) * 100
    });
  }

  const style: LensStyle = {
    "--lens-x": `${position.x}%`,
    "--lens-y": `${position.y}%`
  };

  return (
    <div className="context-lens" style={style}>
      <div className="context-lens__meta">
        <span><Focus size={14} /> Context lens</span>
        <span className="context-lens__live">Live retrieval</span>
      </div>
      <div className="context-lens__stage" onPointerMove={moveLens}>
        {children}
        <div className="context-lens__veil" aria-hidden="true" />
        <div className="context-lens__reticle" aria-hidden="true">
          <span className="context-lens__coordinate">0.{Math.round(position.x)} / 0.{Math.round(position.y)}</span>
        </div>
      </div>
      <div className="working-set" aria-label="Example retrieved context">
        <div className="working-set__header">
          <span>Working context</span>
          <strong>3 recalled</strong>
        </div>
        <div className="working-set__items">
          {workingSet.map(({ id, label, icon: Icon }) => (
            <div className="working-set__item" key={id}>
              <span className="working-set__id">{id}</span>
              <Icon aria-hidden="true" size={14} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
