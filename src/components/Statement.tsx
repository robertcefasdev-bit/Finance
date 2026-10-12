import type { ReactNode } from "react";
import { fmt } from "../data/mockData";
import { S } from "../theme";

// Lista no estilo "extrato": agrupada por dia, com o total do dia no topo de cada grupo.
export interface StatementRow {
  id: string;
  date: string; // "AAAA-MM-DD" ("" = sem data, ex.: despesa fixa)
  time?: string; // "19h49"
  icon: string;
  iconColor?: string;
  title: string;
  subtitle: string;
  amount: number; // sempre positivo
  kind: "out" | "in"; // out = gasto/dívida (−), in = entrada (+)
  dim?: boolean;
  meta?: ReactNode; // aparece embaixo do valor (no lugar do horário)
  onClick?: () => void;
}

const parseDay = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

function dayLabel(iso: string) {
  const date = parseDay(iso);
  const today = new Date();
  const start = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((start(today) - start(date)) / 86400000);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Ontem";
  return date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    ...(date.getFullYear() !== today.getFullYear() ? { year: "numeric" as const } : {}),
  });
}

export default function StatementList({
  rows,
  undatedLabel = "Sem data",
  emptyText = "Nada por aqui ainda.",
}: {
  rows: StatementRow[];
  undatedLabel?: string;
  emptyText?: string;
}) {
  if (rows.length === 0) {
    return (
      <p style={{ color: S.muted, fontSize: 13, textAlign: "center", padding: "20px 0" }}>
        {emptyText}
      </p>
    );
  }

  const groups = new Map<string, StatementRow[]>();
  for (const row of rows) {
    groups.set(row.date, [...(groups.get(row.date) ?? []), row]);
  }
  const keys = [...groups.keys()].sort((a, b) => {
    if (!a) return 1; // sem data vai para o fim
    if (!b) return -1;
    return b.localeCompare(a);
  });

  return (
    <div>
      {keys.map((key) => {
        const list = [...(groups.get(key) ?? [])].sort((a, b) =>
          (b.time ?? "").localeCompare(a.time ?? ""),
        );
        const mixed = list.some((r) => r.kind === "in");
        const net = list.reduce((sum, r) => sum + (r.kind === "in" ? r.amount : -r.amount), 0);
        const total = mixed ? `${net >= 0 ? "+ " : "- "}${fmt(Math.abs(net))}` : fmt(Math.abs(net));
        return (
          <div key={key || "undated"} style={{ marginBottom: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
              <p style={{ color: S.text, fontSize: 15, fontWeight: 700 }}>
                {key ? dayLabel(key) : undatedLabel}
              </p>
              <p style={{ color: S.muted, fontSize: 12 }}>
                {key ? "Total do dia" : "Por mês"} {total}
              </p>
            </div>
            {list.map((row) => {
              const accent = row.iconColor ?? S.muted;
              return (
                <div
                  key={row.id}
                  onClick={row.onClick}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "12px 0",
                    cursor: row.onClick ? "pointer" : "default",
                    opacity: row.dim ? 0.55 : 1,
                  }}
                >
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: "50%",
                      border: `2px solid ${accent}55`,
                      background: S.surface,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      flexShrink: 0,
                    }}
                  >
                    {row.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: S.text, fontSize: 15, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {row.title}
                    </p>
                    <p style={{ color: S.muted, fontSize: 12, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {row.subtitle}
                    </p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ color: row.kind === "in" ? S.green : S.text, fontSize: 15, fontWeight: 700 }}>
                      {row.kind === "in" ? "+ " : "- "}
                      {fmt(row.amount)}
                    </p>
                    <div style={{ marginTop: 3, display: "flex", justifyContent: "flex-end", gap: 6, alignItems: "center", color: S.muted, fontSize: 12 }}>
                      {row.meta ?? row.time}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
