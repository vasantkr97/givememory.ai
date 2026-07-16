import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, ChevronDown, Home, Key, LogOut, PanelLeftClose, PanelLeftOpen, Settings } from "lucide-react";
import { ApiKeyModal } from "@/components/api-key/ApiKeyModal";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/contexts/AuthContext";

const MemoryGraph = dynamic(
  () => import("@/components/visualization/MemoryGraph").then((module) => module.MemoryGraph),
  {
    ssr: false,
    loading: () => (
      <div className="workspace-loading">
        <span className="workspace-loading__scan" />
        <p>Calibrating memory field</p>
      </div>
    )
  }
);

const ChatPanel = dynamic(
  () => import("@/components/chat/ChatPanel").then((module) => module.ChatPanel),
  { ssr: false }
);

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, refreshApiKeyStatus, refreshUser } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    setShowProfileDropdown(false);
    await logout();
    router.push("/");
  }

  async function handleApiKeySuccess() {
    await refreshApiKeyStatus();
    await refreshUser();
    setShowApiKeyModal(false);
  }

  const userName = user?.name || "User";
  const userInitials = userName.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  return (
    <div className="workspace-shell">
      <nav className="workspace-header" aria-label="Workspace navigation">
        <div className="workspace-header__left">
          <Logo size={28} />
          <span className="workspace-header__divider" />
          <span className="workspace-header__location">Memory observatory</span>
          <button
            type="button"
            onClick={() => setIsChatOpen((value) => !value)}
            className="workspace-icon-button"
            aria-label={isChatOpen ? "Close chat" : "Open chat"}
            title={isChatOpen ? "Close chat panel" : "Open chat panel"}
          >
            {isChatOpen ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}
          </button>
        </div>

        <div className="workspace-header__center">
          <Activity size={14} />
          <span>Retrieval engine online</span>
        </div>

        <div className="workspace-header__right">
          <span className="workspace-header__space">{userName}&apos;s memory space</span>
          <div className="profile-control" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowProfileDropdown((value) => !value)}
              className="profile-control__trigger"
              aria-expanded={showProfileDropdown}
              aria-haspopup="menu"
            >
              <span className="profile-control__avatar">{userInitials}</span>
              <ChevronDown className={showProfileDropdown ? "rotate-180" : ""} size={15} />
            </button>

            {showProfileDropdown && (
              <div className="observatory-menu" role="menu">
                <div className="observatory-menu__identity">
                  <strong>{user?.name}</strong>
                  <span>{user?.email}</span>
                </div>
                <Link href="/" role="menuitem" onClick={() => setShowProfileDropdown(false)}>
                  <Home size={16} /> Product home
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setShowProfileDropdown(false);
                    setShowApiKeyModal(true);
                  }}
                >
                  <Key size={16} /> Manage model key
                </button>
                {user?.is_admin && (
                  <Link href="/settings" role="menuitem" onClick={() => setShowProfileDropdown(false)}>
                    <Settings size={16} /> Provider settings
                  </Link>
                )}
                <button type="button" role="menuitem" onClick={handleLogout}>
                  <LogOut size={16} /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="workspace-main">
        <aside className={`${isChatOpen ? "is-open" : ""} workspace-chat`} aria-label="Conversation panel">
          <ChatPanel onNeedsApiKey={() => setShowApiKeyModal(true)} />
        </aside>

        <section className={`${isChatOpen ? "with-chat" : ""} workspace-graph`} aria-label="Memory visualization">
          <div className="workspace-graph__canvas"><MemoryGraph /></div>
        </section>
      </div>

      {showApiKeyModal && (
        <ApiKeyModal
          onSuccess={handleApiKeySuccess}
          onClose={() => setShowApiKeyModal(false)}
          canClose
        />
      )}
    </div>
  );
}
