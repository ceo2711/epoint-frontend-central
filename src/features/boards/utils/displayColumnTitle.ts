const COLUMN_TITLE_KEYS: Record<string, string> = {
  "client to do": "portalBoard.columns.clientToDo",
  "tareas del cliente": "portalBoard.columns.clientToDo",
  credenciales: "portalBoard.columns.credentials",
  credentials: "portalBoard.columns.credentials",
  "ideas a realizar": "portalBoard.columns.ideas",
  "ideas to complete": "portalBoard.columns.ideas",
  experian: "portalBoard.columns.experian",
  equifax: "portalBoard.columns.equifax",
  transunion: "portalBoard.columns.transunion",
  "personal funding sequence": "portalBoard.columns.personalFunding",
  "secuencia de funding personal": "portalBoard.columns.personalFunding",
  "business funding sequence": "portalBoard.columns.businessFunding",
  "secuencia de funding business": "portalBoard.columns.businessFunding",
  completed: "portalBoard.columns.completed",
  completado: "portalBoard.columns.completed",
};

export function displayColumnTitle(title: string, t: (key: string) => string): string {
  const key = COLUMN_TITLE_KEYS[title.trim().toLowerCase()];
  return key ? t(key) : title;
}
