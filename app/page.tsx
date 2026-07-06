"use client";
import { useState, useEffect } from "react";

interface Usuario { nombre: string; rol: string; }
interface Producto {
  codSAP: string; descripcion: string; linea: string; itemCode: string;
  compradora: string; fechaCruce: string; estadoFotos: string; estadoGarantia: string;
}
interface ResultadoCruce {
  itemCode: string; estado: string; codSAP?: string; descripcion?: string;
  linea?: string; opciones?: { codSAP: string; descripcion: string; linea: string }[];
  solicitud?: any;
}

const LINEA_COLOR: Record<string, string> = {
  LB: "#3b82f6", LT: "#8b5cf6", LC: "#10b981", LF: "#f59e0b",
};

export default function MuninnApp() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loginNombre, setLoginNombre] = useState("");
  const [loginClave, setLoginClave]   = useState("");
  const [loginError, setLoginError]   = useState("");
  const [nombres, setNombres]         = useState<string[]>([]);
  const [tab, setTab] = useState<"dashboard"|"subir"|"cruzar"|"maestro">("dashboard");

  // Estado SAP upload
  const [archivoSAP, setArchivoSAP] = useState<File | null>(null);
  const [subiendoSAP, setSubiendoSAP] = useState(false);
  const [msgSAP, setMsgSAP] = useState<{texto:string;ok:boolean}|null>(null);

  // Estado cruce
  const [cruzando, setCruzando] = useState(false);
  const [resultadoCruce, setResultadoCruce] = useState<any>(null);
  const [ambiguos, setAmbiguos] = useState<ResultadoCruce[]>([]);

  // Maestro
  const [productos, setProductos] = useState<Producto[]>([]);
  const [resumenMaestro, setResumenMaestro] = useState<any>(null);
  const [cargandoMaestro, setCargandoMaestro] = useState(false);
  const [filtroBusq, setFiltroBusq] = useState("");
  const [totalSAP, setTotalSAP] = useState(0);

  useEffect(() => {
    fetch("/api/login").then(r => r.json()).then(d => { if (d.nombres) setNombres(d.nombres); });
    try {
      const s = localStorage.getItem("muninn_session");
      if (s) { const p = JSON.parse(s); if (p?.nombre) setUsuario(p); }
    } catch {}
  }, []);

  useEffect(() => {
    if (usuario && tab === "maestro") cargarMaestro();
    if (usuario && tab === "dashboard") cargarMaestro();
  }, [usuario, tab]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/login", { method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ nombre: loginNombre, clave: loginClave }) });
    const d = await res.json();
    if (!res.ok) { setLoginError(d.error || "Error"); return; }
    setUsuario(d);
    try { localStorage.setItem("muninn_session", JSON.stringify(d)); } catch {}
  };

  const cargarMaestro = async () => {
    setCargandoMaestro(true);
    const r = await fetch("/api/muninn/maestro");
    const d = await r.json();
    if (d.ok) { setProductos(d.productos); setResumenMaestro(d.resumen); setTotalSAP(d.totalSAP); }
    setCargandoMaestro(false);
  };

  const subirSAP = async () => {
    if (!archivoSAP) return;
    setSubiendoSAP(true); setMsgSAP(null);
    const fd = new FormData(); fd.append("archivo", archivoSAP);
    const r = await fetch("/api/muninn/subir-sap", { method:"POST", body: fd });
    const d = await r.json();
    setMsgSAP({ texto: d.mensaje || d.error, ok: r.ok });
    setSubiendoSAP(false);
    setArchivoSAP(null);
  };

  const correrCruce = async () => {
    setCruzando(true); setResultadoCruce(null); setAmbiguos([]);
    const r = await fetch("/api/muninn/cruzar", { method:"POST" });
    const d = await r.json();
    setResultadoCruce(d);
    setAmbiguos((d.resultados || []).filter((x: any) => x.estado === "ambiguo"));
    setCruzando(false);
    cargarMaestro();
  };

  const resolverAmbiguo = async (a: ResultadoCruce, opcion: any) => {
    await fetch("/api/muninn/resolver-ambiguo", {
      method: "POST", headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ itemCode: a.itemCode, codSAPSeleccionado: opcion.codSAP,
        descripcion: opcion.descripcion, linea: opcion.linea,
        compradora: a.solicitud?.["1"] || "", token: a.solicitud?.["0"] || "" }),
    });
    setAmbiguos(prev => prev.filter(x => x.itemCode !== a.itemCode));
    cargarMaestro();
  };

  const productosFiltrados = productos.filter(p =>
    !filtroBusq || p.codSAP.toUpperCase().includes(filtroBusq.toUpperCase()) ||
    p.descripcion.toUpperCase().includes(filtroBusq.toUpperCase()) ||
    p.itemCode.toUpperCase().includes(filtroBusq.toUpperCase())
  );

  // ── LOGIN ─────────────────────────────────────────────────────────────
  if (!usuario) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
      background:"radial-gradient(ellipse at 50% 0%, #0d1a3a 0%, #06090f 70%)" }}>
      <div style={{ width: 380 }}>
        <div style={{ textAlign:"center", marginBottom: 32 }}>
          <div style={{ fontSize:"3rem", marginBottom:8, animation:"ravenPulse 2s ease infinite" }}>🪬</div>
          <h1 style={{ fontSize:"1.8rem", fontWeight:900, letterSpacing:"3px", color:"#FFCE00" }}>MUNINN</h1>
          <p style={{ color:"#64748b", fontSize:"0.8rem", letterSpacing:"2px", marginTop:4 }}>
            MOTOR DE CRUCE SAP · TIENDAS DAKA
          </p>
        </div>
        <div className="card" style={{ background:"#0d1420", border:"1px solid rgba(255,206,0,0.15)" }}>
          <form onSubmit={handleLogin} style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div>
              <label style={{ fontSize:"0.7rem", color:"#64748b", letterSpacing:1, textTransform:"uppercase", fontWeight:700 }}>Usuario</label>
              <select className="input" style={{ marginTop:6 }} value={loginNombre}
                onChange={e => setLoginNombre(e.target.value)} required>
                <option value="">— Seleccionar —</option>
                {nombres.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:"0.7rem", color:"#64748b", letterSpacing:1, textTransform:"uppercase", fontWeight:700 }}>Clave</label>
              <input className="input" style={{ marginTop:6 }} type="password" value={loginClave}
                onChange={e => setLoginClave(e.target.value)} required placeholder="••••••••" />
            </div>
            {loginError && <div style={{ color:"#ef4444", fontSize:"0.8rem", textAlign:"center" }}>{loginError}</div>}
            <button type="submit" className="btn btn-gold" style={{ width:"100%", justifyContent:"center", marginTop:4 }}>
              Entrar a MUNINN →
            </button>
          </form>
        </div>
        <p style={{ textAlign:"center", marginTop:16, color:"#334155", fontSize:"0.65rem", letterSpacing:1 }}>
          ECOSISTEMA IA · DAKA I+D
        </p>
      </div>
    </div>
  );

  // ── APP ───────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column",
      background:"radial-gradient(ellipse at 50% 0%, #0d1a3a 0%, #06090f 70%)" }}>

      {/* HEADER */}
      <header style={{ background:"rgba(13,20,32,0.95)", backdropFilter:"blur(12px)",
        borderBottom:"1px solid rgba(255,206,0,0.15)", padding:"0 32px", height:64,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:"1.5rem" }}>🪬</span>
          <div>
            <span style={{ fontWeight:900, fontSize:"1.1rem", letterSpacing:"3px", color:"#FFCE00" }}>MUNINN</span>
            <span style={{ marginLeft:10, fontSize:"0.6rem", letterSpacing:"1px", color:"#475569", textTransform:"uppercase", fontWeight:700 }}>
              Motor de Cruce SAP
            </span>
          </div>
        </div>
        <nav style={{ display:"flex", gap:6 }}>
          {(["dashboard","subir","cruzar","maestro"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className="btn"
              style={{ background: tab===t ? "#FFCE00" : "transparent",
                color: tab===t ? "#0a0f1e" : "#64748b",
                border: tab===t ? "none" : "1px solid rgba(255,255,255,0.07)",
                padding:"7px 16px", fontSize:"0.72rem", letterSpacing:"0.5px" }}>
              {{ dashboard:"📊 Dashboard", subir:"📂 Subir SAP", cruzar:"🔄 Cruzar", maestro:"📋 Maestro" }[t]}
            </button>
          ))}
          <button className="btn btn-ghost" style={{ marginLeft:8 }}
            onClick={() => { setUsuario(null); localStorage.removeItem("muninn_session"); }}>
            Salir
          </button>
        </nav>
      </header>

      <main style={{ flex:1, maxWidth:1200, margin:"0 auto", width:"100%", padding:"32px 24px" }}>

        {/* ── DASHBOARD ── */}
        {tab === "dashboard" && (
          <div className="fade-up">
            <h1 style={{ fontSize:"1.6rem", fontWeight:900, color:"#FFCE00", marginBottom:4 }}>
              Bienvenido, {usuario.nombre}
            </h1>
            <p style={{ color:"#64748b", marginBottom:28, fontSize:"0.85rem" }}>
              MUNINN — El cuervo de la memoria del ecosistema Daka
            </p>

            {/* KPI Cards */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:28 }}>
              {[
                { label:"Registros en SAP", value: totalSAP, icon:"📑", color:"#60a5fa" },
                { label:"Productos Cruzados", value: resumenMaestro?.total || 0, icon:"✅", color:"#10b981" },
                { label:"Fotos Pendientes (SINDRI)", value: resumenMaestro?.fotosPendientes || 0, icon:"🔨", color:"#f59e0b" },
                { label:"Garantías Pendientes (HEIMDALL)", value: resumenMaestro?.garantiaPendiente || 0, icon:"👁", color:"#8b5cf6" },
              ].map(k => (
                <div key={k.label} className="card" style={{ textAlign:"center" }}>
                  <div style={{ fontSize:"2rem", marginBottom:8 }}>{k.icon}</div>
                  <div style={{ fontSize:"2.2rem", fontWeight:900, color:k.color }}>{k.value}</div>
                  <div style={{ fontSize:"0.65rem", color:"#64748b", marginTop:4, letterSpacing:"0.5px" }}>{k.label}</div>
                </div>
              ))}
            </div>

            {/* Accesos rápidos */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <div className="card">
                <h3 style={{ color:"#FFCE00", fontWeight:800, marginBottom:12, fontSize:"0.9rem" }}>⚡ Flujo del Día</h3>
                {[
                  { paso:"1", desc:"Persona sube Excel SAP diario", tab:"subir", listo: totalSAP > 0 },
                  { paso:"2", desc:"Correr cruce automático", tab:"cruzar", listo: (resumenMaestro?.total || 0) > 0 },
                  { paso:"3", desc:"Resolver ambiguos si los hay", tab:"cruzar", listo: false },
                  { paso:"4", desc:"SINDRI y HEIMDALL actualizados", tab:"maestro", listo: resumenMaestro?.completos > 0 },
                ].map(p => (
                  <div key={p.paso} onClick={() => setTab(p.tab as any)}
                    style={{ display:"flex", alignItems:"center", gap:12, padding:"12px",
                      borderRadius:8, cursor:"pointer", marginBottom:6,
                      background: p.listo ? "rgba(16,185,129,0.05)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${p.listo ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.05)"}`,
                      transition:"all 0.2s" }}>
                    <div style={{ width:28, height:28, borderRadius:"50%",
                      background: p.listo ? "#10b981" : "#1a2235",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:"0.7rem", fontWeight:900, color: p.listo ? "#fff" : "#475569" }}>
                      {p.listo ? "✓" : p.paso}
                    </div>
                    <span style={{ fontSize:"0.82rem", color: p.listo ? "#10b981" : "#94a3b8" }}>{p.desc}</span>
                  </div>
                ))}
              </div>
              <div className="card">
                <h3 style={{ color:"#FFCE00", fontWeight:800, marginBottom:12, fontSize:"0.9rem" }}>🌌 Ecosistema</h3>
                {[
                  { nombre:"⚡ BIFROST", desc:"Recolecta datos y docs de proveedores", url:"https://portal-compradores.onrender.com" },
                  { nombre:"🔨 SINDRI", desc:"Genera fotos profesionales con IA", url:"#" },
                  { nombre:"👁 HEIMDALL", desc:"Portal de garantías y manuales", url:"#" },
                  { nombre:"🧠 GENESIS", desc:"Fichas técnicas y SEO", url:"#" },
                ].map(a => (
                  <a key={a.nombre} href={a.url} target="_blank" rel="noreferrer"
                    style={{ display:"flex", alignItems:"center", gap:10, padding:"10px",
                      borderRadius:8, textDecoration:"none", marginBottom:4,
                      background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)",
                      transition:"all 0.2s" }}>
                    <span style={{ fontWeight:800, color:"#FFCE00", fontSize:"0.82rem", minWidth:90 }}>{a.nombre}</span>
                    <span style={{ fontSize:"0.75rem", color:"#64748b" }}>{a.desc}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── SUBIR SAP ── */}
        {tab === "subir" && (
          <div className="fade-up">
            <h2 style={{ color:"#FFCE00", fontWeight:900, marginBottom:4 }}>📂 Subir Excel SAP Diario</h2>
            <p style={{ color:"#64748b", marginBottom:24, fontSize:"0.85rem" }}>
              Sube el Excel descargado de SAP. El sistema borrará el MaestroSAP anterior y cargará los nuevos datos.
            </p>
            <div className="card" style={{ maxWidth:500 }}>
              <div style={{ marginBottom:20 }}>
                <p style={{ fontSize:"0.75rem", color:"#64748b", marginBottom:12, lineHeight:1.6 }}>
                  <strong style={{ color:"#94a3b8" }}>Columnas requeridas en el Excel SAP:</strong><br/>
                  <span style={{ color:"#FFCE00" }}>A:</span> Código SAP &nbsp;·&nbsp;
                  <span style={{ color:"#FFCE00" }}>B:</span> Descripción &nbsp;·&nbsp;
                  <span style={{ color:"#FFCE00" }}>C:</span> Línea<br/>
                  <span style={{ color:"#FFCE00" }}>D:</span> Código Proveedor &nbsp;·&nbsp;
                  <span style={{ color:"#FFCE00" }}>E:</span> Código Único Proveedor
                </p>
              </div>
              <input type="file" accept=".xlsx,.xls" onChange={e => setArchivoSAP(e.target.files?.[0] || null)}
                style={{ display:"none" }} id="sap-file" />
              <label htmlFor="sap-file" style={{ display:"block", border:"2px dashed rgba(255,206,0,0.3)",
                borderRadius:10, padding:"32px", textAlign:"center", cursor:"pointer",
                color: archivoSAP ? "#FFCE00" : "#475569", marginBottom:16, transition:"all 0.2s" }}>
                {archivoSAP ? `✅ ${archivoSAP.name}` : "📂 Haz click para seleccionar el Excel SAP"}
              </label>
              <button className="btn btn-gold" style={{ width:"100%", justifyContent:"center" }}
                disabled={!archivoSAP || subiendoSAP} onClick={subirSAP}>
                {subiendoSAP ? <><span className="spinner" /> Subiendo...</> : "🚀 Subir y Reemplazar MaestroSAP"}
              </button>
              {msgSAP && (
                <div style={{ marginTop:16, padding:"12px", borderRadius:8, fontSize:"0.82rem",
                  background: msgSAP.ok ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                  border: `1px solid ${msgSAP.ok ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                  color: msgSAP.ok ? "#10b981" : "#ef4444" }}>
                  {msgSAP.texto}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── CRUZAR ── */}
        {tab === "cruzar" && (
          <div className="fade-up">
            <h2 style={{ color:"#FFCE00", fontWeight:900, marginBottom:4 }}>🔄 Cruce SAP ↔ Proveedor</h2>
            <p style={{ color:"#64748b", marginBottom:24, fontSize:"0.85rem" }}>
              MUNINN buscará todos los registros RESPONDIDOS en BIFROST y los cruzará con el MaestroSAP.
            </p>
            <button className="btn btn-gold" disabled={cruzando} onClick={correrCruce} style={{ marginBottom:24 }}>
              {cruzando ? <><span className="spinner" /> Cruzando...</> : "🪬 Correr Cruce Automático"}
            </button>

            {resultadoCruce && (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24 }}>
                {[
                  { label:"✅ Cruzados", value:resultadoCruce.resumen?.cruzados, color:"#10b981" },
                  { label:"⏩ Ya existían", value:resultadoCruce.resumen?.ya_cruzados, color:"#60a5fa" },
                  { label:"⚠️ Ambiguos", value:resultadoCruce.resumen?.ambiguos, color:"#f59e0b" },
                  { label:"❌ No en SAP", value:resultadoCruce.resumen?.no_encontrados, color:"#ef4444" },
                ].map(k => (
                  <div key={k.label} className="card" style={{ textAlign:"center" }}>
                    <div style={{ fontSize:"2rem", fontWeight:900, color:k.color }}>{k.value}</div>
                    <div style={{ fontSize:"0.7rem", color:"#64748b", marginTop:4 }}>{k.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Ambiguos */}
            {ambiguos.length > 0 && (
              <div className="card">
                <h3 style={{ color:"#f59e0b", fontWeight:800, marginBottom:16, fontSize:"0.9rem" }}>
                  ⚠️ {ambiguos.length} Item Code(s) con múltiples opciones — Selecciona cuál aplica
                </h3>
                {ambiguos.map(a => (
                  <div key={a.itemCode} style={{ marginBottom:20, padding:16, borderRadius:8,
                    background:"rgba(245,158,11,0.05)", border:"1px solid rgba(245,158,11,0.2)" }}>
                    <div style={{ fontWeight:800, color:"#FFCE00", marginBottom:10, fontSize:"0.85rem" }}>
                      Item Code: {a.itemCode}
                    </div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                      {a.opciones?.map(op => (
                        <button key={op.codSAP} className="btn btn-ghost"
                          onClick={() => resolverAmbiguo(a, op)}
                          style={{ fontSize:"0.75rem", flexDirection:"column", alignItems:"flex-start", gap:2, padding:"10px 14px" }}>
                          <strong style={{ color:"#FFCE00" }}>{op.codSAP}</strong>
                          <span style={{ color:"#94a3b8" }}>{op.descripcion}</span>
                          <span className="badge badge-blue" style={{ marginTop:2 }}>{op.linea}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MAESTRO ── */}
        {tab === "maestro" && (
          <div className="fade-up">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div>
                <h2 style={{ color:"#FFCE00", fontWeight:900, marginBottom:4 }}>📋 MaestroProductos</h2>
                <p style={{ color:"#64748b", fontSize:"0.82rem" }}>Hub central del ecosistema — SINDRI y HEIMDALL leen de aquí</p>
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <input className="input" placeholder="Buscar SAP, descripción, item code..."
                  value={filtroBusq} onChange={e => setFiltroBusq(e.target.value)}
                  style={{ width:280, fontSize:"0.8rem" }} />
                <button className="btn btn-ghost" onClick={cargarMaestro}>↻ Actualizar</button>
              </div>
            </div>

            {cargandoMaestro ? (
              <div style={{ textAlign:"center", padding:"60px", color:"#475569" }}>
                <span className="spinner" style={{ width:32, height:32, borderWidth:3 }} /> <br/><br/>Cargando MaestroProductos...
              </div>
            ) : (
              <div className="card" style={{ padding:0, overflow:"hidden" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Código SAP</th>
                      <th>Descripción</th>
                      <th>Línea</th>
                      <th>Item Code Proveedor</th>
                      <th>Compradora</th>
                      <th>Fecha Cruce</th>
                      <th>🔨 SINDRI</th>
                      <th>👁 HEIMDALL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productosFiltrados.length === 0 ? (
                      <tr><td colSpan={8} style={{ textAlign:"center", padding:"40px", color:"#475569" }}>
                        {productos.length === 0 ? "Sin productos cruzados aún. Sube el SAP y corre el cruce." : "Sin resultados para la búsqueda."}
                      </td></tr>
                    ) : productosFiltrados.map(p => (
                      <tr key={p.codSAP}>
                        <td><code style={{ color:"#FFCE00", fontWeight:800, fontSize:"0.78rem" }}>{p.codSAP}</code></td>
                        <td style={{ maxWidth:220, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", color:"#94a3b8", fontSize:"0.8rem" }}>{p.descripcion}</td>
                        <td><span style={{ background: LINEA_COLOR[p.linea] ? `${LINEA_COLOR[p.linea]}22` : "rgba(255,255,255,0.05)",
                          color: LINEA_COLOR[p.linea] || "#94a3b8", padding:"2px 8px", borderRadius:20, fontSize:"0.7rem", fontWeight:700 }}>{p.linea || "—"}</span></td>
                        <td style={{ color:"#64748b", fontSize:"0.75rem" }}>{p.itemCode}</td>
                        <td style={{ color:"#94a3b8", fontSize:"0.78rem" }}>{p.compradora}</td>
                        <td style={{ color:"#475569", fontSize:"0.72rem" }}>{p.fechaCruce}</td>
                        <td><span className={`badge ${p.estadoFotos==="LISTO" ? "badge-green" : "badge-amber"}`}>{p.estadoFotos}</span></td>
                        <td><span className={`badge ${p.estadoGarantia==="RECIBIDA" ? "badge-green" : "badge-amber"}`}>{p.estadoGarantia}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      <footer style={{ borderTop:"1px solid rgba(255,255,255,0.05)", padding:"16px 32px",
        textAlign:"center", fontSize:"0.65rem", color:"#334155", letterSpacing:1 }}>
        🪬 MUNINN · Motor de Cruce SAP · TIENDAS DAKA · I+D CORPORATIVO
      </footer>
    </div>
  );
}
