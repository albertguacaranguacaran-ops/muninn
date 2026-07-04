import { NextResponse } from "next/server";
import { leerHoja } from "@/lib/sheets";

// GET /api/muninn/maestro - Lee MaestroProductos para dashboard
export async function GET() {
  try {
    const [maestro, sapCount] = await Promise.all([
      leerHoja("MaestroProductos!A2:J500"),
      leerHoja("MaestroSAP!A2:A10000"),
    ]);

    const productos = maestro.map(r => ({
      codSAP: r[0] || "",
      descripcion: r[1] || "",
      linea: r[2] || "",
      itemCode: r[3] || "",
      compradora: r[4] || "",
      token: r[5] || "",
      fechaCruce: r[6] || "",
      driveFolder: r[7] || "",
      estadoFotos: r[8] || "PENDIENTE",
      estadoGarantia: r[9] || "PENDIENTE",
    }));

    return NextResponse.json({
      ok: true,
      productos,
      totalSAP: sapCount.length,
      resumen: {
        total: productos.length,
        fotosPendientes: productos.filter(p => p.estadoFotos === "PENDIENTE").length,
        garantiaPendiente: productos.filter(p => p.estadoGarantia === "PENDIENTE").length,
        completos: productos.filter(p => p.estadoFotos === "LISTO" && p.estadoGarantia === "RECIBIDA").length,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
