import { useEffect, useState } from "react";
import type { Card, Screen } from "../data/mockData";
import { S } from "../theme";


const PRESET_COLORS = [
  "#a855f7",
  "#22c55e",
  "#f97316",
  "#3b82f6",
  "#ec4899",
  "#f59e0b",
  "#06b6d4",
  "#ef4444",
];

const BANKS = [
  "Nubank",
  "Itaú",
  "Bradesco",
  "Santander",
  "XP Cartão",
  "Inter",
  "C6 Bank",
  "BTG",
  "Outro",
];

interface Props {
  navigate: (s: Screen, data?: unknown) => void;
  onAddCard: (card: Card) => void;
  onUpdateCard?: (card: Card) => void;
  onRemoveCard?: (cardId: string) => void;
  routeData?: unknown;
}

export default function AddCardScreen({
  navigate,
  onAddCard,
  onUpdateCard,
  onRemoveCard,
  routeData,
}: Props) {
  const [cardName, setCardName] = useState("");
  const [bank, setBank] = useState("");
  const [limit, setLimit] = useState("");
  const [closing, setClosing] = useState("");
  const [due, setDue] = useState("");
  const [color, setColor] = useState("#a855f7");
  const [saved, setSaved] = useState(false);
  const [showBankInput, setShowBankInput] = useState(false);
  const [customBank, setCustomBank] = useState("");
  const editingCard =
    routeData && typeof routeData === "object" && "card" in routeData
      ? (routeData as { card: Card }).card
      : null;

  useEffect(() => {
    if (!editingCard) return;
    setCardName(editingCard.name);
    if (BANKS.includes(editingCard.bank)) {
      setBank(editingCard.bank);
    } else {
      setBank("Outro");
      setShowBankInput(true);
      setCustomBank(editingCard.bank);
    }
    setLimit(String(editingCard.limit));
    setClosing(String(editingCard.closing));
    setDue(String(editingCard.due));
    setColor(editingCard.color);
  }, [editingCard]);

  const handleSave = () => {
    if (!isValid) return;
    const finalBank = bank === "Outro" ? customBank.trim() : bank;

    const parsedCard = {
      id: editingCard?.id ?? `card-${Date.now()}`,
      name: cardName.trim(),
      bank: finalBank,
      limit: parseFloat(limit),
      closing: parseInt(closing, 10),
      due: parseInt(due, 10),
      color,
    };

    if (editingCard) {
      onUpdateCard?.(parsedCard);
    } else {
      onAddCard(parsedCard);
    }

    setSaved(true);
    setTimeout(() => {
      navigate("settings");
    }, 1500);
  };

  const isValid =
    cardName &&
    bank &&
    (bank !== "Outro" || customBank.trim()) &&
    limit &&
    closing &&
    due;

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
          onClick={() => navigate("settings")}
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
            {editingCard ? "Editar Cartão" : "Novo Cartão"}
          </p>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: S.text }}>
            {editingCard ? "Editar Cartão" : "Adicionar Cartão"}
          </h1>
        </div>
      </div>

      {/* Card Preview */}
      <div style={{ padding: "24px 20px 0" }}>
        <div
          style={{
            borderRadius: 22,
            padding: "28px 24px",
            background: `linear-gradient(135deg, ${color}50, ${color}20)`,
            border: `1px solid ${color}50`,
            position: "relative",
            overflow: "hidden",
            minHeight: 160,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -40,
              right: -40,
              width: 150,
              height: 150,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${color}40, transparent)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -30,
              left: -30,
              width: 100,
              height: 100,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${color}25, transparent)`,
            }}
          />

          {/* Chip */}
          <div
            style={{
              width: 36,
              height: 26,
              borderRadius: 5,
              background: `linear-gradient(135deg, #fbbf24, #f59e0b)`,
              marginBottom: 20,
            }}
          />

          <p
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 12,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              fontFamily: "'JetBrains Mono', monospace",
              marginBottom: 4,
            }}
          >
            {bank === "Outro" ? customBank.trim() || "Banco" : bank || "Banco"}
          </p>
          <p
            style={{
              color: "#fff",
              fontSize: 18,
              fontWeight: 700,
              marginBottom: 16,
            }}
          >
            {cardName || "Nome do Cartão"}
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            <div>
              <p
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 9,
                  letterSpacing: "0.1em",
                  marginBottom: 2,
                }}
              >
                FECHA / VENCE
              </p>
              <p
                style={{
                  color: "#fff",
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 600,
                }}
              >
                dia {closing || "--"} / dia {due || "--"}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 9,
                  letterSpacing: "0.1em",
                  marginBottom: 2,
                }}
              >
                LIMITE
              </p>
              <p
                style={{
                  color: "#fff",
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 600,
                }}
              >
                {limit
                  ? `R$ ${parseFloat(limit).toLocaleString("pt-BR")}`
                  : "R$ --"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Color selector */}
      <div style={{ padding: "20px 20px 0" }}>
        <label
          style={{
            color: S.muted,
            fontSize: 11,
            display: "block",
            marginBottom: 10,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          Cor do Cartão
        </label>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: c,
                border: "none",
                cursor: "pointer",
                outline: color === c ? `3px solid ${c}` : "none",
                outlineOffset: 3,
                boxShadow: color === c ? `0 0 12px ${c}` : "none",
                transition: "all 0.18s",
              }}
            />
          ))}
        </div>
      </div>

      {/* Form */}
      <div style={{ padding: "20px 20px 0" }}>
        {/* Bank */}
        <div style={{ marginBottom: 16 }}>
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
            Banco
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {BANKS.map((b) => (
              <button
                key={b}
                onClick={() => {
                  setBank(b);
                  setShowBankInput(b === "Outro");
                }}
                style={{
                  padding: "7px 14px",
                  borderRadius: 16,
                  border: bank === b ? "none" : `1px solid ${S.border}`,
                  background:
                    bank === b
                      ? `linear-gradient(135deg, ${S.purpleDim}, ${S.purple})`
                      : S.surface,
                  color: bank === b ? "#fff" : S.muted,
                  fontSize: 12,
                  cursor: "pointer",
                  transition: "all 0.18s",
                }}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {showBankInput && (
          <div style={{ marginBottom: 14 }}>
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
              Nome do Banco
            </label>
            <input
              value={customBank}
              onChange={(e) => setCustomBank(e.target.value)}
              placeholder="Digite o nome do banco"
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
            />
          </div>
        )}

        {/* Card name */}
        <div style={{ marginBottom: 14 }}>
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
            Apelido do Cartão
          </label>
          <input
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            placeholder="Ex: Roxinho, Viagem, Dia-a-dia"
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
              e.currentTarget.style.borderColor = color;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = S.border;
            }}
          />
        </div>

        {/* Limit */}
        <div style={{ marginBottom: 14 }}>
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
            Limite Total (R$)
          </label>
          <input
            type="number"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            placeholder="10000"
            style={{
              width: "100%",
              background: S.surface,
              border: `1px solid ${S.border}`,
              borderRadius: 12,
              padding: "12px 14px",
              color: S.text,
              fontSize: 14,
              outline: "none",
              fontFamily: "'JetBrains Mono', monospace",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = color;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = S.border;
            }}
          />
        </div>

        {/* Closing & due */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <div>
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
              Dia de Fechamento
            </label>
            <input
              type="number"
              min={1}
              max={31}
              value={closing}
              onChange={(e) => setClosing(e.target.value)}
              placeholder="15"
              style={{
                width: "100%",
                background: S.surface,
                border: `1px solid ${S.border}`,
                borderRadius: 12,
                padding: "12px 14px",
                color: S.text,
                fontSize: 16,
                fontWeight: 700,
                outline: "none",
                fontFamily: "'JetBrains Mono', monospace",
                textAlign: "center",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = color;
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
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Dia de Vencimento
            </label>
            <input
              type="number"
              min={1}
              max={31}
              value={due}
              onChange={(e) => setDue(e.target.value)}
              placeholder="22"
              style={{
                width: "100%",
                background: S.surface,
                border: `1px solid ${S.border}`,
                borderRadius: 12,
                padding: "12px 14px",
                color: S.text,
                fontSize: 16,
                fontWeight: 700,
                outline: "none",
                fontFamily: "'JetBrains Mono', monospace",
                textAlign: "center",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = color;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = S.border;
              }}
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={!isValid}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: 16,
            border: "none",
            background: saved
              ? "linear-gradient(135deg, #16a34a, #22c55e)"
              : isValid
                ? `linear-gradient(135deg, ${S.purpleDim}, ${S.purple})`
                : S.border,
            color: isValid ? "#fff" : S.muted,
            fontSize: 15,
            fontWeight: 700,
            cursor: isValid ? "pointer" : "not-allowed",
            transition: "all 0.2s",
            boxShadow: isValid
              ? `0 0 20px ${saved ? "#22c55e" : S.purple}50`
              : "none",
            marginBottom: 10,
          }}
        >
          {saved
            ? "✓ Cartão Salvo!"
            : editingCard
              ? "Salvar Alterações"
              : "Salvar Cartão"}
        </button>

        <button
          onClick={() => navigate("settings")}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 16,
            border: `1px solid ${S.border}`,
            background: "transparent",
            color: S.muted,
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
