import Link from "next/link";

interface LogoProps {
  size?: number;
  showText?: boolean;
}

export function Logo({ size = 48, showText = true }: LogoProps) {
  return (
    <Link href="/" className="brand-mark group" aria-label="RecallLayer.ai home">
      <span
        className="brand-mark__image"
        style={{ width: size, height: size }}
      >
        <RecallLayerMark />
      </span>

      {showText && (
        <span className="brand-mark__name">
          RecallLayer<span>.ai</span>
        </span>
      )}
    </Link>
  );
}

function RecallLayerMark() {
  return (
    <svg
      className="recall-mark"
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <circle className="recall-mark__layer recall-mark__layer--back" cx="16" cy="16" r="10.75" />
      <circle className="recall-mark__layer recall-mark__layer--front" cx="24" cy="24" r="10.75" />
      <circle className="recall-mark__node" cx="26.5" cy="13.5" r="3.35" />
    </svg>
  );
}
