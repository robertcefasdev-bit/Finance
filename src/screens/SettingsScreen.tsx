import { useState } from "react";
import { fmt, isHidden } from "../data/mockData";
import type { Card, Expense, FixedExpense, Friend, Screen } from "../data/mockData";
import { maskMoney, moneyStr, parseMoney } from "../utils/finance";
import { S } from "../theme";
import LogoutButton from "../components/LogoutButton";
import InvoiceModal from "../components/InvoiceModal";
import MoreMenu from "../components/MoreMenu";


const CARD_COLOR: Record<string, string> = {
  nubank: S.purple,
  itau: S.orange,
  xp: S.blue,
};

interface Props {
  onSaveInvoice: (cardId: string, ym: string, value: number | null) => void;
  pixKey: string;
  onChangePix: (pix: string) => void;
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

// 71984224699 -> 719••••••99
const maskPix = (key: string) =>
  key.length <= 5 ? "•••••" : `${key.slice(0, 3)}${"•".repeat(Math.min(key.length - 5, 8))}${key.slice(-2)}`;

export default function SettingsScreen({
  onSaveInvoice,
  pixKey,
  onChangePix,
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
  const [invoiceCardId, setInvoiceCardId] = useState<string | null>(null);
  const [editingSalary, setEditingSalary] = useState(false);
  const [salaryInput, setSalaryInput] = useState("");
  const [editingPix, setEditingPix] = useState(false);
  const [pixInput, setPixInput] = useState("");
  const [showPix, setShowPix] = useState(false);
  const [showAddFixed, setShowAddFixed] = useState(false);
  const [editError, setEditError] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [showBankInput, setShowBankInput] = useState(false);
  const [customBank, setCustomBank] = useState("");
  const toggleFixed = (id: string) => {
    onToggleFixedExpense(id);
  };

  const startEdit = (fe: FixedExpense) => {
    setEditingId(fe.id);
    setEditName(fe.name);
    setEditAmount(moneyStr(fe.amount));
    setEditCard(fe.cardId ?? "");
    setEditError("");
  };

  const saveEdit = (fe: FixedExpense) => {
    const amount = parseFloat(editAmount.replace(",", "."));
    if (!editName.trim() || !amount) return;
    const target = cards.find((c) => c.id === editCard);
    if (target && fe.active) {
      // o valor antigo desta despesa já está contado no cartão, então volta para o disponível
      const alreadyThere = fe.active && fe.cardId === target.id ? fe.amount : 0;
      const available = target.limit - (cardUsage[target.id] ?? 0) + alreadyThere;
      if (amount > available) {
        setEditError(
          `Passa do limite do cartão ${target.name}. Disponível: ${fmt(Math.max(available, 0))}`,
        );
        return;
      }
    }
    setEditError("");
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
    setShowAddFixed(false);
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
      <div style={{ padding: "52px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
            Gerenciamento
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: S.text }}>
            Configurações
          </h1>
        </div>
        <LogoutButton onLogout={onLogout} />
      </div>

      {/* Perfil financeiro: salário e chave Pix ficam recolhidos */}
      <div style={{ margin: "20px 20px 0" }}>
        <p style={{ color: S.muted, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", marginBottom: 8 }}>
          Meus dados
        </p>
        <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 16, padding: "4px 16px" }}>
          {/* Salário */}
          <div style={{ padding: "12px 0", borderBottom: `1px solid ${S.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <div>
                <p style={{ color: S.muted, fontSize: 11 }}>Salário mensal</p>
                <p style={{ color: S.text, fontSize: 16, fontWeight: 700, marginTop: 2 }}>
                  {salary > 0 ? fmt(salary) : "Não informado"}
                </p>
              </div>
              {!editingSalary && (
                <button
                  onClick={() => {
                    setSalaryInput(salary > 0 ? moneyStr(salary) : "");
                    setEditingSalary(true);
                  }}
                  style={{ padding: "9px 14px", borderRadius: 10, background: S.surface2, color: S.purple, fontSize: 12, fontWeight: 700, cursor: "pointer", border: `1px solid ${S.border}` }}
                >
                  {salary > 0 ? "Editar" : "Informar"}
                </button>
              )}
            </div>
            {editingSalary && (
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <input
                  autoFocus
                  inputMode="numeric"
                  value={salaryInput}
                  onChange={(e) => setSalaryInput(maskMoney(e.target.value))}
                  placeholder="0,00"
                  style={{ flex: 1, background: S.surface2, border: `1px solid ${S.border}`, borderRadius: 10, padding: "10px 12px", color: S.text, fontSize: 15, outline: "none", minWidth: 0 }}
                />
                <button
                  onClick={() => {
                    onUpdateSalary(parseMoney(salaryInput));
                    setEditingSalary(false);
                  }}
                  style={{ padding: "9px 14px", borderRadius: 10, border: "none", background: S.purple, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  Salvar
                </button>
                <button onClick={() => setEditingSalary(false)} style={{ padding: "9px 14px", borderRadius: 10, border: "none", background: "transparent", color: S.muted, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  Cancelar
                </button>
              </div>
            )}
          </div>
          {/* Chave Pix */}
          <div style={{ padding: "12px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ color: S.muted, fontSize: 11 }}>Minha chave Pix</p>
                <p style={{ color: S.text, fontSize: 15, fontWeight: 600, marginTop: 2, fontFamily: "'JetBrains Mono', monospace", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {pixKey
                    ? showPix && !isHidden()
                      ? pixKey
                      : maskPix(pixKey)
                    : "Não cadastrada"}
                </p>
              </div>
              {!editingPix && (
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {pixKey && !isHidden() && (
                    <button
                      onClick={() => setShowPix((v) => !v)}
                      aria-label={showPix ? "Ocultar chave" : "Mostrar chave"}
                      style={{ padding: "9px 14px", borderRadius: 10, background: S.surface2, color: S.muted, fontSize: 12, fontWeight: 700, cursor: "pointer", border: `1px solid ${S.border}` }}
                    >
                      {showPix ? "Ocultar" : "Mostrar"}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setPixInput(pixKey);
                      setEditingPix(true);
                    }}
                    style={{ padding: "9px 14px", borderRadius: 10, background: S.surface2, color: S.purple, fontSize: 12, fontWeight: 700, cursor: "pointer", border: `1px solid ${S.border}` }}
                  >
                    {pixKey ? "Editar" : "Cadastrar"}
                  </button>
                </div>
              )}
            </div>
            {editingPix && (
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <input
                  autoFocus
                  value={pixInput}
                  onChange={(e) => setPixInput(e.target.value)}
                  placeholder="CPF, e-mail, telefone ou chave aleatória"
                  style={{ flex: 1, background: S.surface2, border: `1px solid ${S.border}`, borderRadius: 10, padding: "10px 12px", color: S.text, fontSize: 15, outline: "none", minWidth: 0 }}
                />
                <button
                  onClick={() => {
                    onChangePix(pixInput.trim());
                    setEditingPix(false);
                  }}
                  style={{ padding: "9px 14px", borderRadius: 10, border: "none", background: S.purple, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  Salvar
                </button>
                <button onClick={() => setEditingPix(false)} style={{ padding: "9px 14px", borderRadius: 10, border: "none", background: "transparent", color: S.muted, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  Cancelar
                </button>
              </div>
            )}
            <p style={{ color: S.muted, fontSize: 11, marginTop: 8 }}>Vai junto no extrato enviado aos devedores.</p>
          </div>
        </div>
      </div>

      {invoiceCardId && cards.find((c) => c.id === invoiceCardId) && (
        <InvoiceModal
          card={cards.find((c) => c.id === invoiceCardId) as Card}
          expenses={expenses}
          friends={friends}
          fixedExpenses={fixedExpenses}
          onSave={onSaveInvoice}
          onClose={() => setInvoiceCardId(null)}
        />
      )}

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
          <div>
            <p style={{ color: S.text, fontSize: 15, fontWeight: 600 }}>
              Meus Cartões
            </p>
            <p style={{ color: S.muted, fontSize: 11, marginTop: 2 }}>
              Toque num cartão para ver e conferir a fatura
            </p>
          </div>
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
                onClick={() => setInvoiceCardId(card.id)}
                title="Ver fatura"
                style={{
                  cursor: "pointer",
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
                  <MoreMenu
                    label={`Opções de ${card.name}`}
                    items={[
                      { icon: "🧾", label: "Ver fatura", onClick: () => setInvoiceCardId(card.id) },
                      { icon: "✏️", label: "Editar cartão", onClick: () => onEditCard(card) },
                      { icon: "🗑️", label: "Excluir cartão", danger: true, onClick: () => removeCard(card.id) },
                    ]}
                  />
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
          <button
            onClick={() => setShowAddFixed((v) => !v)}
            aria-label={showAddFixed ? "Fechar" : "Adicionar despesa fixa"}
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              border: "none",
              background: showAddFixed ? S.surface2 : `linear-gradient(135deg, ${S.purpleDim}, ${S.purple})`,
              color: showAddFixed ? S.muted : "#fff",
              fontSize: 22,
              lineHeight: 1,
              cursor: "pointer",
              transform: showAddFixed ? "rotate(45deg)" : "none",
              transition: "transform 0.2s",
            }}
          >
            +
          </button>
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
                    inputMode="numeric"
                    value={editAmount}
                    onChange={(e) => setEditAmount(maskMoney(e.target.value))}
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
                  {editError && (
                    <p style={{ flexBasis: "100%", color: "#ef4444", fontSize: 12 }}>⚠️ {editError}</p>
                  )}
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
                    <MoreMenu
                      label={`Opções de ${fe.name}`}
                      items={[
                        { icon: "✏️", label: "Editar", onClick: () => startEdit(fe) },
                        {
                          icon: "🗑️",
                          label: "Excluir",
                          danger: true,
                          onClick: () => {
                            if (window.confirm(`Remover "${fe.name}"?`)) onRemoveFixedExpense(fe.id);
                          },
                        },
                      ]}
                    />
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
          {showAddFixed && (
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
                inputMode="numeric"
                value={newExpenseAmount}
                onChange={(e) => setNewExpenseAmount(maskMoney(e.target.value))}
                placeholder="0,00"
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
          )}

        </div>
      </div>
    </div>
  );
}
