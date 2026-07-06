"use client";
import { useState, useEffect } from "react";

const AZUL = "#0f2d6e";
const AMARILLO = "#f5c518";
const ROLES_PERMITIDOS = ["admin", "Coordinador"];

interface Usuario { nombre: string; rol: string; }
interface Producto {
  codSAP: string; descripcion: string; linea: string; itemCode: string;
  compradora: string; fechaCruce: string; estadoFotos: string; estadoGarantia: string;
}

export default function MuninnApp() {
  const [usuario, setUsuario]       = useState<Usuario | null>(null);
  const [loginNombre, setLoginNombre] = useState("");
  const [loginClave, setLoginClave]   = useState("");
  const [loginError, setLoginError]   = useState("");
  const [loginLoad, setLoginLoad]     = useState(false);
  const [nombres, setNombres]         = useState<string[]>([]);
  const [tab, setTab] = useState<"dashboard"|"subir"|"cruzar"|"maestro">("dashboard");

  const [archivoSAP, setArchivoSAP] = useState<File|null>(null);
  const [subiendoSAP, setSubiendoSAP] = useState(false);
  const [msgSAP, setMsgSAP] = useState<{texto:string;ok:boolean}|null>(null);

  const [cruzando, setCruzando] = useState(false);
  const [resultadoCruce, setResultadoCruce] = useState<any>(null);
  const [ambiguos, setAmbiguos] = useState<any[]>([]);

  const [productos, setProductos] = useState<Producto[]>([]);
  const [resumen, setResumen] = useState<any>(null);
  const [totalSAP, setTotalSAP] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [busq, setBusq] = useState("");

  useEffect(() => {
    fetch("/api/login").then(r=>r.json()).then(d=>{ if(d.nombres) setNombres(d.nombres); });
    try { const s=localStorage.getItem("muninn_session"); if(s){const p=JSON.parse(s);if(p?.nombre) setUsuario(p);} } catch {}
  }, []);

  useEffect(() => { if(usuario && (tab==="maestro"||tab==="dashboard")) cargarMaestro(); }, [usuario, tab]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoginLoad(true); setLoginError("");
    const r = await fetch("/api/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({nombre:loginNombre,clave:loginClave})});
    const d = await r.json();
    if(!r.ok){setLoginError(d.error||"Error");setLoginLoad(false);return;}
    if(!ROLES_PERMITIDOS.includes(d.rol)){setLoginError("⛔ Sin acceso a MUNINN. Solo el Coordinador.");setLoginLoad(false);return;}
    setUsuario(d);
    try{localStorage.setItem("muninn_session",JSON.stringify(d));}catch{}
    setLoginLoad(false);
  };

  const cargarMaestro = async () => {
    setCargando(true);
    const r = await fetch("/api/muninn/maestro"); const d = await r.json();
    if(d.ok){setProductos(d.productos);setResumen(d.resumen);setTotalSAP(d.totalSAP);}
    setCargando(false);
  };

  const subirSAP = async () => {
    if(!archivoSAP) return; setSubiendoSAP(true); setMsgSAP(null);
    const fd = new FormData(); fd.append("archivo",archivoSAP);
    const r = await fetch("/api/muninn/subir-sap",{method:"POST",body:fd});
    const d = await r.json();
    setMsgSAP({texto:d.mensaje||d.error,ok:r.ok});
    setSubiendoSAP(false); setArchivoSAP(null);
  };

  const correrCruce = async () => {
    setCruzando(true); setResultadoCruce(null); setAmbiguos([]);
    const r = await fetch("/api/muninn/cruzar",{method:"POST"});
    const d = await r.json();
    setResultadoCruce(d);
    setAmbiguos((d.resultados||[]).filter((x:any)=>x.estado==="ambiguo"));
    setCruzando(false); cargarMaestro();
  };

  const resolverAmbiguo = async (a:any, op:any) => {
    await fetch("/api/muninn/resolver-ambiguo",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({itemCode:a.itemCode,codSAPSeleccionado:op.codSAP,descripcion:op.descripcion,linea:op.linea})});
    setAmbiguos(prev=>prev.filter(x=>x.itemCode!==a.itemCode)); cargarMaestro();
  };

  const pFiltrados = productos.filter(p=>!busq||p.codSAP.toUpperCase().includes(busq.toUpperCase())||p.descripcion.toUpperCase().includes(busq.toUpperCase())||p.itemCode.toUpperCase().includes(busq.toUpperCase()));

  const btnStyle = (activo:boolean) => ({
    padding:"10px 20px",borderRadius:10,border:"none",fontFamily:"Poppins",fontWeight:700,fontSize:13,cursor:"pointer",transition:"all .2s",
    background:activo?AZUL:"transparent",color:activo?"white":"#6b7280"
  });

  // ─── LOGIN ───────────────────────────────────────────────────────────────
  if(!usuario) return (
    <div style={{minHeight:"100vh",background:`linear-gradient(135deg,${AZUL} 0%,#1a4499 60%,#0a1f4e 100%)`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Poppins,sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;900&display=swap');`}</style>
      <div style={{background:"white",borderRadius:24,padding:"48px 40px",maxWidth:440,width:"100%",boxShadow:"0 25px 60px rgba(0,0,0,0.3)",textAlign:"center"}}>
        <div style={{width:110,height:110,margin:"0 auto 16px",borderRadius:"50%",overflow:"hidden",boxShadow:"0 8px 32px rgba(15,45,110,0.25)",border:"3px solid #c9a227"}}>
          <img src="/bifrost-logo.png" alt="MUNINN" style={{width:"100%",height:"100%",objectFit:"cover"}} />
        </div>
        <h1 style={{fontSize:30,fontWeight:900,color:AZUL,margin:"0 0 2px"}}>MUNINN</h1>
        <p style={{color:"#c9a227",fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",margin:"0 0 4px"}}>Motor de Cruce SAP</p>
        <p style={{color:"#9ca3af",fontSize:12,margin:"0 0 28px"}}>Tiendas Daka · Servicio Técnico</p>
        <form onSubmit={handleLogin} style={{display:"flex",flexDirection:"column",gap:14}}>
          <select value={loginNombre} onChange={e=>setLoginNombre(e.target.value)} required
            style={{width:"100%",padding:"14px 16px",borderRadius:12,border:"2px solid #e5e7eb",fontSize:14,fontFamily:"Poppins",outline:"none",color:"#111827",background:"white"}}>
            <option value="">👤 Selecciona tu nombre</option>
            {nombres.map(n=><option key={n} value={n}>{n}</option>)}
          </select>
          <input type="password" value={loginClave} onChange={e=>setLoginClave(e.target.value)} required placeholder="Clave de acceso"
            style={{padding:"14px 16px",borderRadius:12,border:"2px solid #e5e7eb",fontSize:14,fontFamily:"Poppins",outline:"none"}} />
          {loginError && <div style={{background:"#fef2f2",border:"1px solid #fca5a5",color:"#dc2626",borderRadius:10,padding:"10px 14px",fontSize:13}}>{loginError}</div>}
          <button type="submit" disabled={loginLoad}
            style={{padding:14,borderRadius:12,background:`linear-gradient(135deg,${AZUL},#1a4499)`,color:"white",fontWeight:700,fontSize:15,border:"none",cursor:"pointer",fontFamily:"Poppins",opacity:loginLoad?.7:1}}>
            {loginLoad?"Verificando...":"Entrar a MUNINN →"}
          </button>
        </form>
      </div>
    </div>
  );

  // ─── APP ─────────────────────────────────────────────────────────────────
  return (
    <div style={{minHeight:"100vh",background:"#f4f6fb",fontFamily:"Poppins,sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;900&display=swap');*{box-sizing:border-box;margin:0;padding:0;}`}</style>

      {/* NAVBAR */}
      <nav style={{background:AZUL,padding:"0 32px",display:"flex",alignItems:"center",justifyContent:"space-between",height:64,boxShadow:"0 2px 16px rgba(0,0,0,0.3)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:44,height:44,borderRadius:10,overflow:"hidden",border:"2px solid #c9a227",flexShrink:0}}>
            <img src="/bifrost-logo.png" alt="MUNINN" style={{width:"100%",height:"100%",objectFit:"cover"}} />
          </div>
          <div>
            <div style={{color:"white",fontWeight:900,fontSize:17,lineHeight:1}}>MUNINN</div>
            <div style={{color:"#c9a227",fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase"}}>Motor de Cruce SAP · Tiendas Daka</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <div style={{textAlign:"right"}}>
            <div style={{color:"white",fontWeight:700,fontSize:14}}>{usuario.nombre}</div>
            <div style={{color:AMARILLO,fontSize:11,fontWeight:600}}>{usuario.rol}</div>
          </div>
          <button onClick={()=>{setUsuario(null);try{localStorage.removeItem("muninn_session");}catch{}}}
            style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",color:"white",borderRadius:8,padding:"8px 16px",cursor:"pointer",fontSize:12,fontFamily:"Poppins"}}>
            Salir
          </button>
        </div>
      </nav>

      <div style={{maxWidth:1200,margin:"0 auto",padding:"32px 24px"}}>

        {/* TABS */}
        <div style={{display:"flex",gap:4,marginBottom:24,background:"#e8ecf5",borderRadius:14,padding:4,width:"fit-content"}}>
          {(["dashboard","subir","cruzar","maestro"] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={btnStyle(tab===t)}>
              {t==="dashboard"?"📊 Dashboard":t==="subir"?"📂 Subir SAP":t==="cruzar"?"🔄 Cruzar":"📋 Maestro"}
            </button>
          ))}
        </div>

        {/* ── DASHBOARD ── */}
        {tab==="dashboard" && (
          <div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:24}}>
              {[
                {label:"Registros en SAP",val:totalSAP,icon:"📑",color:AZUL},
                {label:"Productos Cruzados",val:resumen?.total||0,icon:"✅",color:"#10b981"},
                {label:"Fotos Pendientes",val:resumen?.fotosPendientes||0,icon:"🔨",color:"#f59e0b"},
                {label:"Garantías Pendientes",val:resumen?.garantiaPendiente||0,icon:"👁",color:"#8b5cf6"},
              ].map(k=>(
                <div key={k.label} style={{background:"white",borderRadius:16,padding:"20px 24px",boxShadow:"0 2px 8px rgba(0,0,0,0.06)",borderTop:`4px solid ${k.color}`}}>
                  <div style={{fontSize:24,marginBottom:6}}>{k.icon}</div>
                  <div style={{fontSize:32,fontWeight:900,color:k.color}}>{k.val}</div>
                  <div style={{fontSize:12,color:"#6b7280",marginTop:2}}>{k.label}</div>
                </div>
              ))}
            </div>
            <div style={{background:"white",borderRadius:16,padding:24,boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
              <div style={{fontWeight:800,color:AZUL,marginBottom:12}}>⚡ Flujo del Día</div>
              {[
                {n:"1",desc:"Subir Excel SAP diario",t:"subir",ok:totalSAP>0},
                {n:"2",desc:"Correr cruce automático",t:"cruzar",ok:(resumen?.total||0)>0},
                {n:"3",desc:"Resolver ambiguos",t:"cruzar",ok:false},
                {n:"4",desc:"SINDRI y HEIMDALL actualizados",t:"maestro",ok:(resumen?.completos||0)>0},
              ].map(p=>(
                <div key={p.n} onClick={()=>setTab(p.t as any)}
                  style={{display:"flex",alignItems:"center",gap:12,padding:12,borderRadius:8,cursor:"pointer",marginBottom:6,
                    background:p.ok?"#f0fdf4":"#f9fafb",border:`1px solid ${p.ok?"#86efac":"#e5e7eb"}`,transition:"all .2s"}}>
                  <div style={{width:28,height:28,borderRadius:"50%",background:p.ok?"#10b981":AZUL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.7rem",fontWeight:900,color:"white"}}>{p.ok?"✓":p.n}</div>
                  <span style={{fontSize:"0.82rem",color:p.ok?"#10b981":"#374151"}}>{p.desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SUBIR SAP ── */}
        {tab==="subir" && (
          <div style={{background:"white",borderRadius:20,padding:32,boxShadow:"0 4px 20px rgba(0,0,0,0.08)",maxWidth:520}}>
            <div style={{fontWeight:900,fontSize:18,color:AZUL,marginBottom:4}}>📂 Subir Excel SAP Diario</div>
            <p style={{color:"#6b7280",marginBottom:24,fontSize:13}}>El sistema reemplaza el MaestroSAP con el nuevo archivo.</p>
            <div style={{fontSize:12,color:"#6b7280",marginBottom:16,background:"#f9fafb",borderRadius:10,padding:12}}>
              <strong style={{color:"#374151"}}>Columnas del Excel SAP:</strong><br/>
              <span style={{color:AZUL}}>A:</span> Código SAP &nbsp;·&nbsp; <span style={{color:AZUL}}>B:</span> Descripción &nbsp;·&nbsp; <span style={{color:AZUL}}>C:</span> Línea<br/>
              <span style={{color:AZUL}}>D:</span> Código Proveedor &nbsp;·&nbsp; <span style={{color:AZUL}}>E:</span> Código Único Proveedor
            </div>
            <input type="file" accept=".xlsx,.xls" onChange={e=>setArchivoSAP(e.target.files?.[0]||null)} style={{display:"none"}} id="sap-file" />
            <label htmlFor="sap-file" style={{display:"block",border:`2px dashed ${AZUL}`,borderRadius:10,padding:32,textAlign:"center",cursor:"pointer",color:archivoSAP?"#10b981":"#9ca3af",marginBottom:16,background:archivoSAP?"#f0fdf4":"#f9fafb"}}>
              {archivoSAP?`✅ ${archivoSAP.name}`:"📂 Click para seleccionar el Excel SAP"}
            </label>
            <button disabled={!archivoSAP||subiendoSAP} onClick={subirSAP}
              style={{width:"100%",padding:14,borderRadius:12,background:archivoSAP&&!subiendoSAP?`linear-gradient(135deg,${AZUL},#1a4499)`:"#e5e7eb",color:archivoSAP&&!subiendoSAP?"white":"#9ca3af",fontWeight:700,fontSize:14,border:"none",cursor:archivoSAP&&!subiendoSAP?"pointer":"not-allowed",fontFamily:"Poppins"}}>
              {subiendoSAP?"Subiendo...":"🚀 Subir y Reemplazar MaestroSAP"}
            </button>
            {msgSAP&&<div style={{marginTop:16,padding:12,borderRadius:8,fontSize:13,fontWeight:600,background:msgSAP.ok?"#f0fdf4":"#fef2f2",border:`1px solid ${msgSAP.ok?"#86efac":"#fca5a5"}`,color:msgSAP.ok?"#166534":"#dc2626"}}>{msgSAP.texto}</div>}
          </div>
        )}

        {/* ── CRUZAR ── */}
        {tab==="cruzar" && (
          <div>
            <div style={{fontWeight:900,fontSize:18,color:AZUL,marginBottom:4}}>🔄 Cruce SAP ↔ Proveedor</div>
            <p style={{color:"#6b7280",marginBottom:20,fontSize:13}}>MUNINN busca todos los registros RESPONDIDOS en BIFROST y los cruza con el MaestroSAP.</p>
            <button disabled={cruzando} onClick={correrCruce}
              style={{padding:"12px 28px",borderRadius:12,background:cruzando?"#e5e7eb":`linear-gradient(135deg,${AZUL},#1a4499)`,color:cruzando?"#9ca3af":"white",fontWeight:700,fontSize:14,border:"none",cursor:cruzando?"not-allowed":"pointer",fontFamily:"Poppins",marginBottom:24}}>
              {cruzando?"Cruzando...":"🪬 Correr Cruce Automático"}
            </button>

            {resultadoCruce&&(
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24}}>
                {[
                  {label:"✅ Cruzados",val:resultadoCruce.resumen?.cruzados,color:"#10b981"},
                  {label:"⏩ Ya existían",val:resultadoCruce.resumen?.ya_cruzados,color:"#3b82f6"},
                  {label:"⚠️ Ambiguos",val:resultadoCruce.resumen?.ambiguos,color:"#f59e0b"},
                  {label:"❌ No en SAP",val:resultadoCruce.resumen?.no_encontrados,color:"#ef4444"},
                ].map(k=>(
                  <div key={k.label} style={{background:"white",borderRadius:16,padding:"20px",boxShadow:"0 2px 8px rgba(0,0,0,0.06)",textAlign:"center",borderTop:`4px solid ${k.color}`}}>
                    <div style={{fontSize:32,fontWeight:900,color:k.color}}>{k.val}</div>
                    <div style={{fontSize:12,color:"#6b7280",marginTop:4}}>{k.label}</div>
                  </div>
                ))}
              </div>
            )}

            {ambiguos.length>0&&(
              <div style={{background:"white",borderRadius:16,padding:24,boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
                <div style={{fontWeight:800,color:"#92400e",marginBottom:16}}>⚠️ {ambiguos.length} Item Code(s) con múltiples opciones — Selecciona cuál aplica</div>
                {ambiguos.map(a=>(
                  <div key={a.itemCode} style={{marginBottom:16,padding:16,borderRadius:10,background:"#fffbeb",border:"1px solid #fde68a"}}>
                    <div style={{fontWeight:700,color:AZUL,marginBottom:10,fontSize:14}}>Item Code: {a.itemCode}</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                      {a.opciones?.map((op:any)=>(
                        <button key={op.codSAP} onClick={()=>resolverAmbiguo(a,op)}
                          style={{padding:"10px 16px",borderRadius:10,background:AZUL,color:"white",border:"none",cursor:"pointer",fontFamily:"Poppins",fontWeight:700,fontSize:12,textAlign:"left"}}>
                          <div>{op.codSAP}</div>
                          <div style={{fontWeight:400,opacity:.8,fontSize:11}}>{op.descripcion}</div>
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
        {tab==="maestro"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:12}}>
              <div>
                <div style={{fontWeight:900,fontSize:18,color:AZUL}}>📋 MaestroProductos</div>
                <div style={{color:"#6b7280",fontSize:13}}>Hub central — SINDRI y HEIMDALL leen de aquí</div>
              </div>
              <div style={{display:"flex",gap:10}}>
                <input value={busq} onChange={e=>setBusq(e.target.value)} placeholder="🔍 Buscar SAP, descripción..."
                  style={{padding:"10px 14px",borderRadius:10,border:"2px solid #e5e7eb",fontSize:13,fontFamily:"Poppins",outline:"none",width:260}} />
                <button onClick={cargarMaestro} style={{padding:"10px 16px",borderRadius:10,background:AZUL,color:"white",border:"none",cursor:"pointer",fontFamily:"Poppins",fontWeight:700}}>↻</button>
              </div>
            </div>
            {cargando?<div style={{textAlign:"center",padding:60,color:"#6b7280"}}>⏳ Cargando MaestroProductos...</div>:(
              <div style={{background:"white",borderRadius:16,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",overflow:"hidden"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                  <thead style={{background:AZUL}}>
                    <tr>{["Código SAP","Descripción","Línea","Item Code Prov.","Compradora","Fecha Cruce","🔨 SINDRI","👁 HEIMDALL"].map(h=>(
                      <th key={h} style={{padding:"12px 14px",textAlign:"left",color:"white",fontWeight:700,fontSize:11,letterSpacing:".5px"}}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {pFiltrados.length===0?(
                      <tr><td colSpan={8} style={{textAlign:"center",padding:40,color:"#9ca3af"}}>
                        {productos.length===0?"Sin productos cruzados aún. Sube el SAP y corre el cruce.":"Sin resultados para la búsqueda."}
                      </td></tr>
                    ):pFiltrados.map(p=>(
                      <tr key={p.codSAP} style={{borderBottom:"1px solid #f3f4f6"}}>
                        <td style={{padding:"12px 14px",fontWeight:700,color:AZUL}}>{p.codSAP}</td>
                        <td style={{padding:"12px 14px",color:"#374151",maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.descripcion}</td>
                        <td style={{padding:"12px 14px"}}><span style={{background:"#e8ecf5",color:AZUL,padding:"2px 10px",borderRadius:20,fontSize:11,fontWeight:700}}>{p.linea||"—"}</span></td>
                        <td style={{padding:"12px 14px",color:"#6b7280",fontSize:12}}>{p.itemCode}</td>
                        <td style={{padding:"12px 14px",color:"#6b7280",fontSize:12}}>{p.compradora}</td>
                        <td style={{padding:"12px 14px",color:"#9ca3af",fontSize:11}}>{p.fechaCruce}</td>
                        <td style={{padding:"12px 14px"}}>
                          <span style={{background:p.estadoFotos==="LISTO"?"#f0fdf4":"#fffbeb",color:p.estadoFotos==="LISTO"?"#166534":"#92400e",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700}}>{p.estadoFotos}</span>
                        </td>
                        <td style={{padding:"12px 14px"}}>
                          <span style={{background:p.estadoGarantia==="RECIBIDA"?"#f0fdf4":"#fffbeb",color:p.estadoGarantia==="RECIBIDA"?"#166534":"#92400e",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700}}>{p.estadoGarantia}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <footer style={{textAlign:"center",padding:"20px",fontSize:11,color:"#9ca3af",borderTop:"1px solid #e5e7eb",marginTop:40}}>
        🪬 MUNINN · Motor de Cruce SAP · Tiendas Daka · I+D Corporativo
      </footer>
    </div>
  );
}
