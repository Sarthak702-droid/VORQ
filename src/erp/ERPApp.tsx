import React, { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Building2,
  ChevronRight,
  ClipboardList,
  HardHat,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  api,
  ApiError,
  Module,
  RecordDetail,
  RecordPage,
  RecordRow,
  setCsrf,
  Workspace,
} from "./api";
import { AuthScreen } from "./AuthScreen";
import { defaults, RecordForm } from "./RecordForm";
import { ScheduleTimeline } from "./ScheduleTimeline";
type Session = {
  user: string;
  full_name: string;
  companies: string[];
  csrf_token: string;
};
const groups = [
  [
    "Plan & deliver",
    [
      "projects",
      "tasks",
      "boqs",
      "boq-groups",
      "boq-items",
      "site-reports",
      "labour",
    ],
  ],
  [
    "Materials & procurement",
    [
      "suppliers",
      "items",
      "warehouses",
      "requests",
      "purchase-orders",
      "receipts",
      "stock",
    ],
  ],
  [
    "Contracts & finance",
    [
      "customers",
      "subcontracts",
      "measurements",
      "ra-bills",
      "sales-invoices",
      "purchase-invoices",
      "payments",
      "expenses",
    ],
  ],
] as const;
const labels: Record<string, string> = {
  customers: "Customers",
  suppliers: "Suppliers",
  items: "Item catalogue",
  warehouses: "Warehouses",
  projects: "Projects",
  tasks: "Schedule & milestones",
  boqs: "BOQ & estimation",
  "boq-groups": "BOQ groups",
  "boq-items": "Rate analysis & quantities",
  "site-reports": "Daily site reports",
  labour: "Labour attendance",
  requests: "Material requests",
  "purchase-orders": "Purchase orders",
  receipts: "Goods receipts",
  stock: "Stock movements",
  subcontracts: "Subcontract agreements",
  measurements: "Measurement books",
  "ra-bills": "Running account bills",
  "sales-invoices": "Client invoices",
  "purchase-invoices": "Supplier invoices",
  payments: "Payments",
  expenses: "Expenses & journals",
};
export default function ERPApp() {
  const [session, setSession] = useState<Session | null>(null),
    [checking, setChecking] = useState(true),
    [company, setCompany] = useState(""),
    [workspace, setWorkspace] = useState<Workspace | null>(null),
    [project, setProject] = useState(""),
    [module, setModule] = useState("overview"),
    [page, setPage] = useState<RecordPage | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [drawer, setDrawer] = useState(false),
    [editing, setEditing] = useState<RecordDetail | null>(null),
    [values, setValues] = useState<Record<string, unknown>>({}),
    [search, setSearch] = useState(""),
    [overview, setOverview] = useState<{
      progress: number;
      status: string;
      financials: null | { expense: string; income_balance: string };
    } | null>(null);
  const generation = useRef(0),
    requestKey = useRef(crypto.randomUUID());
  const loadSession = async (afterLogin = false) => {
    if (!afterLogin) setChecking(true);
    setError("");
    try {
      const s = await api<Session>("session");
      setCsrf(s.csrf_token);
      setSession(s);
      setCompany(s.companies[0] || "");
    } catch (err) {
      if (!(err instanceof ApiError) || ![401, 403].includes(err.status))
        setError(
          "Unable to reach the VORQ backend. Check that the development stack is running.",
        );
      setSession(null);
      if (afterLogin) throw err;
    } finally {
      setChecking(false);
    }
  };
  useEffect(() => {
    void loadSession();
  }, []);
  useEffect(() => {
    if (!company) return;
    let active = true;
    setWorkspace(null);
    setPage(null);
    setEditing(null);
    setError("");
    api<Workspace>("workspace", { company })
      .then((w) => {
        if (active) {
          setWorkspace(w);
          setProject(w.projects[0]?.name || "");
          setModule("overview");
        }
      })
      .catch((e) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [company]);
  const load = async () => {
    const stamp = ++generation.current;
    if (!company || !workspace) return;
    setError("");
    setBusy(true);
    setPage(null);
    setOverview(null);
    try {
      if (module === "overview") {
        if (project) {
          const o = await api<typeof overview>("overview", {
            company,
            project,
          });
          if (stamp === generation.current) setOverview(o);
        }
      } else {
        if (!project && module !== "projects") return;
        const p = await api<RecordPage>("records", {
          module,
          company,
          project,
        });
        if (stamp === generation.current) setPage(p);
      }
    } catch (e) {
      if (stamp === generation.current) setError((e as Error).message);
    } finally {
      if (stamp === generation.current) setBusy(false);
    }
  };
  useEffect(() => {
    setEditing(null);
    setSearch("");
    setNotice("");
    void load();
    return () => {
      generation.current++;
    };
  }, [company, project, module, workspace]);
  const activeModule = workspace?.modules.find((m) => m.id === module);
  const currentProject = workspace?.projects.find((p) => p.name === project);
  const open = async (row?: RecordRow) => {
    setError("");
    try {
      requestKey.current = crypto.randomUUID();
      const d = row
        ? await api<RecordDetail>("detail", {
            module,
            company,
            project,
            name: row.name,
          })
        : {
            name: "",
            modified: "",
            docstatus: 0,
            values: defaults(page?.fields || []),
          };
      setEditing(d);
      setValues(d.values);
    } catch (e) {
      setError((e as Error).message);
    }
  };
  if (checking)
    return (
      <div className="min-h-screen grid place-items-center text-slate-500">
        Opening your workspace…
      </div>
    );
  if (!session)
    return (
      <>
        <AuthScreen onLogin={() => loadSession(true)} />
        {error && (
          <div className="fixed bottom-4 right-4 max-w-md error" role="alert">
            {error}
          </div>
        )}
      </>
    );
  if (session.companies.length === 0)
    return (
      <main className="min-h-screen bg-[#f5f6f3] flex items-center justify-center p-6">
        <section className="panel p-8 max-w-lg w-full space-y-5">
          <div className="text-3xl font-black text-[#153f3b]">VORQ.</div>
          <ShieldCheck className="text-emerald-800" size={32} />
          <h1 className="text-2xl font-semibold">Your account is ready</h1>
          <p className="text-sm text-slate-600">
            You are signed in as <strong>{session.user}</strong>. Your company
            administrator needs to verify your identity and assign your company,
            role and projects before you can open a workspace.
          </p>
          <p className="text-xs text-slate-500">
            No company data is accessible until your access is assigned.
          </p>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <div className="flex gap-3 flex-wrap">
            <button
              className="primary"
              onClick={() =>
                void loadSession(true).catch((e) => setError(e.message))
              }
            >
              <RefreshCw size={16} /> Check workspace access
            </button>
            <button
              className="secondary"
              onClick={async () => {
                try {
                  await api("logout", {}, true);
                  setSession(null);
                  setWorkspace(null);
                  setCsrf("");
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              Sign out
            </button>
          </div>
        </section>
      </main>
    );
  const navigate = (id: string) => {
    setModule(id);
    setDrawer(false);
  };
  return (
    <div className="min-h-screen bg-[#f5f6f3] text-slate-900">
      <aside
        className={`${drawer ? "fixed inset-0 z-40" : "hidden"} lg:fixed lg:block lg:inset-y-0 lg:left-0 w-64 bg-[#102d30] text-slate-200 overflow-y-auto`}
      >
        <div className="p-7 flex justify-between">
          <span className="text-3xl font-black text-white tracking-tight">
            VORQ<span className="text-lime-300">.</span>
          </span>
          <button
            aria-label="Close navigation"
            className="lg:hidden"
            onClick={() => setDrawer(false)}
          >
            <X />
          </button>
        </div>
        <p className="px-7 text-[10px] tracking-[.2em] text-slate-400 uppercase mb-4">
          Construction workspace
        </p>
        <nav className="px-3 pb-6">
          <button
            className={`navitem ${module === "overview" ? "active" : ""}`}
            onClick={() => navigate("overview")}
          >
            <LayoutDashboard size={17} /> Project overview
          </button>
          {groups.map(([title, ids]) => (
            <div className="mt-6" key={title}>
              <p className="px-4 mb-2 text-[10px] uppercase tracking-widest text-slate-400">
                {title}
              </p>
              {ids
                .filter((id) => workspace?.modules.some((m) => m.id === id))
                .map((id) => (
                  <button
                    key={id}
                    className={`navitem ${module === id ? "active" : ""}`}
                    onClick={() => navigate(id)}
                  >
                    <ClipboardList size={16} />
                    {labels[id]}
                  </button>
                ))}
            </div>
          ))}
        </nav>
        <div className="px-7 py-6 text-xs text-slate-400 border-t border-white/10">
          One workspace. Connected operations.
        </div>
      </aside>
      <div className="lg:ml-64">
        <header className="bg-white border-b px-5 lg:px-9 py-4 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-3 items-center">
            <button
              aria-label="Open navigation"
              className="lg:hidden"
              onClick={() => setDrawer(true)}
            >
              <Menu />
            </button>
            <Building2 className="text-emerald-800" size={19} />
            <select
              aria-label="Company"
              className="!w-auto !border-0 font-semibold !p-0"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            >
              {session.companies.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-500 hidden sm:block">
              {workspace?.role}
            </span>
            <span className="font-medium">{session.full_name}</span>
            <button
              aria-label="Sign out"
              onClick={async () => {
                try {
                  await api("logout", {}, true);
                  setSession(null);
                  setWorkspace(null);
                  setCsrf("");
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>
        <main className="p-5 lg:p-9 max-w-[1600px] mx-auto">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
            Workspace <ChevronRight size={13} />
            {labels[module] || "Overview"}
          </div>
          <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
            <div>
              <p className="text-xs uppercase tracking-widest text-emerald-800 font-semibold mb-2">
                {company}
              </p>
              <h1 className="text-3xl font-semibold tracking-tight">
                {labels[module] || "Project overview"}
              </h1>
              <p className="text-sm text-slate-500 mt-2">
                {module === "overview"
                  ? "The work, the progress and the numbers behind your project."
                  : `Manage ${labels[module]?.toLowerCase()} across your project.`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                aria-label="Project"
                className="!w-auto max-w-64"
                value={project}
                onChange={(e) => setProject(e.target.value)}
              >
                <option value="">Select project</option>
                {workspace?.projects.map((p) => (
                  <option value={p.name} key={p.name}>
                    {p.project_name}
                  </option>
                ))}
              </select>
              <button
                aria-label="Refresh"
                disabled={busy}
                className="secondary"
                onClick={() => void load()}
              >
                <RefreshCw size={16} className={busy ? "animate-spin" : ""} />
              </button>
              {activeModule?.can_create && page && (
                <button className="primary" onClick={() => void open()}>
                  <Plus size={16} />
                  New
                </button>
              )}
            </div>
          </div>
          {error && (
            <p role="alert" className="error mb-5">
              {error}
            </p>
          )}
          {notice && (
            <p
              role="status"
              className="bg-emerald-50 text-emerald-900 rounded-lg p-4 mb-5 text-sm"
            >
              {notice}
            </p>
          )}
          {!session.companies.length && (
            <div className="panel p-10">
              No company membership is assigned. Ask your administrator to
              configure access.
            </div>
          )}
          {busy && (
            <div
              className="panel p-10 animate-pulse text-slate-500"
              role="status"
            >
              Loading project records…
            </div>
          )}
          {!busy && module === "overview" && (
            <>
              <section className="bg-[#e9eedf] rounded-2xl p-7 lg:p-10 flex justify-between gap-4">
                <div>
                  <span className="text-xs uppercase tracking-widest text-emerald-900">
                    Project control centre
                  </span>
                  <h2 className="text-3xl font-semibold mt-3">
                    {currentProject?.project_name ||
                      "Your next project starts here"}
                  </h2>
                  <p className="text-sm text-slate-600 mt-3">
                    {currentProject
                      ? `${currentProject.name} · ${currentProject.status}`
                      : "Create a project to connect planning, site operations and accounting."}
                  </p>
                  <button
                    className="primary mt-6"
                    onClick={() => navigate("projects")}
                  >
                    Open projects <ArrowUpRight size={16} />
                  </button>
                </div>
                <HardHat
                  className="hidden sm:block text-emerald-900/20 shrink-0"
                  size={120}
                />
              </section>
              <div className="grid sm:grid-cols-3 gap-4 mt-6">
                {[
                  [
                    "Project progress",
                    overview
                      ? `${Number(overview.progress || 0).toFixed(1)}%`
                      : "—",
                  ],
                  [
                    "Posted expenses",
                    overview?.financials
                      ? Number(overview.financials.expense).toLocaleString(
                          "en-IN",
                          { maximumFractionDigits: 2 },
                        )
                      : "—",
                  ],
                  [
                    "Income balance",
                    overview?.financials
                      ? Number(
                          overview.financials.income_balance,
                        ).toLocaleString("en-IN", { maximumFractionDigits: 2 })
                      : "—",
                  ],
                ].map(([label, value]) => (
                  <article className="panel p-6" key={label}>
                    <p className="text-sm text-slate-500">{label}</p>
                    <p className="text-3xl font-semibold mt-4 tabular-nums">
                      {value}
                    </p>
                    <p className="text-xs text-slate-400 mt-3">
                      {label === "Project progress"
                        ? "From the project record"
                        : "From the posted general ledger, in company currency"}
                    </p>
                  </article>
                ))}
              </div>
              <h2 className="text-xl font-semibold mt-9 mb-4">
                Keep the work moving
              </h2>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {workspace?.modules
                  .filter((m) =>
                    [
                      "boqs",
                      "site-reports",
                      "requests",
                      "measurements",
                      "ra-bills",
                      "tasks",
                    ].includes(m.id),
                  )
                  .map((m) => (
                    <button
                      className="panel p-6 text-left hover:border-emerald-800 transition"
                      key={m.id}
                      onClick={() => navigate(m.id)}
                    >
                      <ClipboardList
                        size={22}
                        className="text-emerald-800 mb-4"
                      />
                      <span className="font-semibold">{labels[m.id]}</span>
                      <p className="text-xs text-slate-500 mt-2">
                        Open workspace <span className="float-right">↗</span>
                      </p>
                    </button>
                  ))}
              </div>
            </>
          )}
          {!busy && page && module === "tasks" && (
            <ScheduleTimeline
              records={page.records}
              onOpen={(r) => void open(r)}
            />
          )}
          {!busy && page && (
            <section className="panel overflow-hidden">
              <div className="p-5 border-b flex justify-between items-center gap-4">
                <span className="font-semibold text-sm">
                  {labels[module]}{" "}
                  <span className="text-slate-400 font-normal ml-2">
                    {page.records.length} loaded
                  </span>
                </span>
                <label className="flex items-center gap-2">
                  <Search size={16} className="text-slate-400" />
                  <input
                    className="!border-0 !p-0 !w-40 text-sm"
                    aria-label="Search loaded records"
                    placeholder="Search loaded records"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
              </div>
              {page.records.length === 0 ? (
                <div className="p-14 text-center">
                  <ClipboardList
                    className="mx-auto text-slate-300 mb-4"
                    size={36}
                  />
                  <h3 className="font-semibold">No records yet</h3>
                  <p className="text-slate-500 text-sm mt-2">
                    {activeModule?.can_create
                      ? "Create the first record for this project."
                      : "Records will appear here when your team adds them."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs">
                      <tr>
                        <th className="p-4">Reference</th>
                        {page.fields
                          .filter((f) => !f.children)
                          .slice(0, 4)
                          .map((f) => (
                            <th className="p-4" key={f.name}>
                              {f.label}
                            </th>
                          ))}
                        <th className="p-4">State</th>
                      </tr>
                    </thead>
                    <tbody>
                      {page.records
                        .filter((r) =>
                          JSON.stringify(r)
                            .toLowerCase()
                            .includes(search.toLowerCase()),
                        )
                        .map((r) => (
                          <tr
                            key={r.name}
                            className="border-t hover:bg-emerald-50/40"
                          >
                            <td className="p-4">
                              <button
                                className="font-semibold text-emerald-900 underline underline-offset-4"
                                onClick={() => void open(r)}
                              >
                                {r.name}
                              </button>
                            </td>
                            {page.fields
                              .filter((f) => !f.children)
                              .slice(0, 4)
                              .map((f) => (
                                <td
                                  className="p-4 max-w-xs truncate"
                                  key={f.name}
                                >
                                  {String(r[f.name] ?? "—")}
                                </td>
                              ))}
                            <td className="p-4">
                              <span
                                className={`badge ${r.docstatus === 1 ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}
                              >
                                {["Draft", "Submitted", "Cancelled"][
                                  r.docstatus
                                ] || "Unknown"}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
              {page.next_start !== null && (
                <button
                  className="secondary m-4"
                  onClick={async () => {
                    setBusy(true);
                    try {
                      const more = await api<RecordPage>("records", {
                        module,
                        company,
                        project,
                        start: page.next_start,
                      });
                      setPage({
                        ...more,
                        records: [...page.records, ...more.records],
                      });
                    } catch (e) {
                      setError((e as Error).message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Load more
                </button>
              )}
            </section>
          )}
          {!busy &&
            !project &&
            module !== "overview" &&
            module !== "projects" && (
              <div className="panel p-10">
                Select or create a project to open this workspace.
              </div>
            )}
        </main>
      </div>
      {editing && page && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex justify-end">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="record-title"
            className="w-full max-w-3xl bg-white h-full overflow-y-auto shadow-xl"
          >
            <div className="p-6 border-b flex justify-between sticky top-0 bg-white z-10">
              <div>
                <p className="text-xs text-slate-500 mb-1">{labels[module]}</p>
                <h2 id="record-title" className="text-xl font-semibold">
                  {editing.name || "Create record"}
                </h2>
              </div>
              <button
                aria-label="Close record"
                disabled={busy}
                onClick={() => setEditing(null)}
              >
                <X />
              </button>
            </div>
            <form
              className="p-6 space-y-6"
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                setError("");
                try {
                  const result = await api<{ name: string }>(
                    "save",
                    {
                      module,
                      company,
                      project,
                      values,
                      name: editing.name || undefined,
                      modified: editing.modified || undefined,
                      idempotency_key: requestKey.current,
                    },
                    true,
                  );
                  setEditing(null);
                  setNotice(`Saved ${result.name}.`);
                  if (module === "projects") {
                    const w = await api<Workspace>("workspace", { company });
                    setWorkspace(w);
                    setProject(result.name);
                  } else await load();
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {error && (
                <p role="alert" className="error">
                  {error}
                </p>
              )}
              {editing.computed && Object.keys(editing.computed).length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-xl bg-emerald-50 p-4">
                  {Object.entries(editing.computed).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-[10px] uppercase tracking-wider text-slate-500">
                        {key.replace(/_/g, " ")}
                      </p>
                      <p className="text-sm font-semibold mt-1 break-all">
                        {String(value ?? "—")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              <RecordForm
                fields={page.fields}
                values={values}
                onChange={setValues}
                disabled={
                  busy || editing.docstatus !== 0 || !activeModule?.can_create
                }
              />
              <div className="flex gap-3 flex-wrap pt-4 border-t">
                {editing.docstatus === 0 && activeModule?.can_create && (
                  <button disabled={busy} className="primary">
                    {busy ? "Saving…" : "Save draft"}
                  </button>
                )}
                {editing.name &&
                  (editing.actions || []).map((action) => (
                    <button
                      key={action}
                      className="secondary"
                      type="button"
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true);
                        setError("");
                        try {
                          await api(
                            "transition",
                            {
                              module,
                              company,
                              project,
                              name: editing.name,
                              modified: editing.modified,
                              action,
                              idempotency_key: `${requestKey.current}:${action}`,
                            },
                            true,
                          );
                          setEditing(null);
                          setNotice("Document transition completed.");
                          await load();
                        } catch (e) {
                          setError((e as Error).message);
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      {action}
                    </button>
                  ))}
                <button
                  className="secondary"
                  type="button"
                  disabled={busy}
                  onClick={() => setEditing(null)}
                >
                  Close
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
