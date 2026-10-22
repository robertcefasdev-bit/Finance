import { useEffect, useState } from "react";
import { fmt } from "../data/mockData";
import { friendOwed, buildStatement, invoiceMonth, invoiceNote, localToday, paidCount, planAdvance, ymLabel, maskMoney, moneyStr } from "../utils/finance";
import type { Card, Friend, Debt, Screen } from "../data/mockData";
import { getCurrentMonthOwed } from "../utils/finance";
import { S } from "../theme";
import StatementList, { type StatementRow } from "../components/Statement";
import EditModal from "../components/EditModal";
import MoreMenu from "../components/MoreMenu";


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
  onMarkDebtPaid: (friendId: string, debtId: string, all?: boolean) => void;
  onDeleteDebt: (friendId: string, debtId: string) => void;
  onReactivateDebt: (friendId: string, debtId: string) => void;
  pixKey: string;
  onUpdateFriend: (friendId: string, name: string, phone: string) => void;
  onEditDebt: (
    friendId: string,
    debtId: string,
    v: { title: string; totalValue: number; installments: number; cardId: string; date: string },
  ) => void;
  onRegisterAdvance: (friendId: string, amount: number) => void;
  onUndoAdvance: (friendId: string, advanceId: string) => void;
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
  pixKey,
  onUpdateFriend,
  onEditDebt,
  onRegisterAdvance,
  onUndoAdvance,
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
  const [editDebtId, setEditDebtId] = useState<string | null>(null);
  useEffect(() => {
    setDebts(friend.debts);
  }, [friend.debts]);

  useEffect(() => {
    if (initialOpenAddDebt) {
      setShowAddModal(true);
    }
  }, [initialOpenAddDebt, friend.id]);

  const currentMonth = localToday().slice(0, 7);
  const visiblePaid = debts.filter(
    (d) => d.paid && (!d.paidMonth || d.paidMonth === currentMonth),
  );
  const totalOwed = getCurrentMonthOwed(debts);
  const parsedTotalAmount = newAmount
    ? parseFloat(newAmount.replace(",", ".")) || 0
    : 0;
  const installmentsCount = parseInt(newInstall, 10) || 1;
  const installmentValue = parsedTotalAmount / installmentsCount;

  const [showAdvance, setShowAdvance] = useState(false);
  const [advanceValue, setAdvanceValue] = useState("");
  const advanceAmount = parseFloat(advanceValue.replace(",", ".")) || 0;
  const advancePlan = planAdvance(friend, advanceAmount);
  const advances = friend.advances ?? [];
  const [editingInfo, setEditingInfo] = useState(false);
  const [editName, setEditName] = useState(friend.name);
  const [editPhone, setEditPhone] = useState(friend.phone ?? "");
  const saveInfo = () => {
    if (!editName.trim()) return;
    onUpdateFriend(friend.id, editName.trim(), editPhone.trim());
    setEditingInfo(false);
  };
  const byCard = [...cards, CASH_CARD]
    .map((card) => ({
      card,
      debts: debts.filter((d) => d.cardId === card.id && !d.paid),
    }))
    .filter((g) => g.debts.length > 0);

  const handleMarkPaid = (id: string) => {
    onMarkDebtPaid(friend.id, id);
    showToast("Parcela paga ✓");
  };

  const handlePayAll = (id: string) => {
    onMarkDebtPaid(friend.id, id, true);
    showToast("Dívida quitada ✓");
  };

  const handleUndo = (id: string) => {
    onReactivateDebt(friend.id, id);
    showToast("Último pagamento desfeito ↺");
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
      date: localToday(),
      startMonth: invoiceMonth(localToday(), debtCard),
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

  const pad2 = (n: number) => String(n).padStart(2, "0");
  const todayIso = localToday();
  const cardLabel = (id: string) =>
    id === "cash" ? "Dinheiro" : (cards.find((c) => c.id === id)?.bank ?? CARD_NAME[id] ?? "Cartão");

  const debtRow = (debt: Debt): StatementRow => {
    const done = paidCount(debt);
    let date = debt.date ?? todayIso;
    if (!debt.date && debt.startMonth) {
      const [y, m] = debt.startMonth.split("-");
      date = `${y}-${m.padStart(2, "0")}-01`;
    }
    return {
      id: debt.id,
      date,
      icon: debt.cardId === "cash" ? "💵" : "💳",
      iconColor: CARD_COLOR[debt.cardId] ?? S.purple,
      title: debt.title,
      subtitle: `${cardLabel(debt.cardId)} · ${debt.total > 1 ? `${done}/${debt.total} pagas` : "à vista"}${
        debt.startMonth && debt.cardId !== "cash" && debt.startMonth > localToday().slice(0, 7)
          ? ` · fatura ${ymLabel(debt.startMonth)}`
          : ""
      }`,
      amount: debt.amount,
      kind: "out",
      dim: debt.paid,
      meta: debt.paid ? "✓ Pago" : debt.total > 1 ? "por parcela" : "pendente",
      onClick: () => setActionDebtId(debt.id),
    };
  };

  const advanceRows: StatementRow[] = advances.map((a, index) => {
    const when = new Date(a.date);
    const isLatest = index === advances.length - 1;
    return {
      id: a.id,
      date: `${when.getFullYear()}-${pad2(when.getMonth() + 1)}-${pad2(when.getDate())}`,
      time: `${pad2(when.getHours())}h${pad2(when.getMinutes())}`,
      icon: "💰",
      iconColor: S.green,
      title: "Adiantamento",
      subtitle:
        (a.applied.length > 0
          ? `Quitou: ${a.applied.map((x) => x.title).join(", ")}`
          : "Virou saldo a favor") + (a.creditAfter > 0 ? ` · sobrou ${fmt(a.creditAfter)}` : ""),
      amount: a.amount,
      kind: "in",
      meta: isLatest ? (
        <>
          <span>{`${pad2(when.getHours())}h${pad2(when.getMinutes())}`}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm("Desfazer o último adiantamento?")) {
                onUndoAdvance(friend.id, a.id);
                showToast("Adiantamento desfeito ↺");
              }
            }}
            style={{ border: `1px solid ${S.border}`, background: "none", color: S.muted, borderRadius: 8, padding: "2px 8px", fontSize: 11, cursor: "pointer" }}
          >
            Desfazer
          </button>
        </>
      ) : undefined,
    };
  });

  const statementRows: StatementRow[] = [
    ...debts.filter((d) => !d.paid).map(debtRow),
    ...visiblePaid.map(debtRow),
    ...advanceRows,
  ];

  const actionBtn = (extra: object) => ({
    padding: "13px 8px",
    borderRadius: 14,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    ...extra,
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
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
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
            <MoreMenu
              label="Opções do devedor"
              items={[{ icon: "✏️", label: "Editar devedor", onClick: () => setEditingInfo(true) }]}
            />
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
          {(() => {
            const owedAll = friendOwed({ ...friend, debts });
            if (owedAll.future.length === 0) return null;
            return (
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 3 }}>
                {owedAll.future.map((m) => (
                  <p key={m.ym} style={{ color: S.muted, fontSize: 12 }}>
                    Fatura {ymLabel(m.ym)}:{" "}
                    <span style={{ color: S.purple, fontWeight: 700 }}>{fmt(m.amount)}</span>
                  </p>
                ))}
                <p style={{ color: S.text, fontSize: 12, fontWeight: 700, marginTop: 2 }}>
                  Total geral: {fmt(owedAll.total)}
                </p>
              </div>
            );
          })()}
          {(friend.credit ?? 0) > 0 && (
            <p style={{ color: S.green, fontSize: 13, fontWeight: 700, marginTop: 8 }}>
              💰 Saldo a favor: {fmt(friend.credit ?? 0)}
            </p>
          )}
        </div>
      </div>

      {/* Ações */}
      <div style={{ padding: "16px 20px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <button
          onClick={() => setShowAddModal(true)}
          style={actionBtn({ border: "none", background: `linear-gradient(135deg, ${S.purpleDim}, ${S.purple})`, color: "#fff" })}
        >
          + Nova dívida
        </button>
        <button
          onClick={() => {
            setAdvanceValue("");
            setShowAdvance(true);
          }}
          style={actionBtn({ border: `1px solid ${S.green}40`, background: `${S.green}15`, color: S.green })}
        >
          💰 Adiantamento
        </button>
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(buildStatement(friend, pixKey.trim()));
              showToast("Extrato copiado ✓");
            } catch {
              showToast("Não foi possível copiar");
            }
          }}
          style={actionBtn({ border: `1px solid ${S.border}`, background: S.surface, color: S.text })}
        >
          📋 Copiar extrato
        </button>
        <button
          onClick={() => {
            const msg = encodeURIComponent(buildStatement(friend, pixKey.trim()));
            window.open(`https://wa.me/${friend.phone?.replace(/\D/g, "")}?text=${msg}`, "_blank");
          }}
          style={actionBtn({ border: "1px solid #25d36640", background: "#25d36610", color: "#25d366" })}
        >
          📱 WhatsApp
        </button>
      </div>
      {!pixKey.trim() && (
        <p style={{ padding: "10px 20px 0", color: S.muted, fontSize: 12 }}>
          🔑 Sua chave Pix não está cadastrada.{" "}
          <button
            onClick={() => navigate("settings")}
            style={{ background: "none", border: "none", color: S.purple, fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}
          >
            Cadastrar em Configurações
          </button>
        </p>
      )}

      {/* Extrato */}
      <div style={{ padding: "24px 20px 0" }}>
        <p style={{ color: S.muted, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>
          Extrato de {friend.name}
        </p>
        <p style={{ color: S.muted, fontSize: 11, marginBottom: 12 }}>Toque numa dívida para pagar, quitar ou excluir.</p>
        <StatementList rows={statementRows} emptyText="Nenhuma dívida registrada." />
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
                  inputMode="numeric"
                  value={newAmount}
                  onChange={(e) => setNewAmount(maskMoney(e.target.value))}
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

      {editDebtId && (() => {
        const target = debts.find((x) => x.id === editDebtId);
        if (!target) return null;
        const doneNow = target.paid ? target.total : paidCount(target);
        return (
          <EditModal
            title="Editar dívida"
            initial={{
              title: target.title,
              total: moneyStr(Math.round(target.amount * target.total * 100) / 100),
              installments: String(target.total),
              card: target.cardId,
              date: target.date ?? "",
            }}
            fields={[
              { key: "title", label: "Descrição", type: "text" },
              { key: "total", label: "Valor total (R$)", type: "money" },
              { key: "installments", label: "Parcelas", type: "number", step: "1" },
              {
                key: "card",
                label: "Pagamento",
                type: "select",
                options: [
                  { value: "cash", label: "💵 Dinheiro" },
                  ...cards.map((c) => ({ value: c.id, label: `${c.name} · ${c.bank}` })),
                ],
              },
              { key: "date", label: "Data da compra", type: "date" },
            ]}
            onClose={() => setEditDebtId(null)}
            preview={(v) => invoiceNote(v.date || target.date || localToday(), cards.find((c) => c.id === v.card))}
            onSave={(v) => {
              const totalValue = parseFloat(v.total.replace(",", "."));
              const n = parseInt(v.installments, 10);
              if (!v.title.trim()) return "Informe a descrição da dívida.";
              if (!(totalValue > 0)) return "Informe um valor maior que zero.";
              if (!(n >= 1 && n <= 60)) return "As parcelas devem ficar entre 1 e 60.";
              if (n < doneNow) return `Já foram pagas ${doneNow} parcelas. Use pelo menos ${doneNow}.`;
              const card = cards.find((c) => c.id === v.card);
              if (card) {
                const perInstallment = Math.round((totalValue / n) * 100) / 100;
                const oldUsage =
                  !target.paid && target.cardId === card.id
                    ? target.amount * Math.max(target.total - doneNow, 0)
                    : 0;
                const available = card.limit - (cardUsage[card.id] ?? 0) + oldUsage;
                if (perInstallment * Math.max(n - doneNow, 0) > available + 0.005) {
                  return `Passa do limite do cartão ${card.name}. Disponível: ${fmt(Math.max(available, 0))}`;
                }
              }
              onEditDebt(friend.id, target.id, {
                title: v.title.trim(),
                totalValue,
                installments: n,
                cardId: v.card,
                date: v.date,
              });
              showToast("Dívida atualizada ✓");
              return null;
            }}
          />
        );
      })()}

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
                  setEditDebtId(actionDebtId);
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
                ✏️ Editar dívida
              </button>
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
                ✓ {(debts.find((x) => x.id === actionDebtId)?.total ?? 1) > 1 ? "Pagar próxima parcela" : "Marcar como paga"}
              </button>
              <button
                onClick={() => {
                  handlePayAll(actionDebtId);
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
                ✓✓ Quitar dívida inteira
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
                ↺ Desfazer último pagamento
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

      {/* Adiantamento */}
      {showAdvance && (
        <div
          onClick={() => setShowAdvance(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 430, background: S.surface, borderRadius: "20px 20px 0 0", padding: 20, maxHeight: "85vh", overflowY: "auto" }}
          >
            <p style={{ color: S.text, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
              Adiantamento de {friend.name}
            </p>
            <p style={{ color: S.muted, fontSize: 12, marginBottom: 12 }}>
              Quita as parcelas em aberto, da mais antiga para a mais nova, até onde o valor alcançar.
            </p>
            <input
              autoFocus
              inputMode="numeric"
              value={advanceValue}
              onChange={(e) => setAdvanceValue(maskMoney(e.target.value))}
              placeholder="0,00"
              style={{ width: "100%", background: S.surface2, border: `1px solid ${S.border}`, borderRadius: 12, padding: "13px 14px", color: S.text, fontSize: 16, outline: "none" }}
            />
            {(friend.credit ?? 0) > 0 && (
              <p style={{ color: S.green, fontSize: 12, marginTop: 8 }}>
                💰 Saldo a favor de {fmt(friend.credit ?? 0)} será somado a este valor.
              </p>
            )}
            {advanceAmount > 0 && (
              <div style={{ marginTop: 14, background: S.bg, border: `1px solid ${S.border}`, borderRadius: 12, padding: 12 }}>
                {advancePlan.applied.length === 0 ? (
                  <p style={{ color: S.muted, fontSize: 13 }}>
                    {advancePlan.hasOpen
                      ? "O valor não cobre nenhuma parcela inteira. Tudo vira saldo a favor."
                      : "Não há parcelas em aberto. Tudo vira saldo a favor."}
                  </p>
                ) : (
                  <>
                    <p style={{ color: S.muted, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
                      Será marcado como pago
                    </p>
                    {advancePlan.applied.map((item) => {
                      const debt = friend.debts.find((x) => x.id === item.debtId);
                      return (
                        <div key={item.debtId} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "4px 0" }}>
                          <span style={{ color: S.text, fontSize: 13 }}>
                            {item.title}
                            {debt && debt.total > 1 ? ` · parcela ${item.installments.join(", ")}/${debt.total}` : ""}
                          </span>
                          <span style={{ color: S.green, fontSize: 13, fontWeight: 700 }}>{fmt(item.amount)}</span>
                        </div>
                      );
                    })}
                  </>
                )}
                <div style={{ borderTop: `1px solid ${S.border}`, marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: S.muted, fontSize: 12 }}>Sobra (saldo a favor)</span>
                  <span style={{ color: advancePlan.creditAfter > 0 ? S.green : S.muted, fontSize: 13, fontWeight: 700 }}>
                    {fmt(advancePlan.creditAfter)}
                  </span>
                </div>
              </div>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button
                disabled={advanceAmount <= 0}
                onClick={() => {
                  onRegisterAdvance(friend.id, advanceAmount);
                  setShowAdvance(false);
                  showToast("Adiantamento registrado ✓");
                }}
                style={{ flex: 1, padding: 13, borderRadius: 12, border: "none", background: advanceAmount > 0 ? S.green : S.border, color: advanceAmount > 0 ? "#fff" : S.muted, fontWeight: 700, fontSize: 14, cursor: advanceAmount > 0 ? "pointer" : "default" }}
              >
                Confirmar
              </button>
              <button
                onClick={() => setShowAdvance(false)}
                style={{ padding: "13px 18px", borderRadius: 12, border: `1px solid ${S.border}`, background: "none", color: S.muted, fontSize: 14, cursor: "pointer" }}
              >
                Cancelar
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
