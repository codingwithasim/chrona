import { todayKey } from "@/lib/day-key";

/**
 * Everything Chrona remembers lives in this browser's storage. A backup is
 * just those entries in one small file you keep yourself.
 */

const KEYS = /^(chrona-|alarms-storage$|world-clock-storage$)/;

type Backup = {
  app: "chrona";
  version: 1;
  savedAt: string;
  data: Record<string, string>;
};

/** Save every Chrona entry to a .json file. */
export function downloadBackup() {
  const data: Record<string, string> = {};

  for (let index = 0; index < localStorage.length; index++) {
    const key = localStorage.key(index);

    if (key && KEYS.test(key)) {
      data[key] = localStorage.getItem(key) ?? "";
    }
  }

  const backup: Backup = { app: "chrona", version: 1, savedAt: new Date().toISOString(), data };
  const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");

  link.href = url;
  link.download = `chrona-backup-${todayKey()}.json`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Put a backup file's entries back. Returns false if it isn't one. */
export async function restoreBackup(file: File) {
  let backup: Partial<Backup>;

  try {
    backup = JSON.parse(await file.text());
  } catch {
    return false;
  }

  if (backup.app !== "chrona" || !backup.data || typeof backup.data !== "object") {
    return false;
  }

  const entries = Object.entries(backup.data).filter(
    ([key, value]) => KEYS.test(key) && typeof value === "string"
  );

  if (entries.length === 0) {
    return false;
  }

  for (const [key, value] of entries) {
    localStorage.setItem(key, value);
  }

  return true;
}
