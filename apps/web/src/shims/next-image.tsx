import type { ImgHTMLAttributes } from "react";

type ImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  priority?: boolean;
};

export default function Image({ priority: _priority, ...props }: ImageProps) {
  return <img {...props} />;
}
