import { lazy, Suspense, type ComponentProps, type ComponentType, type ReactNode } from "react";

type DynamicOptions = {
  loading?: () => ReactNode;
  ssr?: boolean;
};

export default function dynamic<T extends ComponentType<any>>(
  loader: () => Promise<T | { default: T }>,
  options?: DynamicOptions
) {
  const LazyComponent = lazy(async () => {
    const loaded = await loader();
    if (typeof loaded === "function") {
      return { default: loaded };
    }
    return loaded as { default: T };
  });

  return function DynamicComponent(props: ComponentProps<T>) {
    return (
      <Suspense fallback={options?.loading?.() ?? null}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}
