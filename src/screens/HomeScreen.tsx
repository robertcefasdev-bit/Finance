import { useEffect, useRef, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { fmt } from "../data/mockData";
import { receivableHeadline, cardCycle, cardCycleText, commitColor, commitLabel, currentYM, expenseStart, invoiceMonth, invoiceNote, lastOwnMonthOffset, monthlyAmount, ownMonthAmount, ymLabel, moneyStr } from "../utils/finance";
import type {
  Screen,
  Card,
  Expense,
  FixedExpense,
  Friend,
} from "../data/mockData";
import { S } from "../theme";
import StatementList, { type StatementRow } from "../components/Statement";
import EditModal from "../components/EditModal";
import MoreMenu from "../components/MoreMenu";
import { CATEGORIES } from "./AddExpenseScreen";


const CARD_COLOR: Record<string, string> = {
  nubank: S.purple,
  itau: S.orange,
  xp: S.blue,
};

interface Props {
  navigate: (s: Screen, data?: unknown) => void;
  cards: Card[];
  friends: Friend[];
  expenses: Expense[];
  fixedExpenses: FixedExpense[];
  salary: number;
  userName: string;
  cardUsage: Record<string, number>;
  onEditExpense: (
    expenseId: string,
    v: { title: string; amount: number; installments: number; category: string; categoryIcon: string; cardId: string; date: string; startMonth: string },
  ) => void;
  onLogout: () => void;
  onRemoveExpense: (expenseId: string) => void;
  onTogglePaid: (expenseId: string) => void;
}

// Barra do salário comprometido: enche com animação e a cor muda aos poucos
// (verde → amarelo → laranja → vermelho) conforme o percentual sobe.
function CommitBar({ pct }: { pct: number }) {
  const [shown, setShown] = useState(0);
  const shownRef = useRef(0);

  useEffect(() => {
    let raf = 0;
    const from = shownRef.current;
    const start = performance.now();
    const duration = 1000;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = from + (pct - from) * eased;
      shownRef.current = value;
      setShown(value);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pct]);

  const color = commitColor(shown);
  const critical = pct >= 80;

  return (
    <>
      <style>{`
        @keyframes commitShimmer { from { transform: translateX(-120%); } to { transform: translateX(380%); } }
        @keyframes commitPulse { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.4); } }
      `}</style>
      <div
        style={{
          position: "relative",
          background: S.border,
          borderRadius: 8,
          height: 10,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            width: `${Math.min(shown, 100)}%`,
            height: "100%",
            borderRadius: 8,
            background: color,
            boxShadow: `0 0 12px ${color}`,
            animation: critical ? "commitPulse 1.1s ease-in-out infinite" : undefined,
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              width: "35%",
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
              animation: "commitShimmer 2.2s linear infinite",
            }}
          />
        </div>
        {[40, 60, 80].map((mark) => (
          <span
            key={mark}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${mark}%`,
              width: 2,
              background: S.bg,
              opacity: 0.6,
            }}
          />
        ))}
      </div>
      <p
        style={{
          marginTop: 6,
          fontSize: 11,
          fontFamily: "'JetBrains Mono', monospace",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span style={{ color: S.muted }}>{Math.round(pct)}% do salário comprometido</span>
        <span style={{ color, fontWeight: 700, transition: "color 0.3s" }}>
          {commitLabel(pct)}
        </span>
      </p>
    </>
  );
}

export default function HomeScreen({
  navigate,
  cards,
  friends,
  expenses,
  fixedExpenses,
  salary,
  userName,
  cardUsage,
  onEditExpense,
  onLogout,
  onRemoveExpense,
  onTogglePaid,
}: Props) {
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedOff, setSelectedOff] = useState<number | null>(null);
  const [riskOpen, setRiskOpen] = useState(false);
  const [cardFilter, setCardFilter] = useState("all");
  const [visibleCount, setVisibleCount] = useState(8);
  const [chartType, setChartType] = useState<"pie" | "line">("pie");

  // devedores: valor do mês atual ou, se não houver, o da próxima fatura
  const receivable = receivableHeadline(friends);
  const headlines = friends.map((f, i) => ({ f, head: receivable.heads[i] }));
  const totalOwed = receivable.total;
  const owedNote = receivable.note;
  const activeFixedExpenses = fixedExpenses
    .filter((expense) => expense.active)
    .reduce((sum, expense) => sum + expense.amount, 0);
  const baseExpenses = expenses
    .filter((e) => !e.paid && expenseStart(e) <= currentYM())
    .reduce((s, e) => s + monthlyAmount(e), 0);
  const totalExpenses = baseExpenses + activeFixedExpenses;

  // Risco por mês: se este mês não tem despesa minha, mostra o próximo mês que tiver,
  // e lista os meses seguintes até onde vai a minha última dívida.
  const riskMonths = (() => {
    const now = new Date();
    const last = lastOwnMonthOffset(expenses);
    return Array.from({ length: last + 1 }, (_, off) => {
      const ref = new Date(now.getFullYear(), now.getMonth() + off, 1);
      const own = off === 0 ? baseExpenses : ownMonthAmount(expenses, ref);
      return { off, ref, own, total: own + activeFixedExpenses };
    });
  })();
  // só aparecem os meses em que existe despesa minha
  const pillMonths = riskMonths.filter((r) => r.own > 0);
  const focusMonth =
    pillMonths.find((r) => r.off === selectedOff) ?? pillMonths[0] ?? riskMonths[0];
  const shortMonth = (d: Date) =>
    `${["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"][d.getMonth()]} ${d.getFullYear()}`;
  const monthName = (d: Date) => d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const chartData = Array.from({ length: Math.max(6, riskMonths.length) }, (_, index) => {
    const ref = new Date(new Date().getFullYear(), new Date().getMonth() + index, 1);
    const own = index === 0 ? baseExpenses : ownMonthAmount(expenses, ref);
    return { month: shortMonth(ref), salary, expenses: own + activeFixedExpenses };
  });
  const pieData = [
    {
      name: "Disponível",
      value: Math.max(salary - focusMonth.total, 0),
      color: S.green,
    },
    {
      name: "Comprometido",
      value: Math.min(focusMonth.total, Math.max(salary, 1)),
      color: S.purple,
    },
  ];

  const visibleExpenses: Array<Expense & { kind: "expense" | "fixed" }> = [
    ...expenses.map((exp) => ({ ...exp, kind: "expense" as const })),
    ...fixedExpenses
      .filter((expense) => expense.active)
      .map((expense) => ({
        id: expense.id,
        title: expense.name,
        category: "Despesa fixa",
        categoryIcon: "🧾",
        cardId: expense.cardId ?? "",
        amount: expense.amount,
        date: "",
        kind: "fixed" as const,
      })),
  ];

  // filtro por cartão na lista de despesas
  const hasCash = visibleExpenses.some((e) => e.cardId === "cash");
  const filteredExpenses =
    cardFilter === "all" ? visibleExpenses : visibleExpenses.filter((e) => e.cardId === cardFilter);
  // mais recentes primeiro; as fixas (sem data) ficam por último
  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    if (!a.date) return b.date ? 1 : 0;
    if (!b.date) return -1;
    return b.date.localeCompare(a.date);
  });
  const shownExpenses = sortedExpenses.slice(0, visibleCount);
  const filteredOpenTotal = filteredExpenses
    .filter((e) => !e.paid)
    .reduce((sum, e) => sum + (e.kind === "fixed" ? e.amount : monthlyAmount(e)), 0);

  return (
    <div
      style={{
        background: S.bg,
        minHeight: "100%",
        fontFamily: "'Outfit', sans-serif",
        paddingBottom: 90,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "52px 20px 0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <p
            style={{
              color: S.muted,
              fontSize: 12,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              fontFamily: "'JetBrains Mono', monospace",
              marginBottom: 4,
            }}
          >
            {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: S.text }}>
            Olá, {userName} 👋
          </h1>
        </div>
        <button
          onClick={() => {
            if (window.confirm("Sair da conta?")) onLogout();
          }}
          aria-label="Sair da conta"
          title="Sair"
          style={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            border: "none",
            background: `linear-gradient(135deg, ${S.purpleDim}, ${S.purple})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>

      {/* Balance bar */}
      <div
        style={{
          margin: "20px 20px 0",
          background: S.surface,
          borderRadius: 20,
          padding: "18px 20px",
          border: `1px solid ${S.border}`,
        }}
      >
        {(pillMonths.length > 1 || (pillMonths.length === 1 && pillMonths[0].off > 0)) && (
          <div
            className="scrollbar-hide"
            style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 14, paddingBottom: 2 }}
          >
            {pillMonths.map((r) => {
              const active = r.off === focusMonth.off;
              return (
                <button
                  key={r.off}
                  onClick={() => setSelectedOff(r.off)}
                  style={{
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                    padding: "8px 16px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: active ? 700 : 500,
                    cursor: "pointer",
                    border: active ? "none" : `1px solid ${S.border}`,
                    background: active
                      ? `linear-gradient(135deg, ${S.purpleDim}, ${S.purple})`
                      : S.bg,
                    color: active ? "#fff" : S.muted,
                    boxShadow: active ? `0 0 14px ${S.purple}55` : "none",
                    transition: "all 0.2s",
                  }}
                >
                  {shortMonth(r.ref)}
                </button>
              );
            })}
          </div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <div>
            <p
              style={{
                color: S.muted,
                fontSize: 11,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontFamily: "'JetBrains Mono', monospace",
                marginBottom: 4,
              }}
            >
              Salário
            </p>
            <p style={{ fontSize: 22, fontWeight: 700, color: S.green }}>
              {fmt(salary)}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p
              style={{
                color: S.muted,
                fontSize: 11,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontFamily: "'JetBrains Mono', monospace",
                marginBottom: 4,
              }}
            >
              Despesas
            </p>
            <p style={{ fontSize: 22, fontWeight: 700, color: S.purple }}>
              {fmt(focusMonth.total)}
            </p>
          </div>
        </div>
        <CommitBar
          key={focusMonth.off}
          pct={salary > 0 ? (focusMonth.total / salary) * 100 : 0}
        />
        {pillMonths.length > 1 && (
          <div style={{ marginTop: 16, borderTop: `1px solid ${S.border}`, paddingTop: 10 }}>
            <button
              onClick={() => setRiskOpen((v) => !v)}
              aria-expanded={riskOpen}
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
              <span style={{ color: S.muted, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>
                Risco nos próximos meses
              </span>
              <span
                style={{
                  color: S.muted,
                  fontSize: 14,
                  display: "inline-block",
                  transform: riskOpen ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s",
                }}
              >
                ▾
              </span>
            </button>
            {riskOpen && (
              <div style={{ marginTop: 10 }}>
                {pillMonths.map((r) => {
                  const pct = salary > 0 ? (r.total / salary) * 100 : 0;
                  const color = commitColor(pct);
                  return (
                    <div
                      key={r.off}
                      onClick={() => setSelectedOff(r.off)}
                      style={{ marginBottom: 10, cursor: "pointer" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                        <span
                          style={{
                            color: r.off === focusMonth.off ? S.purple : S.text,
                            fontWeight: r.off === focusMonth.off ? 700 : 400,
                            textTransform: "capitalize",
                          }}
                        >
                          {monthName(r.ref)}
                        </span>
                        <span style={{ color, fontWeight: 700 }}>
                          {fmt(r.total)} · {Math.round(pct)}%
                        </span>
                      </div>
                      <div style={{ background: S.border, borderRadius: 6, height: 6, overflow: "hidden" }}>
                        <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: color, borderRadius: 6, transition: "width 0.6s ease, background 0.6s ease" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chart toggle */}
      <div style={{ margin: "20px 20px 0" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <p style={{ color: S.text, fontWeight: 600, fontSize: 15 }}>
            Visão Geral{pillMonths.length > 0 ? ` · ${shortMonth(focusMonth.ref)}` : ""}
          </p>
          <div
            style={{
              display: "flex",
              background: S.surface,
              border: `1px solid ${S.border}`,
              borderRadius: 20,
              padding: 3,
              gap: 2,
            }}
          >
            {(["pie", "line"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setChartType(t)}
                style={{
                  padding: "5px 14px",
                  borderRadius: 16,
                  border: "none",
                  background:
                    chartType === t
                      ? `linear-gradient(135deg, ${S.purpleDim}, ${S.purple})`
                      : "transparent",
                  color: chartType === t ? "#fff" : S.muted,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'JetBrains Mono', monospace",
                  transition: "all 0.18s",
                }}
              >
                {t === "line" ? "📈 Linha" : "🥧 Pizza"}
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            background: S.surface,
            border: `1px solid ${S.border}`,
            borderRadius: 20,
            padding: "16px 8px 8px",
          }}
        >
          {chartType === "line" ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{ left: 0, right: 10 }}>
                <XAxis
                  dataKey="month"
                  tick={{
                    fill: S.muted,
                    fontSize: 10,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: S.surface2,
                    border: `1px solid ${S.border}`,
                    borderRadius: 10,
                    fontSize: 11,
                    color: S.text,
                  }}
                  formatter={(value: any) => [fmt(Number(value ?? 0)), ""]}
                />
                <Line
                  type="monotone"
                  dataKey="salary"
                  stroke={S.green}
                  strokeWidth={2}
                  dot={false}
                  name="Salário"
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke={S.purple}
                  strokeWidth={2}
                  dot={false}
                  name="Despesas"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "0 8px 8px",
              }}
            >
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={60}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {pieData.map((d) => (
                  <div
                    key={d.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      justifyContent: "space-between",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 5 }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: d.color,
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ color: S.text2, fontSize: 11 }}>
                        {d.name}
                      </span>
                    </div>
                    <span
                      style={{
                        color: S.text,
                        fontSize: 11,
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 600,
                      }}
                    >
                      {fmt(d.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top Expenses */}
      <div style={{ margin: "20px 20px 0" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <p style={{ color: S.text, fontWeight: 600, fontSize: 15 }}>
            Minhas Despesas
          </p>
          <button
            onClick={() => navigate("addExpense")}
            style={{
              background: "none",
              border: "none",
              color: S.purple,
              fontSize: 12,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            + Nova
          </button>
        </div>
        <div
          className="scrollbar-hide"
          style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 12, paddingBottom: 2 }}
        >
          {[
            { id: "all", label: "Todos" },
            ...cards.map((c) => ({ id: c.id, label: c.name })),
            ...(hasCash ? [{ id: "cash", label: "💵 Dinheiro" }] : []),
          ].map((chip) => {
            const active = cardFilter === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => {
                  setCardFilter(chip.id);
                  setVisibleCount(8);
                }}
                style={{
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                  padding: "7px 14px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: active ? 700 : 500,
                  cursor: "pointer",
                  border: active ? "none" : `1px solid ${S.border}`,
                  background: active ? `linear-gradient(135deg, ${S.purpleDim}, ${S.purple})` : S.surface,
                  color: active ? "#fff" : S.muted,
                }}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
        {cardFilter !== "all" && (
          <p style={{ color: S.muted, fontSize: 12, marginBottom: 10 }}>
            {filteredExpenses.length} despesa(s) · em aberto: {fmt(filteredOpenTotal)}
          </p>
        )}
        <StatementList
          undatedLabel="Despesas fixas"
          emptyText="Nenhuma despesa ainda."
          rows={shownExpenses.map((exp): StatementRow => {
            const card = cards.find((c) => c.id === exp.cardId);
            const isFixed = exp.kind === "fixed";
            const where = isFixed
              ? `Despesa fixa · ${card ? card.name : "todo mês"}`
              : exp.cardId === "cash"
                ? "💵 Dinheiro"
                : (card?.bank ?? "Cartão");
            return {
              id: exp.id,
              date: isFixed ? "" : exp.date,
              icon: exp.categoryIcon,
              iconColor: CARD_COLOR[exp.cardId] ?? S.purple,
              title: exp.title,
              subtitle: isFixed
                ? where
                : `${where} · ${exp.category}${
                    exp.cardId !== "cash" && expenseStart(exp as Expense) > currentYM()
                      ? ` · fatura ${ymLabel(expenseStart(exp as Expense))}`
                      : ""
                  }`,
              amount: isFixed ? exp.amount : monthlyAmount(exp as Expense),
              kind: "out",
              dim: Boolean(exp.paid),
              meta: isFixed ? undefined : (
                <>
                  <button
                    type="button"
                    onClick={() => onTogglePaid(exp.id)}
                    style={{
                      padding: "2px 8px",
                      borderRadius: 6,
                      border: `1px solid ${exp.paid ? "#22c55e40" : "#f59e0b40"}`,
                      background: exp.paid ? "#22c55e20" : "#f59e0b20",
                      color: exp.paid ? S.green : "#f59e0b",
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {exp.paid ? "Paga" : "Pendente"}
                  </button>
                  <MoreMenu
                    label={`Opções de ${exp.title}`}
                    size={26}
                    items={[
                      { icon: "✏️", label: "Editar", onClick: () => setEditingExpense(exp as Expense) },
                      {
                        icon: "🗑️",
                        label: "Excluir",
                        danger: true,
                        onClick: () => {
                          if (window.confirm(`Excluir "${exp.title}"?`)) onRemoveExpense(exp.id);
                        },
                      },
                    ]}
                  />
                </>
              ),
            };
          })}
        />
        {sortedExpenses.length > 8 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 4 }}>
            {visibleCount < sortedExpenses.length && (
              <button
                onClick={() => setVisibleCount((n) => n + 8)}
                style={{ padding: "9px 18px", borderRadius: 999, border: `1px solid ${S.border}`, background: S.surface, color: S.purple, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                Ver mais ({sortedExpenses.length - visibleCount})
              </button>
            )}
            {visibleCount > 8 && (
              <button
                onClick={() => setVisibleCount(8)}
                style={{ padding: "9px 18px", borderRadius: 999, border: `1px solid ${S.border}`, background: "none", color: S.muted, fontSize: 12, cursor: "pointer" }}
              >
                Ver menos
              </button>
            )}
          </div>
        )}
      </div>

      {editingExpense && (
        <EditModal
          title="Editar despesa"
          initial={{
            title: editingExpense.title,
            amount: moneyStr(editingExpense.amount),
            installments: String(editingExpense.installments ?? 1),
            category: editingExpense.category,
            card: editingExpense.cardId,
            date: editingExpense.date,
          }}
          fields={[
            { key: "title", label: "Descrição", type: "text" },
            { key: "amount", label: "Valor total (sua parte, R$)", type: "money" },
            { key: "installments", label: "Parcelas", type: "number", step: "1" },
            { key: "category", label: "Categoria", type: "text", suggestions: CATEGORIES.map((c) => c.label) },
            {
              key: "card",
              label: "Pagamento",
              type: "select",
              options: [
                { value: "cash", label: "💵 Dinheiro" },
                ...cards.map((c) => ({ value: c.id, label: `${c.name} · ${c.bank}` })),
              ],
            },
            { key: "date", label: "Data", type: "date" },
          ]}
          onClose={() => setEditingExpense(null)}
          preview={(v) => invoiceNote(v.date || editingExpense.date, cards.find((c) => c.id === v.card))}
          onSave={(v) => {
            const amount = parseFloat(v.amount.replace(",", "."));
            const n = parseInt(v.installments, 10);
            const category = v.category.trim();
            if (!(amount > 0)) return "Informe um valor maior que zero.";
            if (!(n >= 1 && n <= 60)) return "As parcelas devem ficar entre 1 e 60.";
            if (!category) return "Informe a categoria.";
            const card = cards.find((c) => c.id === v.card);
            if (card) {
              const oldUsage =
                !editingExpense.paid && editingExpense.cardId === card.id ? editingExpense.amount : 0;
              const available = card.limit - (cardUsage[card.id] ?? 0) + oldUsage;
              if (amount > available + 0.005) {
                return `Passa do limite do cartão ${card.name}. Disponível: ${fmt(Math.max(available, 0))}`;
              }
            }
            onEditExpense(editingExpense.id, {
              title: v.title.trim() || category,
              amount: Math.round(amount * 100) / 100,
              installments: n,
              category,
              categoryIcon: CATEGORIES.find((c) => c.label === category)?.icon ?? "📦",
              cardId: v.card,
              date: v.date || editingExpense.date,
              startMonth: invoiceMonth(v.date || editingExpense.date, card),
            });
            return null;
          }}
        />
      )}

      {/* Borrowers */}
      <div style={{ margin: "20px 0 0" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
            padding: "0 20px",
          }}
        >
          <div>
            <p style={{ color: S.text, fontWeight: 600, fontSize: 15 }}>
              Devedores
            </p>
            <p
              style={{
                color: S.green,
                fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 600,
              }}
            >
              A receber: {fmt(totalOwed)}{owedNote ? ` · ${owedNote === "este mês" ? owedNote : `fatura ${ymLabel(owedNote)}`}` : ""}
            </p>
          </div>
          <button
            onClick={() => navigate("debtors")}
            style={{
              background: "none",
              border: "none",
              color: S.purple,
              fontSize: 12,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Ver todos
          </button>
        </div>
        <div
          style={{
            display: "flex",
            gap: 12,
            overflowX: "auto",
            paddingLeft: 20,
            paddingRight: 20,
            paddingBottom: 4,
          }}
          className="scrollbar-hide"
        >
          {headlines.map(({ f, head }) => {
            // aviso "!" quando alguma fatura fechada está perto de vencer
            const soonDue = cards.some((c) => {
              const cycle = cardCycle(c);
              return cycle.phase === "closed" && cycle.days <= 3;
            });
            return (
              <button
                key={f.id}
                onClick={() => navigate("debtorProfile", f)}
                style={{
                  flexShrink: 0,
                  background: S.surface,
                  border: `1px solid ${S.border}`,
                  borderRadius: 18,
                  padding: "14px 16px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  width: 110,
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    `${f.color}60`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    S.border;
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: `${f.color}25`,
                    border: `2px solid ${f.color}60`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 700,
                    color: f.color,
                    fontFamily: "'JetBrains Mono', monospace",
                    position: "relative",
                  }}
                >
                  {f.initials}
                  {soonDue && (
                    <div
                      style={{
                        position: "absolute",
                        top: -2,
                        right: -2,
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        background: "#ef4444",
                        border: `2px solid ${S.surface}`,
                        fontSize: 7,
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      !
                    </div>
                  )}
                </div>
                <p
                  style={{
                    color: S.text,
                    fontSize: 11,
                    fontWeight: 600,
                    textAlign: "center",
                    lineHeight: 1.2,
                  }}
                >
                  {f.name}
                </p>
                <p
                  style={{
                    color: S.green,
                    fontSize: 11,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 700,
                  }}
                >
                  {fmt(head.amount)}
                </p>
                {(() => {
                  const upcoming = head.amount > 0 && head.ym;
                  const tone = head.amount === 0 ? S.green : upcoming ? S.purple : "#f59e0b";
                  return (
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 6,
                        background: `${tone}20`,
                        border: `1px solid ${tone}40`,
                        color: tone,
                        fontSize: 9,
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {head.amount === 0
                        ? "Em dia"
                        : upcoming
                          ? ymLabel(head.ym as string)
                          : "Pendente"}
                    </span>
                  );
                })()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cards */}
      <div style={{ margin: "20px 20px 0" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <p style={{ color: S.text, fontWeight: 600, fontSize: 15 }}>
            Meus Cartões
          </p>
          <button
            onClick={() => navigate("settings")}
            style={{
              background: "none",
              border: "none",
              color: S.purple,
              fontSize: 12,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Gerenciar
          </button>
        </div>
        <div
          style={{
            display: "flex",
            gap: 12,
            overflowX: "auto",
            paddingBottom: 4,
          }}
          className="scrollbar-hide"
        >
          {cards.map((card) => {
            const cycle = cardCycleText(card);
            const statusColor =
              cycle.phase === "closed" ? (cycle.days <= 3 ? "#ef4444" : S.orange) : S.green;
            return (
              <div
                key={card.id}
                style={{
                  flexShrink: 0,
                  width: 200,
                  borderRadius: 18,
                  padding: "16px 18px",
                  background: `linear-gradient(135deg, ${card.color}30, ${card.color}10)`,
                  border: `1px solid ${card.color}40`,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: -20,
                    right: -20,
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    background: `radial-gradient(circle, ${card.color}30, transparent)`,
                  }}
                />
                <p
                  style={{
                    color: card.color,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {card.bank}
                </p>
                <p
                  style={{
                    color: S.text,
                    fontSize: 14,
                    fontWeight: 700,
                    marginTop: 6,
                  }}
                >
                  {card.name}
                </p>
                <p style={{ color: S.text2, fontSize: 10, marginTop: 2 }}>
                  Fecha dia {card.closing} · Vence dia {card.due}
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 10,
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: statusColor,
                      boxShadow: `0 0 5px ${statusColor}`,
                    }}
                  />
                  <p
                    style={{
                      color: statusColor,
                      fontSize: 10,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {cycle.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
