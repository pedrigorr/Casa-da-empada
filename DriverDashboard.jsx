import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { collection, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { auth, db } from "./config.js";
import { C, fmt, fmtDt, PAYMENT_METHODS, WHATSAPP_ADMIN } from "./constants.js";
import { Toast, Spinner, Modal, StatCard, Card, fieldStyle, BtnPrimary, WaButton, Logo } from "./UI.jsx";

export default function DriverDashboard({user}) {
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [toast,    setToast]    = useState(null);
  const [tab,      setTab]      = useState("entregas");
  const [period,   setPeriod]   = useState("hoje");
  const [confModal,setConfModal]= useState(null); 
  const [recVal,   setRecVal]   = useState("");

  const showToast = (msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),2800);};

  function playBeep() {
    try {
      const ctx=new AudioContext();
      const osc=ctx.createOscillator();
      const gain=ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value=880; gain.gain.value=0.3;
      osc.start(); osc.stop(ctx.currentTime+0.3);
    } catch{}
  }

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "pedidos"), (snap) => {
      const all = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const meusNovos = all.filter(o => o.entregadorId === user.uid && o.status !== "entregue");
      if (all.length > orders.length && orders.length > 0) {
          const jaTinha = orders.find(old => old.id === meusNovos[meusNovos.length-1]?.id);
          if(!jaTinha) playBeep();
      }
      setOrders(all);
      setLoading(false);
    });
    return () => unsub();
  }, [orders.length, user.uid]);

  async function handleDelivered(order) {
    if(!order) return;
    try {
      const val = parseFloat(recVal) || 0;
      await updateDoc(doc(db, "pedidos", order.id), {
        status: "entregue",
        receivedValue: val,
        deliveredAt: new Date().toISOString()
      });
      showToast("Entrega finalizada!");
      setConfModal(null); setRecVal("");
    } catch(e) { showToast("Erro ao finalizar.","error"); }
  }

  const filtered = orders.filter(o => {
    if (o.status !== "entregue" || o.entregadorId !== user.uid) return false; 
    const d = new Date(o.deliveredAt);
    const now = new Date();
    if (period === "hoje") return d.toDateString() === now.toDateString();
    if (period === "mes") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    return true;
  });

  const stats = {
    total: filtered.length,
    revenue: filtered.reduce((acc, o) => acc + (parseFloat(o.total) || 0), 0),
    earnings: filtered.reduce((acc, o) => acc + (parseFloat(o.deliveryFee) || 0), 0),
  };

  const pedidosPendentes = orders.filter(o => o.status !== "entregue" && o.entregadorId === user.uid);

  if (loading) return (
    <div style={{minHeight:"100vh",background:C.espresso,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <Spinner size={40} color={C.cream}/>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:C.parchment,paddingBottom:100}}>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      
      <div style={{background:`linear-gradient(135deg,${C.espresso},${C.brown})`,padding:"24px 20px",borderRadius:"0 0 32px 32px",boxShadow:"0 10px 30px rgba(0,0,0,0.15)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
          <div>
            <div style={{color:C.sand,fontSize:13,textTransform:"uppercase",letterSpacing:1,fontWeight:700}}>🛵 Minha Carteira</div>
            <div style={{color:"#fff",fontSize:22,fontWeight:900,fontFamily:"'Playfair Display',serif"}}>{user.name?.split(" ")[0]}</div>
          </div>
          <button onClick={()=>signOut(auth)} style={{background:"rgba(255,255,255,0.1)",border:"none",padding:"10px",borderRadius:12,color:"#fff",cursor:"pointer"}}>🚪 Sair</button>
        </div>
        <div style={{display:"flex",background:"rgba(0,0,0,0.2)",borderRadius:16,padding:4}}>
          <button onClick={()=>setTab("entregas")} style={{flex:1,padding:"12px",borderRadius:12,border:"none",background:tab==="entregas"?C.warmWhite:"transparent",color:tab==="entregas"?C.espresso:"#fff",fontWeight:700,fontSize:14}}>📦 Meus Pedidos</button>
          <button onClick={()=>setTab("stats")} style={{flex:1,padding:"12px",borderRadius:12,border:"none",background:tab==="stats"?C.warmWhite:"transparent",color:tab==="stats"?C.espresso:"#fff",fontWeight:700,fontSize:14}}>📊 Produtividade</button>
        </div>
      </div>

      <div style={{padding:20}}>
        {tab === "entregas" ? (
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {pedidosPendentes.length === 0 ? (
              <div style={{textAlign:"center",padding:"60px 20px",color:C.brown,opacity:0.6}}>
                <div style={{fontSize:40,marginBottom:12}}>😴</div>
                <div style={{fontSize:16,fontWeight:600}}>Tudo limpo!</div>
                <div style={{fontSize:13,marginTop:4}}>Aguardando pedidos do ADM.</div>
              </div>
            ) : (
              pedidosPendentes.map(order => (
                <Card key={order.id} style={{padding:20,borderLeft:`6px solid ${order.status==="em_entrega"?"#16a34a":C.terracotta}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
                    <span style={{background:C.cream,padding:"4px 10px",borderRadius:8,fontSize:12,fontWeight:800,color:C.brown}}>#{order.id.slice(-4).toUpperCase()}</span>
                    <span style={{fontSize:12,color:C.brown,fontWeight:700}}>{fmtDt(order.createdAt)}</span>
                  </div>
                  <div style={{marginBottom:15}}>
                    <div style={{fontSize:18,fontWeight:900,color:C.espresso,marginBottom:4}}>{order.customerName}</div>
                    <div style={{fontSize:14,color:C.brown,lineHeight:1.4}}>📍 {order.address}</div>
                    <div style={{fontSize:12,marginTop:8,color:C.terracotta,fontWeight:700}}>💳 Pagamento: {order.paymentMethod}</div>
                  </div>
                  <div style={{display:"flex",gap:8,marginBottom:15,flexWrap:"wrap"}}>
                    <div style={{background:C.parchment,padding:"8px 12px",borderRadius:10,fontSize:13}}>💰 Cobrar: {fmt(order.total)}</div>
                    <div style={{background:"#dcfce7",color:"#166534",padding:"8px 12px",borderRadius:10,fontSize:13,fontWeight:700}}>🛵 Taxa: {fmt(order.deliveryFee)}</div>
                  </div>
                  <div style={{display:"flex",gap:10}}>
                    <WaButton phone={order.customerPhone} label="WhatsApp" style={{flex:1}} />
                    {order.status === "em_entrega" ? (
                      <button onClick={()=>setConfModal(order)} style={{flex:1.5,background:"#16a34a",color:"#fff",border:"none",borderRadius:12,fontWeight:700,fontSize:14}}>✅ Finalizar</button>
                    ) : (
                      <button onClick={()=>updateDoc(doc(db,"pedidos",order.id),{status:"em_entrega"})} style={{flex:1.5,background:C.espresso,color:"#fff",border:"none",borderRadius:12,fontWeight:700,fontSize:14}}>🚀 Iniciar Rota</button>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        ) : (
          <div>
            <div style={{display:"flex",gap:8,marginBottom:20}}>
              {["hoje", "mes", "tudo"].map(p => (
                <button key={p} onClick={()=>setPeriod(p)} style={{flex:1,padding:10,borderRadius:10,border:"none",background:period===p?C.terracotta:C.warmWhite,color:period===p?"#fff":C.brown,fontSize:13,fontWeight:700,textTransform:"capitalize"}}>{p}</button>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
              <StatCard label="Entregas" value={stats.total} color={C.espresso} />
              <StatCard label="Meus Ganhos" value={fmt(stats.earnings)} color="#16a34a" />
              <StatCard label="Valor em Mãos" value={fmt(stats.revenue)} color={C.terracotta} isFull />
            </div>
            <div style={{fontSize:16,fontWeight:800,color:C.espresso,marginBottom:15,fontFamily:"'Playfair Display',serif"}}>Entregas Recentes</div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {filtered.length === 0 ? <div style={{textAlign:"center",padding:30,color:C.brown,opacity:0.5}}>Sem registros.</div> :
                filtered.sort((a,b)=>new Date(b.deliveredAt)-new Date(a.deliveredAt)).map(o => (
                  <Card key={o.id} style={{padding:15,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div><div style={{fontSize:14,fontWeight:800,color:C.espresso}}>{o.customerName}</div><div style={{fontSize:11,color:C.brown}}>{fmtDt(o.deliveredAt)}</div></div>
                    <div style={{textAlign:"right"}}><div style={{fontSize:14,fontWeight:800,color:"#16a34a"}}>+{fmt(o.deliveryFee)}</div><div style={{fontSize:10,color:C.brown}}>{o.paymentMethod}</div></div>
                  </Card>
                ))
              }
            </div>
          </div>
        )}
      </div>

      {confModal && (
        <Modal onClose={()=>setConfModal(null)} title="Confirmar Entrega">
          <div style={{marginBottom:20}}>
            <Lbl>VALOR RECEBIDO (R$)</Lbl>
            <input type="number" value={recVal} onChange={e=>setRecVal(e.target.value)} placeholder="0,00" style={fieldStyle({fontSize:20,textAlign:"center"})} />
          </div>
          <div style={{display:"flex",gap:12}}>
            <button onClick={()=>{setConfModal(null);setRecVal("");}} style={{flex:1,padding:"13px",borderRadius:12,border:`1.5px solid ${C.parchment}`,background:"transparent",color:C.espresso}}>Cancelar</button>
            <button onClick={()=>handleDelivered(confModal)} style={{flex:1,padding:"13px",borderRadius:12,border:"none",background:"#16a34a",color:"#fff",fontWeight:700}}>✅ Confirmar</button>
          </div>
        </Modal>
      )}

      <div style={{position:"fixed",bottom:24,right:16,zIndex:90}}>
        <a href={`https://wa.me/${WHATSAPP_ADMIN}`} target="_blank" rel="noreferrer" style={{width:50,height:50,borderRadius:"50%",background:"#2563eb",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,textDecoration:"none"}}>👨‍💼</a>
      </div>
    </div>
  );
      }
                    
