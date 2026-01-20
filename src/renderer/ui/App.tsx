import React, { useEffect, useMemo, useRef, useState } from "react";

type ClipItem = {
  id: string;
  kind: "text" | "image";
  text?: string;
  imageDataUrl?: string;
  createdAt: number;
  pinned: 0 | 1;
  tags: string[];
};

type Theme = {
  bg: string;
  panel: string;
  border: string;
  text: string;
  muted: string;
  danger: string;
  accent: string;
};

const DEFAULT_THEME: Theme = {
  bg: "#0f1115",
  panel: "#151922",
  border: "rgba(255, 255, 255, 0.12)",
  text: "rgba(235, 242, 251, 0.95)",
  muted: "rgba(160, 175, 195, 0.9)",
  danger: "#ff5a5a",
  accent: "#5aa0ff"
};

export default function App() {
  const [items, setItems] = useState<ClipItem[]>([]);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shortcutDraft, setShortcutDraft] = useState("CommandOrControl+Shift+V");
  const [shortcutMsg, setShortcutMsg] = useState("");

  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);

  const [toast, setToast] = useState("");
  const toastTimer = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 1100);
  }

  async function refresh(q: string) {
    const h = await window.clipvault.getHistory(q);
    setItems(h as any);
    setSelectedIndex(0);
  }

  useEffect(() => {
    window.clipvault.getSettings().then((s) => setShortcutDraft(s.popupShortcut));
    window.clipvault.getTheme().then((t) => setTheme({ ...DEFAULT_THEME, ...t }));
    refresh("").catch(() => undefined);

    const offUpdated = window.clipvault.onHistoryUpdated((h) => setItems(h as any));
    const offPopup = window.clipvault.onPopupOpened(() => {
      setQuery("");
      setSelectedIndex(0);
      setSettingsOpen(false);
      setShortcutMsg("");
      setTimeout(() => inputRef.current?.focus(), 40);
    });

    const onKeyDown = async (e: KeyboardEvent) => {
      if (settingsOpen) {
        if (e.key === "Escape") setSettingsOpen(false);
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        await window.clipvault.hidePopup();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, Math.max(0, visible.length - 1)));
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        const it = visible[selectedIndex];
        if (it) await copyItem(it);
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      offUpdated();
      offPopup();
      window.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsOpen, selectedIndex, items]);

  useEffect(() => {
    const t = window.setTimeout(() => refresh(query).catch(() => undefined), 120);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const visible = useMemo(() => items, [items]);

  const rootStyle: React.CSSProperties = {
    ["--bg" as any]: theme.bg,
    ["--panel" as any]: theme.panel,
    ["--border" as any]: theme.border,
    ["--text" as any]: theme.text,
    ["--muted" as any]: theme.muted,
    ["--accent" as any]: theme.accent,
    ["--danger" as any]: theme.danger
  };

  async function copyItem(item: ClipItem) {
    if (item.kind === "text") {
      await window.clipvault.setClipboard({ kind: "text", text: item.text ?? "" });
    } else {
      await window.clipvault.setClipboard({ kind: "image", imageDataUrl: item.imageDataUrl ?? "" });
    }
    showToast("Copied");
    await window.clipvault.hidePopup();
  }

  async function onDelete(item: ClipItem) {
    await window.clipvault.deleteClip(item.id);
    showToast("Deleted");
  }

  async function onClearAll() {
    await window.clipvault.clearAll();
    showToast("Cleared");
  }

  async function onTogglePin(item: ClipItem) {
    await window.clipvault.togglePin(item.id);
    showToast(item.pinned ? "Unpinned" : "Pinned");
  }

  async function onEditTags(item: ClipItem) {
    const input = prompt("Tags (comma-separated)", (item.tags ?? []).join(", "));
    if (input === null) return;
    const tags = input
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    await window.clipvault.setTags(item.id, tags);
    showToast("Tags saved");
  }

  async function saveShortcut() {
    setShortcutMsg("Saving…");
    const res = await window.clipvault.setPopupShortcut(shortcutDraft);
    if (res.ok) {
      setShortcutMsg("Saved");
      showToast("Shortcut updated");
    } else {
      setShortcutMsg(res.reason || "Failed");
    }
  }

  async function saveTheme(next: Theme) {
    setTheme(next);
    await window.clipvault.setTheme(next);
    showToast("Theme saved");
  }

  return (
    <div className="cv-root" style={rootStyle}>
      <div className="cv-header">
        <div>
          <div className="cv-title">ClipVault</div>
          <div className="cv-subtitle">
            Search <span className="cv-kbd">⌘K</span> • Open <span className="cv-kbd">{shortcutDraft}</span>
          </div>
        </div>

        <div className="cv-actions cv-nodrag">
          <button className="cv-btn cv-nodrag" onClick={() => setSettingsOpen((v) => !v)}>
            Settings
          </button>
          <button className="cv-btn danger cv-nodrag" onClick={onClearAll}>
            Clear All
          </button>
        </div>
      </div>

      <div className="cv-search cv-nodrag">
        <input
          ref={inputRef}
          className="cv-input cv-nodrag"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search text or tags… (type 'image' to filter images)"
          spellCheck={false}
        />
      </div>

      {settingsOpen && (
        <div className="cv-panel cv-nodrag">
          <div className="cv-panel-title">Settings</div>

          <div className="cv-row">
            <div className="cv-label">Shortcut</div>
            <input
              className="cv-input cv-nodrag"
              value={shortcutDraft}
              onChange={(e) => setShortcutDraft(e.target.value)}
              placeholder="CommandOrControl+Shift+V"
            />
          </div>

          <div className="cv-row">
            <button className="cv-btn cv-nodrag" onClick={saveShortcut}>
              Save Shortcut
            </button>
            <div className="cv-muted">{shortcutMsg}</div>
          </div>

          <div className="cv-row" style={{ marginTop: 12 }}>
            <div className="cv-label">Theme</div>
            <div className="cv-muted">Pick colors (saved)</div>
          </div>

          <div className="cv-row">
            <div className="cv-label">Accent</div>
            <input
              className="cv-nodrag"
              type="color"
              value={theme.accent}
              onChange={(e) => saveTheme({ ...theme, accent: e.target.value })}
            />
          </div>

          <div className="cv-row">
            <div className="cv-label">Danger</div>
            <input
              className="cv-nodrag"
              type="color"
              value={theme.danger}
              onChange={(e) => saveTheme({ ...theme, danger: e.target.value })}
            />
          </div>

          <div className="cv-row">
            <div className="cv-label">Background</div>
            <input
              className="cv-nodrag"
              type="color"
              value={theme.bg}
              onChange={(e) => saveTheme({ ...theme, bg: e.target.value })}
            />
          </div>

          <div className="cv-row">
            <button className="cv-btn cv-nodrag" onClick={() => saveTheme(DEFAULT_THEME)}>
              Reset Theme
            </button>
          </div>
        </div>
      )}

      <div className="cv-list cv-nodrag">
        {visible.length === 0 ? (
          <div className="cv-empty">
            No clipboard items yet. Copy text or an image, then open the popup.
          </div>
        ) : (
          visible.map((item, idx) => (
            <div
              key={item.id}
              className={"cv-item cv-nodrag " + (idx === selectedIndex ? "selected" : "")}
              onMouseEnter={() => setSelectedIndex(idx)}
            >
{item.kind === "image" ? (
  item.imageDataUrl?.startsWith("data:image/") ? (
    <img className="cv-img cv-nodrag" src={item.imageDataUrl} alt="clipboard" />
  ) : (
    <div className="cv-item-text">(Image item is invalid. Please copy the image again.)</div>
  )
) : (
  <div className="cv-item-text">{item.text ?? ""}</div>
)}

              <div className="cv-item-meta">
                <div className="cv-meta-left">
                  {item.pinned ? <span className="cv-badge">Pinned</span> : null}
                  {(item.tags ?? []).map((t) => (
                    <span key={t} className="cv-tag">{t}</span>
                  ))}
                </div>

                <div className="cv-meta-right cv-nodrag">
                  <button className="cv-icon cv-nodrag" onClick={() => copyItem(item)}>Copy</button>
                  <button className="cv-icon cv-nodrag" onClick={() => onTogglePin(item)}>
                    {item.pinned ? "Unpin" : "Pin"}
                  </button>
                  <button className="cv-icon cv-nodrag" onClick={() => onEditTags(item)}>Tags</button>
                  <button className="cv-icon danger cv-nodrag" onClick={() => onDelete(item)}>Delete</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="cv-footer cv-nodrag">
        <span>↑/↓ navigate • Enter copy • Esc close</span>
        <span>Drag anywhere on glass to move</span>
      </div>

      {toast && <div className="cv-toast">{toast}</div>}
    </div>
  );
}