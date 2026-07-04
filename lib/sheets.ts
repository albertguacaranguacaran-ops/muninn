import { google } from "googleapis";

const SHEET_ID = process.env.PRISMA_SHEET_ID!;

function getAuth() {
  const key = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  return new google.auth.JWT(
    process.env.GOOGLE_CLIENT_EMAIL,
    undefined,
    key,
    ["https://www.googleapis.com/auth/spreadsheets"]
  );
}

export async function leerHoja(rango: string): Promise<string[][]> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: rango });
  return (res.data.values as string[][]) || [];
}

export async function escribirHoja(rango: string, valores: any[][]): Promise<void> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: rango,
    valueInputOption: "RAW",
    requestBody: { values: valores },
  });
}

export async function agregarFila(hoja: string, fila: any[]): Promise<void> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${hoja}!A1`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [fila] },
  });
}

export async function limpiarYEscribirHoja(hoja: string, filas: any[][]): Promise<void> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  // Limpiar primero
  await sheets.spreadsheets.values.clear({ spreadsheetId: SHEET_ID, range: `${hoja}!A2:Z10000` });
  if (filas.length === 0) return;
  // Escribir nuevos datos
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${hoja}!A2`,
    valueInputOption: "RAW",
    requestBody: { values: filas },
  });
}
