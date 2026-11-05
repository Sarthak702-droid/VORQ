import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ApiError } from "../api/client";
import {
  clearNativeSession,
  client,
  onSessionExpired,
  restoreNativeSession,
} from "../api/runtime";
import type { Session, Workspace as ServerWorkspace } from "../api/contracts";
interface WorkspaceState {
  session: Session | null;
  workspace: ServerWorkspace | null;
  company: string;
  project: string;
  checking: boolean;
  busy: boolean;
  error: string;
  login: (
    challenge: string,
    code: string,
  ) => Promise<{ recovery_codes: string[] }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  selectCompany: (company: string) => Promise<void>;
  selectProject: (project: string) => void;
}
const Context = createContext<WorkspaceState | null>(null);
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [workspace, setWorkspace] = useState<ServerWorkspace | null>(null);
  const [company, setCompany] = useState("");
  const [project, setProject] = useState("");
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const generation = useRef(0);
  const signedIn = useRef(false);
  const selected = useRef({ company: "", project: "" });
  const reset = useCallback(() => {
    generation.current++;
    signedIn.current = false;
    setSession(null);
    setBusy(false);
    setWorkspace(null);
    setCompany("");
    setProject("");
    selected.current = { company: "", project: "" };
  }, []);
  const refresh = useCallback(async () => {
    const stamp = ++generation.current;
    setBusy(true);
    setError("");
    try {
      const account = await client.request<Session>("session");
      if (stamp !== generation.current) return;
      client.setCsrf(account.csrf_token);
      const nextCompany = account.companies.includes(selected.current.company)
        ? selected.current.company
        : account.companies[0] || "";
      const nextWorkspace = nextCompany
        ? await client.request<ServerWorkspace>("workspace", {
            company: nextCompany,
          })
        : null;
      if (stamp !== generation.current) return;
      const nextProject = nextWorkspace?.projects.some(
        (p) => p.name === selected.current.project,
      )
        ? selected.current.project
        : nextWorkspace?.projects[0]?.name || "";
      selected.current = { company: nextCompany, project: nextProject };
      signedIn.current = true;
      setSession(account);
      setCompany(nextCompany);
      setWorkspace(nextWorkspace);
      setProject(nextProject);
    } catch (err) {
      if (stamp !== generation.current) return;
      if (err instanceof ApiError && [401, 403].includes(err.status)) reset();
      else
        setError(
          err instanceof Error ? err.message : "VORQ could not be reached.",
        );
      throw err;
    } finally {
      if (stamp === generation.current) setBusy(false);
    }
  }, [reset]);
  useEffect(() => {
    let active = true;
    const unsubscribe = onSessionExpired(() => {
      const hadSession = signedIn.current;
      reset();
      setError(hadSession ? "Your session expired. Please sign in again." : "");
    });
    restoreNativeSession()
      .then(() => (active ? refresh() : undefined))
      .catch(() => {})
      .finally(() => {
        if (active) {
          setChecking(false);
          setBusy(false);
        }
      });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [refresh, reset]);
  async function login(challenge: string, code: string) {
    setBusy(true);
    setError("");
    try {
      return await client.request<{ recovery_codes: string[] }>(
        "auth_finish",
        { challenge_token: challenge, code: code.trim() },
        true,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
      throw err;
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    setBusy(true);
    setError("");
    try {
      await client.request("logout", {}, true);
      await clearNativeSession();
      reset();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Sign out failed. Try again while connected.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function selectCompany(next: string) {
    if (!session?.companies.includes(next)) return;
    selected.current = { company: next, project: "" };
    setWorkspace(null);
    setProject("");
    setCompany(next);
    await refresh();
  }
  function selectProject(next: string) {
    if (workspace?.projects.some((p) => p.name === next)) {
      selected.current.project = next;
      setProject(next);
    }
  }
  return (
    <Context.Provider
      value={{
        session,
        workspace,
        company,
        project,
        checking,
        busy,
        error,
        login,
        logout,
        refresh,
        selectCompany,
        selectProject,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useWorkspace() {
  const value = useContext(Context);
  if (!value) throw new Error("WorkspaceProvider required.");
  return value;
}
