import { useEffect, useRef, useState } from "react";
import { S } from "../theme";

export interface MenuItem {
  label: string;
  icon?: string;
  danger?: boolean;
  onClick: () => void;
}

// Botão de três pontinhos na vertical (⋮) que abre um menu com as opções.
export default function MoreMenu({
  items,
  label = "Mais opções",
  size = 30,
}: {
  items: MenuItem[];
  label?: string;
  size?: number;
}) {
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const open = pos !== null;

  useEffect(() => {
    if (!open) return;
    const close = () => setPos(null);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (open) return setPos(null);
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const menuHeight = items.length * 44 + 12;
    // abre para cima se não couber embaixo (a barra de navegação ocupa o rodapé)
    const up = rect.bottom + menuHeight > window.innerHeight - 90;
    setPos({
      top: up ? Math.max(rect.top - menuHeight - 4, 8) : rect.bottom + 4,
      right: Math.max(window.innerWidth - rect.right, 8),
    });
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          border: "none",
          background: open ? S.surface2 : "transparent",
          color: S.muted,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          padding: 0,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <circle cx="8" cy="3" r="1.6" />
          <circle cx="8" cy="8" r="1.6" />
          <circle cx="8" cy="13" r="1.6" />
        </svg>
      </button>
      {pos && (
        <>
          <div
            onClick={(e) => {
              e.stopPropagation();
              setPos(null);
            }}
            style={{ position: "fixed", inset: 0, zIndex: 199 }}
          />
          <div
            role="menu"
            style={{
              position: "fixed",
              top: pos.top,
              right: pos.right,
              zIndex: 200,
              minWidth: 168,
              background: S.surface,
              border: `1px solid ${S.border}`,
              borderRadius: 14,
              padding: 6,
              boxShadow: "0 12px 32px rgba(0,0,0,0.45)",
            }}
          >
            {items.map((item) => (
              <button
                key={item.label}
                role="menuitem"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPos(null);
                  item.onClick();
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "11px 12px",
                  border: "none",
                  borderRadius: 10,
                  background: "transparent",
                  color: item.danger ? "#ef4444" : S.text,
                  fontSize: 13,
                  fontWeight: 600,
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                {item.icon && <span style={{ fontSize: 14 }}>{item.icon}</span>}
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}
