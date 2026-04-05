// ── CORES ──────────────────────────────────────────────────────
export const C = {
  espresso:  "#2D1E19",
  brown:     "#4A372E",
  terracotta:"#A64B2A",
  sand:      "#D6AD8D",
  cream:     "#F5EFE6",
  warmWhite: "#FFFFFF",
  parchment: "#EDD9B0",
  teal:      "#3D8B7A",
  sage:      "#6B8F5E",
  gold:      "#C8860B",
  rust:      "#8B3A1A",
  shadow:    "rgba(45,30,25,0.15)",
  insta:     "linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)",
};

export const ADMIN_EMAIL    = "pedromeloigor@outlook.com";
export const WHATSAPP_ADMIN = "557581194734";
export const INSTAGRAM      = "casadaempadaartesanal";
export const CIDADES        = ["Sátiro Dias", "Inhambupe", "Outra"];

// ── CARDÁPIO ───────────────────────────────────────────────────
export const MENU = {
  "🥧 Empadas": [
    { id:1,  name:"Empada de Frango",                                  price:7.00 },
    { id:2,  name:"Empada Frango com Catupiry",                        price:8.00 },
    { id:3,  name:"Empada Frango com Cheddar",                         price:8.00 },
    { id:4,  name:"Empada Calabresa com Cheddar ou Catupiry",          price:8.00 },
    { id:5,  name:"Sabor Afeto Doce (Leite Condensado)",               price:8.00 },
    { id:6,  name:"Empada Camarão Cremoso",                            price:9.00 },
    { id:7,  name:"Sabor Romeu e Julieta (Doce)",                      price:9.00 },
    { id:8,  name:"Empada Gourmet Quiche c/ Bacon e Frango",           price:9.00 },
    { id:9,  name:"Empada Carne Seca c/ Banana da Terra e Requeijão",  price:9.00 },
    { id:10, name:"Empada Charque com Catupiry",                       price:9.00 },
    { id:11, name:"Empada Nutella",                                    price:10.00 },
  ],
  "🍽️ Empadões": [
    { id:12, name:"Empadão Cremoso - Frango c/ Cheddar ou Catupiry",   price:18.00 },
    { id:13, name:"Empadão Encantado - Doce de Leite Gourmet",         price:17.00 },
    { id:14, name:"Empadão do Mar - Camarão Cremoso",                  price:22.00 },
    { id:15, name:"Empadão Carne Seca c/ Banana da Terra e Catupiry",  price:22.00 },
    { id:16, name:"Empadão Charque com Catupiry",                      price:22.00 },
    { id:17, name:"Empadão Quiche Frango com Bacon",                   price:21.00 },
  ],
  "📦 Combos": [
    { id:18, name:"Empada Nutella 4un (chocolate/nutella)",            price:21.50 },
    { id:19, name:"COMBO Lanchinho (7 Empadas M + Coca 350ml)",        price:39.90 },
    { id:20, name:"COMBO Só para Mim (5 Empadas G + Coca 350ml)",      price:43.00 },
    { id:21, name:"COMBO Leve 8 Pague 7 (8 Empadas G)",               price:56.00 },
    { id:22, name:"COMBO Chama a Galera (12 Empadas M, pague 10)",     price:50.00 },
  ],
  "🥤 Bebidas": [
    { id:23, name:"Guaraná Antárctica 350ml", price:6.00 },
    { id:24, name:"Coca-Cola 350ml",          price:6.00 },
  ],
};

export const ALL_ITEMS = Object.values(MENU).flat();

export const PAYMENT_METHODS = [
  { id:"pix",      label:"📲 Pix"           },
  { id:"dinheiro", label:"💵 Dinheiro"      },
  { id:"credito",  label:"💳 Crédito"       },
  { id:"online",   label:"🌐 Cartão Online" },
];

export const ORDER_STATUS = {
  encomenda: { label:"Encomenda", emoji:"📅", color:"#7B5EA7", bg:"#EDE7F6", next:"preparo"  },
  preparo:   { label:"Preparo",   emoji:"👨‍🍳", color:"#B45309", bg:"#FEF3C7", next:"saiu"     },
  saiu:      { label:"Saiu",      emoji:"🛵", color:C.teal,    bg:"#D0F0EB", next:"entregue" },
  retirada:  { label:"Retirada",  emoji:"🏠", color:C.gold,    bg:"#FFF3CC", next:"retirado" },
  entregue:  { label:"Entregue",  emoji:"✅", color:"#16a34a", bg:"#DCFCE7", next:null        },
  retirado:  { label:"Retirado",  emoji:"✅", color:"#16a34a", bg:"#DCFCE7", next:null        },
};

// ── UTILS ──────────────────────────────────────────────────────
export const fmt   = v => (+(v) || 0).toLocaleString("pt-BR", { style:"currency", currency:"BRL" });
export const fmtDt = d => new Date(d).toLocaleString("pt-BR", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" });
export const isDone = s => s === "entregue" || s === "retirado";
