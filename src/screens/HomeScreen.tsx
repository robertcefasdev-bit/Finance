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
import { commitColor, commitLabel, monthlyAmount } from "../utils/finance";
import type {
  Screen,
  Card,
  Expense,
  FixedExpense,
  Friend,
} from "../data/mockData";
import { S } from "../theme";
import StatementList, { type StatementRow } from "../components/Statement";


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
  onLogout,
  onRemoveExpense,
  onTogglePaid,
}: Props) {
  const [chartType, setChartType] = useState<"pie" | "line">("pie");

  const totalOwed = friends.reduce((s, f) => s + f.totalOwed, 0);
  const activeFixedExpenses = fixedExpenses
    .filter((expense) => expense.active)
    .reduce((sum, expense) => sum + expense.amount, 0);
  const baseExpenses = expenses
    .filter((e) => !e.paid)
    .reduce((s, e) => s + monthlyAmount(e), 0);
  const totalExpenses = baseExpenses + activeFixedExpenses;
  const chartData = Array.from({ length: 6 }, (_, index) => ({
    month: `${["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"][new Date().getMonth() + index >= 12 ? new Date().getMonth() + index - 12 : new Date().getMonth() + index]} ${new Date().getFullYear() + (new Date().getMonth() + index >= 12 ? 1 : 0)}`,
    salary,
    expenses: baseExpenses + activeFixedExpenses,
  }));
  const pieData = [
    {
      name: "Disponível",
      value: Math.max(salary - totalExpenses, 0),
      color: S.green,
    },
    {
      name: "Comprometido",
      value: Math.min(totalExpenses, Math.max(salary, 1)),
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
        cardId: "",
        amount: expense.amount,
        date: "",
        kind: "fixed" as const,
      })),
  ];

  const daysUntilClosing = (day: number) => {
    const today = 6;
    const diff = day >= today ? day - today : 30 - today + day;
    return diff;
  };

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
              {fmt(totalExpenses)}
            </p>
          </div>
        </div>
        <CommitBar pct={salary > 0 ? (totalExpenses / salary) * 100 : 0} />
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
            Visão Geral
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
        <StatementList
          undatedLabel="Despesas fixas"
          emptyText="Nenhuma despesa ainda."
          rows={visibleExpenses.map((exp): StatementRow => {
            const card = cards.find((c) => c.id === exp.cardId);
            const isFixed = exp.kind === "fixed";
            const where = isFixed
              ? "Despesa fixa · todo mês"
              : exp.cardId === "cash"
                ? "💵 Dinheiro"
                : (card?.bank ?? "Cartão");
            return {
              id: exp.id,
              date: isFixed ? "" : exp.date,
              icon: exp.categoryIcon,
              iconColor: CARD_COLOR[exp.cardId] ?? S.purple,
              title: exp.title,
              subtitle: isFixed ? where : `${where} · ${exp.category}`,
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
                  <button
                    type="button"
                    onClick={() => onRemoveExpense(exp.id)}
                    aria-label={`Remover ${exp.title}`}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      border: "1px solid #ef444440",
                      background: "#ef444415",
                      color: "#ef4444",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    ×
                  </button>
                </>
              ),
            };
          })}
        />
      </div>

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
              A receber: {fmt(totalOwed)}
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
          {friends.map((f) => {
            const daysClose = cards
              .map((c) => daysUntilClosing(c.closing))
              .sort()[0];
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
                  {daysClose <= 3 && (
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
                  {fmt(f.totalOwed)}
                </p>
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: 6,
                    background: f.status === "paid" ? "#22c55e20" : "#f59e0b20",
                    border: `1px solid ${f.status === "paid" ? "#22c55e40" : "#f59e0b40"}`,
                    color: f.status === "paid" ? S.green : "#f59e0b",
                    fontSize: 9,
                    fontWeight: 600,
                  }}
                >
                  {f.status === "paid" ? "Em dia" : "Pendente"}
                </span>
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
            const days = daysUntilClosing(card.closing);
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
                  Fecha dia {card.closing}
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
                      background: days <= 3 ? "#ef4444" : S.green,
                      boxShadow: `0 0 5px ${days <= 3 ? "#ef4444" : S.green}`,
                    }}
                  />
                  <p
                    style={{
                      color: days <= 3 ? "#ef4444" : S.green,
                      fontSize: 10,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {days === 0 ? "Fecha hoje!" : `Fecha em ${days} dias`}
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
