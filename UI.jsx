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

export function Modal({children, onClose, maxWidth=400}) {
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:500,padding:"0"}}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:C.warmWhite,borderRadius:"24px 24px 0 0",
        padding:"24px 20px 40px",width:"100%",maxWidth,
        boxShadow:"0 -8px 40px rgba(0,0,0,0.25)",
        animation:"slideUp .3s cubic-bezier(.34,1.56,.64,1)",
        maxHeight:"90vh",overflowY:"auto",
      }}>
        {children}
      </div>
    </div>
  );
}

export function Pill({label, emoji, active, onClick, count}) {
  return (
    <button onClick={onClick} style={{
      display:"flex",alignItems:"center",gap:5,
      padding:"7px 14px",borderRadius:20,border:"none",cursor:"pointer",
      background:active?C.terracotta:C.warmWhite,
      color:active?"#fff":C.brown,
      fontFamily:"Georgia,serif",fontSize:12,fontWeight:700,
      boxShadow:active?`0 3px 12px ${C.shadow}`:"none",
      transition:"all .2s",whiteSpace:"nowrap",
      border:`1.5px solid ${active?C.terracotta:C.parchment}`,
    }}>
      {emoji} {label}
      {count>0 && <span style={{
        background:active?"rgba(255,255,255,0.3)":C.terracotta,
        color:active?"#fff":"#fff",borderRadius:10,
        padding:"1px 7px",fontSize:11,marginLeft:2,
      }}>{count}</span>}
    </button>
  );
}

export function SBadge({status}) {
  const s = {
    encomenda:{label:"📅 Encomenda",color:"#7B5EA7",bg:"#EDE7F6"},
    preparo:  {label:"👨‍🍳 Preparo",  color:C.rust,   bg:"#FEF3C7"},
    saiu:     {label:"🛵 Saiu",     color:C.teal,   bg:"#D8F0ED"},
    retirada: {label:"🏠 Retirada", color:C.gold,   bg:"#FFF3CC"},
    entregue: {label:"✅ Entregue", color:"#16a34a",bg:"#dcfce7"},
    retirado: {label:"✅ Retirado", color:"#16a34a",bg:"#dcfce7"},
  }[status]||{label:status,color:C.sand,bg:C.parchment};
  return (
    <span style={{background:s.bg,color:s.color,border:`1.5px solid ${s.color}`,borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700,fontFamily:"Georgia,serif",whiteSpace:"nowrap"}}>
      {s.label}
    </span>
  );
}

export function Card({children, style={}}) {
  return (
    <div style={{
      background:C.warmWhite,borderRadius:16,
      border:`1px solid ${C.parchment}`,
      boxShadow:`0 2px 12px ${C.shadow}`,
      overflow:"hidden",...style,
    }}>{children}</div>
  );
}

export function StatCard({emoji, label, value, sub, accent=C.terracotta}) {
  return (
    <div style={{
      background:C.warmWhite,borderRadius:16,padding:"16px 14px",
      border:`1px solid ${C.parchment}`,flex:1,minWidth:90,
      boxShadow:`0 2px 8px ${C.shadow}`,
    }}>
      <div style={{fontSize:24,marginBottom:4}}>{emoji}</div>
      <div style={{fontSize:10,color:C.sand,fontFamily:"Georgia,serif",letterSpacing:1,textTransform:"uppercase"}}>{label}</div>
      <div style={{fontSize:20,fontWeight:700,color:accent,fontFamily:"'Playfair Display',Georgia,serif",marginTop:2,lineHeight:1.2}}>{value}</div>
      {sub&&<div style={{fontSize:11,color:C.rust,fontFamily:"Georgia,serif",marginTop:2}}>{sub}</div>}
    </div>
  );
}

export const fieldStyle = (extra={}) => ({
  width:"100%",padding:"12px 14px",borderRadius:12,
  border:`1.5px solid ${C.parchment}`,background:C.warmWhite,
  fontFamily:"Georgia,serif",fontSize:14,color:C.espresso,
  outline:"none",boxSizing:"border-box",
  transition:"border-color .2s",...extra,
});

export const Lbl = ({children, mt=8}) => (
  <div style={{fontSize:11,color:C.rust,fontFamily:"Georgia,serif",fontWeight:700,letterSpacing:1,marginTop:mt,marginBottom:5,textTransform:"uppercase"}}>
    {children}
  </div>
);

export function BtnPrimary({children, onClick, disabled, loading, style={}}) {
  return (
    <button onClick={onClick} disabled={disabled||loading} style={{
      width:"100%",padding:"15px",borderRadius:14,border:"none",cursor:disabled||loading?"not-allowed":"pointer",
      background:disabled||loading?C.sand:`linear-gradient(135deg,${C.terracotta},${C.rust})`,
      color:"#fff",fontFamily:"Georgia,serif",fontSize:15,fontWeight:700,
      letterSpacing:.5,boxShadow:disabled||loading?"none":`0 4px 16px rgba(196,101,58,.4)`,
      transition:"all .2s",...style,
    }}>{loading?"⏳ Aguarde...":children}</button>
  );
}

export function WaButton({phone, label="", size=44, style={}}) {
  if(!phone) return null;
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
      <ellipse cx="50" cy="74" rx="29" ry="10" fill={C.teal} stroke="rgba(255,255,255,0.7)" strokeWidth="2"/>
      <rect x="21" y="57" width="58" height="18" rx="2" fill={C.teal} stroke="rgba(255,255,255,0.7)" strokeWidth="2"/>
      <path d="M21 57 Q50 30 79 57" fill={C.sand} stroke="rgba(255,255,255,0.7)" strokeWidth="2"/>
      <path d="M21 57 Q26 51 31 57 Q36 51 41 57 Q46 51 51 57 Q56 51 61 57 Q66 51 71 57 Q76 51 79 57" fill="none" stroke={C.terracotta} strokeWidth="2.5"/>
      <path d="M44 30 Q50 18 56 30 Q53 24 50 27 Q47 24 44 30Z" fill={C.warmWhite} stroke="rgba(255,255,255,0.7)" strokeWidth="1.5"/>
    </svg>
  );
}
