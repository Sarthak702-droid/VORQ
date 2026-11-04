import React, { useId } from "react";
import { Field } from "./api";
import { Plus, Trash2 } from "lucide-react";
type Values = Record<string, unknown>;
export function defaults(fields: Field[]): Values {
  return Object.fromEntries(
    fields
      .filter((f) => f.default && !f.default.startsWith(":"))
      .map((f) => [
        f.name,
        f.default === "Today"
          ? new Date().toLocaleDateString("en-CA")
          : f.default,
      ]),
  );
}
export function RecordForm({
  fields,
  values,
  onChange,
  disabled = false,
}: {
  fields: Field[];
  values: Values;
  onChange: (v: Values) => void;
  disabled?: boolean;
}) {
  const formId = useId();
  const change = (name: string, value: unknown) =>
    onChange({ ...values, [name]: value });
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((f) => {
        if (f.type === "Table") {
          const rows = (values[f.name] || []) as Values[];
          return (
            <fieldset
              key={f.name}
              className="sm:col-span-2 border rounded-xl p-4 space-y-4"
            >
              <legend className="px-2 font-semibold">{f.label}</legend>
              {rows.map((row, i) => (
                <div className="border-b pb-4" key={i}>
                  <div className="flex justify-between mb-3">
                    <span className="text-sm text-slate-500">Line {i + 1}</span>
                    <button
                      type="button"
                      disabled={disabled}
                      aria-label={`Remove line ${i + 1}`}
                      onClick={() =>
                        change(
                          f.name,
                          rows.filter((_, j) => i !== j),
                        )
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <RecordForm
                    disabled={disabled}
                    fields={f.children || []}
                    values={row}
                    onChange={(v) =>
                      change(
                        f.name,
                        rows.map((r, j) => (i === j ? v : r)),
                      )
                    }
                  />
                </div>
              ))}
              <button
                type="button"
                disabled={disabled}
                className="secondary"
                onClick={() =>
                  change(f.name, [...rows, defaults(f.children || [])])
                }
              >
                <Plus size={16} /> Add line
              </button>
            </fieldset>
          );
        }
        const numeric = ["Int", "Float", "Currency", "Percent"].includes(
          f.type,
        );
        const common = {
          id: `${formId}-${f.name}`,
          required: f.required,
          disabled,
          value: String(values[f.name] ?? ""),
          onChange: (
            e: React.ChangeEvent<
              HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
            >,
          ) => change(f.name, e.target.value),
        };
        return (
          <label
            key={f.name}
            className={`text-sm font-medium ${["Small Text", "Text", "Text Editor"].includes(f.type) ? "sm:col-span-2" : ""}`}
            htmlFor={common.id}
          >
            <span className="block mb-1.5">
              {f.label}
              {f.required && " *"}
            </span>
            {f.type === "Select" ? (
              <select {...common}>
                <option value="">Select {f.label.toLowerCase()}</option>
                {(f.options || "")
                  .split("\n")
                  .filter(Boolean)
                  .map((o) => (
                    <option key={o}>{o}</option>
                  ))}
              </select>
            ) : ["Small Text", "Text", "Text Editor"].includes(f.type) ? (
              <textarea {...common} rows={3} />
            ) : f.type === "Check" ? (
              <input
                type="checkbox"
                disabled={disabled}
                checked={Boolean(Number(values[f.name] || 0))}
                onChange={(e) => change(f.name, e.target.checked ? 1 : 0)}
              />
            ) : (
              <input
                {...common}
                type={f.type === "Date" ? "date" : numeric ? "number" : "text"}
                step={numeric ? "any" : undefined}
                placeholder={
                  f.type === "Link" ? `${f.options} record ID` : undefined
                }
              />
            )}
          </label>
        );
      })}
    </div>
  );
}
