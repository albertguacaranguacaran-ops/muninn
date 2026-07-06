import { NextResponse } from "next/server";
import { leerHoja } from "@/lib/sheets";

// GET /api/muninn/metricas
// Métricas de compradoras para el dashboard del Coordinador
export async function GET() {
  try {
    const [solicitudes, maestro] = await Promise.all([
      leerHoja("FormulariosSolicitudes!A2:K500"),
      leerHoja("MaestroProductos!A2:J500"),
    ]);

    // Agrupar FormulariosSolicitudes por compradora
    const mapCompradoras: Record<string, {
      total: number; respondidos: number; pendientes: number;
      cruzados: number; sinCruzar: number;
    }> = {};

    for (const sol of solicitudes) {
      const compradora = (sol[1] || "Sin asignar").trim();
      const estado = (sol[6] || "").trim().toUpperCase();
      if (!mapCompradoras[compradora]) {
        mapCompradoras[compradora] = { total:0, respondidos:0, pendientes:0, cruzados:0, sinCruzar:0 };
      }
      mapCompradoras[compradora].total++;
      if (estado === "RESPONDIDO" || estado === "COMPLETO") mapCompradoras[compradora].respondidos++;
      else mapCompradoras[compradora].pendientes++;
    }

    // Cruzar con MaestroProductos para saber cuántos ya tienen LB
    for (const prod of maestro) {
      const compradora = (prod[4] || "").trim();
      if (mapCompradoras[compradora]) {
        mapCompradoras[compradora].cruzados++;
      }
    }

    // Calcular sinCruzar: respondidos que aún no tienen LB en Maestro
    for (const comp of Object.keys(mapCompradoras)) {
      const m = mapCompradoras[comp];
      m.sinCruzar = Math.max(0, m.respondidos - m.cruzados);
    }

    const compradoras = Object.entries(mapCompradoras).map(([nombre, m]) => ({
      nombre, ...m,
      tasaRespuesta: m.total > 0 ? Math.round((m.respondidos / m.total) * 100) : 0,
    })).sort((a, b) => b.total - a.total);

    // Resumen del ecosistema (lo que falta)
    const ecosistema = {
      bifrost: {
        total: solicitudes.length,
        respondidos: solicitudes.filter(s => ["RESPONDIDO","COMPLETO"].includes((s[6]||"").trim().toUpperCase())).length,
        pendientes: solicitudes.filter(s => !["RESPONDIDO","COMPLETO"].includes((s[6]||"").trim().toUpperCase())).length,
      },
      muninn: {
        cruzados: maestro.length,
        sinCruzar: solicitudes.filter(s => ["RESPONDIDO","COMPLETO"].includes((s[6]||"").trim().toUpperCase())).length - maestro.length,
      },
      sindri: {
        fotosPendientes: maestro.filter(p => (p[8]||"PENDIENTE") === "PENDIENTE").length,
        fotosListas: maestro.filter(p => p[8] === "LISTO").length,
      },
      heimdall: {
        garantiaPendiente: maestro.filter(p => (p[9]||"PENDIENTE") === "PENDIENTE").length,
        garantiaRecibida: maestro.filter(p => p[9] === "RECIBIDA").length,
      },
    };

    return NextResponse.json({ ok: true, compradoras, ecosistema });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
