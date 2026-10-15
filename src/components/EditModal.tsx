import { useState } from "react";
import { S } from "../theme";

export interface EditField {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "select";
  options?: { value: string; label: string }[];
  suggestions?: string[]; // sugestões para campos de texto
  step?: string;
  placeholder?: string;
}

// Janela simples de edição. onSave devolve uma mensagem de erro (ou null se deu certo).
export default function EditModal({
  title,
  fields,
  initial,
  onSave,
  onClose,
  preview,
}: {
  title: string;
  fields: EditField[];
  initial: Record<string, string>;
  onSave: (values: Record<string, string>) => string | null;
  onClose: () => void;
  preview?: (values: Record<string, string>) => string | null;
}) {
  const [values, setValues] = useState(initial);
  const [error, setError] = useState("");

  const input = {
    width: "100%",
    background: S.surface2,
    border: `1px solid ${S.border}`,
    borderRadius: 12,
    padding: "12px 14px",
    color: S.text,
    fontSize: 15,
    outline: "none",
  } as const;

  const save = () => {
    const message = onSave(values);
    if (message) setError(message);
    else onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 150, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 430, maxHeight: "90vh", overflowY: "auto", background: S.surface, borderRadius: "20px 20px 0 0", padding: 20 }}
      >
        <p style={{ color: S.text, fontSize: 17, fontWeight: 700, marginBottom: 14 }}>{title}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {fields.map((field) => (
            <label key={field.key} style={{ display: "block" }}>
              <span style={{ color: S.muted, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                {field.label}
              </span>
              {field.type === "select" ? (
                <select
                  value={values[field.key] ?? ""}
                  onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                  style={{ ...input, marginTop: 6 }}
                >
                  {field.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <>
                  <input
                    type={field.type}
                    step={field.step}
                    inputMode={field.type === "number" ? "decimal" : undefined}
                    list={field.suggestions ? `list-${field.key}` : undefined}
                    value={values[field.key] ?? ""}
                    placeholder={field.placeholder}
                    onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                    style={{ ...input, marginTop: 6 }}
                  />
                  {field.suggestions && (
                    <datalist id={`list-${field.key}`}>
                      {field.suggestions.map((s) => (
                        <option key={s} value={s} />
                      ))}
                    </datalist>
                  )}
                </>
              )}
            </label>
          ))}
        </div>
        {preview && preview(values) && (
          <p style={{ color: S.muted, fontSize: 12, marginTop: 12 }}>{preview(values)}</p>
        )}
        {error && <p style={{ color: "#ef4444", fontSize: 13, marginTop: 12 }}>⚠️ {error}</p>}
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button
            onClick={save}
            style={{ flex: 1, padding: 13, borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${S.purpleDim}, ${S.purple})`, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
          >
            Salvar
          </button>
          <button
            onClick={onClose}
            style={{ padding: "13px 18px", borderRadius: 12, border: `1px solid ${S.border}`, background: "none", color: S.muted, fontSize: 14, cursor: "pointer" }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
