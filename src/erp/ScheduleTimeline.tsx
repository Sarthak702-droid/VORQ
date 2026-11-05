import { RecordRow } from "./api";
const day = (v: unknown) =>
  typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)
    ? Date.parse(`${v}T00:00:00Z`) / 86400000
    : NaN;
export function ScheduleTimeline({
  records,
  onOpen,
}: {
  records: RecordRow[];
  onOpen: (row: RecordRow) => void;
}) {
  const dated = records.filter(
    (r) =>
      Number.isFinite(day(r.exp_start_date)) &&
      Number.isFinite(day(r.exp_end_date)),
  );
  if (!dated.length) return null;
  const start = Math.min(...dated.map((r) => day(r.exp_start_date)));
  const end = Math.max(start + 1, ...dated.map((r) => day(r.exp_end_date)));
  const span = end - start + 1;
  return (
    <section className="panel p-5 mb-5">
      <div className="flex justify-between mb-5">
        <h2 className="font-semibold">Project timeline</h2>
        <span className="text-xs text-slate-500">
          {dated.length} scheduled tasks loaded
        </span>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[240px_1fr] text-xs text-slate-500 border-b pb-3">
            <span>Task / milestone</span>
            <div className="flex justify-between">
              <span>
                {new Date(start * 86400000).toLocaleDateString("en-IN", {
                  timeZone: "UTC",
                })}
              </span>
              <span>
                {new Date(end * 86400000).toLocaleDateString("en-IN", {
                  timeZone: "UTC",
                })}
              </span>
            </div>
          </div>
          {dated.map((r) => (
            <div
              className="grid grid-cols-[240px_1fr] items-center gap-3 min-h-14 border-b last:border-0"
              key={r.name}
            >
              <button
                className="text-left text-xs font-medium truncate"
                onClick={() => onOpen(r)}
              >
                {String(r.subject || r.name)}
              </button>
              <div
                className="relative h-7 bg-slate-50 rounded"
                aria-label={`${r.subject}: ${r.exp_start_date} to ${r.exp_end_date}, ${r.progress || 0}% complete`}
              >
                <div
                  className="absolute top-1 h-5 rounded bg-emerald-200 overflow-hidden"
                  style={{
                    left: `${(100 * (day(r.exp_start_date) - start)) / span}%`,
                    width: `${Math.max(1, (100 * (day(r.exp_end_date) - day(r.exp_start_date) + 1)) / span)}%`,
                  }}
                >
                  <div
                    className="h-full bg-emerald-700"
                    style={{
                      width: `${Math.max(0, Math.min(100, Number(r.progress) || 0))}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
