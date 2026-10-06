import { useState } from "react";
import shockLogo from "../assets/shock-logo.png";
import { S } from "../theme";

interface Props {
  mode: "register" | "login";
  initialName?: string;
  // devolve uma mensagem de erro, ou null se deu certo
  onSubmit: (name: string, password: string) => Promise<string | null>;
}

export default function AuthScreen({ mode, initialName = "", onSubmit }: Props) {
  const isRegister = mode === "register";
  const [name, setName] = useState(initialName);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const ok =
    name.trim().length > 0 &&
    password.length > 0 &&
    (!isRegister || confirm.length > 0);

  const submit = async () => {
    if (!ok || busy) return;
    if (isRegister) {
      if (password.length < 4) return setError("A senha precisa ter pelo menos 4 caracteres.");
      if (password !== confirm) return setError("As senhas não são iguais.");
    }
    setBusy(true);
    setError("");
    const message = await onSubmit(name.trim(), password);
    if (message) {
      setError(message);
      setBusy(false);
    }
  };

  const field = {
    width: "100%",
    maxWidth: 320,
    background: S.surface2,
    border: `1px solid ${S.border}`,
    borderRadius: 12,
    padding: "13px 16px",
    color: S.text,
    fontSize: 16,
    outline: "none",
  } as const;

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
        gap: 12,
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      <img
        src={shockLogo}
        alt="SHOCK Programador"
        style={{ width: "100%", maxWidth: 240, height: "auto", mixBlendMode: S.bg === "#0d0d12" ? "screen" : "normal", filter: S.bg === "#0d0d12" ? "none" : "invert(0.92) hue-rotate(180deg)" }}
      />
      <h1 style={{ color: S.text, fontSize: 24, fontWeight: 700 }}>
        {isRegister ? "Criar acesso" : "Entrar"}
      </h1>
      <p style={{ color: S.muted, fontSize: 13, marginTop: -6, textAlign: "center" }}>
        {isRegister
          ? "Escolha seu nome e uma senha para proteger o app."
          : "Digite seu nome e sua senha."}
      </p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Seu nome"
        autoComplete="username"
        style={field}
      />
      <div style={{ position: "relative", width: "100%", maxWidth: 320 }}>
        <input
          type={show ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !isRegister && submit()}
          placeholder="Senha"
          autoComplete={isRegister ? "new-password" : "current-password"}
          style={{ ...field, paddingRight: 44 }}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Ocultar senha" : "Mostrar senha"}
          style={{ position: "absolute", right: 10, top: 10, border: "none", background: "none", fontSize: 18, cursor: "pointer" }}
        >
          {show ? "🙈" : "👁️"}
        </button>
      </div>
      {isRegister && (
        <input
          type={show ? "text" : "password"}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Repita a senha"
          autoComplete="new-password"
          style={field}
        />
      )}
      {error && (
        <p style={{ color: "#ef4444", fontSize: 13, textAlign: "center", maxWidth: 320 }}>
          {error}
        </p>
      )}
      <button
        disabled={!ok || busy}
        onClick={submit}
        style={{
          width: "100%",
          maxWidth: 320,
          padding: 14,
          borderRadius: 12,
          border: "none",
          background: ok ? "linear-gradient(135deg, #7c3aed, #a855f7)" : S.border,
          color: ok ? "#fff" : S.muted,
          fontSize: 15,
          fontWeight: 700,
          cursor: ok ? "pointer" : "default",
        }}
      >
        {busy ? "Aguarde..." : isRegister ? "Criar e entrar" : "Entrar"}
      </button>
      <p style={{ position: "absolute", bottom: 20, color: S.muted, fontSize: 12, letterSpacing: 0.3 }}>
        Desenvolvido por Robert Cefas
      </p>
    </div>
  );
}
