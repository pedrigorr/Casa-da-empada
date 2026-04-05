import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase/config.js";
import { C } from "./utils/constants.js";
import { Logo, Spinner } from "./components/UI.jsx";
import AuthPage from "./AuthPage.jsx";
import AdminLayout from "./AdminLayout.jsx";
import DriverDashboard from "./DriverDashboard.jsx";

export default function App() {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, async (fireUser)=>{
      if(fireUser) {
        try {
          const snap = await getDoc(doc(db,"users",fireUser.uid));
          if(snap.exists()) setUser({uid:fireUser.uid,...snap.data()});
          else setUser(null);
        } catch { setUser(null); }
      } else { setUser(null); }
      setLoading(false);
    });
    return()=>unsub();
  },[]);

  if(loading) return (
    <div style={{minHeight:"100vh",background:`linear-gradient(135deg,${C.espresso},${C.brown})`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16}}>
      <Logo size={64}/>
      <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:22,fontWeight:900,color:C.cream}}>Casa da Empada</div>
      <div style={{width:40,height:40,borderRadius:"50%",border:`3px solid rgba(255,255,255,0.2)`,borderTop:`3px solid ${C.sand}`,animation:"spin 1s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );

  if(!user) return <AuthPage onAuth={setUser}/>;
  if(user.role==="driver") return <DriverDashboard user={user}/>;
  return <AdminLayout user={user}/>;
}
