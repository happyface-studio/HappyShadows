import { GITHUB_URL } from "../constants";

export function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--border)", padding: "40px 0" }}>
      <div
        className="container"
        style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", alignItems: "center", fontSize: 14, color: "var(--text-dim)" }}
      >
        <span>Made by HappyFace Studios · MIT License</span>
        <a className="nav-link" href={GITHUB_URL} target="_blank" rel="noreferrer">github.com/happyface-studio/HappyShadows</a>
      </div>
    </footer>
  );
}
