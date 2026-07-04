import { NextResponse } from "next/server";
import { leerHoja } from "@/lib/sheets";

export async function GET() {
  try {
    const filas = await leerHoja("Usuarios!A2:E200");
    const nombres = filas.map(f => f[1]).filter(Boolean);
    return NextResponse.json({ nombres });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { nombre, clave } = await req.json();
  try {
    const filas = await leerHoja("Usuarios!A2:E200");
    const fila = filas.find(f =>
      (f[1] || "").trim().toUpperCase() === (nombre || "").trim().toUpperCase() &&
      (f[0] || "").trim() === (clave || "").trim()
    );
    if (!fila) return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
    return NextResponse.json({ nombre: fila[1], rol: fila[3] || "usuario" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
