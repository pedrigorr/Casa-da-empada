import { useState, useRef, useEffect, useMemo } from "react";
import { C, MENU, ALL_ITEMS, PAYMENT_METHODS, CIDADES, fmt } from "./constants.js";
import { fieldStyle, Lbl, BtnPrimary } from "./UI.jsx";

function ClienteInput({ value, onChange, clients }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const suggestions = useMemo(() => {
    if (!value.trim()) return [];
    return clients
      .filter(c => c.name && c.name.toLowerCase().includes(value.toLowerCase()))
      .slice(0, 6);
  }, [value, clients]);

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input
        value={value}
        onChange={e => { onChange("name", e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Nome do cliente"
        style={fieldStyle()}
      />
      {open && suggestions.length > 0 && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 300,
          background: C.warmWhite,
          border: "2px solid " + C.terracotta,
          borderRadius: "0 0 12px 12px",
          boxShadow: "0 8px 24px " + C.shadow,
          overflow: "hidden",
        }}>
          {suggestions.map(c => (
            <div
              key={c.name}
              onMouseDown={() => { onChange("client", c); setOpen(false); }}
              style={{
                padding: "11px 14px", cursor: "pointer",
                borderBottom: "1px solid " + C.parchment,
                fontFamily: "Georgia,serif", fontSize: 13,
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = C.parchment; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
            >
              <div>
                <div style={{ color: C.espresso, fontWeight: 700 }}>👤 {c.name}</div>
                {c.whatsapp && <div style={{ fontSize: 11, color: C.sand }}>📲 {c.whatsapp}</div>}
              </div>
              <span style={{ fontSize: 11, color: C.sand }}>{c.orders || 0} pedidos</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NovoPedido({ onSave, showToast, clients }) {
  const [cart,        setCart]       = useState({});
  const [name,        setName]       = useState("");
  const [phone,       setPhone]      = useState("");
  const [addr,        setAddr]       = useState("");
  const [cidadeOpt,   setCidadeOpt]  = useState("Sátiro Dias");
  const [cidadeText,  setCidadeText] = useState("");
  const [tipo,        setTipo]       = useState("delivery");
  const [pay,         setPay]        = useState("pix");
  const [payVal,      setPayVal]     = useState("");
  const [freight,     setFreight]    = useState("");
  const [note,        setNote]       = useState("");
  const [search,      setSearch]     = useState("");
  const [delivDate,   setDelivDate]  = useState("");
  const [delivTime,   setDelivTime]  = useState("");
  const [signal,      setSignal]     = useState("");
  const [saving,      setSaving]     = useState(false);

  const cidade      = cidadeOpt === "Outra" ? cidadeText : cidadeOpt;
  const freightNum  = parseFloat(freight.replace(",", ".") || "0") || 0;
  const itemsTotal  = Object.entries(cart).reduce((s, [id, q]) => {
    const it = ALL_ITEMS.find(x => x.id === Number(id));
    return s + (it ? it.price * q : 0);
  }, 0);
  const total      = itemsTotal + freightNum;
  const signalNum  = parseFloat(signal.replace(",", ".") || "0") || 0;
  const change     = pay === "dinheiro" && payVal
    ? Math.max(0, parseFloat(payVal.replace(",", ".")) - total) : 0;
  const cartItems  = Object.entries(cart).map(([id, q]) => ({
    ...ALL_ITEMS.find(x => x.id === Number(id)), qty: q,
  }));
  const filtered   = search.trim()
    ? ALL_ITEMS.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    : null;

  const add = it => setCart(p => ({ ...p, [it.id]: (p[it.id] || 0) + 1 }));
  const rem = it => setCart(p => {
    const u = { ...p };
    if (u[it.id] > 1) u[it.id]--;
    else delete u[it.id];
    return u;
  });

  function handleClientChange(type, val) {
    if (type === "name")   { setName(val); }
    if (type === "client") { setName(val.name || ""); setPhone(val.whatsapp || ""); setAddr(val.address || ""); }
  }

  async function submit() {
    if (!name.trim())                           { showToast("Informe o nome do cliente!", "error"); return; }
    if (!cartItems.length)                      { showToast("Adicione pelo menos um item!", "error"); return; }
    if (tipo === "delivery" && !addr.trim())    { showToast("Informe o endereço!", "error"); return; }
    if (tipo === "encomenda" && !delivDate)     { showToast("Informe a data de entrega!", "error"); return; }
    setSaving(true);
    try {
      await onSave({
        customer: name, customerPhone: phone, address: addr, cidade, tipo,
        payment: pay,
        payVal: pay === "dinheiro" ? parseFloat(payVal.replace(",", ".") || total) : total,
        change, note, items: cartItems, total, freight: freightNum,
        signalPaid: tipo === "encomenda" ? signalNum : 0,
        deliveryDate: tipo === "encomenda" ? delivDate : "",
        deliveryTime: tipo === "encomenda" ? delivTime : "",
        status: tipo === "encomenda" ? "encomenda" : "preparo",
        entregadorId: "",
        createdAt: new Date().toISOString(),
      });
      setCart({}); setName(""); setPhone(""); setAddr(""); setPayVal("");
      setNote(""); setSearch(""); setSignal(""); setDelivDate(""); setDelivTime(""); setFreight("");
    } catch { showToast("Erro ao salvar pedido!", "error"); }
    setSaving(false);
  }

  const renderItems = items => items.map(item => (
    <div key={item.id} style={{
      display: "flex", alignItems: "center", gap: 10,
      background: C.warmWhite, borderRadius: 12, padding: "10px 13px",
      border: "1px solid " + C.parchment,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: C.espresso, fontFamily: "Georgia,serif", lineHeight: 1.3 }}>{item.name}</div>
        <div style={{ fontSize: 13, color: C.terracotta, fontWeight: 700, fontFamily: "Georgia,serif" }}>{fmt(item.price)}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        {cart[item.id] && (
          <>
            <button onClick={() => rem(item)} style={{ width: 30, height: 30, borderRadius: "50%", border: "none", cursor: "pointer", background: C.parchment, color: C.brown, fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.brown, minWidth: 20, textAlign: "center" }}>{cart[item.id]}</span>
          </>
        )}
        <button onClick={() => add(item)} style={{ width: 30, height: 30, borderRadius: "50%", border: "none", cursor: "pointer", background: C.terracotta, color: "#fff", fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
      </div>
    </div>
  ));

  const tipoBtn = (v, ic, l) => (
    <button key={v} onClick={() => setTipo(v)} style={{
      padding: "11px 4px", borderRadius: 12, cursor: "pointer",
      border: "2px solid " + (tipo === v ? C.terracotta : C.parchment),
      background: tipo === v ? C.terracotta : C.warmWhite,
      color: tipo === v ? "#fff" : C.brown,
      fontFamily: "Georgia,serif", fontSize: 12, fontWeight: 700,
      boxShadow: tipo === v ? "0 3px 12px rgba(166,75,42,.3)" : "none",
    }}>
      <div style={{ fontSize: 20, marginBottom: 2 }}>{ic}</div>{l}
    </button>
  );

  return (
    <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 13, maxWidth: 640, margin: "0 auto", paddingBottom: 50 }}>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7 }}>
        {tipoBtn("delivery",  "🛵", "Delivery")}
        {tipoBtn("retirada",  "🏠", "Retirada")}
        {tipoBtn("encomenda", "📅", "Encomenda")}
      </div>

      <div>
        <Lbl>Cliente *</Lbl>
        <ClienteInput value={name} onChange={handleClientChange} clients={clients} />
        <input value={phone} onChange={e => setPhone(e.target.value)}
          placeholder="WhatsApp do cliente (opcional)"
          style={fieldStyle({ marginTop: 8 })} />
      </div>

      <div>
        <Lbl>Cidade</Lbl>
        <div style={{ display: "flex", gap: 6 }}>
          {CIDADES.map(c => (
            <button key={c} onClick={() => setCidadeOpt(c)} style={{
              flex: 1, padding: "9px 4px", borderRadius: 10, cursor: "pointer",
              border: "2px solid " + (cidadeOpt === c ? C.teal : C.parchment),
              background: cidadeOpt === c ? C.teal : C.warmWhite,
              color: cidadeOpt === c ? "#fff" : C.brown,
              fontFamily: "Georgia,serif", fontSize: 12, fontWeight: 700,
            }}>{c}</button>
          ))}
        </div>
        {cidadeOpt === "Outra" && (
          <input value={cidadeText} onChange={e => setCidadeText(e.target.value)}
            placeholder="Digite a cidade..." style={fieldStyle({ marginTop: 8 })} />
        )}
      </div>

      {(tipo === "delivery" || tipo === "encomenda") && (
        <div>
          <Lbl>Endereço {tipo === "delivery" ? "*" : ""}</Lbl>
          <input value={addr} onChange={e => setAddr(e.target.value)}
            placeholder="Rua, número, bairro..." style={fieldStyle()} />
        </div>
      )}

      {tipo === "encomenda" && (
        <div style={{ background: "#EDE7F6", borderRadius: 14, padding: 14, border: "1.5px solid #B39DDB" }}>
          <div style={{ fontFamily: "Georgia,serif", fontSize: 13, fontWeight: 700, color: "#7B5EA7", marginBottom: 10 }}>📅 Detalhes da Encomenda</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
            <div>
              <Lbl mt={0}>Data *</Lbl>
              <input type="date" value={delivDate} onChange={e => setDelivDate(e.target.value)} style={fieldStyle()} />
            </div>
            <div>
              <Lbl mt={0}>Horário</Lbl>
              <input type="time" value={delivTime} onChange={e => setDelivTime(e.target.value)} style={fieldStyle()} />
            </div>
          </div>
          <Lbl mt={0}>Sinal pago (R$)</Lbl>
          <input value={signal} onChange={e => setSignal(e.target.value)} placeholder="0,00" style={fieldStyle()} />
          {signalNum > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Georgia,serif", fontSize: 12, marginTop: 6 }}>
              <span style={{ color: "#7B5EA7" }}>✅ Sinal: {fmt(signalNum)}</span>
              <span style={{ color: C.rust }}>⏳ Restante: {fmt(Math.max(0, total - signalNum))}</span>
            </div>
          )}
        </div>
      )}

      <div>
        <Lbl>Frete / Comissão Entregador (R$)</Lbl>
        <input value={freight} onChange={e => setFreight(e.target.value)} placeholder="0,00" style={fieldStyle()} />
      </div>

      <div>
        <Lbl>Adicionar Itens</Lbl>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Buscar produto..." style={fieldStyle()} />
      </div>

      {filtered ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {filtered.length === 0
            ? <div style={{ textAlign: "center", color: C.sand, fontFamily: "Georgia,serif", padding: 16 }}>Nada encontrado</div>
            : renderItems(filtered)}
        </div>
      ) : Object.entries(MENU).map(([cat, items]) => (
        <div key={cat}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.rust, fontFamily: "Georgia,serif", marginBottom: 6, letterSpacing: 1 }}>{cat}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>{renderItems(items)}</div>
        </div>
      ))}

      {cartItems.length > 0 && (
        <div style={{ background: C.parchment, borderRadius: 14, padding: 14, border: "1.5px solid " + C.sand }}>
          <Lbl mt={0}>🛒 Resumo do Pedido</Lbl>
          {cartItems.map(it => (
            <div key={it.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.espresso, fontFamily: "Georgia,serif", margin: "5px 0" }}>
              <span>{it.qty}× {it.name}</span>
              <span style={{ fontWeight: 700 }}>{fmt(it.price * it.qty)}</span>
            </div>
          ))}
          {freightNum > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontFamily: "Georgia,serif", color: C.teal, margin: "5px 0" }}>
              <span>🛵 Frete</span><span style={{ fontWeight: 700 }}>{fmt(freightNum)}</span>
            </div>
          )}
          <div style={{ borderTop: "2px solid " + C.sand, marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 17, fontFamily: "Georgia,serif" }}>
            <span style={{ color: C.brown }}>Total</span>
            <span style={{ color: C.terracotta }}>{fmt(total)}</span>
          </div>
        </div>
      )}

      <div>
        <Lbl>Pagamento</Lbl>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {PAYMENT_METHODS.map(m => (
            <button key={m.id} onClick={() => setPay(m.id)} style={{
              padding: "9px 13px", borderRadius: 10, cursor: "pointer",
              border: "2px solid " + (pay === m.id ? C.terracotta : C.parchment),
              background: pay === m.id ? C.terracotta : C.warmWhite,
              color: pay === m.id ? "#fff" : C.brown,
              fontFamily: "Georgia,serif", fontSize: 12, fontWeight: 700,
            }}>{m.label}</button>
          ))}
        </div>
        {pay === "dinheiro" && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
            <input value={payVal} onChange={e => setPayVal(e.target.value)}
              placeholder="Valor recebido (R$)" style={fieldStyle({ flex: 1 })} />
            {payVal && (
              <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 700, fontFamily: "Georgia,serif", whiteSpace: "nowrap" }}>
                Troco: {fmt(change)}
              </span>
            )}
          </div>
        )}
      </div>

      <div>
        <Lbl>Observações</Lbl>
        <textarea value={note} onChange={e => setNote(e.target.value)}
          placeholder="Ex: sem cebola, sabores específicos..." rows={2}
          style={fieldStyle({ resize: "none" })} />
      </div>

      <div style={{ background: "#f0fdf4", borderRadius: 12, padding: "10px 14px", border: "1.5px solid #86efac", display: "flex", gap: 8, alignItems: "center" }}>
        <span>📲</span>
        <span style={{ fontFamily: "Georgia,serif", fontSize: 12, color: "#16a34a" }}>
          O resumo será enviado ao WhatsApp da Casa da Empada ao confirmar.
        </span>
      </div>

      <BtnPrimary onClick={submit} loading={saving}>✅ Confirmar Pedido</BtnPrimary>
    </div>
  );
}
