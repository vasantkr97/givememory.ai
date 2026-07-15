import type { AnchorHTMLAttributes, ReactNode } from "react";

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: ReactNode;
};

export default function Link({ href, onClick, children, ...props }: LinkProps) {
  return (
    <a
      href={href}
      onClick={(event) => {
        onClick?.(event);
        if (
          !event.defaultPrevented &&
          event.button === 0 &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.altKey &&
          !event.shiftKey &&
          href.startsWith("/")
        ) {
          event.preventDefault();
          window.history.pushState(null, "", href);
          window.dispatchEvent(new PopStateEvent("popstate"));
        }
      }}
      {...props}
    >
      {children}
    </a>
  );
}
