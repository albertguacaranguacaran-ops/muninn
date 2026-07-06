import { google } from "googleapis";

const SHEET_ID = process.env.PRISMA_SHEET_ID!;

function getAuth() {
  const key = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: key,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

export async function leerHoja(rango: string): Promise<string[][]> {
  const sheets = google.sheets({ version: "v4", auth: getAuth() });
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: rango });
  return (res.data.values as string[][]) || [];
}

export async function escribirHoja(rango: string, valores: any[][]): Promise<void> {
  const sheets = google.sheets({ version: "v4", auth: getAuth() });
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: rango,
    valueInputOption: "RAW",
    requestBody: { values: valores },
  });
}

export async function agregarFila(hoja: string, fila: any[]): Promise<void> {
  const sheets = google.sheets({ version: "v4", auth: getAuth() });
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${hoja}!A1`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [fila] },
  });
}

export async function limpiarYEscribirHoja(hoja: string, filas: any[][]): Promise<void> {
  const sheets = google.sheets({ version: "v4", auth: getAuth() });
  await sheets.spreadsheets.values.clear({ spreadsheetId: SHEET_ID, range: `${hoja}!A2:Z10000` });
  if (filas.length === 0) return;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${hoja}!A2`,
    valueInputOption: "RAW",
    requestBody: { values: filas },
  });
}
