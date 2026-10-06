import { useEffect, useState } from "react";
import { fmt } from "../data/mockData";
import type { Card, Friend, Debt, Screen } from "../data/mockData";
import { getCurrentMonthOwed } from "../utils/finance";
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

const CASH_CARD: Card = {
  id: "cash",
  name: "Dinheiro",
  bank: "Dinheiro",
  limit: 0,
  closing: 1,
  due: 1,
  color: "#22c55e",
};

interface Props {
  cardUsage: Record<string, number>;
  navigate: (s: Screen, data?: unknown) => void;
  friend: Friend;
  cards: Card[];
  onAddDebt: (friendId: string, debt: Debt) => void;
  onMarkDebtPaid: (friendId: string, debtId: string) => void;
  onDeleteDebt: (friendId: string, debtId: string) => void;
  onReactivateDebt: (friendId: string, debtId: string) => void;
  onUpdatePix: (friendId: string, pix: string) => void;
  onUpdateFriend: (friendId: string, name: string, phone: string) => void;
  initialOpenAddDebt?: boolean;
}

export default function DebtorProfileScreen({
  cardUsage,
  navigate,
  friend,
  cards,
  onAddDebt,
  onMarkDebtPaid,
  onDeleteDebt,
  onReactivateDebt,
  onUpdatePix,
  onUpdateFriend,
  initialOpenAddDebt = false,
}: Props) {
  const [debts, setDebts] = useState<Debt[]>(friend.debts);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newCard, setNewCard] = useState(cards[0]?.id ?? "cash");
  const [newInstall, setNewInstall] = useState("1");
  const [toast, setToast] = useState("");
  const [actionDebtId, setActionDebtId] = useState<string | null>(null);
  useEffect(() => {
    setDebts(friend.debts);
  }, [friend.debts]);

  useEffect(() => {
    if (initialOpenAddDebt) {
      setShowAddModal(true);
    }
  }, [initialOpenAddDebt, friend.id]);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const visiblePaid = debts.filter(
    (d) => d.paid && (!d.paidMonth || d.paidMonth === currentMonth),
  );
  const totalOwed = getCurrentMonthOwed(debts);
  const parsedTotalAmount = newAmount
    ? parseFloat(newAmount.replace(",", ".")) || 0
    : 0;
  const installmentsCount = parseInt(newInstall, 10) || 1;
  const installmentValue = parsedTotalAmount / installmentsCount;

  const [editingInfo, setEditingInfo] = useState(false);
  const [editName, setEditName] = useState(friend.name);
  const [editPhone, setEditPhone] = useState(friend.phone ?? "");
  const saveInfo = () => {
    if (!editName.trim()) return;
    onUpdateFriend(friend.id, editName.trim(), editPhone.trim());
    setEditingInfo(false);
  };
  const [pix, setPix] = useState(friend.pix ?? "");
  const byCard = [...cards, CASH_CARD]
    .map((card) => ({
      card,
      debts: debts.filter((d) => d.cardId === card.id && !d.paid),
    }))
    .filter((g) => g.debts.length > 0);

  const handleMarkPaid = (id: string) => {
    onMarkDebtPaid(friend.id, id);
    setDebts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, paid: true } : d)),
    );
    showToast("Marcado como pago ✓");
  };

  const handleUndo = (id: string) => {
    onReactivateDebt(friend.id, id);
    setDebts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, paid: false } : d)),
    );
    showToast("Pagamento cancelado ↺");
  };

  const handleDelete = (id: string) => {
    onDeleteDebt(friend.id, id);
    setDebts((prev) => prev.filter((d) => d.id !== id));
    showToast("Dívida removida 🗑");
  };

  const debtCard = cards.find((c) => c.id === newCard);
  const debtAvailable = debtCard
    ? debtCard.limit - (cardUsage[debtCard.id] ?? 0)
    : Infinity;
  const debtOverLimit = !!debtCard && parsedTotalAmount > debtAvailable;

  const handleAddDebt = () => {
    if (!newTitle.trim() || !newAmount || debtOverLimit) return;
    const nd: Debt = {
      id: `debt-${Date.now()}`,
      title: newTitle.trim(),
      category: "Outros",
      cardId: newCard,
      amount: installmentValue,
      current: 1,
      total: installmentsCount,
      paid: false,
    };
    onAddDebt(friend.id, nd);
    setDebts((prev) => [nd, ...prev]);
    setNewTitle("");
    setNewAmount("");
    setShowAddModal(false);
    showToast("Dívida adicionada ✓");
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
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
      <div style={{ padding: "52px 20px 0" }}>
        <button
          onClick={() => navigate("debtors")}
          style={{
            background: "none",
            border: "none",
            color: S.muted,
            fontSize: 13,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 20,
            padding: 0,
          }}
        >
          ← Devedores
        </button>
        {editingInfo && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16, background: S.surface, border: `1px solid ${S.border}`, borderRadius: 14, padding: 14 }}>
            <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Nome" style={{ width: "100%", background: S.surface2, border: `1px solid ${S.border}`, borderRadius: 10, padding: "10px 12px", color: S.text, fontSize: 14, outline: "none" }} />
            <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="Telefone (WhatsApp)" style={{ width: "100%", background: S.surface2, border: `1px solid ${S.border}`, borderRadius: 10, padding: "10px 12px", color: S.text, fontSize: 14, outline: "none" }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={saveInfo} style={{ flex: 1, padding: 10, borderRadius: 10, border: "none", background: `${S.purple}30`, color: S.purple, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Salvar</button>
              <button onClick={() => { setEditingInfo(false); setEditName(friend.name); setEditPhone(friend.phone ?? ""); }} style={{ padding: "10px 14px", borderRadius: 10, border: "none", background: S.surface2, color: S.muted, fontSize: 13, cursor: "pointer" }}>Cancelar</button>
            </div>
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              background: `${friend.color}25`,
              border: `2px solid ${friend.color}60`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              fontWeight: 700,
              color: friend.color,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {friend.initials}
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: S.text }}>
              {friend.name}
            </h1>
            {friend.phone && (
              <p style={{ color: S.muted, fontSize: 12, marginTop: 2 }}>
                📱 {friend.phone}
              </p>
            )}
            <button
              onClick={() => setEditingInfo(true)}
              style={{ marginTop: 6, background: "none", border: "none", color: S.purple, fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}
            >
              ✏️ Editar devedor
            </button>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <span
              style={{
                padding: "4px 10px",
                borderRadius: 8,
                background:
                  friend.status === "paid" ? `${S.green}20` : `${S.orange}20`,
                border: `1px solid ${friend.status === "paid" ? `${S.green}40` : `${S.orange}40`}`,
                color: friend.status === "paid" ? S.green : S.orange,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {friend.status === "paid" ? "Em dia" : "Pendente"}
            </span>
          </div>
        </div>

        {/* Total owed */}
        <div
          style={{
            marginTop: 20,
            background: S.surface,
            border: `1px solid ${S.border}`,
            borderRadius: 20,
            padding: "18px 20px",
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
              background: `radial-gradient(circle, ${friend.color}25, transparent)`,
            }}
          />
          <p
            style={{
              color: S.muted,
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontFamily: "'JetBrains Mono', monospace",
              marginBottom: 6,
            }}
          >
            Total em Aberto
          </p>
          <p
            style={{
              fontSize: 34,
              fontWeight: 700,
              color: S.text,
              letterSpacing: "-0.02em",
            }}
          >
            {fmt(totalOwed)}
          </p>
          <p style={{ color: S.muted, fontSize: 12, marginTop: 4 }}>
            {debts.filter((d) => !d.paid).length} dívida(s) ativa(s)
          </p>
        </div>
      </div>

      {/* Debt by card */}
      <div style={{ padding: "20px 20px 0" }}>
        <p
          style={{
            color: S.muted,
            fontSize: 11,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontFamily: "'JetBrains Mono', monospace",
            marginBottom: 14,
          }}
        >
          Por Cartão
        </p>
        {byCard.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: S.muted,
              fontSize: 13,
              padding: "20px 0",
            }}
          >
            Sem dívidas em aberto 🎉
          </div>
        ) : (
          byCard.map(({ card, debts: cd }) => (
            <div key={card.id} style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 18,
                    borderRadius: 4,
                    background: `linear-gradient(135deg, ${card.color}60, ${card.color}30)`,
                    border: `1px solid ${card.color}40`,
                  }}
                />
                <p style={{ color: card.color, fontSize: 12, fontWeight: 700 }}>
                  {card.bank}
                </p>
                <p style={{ color: S.muted, fontSize: 11 }}>
                  · {fmt(cd.reduce((s, d) => s + d.amount, 0))}/mês
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {cd.map((debt) => (
                  <div
                    key={debt.id}
                    style={{
                      background: S.surface,
                      border: `1px solid ${S.border}`,
                      borderRadius: 14,
                      padding: "12px 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          color: S.text,
                          fontSize: 13,
                          fontWeight: 600,
                          marginBottom: 3,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {debt.title}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span style={{ color: S.muted, fontSize: 10 }}>
                          {debt.category}
                        </span>
                      </div>
                      <div
                        style={{
                          marginTop: 6,
                          background: S.border,
                          borderRadius: 3,
                          height: 3,
                        }}
                      >
                        <div
                          style={{
                            width: `${(debt.current / debt.total) * 100}%`,
                            height: "100%",
                            borderRadius: 3,
                            background: `linear-gradient(90deg, ${CARD_COLOR[debt.cardId] ?? S.purple}, ${CARD_COLOR[debt.cardId] ?? S.purple}90)`,
                          }}
                        />
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: 5,
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 6,
                          background: `${CARD_COLOR[debt.cardId] ?? S.purple}20`,
                          border: `1px solid ${CARD_COLOR[debt.cardId] ?? S.purple}40`,
                          color: CARD_COLOR[debt.cardId] ?? S.purple,
                          fontSize: 10,
                          fontWeight: 700,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {debt.current}/{debt.total}
                      </span>
                      <p
                        style={{ color: S.text, fontSize: 13, fontWeight: 700 }}
                      >
                        {fmt(debt.amount)}
                      </p>
                      <button
                        onClick={() => handleMarkPaid(debt.id)}
                        style={{
                          background: `${S.green}15`,
                          border: `1px solid ${S.green}40`,
                          borderRadius: 8,
                          padding: "3px 8px",
                          color: S.green,
                          fontSize: 10,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        ✓ Pago
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Paid debts */}
      {visiblePaid.length > 0 && (
        <div style={{ padding: "0 20px 0" }}>
          <p
            style={{
              color: S.muted,
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontFamily: "'JetBrains Mono', monospace",
              marginBottom: 10,
            }}
          >
            Pagos
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {visiblePaid.map((debt) => (
                <div
                  key={debt.id}
                  style={{
                    background: S.surface,
                    border: `1px solid ${S.border}`,
                    borderRadius: 14,
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    opacity: 0.5,
                  }}
                >
                  <div>
                    <p
                      style={{
                        color: S.text,
                        fontSize: 13,
                        fontWeight: 600,
                        textDecoration: "line-through",
                      }}
                    >
                      {debt.title}
                    </p>
                    <p style={{ color: S.muted, fontSize: 10, marginTop: 2 }}>
                      {debt.cardId === "cash" ? "Dinheiro" : (CARD_NAME[debt.cardId] ?? cards.find((c) => c.id === debt.cardId)?.bank)}
                    </p>
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <p
                      style={{
                        color: S.muted,
                        fontSize: 13,
                        fontWeight: 700,
                        textDecoration: "line-through",
                      }}
                    >
                      {fmt(debt.amount)}
                    </p>
                    <span style={{ color: S.green, fontSize: 12 }}>✓</span>
                    <button
                      onClick={() => handleUndo(debt.id)}
                      style={{
                        border: `1px solid ${S.purple}60`,
                        background: `${S.purple}20`,
                        color: S.purple,
                        borderRadius: 8,
                        padding: "4px 8px",
                        fontSize: 10,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      ↺ Reativar
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div
        style={{
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 14,
            border: "none",
            background: `linear-gradient(135deg, ${S.purpleDim}, ${S.purple})`,
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: `0 0 18px ${S.purple}40`,
          }}
        >
          + Adicionar Nova Dívida
        </button>
        <input
          value={pix}
          onChange={(e) => setPix(e.target.value)}
          onBlur={() => onUpdatePix(friend.id, pix.trim())}
          placeholder="🔑 Minha chave Pix (salva para as cobranças)"
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 12,
            border: `1px solid ${S.border}`,
            background: S.surface,
            color: S.text,
            fontSize: 13,
            outline: "none",
          }}
        />
        <button
          onClick={() => {
            onUpdatePix(friend.id, pix.trim());
            const msg = encodeURIComponent(
              `Oi ${friend.name}! Você tem ${fmt(totalOwed)} em aberto comigo.` +
                (pix.trim() ? `\nMinha chave Pix: ${pix.trim()}` : "") +
                ` Pode verificar?`,
            );
            window.open(
              `https://wa.me/${friend.phone?.replace(/\D/g, "")}?text=${msg}`,
              "_blank",
            );
          }}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 14,
            border: `1px solid #25d36640`,
            background: "#25d36610",
            color: "#25d366",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          📱 Lembrar via WhatsApp
        </button>
      </div>

      {/* Add Debt Modal */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            zIndex: 100,
            display: "flex",
            alignItems: "flex-end",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 430,
              margin: "0 auto",
              background: S.surface2,
              borderRadius: "24px 24px 0 0",
              padding: "24px 20px 40px",
              border: `1px solid ${S.border}`,
            }}
          >
            <div
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                background: S.border,
                margin: "0 auto 20px",
              }}
            />
            <h2
              style={{
                color: S.text,
                fontSize: 18,
                fontWeight: 700,
                marginBottom: 20,
              }}
            >
              Nova Dívida — {friend.name}
            </h2>

            <div style={{ marginBottom: 14 }}>
              <label
                style={{
                  color: S.muted,
                  fontSize: 11,
                  display: "block",
                  marginBottom: 7,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                Descrição
              </label>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ex: Nike Air Max"
                style={{
                  width: "100%",
                  background: S.surface,
                  border: `1px solid ${S.border}`,
                  borderRadius: 12,
                  padding: "12px 14px",
                  color: S.text,
                  fontSize: 14,
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
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                marginBottom: 14,
              }}
            >
              <div>
                <label
                  style={{
                    color: S.muted,
                    fontSize: 11,
                    display: "block",
                    marginBottom: 7,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  Valor (R$)
                </label>
                <input
                  type="number"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="0,00"
                  style={{
                    width: "100%",
                    background: S.surface,
                    border: `1px solid ${S.border}`,
                    borderRadius: 12,
                    padding: "12px 14px",
                    color: S.text,
                    fontSize: 14,
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
              <div>
                <label
                  style={{
                    color: S.muted,
                    fontSize: 11,
                    display: "block",
                    marginBottom: 7,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  Parcelas
                </label>
                <select
                  value={newInstall}
                  onChange={(e) => setNewInstall(e.target.value)}
                  style={{
                    width: "100%",
                    background: S.surface,
                    border: `1px solid ${S.border}`,
                    borderRadius: 12,
                    padding: "12px 14px",
                    color: S.text,
                    fontSize: 14,
                    outline: "none",
                  }}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 18, 24].map((n) => (
                    <option key={n} value={n}>
                      {n}x
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label
                style={{
                  color: S.muted,
                  fontSize: 11,
                  display: "block",
                  marginBottom: 7,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                Valor por parcela
              </label>
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: S.surface,
                  border: `1px solid ${S.border}`,
                  color: S.text,
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {fmt(installmentValue)}
              </div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label
                style={{
                  color: S.muted,
                  fontSize: 11,
                  display: "block",
                  marginBottom: 7,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                Cartão
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[...cards, CASH_CARD].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setNewCard(c.id)}
                    style={{
                      flex: 1,
                      padding: "10px 8px",
                      borderRadius: 12,
                      border: `1px solid ${newCard === c.id ? c.color : S.border}`,
                      background: newCard === c.id ? `${c.color}15` : S.surface,
                      color: newCard === c.id ? c.color : S.muted,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {c.bank}
                  </button>
                ))}
              </div>
            </div>
            {debtOverLimit && debtCard && (
              <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 10, textAlign: "center" }}>
                ⚠️ Passa do limite do cartão {debtCard.name}. Disponível: {fmt(Math.max(debtAvailable, 0))}
              </p>
            )}
            <button
              onClick={handleAddDebt}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: 14,
                border: "none",
                background:
                  newTitle && newAmount
                    ? `linear-gradient(135deg, ${S.purpleDim}, ${S.purple})`
                    : S.border,
                color: newTitle && newAmount ? "#fff" : S.muted,
                fontSize: 15,
                fontWeight: 700,
                cursor: newTitle && newAmount ? "pointer" : "not-allowed",
                boxShadow:
                  newTitle && newAmount ? `0 0 18px ${S.purple}40` : "none",
              }}
            >
              Salvar Dívida
            </button>
          </div>
        </div>
      )}

      {actionDebtId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            zIndex: 140,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setActionDebtId(null)}
        >
          <div
            style={{
              background: S.surface2,
              border: `1px solid ${S.border}`,
              borderRadius: 16,
              padding: 16,
              width: "88%",
              maxWidth: 320,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p
              style={{
                color: S.text,
                fontSize: 15,
                fontWeight: 700,
                marginBottom: 12,
              }}
            >
              Ações da dívida
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                onClick={() => {
                  handleMarkPaid(actionDebtId);
                  setActionDebtId(null);
                }}
                style={{
                  padding: "10px",
                  borderRadius: 12,
                  background: `${S.green}15`,
                  border: `1px solid ${S.green}40`,
                  color: S.green,
                  fontWeight: 700,
                }}
              >
                ✓ Marcar como paga
              </button>
              <button
                onClick={() => {
                  handleUndo(actionDebtId);
                  setActionDebtId(null);
                }}
                style={{
                  padding: "10px",
                  borderRadius: 12,
                  background: `${S.purple}15`,
                  border: `1px solid ${S.purple}40`,
                  color: S.purple,
                  fontWeight: 700,
                }}
              >
                ↺ Cancelar pagamento
              </button>
              <button
                onClick={() => {
                  handleDelete(actionDebtId);
                  setActionDebtId(null);
                }}
                style={{
                  padding: "10px",
                  borderRadius: 12,
                  background: "#ef444415",
                  border: "1px solid #ef444440",
                  color: "#ef4444",
                  fontWeight: 700,
                }}
              >
                🗑 Excluir dívida
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 100,
            left: "50%",
            transform: "translateX(-50%)",
            background: `${S.green}20`,
            border: `1px solid ${S.green}50`,
            borderRadius: 20,
            padding: "10px 20px",
            color: S.green,
            fontSize: 13,
            fontWeight: 600,
            zIndex: 200,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
