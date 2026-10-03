import { useState } from "react";
import { fmt } from "../data/mockData";
import type { Friend, Screen } from "../data/mockData";

const S = {
  bg: "#0d0d12",
  surface: "#15151e",
  surface2: "#1c1c28",
  border: "#2a2a3a",
  purple: "#a855f7",
  purpleDim: "#7c3aed",
  green: "#22c55e",
  muted: "#6b7280",
  text: "#f1f0ff",
  text2: "#a1a1b5",
  orange: "#f97316",
};

interface Props {
  navigate: (s: Screen, data?: unknown) => void;
  friends: Friend[];
  onAddDebtor: (friend: Friend) => void;
  onMarkPaid: (friendId: string) => void;
  onRemoveDebtor: (friendId: string) => void;
}

export default function DebtorsScreen({
  navigate,
  friends,
  onAddDebtor,
  onMarkPaid,
  onRemoveDebtor,
}: Props) {
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [selectedColor, setSelectedColor] = useState("#a855f7");
  const [toast, setToast] = useState("");
  const totalReceivable = friends.reduce((s, f) => s + f.totalOwed, 0);

  const COLORS = [
    "#a855f7",
    "#22c55e",
    "#ec4899",
    "#f59e0b",
    "#06b6d4",
    "#f97316",
    "#3b82f6",
  ];

  const handleAddDebtor = () => {
    if (!newName.trim()) return;
    const initials = newName
      .trim()
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    const newFriend: Friend = {
      id: `friend-${Date.now()}`,
      name: newName.trim(),
      initials,
      color: selectedColor,
      phone: newPhone,
      totalOwed: 0,
      status: "paid",
      debts: [],
    };
    onAddDebtor(newFriend);
    setNewName("");
    setNewPhone("");
    setShowModal(false);
  };

  const handleMarkPaid = (id: string) => {
    onMarkPaid(id);
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
        <div
          style={{
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
              Gestão
            </p>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: S.text }}>
              Devedores
            </h1>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: "10px 16px",
              borderRadius: 20,
              background: `linear-gradient(135deg, ${S.purpleDim}, ${S.purple})`,
              border: "none",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: `0 0 16px ${S.purple}40`,
            }}
          >
            + Novo
          </button>
        </div>
      </div>

      {/* Total card */}
      <div
        style={{
          margin: "20px 20px 0",
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
            background: `radial-gradient(circle, ${S.green}20, transparent)`,
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
          Total a Receber
        </p>
        <p
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: S.green,
            letterSpacing: "-0.02em",
          }}
        >
          {fmt(totalReceivable)}
        </p>
        <p style={{ color: S.muted, fontSize: 12, marginTop: 4 }}>
          {friends.filter((f) => f.status === "pending").length} devedor(es) com
          pendências
        </p>
      </div>

      {/* List */}
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
          {friends.length} devedores cadastrados
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {friends.map((f) => (
            <div
              key={f.id}
              style={{
                background: S.surface,
                border: `1px solid ${S.border}`,
                borderRadius: 18,
                padding: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: "50%",
                    background: `${f.color}25`,
                    border: `2px solid ${f.color}60`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 700,
                    color: f.color,
                    fontFamily: "'JetBrains Mono', monospace",
                    flexShrink: 0,
                  }}
                >
                  {f.initials}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: S.text, fontSize: 14, fontWeight: 700 }}>
                    {f.name}
                  </p>
                  {f.phone && (
                    <p style={{ color: S.muted, fontSize: 11, marginTop: 2 }}>
                      📱 {f.phone}
                    </p>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  <p
                    style={{
                      color: f.totalOwed > 0 ? S.green : S.muted,
                      fontSize: 16,
                      fontWeight: 700,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {fmt(f.totalOwed)}
                  </p>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: 6,
                      fontSize: 9,
                      fontWeight: 600,
                      background:
                        f.status === "paid" ? `${S.green}20` : `${S.orange}20`,
                      border: `1px solid ${f.status === "paid" ? `${S.green}40` : `${S.orange}40`}`,
                      color: f.status === "paid" ? S.green : S.orange,
                    }}
                  >
                    {f.status === "paid" ? "Em dia" : "Pendente"}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  onClick={() => navigate("debtorProfile", f)}
                  style={{
                    flex: 1,
                    minWidth: 104,
                    padding: "9px",
                    borderRadius: 12,
                    border: `1px solid ${S.border}`,
                    background: S.surface2,
                    color: S.purple,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Ver Detalhes
                </button>
                <button
                  onClick={() =>
                    navigate("debtorProfile", { friend: f, openAddDebt: true })
                  }
                  style={{
                    flex: 1,
                    minWidth: 104,
                    padding: "9px",
                    borderRadius: 12,
                    border: `1px solid ${S.purple}40`,
                    background: `${S.purple}10`,
                    color: S.purple,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  + Nova Dívida
                </button>
                <button
                  onClick={() => onRemoveDebtor(f.id)}
                  style={{
                    padding: "9px 10px",
                    borderRadius: 12,
                    border: `1px solid #ef444440`,
                    background: "#ef444415",
                    color: "#ef4444",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Remover
                </button>
                {f.status === "pending" && (
                  <button
                    onClick={() => handleMarkPaid(f.id)}
                    style={{
                      flex: 1,
                      padding: "9px",
                      borderRadius: 12,
                      border: `1px solid ${S.green}40`,
                      background: `${S.green}10`,
                      color: S.green,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    ✓ Pago
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Debtor Modal */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 110,
            left: "50%",
            transform: "translateX(-50%)",
            background: `${S.purple}20`,
            border: `1px solid ${S.purple}40`,
            borderRadius: 999,
            padding: "8px 14px",
            color: S.text,
            zIndex: 120,
          }}
        >
          {toast}
        </div>
      )}

      {showModal && (
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
            if (e.target === e.currentTarget) setShowModal(false);
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
              Adicionar Devedor
            </h2>

            <div style={{ marginBottom: 16 }}>
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
                Nome Completo
              </label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: João da Silva"
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

            <div style={{ marginBottom: 16 }}>
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
                WhatsApp / Telefone
              </label>
              <input
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="+55 11 99999-0000"
                type="tel"
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
                Cor do Avatar
              </label>
              <div style={{ display: "flex", gap: 10 }}>
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: c,
                      border: "none",
                      cursor: "pointer",
                      outline: selectedColor === c ? `3px solid ${c}` : "none",
                      outlineOffset: 2,
                      boxShadow: selectedColor === c ? `0 0 10px ${c}` : "none",
                    }}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={handleAddDebtor}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: 14,
                border: "none",
                background: newName.trim()
                  ? `linear-gradient(135deg, ${S.purpleDim}, ${S.purple})`
                  : S.border,
                color: newName.trim() ? "#fff" : S.muted,
                fontSize: 15,
                fontWeight: 700,
                cursor: newName.trim() ? "pointer" : "not-allowed",
                boxShadow: newName.trim() ? `0 0 18px ${S.purple}40` : "none",
              }}
            >
              Adicionar Devedor
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
