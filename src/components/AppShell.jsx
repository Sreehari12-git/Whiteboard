import { NavLink, Outlet } from "react-router-dom";

const linkBaseStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 12px",
  borderRadius: 10,
  color: "#c7cbe0",
  textDecoration: "none",
  fontWeight: 600,
  fontSize: 13,
};

function ShellNavLink({ to, label, hint }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        ...linkBaseStyle,
        background: isActive ? "rgba(255,255,255,0.10)" : "transparent",
        color: isActive ? "#ffffff" : "#c7cbe0",
        border: isActive ? "1px solid rgba(255,255,255,0.16)" : "1px solid transparent",
      })}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {label}
        </div>
        {hint ? (
          <div style={{ marginTop: 2, fontSize: 11, fontWeight: 500, color: "rgba(199,203,224,0.78)" }}>
            {hint}
          </div>
        ) : null}
      </div>
    </NavLink>
  );
}

export default function AppShell() {
  return (
    <div className="app-shell">
      <aside className="app-shell__sidebar">
        <div style={{ padding: "18px 16px 10px" }}>
          <div style={{ fontWeight: 800, letterSpacing: "-0.3px", fontSize: 15, color: "#fff" }}>
            Whiteboard
          </div>
          <div style={{ marginTop: 4, fontSize: 12, color: "rgba(199,203,224,0.78)" }}>
            Testing dashboards
          </div>
        </div>

        <div style={{ padding: "10px 10px", display: "grid", gap: 8 }}>
          <ShellNavLink to="/api-testing" label="API Testing" hint="Nodes" />
          <ShellNavLink to="/e2e-testing" label="E2E Testing" hint="API flow" />
        </div>

        <div style={{ marginTop: "auto", padding: "14px 14px 18px" }}>
          <NavLink
            to="/whiteboards"
            style={{
              display: "block",
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.06)",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 650,
              fontSize: 12,
            }}
          >
            Open whiteboards →
          </NavLink>
        </div>
      </aside>

      <main className="app-shell__main">
        <Outlet />
      </main>
    </div>
  );
}

