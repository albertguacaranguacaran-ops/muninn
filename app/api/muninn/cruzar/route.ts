import { NextResponse } from "next/server";
import { leerHoja, escribirHoja, agregarFila } from "@/lib/sheets";

// POST /api/muninn/cruzar
// Corre el cruce automático entre FormulariosSolicitudes y MaestroSAP
export async function POST() {
  try {
    const [solicitudes, maestroSAP, maestroActual] = await Promise.all([
      leerHoja("FormulariosSolicitudes!A2:K500"),
      leerHoja("MaestroSAP!A2:E10000"),
      leerHoja("MaestroProductos!A2:J500"),
    ]);

    const fechaHoy = new Date().toLocaleString("es-VE");
    const resultados: any[] = [];
    const codsSAPActuales = new Set(maestroActual.map(r => r[0]));

    for (const sol of solicitudes) {
      // sol[0]=token, sol[1]=compradora, sol[2]=linea, sol[3]=lbs (Item Codes Proveedor), sol[4]=fechaEnvio, sol[6]=estado
      if (sol[6] !== "RESPONDIDO") continue; // Solo procesar respondidos

      const itemCodes = String(sol[3] || "").split(",").map(s => s.trim()).filter(Boolean);

      for (const itemCode of itemCodes) {
        // Buscar en MaestroSAP por columna D (CodProveedor) y E (CodUnico)
        const matches = maestroSAP.filter(r =>
          (r[3] || "").trim().toUpperCase() === itemCode.toUpperCase() ||
          (r[4] || "").trim().toUpperCase() === itemCode.toUpperCase() ||
          (r[0] || "").trim().toUpperCase() === itemCode.toUpperCase()
        );

        if (matches.length === 0) {
          resultados.push({ itemCode, estado: "no_encontrado", solicitud: sol });
        } else if (matches.length === 1) {
          const m = matches[0];
          const codSAP = m[0];

          // Si ya está en MaestroProductos, saltar
          if (codsSAPActuales.has(codSAP)) {
            resultados.push({ itemCode, estado: "ya_cruzado", codSAP, solicitud: sol });
            continue;
          }

          // Agregar a MaestroProductos
          await agregarFila("MaestroProductos", [
            codSAP,           // A: Código SAP
            m[1],             // B: Descripción
            m[2],             // C: Línea
            itemCode,         // D: Item Code Proveedor usado
            sol[1] || "",     // E: Compradora
            sol[0] || "",     // F: Token BIFROST
            fechaHoy,         // G: Fecha Cruce
            "",               // H: Drive Folder
            "PENDIENTE",      // I: Estado Fotos (SINDRI)
            "PENDIENTE",      // J: Estado Garantía (HEIMDALL)
          ]);
          codsSAPActuales.add(codSAP);
          resultados.push({ itemCode, estado: "cruzado", codSAP, descripcion: m[1], linea: m[2] });
        } else {
          // Múltiples matches - necesita decisión del coordinador
          resultados.push({
            itemCode,
            estado: "ambiguo",
            opciones: matches.map(m => ({ codSAP: m[0], descripcion: m[1], linea: m[2] })),
            solicitud: sol,
          });
        }
      }
    }

    const resumen = {
      cruzados: resultados.filter(r => r.estado === "cruzado").length,
      ya_cruzados: resultados.filter(r => r.estado === "ya_cruzado").length,
      ambiguos: resultados.filter(r => r.estado === "ambiguo").length,
      no_encontrados: resultados.filter(r => r.estado === "no_encontrado").length,
    };

    return NextResponse.json({ ok: true, resumen, resultados });
  } catch (e: any) {
    console.error("[cruzar]", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
