import { useState } from "react";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "./config.js";
import { C, fmt, fmtDt } from "./constants.js";
import { Card, fieldStyle, Lbl, BtnPrimary, WaButton, Modal } from "./UI.jsx";

const AVATARS = ["👤","👨","👩","🧔","👱","🧑","👴","👵","🧒","👶"];

function ClienteForm({ initial = {}, onSave, onClose }) {
  const [name,   setName]   = useState(initial.name    || "");
  const [wa,     setWa]     = useState(initial.whatsapp || "");
  const [addr,   setAddr]   = useState(initial.address  || "");
  const [avatar, setAvatar] = useState(initial.avatar   || "👤");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!name.trim() || !wa.trim()) return;
    setSaving(true);
    await onSave({ name, whatsapp: wa, address: addr, avatar });
    setSaving(false);
    onClose();
  }

  return (
    <div>
      <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 18, fontWeight: 900, color: C.brown, marginBottom: 16 }}>
        {initial._docId ? "Editar Cliente" : "Novo Cliente"}
      </div>
      <Lbl mt={0}>AVATAR</Lbl>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {AVATARS.map(a => (
          <button key={a} onClick={() => setAvatar(a)} style={{ fontSize: 22, width: 40, height: 40, borderRadius: 10, border: "2px solid " + (avatar === a ? C.terracotta : C.parchment), background: avatar === a ? C.parchment : C.warmWhite, cursor: "pointer" }}>{a}</button>
        ))}
      </div>
      <Lbl mt={0}>NOME *</Lbl>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Nome completo" style={fieldStyle({ marginBottom: 10 })} />
      <Lbl mt={0}>WHATSAPP *</Lbl>
      <input value={wa} onChange={e => setWa(e.target.value)} placeholder="(75) 9 0000-0000" style={fieldStyle({ marginBottom: 10 })} />
      <Lbl mt={0}>ENDEREÇO PADRÃO</Lbl>
      <input value={addr} onChange={e => setAddr(e.target.value)} placeholder="Rua, número, bairro..." style={fieldStyle({ marginBottom: 16 })} />
      <BtnPrimary onClick={submit} loading={saving}>Salvar Cliente</BtnPrimary>
    </div>
  );
}

export default function ClientesPage({ clients, orders }) {
  const [search,  setSearch]  = useState("");
  const [modal,   setModal]   = useState(null);
  const [viewCli, setViewCli] = useState(null);

  const filtered = search.trim()
    ? clients.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()) || c.whatsapp?.includes(search))
    : [...clients].sort((a, b) => (b.orders || 0) - (a.orders || 0));

  async function saveClient(data) {
    if (modal?.client?._docId) {
      await updateDoc(doc(db, "clients", modal.client._docId), data);
    } else {
      await addDoc(collection(db, "clients"), { ...data, orders: 0, total: 0, createdAt: new Date().toISOString() });
    }
  }

  const clientOrders = viewCli ? orders.filter(o => o.customer?.toLowerCase() === viewCli.name?.toLowerCase()) : [];

  return (
    <div style={{ padding: "12px 14px", maxWidth: 640, margin: "0 auto", paddingBottom: 50 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Buscar cliente..." style={fieldStyle({ flex: 1 })} />
        <button onClick={() => setModal({ mode: "new" })} style={{ padding: "11px 16px", borderRadius: 12, border: "none", cursor: "pointer", background: C.terracotta, color: "#fff", fontFamily: "Georgia,serif", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", boxShadow: "0 3px 12px rgba(166,75,42,.3)" }}>+ Novo</button>
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: C.sand, fontFamily: "Georgia,serif" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
          <div>Nenhum cliente ainda</div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map(c => (
          <Card key={c._docId || c.name} style={{ padding: "12px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 32, width: 48, height: 48, borderRadius: 12, background: C.parchment, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{c.avatar || "👤"}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "Georgia,serif", fontSize: 14, fontWeight: 700, color: C.brown }}>{c.name}</div>
                {c.address && <div style={{ fontFamily: "Georgia,serif", fontSize: 11, color: C.sand, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📍 {c.address}</div>}
                <div style={{ display: "flex", gap: 10, marginTop: 3, fontFamily: "Georgia,serif", fontSize: 11, color: C.sand }}>
                  <span>📦 {c.orders || 0} pedidos</span>
                  <span>💰 {fmt(c.total || 0)}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                {c.whatsapp && <WaButton phone={c.whatsapp} size={34} />}
                <button onClick={() => setViewCli(c)} style={{ width: 34, height: 34, borderRadius: "50%", border: "1.5px solid " + C.parchment, background: C.warmWhite, color: C.brown, cursor: "pointer", fontSize: 14 }}>👁</button>
                <button onClick={() => setModal({ mode: "edit", client: c })} style={{ width: 34, height: 34, borderRadius: "50%", border: "1.5px solid " + C.parchment, background: C.warmWhite, color: C.brown, cursor: "pointer", fontSize: 14 }}>✏️</button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {modal && (
        <Modal onClose={() => setModal(null)}>
          <ClienteForm initial={modal.client || {}} onSave={saveClient} onClose={() => setModal(null)} />
        </Modal>
      )}

      {viewCli && (
        <Modal onClose={() => setViewCli(null)}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 36 }}>{viewCli.avatar || "👤"}</div>
            <div>
              <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 18, fontWeight: 900, color: C.brown }}>{viewCli.name}</div>
              {viewCli.whatsapp && <div style={{ fontFamily: "Georgia,serif", fontSize: 12, color: C.sand }}>📲 {viewCli.whatsapp}</div>}
            </div>
            {viewCli.whatsapp && <WaButton phone={viewCli.whatsapp} size={40} style={{ marginLeft: "auto" }} />}
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <div style={{ flex: 1, background: C.parchment, borderRadius: 12, padding: "10px 12px", textAlign: "center" }}>
              <div style={{ fontFamily: "Georgia,serif", fontSize: 20, fontWeight: 700, color: C.terracotta }}>{clientOrders.length}</div>
              <div style={{ fontFamily: "Georgia,serif", fontSize: 10, color: C.sand, letterSpacing: 1 }}>PEDIDOS</div>
            </div>
            <div style={{ flex: 1, background: C.parchment, borderRadius: 12, padding: "10px 12px", textAlign: "center" }}>
              <div style={{ fontFamily: "Georgia,serif", fontSize: 16, fontWeight: 700, color: C.terracotta }}>{fmt(viewCli.total || 0)}</div>
              <div style={{ fontFamily: "Georgia,serif", fontSize: 10, color: C.sand, letterSpacing: 1 }}>TOTAL GASTO</div>
            </div>
          </div>
          <div style={{ fontFamily: "Georgia,serif", fontSize: 11, fontWeight: 700, color: C.rust, letterSpacing: 1, marginBottom: 8 }}>ÚLTIMOS PEDIDOS</div>
          {clientOrders.slice(0, 5).map(o => (
            <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid " + C.parchment, fontFamily: "Georgia,serif", fontSize: 12 }}>
              <span style={{ color: C.espresso }}>{o.id} · {fmtDt(o.createdAt)}</span>
              <span style={{ fontWeight: 700, color: C.terracotta }}>{fmt(o.total)}</span>
            </div>
          ))}
          {clientOrders.length === 0 && <div style={{ textAlign: "center", color: C.sand, padding: 20 }}>Nenhum pedido ainda</div>}
        </Modal>
      )}
    </div>
  );
}
