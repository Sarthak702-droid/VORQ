import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  ArrowRight,
  Image as ImageIcon,
  KeyRound,
  LifeBuoy,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import {
  Arch,
  Dividers,
  Elevation,
  Plan,
  Rose,
  Seal,
  Section,
  Stair,
  Truss,
  useInView,
} from "./Drawings";
import { Logo } from "./Logo";

const SIGN_IN = "#/signin";
const SIGN_UP = "#/signup";

const plates = [
  {
    numeral: "I",
    title: "Estimates & BOQ",
    body: "Bills of quantities and budgets that every later document is measured against.",
    Art: Plan,
  },
  {
    numeral: "II",
    title: "Procurement",
    body: "Requests, purchase orders and receipts, tied to the project and the budget line they consume.",
    Art: Dividers,
  },
  {
    numeral: "III",
    title: "Stores & materials",
    body: "Stock received, issued and held at each site, so material on paper matches material on the ground.",
    Art: Section,
  },
  {
    numeral: "IV",
    title: "Site & labour",
    body: "Daily site reports and labour attendance, entered from the phone where the work actually happens.",
    Art: Truss,
  },
  {
    numeral: "V",
    title: "Subcontracts",
    body: "Work orders and progress for every trade, measured before anything is paid.",
    Art: Arch,
  },
  {
    numeral: "VI",
    title: "Billing & finance",
    body: "Approvals, bills and payments, with tax and posting rules enforced on the server rather than in a spreadsheet.",
    Art: Seal,
  },
];

const stages = [
  {
    title: "Estimate",
    body: "Set out the BOQ and the budget. This becomes the datum for the whole job.",
  },
  {
    title: "Procure",
    body: "Order against the estimate. Receive into stores and issue to site.",
  },
  {
    title: "Build",
    body: "Record each day on site: progress, labour, materials and subcontract work.",
  },
  {
    title: "Certify & bill",
    body: "Approve what was measured, raise the bill and post it to the accounts.",
  },
];

const roles = [
  ["Owner", "The position across every company and project."],
  ["Project Manager", "Programme, cost and approvals for assigned projects."],
  ["Quantity Surveyor", "Quantities, measurements and certification."],
  ["Site Engineer", "Daily reports, labour and progress from site."],
  ["Storekeeper", "Receipts, issues and stock on hand."],
  ["Procurement Officer", "Requests, orders and suppliers."],
  ["Accountant", "Bills, payments and the ledger."],
  ["Subcontractor", "Work orders and bills for their own trade."],
];

const safeguards = [
  {
    Icon: KeyRound,
    title: "Authenticator on every sign-in",
    body: "A password alone never opens a workspace. Each sign-in is confirmed with a code from your authenticator app.",
  },
  {
    Icon: UserCheck,
    title: "Access is assigned, not assumed",
    body: "Creating an account grants nothing. An administrator verifies each person and assigns their company, projects and role.",
  },
  {
    Icon: LifeBuoy,
    title: "One-use recovery codes",
    body: "Lose the phone, keep the account. Recovery codes are issued once at enrolment and each works a single time.",
  },
  {
    Icon: ImageIcon,
    title: "Guarded front door",
    body: "A single-use security image, rate limits and revocable server-side sessions stand between the internet and your books.",
  },
];

function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li" | "article";
}) {
  const [ref, seen] = useInView<HTMLElement>(0.15);
  return (
    <Tag
      // The three allowed tags all accept an HTMLElement ref.
      ref={ref as never}
      className={`vq-reveal ${seen ? "is-in" : ""} ${className}`}
      style={{ "--delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}

function scrollToSection(id: string) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

export function Landing() {
  const root = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  // One passive scroll listener drives the sticky nav and the backdrop drift.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setStuck(window.scrollY > 12);
      root.current?.style.setProperty("--vq-y", String(Math.round(window.scrollY)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const [stagesRef, stagesSeen] = useInView<HTMLDivElement>(0.3);

  return (
    <div ref={root} className="vq-public overflow-x-clip">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-vq-ink focus:px-4 focus:py-2 focus:text-vq-paper"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        Skip to content
      </a>

      <header className={`vq-nav ${stuck ? "is-stuck" : ""}`}>
        <nav
          aria-label="Primary"
          className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8"
        >
          <a href="#/" aria-label="VORQ home" className="text-vq-ink">
            <Logo size={28} />
          </a>
          <div className="hidden items-center gap-9 text-sm text-vq-soft md:flex">
            {[
              ["platform", "Platform"],
              ["method", "Method"],
              ["roles", "Roles"],
              ["security", "Security"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                className="vq-link"
                onClick={() => scrollToSection(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 sm:gap-5">
            <a
              href={SIGN_IN}
              className="vq-link whitespace-nowrap px-2 py-3 text-sm font-medium max-[379px]:hidden"
            >
              Sign in
            </a>
            <a
              href={SIGN_UP}
              className="vq-btn !min-h-[42px] whitespace-nowrap !px-4 sm:!px-5"
            >
              Create account
            </a>
          </div>
        </nav>
      </header>

      <main id="main" tabIndex={-1} className="outline-none">
        {/* ---------- Hero ---------- */}
        <section className="relative">
          <div
            className="vq-backdrop vq-drift -right-24 -top-10 hidden w-[380px] lg:block"
            style={{ "--k": 0.08 } as CSSProperties}
          >
            <Rose className="vq-turn" />
          </div>
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-10 sm:px-8 sm:pt-16 lg:grid-cols-12 lg:gap-6 lg:pb-24 lg:pt-20">
            <div className="lg:col-span-5">
              <p className="vq-eyebrow vq-rise">
                Construction operations &amp; financial control
              </p>
              <h1
                className="vq-display vq-rise mt-6 text-[2.9rem] sm:text-6xl xl:text-[4.5rem]"
                style={{ "--delay": "120ms" } as CSSProperties}
              >
                Every site, drawn to scale.{" "}
                <em>Every rupee, accounted for.</em>
              </h1>
              <p
                className="vq-rise mt-7 max-w-[30rem] text-[17px] leading-relaxed text-vq-soft"
                style={{ "--delay": "240ms" } as CSSProperties}
              >
                VORQ gives residential contractors one measured record of the
                job — estimates, procurement, stores, labour, subcontracts and
                billing — shared by the office and the site.
              </p>
              <div
                className="vq-rise mt-9 flex flex-wrap gap-3"
                style={{ "--delay": "360ms" } as CSSProperties}
              >
                <a href={SIGN_UP} className="vq-btn">
                  Create account
                  <ArrowRight size={16} className="vq-nudge" aria-hidden="true" />
                </a>
                <a href={SIGN_IN} className="vq-btn-ghost">
                  Sign in
                </a>
              </div>
              <p
                className="vq-rise mt-6 flex items-center gap-2 text-[13px] text-vq-muted"
                style={{ "--delay": "480ms" } as CSSProperties}
              >
                <ShieldCheck size={15} aria-hidden="true" />
                One account for web and mobile, protected by two-step sign-in.
              </p>
            </div>
            <div
              className="vq-drift text-vq-ink lg:col-span-7 lg:-mr-6"
              style={{ "--k": -0.03, "--vq-lag": "350ms" } as CSSProperties}
            >
              <Elevation />
            </div>
          </div>

          <div className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:pb-28">
            <Reveal>
              <dl className="vq-titleblock">
                <div>
                  <dt>Clients</dt>
                  <dd>Web &amp; mobile</dd>
                </div>
                <div>
                  <dt>Access</dt>
                  <dd>Role-aware, per project</dd>
                </div>
                <div>
                  <dt>Sign-in</dt>
                  <dd>Password + authenticator</dd>
                </div>
                <div>
                  <dt>Accounts</dt>
                  <dd>Built on ERPNext</dd>
                </div>
              </dl>
            </Reveal>
          </div>
        </section>

        {/* ---------- Platform ---------- */}
        <section
          id="platform"
          className="relative scroll-mt-20 border-t border-vq-line py-20 lg:py-32"
        >
          <div
            className="vq-backdrop vq-drift -left-20 top-24 hidden w-[300px] lg:block"
            style={{ "--k": -0.05 } as CSSProperties}
          >
            <Stair />
          </div>
          <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
            <Reveal className="max-w-2xl">
              <p className="vq-eyebrow">The platform</p>
              <h2 className="vq-display mt-5 text-4xl sm:text-5xl lg:text-6xl">
                Six plates. <em>One set of books.</em>
              </h2>
              <p className="mt-6 text-[17px] leading-relaxed text-vq-soft">
                Each part of the job is a sheet in the same drawing set. Change
                a quantity on one, and the others already know.
              </p>
            </Reveal>
            <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {plates.map(({ numeral, title, body, Art }, index) => (
                <Reveal as="li" key={title} delay={(index % 3) * 110}>
                  <article className="vq-plate h-full">
                    <div className="flex items-start justify-between">
                      <Art className="vq-plate-art" />
                      <span className="font-display text-lg italic text-vq-brass-deep">
                        Plate {numeral}
                      </span>
                    </div>
                    <h3 className="mt-8 font-display text-[28px] font-semibold leading-tight">
                      {title}
                    </h3>
                    <p className="mt-3 text-[15px] leading-relaxed text-vq-soft">
                      {body}
                    </p>
                  </article>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* ---------- Method ---------- */}
        <section
          id="method"
          className="scroll-mt-20 border-t border-vq-line bg-vq-vellum/60 py-20 lg:py-32"
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <Reveal className="max-w-2xl">
              <p className="vq-eyebrow">The method</p>
              <h2 className="vq-display mt-5 text-4xl sm:text-5xl lg:text-6xl">
                From first line <em>to final bill.</em>
              </h2>
            </Reveal>
            <div
              ref={stagesRef}
              className={`mt-16 ${stagesSeen ? "is-in" : ""}`}
            >
              <div className="vq-rule hidden lg:block" />
              <ol className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
                {stages.map((stage, index) => (
                  <Reveal as="li" key={stage.title} delay={index * 160}>
                    <div className="relative border-t border-vq-ink pt-7 lg:border-t-0">
                      <span
                        aria-hidden="true"
                        className="absolute -top-[5px] left-0 h-[9px] w-[9px] rotate-45 bg-vq-brass"
                      />
                      <p className="font-display text-lg italic text-vq-brass-deep">
                        {["i.", "ii.", "iii.", "iv."][index]}
                      </p>
                      <h3 className="mt-2 font-display text-[30px] font-semibold leading-tight">
                        {stage.title}
                      </h3>
                      <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-vq-soft">
                        {stage.body}
                      </p>
                    </div>
                  </Reveal>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ---------- Roles ---------- */}
        <section
          id="roles"
          className="relative scroll-mt-20 border-t border-vq-line py-20 lg:py-32"
        >
          <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-12">
            <Reveal className="lg:col-span-4">
              <p className="vq-eyebrow">The readers</p>
              <h2 className="vq-display mt-5 text-4xl sm:text-5xl">
                One record, <em>read eight ways.</em>
              </h2>
              <p className="mt-6 text-[17px] leading-relaxed text-vq-soft">
                Everyone works from the same job record, and each person sees
                the part that is theirs to see. Roles are assigned by your
                administrator, company by company and project by project.
              </p>
              <div className="mt-10 hidden w-44 text-vq-soft lg:block">
                <Dividers />
              </div>
            </Reveal>
            <ol className="vq-roles lg:col-span-7 lg:col-start-6">
              {roles.map(([role, scope], index) => (
                <Reveal as="li" key={role} delay={index * 60}>
                  <span className="font-display text-lg italic text-vq-brass-deep">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="font-display text-2xl font-semibold leading-tight">
                    {role}
                  </span>
                  <span className="col-start-2 text-[15px] text-vq-soft sm:col-start-3">
                    {scope}
                  </span>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------- Security ---------- */}
        <section
          id="security"
          className="vq-on-night relative scroll-mt-20 overflow-hidden bg-vq-night py-20 text-vq-bone lg:py-32"
        >
          <div
            className="vq-backdrop vq-drift -right-16 top-10 w-[420px] max-w-[70vw]"
            style={{ "--k": -0.04 } as CSSProperties}
          >
            <Arch />
          </div>
          <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
            <Reveal className="max-w-2xl">
              <p className="vq-eyebrow">Security</p>
              <h2 className="vq-display mt-5 text-4xl sm:text-5xl lg:text-6xl">
                Kept like the accounts <em>they are.</em>
              </h2>
              <p className="mt-6 text-[17px] leading-relaxed text-vq-ash">
                Project money deserves more than a password. Sign-in on VORQ is
                deliberate, and access is granted by a person who knows you.
              </p>
            </Reveal>
            <ul className="mt-14 grid gap-x-12 gap-y-10 sm:grid-cols-2">
              {safeguards.map(({ Icon, title, body }, index) => (
                <Reveal
                  as="li"
                  key={title}
                  delay={(index % 2) * 120}
                  className="flex gap-5 border-t border-vq-bone/15 pt-7"
                >
                  <Icon
                    size={22}
                    strokeWidth={1.5}
                    className="mt-1 shrink-0 text-vq-brass-light"
                    aria-hidden="true"
                  />
                  <div>
                    <h3 className="font-display text-2xl font-semibold">
                      {title}
                    </h3>
                    <p className="mt-2 max-w-md text-[15px] leading-relaxed text-vq-ash">
                      {body}
                    </p>
                  </div>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* ---------- Closing ---------- */}
        <section className="relative overflow-hidden py-24 lg:py-36">
          <div
            className="vq-backdrop left-1/2 top-1/2 w-[560px] max-w-[120vw] -translate-x-1/2 -translate-y-1/2"
            aria-hidden="true"
          >
            <Rose className="vq-turn" />
          </div>
          <Reveal className="relative mx-auto max-w-3xl px-5 text-center sm:px-8">
            <h2 className="vq-display text-5xl sm:text-6xl lg:text-7xl">
              Set out your next project <em>properly.</em>
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-vq-soft">
              Create your account and request your role. Your administrator
              does the rest.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <a href={SIGN_UP} className="vq-btn">
                Create account
                <ArrowRight size={16} className="vq-nudge" aria-hidden="true" />
              </a>
              <a href={SIGN_IN} className="vq-btn-ghost">
                Sign in
              </a>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-vq-line">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-5 py-10 sm:flex-row sm:items-center sm:px-8">
          <Logo size={24} />
          <p className="text-[13px] text-vq-muted">
            © {new Date().getFullYear()} VORQ. Construction operations &amp;
            financial control.
          </p>
          <div className="flex gap-6 text-[13px] text-vq-soft">
            <a href={SIGN_IN} className="vq-link">
              Sign in
            </a>
            <a href={SIGN_UP} className="vq-link">
              Create account
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
