import { useEffect, useMemo, useState } from "react";
import { fmt } from "../data/mockData";
import { installmentNumber, monthlyAmount } from "../utils/finance";
import type { Card, Expense, FixedExpense, Friend } from "../data/mockData";
import { S } from "../theme";


const CARD_COLOR: Record<string, string> = {
  nubank: S.purple,
  itau: S.orange,
  xp: S.blue,
};
const CARD_NAME: Record<string, string> = {
  nubank: "Nubank",
  itau: "Itaú",
  xp: "XP Cartão",
};

type FilterType = "all" | "mine" | string;

interface Props {
  friends: Friend[];
  expenses: Expense[];
  fixedExpenses: FixedExpense[];
  salary: number;
  cards: Card[];
}

export default function FutureExpensesScreen({
  friends,
  expenses,
  fixedExpenses,
  salary,
  cards,
}: Props) {
  const [activeMonth, setActiveMonth] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  const projection = useMemo(() => {
    const activeFixed = fixedExpenses.filter((item) => item.active);
    const totalFixed = activeFixed.reduce((sum, item) => sum + item.amount, 0);
    const today = new Date();
    const monthNames = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];
    const maxInstallments = Math.max(
      1,
      ...friends.flatMap((friend) =>
        friend.debts.filter((debt) => !debt.paid).map((debt) => debt.total),
      ),
      ...expenses.filter((e) => !e.paid).map((e) => e.installments ?? 1),
    );
    const months = Array.from({ length: maxInstallments }, (_, index) => {
      const date = new Date(today.getFullYear(), today.getMonth() + index, 1);
      return {
        label: `${monthNames[date.getMonth()]} ${date.getFullYear()}`,
        monthNumber: index + 1,
        date,
      };
    });

    return months
      .map(({ label, monthNumber, date }) => {
        const monthExpenses = expenses.filter(
          (item) => !item.paid && monthNumber <= (item.installments ?? 1),
        );
        const expensesForMonth =
          monthExpenses.reduce((sum, item) => sum + monthlyAmount(item), 0) +
          totalFixed;
        const balance = salary - expensesForMonth;
        const activeInstallments = friends.flatMap((friend) =>
          friend.debts
            .filter(
              (debt) => !debt.paid && installmentNumber(debt, date) !== null,
            )
            .map((debt) => ({
              ...debt,
              current: installmentNumber(debt, date) as number,
              personName: friend.name,
              personInitials: friend.initials,
              personColor: friend.color,
              isOwner: false,
              displayCurrent: installmentNumber(debt, date) as number,
            })),
        );
        const receivable = activeInstallments.reduce(
          (sum, item) => sum + item.amount,
          0,
        );
        const myItems = [
          ...monthExpenses.map((item) => ({
            id: `mine-${label}-${item.id}`,
            title: item.title,
            category: item.cardId === "cash" ? "Dinheiro" : item.category,
            amount: monthlyAmount(item),
            current: monthNumber,
            total: item.installments ?? 1,
          })),
          ...activeFixed.map((item) => ({
            id: `mine-${label}-${item.id}`,
            title: item.name,
            category: "Despesa fixa",
            amount: item.amount,
          })),
        ].map((item) => ({
          ...item,
          cardId: "",
          paid: false,
          personName: "Eu",
          personInitials: "EU",
          personColor: S.green,
          isOwner: true,
        }));
        const installments = [...activeInstallments, ...myItems];

        const hasMyDebt = installments.some((item) => item.isOwner);

        return {
          month: label,
          monthNumber,
          totalExpenses: expensesForMonth + receivable,
          myShare: hasMyDebt ? expensesForMonth : 0,
          toReceive: receivable,
          balance,
          installments,
        };
      })
      .filter((item) => item.installments.length > 0);
  }, [friends, expenses, fixedExpenses, salary]);

  useEffect(() => {
    if (projection.length === 0) {
      setActiveMonth("");
      return;
    }

    if (!projection.some((item) => item.month === activeMonth)) {
      setActiveMonth(projection[0].month);
    }
  }, [projection, activeMonth]);

  const monthData = projection.find((item) => item.month === activeMonth) ??
    projection[0] ?? {
      month: "",
      totalExpenses: 0,
      myShare: 0,
      toReceive: 0,
      balance: 0,
      installments: [],
    };
  const progressPct =
    monthData.totalExpenses > 0
      ? (monthData.myShare / monthData.totalExpenses) * 100
      : 0;

  const filtered = monthData.installments.filter((item) => {
    if (filter === "all") return true;
    if (filter === "mine") return item.isOwner;
    return item.personName === filter;
  });

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
      <div style={{ padding: "52px 20px 0" }}>
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
          Projeção Futura
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: S.text }}>
          Despesas por Mês
        </h1>
      </div>

      {/* Month selector */}
      <div style={{ marginTop: 20, paddingLeft: 20 }}>
        <div
          className="scrollbar-hide"
          style={{
            display: "flex",
            gap: 10,
            overflowX: "auto",
            paddingRight: 20,
          }}
        >
          {projection.map(({ month }) => {
            const active = month === activeMonth;
            return (
              <button
                key={month}
                onClick={() => {
                  setActiveMonth(month);
                  setFilter("all");
                }}
                style={{
                  flexShrink: 0,
                  padding: "8px 18px",
                  borderRadius: 24,
                  border: active ? "none" : `1px solid ${S.border}`,
                  background: active
                    ? `linear-gradient(135deg, ${S.purpleDim}, ${S.purple})`
                    : S.surface,
                  color: active ? "#fff" : S.muted,
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  cursor: "pointer",
                  fontFamily: "'JetBrains Mono', monospace",
                  transition: "all 0.2s",
                  boxShadow: active ? `0 0 18px ${S.purple}40` : "none",
                }}
              >
                {month}
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ padding: "20px 20px 0" }}>
        <div
          style={{
            background: S.surface,
            border: `1px solid ${S.border}`,
            borderRadius: 20,
            padding: "20px 22px",
            marginBottom: 12,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -30,
              right: -30,
              width: 100,
              height: 100,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${S.purple}20, transparent)`,
            }}
          />
          <p
            style={{
              color: S.muted,
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontFamily: "'JetBrains Mono', monospace",
              marginBottom: 6,
            }}
          >
            Total Estimado
          </p>
          <p
            style={{
              fontSize: 30,
              fontWeight: 700,
              color: S.text,
              letterSpacing: "-0.02em",
            }}
          >
            {fmt(monthData.totalExpenses)}
          </p>
          <div
            style={{
              marginTop: 14,
              background: S.border,
              borderRadius: 6,
              height: 5,
            }}
          >
            <div
              style={{
                width: `${progressPct}%`,
                height: "100%",
                borderRadius: 6,
                background: `linear-gradient(90deg, ${S.purpleDim}, ${S.purple})`,
                boxShadow: `0 0 8px ${S.purple}80`,
                transition: "width 0.4s ease",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 6,
            }}
          >
            {monthData.myShare > 0 && (
              <p
                style={{
                  color: S.purple,
                  fontSize: 11,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                Sua parte {Math.round(progressPct)}%
              </p>
            )}
            <p
              style={{
                color: S.muted,
                fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {monthData.installments.length} parcelas
            </p>
          </div>
        </div>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
        >
          {[
            ...(monthData.myShare > 0
              ? [
                  {
                    label: "Minha parte",
                    value: monthData.myShare,
                    color: S.purple,
                  },
                ]
              : []),
            { label: "A receber", value: monthData.toReceive, color: S.green },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              style={{
                background: S.surface,
                border: `1px solid ${S.border}`,
                borderRadius: 16,
                padding: "16px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  bottom: -10,
                  right: -10,
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  background: `radial-gradient(circle, ${color}25, transparent)`,
                }}
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: color,
                    boxShadow: `0 0 6px ${color}`,
                  }}
                />
                <p
                  style={{
                    color: S.muted,
                    fontSize: 10,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {label}
                </p>
              </div>
              <p style={{ fontSize: 18, fontWeight: 700, color }}>
                {fmt(value)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ padding: "16px 20px 0" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(
            [
              "all",
              ...(monthData.myShare > 0 ? (["mine"] as const) : []),
              ...friends.map((f) => f.name),
            ] as FilterType[]
          ).map((f) => {
            const active = filter === f;
            const label = f === "all" ? "Todos" : f === "mine" ? "Minhas" : f;
            const activeColor =
              f === "mine"
                ? `linear-gradient(135deg, ${S.greenDim}, ${S.green})`
                : `linear-gradient(135deg, ${S.purpleDim}, ${S.purple})`;
            const glowColor = f === "mine" ? S.green : S.purple;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  border: active ? "none" : `1px solid ${S.border}`,
                  background: active ? activeColor : S.surface,
                  color: active ? "#fff" : S.muted,
                  fontSize: 12,
                  fontWeight: active ? 600 : 400,
                  cursor: "pointer",
                  transition: "all 0.18s",
                  boxShadow: active ? `0 0 12px ${glowColor}40` : "none",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div style={{ padding: "16px 20px 32px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <p
            style={{
              color: S.muted,
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Parcelas Ativas
          </p>
          <p
            style={{
              color: S.purple,
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {filtered.length} itens
          </p>
        </div>

        {filtered.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "48px 0",
              color: S.muted,
              fontSize: 14,
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
            Nenhuma parcela encontrada
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((item) => {
              const displayCurrent = item.current;
              const installPct = (displayCurrent / item.total) * 100;
              const cardColor =
                cards.find((card) => card.id === item.cardId)?.color ?? S.muted;
              const cardName =
                cards.find((card) => card.id === item.cardId)?.bank ??
                item.cardId;
              return (
                <div
                  key={item.id}
                  style={{
                    background: S.surface,
                    border: `1px solid ${S.border}`,
                    borderRadius: 16,
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    transition: "border-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor =
                      `${S.purple}50`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor =
                      S.border;
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      flexShrink: 0,
                      background: `${item.personColor}25`,
                      border: `2px solid ${item.personColor}60`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                      color: item.personColor,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {item.personInitials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: S.text,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        marginBottom: 4,
                      }}
                    >
                      {item.title}
                    </p>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 6,
                          background: `${cardColor}20`,
                          border: `1px solid ${cardColor}40`,
                          color: cardColor,
                          fontSize: 10,
                          fontWeight: 600,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {cardName}
                      </span>
                      <span style={{ color: S.muted, fontSize: 10 }}>
                        {item.category}
                      </span>
                      {!item.isOwner && (
                        <span
                          style={{
                            color: item.personColor,
                            fontSize: 10,
                            fontWeight: 500,
                          }}
                        >
                          · {item.personName}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        marginTop: 7,
                        background: S.border,
                        borderRadius: 4,
                        height: 3,
                      }}
                    >
                      <div
                        style={{
                          width: `${installPct}%`,
                          height: "100%",
                          borderRadius: 4,
                          background: item.isOwner
                            ? `linear-gradient(90deg, ${S.purpleDim}, ${S.purple})`
                            : `linear-gradient(90deg, ${S.greenDim}, ${S.green})`,
                          transition: "width 0.4s ease",
                        }}
                      />
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: 6,
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        padding: "3px 9px",
                        borderRadius: 8,
                        background: item.isOwner
                          ? `${S.purple}20`
                          : `${S.green}20`,
                        border: `1px solid ${item.isOwner ? `${S.purple}50` : `${S.green}50`}`,
                        color: item.isOwner ? S.purple : S.green,
                        fontSize: 11,
                        fontWeight: 700,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {displayCurrent}/{item.total}
                    </span>
                    <p style={{ fontSize: 14, fontWeight: 700, color: S.text }}>
                      {fmt(item.amount)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
