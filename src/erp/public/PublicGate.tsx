import { useEffect, useState } from "react";
import { AuthScreen } from "../AuthScreen";
import { Landing } from "./Landing";
import "./public.css";

type Route = "home" | "login" | "signup";

const HASHES: Record<Route, string> = {
  home: "#/",
  login: "#/signin",
  signup: "#/signup",
};

function readRoute(): Route {
  const hash = window.location.hash;
  if (hash === HASHES.login) return "login";
  if (hash === HASHES.signup) return "signup";
  return "home";
}

/** Drop the public route from the URL once the visitor is signed in. */
export function clearPublicRoute() {
  if (window.location.hash)
    window.history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search,
    );
}

/**
 * Everything a signed-out visitor can see: the landing page and the sign-in /
 * create-account screen. Routed by URL hash so links, reload and the browser's
 * back button all behave.
 */
export function PublicGate({
  onLogin,
  notice,
}: {
  onLogin: () => Promise<void>;
  /** Workspace-level problem (e.g. the session check failed) to show on the sign-in screen. */
  notice?: string;
}) {
  const [route, setRoute] = useState<Route>(readRoute);

  useEffect(() => {
    const sync = () => setRoute(readRoute());
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  // Each screen starts at the top, as a new page would.
  const screen = route === "home" ? "home" : "auth";
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen]);

  if (route === "home") return <Landing />;
  return (
    <AuthScreen
      mode={route}
      notice={notice}
      onModeChange={(mode) => {
        // Replace rather than push: switching tabs should not stack history.
        window.history.replaceState(null, "", HASHES[mode]);
        setRoute(mode);
      }}
      onLogin={async () => {
        await onLogin();
        clearPublicRoute();
      }}
    />
  );
}
