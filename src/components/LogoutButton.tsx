import { S } from "../theme";

// Mesmo botão redondo de sair usado na Home
export default function LogoutButton({ onLogout }: { onLogout: () => void }) {
  return (
    <button
      onClick={() => {
        if (window.confirm("Sair da conta?")) onLogout();
      }}
      aria-label="Sair da conta"
      title="Sair"
      style={{
        width: 42,
        height: 42,
        borderRadius: "50%",
        border: "none",
        background: `linear-gradient(135deg, ${S.purpleDim}, ${S.purple})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    </button>
  );
}
