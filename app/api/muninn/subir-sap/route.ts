import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { limpiarYEscribirHoja } from "@/lib/sheets";

// POST /api/muninn/subir-sap
// Recibe un archivo .xlsx con columnas: CodSAP | Descripcion | Linea | CodProveedor | CodUnico
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("archivo") as File | null;
    if (!file) return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buffer, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

    // Saltar header (fila 0) y mapear datos
    const datos = rows.slice(1).filter(r => r[0] || r[1]).map(r => [
      String(r[0] || "").trim(),  // Col A: Código SAP
      String(r[1] || "").trim(),  // Col B: Descripción
      String(r[2] || "").trim(),  // Col C: Línea
      String(r[3] || "").trim(),  // Col D: Código del Proveedor
      String(r[4] || "").trim(),  // Col E: Código Único del Proveedor
    ]);

    // Reemplazar toda la hoja MaestroSAP con los nuevos datos
    await limpiarYEscribirHoja("MaestroSAP", datos);

    return NextResponse.json({
      ok: true,
      registros: datos.length,
      mensaje: `✅ MaestroSAP actualizado con ${datos.length} registros del Excel SAP`,
      fecha: new Date().toLocaleString("es-VE"),
    });
  } catch (e: any) {
    console.error("[subir-sap]", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
