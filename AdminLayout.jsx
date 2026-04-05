import { useState, useEffect, useCallback } from "react";
import { signOut } from "firebase/auth";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc, query, where } from "firebase/firestore";
import { auth, db } from "./config.js";
import { C, WHATSAPP_ADMIN, fmt, fmtDt, isDone, ORDER_STATUS, PAYMENT_METHODS, MENU, ALL_ITEMS, CIDADES } from "./constants.js";
import { Toast, Spinner, Modal, Pill, SBadge, Card, StatCard, fieldStyle, Lbl, BtnPrimary, WaButton, Logo } from "./UI.jsx";
import NovoPedido from "./NovoPedido.jsx";
import ClientesPage from "./ClientesPage.jsx";
import AnalisePage from "./AnalisePage.jsx";

// ─── HEADER ─────────────────────────────────────────────────────
function Header({tab, setTab, user, ativos, synced}) {
  const tabs = [
    {id:"pedidos",emoji:"📋",label:"Pedidos"},
    {id:"novo",   emoji:"➕",label:"Novo"},
    {id:"clientes",emoji:"👥",label:"Clientes"},
    {id:"fin",    emoji:"📊",label:"Financeiro"},
    {id:"analise",emoji:"📈",label:"Análise"},
  ];
  return (
    <header style={{background:`linear-gradient(135deg,${C.espresso},${C.brown})`,position:"sticky",top:0,zIndex:100,boxShadow:`0 4px 24px rgba(0,0,0,0.3)`}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 20px"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <Logo size={32}/>
          <div>
            <div style={{fontFamily:"'Playfair Display',serif",color:C.cream,fontSize:18,fontWeight:900,lineHeight:1}}>Casa da Empada</div>
            <div style={{fontSize:10,color:C.sand,letterSpacing:2,textTransform:"uppercase",marginTop:2}}>Admin Panel</div>
          </div>
        </div>
        <button onClick={()=>signOut(auth)} style={{background:"rgba(255,255,255,0.1)",border:"none",padding:"8px 12px",borderRadius:10,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>SAIR</button>
      </div>
      
      <nav style={{display:"flex",overflowX:"auto",padding:"0 10px 10px",gap:8,scrollbarWidth:"none"}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            flex:"0 0 auto",display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:12,border:"none",
            background:tab===t.id?C.warmWhite:"rgba(0,0,0,0.2)",
            color:tab===t.id?C.espresso:"#fff",
            fontSize:13,fontWeight:700,transition:".2s",whiteSpace:"nowrap"
          }}>
            {t.emoji} {t.label}
            {t.id==="pedidos" && ativos>0 && <span style={{background:C.terracotta,color:"#fff",fontSize:10,padding:"2px 6px",borderRadius:10,marginLeft:4}}>{ativos}</span>}
          </button>
        ))}
      </nav>
    </header>
  );
}

// ─── PEDIDOS PAGE ───────────────────────────────────────────────
function PedidosPage({orders, onStatus, onDelete, clients, drivers, onAssign}) {
  const [filter, setFilter] = useState("ativos");
  
  const filtered = orders.filter(o => {
    if(filter==="ativos") return !isDone(o.status) && o.status!=="encomenda";
    if(filter==="encomenda") return o.status==="encomenda";
    if(filter==="concluidos") return isDone(o.status);
    return true;
  });

  return (
    <div style={{padding:20}}>
      <div style={{display:"flex",gap:8,marginBottom:20,overflowX:"auto",paddingBottom:5}}>
        {[["ativos","🔥 Ativos"],["encomenda","📅 Encomendas"],["concluidos","✅ Concluídos"]].map(([v,l])=>(
          <Pill key={v} active={filter===v} onClick={()=>setFilter(v)} label={l}/>
        ))}
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        {filtered.length===0 ? <div style={{textAlign:"center",padding:40,color:C.brown,opacity:0.5}}>Nenhum pedido encontrado.</div> : 
          filtered.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).map(order => (
          <Card key={order.id} style={{padding:0,overflow:"hidden"}}>
            <div style={{padding:16,borderBottom:`1px solid ${C.parchment}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:C.parchment+"44"}}>
              <div>
                <span style={{fontSize:11,fontWeight:800,color:C.brown,background:C.cream,padding:"3px 8px",borderRadius:6,marginRight:8}}>#{order.id.slice(-4).toUpperCase()}</span>
                <span style={{fontSize:12,color:C.brown,fontWeight:600}}>{fmtDt(order.createdAt)}</span>
              </div>
              <SBadge status={order.status}/>
            </div>
            
            <div style={{padding:16}}>
              <div style={{fontSize:18,fontWeight:900,color:C.espresso,marginBottom:4}}>{order.customerName}</div>
              <div style={{fontSize:14,color:C.brown,marginBottom:12,lineHeight:1.4}}>📍 {order.address}</div>
              
              <div style={{background:C.cream,borderRadius:12,padding:12,marginBottom:15}}>
                {order.items?.map((it,idx)=>(
                  <div key={idx} style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4,color:C.espresso}}>
                    <span><b>{it.q}x</b> {it.name}</span>
                    <span style={{fontWeight:700}}>{fmt(it.price * it.q)}</span>
                  </div>
                ))}
                <div style={{marginTop:8,paddingTop:8,borderTop:`1px solid ${C.parchment}`,display:"flex",justifyContent:"space-between",fontWeight:800,color:C.terracotta}}>
                  <span>TOTAL</span>
                  <span>{fmt(order.total)}</span>
                </div>
              </div>

              {/* SELEÇÃO DE ENTREGADOR */}
              {!isDone(order.status) && (
                <div style={{marginBottom:15, padding:10, background:"#f0f9ff", borderRadius:12, border:"1px solid #bae6fd"}}>
                  <label style={{fontSize:11, fontWeight:800, color:"#0369a1", display:"block", marginBottom:6, textTransform:"uppercase"}}>🛵 Atribuir Entregador:</label>
                  <select 
                    value={order.entregadorId || ""} 
                    onChange={(e) => onAssign(order.id, e.target.value)}
                    style={{
                      width:"100%", padding:"10px", borderRadius:10, border:"1.5px solid #7dd3fc",
                      background:"#fff", fontSize:14, color:"#0c4a6e", fontWeight:700
                    }}
                  >
                    <option value="">Selecione um entregador...</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{display:"flex",gap:8}}>
                <WaButton phone={order.customerPhone} label="Cliente" style={{flex:1}}/>
                {!isDone(order.status) && (
                  <select 
                    value={order.status} 
                    onChange={(e)=>onStatus(order.id, e.target.value)}
                    style={{flex:1.5,padding:"10px",borderRadius:12,border:`1.5px solid ${C.parchment}`,background:C.warmWhite,fontWeight:700,fontSize:13,color:C.espresso}}
                  >
                    {Object.entries(ORDER_STATUS).map(([v,l])=><option key={v} value={v}>{l}</option>)}
                  </select>
                )}
                <button onClick={()=>onDelete(order.id)} style={{padding:"10px 15px",borderRadius:12,border:"none",background:"#fee2e2",color:"#dc2626",cursor:"pointer"}}>🗑️</button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── FINANCEIRO PAGE ────────────────────────────────────────────
function FinanceiroPage({orders, caixaHistory, onCaixaClose, drivers}) {
  const [view, setView] = useState("resumo");
  const done = orders.filter(o=>isDone(o.status));
  
  const total = done.reduce((acc,o)=>acc+(parseFloat(o.total)||0),0);
  const deliveryTotal = done.reduce((acc,o)=>acc+(parseFloat(o.deliveryFee)||0),0);

  return (
    <div style={{padding:20}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
        <StatCard label="Faturamento" value={fmt(total)} color={C.espresso} isFull/>
        <StatCard label="Pedidos" value={done.length} color={C.brown}/>
        <StatCard label="Entregas" value={fmt(deliveryTotal)} color={C.terracotta}/>
      </div>
      
      <Card style={{padding:20}}>
        <div style={{fontSize:16,fontWeight:900,color:C.espresso,marginBottom:15}}>Fechamento de Caixa</div>
        <BtnPrimary onClick={()=>onCaixaClose({date:new Date().toISOString(),value:total,orders:done.length})}>
          FECHAR CAIXA HOJE
        </BtnPrimary>
      </Card>
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────
export default function AdminLayout({user}) {
  const [tab, setTab] = useState("pedidos");
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [caixaHistory, setCaixaHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [synced, setSynced] = useState(true);

  const showToast = (msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),2800);};

  useEffect(() => {
    const unsubOrders = onSnapshot(collection(db, "pedidos"), (snap) => {
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    const unsubClients = onSnapshot(collection(db, "clientes"), (snap) => {
      setClients(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qDrivers = query(collection(db, "users"), where("role", "==", "driver"));
    const unsubDrivers = onSnapshot(qDrivers, (snap) => {
      setDrivers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubOrders(); unsubClients(); unsubDrivers(); };
  }, []);

  const handleStatus = async (id, status) => {
    await updateDoc(doc(db, "pedidos", id), { status });
    showToast(`Status: ${ORDER_STATUS[status]}`);
  };

  const handleAssignDriver = async (pedidoId, entregadorId) => {
    try {
      await updateDoc(doc(db, "pedidos", pedidoId), { 
        entregadorId: entregadorId 
      });
      const driverName = drivers.find(d => d.id === entregadorId)?.name || "Ninguém";
      showToast(`Entregador ${driverName} atribuído!`);
    } catch (e) {
      showToast("Erro ao atribuir entregador.", "error");
    }
  };

  const handleSave = async (order) => {
    const docRef = doc(collection(db, "pedidos"));
    await setDoc(docRef, { ...order, createdAt: new Date().toISOString() });
    
    const cRef = doc(db, "clientes", order.customerPhone);
    const cSnap = await getDoc(cRef);
    if(!cSnap.exists()) {
      await setDoc(cRef, { name: order.customerName, phone: order.customerPhone, address: order.address, totalOrders: 1 });
    } else {
      await updateDoc(cRef, { totalOrders: (cSnap.data().totalOrders || 0) + 1 });
    }
    
    setTab("pedidos");
    showToast("Pedido registrado!");
  };

  const handleDelete = async (id) => {
    if(window.confirm("Excluir pedido?")) {
      await deleteDoc(doc(db, "pedidos", id));
      showToast("Pedido removido.", "error");
    }
  };

  const ativos = orders.filter(o=>!isDone(o.status)&&o.status!=="encomenda").length;

  return (
    <div style={{minHeight:"100vh",background:C.cream,paddingBottom:50}}>
      {toast && <Toast msg={toast.msg} type={toast.type}/>}
      <Header tab={tab} setTab={setTab} user={user} ativos={ativos} synced={synced}/>
      
      {loading ? (
        <div style={{padding:100,textAlign:"center"}}><Spinner/></div>
      ) : (
        <>
          {tab==="pedidos"  && <PedidosPage orders={orders} onStatus={handleStatus} onDelete={handleDelete} drivers={drivers} onAssign={handleAssignDriver}/>}
          {tab==="novo"     && <NovoPedido onSave={handleSave} showToast={showToast} clients={clients}/>}
          {tab==="clientes" && <ClientesPage clients={clients} orders={orders}/>}
          {tab==="fin"      && <FinanceiroPage orders={orders} drivers={drivers}/>}
          {tab==="analise"  && <AnalisePage orders={orders} clients={clients}/>}
        </>
      )}
    </div>
  );
}
