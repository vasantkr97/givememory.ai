"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { 
  ArrowRight, 
  ChevronDown, 
  LogOut, 
  Mail, 
  BookOpen, 
  LayoutDashboard, 
  Brain, 
  Zap, 
  RefreshCw, 
  GitBranch, 
  Settings, 
  Database,
  Menu,
  X,
  Copy,
  Check,
  ChevronRight
} from "lucide-react";

const sections = [
  { id: "features", label: "Features" },
  { id: "installation", label: "Installation" },
  { id: "quick-start", label: "Quick Start" },
  { id: "basic-usage", label: "Basic Usage" },
  { id: "memory-types", label: "Memory Types" },
  { id: "full-example", label: "Full Example" },
  { id: "configuration", label: "Configuration" },
  { id: "api-reference", label: "API Reference" },
  { id: "how-it-works", label: "How It Works" },
];

type CodeLanguage = "typescript" | "bash" | "env";

function CodeBlock({ code, filename, language = "typescript" }: { code: string; filename?: string; language?: CodeLanguage }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Lightweight TypeScript highlighting for the documentation examples.
  const highlightCode = (code: string, lang: CodeLanguage): React.ReactNode => {
    if (lang === "bash" || lang === "env") {
      return <span className="text-[#dcdcaa]">{code}</span>;
    }

    const lines = code.split('\n');
    return lines.map((line, lineIndex) => {
      const parts: React.ReactNode[] = [];
      let remaining = line;
      let key = 0;

      while (remaining.length > 0) {
        if (remaining.startsWith('//')) {
          parts.push(<span key={key++} className="text-[#6a9955]">{remaining}</span>);
          remaining = '';
          continue;
        }

        const stringMatch = remaining.match(/^(?:"(?:\\.|[^"])*"|'(?:\\.|[^'])*')/);
        if (stringMatch) {
          const value = stringMatch[0];
          parts.push(<span key={key++} className="text-[#ce9178]">{value}</span>);
          remaining = remaining.slice(value.length);
          continue;
        }

        const keywordMatch = remaining.match(/^(import|export|from|const|let|var|function|class|interface|type|extends|implements|if|else|for|while|try|catch|finally|throw|return|async|await|new|true|false|null|undefined)\b/);
        if (keywordMatch) {
          parts.push(<span key={key++} className="text-[#c586c0]">{keywordMatch[1]}</span>);
          remaining = remaining.slice(keywordMatch[1].length);
          continue;
        }

        const classMatch = remaining.match(/^([A-Z][a-zA-Z0-9_]*)/);
        if (classMatch) {
          parts.push(<span key={key++} className="text-[#4ec9b0]">{classMatch[1]}</span>);
          remaining = remaining.slice(classMatch[1].length);
          continue;
        }

        const funcMatch = remaining.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/);
        if (funcMatch) {
          parts.push(<span key={key++} className="text-[#dcdcaa]">{funcMatch[1]}</span>);
          remaining = remaining.slice(funcMatch[1].length);
          continue;
        }

        const numMatch = remaining.match(/^(\d+\.?\d*)/);
        if (numMatch) {
          parts.push(<span key={key++} className="text-[#b5cea8]">{numMatch[1]}</span>);
          remaining = remaining.slice(numMatch[1].length);
          continue;
        }

        parts.push(<span key={key++} className="text-[#d4d4d4]">{remaining[0]}</span>);
        remaining = remaining.slice(1);
      }
      
      return (
        <React.Fragment key={lineIndex}>
          {parts}
          {lineIndex < lines.length - 1 && '\n'}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="relative group rounded-xl border border-border/60 bg-[#1C1C1C] overflow-hidden">
      {filename && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-[#252525]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
            <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
            <span className="w-3 h-3 rounded-full bg-[#28C840]" />
            <span className="ml-3 text-xs text-white/40 font-mono">{filename}</span>
          </div>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
            aria-label="Copy code"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      )}
      <pre className="p-4 text-sm leading-relaxed font-mono overflow-x-auto bg-[#1C1C1C]">
        <code>{highlightCode(code, language)}</code>
      </pre>
      {!filename && (
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 p-1.5 rounded-md text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
          aria-label="Copy code"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}

// Collapsible code block for large code examples
function CollapsibleCodeBlock({ code, filename, language = "typescript", previewLines = 15 }: { code: string; filename?: string; language?: CodeLanguage; previewLines?: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const lines = code.split('\n');
  const shouldCollapse = lines.length > previewLines;
  const displayCode = isExpanded || !shouldCollapse ? code : lines.slice(0, previewLines).join('\n') + '\n...';
  
  return (
    <div className="relative">
      <CodeBlock code={displayCode} filename={filename} language={language} />
      {shouldCollapse && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-2 text-sm text-muted-foreground hover:text-foreground bg-[#252525] border-t border-white/10 transition-colors flex items-center justify-center gap-2"
        >
          {isExpanded ? (
            <>
              <ChevronDown className="w-4 h-4 rotate-180" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Show full example ({lines.length} lines)
            </>
          )}
        </button>
      )}
    </div>
  );
}

export default function DocsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProductsDropdown, setShowProductsDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("features");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const productsDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setShowProfileDropdown(false);
      }
      if (productsDropdownRef.current && !productsDropdownRef.current.contains(target)) {
        setShowProductsDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    sections.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const handleLogout = async () => {
    await logout();
    setShowProfileDropdown(false);
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between relative">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Logo size={32} />
          </div>

          <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            <Link href="/docs" className="text-sm font-medium text-amber-600 transition-colors">
              Docs
            </Link>
            <div ref={productsDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowProfileDropdown(false);
                  setShowProductsDropdown((v) => !v);
                }}
                aria-expanded={showProductsDropdown}
                aria-haspopup="true"
                className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Products
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showProductsDropdown ? "rotate-180" : ""}`} />
              </button>
              {showProductsDropdown && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 top-full mt-2 min-w-[220px] bg-card border border-border rounded-xl shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-200"
                  role="menu"
                >
                  <Link
                    href="/docs"
                    role="menuitem"
                    onClick={() => setShowProductsDropdown(false)}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted/50 transition-colors border-b border-border"
                  >
                    <BookOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="flex flex-col gap-0.5">
                      <span>Pip package</span>
                      <span className="text-xs text-muted-foreground">Docs & API</span>
                    </span>
                  </Link>
                  <Link
                    href="/dashboard"
                    role="menuitem"
                    onClick={() => setShowProductsDropdown(false)}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="flex flex-col gap-0.5">
                      <span>Interactive dashboard</span>
                      <span className="text-xs text-muted-foreground">Visualize memories</span>
                    </span>
                  </Link>
                </div>
              )}
            </div>
          </nav>

          {/* Desktop Auth Actions - hidden on mobile */}
          <div className="hidden md:flex items-center gap-4">
            {isLoading ? null : isAuthenticated && user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => {
                    setShowProductsDropdown(false);
                    setShowProfileDropdown((v) => !v);
                  }}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-semibold">
                    {user.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showProfileDropdown ? "rotate-180" : ""}`} />
                </button>
                {showProfileDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-xl shadow-lg py-2 z-50">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted/50 transition-colors"
                      onClick={() => setShowProfileDropdown(false)}
                    >
                      <ArrowRight className="w-4 h-4" />
                      Go to Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-muted/50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/signin">
                  <Button variant="ghost" className="text-sm">Sign In</Button>
                </Link>
                <Link href="/signup">
                  <Button className="text-sm rounded-full px-5">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <nav className="absolute left-0 top-16 w-72 h-[calc(100vh-4rem)] bg-card border-r border-border p-4 overflow-y-auto">
            <div className="space-y-1">
              {sections.map(({ id, label }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    activeSection === id
                      ? "bg-amber-500/10 text-amber-600 font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <ChevronRight className={`w-4 h-4 transition-transform ${activeSection === id ? "text-amber-500" : ""}`} />
                  {label}
                </a>
              ))}
            </div>
            {/* Mobile Auth Actions */}
            <div className="pt-4 mt-4 border-t border-border flex flex-col gap-2">
              {isAuthenticated && user ? (
                <>
                  <div className="px-3 py-2 text-sm text-muted-foreground">{user.name}</div>
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-sm text-foreground hover:bg-muted/50 rounded-lg">
                    Go to Dashboard
                  </Link>
                  <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="px-3 py-2 text-sm text-red-500 text-left hover:bg-muted/50 rounded-lg">
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex gap-2">
                  <Link href="/signin" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" size="sm">Sign In</Button>
                  </Link>
                  <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                    <Button size="sm" className="rounded-full">Sign Up</Button>
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}

      <div className="container mx-auto px-4 md:px-6 py-8 lg:py-12">
        <div className="flex gap-12">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <nav className="sticky top-24 space-y-1">
              <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Documentation</p>
              {sections.map(({ id, label }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                    activeSection === id
                      ? "bg-amber-500/10 text-amber-600 font-medium border-l-2 border-amber-500"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {label}
                </a>
              ))}
              <div className="pt-6 mt-6 border-t border-border">
                <a 
                  href="https://github.com/vasantkr97/givememory.ai" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  GitHub Repository
                  <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0 max-w-4xl">
            {/* Hero */}
            <section className="mb-16">
              <span className="inline-flex items-center gap-2 text-xs text-muted-foreground font-medium mb-6">
                <BookOpen className="w-3.5 h-3.5" />
                Documentation
              </span>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                Long-term memory for{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">
                  AI conversations
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mb-8">
                ContextMemory extracts, stores, and retrieves important facts from conversations, enabling AI Agents to remember user preferences, context, and history across sessions.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/dashboard">
                  <Button className="rounded-full px-6 bg-foreground text-background hover:bg-foreground/90">
                    Try Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <a href="#quick-start">
                  <Button variant="outline" className="rounded-full px-6">
                    Quick Start
                  </Button>
                </a>
              </div>
            </section>

            {/* Features */}
            <section id="features" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold mb-6">Features</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-5 rounded-xl border border-border bg-card hover:border-amber-500/30 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center mb-3">
                    <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <circle cx="9" cy="9" r="3" />
                      <circle cx="15" cy="15" r="3" />
                      <line x1="11" y1="11" x2="13" y2="13" />
                    </svg>
                  </div>
                  <h3 className="font-semibold mb-1 text-sm">Dual Memory Types</h3>
                  <p className="text-xs text-muted-foreground">Semantic facts + Episodic bubbles</p>
                </div>
                <div className="p-5 rounded-xl border border-border bg-card hover:border-green-500/30 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center mb-3">
                    <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <circle cx="11" cy="11" r="6" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </div>
                  <h3 className="font-semibold mb-1 text-sm">Fast Search</h3>
                  <p className="text-xs text-muted-foreground">pgvector-powered semantic retrieval</p>
                </div>
                <div className="p-5 rounded-xl border border-border bg-card hover:border-blue-500/30 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mb-3">
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <h3 className="font-semibold mb-1 text-sm">Smart Updates</h3>
                  <p className="text-xs text-muted-foreground">Auto contradiction detection</p>
                </div>
                <div className="p-5 rounded-xl border border-border bg-card hover:border-purple-500/30 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center mb-3">
                    <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M12 4v4m0 4v8m-4-4h8" />
                    </svg>
                  </div>
                  <h3 className="font-semibold mb-1 text-sm">Auto Connections</h3>
                  <p className="text-xs text-muted-foreground">Bubbles link to related facts</p>
                </div>
                <div className="p-5 rounded-xl border border-border bg-card hover:border-pink-500/30 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center mb-3">
                    <svg className="w-4 h-4 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold mb-1 text-sm">Multi-Provider</h3>
                  <p className="text-xs text-muted-foreground">OpenAI or Claude</p>
                </div>
                <div className="p-5 rounded-xl border border-border bg-card hover:border-cyan-500/30 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-3">
                    <svg className="w-4 h-4 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <line x1="3" y1="9" x2="21" y2="9" />
                      <line x1="9" y1="21" x2="9" y2="9" />
                    </svg>
                  </div>
                  <h3 className="font-semibold mb-1 text-sm">Flexible Storage</h3>
                  <p className="text-xs text-muted-foreground">Neon/PostgreSQL with pgvector</p>
                </div>
              </div>
            </section>

            {/* Installation */}
            <section id="installation" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold mb-6">Installation</h2>
              <CodeBlock
                code={`bun install
bun run db:generate
bun run db:migrate
bun run dev`}
                filename="terminal"
                language="bash"
              />
            </section>

            {/* Quick Start */}
            <section id="quick-start" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold mb-6">Quick Start</h2>
              
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 text-sm flex items-center justify-center font-bold">1</span>
                    Configure the environment
                  </h3>
                  <CodeBlock
                    filename=".env"
                    language="env"
                    code={`DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
JWT_SECRET_KEY="replace-with-a-long-random-secret"
ENCRYPTION_KEY="replace-with-a-different-long-random-secret"
OPENROUTER_API_KEY="sk-or-v1-..."
LLM_MODEL="openai/gpt-4o-mini"
EMBEDDING_MODEL="text-embedding-3-small"
VITE_API_URL="http://localhost:4000"`}
                  />
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 text-sm flex items-center justify-center font-bold">2</span>
                    Start the application
                  </h3>
                  <CodeBlock
                    filename="terminal"
                    language="bash"
                    code={`bun run dev

# Open http://localhost:5173/signup
# Then sign in and open /dashboard`}
                  />
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-sm flex items-center justify-center font-bold">⚡</span>
                    Call the TypeScript API
                  </h3>
                  <CodeBlock
                    filename="chat.ts"
                    code={`const apiUrl = "http://localhost:4000/api";
const accessToken = "your-access-token";

const response = await fetch(apiUrl + "/chat", {
  method: "POST",
  headers: {
    Authorization: "Bearer " + accessToken,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ message: "I use TypeScript and React daily." })
});

const data = await response.json();
console.log(data.response);`}
                  />
                </div>
              </div>
            </section>

            {/* Basic Usage */}
            <section id="basic-usage" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold mb-6">Basic Usage</h2>
              
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Add Memories</h3>
                  <CodeBlock
                    filename="add-memories.ts"
                    code={`const response = await fetch(apiUrl + "/chat", {
  method: "POST",
  headers: {
    Authorization: "Bearer " + accessToken,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    message: "Hi, I am Samiksha. I use TypeScript and prefer dark mode."
  })
});

const result = await response.json();
console.log(result.extracted_memories);`}
                  />
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Search Memories</h3>
                  <CodeBlock
                    filename="search-memories.ts"
                    code={`const profile = await fetch(apiUrl + "/auth/me", {
  headers: { Authorization: "Bearer " + accessToken }
}).then((response) => response.json());

const response = await fetch(apiUrl + "/memory/search", {
  method: "POST",
  headers: {
    Authorization: "Bearer " + accessToken,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    conversationId: profile.id,
    query: "What programming language does the user like?",
    limit: 5,
    includeConnections: true
  })
});

const results = await response.json();
console.log(results.results);`}
                  />
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Update & Delete</h3>
                  <CodeBlock
                    filename="update-delete.ts"
                    code={`const memoryId = 1;
const headers = {
  Authorization: "Bearer " + accessToken,
  "Content-Type": "application/json"
};

await fetch(apiUrl + "/memory/" + memoryId, {
  method: "PATCH",
  headers,
  body: JSON.stringify({ text: "User is an expert TypeScript developer" })
});

await fetch(apiUrl + "/memory/" + memoryId, {
  method: "DELETE",
  headers
});`}
                  />
                </div>
              </div>
            </section>

            {/* Memory Types */}
            <section id="memory-types" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold mb-6">Memory Types</h2>
              
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="p-6 rounded-xl border border-amber-500/30 bg-amber-500/5">
                  <h3 className="text-lg font-semibold mb-3 text-amber-600">Semantic Facts</h3>
                  <p className="text-sm text-muted-foreground mb-4">Stable, long-term truths about the user:</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Name, preferences, skills
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Professional background
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Dietary preferences, relationships
                    </li>
                  </ul>
                </div>
                <div className="p-6 rounded-xl border border-blue-500/30 bg-blue-500/5">
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">Episodic Bubbles</h3>
                  <p className="text-sm text-muted-foreground mb-4">Time-bound moments with automatic connections:</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      Current tasks, deadlines
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      Active problems being solved
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      Significant events
                    </li>
                  </ul>
                </div>
              </div>

              <CodeBlock
                filename="bubbles-example.ts"
                code={`const response = await fetch(apiUrl + "/chat", {
  method: "POST",
  headers: {
    Authorization: "Bearer " + accessToken,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    message: "I am debugging an authentication issue in my API."
  })
});

const result = await response.json();
console.log(result.extracted_memories.bubbles);
// Episodic bubbles are connected to related memories automatically.`}
              />
            </section>

            {/* Full Example */}
            <section id="full-example" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold mb-6">Full Example: Chat with Memory</h2>
              <CollapsibleCodeBlock
                filename="chat-with-memory.ts"
                previewLines={20}
                code={`const apiUrl = "http://localhost:4000/api";
const accessToken = "your-access-token";

type ChatResponse = {
  response: string;
  extracted_memories: {
    semantic: Array<{ id: number; text: string }>;
    bubbles: Array<{ id: number; text: string }>;
  };
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(apiUrl + path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken,
      ...init.headers
    }
  });

  if (!response.ok) {
    throw new Error("GiveMemory request failed: " + response.status);
  }

  return response.json() as Promise<T>;
}

async function chatWithMemory(message: string) {
  const result = await request<ChatResponse>("/chat", {
    method: "POST",
    body: JSON.stringify({ message })
  });

  console.log(result.response);
  console.log(result.extracted_memories);
}

await chatWithMemory("I am planning a TypeScript project.");`}
              />
            </section>

            {/* Configuration */}
            <section id="configuration" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold mb-6">Configuration Reference</h2>
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="px-4 py-3 text-left font-semibold border-b border-border">Parameter</th>
                        <th className="px-4 py-3 text-left font-semibold border-b border-border">Required</th>
                        <th className="px-4 py-3 text-left font-semibold border-b border-border">Default</th>
                        <th className="px-4 py-3 text-left font-semibold border-b border-border">Description</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr><td className="px-4 py-3 border-b border-border font-mono text-amber-600">DATABASE_URL</td><td className="px-4 py-3 border-b border-border">Yes</td><td className="px-4 py-3 border-b border-border">-</td><td className="px-4 py-3 border-b border-border">Neon/PostgreSQL connection string</td></tr>
                      <tr><td className="px-4 py-3 border-b border-border font-mono text-amber-600">JWT_SECRET_KEY</td><td className="px-4 py-3 border-b border-border">Yes</td><td className="px-4 py-3 border-b border-border">-</td><td className="px-4 py-3 border-b border-border">Secret used to sign access tokens</td></tr>
                      <tr><td className="px-4 py-3 border-b border-border font-mono text-amber-600">ENCRYPTION_KEY</td><td className="px-4 py-3 border-b border-border">Yes</td><td className="px-4 py-3 border-b border-border">-</td><td className="px-4 py-3 border-b border-border">Secret used to encrypt stored user API keys</td></tr>
                      <tr><td className="px-4 py-3 border-b border-border font-mono text-amber-600">OPENROUTER_API_KEY</td><td className="px-4 py-3 border-b border-border">For free tier</td><td className="px-4 py-3 border-b border-border">-</td><td className="px-4 py-3 border-b border-border">System key used before a user adds their own key</td></tr>
                      <tr><td className="px-4 py-3 border-b border-border font-mono text-amber-600">LLM_MODEL</td><td className="px-4 py-3 border-b border-border">No</td><td className="px-4 py-3 border-b border-border font-mono">gpt-4o-mini</td><td className="px-4 py-3 border-b border-border">Chat and extraction model</td></tr>
                      <tr><td className="px-4 py-3 border-b border-border font-mono text-amber-600">EMBEDDING_MODEL</td><td className="px-4 py-3 border-b border-border">No</td><td className="px-4 py-3 border-b border-border">text-embedding-3-small</td><td className="px-4 py-3 border-b border-border">Model that creates semantic vectors</td></tr>
                      <tr><td className="px-4 py-3 font-mono text-amber-600">VITE_API_URL</td><td className="px-4 py-3">No</td><td className="px-4 py-3 font-mono">http://localhost:4000</td><td className="px-4 py-3">Express API base URL used by the React app</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                Provider, model, and debug settings can also be changed by an administrator in the React Settings screen. Secrets stay on the server and are never returned to the browser.
              </p>
            </section>

            {/* API Reference */}
            <section id="api-reference" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold mb-6">API Reference</h2>
              
              <div className="space-y-4">
                <div className="p-5 rounded-xl border border-border bg-card">
                  <code className="text-amber-600 font-mono font-semibold">POST /api/auth/signup</code>
                  <p className="text-sm text-muted-foreground mt-2">Create an account and receive access and refresh tokens for the API.</p>
                </div>
                <div className="p-5 rounded-xl border border-border bg-card">
                  <code className="text-amber-600 font-mono font-semibold">POST /api/chat</code>
                  <p className="text-sm text-muted-foreground mt-2">Retrieve relevant memory, generate a reply, and learn new memories from the completed turn.</p>
                </div>
                <div className="p-5 rounded-xl border border-border bg-card">
                  <code className="text-amber-600 font-mono font-semibold">Memory endpoints</code>
                  <p className="text-sm text-muted-foreground mt-2">Authenticated routes for reading and searching the current user&apos;s memory graph:</p>
                  <ul className="mt-3 space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <code className="text-foreground font-mono shrink-0">GET /api/memories</code>
                      <span className="text-muted-foreground">→ Return memory nodes and their connections</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <code className="text-foreground font-mono shrink-0">POST /api/memory/search</code>
                      <span className="text-muted-foreground">→ Search memories by meaning</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <code className="text-foreground font-mono shrink-0">GET /api/memory/:id</code>
                      <span className="text-muted-foreground">→ Return a memory and linked memories</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <code className="text-foreground font-mono shrink-0">GET /api/chat/history</code>
                      <span className="text-muted-foreground">→ Return dashboard chat history</span>
                    </li>
                  </ul>
                </div>
                <div className="p-5 rounded-xl border border-border bg-card">
                  <code className="text-amber-600 font-mono font-semibold">PATCH /api/memory/:id and DELETE /api/memory/:id</code>
                  <p className="text-sm text-muted-foreground mt-2">Update a memory with new text or soft-delete it from the active memory store.</p>
                </div>
              </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold mb-6">How It Works</h2>
              
              <div className="p-6 rounded-xl border border-border bg-card mb-6">
                <div className="font-mono text-sm leading-loose text-center overflow-x-auto">
                  <div className="inline-block text-left">
                    <span className="text-amber-600">User Message</span>
                    <span className="text-muted-foreground"> → </span>
                    <span className="text-blue-600">Extraction (LLM)</span>
                    <span className="text-muted-foreground"> → </span>
                    <span className="text-green-600">Tool Classification (LLM)</span>
                    <span className="text-muted-foreground"> → </span>
                    <span className="text-purple-600">pgvector + PostgreSQL</span>
                    <div className="mt-2 pl-24 text-muted-foreground">
                      ↓
                      <span className="ml-24">↓</span>
                    </div>
                    <div className="pl-12">
                      <span className="text-amber-500">Semantic Facts</span>
                      <span className="ml-12 text-blue-500">ADD/UPDATE/REPLACE/NOOP</span>
                    </div>
                    <div className="pl-12">
                      <span className="text-amber-500">Episodic Bubbles</span>
                    </div>
                    <div className="mt-2 pl-24 text-muted-foreground">↓</div>
                    <div className="pl-6">
                      <span className="text-cyan-600">Connection Finder</span>
                      <span className="text-muted-foreground"> → Links bubbles to related facts</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-border bg-card">
                  <h4 className="font-semibold mb-2 text-sm">Contradiction Detection</h4>
                  <p className="text-xs text-muted-foreground">&quot;I&apos;m vegetarian&quot; → &quot;I eat meat&quot; triggers REPLACE</p>
                </div>
                <div className="p-4 rounded-xl border border-border bg-card">
                  <h4 className="font-semibold mb-2 text-sm">pgvector Search</h4>
                  <p className="text-xs text-muted-foreground">Semantic retrieval runs alongside the PostgreSQL memory records.</p>
                </div>
                <div className="p-4 rounded-xl border border-border bg-card">
                  <h4 className="font-semibold mb-2 text-sm">Smart Extraction</h4>
                  <p className="text-xs text-muted-foreground">Only extracts from latest interaction, not context</p>
                </div>
              </div>
            </section>

            {/* Links */}
            <section className="mb-16 pt-8 border-t border-border">
              <div className="flex flex-wrap gap-6">
                <a 
                  href="https://github.com/vasantkr97/givememory.ai" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-amber-600 hover:text-amber-500 transition-colors"
                >
                  GitHub Repository
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </section>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-12">
        <div className="container mx-auto px-4 md:px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">Built with ContextMemory - AI Memory Made Visual</p>
            <div className="flex items-center gap-6">
              <a href="https://x.com/contextmemory" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="X (Twitter)">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              </a>
              <a href="https://linkedin.com/company/contextmemory" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="LinkedIn">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
              </a>
              <a href="mailto:hello@contextmemory.ai" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Email"><Mail className="w-5 h-5" /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
