import { useState } from "react";
import { fmt } from "../data/mockData";
import type { Screen, Card, Friend, Expense, Debt } from "../data/mockData";
import { S } from "../theme";


const CATEGORIES = [
  { label: "Tech", icon: "💻" },
  { label: "Alimentação", icon: "🍔" },
  { label: "Saúde", icon: "🏋️" },
  { label: "Lazer", icon: "🎮" },
  { label: "Viagem", icon: "✈️" },
  { label: "Moda", icon: "👟" },
  { label: "Assinatura", icon: "📺" },
  { label: "Outros", icon: "📦" },
];

interface Props {
  navigate: (s: Screen, data?: unknown) => void;
  cards: Card[];
  friends: Friend[];
  cardUsage: Record<string, number>;
  onAddExpense: (expense: Expense) => void;
  onAddDebt: (friendId: string, debt: Debt) => void;
  routeData?: unknown;
  onGoToDebtor?: (s: Screen, data?: unknown) => void;
}

export default function AddExpenseScreen({
  navigate,
  cards,
  friends,
  cardUsage,
  onAddExpense,
  onAddDebt,
  routeData,
  onGoToDebtor,
}: Props) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [cardId, setCardId] = useState("");
  const [splitEnabled, setSplitEnabled] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [installments, setInstallments] = useState("1");
  const [title, setTitle] = useState("");
  const [saved, setSaved] = useState(false);

  const numAmount = parseFloat(amount.replace(",", ".")) || 0;
  const numSplit = selectedFriends.length + 1;
  const perPerson = numAmount / numSplit;
  const selectedCard = cards.find((c) => c.id === cardId);
  const availableLimit = selectedCard
    ? selectedCard.limit - (cardUsage[selectedCard.id] ?? 0)
    : Infinity;
  const overLimit = !!selectedCard && numAmount > availableLimit;
  const instN = parseInt(installments, 10) || 1;
  const perLabel =
    instN > 1
      ? `${instN}× de ${fmt(perPerson / instN)}`
      : fmt(perPerson);

  const toggleFriend = (id: string) => {
    setSelectedFriends((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    );
  };

  const handleSave = () => {
    if (!amount || !category || !cardId || overLimit) return;

    const parsedAmount = parseFloat(amount.replace(",", ".")) || 0;
    const parsedInstallments = parseInt(installments, 10) || 1;
    const isSplit = splitEnabled && selectedFriends.length > 0;
    const myShare = isSplit
      ? parsedAmount / (selectedFriends.length + 1)
      : parsedAmount;
    // valor da parcela mensal de cada pessoa
    const shareAmount = Math.round((myShare / parsedInstallments) * 100) / 100;

    const newExpense: Expense = {
      id: `expense-${Date.now()}`,
      title: title.trim() || category,
      category,
      categoryIcon:
        CATEGORIES.find((item) => item.label === category)?.icon ?? "📦",
      cardId,
      amount: Math.round(myShare * 100) / 100,
      installments: parsedInstallments,
      date: date || new Date().toISOString().split("T")[0],
    };

    onAddExpense(newExpense);

    if (splitEnabled && selectedFriends.length > 0) {
      selectedFriends.forEach((friendId) => {
        const debt: Debt = {
          id: `debt-${Date.now()}-${friendId}`,
          title: title.trim() || category,
          category,
          cardId,
          amount: shareAmount,
          current: 1,
          total: parsedInstallments,
          startMonth: (date || new Date().toISOString().split("T")[0]).slice(0, 7),
          paid: false,
        };
        onAddDebt(friendId, debt);
      });
    }

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      navigate("home");
    }, 1500);
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
          alignItems: "center",
          gap: 12,
        }}
      >
        <button
          onClick={() => navigate("home")}
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            border: `1px solid ${S.border}`,
            background: S.surface,
            color: S.text,
            fontSize: 16,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ←
        </button>
        <div>
          <p
            style={{
              color: S.muted,
              fontSize: 12,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              fontFamily: "'JetBrains Mono', monospace",
              marginBottom: 2,
            }}
          >
            Nova Despesa
          </p>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: S.text }}>
            Adicionar Despesa
          </h1>
        </div>
      </div>

      <div style={{ padding: "24px 20px 0" }}>
        {/* Amount */}
        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              color: S.muted,
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontFamily: "'JetBrains Mono', monospace",
              display: "block",
              marginBottom: 8,
            }}
          >
            Valor Total
          </label>
          <div style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: 16,
                top: "50%",
                transform: "translateY(-50%)",
                color: S.purple,
                fontWeight: 700,
                fontSize: 18,
              }}
            >
              R$
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              style={{
                width: "100%",
                background: S.surface,
                border: `1px solid ${S.border}`,
                borderRadius: 14,
                padding: "14px 16px 14px 48px",
                color: S.text,
                fontSize: 24,
                fontWeight: 700,
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
        </div>

        {/* Title */}
        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              color: S.muted,
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontFamily: "'JetBrains Mono', monospace",
              display: "block",
              marginBottom: 8,
            }}
          >
            Descrição
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='Ex: MacBook Pro 14"'
            style={{
              width: "100%",
              background: S.surface,
              border: `1px solid ${S.border}`,
              borderRadius: 14,
              padding: "13px 16px",
              color: S.text,
              fontSize: 15,
              outline: "none",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = S.purple;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = S.border;
            }}
          />
        </div>

        {/* Category */}
        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              color: S.muted,
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontFamily: "'JetBrains Mono', monospace",
              display: "block",
              marginBottom: 10,
            }}
          >
            Categoria
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {CATEGORIES.map((c) => {
              const active = category === c.label;
              return (
                <button
                  key={c.label}
                  onClick={() => setCategory(c.label)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 20,
                    border: active ? "none" : `1px solid ${S.border}`,
                    background: active
                      ? `linear-gradient(135deg, ${S.purpleDim}, ${S.purple})`
                      : S.surface,
                    color: active ? "#fff" : S.muted,
                    fontSize: 12,
                    cursor: "pointer",
                    transition: "all 0.18s",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    boxShadow: active ? `0 0 12px ${S.purple}40` : "none",
                  }}
                >
                  <span>{c.icon}</span>
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date */}
        <div
          style={{
            marginBottom: 20,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          <div>
            <label
              style={{
                color: S.muted,
                fontSize: 11,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontFamily: "'JetBrains Mono', monospace",
                display: "block",
                marginBottom: 8,
              }}
            >
              Data
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                width: "100%",
                background: S.surface,
                border: `1px solid ${S.border}`,
                borderRadius: 14,
                padding: "12px 14px",
                color: S.text,
                fontSize: 13,
                outline: "none",
                colorScheme: "dark",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = S.purple;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = S.border;
              }}
            />
          </div>
          <div>
            <label
              style={{
                color: S.muted,
                fontSize: 11,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontFamily: "'JetBrains Mono', monospace",
                display: "block",
                marginBottom: 8,
              }}
            >
              Parcelas
            </label>
            <select
              value={installments}
              onChange={(e) => setInstallments(e.target.value)}
              style={{
                width: "100%",
                background: S.surface,
                border: `1px solid ${S.border}`,
                borderRadius: 14,
                padding: "12px 14px",
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
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24].map((n) => (
                <option key={n} value={n}>
                  {n}x
                  {n > 1
                    ? ` de ${numAmount ? fmt(numAmount / n) : "–"}`
                    : " (à vista)"}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Card */}
        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              color: S.muted,
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontFamily: "'JetBrains Mono', monospace",
              display: "block",
              marginBottom: 10,
            }}
          >
            Forma de pagamento
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              onClick={() => setCardId("cash")}
              style={{
                background: cardId === "cash" ? "#22c55e15" : S.surface,
                border: `1px solid ${cardId === "cash" ? "#22c55e" : S.border}`,
                borderRadius: 14,
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 22 }}>💵</span>
              <div style={{ flex: 1, textAlign: "left" }}>
                <p style={{ color: S.text, fontSize: 13, fontWeight: 600 }}>
                  Dinheiro
                </p>
                <p style={{ color: S.muted, fontSize: 11 }}>Sem cartão</p>
              </div>
              {cardId === "cash" && <span style={{ color: "#22c55e" }}>✓</span>}
            </button>
            {cards.map((card) => {
              const active = cardId === card.id;
              return (
                <button
                  key={card.id}
                  onClick={() => setCardId(card.id)}
                  style={{
                    background: active ? `${card.color}15` : S.surface,
                    border: `1px solid ${active ? card.color : S.border}`,
                    borderRadius: 14,
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    cursor: "pointer",
                    transition: "all 0.18s",
                    boxShadow: active ? `0 0 14px ${card.color}30` : "none",
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 24,
                      borderRadius: 6,
                      background: `linear-gradient(135deg, ${card.color}60, ${card.color}30)`,
                      border: `1px solid ${card.color}40`,
                    }}
                  />
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <p style={{ color: S.text, fontSize: 13, fontWeight: 600 }}>
                      {card.name}
                    </p>
                    <p style={{ color: S.muted, fontSize: 11 }}>
                      {card.bank} · Fecha dia {card.closing}
                    </p>
                  </div>
                  {active && (
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: card.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                      }}
                    >
                      ✓
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Split toggle */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              background: S.surface,
              border: `1px solid ${S.border}`,
              borderRadius: 16,
              padding: "14px 16px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <p style={{ color: S.text, fontSize: 14, fontWeight: 600 }}>
                  Dividir com alguém?
                </p>
                <p style={{ color: S.muted, fontSize: 11, marginTop: 2 }}>
                  Selecione quem vai dividir
                </p>
              </div>
              <button
                onClick={() => {
                  setSplitEnabled((v) => !v);
                  setSelectedFriends([]);
                }}
                style={{
                  width: 50,
                  height: 28,
                  borderRadius: 14,
                  border: "none",
                  cursor: "pointer",
                  background: splitEnabled
                    ? `linear-gradient(135deg, ${S.purpleDim}, ${S.purple})`
                    : S.border,
                  position: "relative",
                  transition: "background 0.2s",
                  boxShadow: splitEnabled ? `0 0 12px ${S.purple}60` : "none",
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: "#fff",
                    position: "absolute",
                    top: 3,
                    left: splitEnabled ? 25 : 3,
                    transition: "left 0.2s",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                  }}
                />
              </button>
            </div>

            {splitEnabled && (
              <div style={{ marginTop: 16 }}>
                <p
                  style={{
                    color: S.muted,
                    fontSize: 11,
                    marginBottom: 10,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  Selecionar amigos
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    overflowX: "auto",
                    paddingBottom: 4,
                  }}
                  className="scrollbar-hide"
                >
                  {friends.map((f) => {
                    const sel = selectedFriends.includes(f.id);
                    return (
                      <button
                        key={f.id}
                        onClick={() => toggleFriend(f.id)}
                        style={{
                          flexShrink: 0,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 6,
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: "50%",
                            background: sel ? `${f.color}30` : S.surface2,
                            border: `2px solid ${sel ? f.color : S.border}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 13,
                            fontWeight: 700,
                            color: sel ? f.color : S.muted,
                            fontFamily: "'JetBrains Mono', monospace",
                            transition: "all 0.18s",
                            boxShadow: sel ? `0 0 12px ${f.color}40` : "none",
                            position: "relative",
                          }}
                        >
                          {f.initials}
                          {sel && (
                            <div
                              style={{
                                position: "absolute",
                                bottom: -2,
                                right: -2,
                                width: 16,
                                height: 16,
                                borderRadius: "50%",
                                background: S.green,
                                border: `2px solid ${S.surface}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 9,
                                color: "#fff",
                              }}
                            >
                              ✓
                            </div>
                          )}
                        </div>
                        <span
                          style={{
                            color: sel ? S.text : S.muted,
                            fontSize: 10,
                            fontWeight: sel ? 600 : 400,
                            maxWidth: 52,
                            textAlign: "center",
                            lineHeight: 1.2,
                          }}
                        >
                          {f.name.split(" ")[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {selectedFriends.length > 0 && numAmount > 0 && (
                  <div
                    style={{
                      marginTop: 14,
                      background: `${S.green}15`,
                      border: `1px solid ${S.green}30`,
                      borderRadius: 12,
                      padding: "12px 14px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <p style={{ color: S.muted, fontSize: 11 }}>
                        Dividindo entre {numSplit} pessoas
                      </p>
                      <p
                        style={{
                          color: S.green,
                          fontSize: 18,
                          fontWeight: 700,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {perLabel} / pessoa
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ color: S.muted, fontSize: 11 }}>Você paga</p>
                      <p
                        style={{ color: S.text, fontSize: 14, fontWeight: 700 }}
                      >
                        {perLabel}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {overLimit && selectedCard && (
          <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 12, textAlign: "center" }}>
            ⚠️ Passa do limite do cartão {selectedCard.name}. Disponível: {fmt(Math.max(availableLimit, 0))}
          </p>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={!amount || !category || !cardId || overLimit}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: 16,
            border: "none",
            background: saved
              ? `linear-gradient(135deg, ${S.greenDim ?? "#16a34a"}, ${S.green})`
              : !amount || !category || !cardId
                ? S.border
                : `linear-gradient(135deg, ${S.purpleDim}, ${S.purple})`,
            color: !amount || !category || !cardId ? S.muted : "#fff",
            fontSize: 15,
            fontWeight: 700,
            cursor: !amount || !category || !cardId ? "not-allowed" : "pointer",
            transition: "all 0.2s",
            boxShadow:
              !amount || !category || !cardId
                ? "none"
                : `0 0 20px ${saved ? S.green : S.purple}50`,
          }}
        >
          {saved ? "✓ Despesa Salva!" : "Salvar Despesa"}
        </button>
      </div>
    </div>
  );
}
