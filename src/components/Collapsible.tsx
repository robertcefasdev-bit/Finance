import { useState } from "react";
import type { ReactNode } from "react";
import { fmt } from "../data/mockData";
import { ymLabel } from "../utils/finance";
import { S } from "../theme";

// Bloco recolhido por padrão, com uma setinha ▾ para abrir (mesmo estilo da Home)
export default function Collapsible({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 12, borderTop: `1px solid ${S.border}`, paddingTop: 8 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "none",
          border: "none",
          padding: "4px 0",
          cursor: "pointer",
        }}
      >
        <span
          style={{
            color: S.muted,
            fontSize: 11,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {title}
        </span>
        <span
          style={{
            color: S.muted,
            fontSize: 14,
            display: "inline-block",
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.2s",
          }}
        >
          ▾
        </span>
      </button>
      {open && <div style={{ marginTop: 8 }}>{children}</div>}
    </div>
  );
}

// Linhas "mês — valor" e o total geral, usadas dentro do bloco recolhido
export function OwedBreakdown({
  dueNow,
  future,
  total,
}: {
  dueNow: number;
  future: { ym: string; amount: number }[];
  total: number;
}) {
  const row = (label: string, amount: number, color: string, bold = false) => (
    <div
      key={label}
      style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "5px 0", fontSize: 13 }}
    >
      <span style={{ color: bold ? S.text : S.muted, fontWeight: bold ? 700 : 400, textTransform: "capitalize" }}>
        {label}
      </span>
      <span style={{ color, fontWeight: 700 }}>{fmt(amount)}</span>
    </div>
  );
  return (
    <div>
      {dueNow > 0 && row("Este mês", dueNow, S.orange)}
      {future.map((m) => row(`Fatura ${ymLabel(m.ym)}`, m.amount, S.purple))}
      <div style={{ borderTop: `1px solid ${S.border}`, marginTop: 4, paddingTop: 4 }}>
        {row("Total geral", total, S.green, true)}
      </div>
    </div>
  );
}
