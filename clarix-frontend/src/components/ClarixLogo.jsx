export default function ClarixLogo({ dark = true, size = "md" }) {
  const s = { sm: 0.55, md: 1, lg: 1.5 }[size];
  const iconSize = 44 * s;
  const fontSize = 30 * s;
  const gap = 13 * s;
  const fg = dark ? "#FFFFFF" : "#1C1C1E";

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap }}>
      <svg width={iconSize} height={iconSize} viewBox="0 0 44 44" fill="none">
        <rect width="44" height="44" rx="11" fill={dark ? "#2A2A2A" : "#1C1C1E"} />
        <path d="M22 8 L24.2 19 L22 21 L19.8 19 Z" fill="white" fillOpacity="0.9" />
        <path d="M22 36 L24.2 25 L22 23 L19.8 25 Z" fill="white" fillOpacity="0.9" />
        <path d="M8 22 L19 19.8 L21 22 L19 24.2 Z" fill="white" fillOpacity="0.9" />
        <path d="M36 22 L25 19.8 L23 22 L25 24.2 Z" fill="white" fillOpacity="0.9" />
        <circle cx="22" cy="22" r="2.2" fill="white" fillOpacity="0.9" />
      </svg>
      <span style={{
        fontFamily: "'DM Serif Display', Georgia, serif",
        fontSize,
        fontWeight: 400,
        color: fg,
        letterSpacing: "-0.3px",
        lineHeight: 1,
        userSelect: "none",
      }}>
        Clarix
      </span>
    </div>
  );
}