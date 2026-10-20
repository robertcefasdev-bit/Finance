import { useState } from "react";
import { fmt } from "../data/mockData";
import type { Card, Expense, FixedExpense, Friend } from "../data/mockData";
import { invoiceBreakdown, invoiceMonth, localToday, maskMoney, moneyStr, ymLabel } from "../utils/finance";
import { S } from "../theme";

const shift = (ym: string, delta: number) => {
  const [y, m] = ym.split("-").map(Number);
  const idx = y * 12 + (m - 1) + delta;
  return `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, "0")}`;
};

// Fatura do cartão: valor do banco x o que está registrado (meu e de cada devedor)
export default function InvoiceModal({
  card,
  expenses,
  friends,
  fixedExpenses,
  onSave,
  onClose,
}: {
  card: Card;
  expenses: Expense[];
  friends: Friend[];
  fixedExpenses: FixedExpense[];
  onSave: (cardId: string, ym: string, value: number | null) => void;
  onClose: () => void;
}) {
  const [ym, setYm] = useState(invoiceMonth(localToday(), card));
  const stored = card.invoices?.[ym];
  const [value, setValue] = useState(stored !== undefined ? moneyStr(stored) : "");
  const [savedMsg, setSavedMsg] = useState("");

  const goTo = (next: string) => {
    setYm(next);
    const v = card.invoices?.[next];
    setValue(v !== undefined ? moneyStr(v) : "");
    setSavedMsg("");
  };

  const data = invoiceBreakdown(card, ym, expenses, friends, fixedExpenses);
  const informed = parseFloat(value.replace(",", "."));
  const hasInformed = !isNaN(informed) && informed > 0;
  const diff = hasInformed ? Math.round((informed - data.total) * 100) / 100 : 0;

  const row = (label: string, amount: number, hint?: string) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "7px 0" }}>
      <div>
        <p style={{ color: S.text, fontSize: 14 }}>{label}</p>
        {hint && <p style={{ color: S.muted, fontSize: 11 }}>{hint}</p>}
      </div>
      <p style={{ color: S.text, fontSize: 14, fontWeight: 700 }}>{fmt(amount)}</p>
    </div>
  );

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 150, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 430, maxHeight: "90vh", overflowY: "auto", background: S.surface, borderRadius: "20px 20px 0 0", padding: 20 }}
      >
        <p style={{ color: S.text, fontSize: 17, fontWeight: 700 }}>Fatura · {card.name}</p>
        <p style={{ color: S.muted, fontSize: 12, marginBottom: 14 }}>
          {card.bank} · fecha dia {card.closing} · vence dia {card.due}
        </p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <button onClick={() => goTo(shift(ym, -1))} aria-label="Mês anterior" style={navBtn}>‹</button>
          <p style={{ color: S.text, fontSize: 16, fontWeight: 700 }}>Fatura de {ymLabel(ym)}</p>
          <button onClick={() => goTo(shift(ym, 1))} aria-label="Próximo mês" style={navBtn}>›</button>
        </div>

        <label style={{ display: "block" }}>
          <span style={{ color: S.muted, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Valor da fatura (do banco)
          </span>
          <input
            inputMode="numeric"
            value={value}
            onChange={(e) => {
              setValue(maskMoney(e.target.value));
              setSavedMsg("");
            }}
            placeholder="0,00"
            style={{ width: "100%", marginTop: 6, background: S.surface2, border: `1px solid ${S.border}`, borderRadius: 12, padding: "12px 14px", color: S.text, fontSize: 16, outline: "none" }}
          />
        </label>

        <div style={{ marginTop: 16, background: S.bg, border: `1px solid ${S.border}`, borderRadius: 14, padding: "8px 14px" }}>
          <p style={{ color: S.muted, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", margin: "6px 0 2px" }}>
            Registrado no app
          </p>
          {row("Eu", data.mine + data.fixed, data.fixed > 0 ? `inclui fixas: ${fmt(data.fixed)}` : undefined)}
          {data.debtors.map((d) => (
            <div key={d.id}>{row(d.name, d.amount)}</div>
          ))}
          {data.debtors.length === 0 && (
            <p style={{ color: S.muted, fontSize: 12, padding: "4px 0" }}>Nenhum devedor neste cartão nesta fatura.</p>
          )}
          <div style={{ borderTop: `1px solid ${S.border}`, marginTop: 4 }}>{row("Total registrado", data.total)}</div>
        </div>

        {hasInformed ? (
          <p
            style={{
              marginTop: 12,
              fontSize: 14,
              fontWeight: 700,
              color: diff === 0 ? S.green : diff > 0 ? "#ef4444" : S.orange,
            }}
          >
            {diff === 0
              ? "✓ Tudo registrado: bate com a fatura."
              : diff > 0
                ? `⚠️ Faltam ${fmt(diff)} para registrar.`
                : `⚠️ O registrado passa da fatura em ${fmt(-diff)}.`}
          </p>
        ) : (
          <p style={{ marginTop: 12, fontSize: 12, color: S.muted }}>
            Informe o valor da fatura para ver se falta registrar alguma compra.
          </p>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button
            onClick={() => {
              onSave(card.id, ym, hasInformed ? Math.round(informed * 100) / 100 : null);
              setSavedMsg(hasInformed ? "Fatura salva ✓" : "Valor removido");
            }}
            style={{ flex: 1, padding: 13, borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${S.purpleDim}, ${S.purple})`, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
          >
            Salvar valor da fatura
          </button>
          <button
            onClick={onClose}
            style={{ padding: "13px 18px", borderRadius: 12, border: `1px solid ${S.border}`, background: "none", color: S.muted, fontSize: 14, cursor: "pointer" }}
          >
            Fechar
          </button>
        </div>
        {savedMsg && <p style={{ color: S.green, fontSize: 12, marginTop: 8, textAlign: "center" }}>{savedMsg}</p>}
      </div>
    </div>
  );
}

const navBtn = {
  width: 36,
  height: 36,
  borderRadius: "50%",
  border: `1px solid ${S.border}`,
  background: S.surface2,
  color: S.text,
  fontSize: 20,
  cursor: "pointer",
} as const;
