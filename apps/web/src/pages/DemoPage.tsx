import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, Braces, Focus, GitBranch } from "lucide-react";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { DEMO_DATA } from "@/lib/demo-data";

const DemoGraph = dynamic(
  () => import("@/components/visualization/DemoGraph").then((module) => module.DemoGraph),
  { ssr: false, loading: () => <div className="workspace-loading"><span className="workspace-loading__scan" /><p>Loading demonstration field</p></div> }
);

export default function DemoPage() {
  return (
    <div className="demo-shell">
      <MarketingHeader active="demo" />
      <main className="demo-workbench">
        <aside className="demo-brief">
          <div>
            <p className="section-kicker">Live memory field</p>
            <h1>Inspect how context connects.</h1>
            <p>Select any node to reveal its stored content and relationships. This field uses a prepared conversation so you can inspect the system without creating an account.</p>
          </div>

          <div className="demo-brief__sequence" aria-label="Demonstration sequence">
            <div><span>01</span><Braces size={15} /><p><strong>Fact extracted</strong>User prefers technical explanations</p></div>
            <div><span>02</span><GitBranch size={15} /><p><strong>Relationship found</strong>Connected to current project context</p></div>
            <div><span>03</span><Focus size={15} /><p><strong>Context recalled</strong>Selected for the next model response</p></div>
          </div>

          <AuthAction />
        </aside>
        <section className="demo-canvas" aria-label="Interactive example memory graph"><DemoGraph data={DEMO_DATA} /></section>
      </main>
    </div>
  );
}

function AuthAction() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="demo-brief__loading" />;

  return (
    <Button asChild className="w-full">
      <Link href={isAuthenticated ? "/dashboard" : "/signup"}>{isAuthenticated ? "Open your memory field" : "Create your memory space"}<ArrowRight size={16} /></Link>
    </Button>
  );
}
