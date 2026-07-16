import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";

type MarketingHeaderProps = {
  active?: "home" | "demo" | "docs";
};

export function MarketingHeader({ active }: MarketingHeaderProps) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeProfile(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", closeProfile);
    return () => document.removeEventListener("mousedown", closeProfile);
  }, []);

  async function handleLogout() {
    setProfileOpen(false);
    await logout();
    window.history.pushState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  return (
    <header className="observatory-header">
      <div className="observatory-header__inner">
        <Logo size={30} />

        <nav className="observatory-nav" aria-label="Primary navigation">
          <Link aria-current={active === "home" ? "page" : undefined} className={active === "home" ? "is-active" : ""} href="/">Product</Link>
          <Link aria-current={active === "demo" ? "page" : undefined} className={active === "demo" ? "is-active" : ""} href="/demo">Live memory</Link>
          <Link aria-current={active === "docs" ? "page" : undefined} className={active === "docs" ? "is-active" : ""} href="/docs">Docs</Link>
        </nav>

        <div className="observatory-header__actions">
          <span className="system-status"><span /> Systems nominal</span>
          {!isLoading && (isAuthenticated && user ? (
            <div className="profile-control" ref={profileRef}>
              <button
                type="button"
                className="profile-control__trigger"
                onClick={() => setProfileOpen((value) => !value)}
                aria-expanded={profileOpen}
                aria-haspopup="menu"
              >
                <span className="profile-control__avatar">{initials(user.name)}</span>
                <ChevronDown aria-hidden="true" className={profileOpen ? "rotate-180" : ""} size={15} />
              </button>
              {profileOpen && (
                <div className="observatory-menu" role="menu">
                  <div className="observatory-menu__identity">
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                  </div>
                  <Link href="/dashboard" role="menuitem" onClick={() => setProfileOpen(false)}>
                    <LayoutDashboard size={16} /> Open workspace
                  </Link>
                  <button type="button" role="menuitem" onClick={handleLogout}>
                    <LogOut size={16} /> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link className="header-signin" href="/signin">Sign in</Link>
              <Button asChild size="sm"><Link href="/signup">Build with memory</Link></Button>
            </>
          ))}
        </div>

        <button
          type="button"
          className="observatory-header__mobile"
          onClick={() => setMobileOpen((value) => !value)}
          aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <nav className="observatory-mobile-nav" aria-label="Mobile navigation">
          <Link href="/" onClick={() => setMobileOpen(false)}>Product</Link>
          <Link href="/demo" onClick={() => setMobileOpen(false)}>Live memory</Link>
          <Link href="/docs" onClick={() => setMobileOpen(false)}>Docs</Link>
          <div className="observatory-mobile-nav__actions">
            {isAuthenticated ? (
              <Link href="/dashboard" onClick={() => setMobileOpen(false)}>Open workspace</Link>
            ) : (
              <>
                <Link href="/signin" onClick={() => setMobileOpen(false)}>Sign in</Link>
                <Link href="/signup" onClick={() => setMobileOpen(false)}>Create account</Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
