import { useState } from "react";
import { C, fmt, fmtDt, isDone, PAYMENT_METHODS } from "../utils/constants.js";
import { Card, StatCard, Modal, WaButton } from "../components/UI.jsx";

function WaModal({message, onClose}) {
  const [number,setNumber]=useState("");
  function send(){if(!number.trim())return;window.open(`https://wa.me/55${number.replace(/\D/g,"")}?text=${encodeURIComponent(message)}`,"_blank");onClose();}
  return (
    <div>
      <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:18,fontWeight:900,color:C.brown,marginBottom:6}}>📲 Enviar Relatório</div>
      <p style={{fontFamily:"Georgia,serif",fontSize:13,color:C.espresso,marginBottom:14}}>Informe o número do destinatário:</p>
      <input value={number} onChange={e=>setNumber(e.target.value)} placeholder="(75) 9 8119-4734"
        style={{width:"100%",padding:"12px 14px",borderRadius:12,border:`1.5px solid ${C.parchment}`,background:"#fff",fontFamily:"Georgia,serif",fontSize:14,outline:"none",boxSizing:"border-box",marginBottom:14}}/>
      <div style={{display:"flex",gap:8}}>
        <button onClick={send} style={{flex:1,padding:"12px",borderRadius:11,border:"none",cursor:"pointer",background:"#25D366",color:"#fff",fontFamily:"Georgia,serif",fontSize:14,fontWeight:700}}>Enviar 📲</button>
        <button onClick={onClose} style={{flex:1,padding:"12px",borderRadius:11,border:`1.5px solid ${C.parchment}`,background:"transparent",color:C.rust,fontFamily:"Georgia,serif",fontSize:14,cursor:"pointer"}}>Cancelar</button>
      </div>
    </div>
  );
}

export default function AnalisePage({orders, clients, caixaHistory}) {
  const [waModal,setWaModal]=useState(false);
  const done=orders.filter(o=>isDone(o.status));

  const topClientes=[...clients].sort((a,b)=>(b.orders||0)-(a.orders||0)).slice(0,10);
  const top3=topClientes.slice(0,3);

  const itemMap={};
  done.forEach(o=>o.items?.forEach(it=>{
    if(!itemMap[it.name])itemMap[it.name]={name:it.name,qty:0,revenue:0};
    itemMap[it.name].qty+=it.qty; itemMap[it.name].revenue+=it.price*it.qty;
  }));
  const itemRanking=Object.values(itemMap).sort((a,b)=>b.qty-a.qty);
  const topItems=itemRanking.slice(0,5);
  const lowItems=itemRanking.slice(-3).reverse();

  const bairroMap={};
  done.forEach(o=>{if(!o.address)return;const p=o.address.split(",");const b=(p[2]||p[1]||p[0]||"").trim();if(b)bairroMap[b]=(bairroMap[b]||0)+1;});
  const topBairros=Object.entries(bairroMap).sort((a,b)=>b[1]-a[1]).slice(0,5);

  const payMap={};
  done.forEach(o=>{payMap[o.payment]=(payMap[o.payment]||0)+1;});
  const payRanking=PAYMENT_METHODS.map(m=>({...m,count:payMap[m.id]||0})).sort((a,b)=>b.count-a.count);

  const cidMap={};
  done.forEach(o=>{const c=o.cidade||"Não informada";cidMap[c]=(cidMap[c]||0)+1;});

  const totalRev=done.reduce((s,o)=>s+o.total,0);
  const totalFrete=done.reduce((s,o)=>s+(o.freight||0),0);
  const totalDespesas=caixaHistory.reduce((s,c)=>s+c.value,0);

  const medals=["🥇","🥈","🥉","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟"];

  function buildReport(){
    const now=new Date().toLocaleString("pt-BR");
    return [
      `📊 *ANÁLISE GERAL - Casa da Empada Artesanal*`,`🗓️ ${now}`,``,
      `━━━━━━━━━━━━━━━━━━━━`,`💰 *FINANCEIRO*`,
      `• Faturamento: ${fmt(totalRev)}`,`• Pedidos: ${done.length}`,
      `• Ticket médio: ${fmt(done.length?totalRev/done.length:0)}`,
      `• Fretes: ${fmt(totalFrete)}`,`• Despesas: ${fmt(totalDespesas)}`,``,
      `━━━━━━━━━━━━━━━━━━━━`,`🏆 *TOP 3 CLIENTES*`,
      ...top3.map((c,i)=>`${i+1}. ${c.name} — ${c.orders||0} pedidos · ${fmt(c.total||0)}`),``,
      `━━━━━━━━━━━━━━━━━━━━`,`🥧 *MAIS VENDIDOS*`,
      ...topItems.map((it,i)=>`${i+1}. ${it.name} — ${it.qty} un`),``,
      `📉 *MENOS VENDIDOS*`,...lowItems.map(it=>`• ${it.name} — ${it.qty} un`),``,
      `━━━━━━━━━━━━━━━━━━━━`,`💳 *PAGAMENTOS*`,
      ...payRanking.filter(p=>p.count>0).map(p=>`• ${p.label}: ${p.count} usos`),``,
      topBairros.length?`📍 *BAIRROS*\n${topBairros.map(([b,n])=>`• ${b}: ${n}`).join("\n")}`:"",
    ].filter(l=>l!=="").join("\n");
  }

  const Section=({title,children})=>(
    <Card style={{padding:16,marginBottom:12}}>
      <div style={{fontFamily:"Georgia,serif",fontSize:11,fontWeight:700,color:C.rust,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>{title}</div>
      {children}
    </Card>
  );
  const Row=({left,right,sub,color=C.terracotta})=>(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${C.parchment}`}}>
      <div><div style={{fontFamily:"Georgia,serif",fontSize:13,color:C.espresso}}>{left}</div>{sub&&<div style={{fontSize:11,color:C.sand}}>{sub}</div>}</div>
      <span style={{fontFamily:"Georgia,serif",fontSize:13,fontWeight:700,color}}>{right}</span>
    </div>
  );

  return (
    <div style={{padding:"12px 14px",maxWidth:640,margin:"0 auto",paddingBottom:40}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
        <StatCard emoji="💰" label="Faturamento" value={fmt(totalRev)}/>
        <StatCard emoji="📦" label="Pedidos" value={done.length} sub="concluídos"/>
        <StatCard emoji="🎯" label="Ticket Médio" value={fmt(done.length?totalRev/done.length:0)}/>
        <StatCard emoji="🛵" label="Fretes" value={fmt(totalFrete)}/>
      </div>

      <Section title="🏆 Top 10 Clientes">
        {topClientes.length===0?<div style={{color:C.sand,fontFamily:"Georgia,serif",fontSize:13,textAlign:"center",padding:12}}>Sem dados</div>
          :topClientes.map((c,i)=>(
            <div key={c.name||i} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:`1px solid ${C.parchment}`}}>
              <span style={{fontSize:16,width:24,flexShrink:0}}>{medals[i]}</span>
              <div style={{flex:1}}>
                <div style={{fontFamily:"Georgia,serif",fontSize:13,color:C.espresso,fontWeight:i<3?700:400}}>{c.name}</div>
                <div style={{fontFamily:"Georgia,serif",fontSize:11,color:C.sand}}>{c.orders||0} pedidos</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontFamily:"Georgia,serif",fontSize:13,fontWeight:700,color:C.terracotta}}>{fmt(c.total||0)}</span>
                {c.whatsapp&&<WaButton phone={c.whatsapp} size={28}/>}
              </div>
            </div>
          ))}
      </Section>

      {topItems.length>0&&<Section title="🥧 Mais Vendidos">{topItems.map((it,i)=><Row key={it.name} left={`${medals[i]} ${it.name}`} right={`${it.qty} un`} sub={fmt(it.revenue)}/>)}</Section>}
      {lowItems.length>0&&<Section title="📉 Menos Vendidos">{lowItems.map(it=><Row key={it.name} left={it.name} right={`${it.qty} un`} color={C.rust}/>)}</Section>}

      <Section title="💳 Formas de Pagamento">
        {payRanking.map((p,i)=><Row key={p.id} left={`${i===0?"👑":i===payRanking.length-1?"⚠️":"•"} ${p.label}`} right={`${p.count} uso${p.count!==1?"s":""}`} color={i===0?C.sage:i===payRanking.length-1?C.rust:C.terracotta}/>)}
      </Section>

      {topBairros.length>0&&<Section title="📍 Bairros com Mais Pedidos">{topBairros.map(([b,n],i)=><Row key={b} left={`${medals[i]} ${b}`} right={`${n} pedido${n!==1?"s":""}`}/>)}</Section>}

      {Object.keys(cidMap).length>0&&<Section title="🗺️ Por Cidade">{Object.entries(cidMap).sort((a,b)=>b[1]-a[1]).map(([c,n])=><Row key={c} left={c} right={`${n} pedido${n!==1?"s":""}`}/>)}</Section>}

      <button onClick={()=>setWaModal(true)} style={{width:"100%",padding:15,borderRadius:14,border:"none",cursor:"pointer",background:"linear-gradient(135deg,#25D366,#128C7E)",color:"#fff",fontFamily:"Georgia,serif",fontSize:15,fontWeight:700,boxShadow:"0 4px 20px rgba(37,211,102,.35)"}}>
        📊 Gerar Relatório e Enviar por WhatsApp
      </button>

      {waModal&&<Modal onClose={()=>setWaModal(false)}><WaModal message={buildReport()} onClose={()=>setWaModal(false)}/></Modal>}
    </div>
  );
}
