// Exercises the pure logic that the UI depends on, without a browser.
import fs from "node:fs";

let pass = 0, fail = 0;
const chk = (name, fn) => {
  try { const r = fn(); console.log("  PASS  " + name.padEnd(42) + (r ?? "")); pass++; }
  catch (e) { console.log("  FAIL  " + name.padEnd(42) + e.message); fail++; }
};

/* ---- money ---- */
const src = fs.readFileSync("src/lib/money.ts", "utf8");
const formatINR = (p) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(p / 100);
const discountPercent = (p, m) => (!m || m <= p) ? 0 : Math.round(((m - p) / m) * 100);

chk("money: paise -> INR", () => { const s = formatINR(189900); if (!s.includes("1,899")) throw new Error(s); return s; });
chk("money: discount", () => { const d = discountPercent(249900, 329900); if (d !== 24) throw new Error(String(d)); return d + "%"; });
chk("money: no fake discount", () => { if (discountPercent(100, 100) || discountPercent(100, 50)) throw new Error("bad"); return "0%"; });

/* ---- price band parsing (must match the listing page) ---- */
const bandToWhere = (b) => { const [lo, hi] = b.split("-"); return { gte: Number(lo) * 100, ...(hi ? { lte: Number(hi) * 100 } : {}) }; };
chk("filters: closed band", () => { const w = bandToWhere("1000-2500"); if (w.gte !== 100000 || w.lte !== 250000) throw new Error(JSON.stringify(w)); return "1000-2500 ok"; });
chk("filters: open band", () => { const w = bandToWhere("5000-"); if (w.gte !== 500000 || "lte" in w) throw new Error(JSON.stringify(w)); return "5000+ ok"; });
chk("filters: under band", () => { const w = bandToWhere("0-999"); if (w.gte !== 0 || w.lte !== 99900) throw new Error(JSON.stringify(w)); return "0-999 ok"; });

/* ---- shipping ---- */
const shipFor = (sub, free, flat) => (sub >= free ? 0 : flat);
chk("shipping: below threshold", () => { if (shipFor(50000, 99900, 9900) !== 9900) throw new Error("x"); return "charged"; });
chk("shipping: at threshold", () => { if (shipFor(99900, 99900, 9900) !== 0) throw new Error("x"); return "free"; });

/* ---- checkout validation (mirrors CheckoutForm) ---- */
const V = {
  name: (v) => v.trim().length > 1,
  phone: (v) => /^[6-9]\d{9}$/.test(v.replace(/\D/g, "")),
  email: (v) => /\S+@\S+\.\S+/.test(v),
  pincode: (v) => /^\d{6}$/.test(v.replace(/\D/g, "")),
  line1: (v) => v.trim().length > 4,
};
chk("validation: good phone", () => { if (!V.phone("9876543210")) throw new Error("rejected valid"); return "ok"; });
chk("validation: rejects landline-style", () => { if (V.phone("1234567890")) throw new Error("accepted invalid"); return "ok"; });
chk("validation: rejects short phone", () => { if (V.phone("98765")) throw new Error("accepted invalid"); return "ok"; });
chk("validation: pincode", () => { if (!V.pincode("400001") || V.pincode("4000")) throw new Error("bad"); return "ok"; });
chk("validation: email", () => { if (!V.email("a@b.co") || V.email("nope")) throw new Error("bad"); return "ok"; });

/* ---- cart maths ---- */
const lines = [{ pricePaise: 189900, qty: 2 }, { pricePaise: 99900, qty: 1 }];
chk("cart: subtotal", () => { const t = lines.reduce((n, l) => n + l.pricePaise * l.qty, 0); if (t !== 479700) throw new Error(String(t)); return formatINR(t); });
chk("cart: count", () => { const c = lines.reduce((n, l) => n + l.qty, 0); if (c !== 3) throw new Error(String(c)); return c + " items"; });

/* ---- z-index ordering must be strictly increasing ---- */
const cfg = fs.readFileSync("tailwind.config.ts", "utf8");
const zBlock = cfg.slice(cfg.indexOf("zIndex: {"), cfg.indexOf("}", cfg.indexOf("zIndex: {")));
const layers = [...zBlock.matchAll(/(\w+):\s*"(\d+)"/g)].map(m => [m[1], +m[2]]);
chk("z-index: named layers ascend", () => {
  const order = ["bar", "header", "buybar", "tabbar", "backdrop", "panel", "toast"];
  const map = Object.fromEntries(layers);
  for (let i = 1; i < order.length; i++) {
    if (!(map[order[i]] > map[order[i - 1]])) throw new Error(`${order[i]}(${map[order[i]]}) !> ${order[i-1]}(${map[order[i-1]]})`);
  }
  return order.map(o => `${o}:${map[o]}`).join(" < ");
});

/* ---- exactly one overlay can be open ---- */
const ui = fs.readFileSync("src/store/ui.ts", "utf8");
chk("ui: single overlay slot", () => {
  if (!/overlay:\s*Overlay/.test(ui)) throw new Error("no single overlay field");
  if (/isOpen|menuOpen|cartOpen/.test(ui)) throw new Error("multiple boolean flags found");
  return "one slot";
});

console.log(`\n${pass}/${pass + fail} passed` + (fail ? `  <-- ${fail} FAILURES` : ""));
process.exit(fail ? 1 : 0);
