import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import DashboardPage from "@/pages/DashboardPage";
import DemoPage from "@/pages/DemoPage";
import DocsPage from "@/pages/DocsPage";
import LandingPage from "@/pages/LandingPage";
import ProtectedLayout from "@/pages/ProtectedLayout";
import SignInPage from "@/pages/SignInPage";
import SignUpPage from "@/pages/SignUpPage";

function getPath() {
  return window.location.pathname;
}

function RouterView() {
  const [path, setPath] = useState(getPath);

  useEffect(() => {
    const handleLocationChange = () => setPath(getPath());
    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  if (path === "/docs") {
    return <DocsPage />;
  }

  if (path === "/demo") {
    return <DemoPage />;
  }

  if (path === "/signin") {
    return <SignInPage />;
  }

  if (path === "/signup") {
    return <SignUpPage />;
  }

  if (path === "/dashboard") {
    return (
      <ProtectedLayout>
        <DashboardPage />
      </ProtectedLayout>
    );
  }

  return <LandingPage />;
}

export function App() {
  return (
    <AuthProvider>
      <RouterView />
      <Toaster richColors position="top-right" />
    </AuthProvider>
  );
}
