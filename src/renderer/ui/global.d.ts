export {};

declare global {
  interface Window {
    clipvault: {
      getHistory: (query?: string) => Promise<any[]>;
      setClipboard: (payload: { kind: "text" | "image"; text?: string; imageDataUrl?: string }) => Promise<boolean>;
      deleteClip: (id: string) => Promise<boolean>;
      clearAll: () => Promise<boolean>;
      togglePin: (id: string) => Promise<boolean>;
      setTags: (id: string, tags: string[]) => Promise<boolean>;

      hidePopup: () => Promise<boolean>;

      getSettings: () => Promise<{ popupShortcut: string }>;
      setPopupShortcut: (accelerator: string) => Promise<{ ok: boolean; reason?: string }>;

      getTheme: () => Promise<any>;
      setTheme: (theme: any) => Promise<boolean>;

      onHistoryUpdated: (cb: (items: any[]) => void) => () => void;
      onPopupOpened: (cb: () => void) => () => void;
    };
  }
}