import { GITHUB_URL } from "../constants";

export function Nav() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        backdropFilter: "blur(12px)",
        background: "rgba(18,18,18,0.72)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div
        className="container"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}
      >
        <a href="#top" style={{ fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-bright)", textDecoration: "none" }}>
          HappyShadows
        </a>
        <nav className="nav-links">
          <a className="nav-link" href="#how">How it works</a>
          <a className="nav-link" href="#editor">Editor</a>
          <a className="nav-link" href="#download">Download</a>
          <a className="nav-link" href="#docs">Docs</a>
          <a className="btn" href={GITHUB_URL} target="_blank" rel="noreferrer">GitHub</a>
        </nav>
      </div>
    </header>
  );
}
