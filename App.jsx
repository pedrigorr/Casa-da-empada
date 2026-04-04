import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc } from "firebase/firestore";

// ═══════════════════════════════════════════════════════════════
// FIREBASE
// ═══════════════════════════════════════════════════════════════
const firebaseConfig = {
  apiKey: "AIzaSyCo4RIsapTYTAio7IMj-eCaFtUxpPUwbCI",
  authDomain: "casa-da-empada-7e07d.firebaseapp.com",
  projectId: "casa-da-empada-7e07d",
  storageBucket: "casa-da-empada-7e07d.firebasestorage.app",
  messagingSenderId: "698699143504",
  appId: "1:698699143504:web:b6963273f43404d7ef7455"
};
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// ═══════════════════════════════════════════════════════════════
// TEMA
// ═══════════════════════════════════════════════════════════════
const C = {
  cream:"#F7EDD8", parchment:"#EDD9B0", sand:"#D4A96A",
  terracotta:"#C4653A", rust:"#9B3E1A", brown:"#5C2E0E",
  espresso:"#2C1205", teal:"#4A9B8E", warmWhite:"#FDF8F0",
  shadow:"rgba(44,18,5,0.15)", gold:"#C8860B", sage:"#7A8C5C",
  insta:"linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)",
};

const WHATSAPP  = "557581194734";
const INSTAGRAM = "casadaempadaartesanal";
const CIDADES   = ["Inhambupe","Sátiro Dias","Outra"];

const MENU = {
  "🥧 Empadas":[
    {id:1,  name:"Empada de Frango",                                 price:7.00},
    {id:2,  name:"Empada Frango com Catupiry",                       price:8.00},
    {id:3,  name:"Empada Frango com Cheddar",                        price:8.00},
    {id:4,  name:"Empada Calabresa com Cheddar ou Catupiry",         price:8.00},
    {id:5,  name:"Sabor Afeto Doce (Leite Condensado)",              price:8.00},
    {id:6,  name:"Empada Camarão Cremoso",                           price:9.00},
    {id:7,  name:"Sabor Romeu e Julieta (Doce)",                     price:9.00},
    {id:8,  name:"Empada Gourmet Quiche c/ Bacon e Frango",          price:9.00},
    {id:9,  name:"Empada Carne Seca c/ Banana da Terra e Requeijão", price:9.00},
    {id:10, name:"Empada Charque com Catupiry",                      price:9.00},
    {id:11, name:"Empada Nutella",                                   price:10.00},
  ],
  "🍽️ Empadões":[
    {id:12, name:"Empadão Cremoso - Frango c/ Cheddar ou Catupiry",  price:18.00},
    {id:13, name:"Empadão Encantado - Doce de Leite Gourmet",        price:17.00},
    {id:14, name:"Empadão do Mar - Camarão Cremoso",                 price:22.00},
    {id:15, name:"Empadão Carne Seca c/ Banana da Terra e Catupiry", price:22.00},
    {id:16, name:"Empadão Charque com Catupiry",                     price:22.00},
    {id:17, name:"Empadão Quiche Frango com Bacon",                  price:21.00},
  ],
  "📦 Combos":[
    {id:18, name:"Empada Nutella 4un (chocolate/nutella)",           price:21.50},
    {id:19, name:"COMBO Lanchinho (7 Empadas M + Coca 350ml)",       price:39.90},
    {id:20, name:"COMBO Só para Mim (5 Empadas G + Coca 350ml)",     price:43.00},
    {id:21, name:"COMBO Leve 8 Pague 7 (8 Empadas G)",              price:56.00},
    {id:22, name:"COMBO Chama a Galera (12 Empadas M, pague 10)",    price:50.00},
  ],
  "🥤 Bebidas":[
    {id:23, name:"Guaraná Antárctica 350ml", price:6.00},
    {id:24, name:"Coca-Cola 350ml",          price:6.00},
  ],
};
const ALL_ITEMS = Object.values(MENU).flat();

const PAYMENT_METHODS = [
  {id:"pix",     label:"📲 Pix"},
  {id:"dinheiro",label:"💵 Dinheiro"},
  {id:"credito", label:"💳 Crédito"},
  {id:"online",  label:"🌐 Cartão Online"},
];

const STATUS = {
  novo:      {label:"Novo",             color:C.terracotta, bg:"#FDE8DF", next:"preparo"},
  preparo:   {label:"Em Preparo",       color:C.rust,       bg:"#F5DDD0", next:"saiu"},
  saiu:      {label:"Saiu p/ Entrega",  color:C.teal,       bg:"#D8F0ED", next:"entregue"},
  entregue:  {label:"Entregue ✓",       color:"#4A7A3A",    bg:"#DCF0D8", next:null},
  retirada:  {label:"Aguard. Retirada", color:C.gold,       bg:"#FFF3CC", next:"retirado"},
  retirado:  {label:"Retirado ✓",       color:"#4A7A3A",    bg:"#DCF0D8", next:null},
  encomenda: {label:"📅 Encomenda",     color:"#7B5EA7",    bg:"#EDE7F6", next:"preparo"},
};

// ═══════════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════════
const fmt    = v => v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const fmtDt  = d => new Date(d).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});
const isDone = s => ["entregue","retirado"].includes(s);

// ID sequencial salvo no Firestore
async function getNextId() {
  const ref = doc(db,"meta","counter");
  try {
    const snap = await getDoc(ref);
    const current = snap.exists() ? (snap.data().value||0) : 0;
    const next = current + 1;
    await setDoc(ref,{value:next});
    return `#${String(next).padStart(3,"0")}`;
  } catch {
    return `#${String(Date.now()).slice(-4)}`;
  }
}

function buildWhatsAppMsg(order) {
  const payLabel = PAYMENT_METHODS.find(m=>m.id===order.payment)?.label||order.payment;
  return [
    `🥧 *PEDIDO - Casa da Empada Artesanal*`,``,
    `📋 *Pedido:* ${order.id}`,
    `👤 *Cliente:* ${order.customer}`,
    `🕐 *Horário:* ${fmtDt(order.createdAt)}`,
    `📦 *Tipo:* ${order.tipo==="delivery"?"🛵 Delivery":order.tipo==="encomenda"?"📅 Encomenda":"🏠 Retirada"}`,
    order.address?`📍 *Endereço:* ${order.address}`:"",
    order.tipo==="encomenda"&&order.deliveryDate?`📅 *Entrega:* ${order.deliveryDate} às ${order.deliveryTime||"--:--"}`:"",
    ``,`*ITENS:*`,
    ...order.items.map(it=>`▪ ${it.qty}x ${it.name} — ${fmt(it.price*it.qty)}`),``,
    `💰 *TOTAL: ${fmt(order.total)}*`,
    `💳 *Pagamento:* ${payLabel}`,
    order.tipo==="encomenda"&&order.signalPaid>0?`✅ *Sinal:* ${fmt(order.signalPaid)}`:"",
    order.tipo==="encomenda"&&order.signalPaid>0?`⏳ *A pagar:* ${fmt(order.total-order.signalPaid)}`:"",
    order.payment==="dinheiro"&&order.change>0?`💵 *Troco:* ${fmt(order.change)}`:"",
    order.note?`📝 *Obs:* ${order.note}`:"",
  ].filter(l=>l!=="").join("\n");
}

// ═══════════════════════════════════════════════════════════════
// MICRO COMPONENTES
// ═══════════════════════════════════════════════════════════════
const Lbl = ({children,mt=0})=>(
  <div style={{fontSize:11,color:C.rust,fontFamily:"Georgia,serif",fontWeight:700,letterSpacing:1,marginTop:mt}}>{children}</div>
);
const BtnCircle=(bg,color)=>({
  width:32,height:32,borderRadius:"50%",border:"none",cursor:"pointer",
  background:bg,color,fontSize:20,fontWeight:700,flexShrink:0,
  display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1,
});
const fieldStyle=(extra={})=>({
  width:"100%",padding:"11px 13px",borderRadius:10,
  border:`1.5px solid ${C.parchment}`,background:C.warmWhite,
  fontFamily:"Georgia,serif",fontSize:14,color:C.espresso,
  outline:"none",boxSizing:"border-box",...extra,
});

function Toast({msg,type="success"}) {
  return (
    <div style={{position:"fixed",bottom:28,left:"50%",transform:"translateX(-50%)",
      background:type==="error"?C.rust:C.brown,color:C.cream,
      padding:"12px 22px",borderRadius:12,fontFamily:"Georgia,serif",
      fontSize:14,zIndex:9999,boxShadow:`0 4px 20px ${C.shadow}`,
      whiteSpace:"nowrap",animation:"fadeUp .3s ease"}}>{msg}</div>
  );
}

function SBadge({status}) {
  const s=STATUS[status]||STATUS.novo;
  return <span style={{background:s.bg,color:s.color,border:`1.5px solid ${s.color}`,borderRadius:20,padding:"3px 11px",fontSize:11,fontWeight:700,fontFamily:"Georgia,serif",whiteSpace:"nowrap"}}>{s.label}</span>;
}

function Spinner() {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:60,gap:16}}>
      <div style={{width:48,height:48,borderRadius:"50%",border:`4px solid ${C.parchment}`,borderTop:`4px solid ${C.terracotta}`,animation:"spin 1s linear infinite"}}/>
      <div style={{fontFamily:"Georgia,serif",fontSize:14,color:C.sand}}>Conectando ao banco de dados...</div>
    </div>
  );
}

function Logo({size=44}) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <polygon points="50,6 90,36 90,94 10,94 10,36" fill="none" stroke={C.cream} strokeWidth="5" strokeLinejoin="round"/>
      <ellipse cx="50" cy="74" rx="29" ry="10" fill={C.teal} stroke={C.cream} strokeWidth="2"/>
      <rect x="21" y="57" width="58" height="18" rx="2" fill={C.teal} stroke={C.cream} strokeWidth="2"/>
      <path d="M21 57 Q50 30 79 57" fill={C.sand} stroke={C.cream} strokeWidth="2"/>
      <path d="M21 57 Q26 51 31 57 Q36 51 41 57 Q46 51 51 57 Q56 51 61 57 Q66 51 71 57 Q76 51 79 57" fill="none" stroke={C.terracotta} strokeWidth="2.5"/>
      <path d="M44 30 Q50 18 56 30 Q53 24 50 27 Q47 24 44 30Z" fill={C.warmWhite} stroke={C.cream} strokeWidth="1.5"/>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// AUTOCOMPLETE CLIENTE
// ═══════════════════════════════════════════════════════════════
function ClienteInput({value,onChange,clients}) {
  const [open,setOpen]=useState(false);
  const ref=useRef();
  const suggestions=useMemo(()=>{
    if(!value.trim()) return [];
    return clients.filter(c=>c.name.toLowerCase().includes(value.toLowerCase())).slice(0,6);
  },[value,clients]);
  useEffect(()=>{
    const fn=e=>{ if(ref.current&&!ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown",fn);
    return()=>document.removeEventListener("mousedown",fn);
  },[]);
  return (
    <div ref={ref} style={{position:"relative"}}>
      <input value={value} onChange={e=>{onChange(e.target.value);setOpen(true);}} onFocus={()=>setOpen(true)}
        placeholder="Nome do cliente" style={fieldStyle({marginTop:4})}/>
      {open&&suggestions.length>0&&(
        <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:200,background:C.warmWhite,border:`1.5px solid ${C.terracotta}`,borderRadius:"0 0 10px 10px",boxShadow:`0 8px 24px ${C.shadow}`,overflow:"hidden"}}>
          {suggestions.map(c=>(
            <div key={c.name} onMouseDown={()=>{onChange(c.name);setOpen(false);}}
              style={{padding:"10px 14px",cursor:"pointer",borderBottom:`1px solid ${C.parchment}`,fontFamily:"Georgia,serif",fontSize:13,color:C.espresso,display:"flex",justifyContent:"space-between"}}
              onMouseEnter={e=>e.currentTarget.style.background=C.parchment}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <span>👤 {c.name}</span>
              <span style={{fontSize:11,color:C.sand}}>{c.orders} pedidos · {fmt(c.total)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MODAIS
// ═══════════════════════════════════════════════════════════════
function InstagramModal({onClose}) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20}}>
      <div style={{background:C.warmWhite,borderRadius:24,padding:"32px 24px",maxWidth:340,width:"100%",textAlign:"center",boxShadow:`0 12px 48px rgba(0,0,0,0.3)`,border:`2px solid ${C.parchment}`}}>
        <div style={{width:72,height:72,borderRadius:20,margin:"0 auto 16px",background:C.insta,display:"flex",alignItems:"center",justifyContent:"center",fontSize:36}}>📸</div>
        <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:21,fontWeight:900,color:C.brown,marginBottom:8}}>Pedido Concluído! 🥧</div>
        <div style={{fontFamily:"Georgia,serif",fontSize:14,color:C.espresso,marginBottom:22,lineHeight:1.7}}>Obrigado pela preferência! Siga-nos no Instagram e fique por dentro das novidades.</div>
        <a href={`https://instagram.com/${INSTAGRAM}`} target="_blank" rel="noreferrer"
          style={{display:"block",padding:"13px 20px",borderRadius:12,background:C.insta,color:"#fff",fontFamily:"Georgia,serif",fontSize:15,fontWeight:700,textDecoration:"none",marginBottom:10}}>
          📸 Seguir @{INSTAGRAM}
        </a>
        <button onClick={onClose} style={{width:"100%",padding:"11px",borderRadius:12,border:`1.5px solid ${C.parchment}`,background:"transparent",color:C.rust,fontFamily:"Georgia,serif",fontSize:13,cursor:"pointer"}}>Fechar</button>
      </div>
    </div>
  );
}

function WhatsAppModal({message,onClose}) {
  const [number,setNumber]=useState("");
  function send() {
    if(!number.trim()) return;
    window.open(`https://wa.me/55${number.replace(/\D/g,"")}?text=${encodeURIComponent(message)}`,"_blank");
    onClose();
  }
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20}}>
      <div style={{background:C.warmWhite,borderRadius:24,padding:"28px 24px",maxWidth:340,width:"100%",boxShadow:`0 12px 48px rgba(0,0,0,0.3)`,border:`2px solid ${C.parchment}`}}>
        <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:18,fontWeight:900,color:C.brown,marginBottom:6}}>📲 Enviar via WhatsApp</div>
        <div style={{fontFamily:"Georgia,serif",fontSize:13,color:C.espresso,marginBottom:14}}>Informe o número do destinatário:</div>
        <input value={number} onChange={e=>setNumber(e.target.value)} placeholder="(75) 9 8119-4734" style={fieldStyle({marginBottom:14})}/>
        <div style={{display:"flex",gap:8}}>
          <button onClick={send} style={{flex:1,padding:"12px",borderRadius:10,border:"none",cursor:"pointer",background:"#25D366",color:"#fff",fontFamily:"Georgia,serif",fontSize:14,fontWeight:700}}>Enviar 📲</button>
          <button onClick={onClose} style={{flex:1,padding:"12px",borderRadius:10,border:`1.5px solid ${C.parchment}`,background:"transparent",color:C.rust,fontFamily:"Georgia,serif",fontSize:14,cursor:"pointer"}}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// HEADER
// ═══════════════════════════════════════════════════════════════
function Header({tab,setTab,ativos,synced}) {
  const tabs=[
    {id:"pedidos",icon:"📋",label:"Pedidos"},
    {id:"novo",   icon:"➕",label:"Novo"},
    {id:"fin",    icon:"📊",label:"Financeiro"},
    {id:"analise",icon:"📈",label:"Análise"},
  ];
  return (
    <header style={{background:`linear-gradient(135deg,${C.espresso},${C.brown})`,position:"sticky",top:0,zIndex:100,boxShadow:`0 4px 20px ${C.shadow}`}}>
      <div style={{display:"flex",alignItems:"center",padding:"12px 18px 8px",gap:12}}>
        <Logo size={40}/>
        <div>
          <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:17,fontWeight:900,color:C.cream,letterSpacing:.5}}>Casa da Empada</div>
          <div style={{fontSize:9,color:C.sand,letterSpacing:3,textTransform:"uppercase"}}>
            Artesanal · {synced?<span style={{color:"#86efac"}}>☁️ Sincronizado</span>:<span style={{color:"#fca5a5"}}>⏳ Conectando...</span>}
          </div>
        </div>
        {ativos>0&&<div style={{marginLeft:"auto",background:C.terracotta,color:"#fff",borderRadius:"50%",width:26,height:26,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700}}>{ativos}</div>}
      </div>
      <nav style={{display:"flex"}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            flex:1,padding:"9px 2px",border:"none",cursor:"pointer",
            background:tab===t.id?C.terracotta:"transparent",
            color:tab===t.id?"#fff":C.parchment,
            fontFamily:"Georgia,serif",fontSize:11,whiteSpace:"nowrap",
            borderTop:tab===t.id?`3px solid ${C.sand}`:"3px solid transparent",
            transition:"all .18s",
          }}>{t.icon} {t.label}</button>
        ))}
      </nav>
    </header>
  );
}

// ═══════════════════════════════════════════════════════════════
// NOVO PEDIDO
// ═══════════════════════════════════════════════════════════════
function NovoPedido({onSave,showToast,clients}) {
  const [cart,       setCart]      = useState({});
  const [name,       setName]      = useState("");
  const [addr,       setAddr]      = useState("");
  const [cidade,     setCidade]    = useState(CIDADES[0]);
  const [tipo,       setTipo]      = useState("delivery");
  const [pay,        setPay]       = useState("pix");
  const [payVal,     setPayVal]    = useState("");
  const [note,       setNote]      = useState("");
  const [search,     setSearch]    = useState("");
  const [delivDate,  setDelivDate] = useState("");
  const [delivTime,  setDelivTime] = useState("");
  const [signal,     setSignal]    = useState("");
  const [saving,     setSaving]    = useState(false);

  const total=Object.entries(cart).reduce((s,[id,q])=>{ const it=ALL_ITEMS.find(x=>x.id===Number(id)); return s+(it?it.price*q:0); },0);
  const signalNum=parseFloat(signal.replace(",",".")||"0")||0;
  const change=pay==="dinheiro"&&payVal?Math.max(0,parseFloat(payVal.replace(",","."))-total):0;
  const cartItems=Object.entries(cart).map(([id,q])=>({...ALL_ITEMS.find(x=>x.id===Number(id)),qty:q}));
  const filtered=search.trim()?ALL_ITEMS.filter(i=>i.name.toLowerCase().includes(search.toLowerCase())):null;

  const add=it=>setCart(p=>({...p,[it.id]:(p[it.id]||0)+1}));
  const rem=it=>setCart(p=>{ const u={...p}; u[it.id]>1?u[it.id]--:delete u[it.id]; return u; });

  async function submit() {
    if(!name.trim())                    return showToast("Informe o nome do cliente!","error");
    if(!cartItems.length)               return showToast("Adicione itens!","error");
    if(tipo==="delivery"&&!addr.trim()) return showToast("Informe o endereço!","error");
    if(tipo==="encomenda"&&!delivDate)  return showToast("Informe a data de entrega!","error");
    setSaving(true);
    try {
      const id = await getNextId();
      const order = {
        id, customer:name, address:addr, cidade, tipo, payment:pay,
        payVal:pay==="dinheiro"?parseFloat(payVal.replace(",",".")||total):total,
        change, note, items:cartItems, total,
        signalPaid:tipo==="encomenda"?signalNum:0,
        deliveryDate:tipo==="encomenda"?delivDate:"",
        deliveryTime:tipo==="encomenda"?delivTime:"",
        status:tipo==="encomenda"?"encomenda":tipo==="delivery"?"novo":"retirada",
        createdAt:new Date().toISOString(),
      };
      await onSave(order);
      window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(buildWhatsAppMsg(order))}`,"_blank");
      setCart({}); setName(""); setAddr(""); setPayVal(""); setNote(""); setSearch(""); setSignal(""); setDelivDate(""); setDelivTime("");
      showToast("Pedido criado! 🥧");
    } catch(e) {
      showToast("Erro ao salvar. Tente novamente.","error");
    }
    setSaving(false);
  }

  const renderItems=items=>items.map(item=>(
    <div key={item.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:C.warmWhite,borderRadius:10,padding:"9px 13px",border:`1px solid ${C.parchment}`}}>
      <div style={{flex:1,marginRight:8}}>
        <div style={{fontSize:13,color:C.espresso,fontFamily:"Georgia,serif",lineHeight:1.3}}>{item.name}</div>
        <div style={{fontSize:13,color:C.terracotta,fontWeight:700,fontFamily:"Georgia,serif"}}>{fmt(item.price)}</div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        {cart[item.id]&&<><button onClick={()=>rem(item)} style={BtnCircle(C.parchment,C.brown)}>−</button>
        <span style={{fontSize:14,fontWeight:700,color:C.brown,minWidth:20,textAlign:"center"}}>{cart[item.id]}</span></>}
        <button onClick={()=>add(item)} style={BtnCircle(C.terracotta,"#fff")}>+</button>
      </div>
    </div>
  ));

  return (
    <div style={{padding:16,display:"flex",flexDirection:"column",gap:13,maxWidth:640,margin:"0 auto",paddingBottom:40}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
        {[["delivery","🛵","Delivery"],["retirada","🏠","Retirada"],["encomenda","📅","Encomenda"]].map(([v,ic,l])=>(
          <button key={v} onClick={()=>setTipo(v)} style={{padding:"10px 4px",borderRadius:10,border:`2px solid ${tipo===v?C.terracotta:C.parchment}`,background:tipo===v?C.terracotta:C.warmWhite,color:tipo===v?"#fff":C.brown,fontFamily:"Georgia,serif",fontSize:12,cursor:"pointer",fontWeight:700}}>{ic}<br/>{l}</button>
        ))}
      </div>

      <div><Lbl>CLIENTE *</Lbl><ClienteInput value={name} onChange={setName} clients={clients}/></div>

      <div><Lbl>CIDADE</Lbl>
        <div style={{display:"flex",gap:6,marginTop:4}}>
          {CIDADES.map(c=>(
            <button key={c} onClick={()=>setCidade(c)} style={{flex:1,padding:"8px 4px",borderRadius:8,border:`2px solid ${cidade===c?C.teal:C.parchment}`,background:cidade===c?C.teal:C.warmWhite,color:cidade===c?"#fff":C.brown,fontFamily:"Georgia,serif",fontSize:12,cursor:"pointer",fontWeight:700}}>{c}</button>
          ))}
        </div>
      </div>

      {(tipo==="delivery"||tipo==="encomenda")&&(
        <div><Lbl>ENDEREÇO {tipo==="delivery"?"*":""}</Lbl>
          <input value={addr} onChange={e=>setAddr(e.target.value)} placeholder="Rua, número, bairro..." style={fieldStyle({marginTop:4})}/>
        </div>
      )}

      {tipo==="encomenda"&&(
        <div style={{background:"#EDE7F6",borderRadius:12,padding:14,border:"1.5px solid #B39DDB",display:"flex",flexDirection:"column",gap:10}}>
          <div style={{fontFamily:"Georgia,serif",fontSize:13,fontWeight:700,color:"#7B5EA7"}}>📅 Detalhes da Encomenda</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <div><Lbl>DATA DE ENTREGA *</Lbl><input type="date" value={delivDate} onChange={e=>setDelivDate(e.target.value)} style={fieldStyle({marginTop:4})}/></div>
            <div><Lbl>HORÁRIO PREVISTO</Lbl><input type="time" value={delivTime} onChange={e=>setDelivTime(e.target.value)} style={fieldStyle({marginTop:4})}/></div>
          </div>
          <div><Lbl>SINAL PAGO (R$)</Lbl>
            <input value={signal} onChange={e=>setSignal(e.target.value)} placeholder="0,00" style={fieldStyle({marginTop:4})}/>
            {signalNum>0&&<div style={{marginTop:6,display:"flex",justifyContent:"space-between",fontFamily:"Georgia,serif",fontSize:12}}>
              <span style={{color:C.sage}}>✅ Sinal: {fmt(signalNum)}</span>
              <span style={{color:C.rust}}>⏳ A pagar: {fmt(Math.max(0,total-signalNum))}</span>
            </div>}
          </div>
        </div>
      )}

      <div><Lbl>ADICIONAR ITENS</Lbl>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Buscar produto..." style={fieldStyle({marginTop:4})}/>
      </div>

      {filtered?(
        <div style={{display:"flex",flexDirection:"column",gap:5}}>
          {filtered.length===0?<div style={{textAlign:"center",color:C.sand,fontFamily:"Georgia,serif",padding:16}}>Nenhum produto encontrado</div>:renderItems(filtered)}
        </div>
      ):Object.entries(MENU).map(([cat,items])=>(
        <div key={cat}>
          <div style={{fontSize:11,fontWeight:700,color:C.rust,fontFamily:"Georgia,serif",marginBottom:5,letterSpacing:1}}>{cat}</div>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>{renderItems(items)}</div>
        </div>
      ))}

      {cartItems.length>0&&(
        <div style={{background:C.parchment,borderRadius:12,padding:14,border:`1.5px solid ${C.sand}`}}>
          <Lbl>🛒 RESUMO</Lbl>
          {cartItems.map(it=>(
            <div key={it.id} style={{display:"flex",justifyContent:"space-between",fontSize:13,color:C.espresso,fontFamily:"Georgia,serif",margin:"5px 0"}}>
              <span>{it.qty}× {it.name}</span><span style={{fontWeight:700}}>{fmt(it.price*it.qty)}</span>
            </div>
          ))}
          <div style={{borderTop:`1.5px solid ${C.sand}`,marginTop:8,paddingTop:8,display:"flex",justifyContent:"space-between",fontWeight:700,fontSize:16,fontFamily:"Georgia,serif"}}>
            <span style={{color:C.brown}}>TOTAL</span><span style={{color:C.terracotta}}>{fmt(total)}</span>
          </div>
        </div>
      )}

      <div><Lbl>PAGAMENTO</Lbl>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:6}}>
          {PAYMENT_METHODS.map(m=>(
            <button key={m.id} onClick={()=>setPay(m.id)} style={{padding:"8px 12px",borderRadius:8,border:`2px solid ${pay===m.id?C.terracotta:C.parchment}`,background:pay===m.id?C.terracotta:C.warmWhite,color:pay===m.id?"#fff":C.brown,fontFamily:"Georgia,serif",fontSize:12,cursor:"pointer",fontWeight:700}}>{m.label}</button>
          ))}
        </div>
        {pay==="dinheiro"&&(
          <div style={{marginTop:8,display:"flex",gap:8,alignItems:"center"}}>
            <input value={payVal} onChange={e=>setPayVal(e.target.value)} placeholder="Valor recebido (R$)" style={fieldStyle({flex:1})}/>
            {payVal&&<span style={{fontSize:13,color:C.sage,fontWeight:700,fontFamily:"Georgia,serif",whiteSpace:"nowrap"}}>Troco: {fmt(change)}</span>}
          </div>
        )}
      </div>

      <div><Lbl>OBSERVAÇÕES</Lbl>
        <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Ex: sem cebola, sabores específicos..." rows={2} style={fieldStyle({resize:"none",marginTop:4})}/>
      </div>

      <div style={{background:"#e8f5e9",borderRadius:10,padding:"10px 13px",border:"1.5px solid #a5d6a7",display:"flex",gap:8,alignItems:"center"}}>
        <span style={{fontSize:18}}>📲</span>
        <span style={{fontFamily:"Georgia,serif",fontSize:12,color:"#2e7d32"}}>Ao confirmar, o resumo é enviado ao WhatsApp da Casa da Empada automaticamente.</span>
      </div>

      <button onClick={submit} disabled={saving} style={{padding:15,borderRadius:12,border:"none",cursor:"pointer",background:saving?C.sand:`linear-gradient(135deg,${C.terracotta},${C.rust})`,color:"#fff",fontFamily:"Georgia,serif",fontSize:15,fontWeight:700,letterSpacing:.5,boxShadow:`0 4px 16px ${C.shadow}`}}>
        {saving?"⏳ Salvando...":"✅ CONFIRMAR E ENVIAR AO WHATSAPP"}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PEDIDOS
// ═══════════════════════════════════════════════════════════════
function Pedidos({orders,onStatus,onDelete,onShowInsta}) {
  const [filter,   setFilter]   = useState("ativos");
  const [expanded, setExpanded] = useState(null);
  const [waModal,  setWaModal]  = useState(null);

  const filters=[
    ["ativos","🔥 Ativos"],["encomenda","📅 Encomendas"],
    ["novo","Novos"],["preparo","Preparo"],["saiu","Saiu"],
    ["retirada","Retirada"],["concluidos","✓ Feitos"],
  ];

  const visible=(()=>{
    if(filter==="ativos")    return orders.filter(o=>!isDone(o.status)&&o.status!=="encomenda");
    if(filter==="concluidos")return orders.filter(o=>isDone(o.status));
    return orders.filter(o=>o.status===filter);
  })();

  function handleStatus(id,next) {
    onStatus(id,next);
    if(isDone(next)) onShowInsta();
  }

  return (
    <div style={{padding:16,maxWidth:640,margin:"0 auto"}}>
      <div style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:8,marginBottom:12}}>
        {filters.map(([v,l])=>{
          const cnt=v==="ativos"?orders.filter(o=>!isDone(o.status)&&o.status!=="encomenda").length
            :v==="concluidos"?orders.filter(o=>isDone(o.status)).length
            :orders.filter(o=>o.status===v).length;
          return <button key={v} onClick={()=>setFilter(v)} style={{whiteSpace:"nowrap",padding:"6px 11px",borderRadius:20,border:`2px solid ${filter===v?C.terracotta:C.parchment}`,background:filter===v?C.terracotta:C.warmWhite,color:filter===v?"#fff":C.brown,fontFamily:"Georgia,serif",fontSize:11,cursor:"pointer",fontWeight:700}}>{l} {cnt>0&&`(${cnt})`}</button>;
        })}
      </div>

      {visible.length===0&&(
        <div style={{textAlign:"center",padding:"60px 20px",color:C.sand,fontFamily:"Georgia,serif"}}>
          <div style={{fontSize:48,marginBottom:12}}>🥧</div>
          <div style={{fontSize:15}}>Nenhum pedido aqui</div>
        </div>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {visible.map(order=>{
          const s=STATUS[order.status]||STATUS.novo;
          const isExp=expanded===order.id;
          const done=isDone(order.status);
          const isEnc=order.status==="encomenda";
          return (
            <div key={order.id} style={{background:C.warmWhite,borderRadius:14,border:`1.5px solid ${isExp?C.terracotta:isEnc?"#B39DDB":C.parchment}`,overflow:"hidden",boxShadow:`0 2px 10px ${C.shadow}`}}>
              <div onClick={()=>setExpanded(isExp?null:order.id)} style={{padding:"12px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3,flexWrap:"wrap"}}>
                    <span style={{fontFamily:"Georgia,serif",fontSize:14,fontWeight:700,color:C.brown}}>{order.id}</span>
                    <SBadge status={order.status}/>
                    <span style={{fontSize:10,color:C.sand,marginLeft:"auto"}}>{fmtDt(order.createdAt)}</span>
                  </div>
                  <div style={{fontFamily:"Georgia,serif",fontSize:12,color:C.espresso}}>
                    👤 {order.customer} · {order.tipo==="delivery"?"🛵":order.tipo==="encomenda"?"📅":"🏠"} {order.cidade||""}
                  </div>
                  {isEnc&&order.deliveryDate&&<div style={{fontFamily:"Georgia,serif",fontSize:11,color:"#7B5EA7",marginTop:2}}>📅 Entrega: {order.deliveryDate} {order.deliveryTime?"às "+order.deliveryTime:""}</div>}
                  <div style={{fontFamily:"Georgia,serif",fontSize:13,fontWeight:700,color:C.terracotta,marginTop:2}}>{fmt(order.total)} · {order.items.length} {order.items.length===1?"item":"itens"}</div>
                </div>
                <span style={{color:C.sand,fontSize:16}}>{isExp?"▲":"▼"}</span>
              </div>

              {isExp&&(
                <div style={{borderTop:`1px solid ${C.parchment}`,padding:"12px 14px",background:C.cream}}>
                  {order.address&&<div style={{fontSize:12,color:C.espresso,fontFamily:"Georgia,serif",marginBottom:5}}>📍 {order.address}</div>}
                  {order.note&&<div style={{fontSize:11,color:C.rust,fontFamily:"Georgia,serif",marginBottom:7,fontStyle:"italic"}}>📝 {order.note}</div>}
                  {isEnc&&order.signalPaid>0&&<div style={{display:"flex",gap:12,marginBottom:8,fontFamily:"Georgia,serif",fontSize:12}}>
                    <span style={{color:C.sage}}>✅ Sinal: {fmt(order.signalPaid)}</span>
                    <span style={{color:C.rust}}>⏳ A pagar: {fmt(order.total-order.signalPaid)}</span>
                  </div>}
                  <div style={{marginBottom:10}}>
                    {order.items.map((it,i)=>(
                      <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:12,fontFamily:"Georgia,serif",color:C.espresso,padding:"2px 0"}}>
                        <span>{it.qty}× {it.name}</span><span style={{fontWeight:700}}>{fmt(it.price*it.qty)}</span>
                      </div>
                    ))}
                    <div style={{borderTop:`1px solid ${C.sand}`,marginTop:6,paddingTop:6,display:"flex",justifyContent:"space-between",fontWeight:700,fontFamily:"Georgia,serif"}}>
                      <span style={{color:C.brown}}>Total</span><span style={{color:C.terracotta}}>{fmt(order.total)}</span>
                    </div>
                  </div>
                  <div style={{fontSize:12,color:C.espresso,fontFamily:"Georgia,serif",marginBottom:10}}>
                    💰 {PAYMENT_METHODS.find(m=>m.id===order.payment)?.label||order.payment}
                    {order.payment==="dinheiro"&&order.change>0&&` · Troco: ${fmt(order.change)}`}
                  </div>
                  <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                    {s.next&&<button onClick={()=>handleStatus(order.id,s.next)} style={{flex:1,padding:"9px 12px",borderRadius:10,border:"none",cursor:"pointer",background:C.terracotta,color:"#fff",fontFamily:"Georgia,serif",fontSize:12,fontWeight:700}}>▶ {STATUS[s.next]?.label}</button>}
                    <button onClick={()=>setWaModal(buildWhatsAppMsg(order))} style={{padding:"9px 12px",borderRadius:10,border:"1.5px solid #25D366",cursor:"pointer",background:"#e8f5e9",color:"#2e7d32",fontFamily:"Georgia,serif",fontSize:12,fontWeight:700}}>📲 WA</button>
                    {!done&&<button onClick={()=>onDelete(order.id)} style={{padding:"9px 12px",borderRadius:10,border:`1.5px solid ${C.parchment}`,cursor:"pointer",background:C.warmWhite,color:C.rust,fontFamily:"Georgia,serif",fontSize:12}}>🗑</button>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {waModal&&<WhatsAppModal message={waModal} onClose={()=>setWaModal(null)}/>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// FINANCEIRO
// ═══════════════════════════════════════════════════════════════
function Financeiro({orders,caixaHistory,onCaixaClose}) {
  const [period,setPeriod]=useState("hoje");
  const [cidFilt,setCidFilt]=useState("Geral");
  const [showCaixa,setShowCaixa]=useState(false);
  const [caixaVal,setCaixaVal]=useState("");

  function rangeStart(p) {
    const d=new Date();
    if(p==="hoje")  {d.setHours(0,0,0,0);return d;}
    if(p==="semana"){d.setDate(d.getDate()-d.getDay());d.setHours(0,0,0,0);return d;}
    if(p==="mes")   {d.setDate(1);d.setHours(0,0,0,0);return d;}
    d.setFullYear(d.getFullYear(),0,1);d.setHours(0,0,0,0);return d;
  }

  const done=orders.filter(o=>isDone(o.status));
  let po=done.filter(o=>new Date(o.createdAt)>=rangeStart(period));
  if(cidFilt!=="Geral") po=po.filter(o=>(o.cidade||"Sátiro Dias")===cidFilt);

  const total=po.reduce((s,o)=>s+o.total,0);
  const qtd=po.length;
  const ticket=qtd?total/qtd:0;
  const byPay=PAYMENT_METHODS.map(m=>({label:m.label,total:po.filter(o=>o.payment===m.id).reduce((s,o)=>s+o.total,0),count:po.filter(o=>o.payment===m.id).length})).filter(x=>x.count>0);

  const todayCaixa=caixaHistory.filter(c=>new Date(c.date).toDateString()===new Date().toDateString());
  const totalCaixaHoje=todayCaixa.reduce((s,c)=>s+c.value,0);

  function submitCaixa() {
    const v=parseFloat(caixaVal.replace(",",".")||"0");
    if(!v) return;
    onCaixaClose({value:v,date:new Date().toISOString()});
    setCaixaVal(""); setShowCaixa(false);
  }

  const Card=({emoji,label,val,sub})=>(
    <div style={{background:C.warmWhite,borderRadius:14,padding:"14px 12px",border:`1.5px solid ${C.parchment}`,flex:1,minWidth:90}}>
      <div style={{fontSize:20}}>{emoji}</div>
      <div style={{fontSize:9,color:C.sand,fontFamily:"Georgia,serif",letterSpacing:1,textTransform:"uppercase",marginTop:3}}>{label}</div>
      <div style={{fontSize:18,fontWeight:700,color:C.terracotta,fontFamily:"'Playfair Display',Georgia,serif",marginTop:1}}>{val}</div>
      {sub&&<div style={{fontSize:10,color:C.rust,fontFamily:"Georgia,serif"}}>{sub}</div>}
    </div>
  );

  return (
    <div style={{padding:16,maxWidth:640,margin:"0 auto",paddingBottom:40}}>
      <div style={{display:"flex",gap:5,marginBottom:10}}>
        {[["hoje","Hoje"],["semana","Semana"],["mes","Mês"],["ano","Ano"]].map(([v,l])=>(
          <button key={v} onClick={()=>setPeriod(v)} style={{flex:1,padding:"9px 3px",borderRadius:10,border:`2px solid ${period===v?C.terracotta:C.parchment}`,background:period===v?C.terracotta:C.warmWhite,color:period===v?"#fff":C.brown,fontFamily:"Georgia,serif",fontSize:12,cursor:"pointer",fontWeight:700}}>{l}</button>
        ))}
      </div>
      <div style={{display:"flex",gap:5,marginBottom:14}}>
        {["Geral",...CIDADES].map(c=>(
          <button key={c} onClick={()=>setCidFilt(c)} style={{flex:1,padding:"7px 3px",borderRadius:8,border:`2px solid ${cidFilt===c?C.teal:C.parchment}`,background:cidFilt===c?C.teal:C.warmWhite,color:cidFilt===c?"#fff":C.brown,fontFamily:"Georgia,serif",fontSize:11,cursor:"pointer",fontWeight:700}}>{c}</button>
        ))}
      </div>
      <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
        <Card emoji="💰" label="Faturamento" val={fmt(total)}/>
        <Card emoji="📦" label="Pedidos" val={qtd} sub="concluídos"/>
        <Card emoji="🎯" label="Ticket Médio" val={fmt(ticket)}/>
      </div>

      {period==="hoje"&&(
        <div style={{background:C.warmWhite,borderRadius:14,padding:14,border:`1.5px solid ${C.parchment}`,marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{fontFamily:"Georgia,serif",fontSize:13,fontWeight:700,color:C.brown}}>🗃️ Fechamento de Caixa</div>
            <button onClick={()=>setShowCaixa(!showCaixa)} style={{padding:"6px 12px",borderRadius:8,border:"none",background:C.terracotta,color:"#fff",fontFamily:"Georgia,serif",fontSize:11,cursor:"pointer",fontWeight:700}}>{showCaixa?"Cancelar":"Fechar Caixa"}</button>
          </div>
          {todayCaixa.length>0&&todayCaixa.map((c,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:12,fontFamily:"Georgia,serif",color:C.espresso,padding:"3px 0"}}>
              <span>{fmtDt(c.date)}</span><span style={{fontWeight:700,color:C.rust}}>{fmt(c.value)}</span>
            </div>
          ))}
          {todayCaixa.length>0&&<div style={{borderTop:`1px solid ${C.parchment}`,marginTop:4,paddingTop:4,display:"flex",justifyContent:"space-between",fontWeight:700,fontFamily:"Georgia,serif",fontSize:12}}><span>Total</span><span style={{color:C.terracotta}}>{fmt(totalCaixaHoje)}</span></div>}
          {showCaixa&&<div style={{display:"flex",gap:8,marginTop:8}}>
            <input value={caixaVal} onChange={e=>setCaixaVal(e.target.value)} placeholder="Valor do caixa (R$)" style={fieldStyle({flex:1})}/>
            <button onClick={submitCaixa} style={{padding:"10px 16px",borderRadius:10,border:"none",cursor:"pointer",background:C.sage,color:"#fff",fontFamily:"Georgia,serif",fontSize:13,fontWeight:700}}>✓</button>
          </div>}
        </div>
      )}

      {byPay.length>0&&(
        <div style={{background:C.warmWhite,borderRadius:14,padding:14,border:`1.5px solid ${C.parchment}`,marginBottom:12}}>
          <Lbl>💳 POR FORMA DE PAGAMENTO</Lbl>
          {byPay.map(p=>(
            <div key={p.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${C.parchment}`}}>
              <span style={{fontFamily:"Georgia,serif",fontSize:13,color:C.espresso}}>{p.label} <span style={{color:C.sand}}>({p.count})</span></span>
              <span style={{fontFamily:"Georgia,serif",fontSize:13,fontWeight:700,color:C.terracotta}}>{fmt(p.total)}</span>
            </div>
          ))}
        </div>
      )}
      {po.length===0&&<div style={{textAlign:"center",padding:"50px 20px",color:C.sand,fontFamily:"Georgia,serif"}}><div style={{fontSize:40,marginBottom:10}}>📊</div><div>Nenhum pedido concluído neste período</div></div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ANÁLISE GERAL
// ═══════════════════════════════════════════════════════════════
function Analise({orders,clients,caixaHistory}) {
  const [waModal,setWaModal]=useState(false);
  const done=orders.filter(o=>isDone(o.status));
  const topClientes=clients.sort((a,b)=>b.orders-a.orders).slice(0,10);
  const top3=topClientes.slice(0,3);
  const itemMap={};
  done.forEach(o=>o.items.forEach(it=>{ if(!itemMap[it.name]) itemMap[it.name]={name:it.name,qty:0,revenue:0}; itemMap[it.name].qty+=it.qty; itemMap[it.name].revenue+=it.price*it.qty; }));
  const itemRanking=Object.values(itemMap).sort((a,b)=>b.qty-a.qty);
  const topItems=itemRanking.slice(0,5);
  const lowItems=itemRanking.slice(-3).reverse();
  const bairroMap={};
  done.forEach(o=>{ if(!o.address) return; const parts=o.address.split(","); const b=(parts[2]||parts[1]||parts[0]||"").trim(); if(b) bairroMap[b]=(bairroMap[b]||0)+1; });
  const topBairros=Object.entries(bairroMap).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const payMap={};
  done.forEach(o=>{ payMap[o.payment]=(payMap[o.payment]||0)+1; });
  const payRanking=PAYMENT_METHODS.map(m=>({...m,count:payMap[m.id]||0})).sort((a,b)=>b.count-a.count);
  const cidMap={};
  done.forEach(o=>{ const c=o.cidade||"Não informada"; cidMap[c]=(cidMap[c]||0)+1; });
  const totalRev=done.reduce((s,o)=>s+o.total,0);
  const totalDespesas=caixaHistory.reduce((s,c)=>s+c.value,0);

  function buildReport() {
    const now=new Date().toLocaleString("pt-BR");
    return [
      `📊 *ANÁLISE GERAL - Casa da Empada Artesanal*`,
      `🗓️ Gerado em: ${now}`,``,`━━━━━━━━━━━━━━━━━━━━`,
      `💰 *FINANCEIRO*`,
      `• Faturamento: ${fmt(totalRev)}`,
      `• Pedidos: ${done.length}`,
      `• Ticket médio: ${fmt(done.length?totalRev/done.length:0)}`,
      `• Despesas: ${fmt(totalDespesas)}`,``,`━━━━━━━━━━━━━━━━━━━━`,
      `🏆 *TOP 3 CLIENTES*`,
      ...top3.map((c,i)=>`${i+1}. ${c.name} — ${c.orders} pedidos · ${fmt(c.total)}`),``,`━━━━━━━━━━━━━━━━━━━━`,
      `🥧 *MAIS VENDIDOS*`,
      ...topItems.map((it,i)=>`${i+1}. ${it.name} — ${it.qty} un · ${fmt(it.revenue)}`),``,
      `📉 *MENOS VENDIDOS*`,
      ...lowItems.map(it=>`• ${it.name} — ${it.qty} un`),``,`━━━━━━━━━━━━━━━━━━━━`,
      `💳 *PAGAMENTOS*`,
      ...payRanking.filter(p=>p.count>0).map(p=>`• ${p.label}: ${p.count} usos`),``,
      topBairros.length?`📍 *TOP BAIRROS*\n${topBairros.map(([b,n])=>`• ${b}: ${n} pedido${n!==1?"s":""}`).join("\n")}`:"",
    ].filter(l=>l!=="").join("\n");
  }

  const Section=({title,children})=>(
    <div style={{background:C.warmWhite,borderRadius:14,padding:16,border:`1.5px solid ${C.parchment}`,marginBottom:12}}>
      <div style={{fontFamily:"Georgia,serif",fontSize:12,fontWeight:700,color:C.rust,letterSpacing:1,marginBottom:10}}>{title}</div>
      {children}
    </div>
  );
  const Row=({left,right,sub,color=C.terracotta})=>(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:`1px solid ${C.parchment}`}}>
      <div><div style={{fontFamily:"Georgia,serif",fontSize:13,color:C.espresso}}>{left}</div>{sub&&<div style={{fontFamily:"Georgia,serif",fontSize:11,color:C.sand}}>{sub}</div>}</div>
      <span style={{fontFamily:"Georgia,serif",fontSize:13,fontWeight:700,color}}>{right}</span>
    </div>
  );
  const medals=["🥇","🥈","🥉","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟"];

  return (
    <div style={{padding:16,maxWidth:640,margin:"0 auto",paddingBottom:40}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
        {[["💰","Faturamento",fmt(totalRev)],["📦","Pedidos",done.length],["🎯","Ticket Médio",fmt(done.length?totalRev/done.length:0)],["🗃️","Despesas",fmt(totalDespesas)]].map(([e,l,v])=>(
          <div key={l} style={{background:C.warmWhite,borderRadius:12,padding:"13px 12px",border:`1.5px solid ${C.parchment}`,textAlign:"center"}}>
            <div style={{fontSize:22}}>{e}</div>
            <div style={{fontSize:9,color:C.sand,fontFamily:"Georgia,serif",letterSpacing:1,textTransform:"uppercase",margin:"3px 0"}}>{l}</div>
            <div style={{fontSize:16,fontWeight:700,color:C.terracotta,fontFamily:"'Playfair Display',Georgia,serif"}}>{v}</div>
          </div>
        ))}
      </div>

      <Section title="🏆 TOP 10 CLIENTES">
        {topClientes.length===0?<div style={{color:C.sand,fontFamily:"Georgia,serif",fontSize:13,textAlign:"center",padding:12}}>Nenhum dado ainda</div>
          :topClientes.map((c,i)=>(
            <div key={c.name} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:`1px solid ${C.parchment}`}}>
              <span style={{fontSize:16,width:24}}>{medals[i]}</span>
              <div style={{flex:1}}><div style={{fontFamily:"Georgia,serif",fontSize:13,color:C.espresso,fontWeight:i<3?700:400}}>{c.name}</div><div style={{fontFamily:"Georgia,serif",fontSize:11,color:C.sand}}>{c.orders} pedido{c.orders!==1?"s":""}</div></div>
              <span style={{fontFamily:"Georgia,serif",fontSize:13,fontWeight:700,color:C.terracotta}}>{fmt(c.total)}</span>
            </div>
          ))}
      </Section>

      {topItems.length>0&&<Section title="🥧 MAIS VENDIDOS">{topItems.map((it,i)=><Row key={it.name} left={`${medals[i]} ${it.name}`} right={`${it.qty} un`} sub={fmt(it.revenue)}/>)}</Section>}
      {lowItems.length>0&&<Section title="📉 MENOS VENDIDOS">{lowItems.map(it=><Row key={it.name} left={it.name} right={`${it.qty} un`} color={C.rust}/>)}</Section>}

      <Section title="💳 FORMAS DE PAGAMENTO">
        {payRanking.map((p,i)=><Row key={p.id} left={`${i===0?"👑":i===payRanking.length-1?"⚠️":"•"} ${p.label}`} right={`${p.count} uso${p.count!==1?"s":""}`} color={i===0?C.sage:i===payRanking.length-1?C.rust:C.terracotta}/>)}
      </Section>

      {topBairros.length>0&&<Section title="📍 BAIRROS COM MAIS PEDIDOS">{topBairros.map(([b,n],i)=><Row key={b} left={`${medals[i]} ${b}`} right={`${n} pedido${n!==1?"s":""}`}/>)}</Section>}

      {Object.keys(cidMap).length>0&&<Section title="🗺️ PEDIDOS POR CIDADE">{Object.entries(cidMap).sort((a,b)=>b[1]-a[1]).map(([c,n])=><Row key={c} left={c} right={`${n} pedido${n!==1?"s":""}`}/>)}</Section>}

      <button onClick={()=>setWaModal(true)} style={{width:"100%",padding:15,borderRadius:12,border:"none",cursor:"pointer",background:"linear-gradient(135deg,#25D366,#128C7E)",color:"#fff",fontFamily:"Georgia,serif",fontSize:15,fontWeight:700,boxShadow:"0 4px 16px rgba(37,211,102,0.3)"}}>
        📊 Gerar Relatório e Enviar por WhatsApp
      </button>
      {waModal&&<WhatsAppModal message={buildReport()} onClose={()=>setWaModal(false)}/>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════
export default function App() {
  const [tab,          setTab]          = useState("pedidos");
  const [orders,       setOrders]       = useState([]);
  const [clients,      setClients]      = useState([]);
  const [caixaHistory, setCaixaHistory] = useState([]);
  const [toast,        setToast]        = useState(null);
  const [showInsta,    setShowInsta]    = useState(false);
  const [synced,       setSynced]       = useState(false);
  const [loading,      setLoading]      = useState(true);

  // Escuta tempo real do Firestore
  useEffect(()=>{
    const unsubs = [
      onSnapshot(collection(db,"orders"), snap=>{
        setOrders(snap.docs.map(d=>({...d.data(),_docId:d.id})).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)));
        setSynced(true); setLoading(false);
      }, ()=>setLoading(false)),
      onSnapshot(collection(db,"clients"), snap=>{
        setClients(snap.docs.map(d=>({...d.data(),_docId:d.id})));
      }),
      onSnapshot(collection(db,"caixa"), snap=>{
        setCaixaHistory(snap.docs.map(d=>d.data()).sort((a,b)=>new Date(a.date)-new Date(b.date)));
      }),
    ];
    return()=>unsubs.forEach(u=>u());
  },[]);

  const showToast=useCallback((msg,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),2800); },[]);

  async function handleSave(order) {
    await addDoc(collection(db,"orders"),order);
    // Upsert cliente
    const existing=clients.find(c=>c.name.toLowerCase()===order.customer.toLowerCase());
    if(existing&&existing._docId) {
      await updateDoc(doc(db,"clients",existing._docId),{
        orders:(existing.orders||0)+1,
        total:(existing.total||0)+order.total,
        lastOrder:order.createdAt,
      });
    } else {
      await addDoc(collection(db,"clients"),{name:order.customer,orders:1,total:order.total,lastOrder:order.createdAt});
    }
  }

  async function handleStatus(id,next) {
    const order=orders.find(o=>o.id===id);
    if(order?._docId) await updateDoc(doc(db,"orders",order._docId),{status:next});
    showToast(`▶ ${STATUS[next]?.label}`);
  }

  async function handleDelete(id) {
    const order=orders.find(o=>o.id===id);
    if(order?._docId) await deleteDoc(doc(db,"orders",order._docId));
    showToast("Pedido cancelado.","error");
  }

  async function handleCaixaClose(entry) {
    await addDoc(collection(db,"caixa"),entry);
    showToast(`Caixa fechado: ${fmt(entry.value)}`);
  }

  const ativos=orders.filter(o=>!isDone(o.status)&&o.status!=="encomenda").length;

  return (
    <div style={{minHeight:"100vh",background:C.cream}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-thumb{background:${C.sand};border-radius:4px;}
        @keyframes fadeUp{from{opacity:0;transform:translateX(-50%) translateY(14px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}
        @keyframes spin{to{transform:rotate(360deg);}}
        button:active{opacity:.82;transform:scale(.97);}
        input:focus,textarea:focus{border-color:${C.terracotta}!important;box-shadow:0 0 0 3px rgba(196,101,58,.15);}
      `}</style>

      <Header tab={tab} setTab={setTab} ativos={ativos} synced={synced}/>

      {loading ? <Spinner/> : <>
        {tab==="pedidos" && <Pedidos orders={orders} onStatus={handleStatus} onDelete={handleDelete} onShowInsta={()=>setShowInsta(true)}/>}
        {tab==="novo"    && <NovoPedido onSave={handleSave} showToast={showToast} clients={clients}/>}
        {tab==="fin"     && <Financeiro orders={orders} caixaHistory={caixaHistory} onCaixaClose={handleCaixaClose}/>}
        {tab==="analise" && <Analise orders={orders} clients={clients} caixaHistory={caixaHistory}/>}
      </>}

      <div style={{textAlign:"center",padding:"20px 16px 48px",color:C.sand,fontSize:10,fontFamily:"Georgia,serif",letterSpacing:.5}}>
        🥧 Casa da Empada Artesanal · @casadaempadaartesanal · (75) 9.8119-4734
      </div>

      {showInsta && <InstagramModal onClose={()=>setShowInsta(false)}/>}
      {toast     && <Toast msg={toast.msg} type={toast.type}/>}
    </div>
  );
}
