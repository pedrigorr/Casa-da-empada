import { C, fmt } from "./constants.js";

export function Toast({msg, type="success"}) {
  return (
    <div style={{
      position:"fixed",bottom:88,left:"50%",transform:"translateX(-50%)",
      background:type==="error"?"#dc2626":type==="warn"?C.gold:C.brown,
      color:"#fff",padding:"12px 22px",borderRadius:14,
      fontFamily:"Georgia,serif",fontSize:14,zIndex:9999,
      boxShadow:"0 8px 32px rgba(0,0,0,0.25)",whiteSpace:"nowrap",
      animation:"slideUp .3s cubic-bezier(.34,1.56,.64,1)",
    }}>{msg}</div>
  );
}

export function Spinner({label="Carregando..."}) {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:80,gap:16}}>
      <div style={{width:44,height:44,borderRadius:"50%",border:`3px solid ${C.parchment}`,borderTop:`3px solid ${C.terracotta}`,animation:"spin 1s linear infinite"}}/>
      <div style={{fontFamily:"Georgia,serif",fontSize:13,color:C.sand}}>{label}</div>
    </div>
  );
}

export function Modal({children, onClose, title, maxWidth=400}) {
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(18,12,10,0.85)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,zIndex:10000}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.warmWhite,borderRadius:28,width:"100%",maxWidth,padding:28,position:"relative",boxShadow:"0 25px 50px -12px rgba(0,0,0,0.5)"}}>
        {title && <div style={{fontSize:20,fontWeight:900,color:C.espresso,marginBottom:20,fontFamily:"'Playfair Display',serif",textAlign:"center"}}>{title}</div>}
        {children}
      </div>
    </div>
  );
}

export function Pill({active, onClick, label, emoji}) {
  return (
    <button onClick={onClick} style={{
       flex:"0 0 auto",padding:"10px 18px",borderRadius:14,cursor:"pointer",
       background:active?C.warmWhite:C.cream,
       color:active?C.espresso:C.brown,
       fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:800,
       boxShadow:active?`0 3px 12px ${C.shadow}`:"none",
       transition:"all .2s",whiteSpace:"nowrap",
       border:`1.5px solid ${active?C.terracotta:C.parchment}`
     }}>
       {emoji} {label}
    </button>
  );
}

export function SBadge({status}) {
  const cfg = {
    pendente:    {bg:C.cream,      tx:C.brown,      lb:"Pendente"},
    preparando:  {bg:C.gold+"22",  tx:C.gold,       lb:"Cozinha"},
    pronto:      {bg:"#dcfce7",    tx:"#166534",    lb:"Pronto"},
    em_entrega:  {bg:C.terracotta, tx:"#fff",       lb:"Na Rua"},
    entregue:    {bg:C.espresso,   tx:C.sand,       lb:"Finalizado"},
    cancelado:   {bg:"#fee2e2",    tx:"#dc2626",    lb:"Cancelado"},
    encomenda:   {bg:"#f0f9ff",    tx:"#0369a1",    lb:"Reserva"}
  };
  const s = cfg[status] || {bg:C.parchment, tx:C.brown, lb:status};
  return (
    <span style={{background:s.bg,color:s.tx,padding:"5px 10px",borderRadius:8,fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:0.5}}>
      {s.lb}
    </span>
  );
}

export function Card({children, style}) {
  return (
    <div style={{background:C.warmWhite,borderRadius:20,boxShadow:`0 4px 16px ${C.shadow}`,border:`1px solid ${C.parchment}`,...style}}>
      {children}
    </div>
  );
}

export function StatCard({label, value, color, isFull}) {
  return (
    <div style={{background:C.warmWhite,padding:20,borderRadius:20,boxShadow:`0 4px 12px ${C.shadow}`,borderBottom:`4px solid ${color}`,gridColumn:isFull?"1 / -1":undefined}}>
      <div style={{fontSize:11,fontWeight:800,color:C.sand,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>{label}</div>
      <div style={{fontSize:24,fontWeight:900,color:C.espresso,fontFamily:"'Playfair Display',serif"}}>{value}</div>
    </div>
  );
}

export const fieldStyle = (extra={}) => ({
  width:"100%",padding:"13px 16px",borderRadius:12,border:`1.5px solid ${C.parchment}`,
  background:C.warmWhite,fontFamily:"Georgia,serif",fontSize:15,color:C.espresso,
  outline:"none",boxSizing:"border-box",transition:".2s",...extra
});

export function Lbl({children, mt=16}) {
  return <label style={{display:"block",fontSize:11,fontWeight:800,color:C.sand,marginBottom:6,marginTop:mt,textTransform:"uppercase",letterSpacing:1}}>{children}</label>;
}

export function BtnPrimary({children, onClick, loading, style}) {
  return (
    <button onClick={onClick} disabled={loading} style={{
      width:"100%",padding:"15px",borderRadius:14,border:"none",
      background:`linear-gradient(135deg,${C.espresso},${C.brown})`,
      color:C.cream,fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:800,
      cursor:"pointer",boxShadow:"0 8px 20px rgba(45,30,25,0.3)",
      display:"flex",alignItems:"center",justifyContent:"center",gap:10,...style
    }}>
      {loading ? <div style={{width:18,height:18,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 1s linear infinite"}}/> : children}
    </button>
  );
}

export function WaButton({phone, label, size=44, style}) {
  const clean = phone.replace(/\D/g,"");
  const num = clean.startsWith("55") ? clean : `55${clean}`;
  return (
    <a href={`https://wa.me/${num}`} target="_blank" rel="noreferrer"
      style={{
        display:"flex",alignItems:"center",justifyContent:"center",gap:6,
        width:label?undefined:size,height:label?undefined:size,
        padding:label?"10px 16px":"0",
        borderRadius:label?12:"50%",
        background:"#25D366",color:"#fff",textDecoration:"none",
        fontFamily:"Georgia,serif",fontSize:label?13:20,fontWeight:700,
        boxShadow:"0 2px 8px rgba(37,211,102,.4)",flexShrink:0,...style,
      }}>
      {label?"📲 "+label:"📲"}
    </a>
  );
}

export function Logo({size=44}) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <polygon points="50,6 90,36 90,94 10,94 10,36" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="4.5" strokeLinejoin="round"/>
      <ellipse cx="50" cy="74" rx="29" ry="10" fill={C.espresso} stroke="rgba(255,255,255,0.7)" strokeWidth="2.5"/>
      <path d="M21,74 Q50,45 79,74" stroke="rgba(255,255,255,0.8)" strokeWidth="3.5" strokeLinecap="round"/>
    </svg>
  );
}
