import { useState } from "react";
import shockLogo from "../assets/shock-logo.png";
import { S } from "../theme";
import { api } from "../utils/api";

type Mode = "login" | "register" | "forgot" | "reset";

interface Props {
  resetToken?: string | null;
  onAuthenticated: (username: string) => void;
  onResetDone?: () => void;
}

const UNAVAILABLE =
  "Servidor não encontrado. Publique na Vercel ou rode com `vercel dev` (veja o DEPLOY.md).";

export default function AuthScreen({ resetToken, onAuthenticated, onResetDone }: Props) {
  const [mode, setMode] = useState<Mode>(resetToken ? "reset" : "login");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const go = (next: Mode) => {
    setMode(next);
    setError("");
    setInfo("");
    setPassword("");
    setConfirm("");
  };

  const submit = async () => {
    if (busy) return;
    setError("");
    setInfo("");

    if (mode === "register" || mode === "reset") {
      if (password.length < 6) return setError("A senha precisa ter pelo menos 6 caracteres.");
      if (password !== confirm) return setError("As senhas não são iguais.");
    }

    setBusy(true);
    try {
      if (mode === "login") {
        const r = await api.login(username.trim(), password);
        if (r.unavailable) return setError(UNAVAILABLE);
        if (!r.ok) return setError(r.data.error ?? "Não foi possível entrar.");
        onAuthenticated(r.data.username as string);
      } else if (mode === "register") {
        const r = await api.register(username.trim(), phone, password);
        if (r.unavailable) return setError(UNAVAILABLE);
        if (!r.ok) return setError(r.data.error ?? "Não foi possível cadastrar.");
        onAuthenticated(r.data.username as string);
      } else if (mode === "forgot") {
        const r = await api.forgot(identifier.trim());
        if (r.unavailable) return setError(UNAVAILABLE);
        if (!r.ok) return setError(r.data.error ?? "Não foi possível enviar o link.");
        setInfo(r.data.message ?? "Link enviado para o seu WhatsApp.");
      } else {
        const r = await api.reset(resetToken ?? "", password);
        if (r.unavailable) return setError(UNAVAILABLE);
        if (!r.ok) return setError(r.data.error ?? "Link inválido ou expirado.");
        onResetDone?.();
        go("login");
        setInfo("Senha alterada! Entre com a nova senha.");
      }
    } finally {
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
  const onEnter = (e: React.KeyboardEvent) => e.key === "Enter" && submit();
  const link = {
    background: "none",
    border: "none",
    color: S.purple,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  } as const;

  const passwordField = (value: string, set: (v: string) => void, placeholder: string, withToggle: boolean) => (
    <div style={{ position: "relative", width: "100%", maxWidth: 320 }}>
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => set(e.target.value)}
        onKeyDown={onEnter}
        placeholder={placeholder}
        autoComplete={mode === "login" ? "current-password" : "new-password"}
        style={{ ...field, paddingRight: withToggle ? 44 : 16 }}
      />
      {withToggle && (
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Ocultar senha" : "Mostrar senha"}
          style={{ position: "absolute", right: 10, top: 10, border: "none", background: "none", fontSize: 18, cursor: "pointer" }}
        >
          {show ? "🙈" : "👁️"}
        </button>
      )}
    </div>
  );

  const titles: Record<Mode, string> = {
    login: "Entrar",
    register: "Criar conta",
    forgot: "Esqueci minha senha",
    reset: "Nova senha",
  };
  const subtitles: Record<Mode, string> = {
    login: "Digite seu usuário e sua senha.",
    register: "Cadastre usuário, telefone (WhatsApp) e senha.",
    forgot: "Enviaremos um link para o WhatsApp cadastrado.",
    reset: "Escolha a nova senha da sua conta.",
  };
  const buttonText: Record<Mode, string> = {
    login: "Entrar",
    register: "Criar conta e entrar",
    forgot: "Enviar link pelo WhatsApp",
    reset: "Salvar nova senha",
  };
  const light = S.bg !== "#0d0d12";

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
        padding: "28px 28px 60px",
        gap: 12,
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      <img
        src={shockLogo}
        alt="SHOCK Programador"
        style={{
          width: "100%",
          maxWidth: 220,
          height: "auto",
          mixBlendMode: light ? "normal" : "screen",
          filter: light ? "invert(0.92) hue-rotate(180deg)" : "none",
        }}
      />
      <h1 style={{ color: S.text, fontSize: 24, fontWeight: 700 }}>{titles[mode]}</h1>
      <p style={{ color: S.muted, fontSize: 13, marginTop: -6, textAlign: "center", maxWidth: 320 }}>
        {subtitles[mode]}
      </p>

      {(mode === "login" || mode === "register") && (
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={onEnter}
          placeholder="Nome de usuário"
          autoComplete="username"
          autoCapitalize="none"
          style={field}
        />
      )}
      {mode === "register" && (
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onKeyDown={onEnter}
          placeholder="WhatsApp com DDD, ex.: 71 99999-9999"
          autoComplete="tel"
          style={field}
        />
      )}
      {mode === "forgot" && (
        <input
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          onKeyDown={onEnter}
          placeholder="Usuário ou telefone"
          autoCapitalize="none"
          style={field}
        />
      )}
      {mode !== "forgot" && passwordField(password, setPassword, mode === "reset" ? "Nova senha" : "Senha", true)}
      {(mode === "register" || mode === "reset") &&
        passwordField(confirm, setConfirm, "Repita a senha", false)}

      {error && (
        <p style={{ color: "#ef4444", fontSize: 13, textAlign: "center", maxWidth: 320 }}>{error}</p>
      )}
      {info && (
        <p style={{ color: S.green, fontSize: 13, textAlign: "center", maxWidth: 320 }}>{info}</p>
      )}

      <button
        disabled={busy}
        onClick={submit}
        style={{
          width: "100%",
          maxWidth: 320,
          padding: 14,
          borderRadius: 12,
          border: "none",
          background: "linear-gradient(135deg, #7c3aed, #a855f7)",
          color: "#fff",
          fontSize: 15,
          fontWeight: 700,
          cursor: busy ? "default" : "pointer",
          opacity: busy ? 0.7 : 1,
        }}
      >
        {busy ? "Aguarde..." : buttonText[mode]}
      </button>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        {mode === "login" && (
          <>
            <button style={link} onClick={() => go("forgot")}>Esqueci minha senha</button>
            <button style={link} onClick={() => go("register")}>Não tenho conta — cadastrar</button>
          </>
        )}
        {mode === "register" && (
          <button style={link} onClick={() => go("login")}>Já tenho conta — entrar</button>
        )}
        {(mode === "forgot" || mode === "reset") && (
          <button style={link} onClick={() => go("login")}>Voltar para o login</button>
        )}
      </div>

      <p style={{ position: "absolute", bottom: 20, color: S.muted, fontSize: 12, letterSpacing: 0.3 }}>
        Desenvolvido por Robert Cefas
      </p>
    </div>
  );
}
