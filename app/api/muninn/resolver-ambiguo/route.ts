import { NextResponse } from "next/server";
import { agregarFila, leerHoja } from "@/lib/sheets";

// POST /api/muninn/resolver-ambiguo
// Coordinador confirma qué código SAP aplica para un Item Code con múltiples matches
export async function POST(req: Request) {
  try {
    const { itemCode, codSAPSeleccionado, descripcion, linea, compradora, token } = await req.json();

    const fechaHoy = new Date().toLocaleString("es-VE");

    // Verificar si ya existe en MaestroProductos
    const maestro = await leerHoja("MaestroProductos!A2:J500");
    const yaExiste = maestro.some(r => r[0] === codSAPSeleccionado);
    if (yaExiste) {
      return NextResponse.json({ ok: true, mensaje: `${codSAPSeleccionado} ya estaba en MaestroProductos` });
    }

    await agregarFila("MaestroProductos", [
      codSAPSeleccionado,  // A: Código SAP
      descripcion || "",   // B: Descripción
      linea || "",         // C: Línea
      itemCode,            // D: Item Code Proveedor
      compradora || "",    // E: Compradora
      token || "",         // F: Token BIFROST
      fechaHoy,            // G: Fecha Cruce
      "",                  // H: Drive Folder
      "PENDIENTE",         // I: Estado Fotos (SINDRI)
      "PENDIENTE",         // J: Estado Garantía (HEIMDALL)
    ]);

    return NextResponse.json({
      ok: true,
      mensaje: `✅ ${codSAPSeleccionado} agregado a MaestroProductos`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
