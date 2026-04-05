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
      
      // Filtra pedidos destinados a este entregador que ainda não foram entregues
      const meusNovos = all.filter(o => o.entregadorId === user.uid && o.status !== "entregue");
      
      // Toca aviso se um novo pedido aparecer para ele
      if (all.length > orders.length && orders.length > 0) {
          const jaTinhaEsse = orders.find(old => old.id === meusNovos[meusNovos.length-1]?.id);
          if(!jaTinhaEsse) playBeep();
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
      showToast("Entrega finalizada com sucesso!");
      setConfModal(null);
      setRecVal("");
    } catch(e) {
      showToast("Erro ao finalizar entrega.","error");
    }
  }

  // FILTRO MÁGICO: Só pega o que é DESTE entregador e está ENTREGUE
  const filtered = orders.filter(o => {
    if (o.status !== "entregue") return false;
    if (o.entregadorId !== user.uid) return false; 

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

  // Pedidos pendentes específicos para este entregador
  const pedidosPendentes = orders.filter(o => o.status !== "entregue" && o.entregadorId === user.uid);

  if (loading) return (
    <div style={{minHeight:"100vh",background:C.espresso,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <Spinner size={40} color={C.cream}/>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:C.parchment,paddingBottom:100}}>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      
      {/* Header Individualizado */}
      <div style={{background:`linear-gradient(135deg,${C.espresso},${C.brown})`,padding:"24px 20px",borderRadius:"0 0 32px 32px",boxShadow:"0 10px 30px rgba(0,0,0,0.15)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
          <div>
            <div style={{color:C.sand,fontSize:13,textTransform:"uppercase",letterSpacing:1,fontWeight:700}}>🛵 Minha Carteira</div>
            <div style={{color:"#fff",fontSize:22,fontWeight:900,fontFamily:"'Playfair Display',serif"}}>{user.name?.split(" ")[0]}</div>
          </div>
          <button onClick={()=>signOut(auth)} style={{background:"rgba(255,255,255,0.1)",border:"none",padding:"10px",borderRadius:12,color:"#fff",cursor:"pointer"}}>🚪 Sair</button>
        </div>

        <div style={{display:"flex",background:"rgba(0,0,0,0.2)",borderRadius:16,padding:4}}>
          <button onClick={()=>setTab("entregas")} style={{flex:1,padding:"12px",borderRadius:12,border:"none",background:tab==="entregas"?C.warmWhite:"transparent",color:tab==="entregas"?C.espresso:"#fff",fontWeight:700,fontSize:14,transition:".3s"}}>📦 Meus Pedidos</button>
          <button onClick={()=>setTab("stats")} style={{flex:1,padding:"12px",borderRadius:12,border:"none",background:tab==="stats"?C.warmWhite:"transparent",color:tab==="stats"?C.espresso:"#fff",fontWeight:700,fontSize:14,transition:".3s"}}>📊 Produtividade</button>
        </div>
      </div>

      <div style={{padding:20}}>
        {tab === "entregas" ? (
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {pedidosPendentes.length === 0 ? (
              <div style={{textAlign:"center",padding:"60px 20px",color:C.brown,opacity:0.6}}>
                <div style={{fontSize:40,marginBottom:12}}>😴</div>
                <div style={{fontSize:16,fontWeight:600}}>Tudo limpo por aqui!</div>
                <div style={{fontSize:13,marginTop:4}}>Aguardando o ADM te enviar pedidos.</div>
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
                    <div style={{background:"#dcfce7",color:"#166534",padding:"8px 12px",borderRadius:10,fontSize:13,fontWeight:700}}>🛵 Sua Taxa: {fmt(order.deliveryFee)}</div>
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
              <button onClick={()=>setPeriod("hoje")} style={{flex:1,padding:10,borderRadius:10,border:"none",background:period==="hoje"?C.terracotta:C.warmWhite,color:period==="hoje"?"#fff":C.brown,fontSize:13,fontWeight:700}}>Hoje</button>
              <button onClick={()=>setPeriod("mes")} style={{flex:1,padding:10,borderRadius:10,border:"none",background:period==="mes"?C.terracotta:C.warmWhite,color:period==="mes"?"#fff":C.brown,fontSize:13,fontWeight:700}}>Este Mês</button>
              <button onClick={()=>setPeriod("tudo")} style={{flex:1,padding:10,borderRadius:10,border:"none",background:period==="tudo"?C.terracotta:C.warmWhite,color:period==="tudo"?"#fff":C.brown,fontSize:13,fontWeight:700}}>Histórico</button>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
              <StatCard label="Entregas" value={stats.total} color={C.espresso} />
              <StatCard label="Meus Ganhos" value={fmt(stats.earnings)} color="#16a34a" />
              <StatCard label="Valor em Mãos" value={fmt(stats.revenue)} color={C.terracotta} isFull />
            </div>

            <div style={{fontSize:16,fontWeight:800,color:C.espresso,marginBottom:15,fontFamily:"'Playfair Display',serif"}}>Suas Entregas Recentes</div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {filtered.length === 0 ? (
                <div style={{textAlign:"center",padding:30,color:C.brown,opacity:0.5}}>Nenhuma entrega registrada.</div>
              ) : (
                filtered.sort((a,b)=>new Date(b.deliveredAt)-new Date(a.deliveredAt)).map(o => (
                  <Card key={o.id} style={{padding:15,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div style={{fontSize:14,fontWeight:800,color:C.espresso}}>{o.customerName}</div>
                      <div style={{fontSize:11,color:C.brown}}>{fmtDt(o.deliveredAt)}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:14,fontWeight:800,color:"#16a34a"}}>+{fmt(o.deliveryFee)}</div>
                      <div style={{fontSize:10,color:C.brown}}>{o.paymentMethod}</div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {confModal && (
        <Modal onClose={()=>setConfModal(null)} title="Confirmar Entrega">
          <div style={{marginBottom:20}}>
            <label style={{display:"block",fontSize:13,fontWeight:700,color:C.brown,marginBottom:8}}>VALOR RECEBIDO (R$)</label>
            <input type="number" value={recVal} onChange={e=>setRecVal(e.target.value)} placeholder="0,00" style={fieldStyle({fontSize:20,textAlign:"center"})} />
            <p style={{fontSize:12,color:C.brown,marginTop:8,textAlign:"center"}}>Informe o valor total pago pelo cliente.</p>
          </div>
          <div style={{display:"flex",gap:12}}>
            <button onClick={()=>{setConfModal(null);setRecVal("");}} style={{flex:1,padding:"13px",borderRadius:12,border:`1.5px solid ${C.parchment}`,background:"transparent",color:C.espresso,fontFamily:"Georgia,serif",fontSize:14,cursor:"pointer"}}>Cancelar</button>
            <button onClick={()=>handleDelivered(confModal)} style={{flex:1,padding:"13px",borderRadius:12,border:"none",background:"#16a34a",color:"#fff",fontFamily:"Georgia,serif",fontSize:14,fontWeight:700,cursor:"pointer"}}>✅ Confirmar</button>
          </div>
        </Modal>
      )}

      {/* Suporte Direto ao ADM */}
      <div style={{position:"fixed",bottom:24,right:16,display:"flex",flexDirection:"column",gap:10,zIndex:90}}>
        <a href={`https://wa.me/${WHATSAPP_ADMIN}`} target="_blank" rel="noreferrer"
          style={{width:50,height:50,borderRadius:"50%",background:"#2563eb",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,boxShadow:"0 4px 16px rgba(37,99,235,.4)",textDecoration:"none"}}>👨‍💼</a>
      </div>
    </div>
  );
}
    if (period === "hoje") return d.toDateString() === now.toDateString();
    if (period === "mes") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    return true;
  });

  const stats = {
    total: filtered.length,
    revenue: filtered.reduce((acc, o) => acc + (parseFloat(o.total) || 0), 0),
    earnings: filtered.reduce((acc, o) => acc + (parseFloat(o.deliveryFee) || 0), 0),
  };

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
            <div style={{color:C.sand,fontSize:13,textTransform:"uppercase",letterSpacing:1,fontWeight:700}}>🛵 Entregador</div>
            <div style={{color:"#fff",fontSize:22,fontWeight:900,fontFamily:"'Playfair Display',serif"}}>{user.name?.split(" ")[0]}</div>
          </div>
          <button onClick={()=>signOut(auth)} style={{background:"rgba(255,255,255,0.1)",border:"none",padding:"10px",borderRadius:12,color:"#fff",cursor:"pointer"}}>🚪 Sair</button>
        </div>

        <div style={{display:"flex",background:"rgba(0,0,0,0.2)",borderRadius:16,padding:4}}>
          <button onClick={()=>setTab("entregas")} style={{flex:1,padding:"12px",borderRadius:12,border:"none",background:tab==="entregas"?C.warmWhite:"transparent",color:tab==="entregas"?C.espresso:"#fff",fontWeight:700,fontSize:14,transition:".3s"}}>📦 Pedidos</button>
          <button onClick={()=>setTab("stats")} style={{flex:1,padding:"12px",borderRadius:12,border:"none",background:tab==="stats"?C.warmWhite:"transparent",color:tab==="stats"?C.espresso:"#fff",fontWeight:700,fontSize:14,transition:".3s"}}>📊 Meus Ganhos</button>
        </div>
      </div>

      <div style={{padding:20}}>
        {tab === "entregas" ? (
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {orders.filter(o => o.status !== "entregue").length === 0 ? (
              <div style={{textAlign:"center",padding:"40px 20px",color:C.brown,opacity:0.6}}>
                <div style={{fontSize:40,marginBottom:12}}>😴</div>
                <div style={{fontSize:16,fontWeight:600}}>Nenhum pedido pendente</div>
              </div>
            ) : (
              orders.filter(o => o.status !== "entregue").map(order => (
                <Card key={order.id} style={{padding:20,borderLeft:`6px solid ${order.status==="em_entrega"?C.terracotta:C.sand}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
                    <span style={{background:C.cream,padding:"4px 10px",borderRadius:8,fontSize:12,fontWeight:800,color:C.brown}}>#{order.id.slice(-4).toUpperCase()}</span>
                    <span style={{fontSize:12,color:C.brown,fontWeight:700}}>{fmtDt(order.createdAt)}</span>
                  </div>
                  
                  <div style={{marginBottom:15}}>
                    <div style={{fontSize:18,fontWeight:900,color:C.espresso,marginBottom:4}}>{order.customerName}</div>
                    <div style={{fontSize:14,color:C.brown,lineHeight:1.4}}>📍 {order.address}</div>
                  </div>

                  <div style={{display:"flex",gap:8,marginBottom:15,flexWrap:"wrap"}}>
                    <div style={{background:C.parchment,padding:"8px 12px",borderRadius:10,fontSize:13}}>💰 {fmt(order.total)}</div>
                    <div style={{background:"#dcfce7",color:"#166534",padding:"8px 12px",borderRadius:10,fontSize:13,fontWeight:700}}>🛵 Taxa: {fmt(order.deliveryFee)}</div>
                  </div>

                  <div style={{display:"flex",gap:10}}>
                    <WaButton phone={order.customerPhone} label="WhatsApp" style={{flex:1}} />
                    {order.status === "em_entrega" ? (
                      <button onClick={()=>setConfModal(order)} style={{flex:1.5,background:"#16a34a",color:"#fff",border:"none",borderRadius:12,fontWeight:700,fontSize:14}}>✅ Finalizar</button>
                    ) : (
                      <button onClick={()=>updateDoc(doc(db,"pedidos",order.id),{status:"em_entrega"})} style={{flex:1.5,background:C.espresso,color:"#fff",border:"none",borderRadius:12,fontWeight:700,fontSize:14}}>🚀 Iniciar Entrega</button>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        ) : (
          <div>
            <div style={{display:"flex",gap:8,marginBottom:20}}>
              <button onClick={()=>setPeriod("hoje")} style={{flex:1,padding:10,borderRadius:10,border:"none",background:period==="hoje"?C.terracotta:C.warmWhite,color:period==="hoje"?"#fff":C.brown,fontSize:13,fontWeight:700}}>Hoje</button>
              <button onClick={()=>setPeriod("mes")} style={{flex:1,padding:10,borderRadius:10,border:"none",background:period==="mes"?C.terracotta:C.warmWhite,color:period==="mes"?"#fff":C.brown,fontSize:13,fontWeight:700}}>Este Mês</button>
              <button onClick={()=>setPeriod("tudo")} style={{flex:1,padding:10,borderRadius:10,border:"none",background:period==="tudo"?C.terracotta:C.warmWhite,color:period==="tudo"?"#fff":C.brown,fontSize:13,fontWeight:700}}>Total</button>
            </div>

            <div style={{display:"flex",gap:12,marginBottom:20}}>
              <StatCard label="Entregas" value={stats.total} color={C.espresso} />
              <StatCard label="Sua Taxa" value={fmt(stats.earnings)} color="#16a34a" />
              <StatCard label="Faturado" value={fmt(stats.revenue)} color={C.terracotta} isFull />
            </div>

            <div style={{fontSize:16,fontWeight:800,color:C.espresso,marginBottom:15,fontFamily:"'Playfair Display',serif"}}>Histórico de Entregas</div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {filtered.length === 0 ? (
                <div style={{textAlign:"center",padding:30,color:C.brown,opacity:0.5}}>Nenhuma entrega neste período.</div>
              ) : (
                filtered.sort((a,b)=>new Date(b.deliveredAt)-new Date(a.deliveredAt)).map(o => (
                  <Card key={o.id} style={{padding:15,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div style={{fontSize:14,fontWeight:800,color:C.espresso}}>{o.customerName}</div>
                      <div style={{fontSize:11,color:C.brown}}>{fmtDt(o.deliveredAt)}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:14,fontWeight:800,color:"#16a34a"}}>+{fmt(o.deliveryFee)}</div>
                      <div style={{fontSize:10,color:C.brown}}>{o.paymentMethod}</div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {confModal && (
        <Modal onClose={()=>setConfModal(null)} title="Confirmar Entrega">
          <div style={{marginBottom:20}}>
            <label style={{display:"block",fontSize:13,fontWeight:700,color:C.brown,marginBottom:8}}>VALOR RECEBIDO (R$)</label>
            <input type="number" value={recVal} onChange={e=>setRecVal(e.target.value)} placeholder="0,00" style={fieldStyle({fontSize:20,textAlign:"center"})} />
            <p style={{fontSize:12,color:C.brown,marginTop:8,textAlign:"center"}}>Informe o valor total pago pelo cliente.</p>
          </div>
          <div style={{display:"flex",gap:12}}>
            <button onClick={()=>{setConfModal(null);setRecVal("");}} style={{flex:1,padding:"13px",borderRadius:12,border:`1.5px solid ${C.parchment}`,background:"transparent",color:C.espresso,fontFamily:"Georgia,serif",fontSize:14,cursor:"pointer"}}>Cancelar</button>
            <button onClick={()=>handleDelivered(confModal)} style={{flex:1,padding:"13px",borderRadius:12,border:"none",background:"#16a34a",color:"#fff",fontFamily:"Georgia,serif",fontSize:14,fontWeight:700,cursor:"pointer"}}>✅ Confirmar</button>
          </div>
        </Modal>
      )}

      <div style={{position:"fixed",bottom:24,right:16,display:"flex",flexDirection:"column",gap:10,zIndex:90}}>
        <a href={`https://wa.me/${WHATSAPP_ADMIN}`} target="_blank" rel="noreferrer"
          style={{width:50,height:50,borderRadius:"50%",background:"#2563eb",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,boxShadow:"0 4px 16px rgba(37,99,235,.4)",textDecoration:"none"}}>👨‍💼</a>
      </div>
    </div>
  );
}
    if (period === "hoje") return d.toDateString() === now.toDateString();
    if (period === "mes") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    return true;
  });

  const stats = {
    total: filtered.length,
    revenue: filtered.reduce((acc, o) => acc + (parseFloat(o.total) || 0), 0),
    earnings: filtered.reduce((acc, o) => acc + (parseFloat(o.deliveryFee) || 0), 0),
  };

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
            <div style={{color:C.sand,fontSize:13,textTransform:"uppercase",letterSpacing:1,fontWeight:700}}>🛵 Entregador</div>
            <div style={{color:"#fff",fontSize:22,fontWeight:900,fontFamily:"'Playfair Display',serif"}}>{user.name?.split(" ")[0]}</div>
          </div>
          <button onClick={()=>signOut(auth)} style={{background:"rgba(255,255,255,0.1)",border:"none",padding:"10px",borderRadius:12,color:"#fff",cursor:"pointer"}}>🚪 Sair</button>
        </div>

        <div style={{display:"flex",background:"rgba(0,0,0,0.2)",borderRadius:16,padding:4}}>
          <button onClick={()=>setTab("entregas")} style={{flex:1,padding:"12px",borderRadius:12,border:"none",background:tab==="entregas"?C.warmWhite:"transparent",color:tab==="entregas"?C.espresso:"#fff",fontWeight:700,fontSize:14,transition:".3s"}}>📦 Pedidos</button>
          <button onClick={()=>setTab("stats")} style={{flex:1,padding:"12px",borderRadius:12,border:"none",background:tab==="stats"?C.warmWhite:"transparent",color:tab==="stats"?C.espresso:"#fff",fontWeight:700,fontSize:14,transition:".3s"}}>📊 Meus Ganhos</button>
        </div>
      </div>

      <div style={{padding:20}}>
        {tab === "entregas" ? (
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {orders.filter(o => o.status !== "entregue").length === 0 ? (
              <div style={{textAlign:"center",padding:"40px 20px",color:C.brown,opacity:0.6}}>
                <div style={{fontSize:40,marginBottom:12}}>😴</div>
                <div style={{fontSize:16,fontWeight:600}}>Nenhum pedido pendente</div>
              </div>
            ) : (
              orders.filter(o => o.status !== "entregue").map(order => (
                <Card key={order.id} style={{padding:20,borderLeft:`6px solid ${order.status==="em_entrega"?C.terracotta:C.sand}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
                    <span style={{background:C.cream,padding:"4px 10px",borderRadius:8,fontSize:12,fontWeight:800,color:C.brown}}>#{order.id.slice(-4).toUpperCase()}</span>
                    <span style={{fontSize:12,color:C.brown,fontWeight:700}}>{fmtDt(order.createdAt)}</span>
                  </div>
                  
                  <div style={{marginBottom:15}}>
                    <div style={{fontSize:18,fontWeight:900,color:C.espresso,marginBottom:4}}>{order.customerName}</div>
                    <div style={{fontSize:14,color:C.brown,lineHeight:1.4}}>📍 {order.address}</div>
                  </div>

                  <div style={{display:"flex",gap:8,marginBottom:15,flexWrap:"wrap"}}>
                    <div style={{background:C.parchment,padding:"8px 12px",borderRadius:10,fontSize:13}}>💰 {fmt(order.total)}</div>
                    <div style={{background:"#dcfce7",color:"#166534",padding:"8px 12px",borderRadius:10,fontSize:13,fontWeight:700}}>🛵 Taxa: {fmt(order.deliveryFee)}</div>
                  </div>

                  <div style={{display:"flex",gap:10}}>
                    <WaButton phone={order.customerPhone} label="WhatsApp" style={{flex:1}} />
                    {order.status === "em_entrega" ? (
                      <button onClick={()=>setConfModal(order)} style={{flex:1.5,background:"#16a34a",color:"#fff",border:"none",borderRadius:12,fontWeight:700,fontSize:14}}>✅ Finalizar</button>
                    ) : (
                      <button onClick={()=>updateDoc(doc(db,"pedidos",order.id),{status:"em_entrega"})} style={{flex:1.5,background:C.espresso,color:"#fff",border:"none",borderRadius:12,fontWeight:700,fontSize:14}}>🚀 Iniciar Entrega</button>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        ) : (
          <div>
            <div style={{display:"flex",gap:8,marginBottom:20}}>
              <button onClick={()=>setPeriod("hoje")} style={{flex:1,padding:10,borderRadius:10,border:"none",background:period==="hoje"?C.terracotta:C.warmWhite,color:period==="hoje"?"#fff":C.brown,fontSize:13,fontWeight:700}}>Hoje</button>
              <button onClick={()=>setPeriod("mes")} style={{flex:1,padding:10,borderRadius:10,border:"none",background:period==="mes"?C.terracotta:C.warmWhite,color:period==="mes"?"#fff":C.brown,fontSize:13,fontWeight:700}}>Este Mês</button>
              <button onClick={()=>setPeriod("tudo")} style={{flex:1,padding:10,borderRadius:10,border:"none",background:period==="tudo"?C.terracotta:C.warmWhite,color:period==="tudo"?"#fff":C.brown,fontSize:13,fontWeight:700}}>Total</button>
            </div>

            <div style={{display:"flex",gap:12,marginBottom:20}}>
              <StatCard label="Entregas" value={stats.total} color={C.espresso} />
              <StatCard label="Sua Taxa" value={fmt(stats.earnings)} color="#16a34a" />
              <StatCard label="Faturado" value={fmt(stats.revenue)} color={C.terracotta} isFull />
            </div>

            <div style={{fontSize:16,fontWeight:800,color:C.espresso,marginBottom:15,fontFamily:"'Playfair Display',serif"}}>Histórico de Entregas</div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {filtered.length === 0 ? (
                <div style={{textAlign:"center",padding:30,color:C.brown,opacity:0.5}}>Nenhuma entrega neste período.</div>
              ) : (
                filtered.sort((a,b)=>new Date(b.deliveredAt)-new Date(a.deliveredAt)).map(o => (
                  <Card key={o.id} style={{padding:15,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div style={{fontSize:14,fontWeight:800,color:C.espresso}}>{o.customerName}</div>
                      <div style={{fontSize:11,color:C.brown}}>{fmtDt(o.deliveredAt)}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:14,fontWeight:800,color:"#16a34a"}}>+{fmt(o.deliveryFee)}</div>
                      <div style={{fontSize:10,color:C.brown}}>{o.paymentMethod}</div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {confModal && (
        <Modal onClose={()=>setConfModal(null)} title="Confirmar Entrega">
          <div style={{marginBottom:20}}>
            <label style={{display:"block",fontSize:13,fontWeight:700,color:C.brown,marginBottom:8}}>VALOR RECEBIDO (R$)</label>
            <input type="number" value={recVal} onChange={e=>setRecVal(e.target.value)} placeholder="0,00" style={fieldStyle({fontSize:20,textAlign:"center"})} />
            <p style={{fontSize:12,color:C.brown,marginTop:8,textAlign:"center"}}>Informe o valor total pago pelo cliente.</p>
          </div>
          <div style={{display:"flex",gap:12}}>
            <button onClick={()=>{setConfModal(null);setRecVal("");}} style={{flex:1,padding:"13px",borderRadius:12,border:`1.5px solid ${C.parchment}`,background:"transparent",color:C.espresso,fontFamily:"Georgia,serif",fontSize:14,cursor:"pointer"}}>Cancelar</button>
            <button onClick={()=>handleDelivered(confModal)} style={{flex:1,padding:"13px",borderRadius:12,border:"none",background:"#16a34a",color:"#fff",fontFamily:"Georgia,serif",fontSize:14,fontWeight:700,cursor:"pointer"}}>✅ Confirmar</button>
          </div>
        </Modal>
      )}

      <div style={{position:"fixed",bottom:24,right:16,display:"flex",flexDirection:"column",gap:10,zIndex:90}}>
        <a href={`https://wa.me/${WHATSAPP_ADMIN}`} target="_blank" rel="noreferrer"
          style={{width:50,height:50,borderRadius:"50%",background:"#2563eb",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,boxShadow:"0 4px 16px rgba(37,99,235,.4)",textDecoration:"none"}}>👨‍💼</a>
      </div>
    </div>
  );
}
ConfModal(null)} title=\"Confirmar Entrega\">
          <div style={{marginBottom:20}}>
            <label style={{display:\"block\",fontSize:13,fontWeight:700,color:C.brown,marginBottom:8}}>VALOR RECEBIDO (R$)</label>
            <input type=\"number\" value={recVal} onChange={e=>setRecVal(e.target.value)} placeholder=\"0,00\" style={fieldStyle({fontSize:20,textAlign:\"center\"})} />
            <p style={{fontSize:12,color:C.brown,marginTop:8,textAlign:\"center\"}}>Informe o valor total pago pelo cliente.</p>
          </div>
          <div style={{display:\"flex\",gap:12}}>
            <button onClick={()=>{setConfModal(null);setRecVal(\"\");}} style={{flex:1,padding:\"13px\",borderRadius:12,border:`1.5px solid ${C.parchment}`,background:\"transparent\",color:C.espresso,fontFamily:\"Georgia,serif\",fontSize:14,cursor:\"pointer\"}}>Cancelar</button>
            <button onClick={()=>handleDelivered(confModal)} style={{flex:1,padding:\"13px\",borderRadius:12,border:\"none\",background:\"#16a34a\",color:\"#fff\",fontFamily:\"Georgia,serif\",fontSize:14,fontWeight:700,cursor:\"pointer\"}}>✅ Confirmar</button>
          </div>
        </Modal>
      )}

      {/* Botões flutuantes */}
      <div style={{position:\"fixed\",bottom:24,right:16,display:\"flex\",flexDirection:\"column\",gap:10,zIndex:90}}>
        <a href={`https://wa.me/${WHATSAPP_ADMIN}`} target=\"_blank\" rel=\"noreferrer\"
          style={{width:50,height:50,borderRadius:\"50%\",background:\"#2563eb\",display:\"flex\",alignItems:\"center\",justifyContent:\"center\",fontSize:22,boxShadow:\"0 4px 16px rgba(37,99,235,.4)\",textDecoration:\"none\"}}>👨‍💼</a>
      </div>
    </div>
  );
}
      if(prevSaiu.size>0) {
        for(const id of nowSaiu) { if(!prevSaiu.has(id)){playBeep();showToast("🛵 Novo pedido para entregar!","warn");break;} }
      }
      prevSaiu=nowSaiu;
      setOrders(all.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)));
      setLoading(false);
    },()=>setLoading(false));
    return()=>unsub();
  },[]);

  const deliveries = orders.filter(o=>o.status==="saiu");

  function rangeStart(p){const d=new Date();if(p==="hoje"){d.setHours(0,0,0,0);return d;}if(p==="semana"){d.setDate(d.getDate()-d.getDay());d.setHours(0,0,0,0);return d;}d.setDate(1);d.setHours(0,0,0,0);return d;}
  const myDone = orders.filter(o=>["entregue","retirado"].includes(o.status)&&new Date(o.createdAt)>=rangeStart(period));
  const myFretes = myDone.reduce((s,o)=>s+(o.freight||0),0);
  const myDinheiro = myDone.filter(o=>o.payment==="dinheiro").reduce((s,o)=>s+o.total,0);

  async function handleGoing(order) {
    if(order.address) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address+", "+order.cidade)}`, "_blank");
    }
  }

  async function handleDelivered(order) {
    const received = parseFloat(recVal.replace(",",".")||order.total)||order.total;
    const change = order.payment==="dinheiro" ? Math.max(0,received-order.total) : 0;
    if(order._docId) await updateDoc(doc(db,"orders",order._docId),{status:"entregue",deliveredAt:new Date().toISOString(),confirmedBy:user.uid,receivedValue:received,finalChange:change});
    setConfModal(null); setRecVal("");
    showToast("✅ Entrega confirmada!");
  }

  async function handleNotFound(order) {
    if(order._docId) await updateDoc(doc(db,"orders",order._docId),{status:"preparo",notFound:true,notFoundAt:new Date().toISOString()});
    const msg=`❌ Pedido ${order.id} não encontrado!\nCliente: ${order.customer}\nEndereço: ${order.address||"N/A"}\nEntregador: ${user.name}`;
    window.open(`https://wa.me/${WHATSAPP_ADMIN}?text=${encodeURIComponent(msg)}`,"_blank");
    showToast("Admin notificado!","warn");
  }

  return (
    <div style={{minHeight:"100vh",background:C.cream}}>
      {/* Header entregador */}
      <header style={{background:`linear-gradient(135deg,${C.espresso},${C.brown})`,padding:"12px 16px 0",boxShadow:`0 4px 24px rgba(0,0,0,0.3)`}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <Logo size={36}/>
          <div style={{flex:1}}>
            <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:15,fontWeight:900,color:C.cream}}>Olá, {user.name?.split(" ")[0]}! 👋</div>
            <div style={{fontSize:10,color:C.sand,letterSpacing:2}}>PAINEL DO ENTREGADOR</div>
          </div>
          {deliveries.length>0&&<div style={{background:C.terracotta,color:"#fff",borderRadius:20,padding:"3px 12px",fontSize:13,fontWeight:700,fontFamily:"Georgia,serif",animation:"pulse 2s infinite"}}>{deliveries.length} para entregar</div>}
          <button onClick={()=>signOut(auth)} style={{background:"rgba(255,255,255,0.1)",border:"none",color:C.sand,padding:"6px 10px",borderRadius:8,cursor:"pointer",fontSize:11,fontFamily:"Georgia,serif"}}>Sair</button>
        </div>
        <nav style={{display:"flex",gap:4}}>
          {[["entregas","🛵 Entregas"],["relatorio","📊 Meus Ganhos"]].map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:"9px",border:"none",cursor:"pointer",borderRadius:"8px 8px 0 0",background:tab===id?C.cream:"transparent",color:tab===id?C.brown:"#fff",fontFamily:"Georgia,serif",fontSize:12,fontWeight:700,transition:"all .2s"}}>{label}</button>
          ))}
        </nav>
      </header>

      {loading&&<Spinner label="Carregando entregas..."/>}

      {/* Aba Entregas */}
      {!loading&&tab==="entregas"&&(
        <div style={{padding:"14px",maxWidth:480,margin:"0 auto",paddingBottom:100}}>
          {deliveries.length===0?(
            <div style={{textAlign:"center",padding:"80px 20px",color:C.sand,fontFamily:"Georgia,serif"}}>
              <div style={{fontSize:64,marginBottom:16}}>🛵</div>
              <div style={{fontSize:16,fontWeight:700,color:C.brown}}>Nenhuma entrega pendente</div>
              <div style={{fontSize:13,marginTop:8}}>Aguarde novos pedidos...</div>
            </div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {deliveries.map(order=>(
                <Card key={order.id} style={{border:`2px solid ${C.teal}`}}>
                  <div style={{padding:"14px"}}>
                    {/* Info pedido */}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                      <div>
                        <div style={{fontFamily:"Georgia,serif",fontSize:15,fontWeight:700,color:C.brown}}>{order.id}</div>
                        <div style={{fontFamily:"Georgia,serif",fontSize:13,color:C.espresso,marginTop:2}}>👤 {order.customer}</div>
                        <div style={{fontFamily:"Georgia,serif",fontSize:12,color:C.sand,marginTop:1}}>📍 {order.address||"Retirada"}</div>
                        <div style={{fontFamily:"Georgia,serif",fontSize:12,color:C.sand}}>🏙️ {order.cidade||""}</div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontFamily:"Georgia,serif",fontSize:16,fontWeight:700,color:C.terracotta}}>{fmt(order.total)}</div>
                        {order.freight>0&&<div style={{fontFamily:"Georgia,serif",fontSize:12,color:C.teal}}>🛵 {fmt(order.freight)}</div>}
                        <div style={{fontFamily:"Georgia,serif",fontSize:11,color:C.sand,marginTop:2}}>
                          {PAYMENT_METHODS.find(m=>m.id===order.payment)?.label||order.payment}
                        </div>
                      </div>
                    </div>

                    {/* Itens resumo */}
                    <div style={{background:C.cream,borderRadius:8,padding:"8px 10px",marginBottom:10,fontFamily:"Georgia,serif",fontSize:11,color:C.espresso}}>
                      {order.items?.slice(0,3).map((it,i)=>(
                        <div key={i}>{it.qty}× {it.name}</div>
                      ))}
                      {order.items?.length>3&&<div style={{color:C.sand}}>+{order.items.length-3} itens...</div>}
                    </div>

                    {order.note&&<div style={{fontFamily:"Georgia,serif",fontSize:12,color:C.rust,fontStyle:"italic",marginBottom:10}}>📝 {order.note}</div>}

                    {/* Ações */}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
                      <button onClick={()=>handleGoing(order)} style={{padding:"11px",borderRadius:11,border:"none",cursor:"pointer",background:`linear-gradient(135deg,#3b82f6,#1d4ed8)`,color:"#fff",fontFamily:"Georgia,serif",fontSize:12,fontWeight:700}}>
                        📍 Ir Entregar
                      </button>
                      <button onClick={()=>{setConfModal(order);setRecVal(String(order.total));}} style={{padding:"11px",borderRadius:11,border:"none",cursor:"pointer",background:`linear-gradient(135deg,#16a34a,#15803d)`,color:"#fff",fontFamily:"Georgia,serif",fontSize:12,fontWeight:700}}>
                        ✅ Entregue
                      </button>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginTop:7}}>
                      <button onClick={()=>handleNotFound(order)} style={{padding:"10px",borderRadius:11,border:`1.5px solid #dc2626`,cursor:"pointer",background:"#fee2e2",color:"#dc2626",fontFamily:"Georgia,serif",fontSize:12,fontWeight:700}}>
                        ❌ Não Encontrado
                      </button>
                      <div style={{display:"flex",gap:6}}>
                        {order.customerPhone&&<WaButton phone={order.customerPhone} style={{flex:1,borderRadius:11,height:"100%"}} label="Cliente"/>}
                        <WaButton phone={WHATSAPP_ADMIN.replace("55","")} style={{flex:1,borderRadius:11,height:"100%",background:"#2563eb"}} label="Admin"/>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Aba Relatório */}
      {!loading&&tab==="relatorio"&&(
        <div style={{padding:"14px",maxWidth:480,margin:"0 auto",paddingBottom:100}}>
          <div style={{display:"flex",gap:5,marginBottom:14}}>
            {[["hoje","Hoje"],["semana","Semana"],["mes","Mês"]].map(([v,l])=>(
              <button key={v} onClick={()=>setPeriod(v)} style={{flex:1,padding:"9px 3px",borderRadius:10,border:`2px solid ${period===v?C.terracotta:C.parchment}`,background:period===v?C.terracotta:C.warmWhite,color:period===v?"#fff":C.brown,fontFamily:"Georgia,serif",fontSize:12,cursor:"pointer",fontWeight:700}}>{l}</button>
            ))}
          </div>
          <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
            <StatCard emoji="🛵" label="Entregas" value={myDone.length} sub="concluídas"/>
            <StatCard emoji="💰" label="Meus Fretes" value={fmt(myFretes)} accent={C.teal}/>
            <StatCard emoji="💵" label="Dinheiro" value={fmt(myDinheiro)} sub="em posse" accent={C.rust}/>
          </div>
          <Card style={{padding:14}}>
            <div style={{fontFamily:"Georgia,serif",fontSize:12,fontWeight:700,color:C.rust,letterSpacing:1,marginBottom:10}}>💵 ACERTO COM ADMIN</div>
            <div style={{display:"flex",justifyContent:"space-between",fontFamily:"Georgia,serif",fontSize:14,marginBottom:4}}>
              <span style={{color:C.espresso}}>Dinheiro recebido</span>
              <span style={{fontWeight:700,color:C.rust}}>{fmt(myDinheiro)}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontFamily:"Georgia,serif",fontSize:14,marginBottom:8}}>
              <span style={{color:C.espresso}}>Meus fretes</span>
              <span style={{fontWeight:700,color:C.teal}}>− {fmt(myFretes)}</span>
            </div>
            <div style={{borderTop:`2px solid ${C.parchment}`,paddingTop:8,display:"flex",justifyContent:"space-between",fontFamily:"Georgia,serif",fontSize:16,fontWeight:700}}>
              <span style={{color:C.brown}}>A entregar ao Admin</span>
              <span style={{color:C.terracotta}}>{fmt(Math.max(0,myDinheiro-myFretes))}</span>
            </div>
          </Card>
        </div>
      )}

      {/* Modal confirmar entrega */}
      {confModal&&(
        <Modal onClose={()=>{setConfModal(null);setRecVal("");}}>
          <div style={{textAlign:"center",marginBottom:16}}>
            <div style={{fontSize:40}}>✅</div>
            <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:18,fontWeight:900,color:C.brown,marginTop:8}}>Confirmar Entrega</div>
            <div style={{fontFamily:"Georgia,serif",fontSize:13,color:C.espresso,marginTop:4}}>Pedido {confModal.id} · {confModal.customer}</div>
            <div style={{fontFamily:"Georgia,serif",fontSize:15,fontWeight:700,color:C.terracotta,marginTop:4}}>{fmt(confModal.total)}</div>
          </div>
          {confModal.payment==="dinheiro"&&(
            <div style={{marginBottom:16}}>
              <div style={{fontFamily:"Georgia,serif",fontSize:12,fontWeight:700,color:C.rust,letterSpacing:1,marginBottom:6}}>VALOR RECEBIDO (R$)</div>
              <input value={recVal} onChange={e=>setRecVal(e.target.value)} placeholder="Valor recebido" style={{width:"100%",padding:"12px 14px",borderRadius:12,border:`1.5px solid ${C.parchment}`,background:"#fff",fontFamily:"Georgia,serif",fontSize:16,outline:"none",boxSizing:"border-box",textAlign:"center"}}/>
              {recVal&&<div style={{textAlign:"center",fontFamily:"Georgia,serif",fontSize:13,color:"#16a34a",marginTop:6,fontWeight:700}}>
                Troco: {fmt(Math.max(0,parseFloat(recVal.replace(",",".")||confModal.total)-confModal.total))}
              </div>}
            </div>
          )}
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{setConfModal(null);setRecVal("");}} style={{flex:1,padding:"13px",borderRadius:12,border:`1.5px solid ${C.parchment}`,background:"transparent",color:C.espresso,fontFamily:"Georgia,serif",fontSize:14,cursor:"pointer"}}>Cancelar</button>
            <button onClick={()=>handleDelivered(confModal)} style={{flex:1,padding:"13px",borderRadius:12,border:"none",background:"#16a34a",color:"#fff",fontFamily:"Georgia,serif",fontSize:14,fontWeight:700,cursor:"pointer"}}>✅ Confirmar</button>
          </div>
        </Modal>
      )}

      {/* Botões flutuantes */}
      <div style={{position:"fixed",bottom:24,right:16,display:"flex",flexDirection:"column",gap:10,zIndex:90}}>
        <a href={`https://wa.me/${WHATSAPP_ADMIN}`} target="_blank" rel="noreferrer"
          style={{width:50,height:50,borderRadius:"50%",background:"#2563eb",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,boxShadow:"0 4px 16px rgba(37,99,235,.4)",textDecoration:"none"}}>👨‍💼</a>
        <a href={`https://wa.me/${WHATSAPP_ADMIN}`} target="_blank" rel="noreferrer"
          style={{width:50,height:50,borderRadius:"50%",background:"#25D366",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,boxShadow:"0 4px 16px rgba(37,211,102,.4)",textDecoration:"none"}}>📲</a>
      </div>

      {toast&&<Toast msg={toast.msg} type={toast.type}/>}
      <style>{`@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}`}</style>
    </div>
  );
}
