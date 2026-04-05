import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "./config.js";
import { C, ADMIN_EMAIL } from "./constants.js";
import { Logo, fieldStyle, Lbl, BtnPrimary } from "./UI.jsx";

export default function AuthPage({ onAuth }) {
  const [mode,     setMode]     = useState("login");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [name,     setName]     = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleLogin() {
    if (!email || !password) { setError("Preencha e-mail e senha."); return; }
    setLoading(true); setError("");
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const snap = await getDoc(doc(db, "users", cred.user.uid));
      if (snap.exists()) {
        onAuth({ uid: cred.user.uid, ...snap.data() });
      } else {
        setError("Usuário não cadastrado no sistema.");
      }
    } catch {
      setError("E-mail ou senha inválidos.");
    }
    setLoading(false);
  }

  async function handleRegister() {
    if (!name.trim() || !email || !password || !whatsapp.trim()) {
      setError("Preencha todos os campos."); return;
    }
    if (password.length < 6) { setError("Senha mínima: 6 caracteres."); return; }
    if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      setError("Este e-mail é reservado."); return;
    }
    setLoading(true); setError("");
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const userData = {
        uid: cred.user.uid, name, email, whatsapp,
        role: "driver", status: "pending",
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "users", cred.user.uid), userData);
      setError("");
      alert("Cadastro enviado! Aguarde aprovação do administrador.");
      setMode("login");
    } catch (e) {
      if (e.code === "auth/email-already-in-use") setError("E-mail já cadastrado.");
      else setError("Erro ao criar conta.");
    }
    setLoading(false);
  }

  const wrapStyle = {
    minHeight: "100vh",
    background: "linear-gradient(160deg," + C.espresso + " 0%," + C.brown + " 55%," + C.terracotta + " 100%)",
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", padding: 20,
  };

  const cardStyle = {
    background: C.warmWhite, borderRadius: 24, padding: "28px 22px",
    width: "100%", maxWidth: 380,
    boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
  };

  const tabBtn = (active) => ({
    flex: 1, padding: "9px", borderRadius: 9, border: "none", cursor: "pointer",
    background: active ? C.warmWhite : "transparent",
    color: active ? C.brown : C.sand,
    fontFamily: "Georgia,serif", fontSize: 13, fontWeight: 700,
    boxShadow: active ? "0 2px 8px " + C.shadow : "none",
    transition: "all .2s",
  });

  return (
    <div style={wrapStyle}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
          <Logo size={60} />
        </div>
        <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 26, fontWeight: 900, color: C.cream, letterSpacing: 1 }}>
          Casa da Empada
        </div>
        <div style={{ fontSize: 11, color: C.sand, letterSpacing: 4, textTransform: "uppercase", marginTop: 4 }}>
          Artesanal · Gestão
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ display: "flex", background: C.cream, borderRadius: 12, padding: 4, marginBottom: 22 }}>
          <button style={tabBtn(mode === "login")}  onClick={() => { setMode("login");    setError(""); }}>Entrar</button>
          <button style={tabBtn(mode === "register")} onClick={() => { setMode("register"); setError(""); }}>Cadastrar Motoboy</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {mode === "register" && (
            <>
              <Lbl mt={0}>NOME COMPLETO *</Lbl>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="Seu nome" style={fieldStyle({ marginBottom: 8 })} />
              <Lbl mt={0}>WHATSAPP *</Lbl>
              <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
                placeholder="(75) 9 0000-0000" style={fieldStyle({ marginBottom: 8 })} />
            </>
          )}

          <Lbl mt={0}>E-MAIL *</Lbl>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="seu@email.com" style={fieldStyle({ marginBottom: 8 })} />

          <Lbl mt={0}>SENHA *</Lbl>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" style={fieldStyle({ marginBottom: 16 })}
            onKeyDown={e => { if (e.key === "Enter") mode === "login" ? handleLogin() : handleRegister(); }} />

          {error && (
            <div style={{
              background: "#fee2e2", color: "#dc2626", padding: "10px 14px",
              borderRadius: 10, fontFamily: "Georgia,serif", fontSize: 13,
              marginBottom: 12, textAlign: "center",
            }}>{error}</div>
          )}

          {mode === "register" && (
            <div style={{
              background: "#fffbeb", border: "1px solid #fcd34d",
              borderRadius: 10, padding: "10px 14px", marginBottom: 12,
              fontFamily: "Georgia,serif", fontSize: 12, color: "#92400e",
            }}>
              ⚠️ O cadastro precisa ser aprovado pelo administrador antes do primeiro acesso.
            </div>
          )}

          <BtnPrimary onClick={mode === "login" ? handleLogin : handleRegister} loading={loading}>
            {mode === "login" ? "🔑 Entrar" : "📝 Enviar Cadastro"}
          </BtnPrimary>
        </div>
      </div>

      <div style={{ marginTop: 20, fontFamily: "Georgia,serif", fontSize: 11, color: "rgba(255,255,255,0.35)", textAlign: "center" }}>
        🥧 Casa da Empada Artesanal · (75) 9.8119-4734
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
        input:focus, textarea:focus, select:focus { border-color: ${C.terracotta} !important; box-shadow: 0 0 0 3px rgba(166,75,42,.15); }
        @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { transform:scale(1); } 50% { transform:scale(1.04); } }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: ${C.sand}; border-radius: 4px; }
        button:active { opacity: .82; transform: scale(.97); }
      `}</style>
    </div>
  );
}
