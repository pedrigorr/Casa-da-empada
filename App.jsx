import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./config.js";
import { C } from "./constants.js";
import { Logo } from "./UI.jsx";
import AuthPage from "./AuthPage.jsx";
import AdminLayout from "./AdminLayout.jsx";
import DriverDashboard from "./DriverDashboard.jsx";

export default function App() {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async fireUser => {
      if (fireUser) {
        try {
          const snap = await getDoc(doc(db, "users", fireUser.uid));
          if (snap.exists()) {
            const data = snap.data();
            // Bloqueia drivers pendentes
            if (data.role === "driver" && data.status === "pending") {
              setUser({ ...data, uid: fireUser.uid, blocked: true });
            } else {
              setUser({ uid: fireUser.uid, ...data });
            }
          } else {
            setUser(null);
          }
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg," + C.espresso + " 0%," + C.brown + " 55%," + C.terracotta + " 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 20,
    }}>
      <Logo size={64} />
      <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 22, fontWeight: 900, color: C.cream }}>
        Casa da Empada
      </div>
      <div style={{
        width: 40, height: 40, borderRadius: "50%",
        border: "3px solid rgba(255,255,255,0.2)",
        borderTop: "3px solid " + C.sand,
        animation: "spin 1s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } * { box-sizing:border-box; margin:0; padding:0; }`}</style>
    </div>
  );

  if (!user) return <AuthPage onAuth={setUser} />;

  if (user.blocked) return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg," + C.espresso + " 0%," + C.brown + " 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 24, textAlign: "center",
    }}>
      <Logo size={56} />
      <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 22, fontWeight: 900, color: C.cream, marginTop: 16, marginBottom: 10 }}>
        Cadastro em análise
      </div>
      <div style={{ fontFamily: "Georgia,serif", fontSize: 14, color: C.sand, maxWidth: 300, lineHeight: 1.7 }}>
        Seu cadastro foi enviado com sucesso e está aguardando aprovação do administrador. Você receberá acesso em breve.
      </div>
      <button onClick={() => { auth.signOut(); setUser(null); }} style={{ marginTop: 24, padding: "12px 24px", borderRadius: 12, border: "1.5px solid " + C.parchment, background: "transparent", color: C.parchment, fontFamily: "Georgia,serif", fontSize: 14, cursor: "pointer" }}>
        Voltar ao Login
      </button>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap'); * { box-sizing:border-box; margin:0; padding:0; }`}</style>
    </div>
  );

  if (user.role === "driver") return <DriverDashboard user={user} />;
  return <AdminLayout user={user} />;
}
