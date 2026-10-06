import { useState } from "react";
import shockLogo from "../assets/shock-logo.png";
import { S } from "../theme";

export default function WelcomeScreen({
  onSave,
}: {
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const ok = name.trim().length > 0;
  return (
    <div
      style={{
        background: S.bg,
        minHeight: "100vh",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: 28,
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      <img
        src={shockLogo}
        alt="SHOCK Programador"
        style={{
          width: "100%",
          maxWidth: 280,
          height: "auto",
          marginBottom: 12,
          mixBlendMode: "screen",
        }}
      />
      <h1 style={{ color: S.text, fontSize: 26, fontWeight: 700 }}>
        Bem-vindo(a)!
      </h1>
      <p style={{ color: S.muted, fontSize: 14, margin: "8px 0 24px" }}>
        Como você quer ser chamado(a)?
      </p>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && ok && onSave(name)}
        placeholder="Seu nome"
        style={{
          width: "100%",
          maxWidth: 320,
          background: S.surface2,
          border: "1px solid #2a2a3a",
          borderRadius: 12,
          padding: "13px 16px",
          color: S.text,
          fontSize: 16,
          outline: "none",
          textAlign: "center",
        }}
      />
      <button
        disabled={!ok}
        onClick={() => onSave(name)}
        style={{
          marginTop: 16,
          width: "100%",
          maxWidth: 320,
          padding: 14,
          borderRadius: 12,
          border: "none",
          background: ok
            ? "linear-gradient(135deg, #7c3aed, #a855f7)"
            : S.border,
          color: ok ? "#fff" : S.muted,
          fontSize: 15,
          fontWeight: 700,
          cursor: ok ? "pointer" : "default",
        }}
      >
        Continuar
      </button>
      <p
        style={{
          position: "absolute",
          bottom: 20,
          color: "#4b5563",
          fontSize: 12,
          letterSpacing: 0.3,
        }}
      >
        Desenvolvido por Robert Cefas
      </p>
    </div>
  );
}
