import {
  app,
  BrowserWindow,
  clipboard,
  globalShortcut,
  ipcMain,
  nativeImage,
  screen,
  Tray,
  Menu,
  dialog
} from "electron";
import * as path from "node:path";

// better-sqlite3 (CommonJS)
const Database = require("better-sqlite3") as typeof import("better-sqlite3");

type ClipItem = {
  id: string;
  kind: "text" | "image";
  text?: string;
  imageDataUrl?: string;
  createdAt: number;
  pinned: 0 | 1;
  tags: string[];
};

type Settings = { popupShortcut: string };

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

let win: BrowserWindow | null = null;
let tray: Tray | null = null;

let db!: import("better-sqlite3").Database;

// ---------------- Single instance lock (MUST be near top) ----------------
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}
// Do NOT call showPopupNearCursor here (functions not defined yet).
app.on("second-instance", () => {
  // If user launches again, just show existing popup (no second poller)
  if (win) {
    showPopupNearCursor();
  }
});

// ---------------- Paths / resources ----------------
function userDataPath(...p: string[]) {
  return path.join(app.getPath("userData"), ...p);
}

function getResourcePath(...p: string[]) {
  // Packaged resources live under process.resourcesPath
  return app.isPackaged
    ? path.join(process.resourcesPath, ...p)
    : path.join(app.getAppPath(), ...p);
}

// ---------------- DB ----------------
function dbInit() {
  const dbFile = userDataPath("clipvault.sqlite");
  db = new Database(dbFile);

  db.exec(`
    CREATE TABLE IF NOT EXISTS clips (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      text TEXT,
      imageDataUrl TEXT,
      createdAt INTEGER NOT NULL,
      pinned INTEGER NOT NULL DEFAULT 0,
      tagsJson TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // default shortcut
  if (!db.prepare("SELECT 1 FROM settings WHERE key = ?").get("popupShortcut")) {
    db.prepare("INSERT INTO settings(key, value) VALUES(?, ?)").run("popupShortcut", "CommandOrControl+Shift+V");
  }

  // default theme
  if (!db.prepare("SELECT 1 FROM settings WHERE key = ?").get("theme")) {
    db.prepare("INSERT INTO settings(key, value) VALUES(?, ?)").run("theme", JSON.stringify(DEFAULT_THEME));
  }
}

function nowId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function safeJson<T>(s: string, fallback: T): T {
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

function rowToClip(r: any): ClipItem {
  return {
    id: r.id,
    kind: r.kind,
    text: r.text ?? undefined,
    imageDataUrl: r.imageDataUrl ?? undefined,
    createdAt: r.createdAt,
    pinned: r.pinned,
    tags: safeJson(r.tagsJson, [])
  };
}

function insertClip(item: { kind: "text"; text: string } | { kind: "image"; imageDataUrl: string }) {
  const id = nowId();
  const createdAt = Date.now();

  if (item.kind === "text") {
    const text = (item.text ?? "").trim();
    if (!text) return;

    // de-dup text
    const existing = db
      .prepare("SELECT id FROM clips WHERE kind='text' AND text=?")
      .get(text) as { id: string } | undefined;
    if (existing?.id) db.prepare("DELETE FROM clips WHERE id=?").run(existing.id);

    db.prepare(
      "INSERT INTO clips(id, kind, text, imageDataUrl, createdAt, pinned, tagsJson) VALUES(?, 'text', ?, NULL, ?, 0, '[]')"
    ).run(id, text, createdAt);
    return;
  }

  // image guards
  const dataUrl = item.imageDataUrl ?? "";
  if (!dataUrl.startsWith("data:image/png;base64,")) return;
  if (dataUrl.length < 3000) return; // too small -> likely invalid

  // de-dup image by prefix+length
  const sig = dataUrl.slice(0, 120) + ":" + dataUrl.length;
  const recent = db
    .prepare("SELECT id, imageDataUrl FROM clips WHERE kind='image' ORDER BY createdAt DESC LIMIT 40")
    .all() as { id: string; imageDataUrl: string }[];

  for (const e of recent) {
    const esig = (e.imageDataUrl?.slice(0, 120) ?? "") + ":" + (e.imageDataUrl?.length ?? 0);
    if (esig === sig) {
      db.prepare("DELETE FROM clips WHERE id=?").run(e.id);
      break;
    }
  }

  db.prepare(
    "INSERT INTO clips(id, kind, text, imageDataUrl, createdAt, pinned, tagsJson) VALUES(?, 'image', NULL, ?, ?, 0, '[]')"
  ).run(id, dataUrl, createdAt);
}

function getHistory(query: string): ClipItem[] {
  const q = query.trim().toLowerCase();

  const rows = db
    .prepare("SELECT * FROM clips ORDER BY pinned DESC, createdAt DESC LIMIT 300")
    .all();

  const items = rows.map(rowToClip);

  if (!q) return items;

  return items.filter((it: ClipItem) => {
    const tags = (it.tags ?? []).join(",").toLowerCase();
    const text = (it.text ?? "").toLowerCase();
    return text.includes(q) || tags.includes(q) || (it.kind === "image" && q === "image");
  });
}

function getSettings(): Settings {
  const s = db.prepare("SELECT value FROM settings WHERE key=?").get("popupShortcut") as { value: string } | undefined;
  return { popupShortcut: s?.value ?? "CommandOrControl+Shift+V" };
}

function setSetting(key: string, value: string) {
  db.prepare("INSERT INTO settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value")
    .run(key, value);
}

function getTheme(): Theme {
  const r = db.prepare("SELECT value FROM settings WHERE key=?").get("theme") as { value: string } | undefined;
  const parsed = r?.value ? safeJson<Theme>(r.value, DEFAULT_THEME) : DEFAULT_THEME;
  return { ...DEFAULT_THEME, ...parsed };
}

function setTheme(theme: Theme) {
  setSetting("theme", JSON.stringify({ ...DEFAULT_THEME, ...theme }));
}

// ---------------- Window / Tray ----------------
function createWindow() {
  win = new BrowserWindow({
    width: 560,
    height: 620,
    show: !app.isPackaged,
    frame: false,
    transparent: false,
    backgroundColor: "#0f1115",
    resizable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    fullscreenable: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const devUrl = "http://localhost:5173";
  const prodHtml = path.join(app.getAppPath(), "dist/renderer/index.html");

  if (!app.isPackaged) {
    win.loadURL(devUrl);
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(prodHtml);
  }

  win.on("blur", () => {
    if (!app.isPackaged) return;
    win?.hide();
  });
}

function showPopupNearCursor() {
  if (!win) return;

  const cursor = screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(cursor);
  const { x, y, width, height } = display.workArea;

  const w = 560;
  const h = 620;

  const px = Math.min(Math.max(cursor.x - Math.floor(w / 2), x), x + width - w);
  const py = Math.min(Math.max(cursor.y - Math.floor(h / 3), y), y + height - h);

  win.setBounds({ x: px, y: py, width: w, height: h }, false);
  win.show();
  win.focus();
  win.webContents.send("popup-opened");
}

function createTray() {
  const trayIconPath = getResourcePath("trayTemplate.png");
  tray = new Tray(trayIconPath);

  tray.setToolTip("ClipVault");

  const menu = Menu.buildFromTemplate([
    { label: "Open ClipVault", click: () => showPopupNearCursor() },
    { type: "separator" },
    { label: `Version ${app.getVersion()}`, enabled: false },
    {
      label: "Check for Updates…",
      click: async () => {
        dialog.showMessageBox({
          type: "info",
          title: "Updates",
          message: "Auto-update is not configured yet.",
          detail: "Later you can enable publishing and autoUpdater here."
        });
      }
    },
    { type: "separator" },
    { label: "Quit", role: "quit" }
  ]);

  tray.setContextMenu(menu);
  tray.on("click", () => showPopupNearCursor());
}

// ---------------- Clipboard watch (FIXED) ----------------
// The important fix: only create a new item when the clipboard *fingerprint* changes.
// This prevents "text copy" falling through into stale image inserts.

let lastFingerprint = "";

function fingerprintClipboard() {
  const text = clipboard.readText().trim();

  // If there is text, prefer text fingerprint
  if (text) return `t:${text}`;

  const img = clipboard.readImage();
  if (!img.isEmpty()) {
    const png = img.toPNG();
    if (png.length < 2048) return ""; // ignore tiny/stale icons
    // Stable fingerprint based on size + head bytes
    const head = png.subarray(0, Math.min(64, png.length)).toString("hex");
    return `i:${head}:${png.length}`;
  }

  return "";
}

function pollClipboard() {
  setInterval(() => {
    const fp = fingerprintClipboard();
    if (!fp) return;
    if (fp === lastFingerprint) return;

    lastFingerprint = fp;

    // Insert based on fingerprint type
    if (fp.startsWith("t:")) {
      const text = fp.slice(2);
      insertClip({ kind: "text", text });
      win?.webContents.send("history-updated", getHistory(""));
      return;
    }

    // image
    const img = clipboard.readImage();
    if (!img.isEmpty()) {
      const png = img.toPNG();
      if (png.length < 2048) return;

      const dataUrl = `data:image/png;base64,${png.toString("base64")}`;
      insertClip({ kind: "image", imageDataUrl: dataUrl });
      win?.webContents.send("history-updated", getHistory(""));
    }
  }, 450);
}

// ---------------- Shortcuts ----------------
function registerShortcut(accel: string) {
  globalShortcut.unregisterAll();
  return globalShortcut.register(accel, () => showPopupNearCursor());
}

// ---------------- IPC ----------------
function setupIPC() {
  ipcMain.handle("get-history", async (_e, payload: { query: string }) => {
    return getHistory(payload?.query ?? "");
  });

  ipcMain.handle(
    "set-clipboard",
    async (_e, payload: { kind: "text" | "image"; text?: string; imageDataUrl?: string }) => {
      try {
        if (payload.kind === "text") {
          clipboard.writeText(payload.text ?? "");
          return true;
        }

        const d = payload.imageDataUrl ?? "";
        if (!d.startsWith("data:image/")) return false;

        const img = nativeImage.createFromDataURL(d);
        if (img.isEmpty()) return false;

        clipboard.writeImage(img);
        return true;
      } catch {
        return false;
      }
    }
  );

  ipcMain.handle("delete-clip", async (_e, id: string) => {
    db.prepare("DELETE FROM clips WHERE id=?").run(id);
    win?.webContents.send("history-updated", getHistory(""));
    return true;
  });

  ipcMain.handle("clear-all", async () => {
    db.prepare("DELETE FROM clips").run();
    win?.webContents.send("history-updated", getHistory(""));
    return true;
  });

  ipcMain.handle("toggle-pin", async (_e, id: string) => {
    const r = db.prepare("SELECT pinned FROM clips WHERE id=?").get(id) as { pinned: number } | undefined;
    const next = r?.pinned ? 0 : 1;
    db.prepare("UPDATE clips SET pinned=? WHERE id=?").run(next, id);
    win?.webContents.send("history-updated", getHistory(""));
    return true;
  });

  ipcMain.handle("set-tags", async (_e, payload: { id: string; tags: string[] }) => {
    const tags = Array.isArray(payload.tags) ? payload.tags : [];
    db.prepare("UPDATE clips SET tagsJson=? WHERE id=?").run(JSON.stringify(tags), payload.id);
    win?.webContents.send("history-updated", getHistory(""));
    return true;
  });

  ipcMain.handle("hide-popup", async () => {
    win?.hide();
    return true;
  });

  ipcMain.handle("get-settings", async () => getSettings());

  ipcMain.handle("set-popup-shortcut", async (_e, accelerator: string) => {
    const accel = (accelerator ?? "").trim();
    if (!accel) return { ok: false, reason: "Empty shortcut" };

    const ok = registerShortcut(accel);
    if (!ok) return { ok: false, reason: "Invalid or already in use" };

    setSetting("popupShortcut", accel);
    return { ok: true };
  });

  ipcMain.handle("get-theme", async () => getTheme());

  ipcMain.handle("set-theme", async (_e, theme: Theme) => {
    setTheme(theme);
    return true;
  });
}

// ---------------- App lifecycle ----------------
app.whenReady().then(() => {
  dbInit();
  createWindow();
  setupIPC();
  pollClipboard();

  const s = getSettings();
  registerShortcut(s.popupShortcut);

  if (process.platform === "darwin" && app.isPackaged) {
    app.dock.hide();
    createTray();
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});