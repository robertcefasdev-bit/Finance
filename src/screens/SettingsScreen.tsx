import { useState } from "react";
import { fmt } from "../data/mockData";
import type { Card, Expense, FixedExpense, Friend, Screen } from "../data/mockData";
import { S } from "../theme";


const CARD_COLOR: Record<string, string> = {
  nubank: S.purple,
  itau: S.orange,
  xp: S.blue,
};

interface Props {
  cardUsage: Record<string, number>;
  navigate: (s: Screen, data?: unknown) => void;
  cards: Card[];
  expenses: Expense[];
  salary: number;
  fixedExpenses: FixedExpense[];
  friends: Friend[];
  onUpdateFixedExpense: (expense: FixedExpense) => void;
  onRemoveCard: (cardId: string) => void;
  onEditCard: (card: Card) => void;
  onUpdateSalary: (value: number) => void;
  onToggleFixedExpense: (expenseId: string) => void;
  onAddFixedExpense: (expense: FixedExpense) => void;
  onRemoveFixedExpense: (expenseId: string) => void;
  onClearAll: () => void;
  onLogout: () => void;
}

export default function SettingsScreen({
  cardUsage,
  navigate,
  cards,
  expenses,
  friends,
  salary,
  fixedExpenses,
  onUpdateFixedExpense,
  onRemoveFixedExpense,
  onRemoveCard,
  onLogout,
  onEditCard,
  onUpdateSalary,
  onToggleFixedExpense,
  onAddFixedExpense,
}: Props) {
  const [salarySaved, setSalarySaved] = useState(false);
  const [newExpenseName, setNewExpenseName] = useState("");
  const [newExpenseAmount, setNewExpenseAmount] = useState("");
  const [newFixedCard, setNewFixedCard] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCard, setEditCard] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [showBankInput, setShowBankInput] = useState(false);
  const [customBank, setCustomBank] = useState("");
  const toggleFixed = (id: string) => {
    onToggleFixedExpense(id);
  };

  const startEdit = (fe: FixedExpense) => {
    setEditingId(fe.id);
    setEditName(fe.name);
    setEditAmount(String(fe.amount));
    setEditCard(fe.cardId ?? "");
  };

  const saveEdit = (fe: FixedExpense) => {
    const amount = parseFloat(editAmount.replace(",", "."));
    if (!editName.trim() || !amount) return;
    onUpdateFixedExpense({
      ...fe,
      name: editName.trim(),
      amount,
      cardId: editCard || undefined,
    });
    setEditingId(null);
  };

  const removeCard = (id: string) => {
    const pending = cardUsage[id] ?? 0;
    if (pending > 0) {
      window.alert(
        `Não é possível excluir este cartão: ainda há ${fmt(pending)} em aberto nele (suas despesas, dívidas de devedores ou despesas fixas). Quite tudo antes de excluir.`,
      );
      return;
    }
    onRemoveCard(id);
  };

  const handleSaveSalary = () => {
    onUpdateSalary(parseFloat(String(salary)) || 0);
    setSalarySaved(true);
    setTimeout(() => setSalarySaved(false), 1500);
  };

  const [fixedError, setFixedError] = useState("");

  const handleAddFixed = () => {
    if (!newExpenseName.trim() || !newExpenseAmount) return;
    const fixedValue = parseFloat(newExpenseAmount.replace(",", "."));
    const fixedCard = cards.find((c) => c.id === newFixedCard);
    if (fixedCard && fixedValue > fixedCard.limit - (cardUsage[fixedCard.id] ?? 0)) {
      setFixedError(
        `Passa do limite do cartão ${fixedCard.name}. Disponível: ${fmt(Math.max(fixedCard.limit - (cardUsage[fixedCard.id] ?? 0), 0))}`,
      );
      return;
    }
    setFixedError("");
    onAddFixedExpense({
      id: `fe-${Date.now()}`,
      name: newExpenseName.trim(),
      amount: parseFloat(newExpenseAmount.replace(",", ".")),
      active: true,
      cardId: newFixedCard || undefined,
    });
    setNewFixedCard("");
    setNewExpenseName("");
    setNewExpenseAmount("");
  };

  const totalFixed = fixedExpenses
    .filter((f) => f.active)
    .reduce((s, f) => s + f.amount, 0);

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
          Gerenciamento
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: S.text }}>
          Configurações
        </h1>
      </div>

      {/* Salary */}
      <div style={{ margin: "20px 20px 0" }}>
        <p
          style={{
            color: S.text,
            fontSize: 15,
            fontWeight: 600,
            marginBottom: 12,
          }}
        >
          Salário Mensal
        </p>
        <div
          style={{
            background: S.surface,
            border: `1px solid ${S.border}`,
            borderRadius: 16,
            padding: "16px",
          }}
        >
          <label
            style={{
              color: S.muted,
              fontSize: 11,
              display: "block",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Valor Líquido
          </label>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <span
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: S.green,
                  fontWeight: 700,
                }}
              >
                R$
              </span>
              <input
                type="number"
                value={salary}
                onChange={(e) =>
                  onUpdateSalary(parseFloat(e.target.value) || 0)
                }
                style={{
                  width: "100%",
                  background: S.surface2,
                  border: `1px solid ${S.border}`,
                  borderRadius: 12,
                  padding: "12px 12px 12px 36px",
                  color: S.text,
                  fontSize: 18,
                  fontWeight: 700,
                  outline: "none",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = S.green;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = S.border;
                }}
              />
            </div>
            <button
              onClick={handleSaveSalary}
              style={{
                padding: "12px 18px",
                borderRadius: 12,
                border: "none",
                background: salarySaved
                  ? `linear-gradient(135deg, #16a34a, ${S.green})`
                  : `linear-gradient(135deg, ${S.purpleDim}, ${S.purple})`,
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                transition: "background 0.3s",
              }}
            >
              {salarySaved ? "✓" : "Salvar"}
            </button>
          </div>
        </div>
      </div>

      {/* Sair */}
      <div style={{ margin: "20px 20px 0" }}>
        <button
          onClick={onLogout}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: 14,
            border: `1px solid ${S.border}`,
            background: S.surface,
            color: S.text,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          🔒 Sair da conta
        </button>
      </div>

      {/* Credit Cards */}
      <div style={{ margin: "20px 20px 0" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <p style={{ color: S.text, fontSize: 15, fontWeight: 600 }}>
            Meus Cartões
          </p>
          <button
            onClick={() => navigate("addCard")}
            style={{
              padding: "7px 14px",
              borderRadius: 16,
              background: `linear-gradient(135deg, ${S.purpleDim}, ${S.purple})`,
              border: "none",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: `0 0 12px ${S.purple}40`,
            }}
          >
            + Novo
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {cards.map((card) => {
            const color = card.color || CARD_COLOR[card.id] || S.purple;
            const spentAmount = cardUsage[card.id] ?? 0;
            const usedPercent =
              card.limit > 0
                ? Math.min((spentAmount / card.limit) * 100, 100)
                : 0;
            const remainingValue = Math.max(card.limit - spentAmount, 0);
            return (
              <div
                key={card.id}
                style={{
                  background: `linear-gradient(135deg, ${color}20, ${color}08)`,
                  border: `1px solid ${color}30`,
                  borderRadius: 18,
                  padding: "16px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
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
                    background: `radial-gradient(circle, ${color}25, transparent)`,
                  }}
                />
                <div
                  style={{
                    width: 44,
                    height: 30,
                    borderRadius: 6,
                    background: `linear-gradient(135deg, ${color}80, ${color}40)`,
                    border: `1px solid ${color}50`,
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <p style={{ color: S.text, fontSize: 14, fontWeight: 700 }}>
                    {card.name}
                  </p>
                  <p
                    style={{
                      color: color,
                      fontSize: 11,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {card.bank}
                  </p>
                  <p style={{ color: S.muted, fontSize: 10, marginTop: 2 }}>
                    Fecha dia {card.closing} · Vence dia {card.due} · Limite{" "}
                    {fmt(card.limit)}
                  </p>
                  <div style={{ marginTop: 8 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 4,
                      }}
                    >
                      <span style={{ color: S.muted, fontSize: 10 }}>
                        Limite restante
                      </span>
                      <span
                        style={{ color: color, fontSize: 10, fontWeight: 700 }}
                      >
                        {fmt(remainingValue)}
                      </span>
                    </div>
                    <div
                      style={{
                        height: 6,
                        borderRadius: 999,
                        background: `${color}20`,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${usedPercent}%`,
                          height: "100%",
                          borderRadius: 999,
                          background: `linear-gradient(90deg, ${color}, ${color}90)`,
                          transition: "width 0.2s ease",
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexShrink: 0,
                    position: "relative",
                    zIndex: 2,
                  }}
                >
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onEditCard(card);
                    }}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      border: `1px solid ${S.border}`,
                      background: S.surface2,
                      color: S.text,
                      fontSize: 13,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      removeCard(card.id);
                    }}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      border: `1px solid #ef444440`,
                      background: "#ef444415",
                      color: "#ef4444",
                      fontSize: 14,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })}
          {cards.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "24px",
                color: S.muted,
                fontSize: 13,
              }}
            >
              Nenhum cartão cadastrado
            </div>
          )}
        </div>
      </div>

      {/* Fixed Expenses */}
      <div style={{ margin: "20px 20px 0" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <div>
            <p style={{ color: S.text, fontSize: 15, fontWeight: 600 }}>
              Despesas Fixas
            </p>
            <p style={{ color: S.muted, fontSize: 11, marginTop: 2 }}>
              Total ativo:{" "}
              <span
                style={{
                  color: S.purple,
                  fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {fmt(totalFixed)}
              </span>
            </p>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {fixedExpenses.map((fe) => (
            <div
              key={fe.id}
              style={{
                background: S.surface,
                border: `1px solid ${S.border}`,
                borderRadius: 14,
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                opacity: fe.active ? 1 : 0.5,
              }}
            >
              {editingId === fe.id ? (
                <div style={{ flex: 1, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{ flex: 1, minWidth: 90, background: S.surface2, border: `1px solid ${S.border}`, borderRadius: 8, padding: "7px 10px", color: S.text, fontSize: 13, outline: "none" }}
                  />
                  <input
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    style={{ width: 80, background: S.surface2, border: `1px solid ${S.border}`, borderRadius: 8, padding: "7px 10px", color: S.text, fontSize: 13, outline: "none" }}
                  />
                  <select
                    value={editCard}
                    onChange={(e) => setEditCard(e.target.value)}
                    style={{ flexBasis: "100%", background: S.surface2, border: `1px solid ${S.border}`, borderRadius: 8, padding: "7px 10px", color: S.text, fontSize: 13, outline: "none" }}
                  >
                    <option value="">💵 Sem cartão</option>
                    {cards.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} · {c.bank}</option>
                    ))}
                  </select>
                  <button onClick={() => saveEdit(fe)} style={{ border: "none", borderRadius: 8, padding: "7px 12px", background: `${S.purple}30`, color: S.purple, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Salvar</button>
                  <button onClick={() => setEditingId(null)} style={{ border: "none", borderRadius: 8, padding: "7px 10px", background: S.surface2, color: S.muted, fontSize: 12, cursor: "pointer" }}>Cancelar</button>
                </div>
              ) : (
              <div style={{ flex: 1 }}>
                <p style={{ color: S.text, fontSize: 13, fontWeight: 600 }}>
                  {fe.name}
                </p>
                <p
                  style={{
                    color: S.muted,
                    fontSize: 11,
                    fontFamily: "'JetBrains Mono', monospace",
                    marginTop: 2,
                  }}
                >
                  {fmt(fe.amount)}/mês
                  {fe.cardId ? ` · ${cards.find((c) => c.id === fe.cardId)?.name ?? "cartão"}` : ""}
                </p>
              </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {editingId !== fe.id && (
                  <>
                    <button aria-label={`Editar ${fe.name}`} onClick={() => startEdit(fe)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 15 }}>✏️</button>
                    <button
                      aria-label={`Remover ${fe.name}`}
                      onClick={() => {
                        if (window.confirm(`Remover "${fe.name}"?`)) onRemoveFixedExpense(fe.id);
                      }}
                      style={{ border: "none", background: "none", cursor: "pointer", fontSize: 15 }}
                    >🗑️</button>
                  </>
                )}
                <button
                  onClick={() => toggleFixed(fe.id)}
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    border: "none",
                    cursor: "pointer",
                    background: fe.active
                      ? `linear-gradient(135deg, ${S.purpleDim}, ${S.purple})`
                      : S.border,
                    position: "relative",
                    transition: "background 0.2s",
                    flexShrink: 0,
                    boxShadow: fe.active ? `0 0 10px ${S.purple}50` : "none",
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: "#fff",
                      position: "absolute",
                      top: 3,
                      left: fe.active ? 23 : 3,
                      transition: "left 0.2s",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                    }}
                  />
                </button>
              </div>
            </div>
          ))}

          {/* Add new fixed */}
          <div
            style={{
              background: S.surface,
              border: `1px dashed ${S.border}`,
              borderRadius: 14,
              padding: "12px 14px",
            }}
          >
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                value={newExpenseName}
                onChange={(e) => setNewExpenseName(e.target.value)}
                placeholder="Nome da despesa"
                style={{
                  flex: 1,
                  background: S.surface2,
                  border: `1px solid ${S.border}`,
                  borderRadius: 10,
                  padding: "9px 12px",
                  color: S.text,
                  fontSize: 13,
                  outline: "none",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = S.purple;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = S.border;
                }}
              />
              <input
                type="number"
                value={newExpenseAmount}
                onChange={(e) => setNewExpenseAmount(e.target.value)}
                placeholder="R$"
                style={{
                  width: 80,
                  background: S.surface2,
                  border: `1px solid ${S.border}`,
                  borderRadius: 10,
                  padding: "9px 10px",
                  color: S.text,
                  fontSize: 13,
                  outline: "none",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = S.purple;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = S.border;
                }}
              />
            </div>
            <select
              value={newFixedCard}
              onChange={(e) => setNewFixedCard(e.target.value)}
              style={{
                width: "100%",
                background: S.surface2,
                border: `1px solid ${S.border}`,
                borderRadius: 10,
                padding: "9px 10px",
                color: S.text,
                fontSize: 13,
                outline: "none",
                marginBottom: 8,
              }}
            >
              <option value="">💵 Sem cartão (dinheiro/débito)</option>
              {cards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.bank}
                </option>
              ))}
            </select>
            {fixedError && (
              <p style={{ color: "#ef4444", fontSize: 12, marginBottom: 8 }}>⚠️ {fixedError}</p>
            )}
            <button
              onClick={handleAddFixed}
              style={{
                width: "100%",
                padding: "9px",
                borderRadius: 10,
                border: "none",
                background:
                  newExpenseName && newExpenseAmount
                    ? `${S.purple}20`
                    : S.surface2,
                color: newExpenseName && newExpenseAmount ? S.purple : S.muted,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              + Adicionar Despesa Fixa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
