import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Logo } from "./Logo";
import { Plate } from "./Plate";
import { useInView } from "./useInView";

const SIGN_IN = "#/signin";
const SIGN_UP = "#/signup";

const contents = [
  ["Estimates and BOQ", "Quantities, rates and the budget for each project."],
  [
    "Purchasing",
    "Material requests, purchase orders, and what the supplier actually delivered.",
  ],
  ["Stores", "Stock received, issued and lying at each site."],
  ["Site reports", "What was done today, entered from the phone on site."],
  ["Labour", "Daily attendance, site by site."],
  ["Subcontracts", "Work orders and the progress against each one."],
  [
    "Billing and accounts",
    "Client bills, payments and approvals. Tax and ledger posting are done on the server by ERPNext.",
  ],
];

// One BOQ line followed through the system. Figures are invented but consistent:
// 184 cum at ₹6,450; about 500 bricks per cum at ₹9 each.
const ledger = [
  ["Estimate", "BOQ item 4.2, brick masonry 230 mm", "184.00 cum", "₹11,86,800"],
  ["Purchasing", "Purchase order to the brick supplier", "92,000 nos", "₹8,28,000"],
  ["Stores", "Received at the site store so far", "30,000 nos", ""],
  ["Site report", "Masonry completed to date", "62.50 cum", ""],
  ["Billing", "Included in running bill no. 3", "48.00 cum", "₹3,09,600"],
];

const roles = [
  "Owner",
  "Project Manager",
  "Quantity Surveyor",
  "Site Engineer",
  "Storekeeper",
  "Procurement Officer",
  "Accountant",
  "Subcontractor",
];

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const [ref, seen] = useInView<HTMLDivElement>(0.15);
  return (
    <div
      ref={ref}
      className={`vq-reveal ${seen ? "is-in" : ""} ${className}`}
      style={{ "--delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
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

  // One passive scroll listener drives the sticky nav and the background drift.
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

  const [ledgerRef, ledgerSeen] = useInView<HTMLDivElement>(0.25);

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
          className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-5 sm:px-8"
        >
          <a href="#/" aria-label="VORQ home">
            <Logo size={26} />
          </a>
          <div className="hidden items-center gap-8 text-[15px] text-vq-soft md:flex">
            {[
              ["covers", "What it covers"],
              ["example", "Worked example"],
              ["access", "Access"],
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
              className="vq-link whitespace-nowrap px-2 py-3 text-[15px] font-medium max-[379px]:hidden"
            >
              Sign in
            </a>
            <a
              href={SIGN_UP}
              className="vq-btn !min-h-[42px] whitespace-nowrap !px-4"
            >
              Create account
            </a>
          </div>
        </nav>
      </header>

      <main id="main" tabIndex={-1} className="outline-none">
        {/* ---------- Opening ---------- */}
        <section className="mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-10 sm:px-8 sm:pt-16 lg:grid-cols-12 lg:gap-8 lg:pb-28 lg:pt-20">
          <div className="lg:col-span-7 lg:self-center lg:pr-6">
            <p className="vq-label vq-rise">For residential contractors</p>
            <h1
              className="vq-display vq-rise mt-5 text-[2.9rem] sm:text-6xl lg:text-[4.6rem]"
              style={{ "--delay": "100ms" } as CSSProperties}
            >
              BOQ to final bill, on one record.
            </h1>
            <p
              className="vq-prose vq-rise mt-7 max-w-[34rem]"
              style={{ "--delay": "220ms" } as CSSProperties}
            >
              VORQ is construction management software. The estimate, purchase
              orders, store stock, labour attendance, subcontract work and
              client bills for a project all sit on the same record, so the
              office and the site work from the same numbers.
            </p>
            <div
              className="vq-rise mt-9 flex flex-wrap gap-3"
              style={{ "--delay": "340ms" } as CSSProperties}
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
              className="vq-rise mt-6 text-sm text-vq-muted"
              style={{ "--delay": "460ms" } as CSSProperties}
            >
              Works in the browser and on the phone, with the same login.
            </p>
          </div>
          <Plate
            name="masons"
            eager
            sheet
            className="mx-auto w-full max-w-[420px] lg:col-span-5 lg:max-w-none"
            alt="Eighteenth-century engraving of a building site: masons cutting and setting stone beside a scaffold, with eight figures of brick bonding below."
            caption="Masons on site, and eight ways to bond a wall. Engraved by Prévost after Lucotte for the Encyclopédie, Paris, 1762."
          />
        </section>

        {/* ---------- What it covers ---------- */}
        <section
          id="covers"
          className="scroll-mt-16 border-t border-vq-line py-20 lg:py-28"
        >
          <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:gap-8">
            <div className="order-2 lg:order-1 lg:col-span-4">
              <Plate
                name="machines"
                className="mx-auto max-w-[340px] lg:sticky lg:top-24 lg:mx-0"
                alt="Engraving of masons' hoists, shear legs, scaffolds and lifting tackle."
                caption="Hoists, shear legs and tackle, from the masonry plates of the same volume."
              />
            </div>
            <div className="order-1 lg:order-2 lg:col-span-7 lg:col-start-6">
              <Reveal>
                <h2 className="vq-display text-4xl sm:text-5xl">
                  What VORQ keeps track of
                </h2>
                <p className="vq-prose mt-5 max-w-xl">
                  Seven parts of the job, all tied to the same project.
                </p>
              </Reveal>
              <ol className="vq-contents mt-10">
                {contents.map(([title, body], index) => (
                  <li key={title}>
                    <span className="vq-num">{index + 1}.</span>
                    <h3 className="text-[17px] font-semibold">{title}</h3>
                    <p className="col-start-2 text-[15px] leading-relaxed text-vq-soft sm:col-start-3">
                      {body}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ---------- Worked example ---------- */}
        <section
          id="example"
          className="scroll-mt-16 border-t border-vq-line bg-vq-vellum/50 py-20 lg:py-28"
        >
          <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-8 lg:grid-cols-12 lg:gap-8">
            <Reveal className="lg:col-span-4">
              <h2 className="vq-display text-4xl sm:text-5xl">
                One BOQ item, followed through
              </h2>
              <p className="vq-prose mt-5">
                Take a single line from a house: 230 mm brick masonry on the
                ground floor. This is what ends up recorded against it.
              </p>
              <p className="vq-prose mt-4">
                All five entries belong to the same project record. Nobody
                keeps a separate sheet.
              </p>
            </Reveal>
            <div
              ref={ledgerRef}
              className={`overflow-x-auto lg:col-span-8 ${ledgerSeen ? "is-in" : ""}`}
            >
              <table className="vq-ledger">
                <caption>The figures are made up for this example.</caption>
                <thead>
                  <tr>
                    <th scope="col">Where</th>
                    <th scope="col">Entry</th>
                    <th scope="col" className="vq-figure">
                      Quantity
                    </th>
                    <th scope="col" className="vq-figure">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map(([where, entry, quantity, amount], index) => (
                    <tr key={where} style={{ "--row": index } as CSSProperties}>
                      <td>{where}</td>
                      <td className="text-vq-soft">{entry}</td>
                      <td className="vq-figure">{quantity}</td>
                      <td className="vq-figure">{amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ---------- Access ---------- */}
        <section
          id="access"
          className="vq-on-night relative scroll-mt-16 overflow-hidden bg-vq-night py-20 text-vq-bone lg:py-28"
        >
          <div
            className="vq-drift pointer-events-none absolute -right-10 top-0 hidden w-[520px] lg:block"
            style={{ "--k": -0.04 } as CSSProperties}
            aria-hidden="true"
          >
            <Plate name="stonecut" alt="" className="is-ghost" />
          </div>
          <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
            <Reveal className="max-w-2xl">
              <h2 className="vq-display text-4xl sm:text-5xl">
                Who gets in, and how
              </h2>
            </Reveal>
            <div className="mt-12 grid max-w-3xl gap-10">
              <Reveal>
                <h3 className="vq-label">Accounts are approved by a person</h3>
                <p className="vq-prose mt-3">
                  Signing up does not give access to anything. Your
                  administrator confirms who you are, then assigns your
                  company, your projects and your role.
                </p>
              </Reveal>
              <Reveal>
                <h3 className="vq-label">Eight roles</h3>
                <ul className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2.5 text-[17px] sm:grid-cols-4">
                  {roles.map((role) => (
                    <li key={role}>{role}</li>
                  ))}
                </ul>
              </Reveal>
              <Reveal>
                <h3 className="vq-label">Two-step sign-in</h3>
                <p className="vq-prose mt-3">
                  After your password you enter a code from an authenticator
                  app, such as Google Authenticator. When you set it up you get
                  a set of one-time recovery codes, in case you lose the phone.
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ---------- Closing ---------- */}
        <section className="pt-20 lg:pt-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <Plate
              name="house"
              className="mx-auto max-w-3xl"
              alt="Engraved garden elevation of a two-storey house with arched ground-floor openings, a balustrade and trees on either side."
            />
            <div className="border-t border-vq-ink" />
            <Reveal className="flex flex-col gap-8 py-14 lg:flex-row lg:items-end lg:justify-between lg:py-20">
              <div>
                <h2 className="vq-display text-4xl sm:text-5xl">
                  Create your account
                </h2>
                <p className="vq-prose mt-4 max-w-lg">
                  It takes a couple of minutes. Keep your phone nearby: you
                  will need an authenticator app to finish.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a href={SIGN_UP} className="vq-btn">
                  Create account
                  <ArrowRight size={16} className="vq-nudge" aria-hidden="true" />
                </a>
                <a href={SIGN_IN} className="vq-btn-ghost">
                  Sign in
                </a>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="border-t border-vq-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-9 text-[13px] text-vq-muted sm:px-8 md:flex-row md:items-center md:justify-between">
          <Logo size={22} className="text-vq-ink" />
          <p className="max-w-md md:text-center">
            Engravings from the plate volumes of Diderot and d’Alembert’s
            Encyclopédie (1762). Public domain, via Wikimedia Commons.
          </p>
          <p>© {new Date().getFullYear()} VORQ</p>
        </div>
      </footer>
    </div>
  );
}
