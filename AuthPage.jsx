import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config.js";
import { C } from "../utils/constants.js";
import { fieldStyle, Lbl, BtnPrimary, Logo } from "../components/UI.jsx";

export default function AuthPage({onAuth}) {
  const [mode,     setMode]     = useState("login"); // login | register
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [name,     setName]     = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [role,     setRole]     = useState("driver");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleLogin() {
    if(!email||!password) return setError("Preencha e-mail e senha.");
    setLoading(true); setError("");
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const snap = await getDoc(doc(db,"users",cred.user.uid));
      if(snap.exists()) onAuth({uid:cred.user.uid,...snap.data()});
      else setError("Usuário não encontrado no sistema.");
    } catch(e) {
      setError("E-mail ou senha inválidos.");
    }
    setLoading(false);
  }

  async function handleRegister() {
    if(!email||!password||!name) return setError("Preencha todos os campos obrigatórios.");
    if(password.length<6) return setError("Senha deve ter ao menos 6 caracteres.");
    setLoading(true); setError("");
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const userData = {uid:cred.user.uid, name, email, whatsapp, role, createdAt:new Date().toISOString()};
      await setDoc(doc(db,"users",cred.user.uid), userData);
      onAuth(userData);
    } catch(e) {
      if(e.code==="auth/email-already-in-use") setError("E-mail já cadastrado.");
      else setError("Erro ao criar conta. Tente novamente.");
    }
    setLoading(false);
  }

  return (
    <div style={{minHeight:"100vh",background:`linear-gradient(160deg,${C.espresso} 0%,${C.brown} 60%,${C.terracotta} 100%)`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}}>
      
      {/* Logo */}
      <div style={{textAlign:"center",marginBottom:32}}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:12}}>
          <Logo size={64}/>
        </div>
        <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:26,fontWeight:900,color:C.cream,letterSpacing:1}}>
          Casa da Empada
        </div>
        <div style={{fontSize:11,color:C.sand,letterSpacing:4,textTransform:"uppercase",marginTop:4}}>
          Artesanal · Gestão
        </div>
      </div>

      {/* Card */}
      <div style={{background:C.warmWhite,borderRadius:24,padding:"28px 24px",width:"100%",maxWidth:380,boxShadow:"0 20px 60px rgba(0,0,0,0.4)"}}>
        
        {/* Tabs */}
        <div style={{display:"flex",background:C.cream,borderRadius:12,padding:4,marginBottom:24}}>
          {[["login","Entrar"],["register","Cadastrar"]].map(([m,l])=>(
            <button key={m} onClick={()=>{setMode(m);setError("");}} style={{
              flex:1,padding:"9px",borderRadius:9,border:"none",cursor:"pointer",
              background:mode===m?C.warmWhite:"transparent",
              color:mode===m?C.brown:C.sand,
              fontFamily:"Georgia,serif",fontSize:13,fontWeight:700,
              boxShadow:mode===m?`0 2px 8px ${C.shadow}`:"none",
              transition:"all .2s",
            }}>{l}</button>
          ))}
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          {mode==="register"&&<>
            <Lbl mt={0}>NOME COMPLETO *</Lbl>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Seu nome" style={fieldStyle({marginBottom:8})}/>
            <Lbl mt={0}>WHATSAPP</Lbl>
            <input value={whatsapp} onChange={e=>setWhatsapp(e.target.value)} placeholder="(75) 9 0000-0000" style={fieldStyle({marginBottom:8})}/>
            <Lbl mt={0}>TIPO DE ACESSO</Lbl>
            <div style={{display:"flex",gap:8,marginBottom:8}}>
              {[["admin","👑 Admin"],["driver","🛵 Entregador"]].map(([v,l])=>(
                <button key={v} onClick={()=>setRole(v)} style={{
                  flex:1,padding:"10px",borderRadius:10,cursor:"pointer",
                  border:`2px solid ${role===v?C.terracotta:C.parchment}`,
                  background:role===v?C.terracotta:C.warmWhite,
                  color:role===v?"#fff":C.brown,
                  fontFamily:"Georgia,serif",fontSize:13,fontWeight:700,
                }}>{l}</button>
              ))}
            </div>
          </>}

          <Lbl mt={0}>E-MAIL *</Lbl>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com" style={fieldStyle({marginBottom:8})}/>
          <Lbl mt={0}>SENHA *</Lbl>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" style={fieldStyle({marginBottom:16})}
            onKeyDown={e=>e.key==="Enter"&&(mode==="login"?handleLogin():handleRegister())}/>

          {error&&<div style={{background:"#fee2e2",color:"#dc2626",padding:"10px 14px",borderRadius:10,fontFamily:"Georgia,serif",fontSize:13,marginBottom:12,textAlign:"center"}}>{error}</div>}

          <BtnPrimary onClick={mode==="login"?handleLogin:handleRegister} loading={loading}>
            {mode==="login"?"🔑 Entrar":"✅ Criar Conta"}
          </BtnPrimary>
        </div>
      </div>

      <div style={{marginTop:24,fontFamily:"Georgia,serif",fontSize:11,color:"rgba(255,255,255,0.4)",textAlign:"center"}}>
        🥧 Casa da Empada Artesanal · (75) 9.8119-4734
      </div>
    </div>
  );
}
