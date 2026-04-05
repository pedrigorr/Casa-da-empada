import { useState, useEffect, useCallback } from "react";
import { signOut } from "firebase/auth";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "./config.js";
import { C, WHATSAPP_ADMIN, fmt, fmtDt, isDone, ORDER_STATUS, PAYMENT_METHODS, CIDADES } from "./constants.js";
import { Toast, Spinner, Modal, Pill, SBadge, Card, StatCard, fieldStyle, Lbl, BtnPrimary, WaButton, Logo } from "./UI.jsx";
import NovoPedido from "./NovoPedido.jsx";
import ClientesPage from "./ClientesPage.jsx";
import AnalisePage from "./AnalisePage.jsx";

// ── HEADER ─────────────────────────────────────────────────────
function Header({ tab, setTab, ativos, synced }) {
  const tabs = [
    { id:"pedidos",  emoji:"📋", label:"Pedidos"    },
    { id:"novo",     emoji:"➕", label:"Novo"        },
    { id:"clientes", emoji:"👥", label:"Clientes"   },
    { id:"fin",      emoji:"📊", label:"Financeiro" },
    { id:"analise",  emoji:"📈", label:"Análise"    },
  ];
  return (
    <header style={{ background: "linear-gradient(135deg," + C.espresso + "," + C.brown + ")", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
      <div style={{ display: "flex", alignItems: "center", padding: "10px 16px 6px", gap: 10 }}>
        <Logo size={36} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 16, fontWeight: 900, color: C.cream, letterSpacing: .5 }}>Casa da Empada</div>
          <div style={{ fontSize: 9, color: synced ? "#86efac" : C.sand, letterSpacing: 2, textTransform: "uppercase" }}>
            {synced ? "☁️ Sincronizado" : "⏳ Conectando..."}
          </div>
        </div>
        {ativos > 0 && <div style={{ background: C.terracotta, color: "#fff", borderRadius: 20, padding: "2px 10px", fontSize: 13, fontWeight: 700, fontFamily: "Georgia,serif" }}>{ativos} ativos</div>}
        <button onClick={() => signOut(auth)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: C.sand, padding: "6px 10px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontFamily: "Georgia,serif" }}>Sair</button>
      </div>
      <nav style={{ display: "flex", overflowX: "auto", gap: 2, padding: "0 8px 6px" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            padding: "6px 10px", border: "none", cursor: "pointer", borderRadius: 10,
            background: tab === t.id ? "rgba(166,75,42,.9)" : "transparent",
            color: tab === t.id ? "#fff" : C.parchment,
            fontFamily: "Georgia,serif", fontSize: 10, whiteSpace: "nowrap",
            minWidth: 52, transition: "all .18s", gap: 1,
          }}>
            <span style={{ fontSize: 16 }}>{t.emoji}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </header>
  );
}

// ── PEDIDOS PAGE ───────────────────────────────────────────────
function PedidosPage({ orders, onStatus, onDelete, clients, drivers }) {
  const [filter,     setFilter]     = useState("preparo");
  const [expanded,   setExpanded]   = useState(null);
  const [waModal,    setWaModal]    = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const statusFilters = [
    { id:"encomenda", emoji:"📅", label:"Encomendas" },
    { id:"preparo",   emoji:"👨‍🍳", label:"Preparo"    },
    { id:"saiu",      emoji:"🛵", label:"Saiu"        },
    { id:"retirada",  emoji:"🏠", label:"Retirada"    },
    { id:"entregue",  emoji:"✅", label:"Feitos"      },
  ];

  const visible = filter === "entregue"
    ? orders.filter(o => isDone(o.status))
    : orders.filter(o => o.status === filter);

  function buildWaMsg(order) {
    const payLabel = PAYMENT_METHODS.find(m => m.id === order.payment)?.label || order.payment;
    return [
      "🥧 *PEDIDO " + order.id + " - Casa da Empada*", "",
      "👤 " + order.customer,
      order.address ? "📍 " + order.address : "",
      order.tipo === "encomenda" && order.deliveryDate ? "📅 Entrega: " + order.deliveryDate + " às " + (order.deliveryTime || "--:--") : "",
      "", "*Itens:*",
      ...(order.items || []).map(it => "▪ " + it.qty + "x " + it.name + " — " + fmt(it.price * it.qty)),
      "",
      "💰 *Total: " + fmt(order.total) + "*",
      order.freight > 0 ? "🛵 Frete: " + fmt(order.freight) : "",
      "💳 " + payLabel,
      order.note ? "📝 " + order.note : "",
    ].filter(l => l !== "").join("\n");
  }

  async function assignDriver(orderId, docId, driverId) {
    const driver = drivers.find(d => d.uid === driverId);
    if (docId) {
      await updateDoc(doc(db, "orders", docId), {
        entregadorId:   driverId,
        entregadorNome: driver ? driver.name : "",
      });
    }
  }

  const getClient = name => clients.find(c => c.name && c.name.toLowerCase() === (name || "").toLowerCase());

  return (
    <div style={{ padding: "12px 14px", maxWidth: 640, margin: "0 auto", paddingBottom: 50 }}>
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, marginBottom: 12 }}>
        {statusFilters.map(f => {
          const cnt = f.id === "entregue"
            ? orders.filter(o => isDone(o.status)).length
            : orders.filter(o => o.status === f.id).length;
          return <Pill key={f.id} emoji={f.emoji} label={f.label} active={filter === f.id} count={cnt} onClick={() => setFilter(f.id)} />;
        })}
      </div>

      {visible.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: C.sand, fontFamily: "Georgia,serif" }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🥧</div>
          <div>Nenhum pedido aqui</div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {visible.map(order => {
          const s       = ORDER_STATUS[order.status];
          const isExp   = expanded === order.id;
          const done    = isDone(order.status);
          const isEnc   = order.status === "encomenda";
          const cli     = getClient(order.customer);

          return (
            <Card key={order.id} style={{ border: "1.5px solid " + (isExp ? C.terracotta : C.parchment) }}>
              <div onClick={() => setExpanded(isExp ? null : order.id)} style={{ padding: "13px 14px", cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "Georgia,serif", fontSize: 15, fontWeight: 700, color: C.brown }}>{order.id}</span>
                      <SBadge status={order.status} />
                      <span style={{ fontSize: 10, color: C.sand, marginLeft: "auto" }}>{fmtDt(order.createdAt)}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontFamily: "Georgia,serif", fontSize: 13, color: C.espresso }}>👤 {order.customer}</span>
                      {cli?.whatsapp && <WaButton phone={cli.whatsapp} size={28} />}
                    </div>
                    <div style={{ fontFamily: "Georgia,serif", fontSize: 12, color: C.sand, marginTop: 2 }}>
                      {order.tipo === "delivery" ? "🛵" : order.tipo === "encomenda" ? "📅" : "🏠"} {order.cidade || ""} {order.address ? "· " + order.address.split(",")[0] : ""}
                    </div>
                    {isEnc && order.deliveryDate && (
                      <div style={{ fontFamily: "Georgia,serif", fontSize: 11, color: "#7B5EA7", marginTop: 2 }}>
                        📅 Entrega: {order.deliveryDate} {order.deliveryTime ? "às " + order.deliveryTime : ""}
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                      <span style={{ fontFamily: "Georgia,serif", fontSize: 14, fontWeight: 700, color: C.terracotta }}>{fmt(order.total)}</span>
                      {order.freight > 0 && <span style={{ fontFamily: "Georgia,serif", fontSize: 11, color: C.teal }}>+frete {fmt(order.freight)}</span>}
                    </div>
                    {order.entregadorNome && (
                      <div style={{ fontFamily: "Georgia,serif", fontSize: 11, color: C.teal, marginTop: 2 }}>🛵 {order.entregadorNome}</div>
                    )}
                  </div>
                  <span style={{ color: C.sand, fontSize: 14, marginTop: 2 }}>{isExp ? "▲" : "▼"}</span>
                </div>
              </div>

              {isExp && (
                <div style={{ borderTop: "1px solid " + C.parchment, padding: "13px 14px", background: C.cream }}>
                  {order.note && (
                    <div style={{ fontSize: 12, color: C.rust, fontFamily: "Georgia,serif", marginBottom: 8, fontStyle: "italic", background: "#fff8f0", padding: "8px 12px", borderRadius: 8 }}>
                      📝 {order.note}
                    </div>
                  )}
                  {isEnc && order.signalPaid > 0 && (
                    <div style={{ display: "flex", gap: 12, marginBottom: 8, fontFamily: "Georgia,serif", fontSize: 12 }}>
                      <span style={{ color: C.sage }}>✅ Sinal: {fmt(order.signalPaid)}</span>
                      <span style={{ color: C.rust }}>⏳ A pagar: {fmt(order.total - order.signalPaid)}</span>
                    </div>
                  )}

                  <div style={{ marginBottom: 10 }}>
                    {(order.items || []).map((it, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontFamily: "Georgia,serif", color: C.espresso, padding: "3px 0", borderBottom: "1px solid " + C.parchment }}>
                        <span>{it.qty}× {it.name}</span>
                        <span style={{ fontWeight: 700 }}>{fmt(it.price * it.qty)}</span>
                      </div>
                    ))}
                    {order.freight > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontFamily: "Georgia,serif", color: C.teal, padding: "3px 0", borderBottom: "1px solid " + C.parchment }}>
                        <span>🛵 Frete</span><span style={{ fontWeight: 700 }}>{fmt(order.freight)}</span>
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontFamily: "Georgia,serif", paddingTop: 6 }}>
                      <span style={{ color: C.brown }}>Total</span>
                      <span style={{ color: C.terracotta, fontSize: 15 }}>{fmt(order.total)}</span>
                    </div>
                  </div>

                  <div style={{ fontSize: 12, color: C.espresso, fontFamily: "Georgia,serif", marginBottom: 12 }}>
                    💰 {PAYMENT_METHODS.find(m => m.id === order.payment)?.label || order.payment}
                    {order.payment === "dinheiro" && order.change > 0 ? " · Troco: " + fmt(order.change) : ""}
                  </div>

                  {/* Atribuir entregador */}
                  {!done && drivers.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <Lbl mt={0}>Atribuir Entregador</Lbl>
                      <select
                        value={order.entregadorId || ""}
                        onChange={e => assignDriver(order.id, order._docId, e.target.value)}
                        style={{ ...fieldStyle(), marginTop: 4 }}
                      >
                        <option value="">— Selecionar entregador —</option>
                        {drivers.map(d => (
                          <option key={d.uid} value={d.uid}>{d.name} {d.whatsapp ? "· " + d.whatsapp : ""}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                    {s?.next && !done && (
                      <button onClick={() => onStatus(order.id, s.next)} style={{ flex: 1, padding: "10px 12px", borderRadius: 11, border: "none", cursor: "pointer", background: C.terracotta, color: "#fff", fontFamily: "Georgia,serif", fontSize: 12, fontWeight: 700 }}>
                        ▶ {ORDER_STATUS[s.next]?.emoji} {ORDER_STATUS[s.next]?.label}
                      </button>
                    )}
                    <button onClick={() => setWaModal(buildWaMsg(order))} style={{ padding: "10px 12px", borderRadius: 11, border: "1.5px solid #25D366", cursor: "pointer", background: "#f0fdf4", color: "#16a34a", fontFamily: "Georgia,serif", fontSize: 12, fontWeight: 700 }}>
                      📲 WA
                    </button>
                    {!done && (
                      <button onClick={() => setConfirmDel(order.id)} style={{ padding: "10px 12px", borderRadius: 11, border: "1.5px solid " + C.parchment, cursor: "pointer", background: C.warmWhite, color: C.rust, fontFamily: "Georgia,serif", fontSize: 12 }}>🗑</button>
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {waModal && (
        <Modal onClose={() => setWaModal(null)}>
          <WaNumberModal message={waModal} onClose={() => setWaModal(null)} />
        </Modal>
      )}

      {confirmDel && (
        <Modal onClose={() => setConfirmDel(null)}>
          <div style={{ textAlign: "center", paddingBottom: 8 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
            <div style={{ fontFamily: "Georgia,serif", fontSize: 16, fontWeight: 700, color: C.brown, marginBottom: 8 }}>Cancelar pedido?</div>
            <div style={{ fontFamily: "Georgia,serif", fontSize: 13, color: C.espresso, marginBottom: 20 }}>Esta ação não pode ser desfeita.</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setConfirmDel(null)} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1.5px solid " + C.parchment, background: "transparent", color: C.espresso, fontFamily: "Georgia,serif", fontSize: 14, cursor: "pointer" }}>Não</button>
              <button onClick={() => { onDelete(confirmDel); setConfirmDel(null); }} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: "#dc2626", color: "#fff", fontFamily: "Georgia,serif", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Sim, cancelar</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function WaNumberModal({ message, onClose }) {
  const [number, setNumber] = useState("");
  return (
    <div>
      <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 18, fontWeight: 900, color: C.brown, marginBottom: 6 }}>📲 Enviar via WhatsApp</div>
      <p style={{ fontFamily: "Georgia,serif", fontSize: 13, color: C.espresso, marginBottom: 14 }}>Número do destinatário:</p>
      <input value={number} onChange={e => setNumber(e.target.value)} placeholder="(75) 9 8119-4734" style={fieldStyle({ marginBottom: 14 })} />
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => { if (number.trim()) { window.open("https://wa.me/55" + number.replace(/\D/g, "") + "?text=" + encodeURIComponent(message), "_blank"); onClose(); } }} style={{ flex: 1, padding: "12px", borderRadius: 11, border: "none", cursor: "pointer", background: "#25D366", color: "#fff", fontFamily: "Georgia,serif", fontSize: 14, fontWeight: 700 }}>Enviar 📲</button>
        <button onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: 11, border: "1.5px solid " + C.parchment, background: "transparent", color: C.rust, fontFamily: "Georgia,serif", fontSize: 14, cursor: "pointer" }}>Cancelar</button>
      </div>
    </div>
  );
}

// ── FINANCEIRO ─────────────────────────────────────────────────
function FinanceiroPage({ orders, caixaHistory, onCaixaClose, drivers }) {
  const [period,    setPeriod]    = useState("hoje");
  const [cidFilt,   setCidFilt]   = useState("Geral");
  const [showCaixa, setShowCaixa] = useState(false);
  const [caixaVal,  setCaixaVal]  = useState("");

  function rangeStart(p) {
    const d = new Date();
    if (p === "hoje")   { d.setHours(0,0,0,0); return d; }
    if (p === "semana") { d.setDate(d.getDate() - d.getDay()); d.setHours(0,0,0,0); return d; }
    if (p === "mes")    { d.setDate(1); d.setHours(0,0,0,0); return d; }
    d.setFullYear(d.getFullYear(), 0, 1); d.setHours(0,0,0,0); return d;
  }

  const done       = orders.filter(o => isDone(o.status));
  let   po         = done.filter(o => new Date(o.createdAt) >= rangeStart(period));
  if (cidFilt !== "Geral") po = po.filter(o => (o.cidade || "Sátiro Dias") === cidFilt);

  const total       = po.reduce((s, o) => s + o.total,   0);
  const qtd         = po.length;
  const ticket      = qtd ? total / qtd : 0;
  const totalFrete  = po.reduce((s, o) => s + (o.freight || 0), 0);

  const byPay = PAYMENT_METHODS.map(m => ({
    label: m.label,
    total: po.filter(o => o.payment === m.id).reduce((s, o) => s + o.total, 0),
    count: po.filter(o => o.payment === m.id).length,
  })).filter(x => x.count > 0);

  const todayCaixa      = caixaHistory.filter(c => new Date(c.date).toDateString() === new Date().toDateString());
  const totalCaixaHoje  = todayCaixa.reduce((s, c) => s + c.value, 0);

  const driverStats = drivers.map(d => {
    const dOrders  = po.filter(o => o.entregadorId === d.uid);
    const dinheiro = dOrders.filter(o => o.payment === "dinheiro").reduce((s, o) => s + o.total, 0);
    const fretes   = dOrders.reduce((s, o) => s + (o.freight || 0), 0);
    return { ...d, deliveries: dOrders.length, fretes, dinheiro };
  }).filter(d => d.deliveries > 0);

  function submitCaixa() {
    const v = parseFloat(caixaVal.replace(",", ".") || "0");
    if (!v) return;
    onCaixaClose({ value: v, date: new Date().toISOString() });
    setCaixaVal(""); setShowCaixa(false);
  }

  function buildDriverReport(d) {
    return [
      "📊 *Relatório do Entregador - " + d.name + "*",
      "🗓️ " + new Date().toLocaleDateString("pt-BR"), "",
      "🛵 Entregas: " + d.deliveries,
      "💰 Fretes ganhos: " + fmt(d.fretes),
      "💵 Dinheiro em posse: " + fmt(d.dinheiro), "",
      "✅ A entregar ao Admin: " + fmt(Math.max(0, d.dinheiro - d.fretes)),
    ].join("\n");
  }

  return (
    <div style={{ padding: "12px 14px", maxWidth: 640, margin: "0 auto", paddingBottom: 50 }}>
      <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
        {[["hoje","Hoje"],["semana","Semana"],["mes","Mês"],["ano","Ano"]].map(([v, l]) => (
          <button key={v} onClick={() => setPeriod(v)} style={{ flex: 1, padding: "9px 3px", borderRadius: 10, border: "2px solid " + (period === v ? C.terracotta : C.parchment), background: period === v ? C.terracotta : C.warmWhite, color: period === v ? "#fff" : C.brown, fontFamily: "Georgia,serif", fontSize: 12, cursor: "pointer", fontWeight: 700 }}>{l}</button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 5, marginBottom: 14 }}>
        {["Geral", "Sátiro Dias", "Inhambupe", "Outra"].map(c => (
          <button key={c} onClick={() => setCidFilt(c)} style={{ flex: 1, padding: "7px 3px", borderRadius: 8, border: "2px solid " + (cidFilt === c ? C.teal : C.parchment), background: cidFilt === c ? C.teal : C.warmWhite, color: cidFilt === c ? "#fff" : C.brown, fontFamily: "Georgia,serif", fontSize: 10, cursor: "pointer", fontWeight: 700 }}>{c}</button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <StatCard emoji="💰" label="Faturamento" value={fmt(total)} />
        <StatCard emoji="📦" label="Pedidos"     value={qtd}         sub="concluídos" />
        <StatCard emoji="🎯" label="Ticket"      value={fmt(ticket)} />
      </div>
      {totalFrete > 0 && (
        <div style={{ background: "#e0f2fe", borderRadius: 12, padding: "10px 14px", marginBottom: 12, fontFamily: "Georgia,serif", fontSize: 13, color: "#0369a1" }}>
          🛵 Total em fretes: <strong>{fmt(totalFrete)}</strong>
        </div>
      )}

      {period === "hoje" && (
        <Card style={{ marginBottom: 12, padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontFamily: "Georgia,serif", fontSize: 13, fontWeight: 700, color: C.brown }}>🗃️ Caixa do Dia</div>
            <button onClick={() => setShowCaixa(!showCaixa)} style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: C.terracotta, color: "#fff", fontFamily: "Georgia,serif", fontSize: 11, cursor: "pointer", fontWeight: 700 }}>{showCaixa ? "Cancelar" : "Fechar Caixa"}</button>
          </div>
          {todayCaixa.map((c, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontFamily: "Georgia,serif", color: C.espresso, padding: "3px 0" }}>
              <span>{fmtDt(c.date)}</span><span style={{ fontWeight: 700, color: C.rust }}>{fmt(c.value)}</span>
            </div>
          ))}
          {todayCaixa.length > 0 && (
            <div style={{ borderTop: "1px solid " + C.parchment, marginTop: 4, paddingTop: 4, display: "flex", justifyContent: "space-between", fontWeight: 700, fontFamily: "Georgia,serif", fontSize: 12 }}>
              <span>Total</span><span style={{ color: C.terracotta }}>{fmt(totalCaixaHoje)}</span>
            </div>
          )}
          {showCaixa && (
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <input value={caixaVal} onChange={e => setCaixaVal(e.target.value)} placeholder="Valor (R$)" style={fieldStyle({ flex: 1 })} />
              <button onClick={submitCaixa} style={{ padding: "10px 16px", borderRadius: 10, border: "none", cursor: "pointer", background: C.sage, color: "#fff", fontFamily: "Georgia,serif", fontSize: 14, fontWeight: 700 }}>✓</button>
            </div>
          )}
        </Card>
      )}

      {byPay.length > 0 && (
        <Card style={{ marginBottom: 12, padding: 14 }}>
          <Lbl mt={0}>💳 Por Forma de Pagamento</Lbl>
          {byPay.map(p => (
            <div key={p.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid " + C.parchment }}>
              <span style={{ fontFamily: "Georgia,serif", fontSize: 13, color: C.espresso }}>{p.label} <span style={{ color: C.sand }}>({p.count})</span></span>
              <span style={{ fontFamily: "Georgia,serif", fontSize: 13, fontWeight: 700, color: C.terracotta }}>{fmt(p.total)}</span>
            </div>
          ))}
        </Card>
      )}

      {driverStats.length > 0 && (
        <Card style={{ marginBottom: 12, padding: 14 }}>
          <Lbl mt={0}>🛵 Desempenho por Entregador</Lbl>
          {driverStats.map(d => (
            <div key={d.uid} style={{ padding: "10px 0", borderBottom: "1px solid " + C.parchment }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: "Georgia,serif", fontSize: 13, fontWeight: 700, color: C.brown }}>{d.name}</span>
                  {d.whatsapp && <WaButton phone={d.whatsapp} size={28} />}
                </div>
                <button onClick={() => {
                  const msg = buildDriverReport(d);
                  if (d.whatsapp) window.open("https://wa.me/55" + d.whatsapp.replace(/\D/g, "") + "?text=" + encodeURIComponent(msg), "_blank");
                }} style={{ padding: "5px 10px", borderRadius: 8, border: "none", background: "#25D366", color: "#fff", fontFamily: "Georgia,serif", fontSize: 11, cursor: "pointer" }}>
                  📲 Relatório
                </button>
              </div>
              <div style={{ display: "flex", gap: 12, fontFamily: "Georgia,serif", fontSize: 12 }}>
                <span style={{ color: C.teal }}>🛵 {d.deliveries} entregas</span>
                <span style={{ color: C.sage }}>💰 {fmt(d.fretes)}</span>
                <span style={{ color: C.rust }}>💵 Posse: {fmt(d.dinheiro)}</span>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// ── MOTOBOYS PAGE (admin) ──────────────────────────────────────
function MotoboysPage({ drivers, onApprove, onRemove }) {
  const pending  = drivers.filter(d => d.status === "pending");
  const approved = drivers.filter(d => d.status !== "pending");

  return (
    <div style={{ padding: "12px 14px", maxWidth: 640, margin: "0 auto", paddingBottom: 50 }}>
      {pending.length > 0 && (
        <>
          <div style={{ fontFamily: "Georgia,serif", fontSize: 12, fontWeight: 700, color: C.rust, letterSpacing: 1, marginBottom: 8 }}>⏳ AGUARDANDO APROVAÇÃO</div>
          {pending.map(d => (
            <Card key={d.uid} style={{ padding: "12px 14px", marginBottom: 8, border: "1.5px solid #fcd34d" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontFamily: "Georgia,serif", fontSize: 14, fontWeight: 700, color: C.brown }}>🛵 {d.name}</div>
                  <div style={{ fontFamily: "Georgia,serif", fontSize: 12, color: C.sand }}>{d.email}</div>
                  {d.whatsapp && <div style={{ fontFamily: "Georgia,serif", fontSize: 12, color: C.sand }}>📲 {d.whatsapp}</div>}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => onApprove(d.uid)} style={{ padding: "8px 12px", borderRadius: 9, border: "none", background: "#16a34a", color: "#fff", fontFamily: "Georgia,serif", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>✅ Aprovar</button>
                  <button onClick={() => onRemove(d.uid)} style={{ padding: "8px 12px", borderRadius: 9, border: "none", background: "#dc2626", color: "#fff", fontFamily: "Georgia,serif", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>❌</button>
                </div>
              </div>
            </Card>
          ))}
        </>
      )}

      <div style={{ fontFamily: "Georgia,serif", fontSize: 12, fontWeight: 700, color: C.rust, letterSpacing: 1, marginBottom: 8, marginTop: 16 }}>✅ ENTREGADORES ATIVOS</div>
      {approved.length === 0 && <div style={{ textAlign: "center", color: C.sand, fontFamily: "Georgia,serif", padding: "30px 0" }}>Nenhum entregador ativo</div>}
      {approved.map(d => (
        <Card key={d.uid} style={{ padding: "12px 14px", marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: "Georgia,serif", fontSize: 14, fontWeight: 700, color: C.brown }}>🛵 {d.name}</div>
              <div style={{ fontFamily: "Georgia,serif", fontSize: 12, color: C.sand }}>{d.email}</div>
              {d.whatsapp && <div style={{ fontFamily: "Georgia,serif", fontSize: 12, color: C.sand }}>📲 {d.whatsapp}</div>}
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {d.whatsapp && <WaButton phone={d.whatsapp} size={34} />}
              <button onClick={() => onRemove(d.uid)} style={{ padding: "8px 12px", borderRadius: 9, border: "none", background: "#dc2626", color: "#fff", fontFamily: "Georgia,serif", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>🗑 Remover</button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ── ADMIN LAYOUT ───────────────────────────────────────────────
export default function AdminLayout({ user }) {
  const [tab,          setTab]          = useState("pedidos");
  const [orders,       setOrders]       = useState([]);
  const [clients,      setClients]      = useState([]);
  const [caixaHistory, setCaixaHistory] = useState([]);
  const [drivers,      setDrivers]      = useState([]);
  const [toast,        setToast]        = useState(null);
  const [synced,       setSynced]       = useState(false);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    const unsubs = [
      onSnapshot(collection(db, "orders"), snap => {
        setOrders(snap.docs.map(d => ({ ...d.data(), _docId: d.id })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        setSynced(true); setLoading(false);
      }, () => setLoading(false)),
      onSnapshot(collection(db, "clients"), snap => setClients(snap.docs.map(d => ({ ...d.data(), _docId: d.id })))),
      onSnapshot(collection(db, "caixa"),   snap => setCaixaHistory(snap.docs.map(d => d.data()).sort((a, b) => new Date(a.date) - new Date(b.date)))),
      onSnapshot(collection(db, "users"),   snap => setDrivers(snap.docs.map(d => ({ ...d.data(), _docId: d.id })).filter(u => u.role === "driver"))),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 2800);
  }, []);

  async function getNextId() {
    const ref = doc(db, "meta", "counter");
    try {
      const snap = await getDoc(ref);
      const next = (snap.exists() ? snap.data().value : 0) + 1;
      await setDoc(ref, { value: next });
      return "#" + String(next).padStart(3, "0");
    } catch { return "#" + String(Date.now()).slice(-4); }
  }

  function buildOrderMsg(order) {
    const payLabel = PAYMENT_METHODS.find(m => m.id === order.payment)?.label || order.payment;
    return [
      "🥧 *NOVO PEDIDO " + order.id + "*", "",
      "👤 " + order.customer,
      order.address ? "📍 " + order.address : "",
      "", "*Itens:*",
      ...(order.items || []).map(it => "▪ " + it.qty + "x " + it.name + " — " + fmt(it.price * it.qty)),
      "", "💰 *Total: " + fmt(order.total) + "*",
      order.freight > 0 ? "🛵 Frete: " + fmt(order.freight) : "",
      "💳 " + payLabel,
      order.note ? "📝 " + order.note : "",
    ].filter(l => l !== "").join("\n");
  }

  async function handleSave(orderData) {
    const id   = await getNextId();
    const full = { ...orderData, id };
    await addDoc(collection(db, "orders"), full);
    const ex = clients.find(c => c.name && c.name.toLowerCase() === orderData.customer.toLowerCase());
    if (ex?._docId) {
      await updateDoc(doc(db, "clients", ex._docId), { orders: (ex.orders || 0) + 1, total: (ex.total || 0) + orderData.total, lastOrder: orderData.createdAt });
    } else {
      await addDoc(collection(db, "clients"), { name: orderData.customer, whatsapp: orderData.customerPhone || "", address: orderData.address || "", orders: 1, total: orderData.total, lastOrder: orderData.createdAt });
    }
    window.open("https://wa.me/" + WHATSAPP_ADMIN + "?text=" + encodeURIComponent(buildOrderMsg(full)), "_blank");
    setTab("pedidos"); showToast("Pedido criado! 🥧");
  }

  async function handleStatus(id, next) {
    const order = orders.find(o => o.id === id);
    if (order?._docId) await updateDoc(doc(db, "orders", order._docId), { status: next, updatedAt: new Date().toISOString() });
    showToast((ORDER_STATUS[next]?.emoji || "") + " " + (ORDER_STATUS[next]?.label || next));
  }

  async function handleDelete(id) {
    const order = orders.find(o => o.id === id);
    if (order?._docId) await deleteDoc(doc(db, "orders", order._docId));
    showToast("Pedido cancelado.", "error");
  }

  async function handleCaixaClose(entry) {
    await addDoc(collection(db, "caixa"), entry);
    showToast("Caixa fechado: " + fmt(entry.value));
  }

  async function handleApproveDriver(uid) {
    const driver = drivers.find(d => d.uid === uid);
    if (driver?._docId) await updateDoc(doc(db, "users", driver._docId), { status: "active" });
    showToast("Entregador aprovado!");
  }

  async function handleRemoveDriver(uid) {
    const driver = drivers.find(d => d.uid === uid);
    if (driver?._docId) await deleteDoc(doc(db, "users", driver._docId));
    showToast("Entregador removido.", "error");
  }

  const ativos   = orders.filter(o => !isDone(o.status) && o.status !== "encomenda").length;
  const pending  = drivers.filter(d => d.status === "pending").length;

  const allTabs = [
    { id:"pedidos",  emoji:"📋", label:"Pedidos"    },
    { id:"novo",     emoji:"➕", label:"Novo"        },
    { id:"clientes", emoji:"👥", label:"Clientes"   },
    { id:"fin",      emoji:"📊", label:"Financeiro" },
    { id:"analise",  emoji:"📈", label:"Análise"    },
    { id:"motoboys", emoji:"🛵", label:"Motoboys", badge: pending },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.cream }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
        input:focus, textarea:focus, select:focus { border-color: ${C.terracotta} !important; box-shadow: 0 0 0 3px rgba(166,75,42,.15); outline: none; }
        @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{ transform:scale(1); } 50%{ transform:scale(1.04); } }
        button:active { opacity:.82; transform:scale(.97); }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-thumb { background:${C.sand}; border-radius:4px; }
      `}</style>

      {/* Header */}
      <header style={{ background: "linear-gradient(135deg," + C.espresso + "," + C.brown + ")", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", padding: "10px 16px 6px", gap: 10 }}>
          <Logo size={36} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 16, fontWeight: 900, color: C.cream }}>Casa da Empada</div>
            <div style={{ fontSize: 9, color: synced ? "#86efac" : C.sand, letterSpacing: 2, textTransform: "uppercase" }}>{synced ? "☁️ Sincronizado" : "⏳ Conectando..."}</div>
          </div>
          {ativos > 0 && <div style={{ background: C.terracotta, color: "#fff", borderRadius: 20, padding: "2px 10px", fontSize: 13, fontWeight: 700, fontFamily: "Georgia,serif" }}>{ativos} ativos</div>}
          <button onClick={() => signOut(auth)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: C.sand, padding: "6px 10px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontFamily: "Georgia,serif" }}>Sair</button>
        </div>
        <nav style={{ display: "flex", overflowX: "auto", gap: 2, padding: "0 8px 6px" }}>
          {allTabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "6px 10px", border: "none", cursor: "pointer", borderRadius: 10, background: tab === t.id ? "rgba(166,75,42,.9)" : "transparent", color: tab === t.id ? "#fff" : C.parchment, fontFamily: "Georgia,serif", fontSize: 10, whiteSpace: "nowrap", minWidth: 52, transition: "all .18s", gap: 1, position: "relative" }}>
              <span style={{ fontSize: 16 }}>{t.emoji}</span>
              <span>{t.label}</span>
              {t.badge > 0 && <span style={{ position: "absolute", top: 2, right: 4, background: "#dc2626", color: "#fff", borderRadius: "50%", width: 16, height: 16, fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{t.badge}</span>}
            </button>
          ))}
        </nav>
      </header>

      {loading ? <Spinner /> : <>
        {tab === "pedidos"  && <PedidosPage   orders={orders}   onStatus={handleStatus} onDelete={handleDelete} clients={clients} drivers={drivers.filter(d => d.status !== "pending")} />}
        {tab === "novo"     && <NovoPedido    onSave={handleSave} showToast={showToast} clients={clients} />}
        {tab === "clientes" && <ClientesPage  clients={clients} orders={orders} />}
        {tab === "fin"      && <FinanceiroPage orders={orders}  caixaHistory={caixaHistory} onCaixaClose={handleCaixaClose} drivers={drivers.filter(d => d.status !== "pending")} />}
        {tab === "analise"  && <AnalisePage   orders={orders}   clients={clients} caixaHistory={caixaHistory} />}
        {tab === "motoboys" && <MotoboysPage  drivers={drivers} onApprove={handleApproveDriver} onRemove={handleRemoveDriver} />}
      </>}

      <div style={{ textAlign: "center", padding: "16px 16px 80px", color: C.sand, fontSize: 10, fontFamily: "Georgia,serif" }}>
        🥧 Casa da Empada Artesanal · @casadaempadaartesanal · (75) 9.8119-4734
      </div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}
