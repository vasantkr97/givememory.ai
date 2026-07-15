import { useMemo, useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("popstate", callback);
  return () => window.removeEventListener("popstate", callback);
}

function snapshot() {
  return `${window.location.pathname}${window.location.search}`;
}

export function useRouter() {
  return useMemo(
    () => ({
      push(url: string) {
        window.history.pushState(null, "", url);
        window.dispatchEvent(new PopStateEvent("popstate"));
      },
      replace(url: string) {
        window.history.replaceState(null, "", url);
        window.dispatchEvent(new PopStateEvent("popstate"));
      },
      back() {
        window.history.back();
      }
    }),
    []
  );
}

export function usePathname() {
  useSyncExternalStore(subscribe, snapshot, snapshot);
  return window.location.pathname;
}

export function useSearchParams() {
  const value = useSyncExternalStore(subscribe, snapshot, snapshot);
  return useMemo(() => new URLSearchParams(window.location.search), [value]);
}
