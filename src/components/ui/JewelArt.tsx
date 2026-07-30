/**
 * Concept renders used wherever a product has no photograph yet.
 *
 * Real Cloudinary photos always win — see ProductMedia. These exist so a
 * freshly seeded catalogue looks like one coherent house rather than a wall
 * of grey placeholders, and so the client can add products before the
 * photoshoot without the grid falling apart.
 *
 * Geometry note: a hanging necklace is the 0deg -> 180deg sweep, because SVG
 * y grows downward. Sweeping through 270deg draws the loop ABOVE centre and
 * clips it against the viewBox.
 */

const G='#C9A24B', GD='#9C6F2E', M='#8A2226', MD='#5A0F12';

function svg(inner: string): string { return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#E8C173"/><stop offset=".5" stop-color="${G}"/><stop offset="1" stop-color="${GD}"/>
    </linearGradient>
    <linearGradient id="mm" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${M}"/><stop offset="1" stop-color="${MD}"/>
    </linearGradient>
  </defs>${inner}</svg>`; }

const bead=(x:number,y:number,r:number,f='url(#gg)')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${f}"/>`;
const stone=(x:number,y:number,r:number,f='url(#mm)')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" stroke="${G}" stroke-width="1.4"/>`;
function arcBeads(cx:number,cy:number,rx:number,ry:number,n:number,r:number,a0=200,a1=340,f?:string):string{let s='';for(let i=0;i<n;i++){const t=(a0+(a1-a0)*i/(n-1))*Math.PI/180;s+=bead(cx+rx*Math.cos(t),cy+ry*Math.sin(t),r,f);}return s;}
function uBeads(cx:number,cy:number,rx:number,ry:number,n:number,r:number,f?:string):string{return arcBeads(cx,cy,rx,ry,n,r,0,180,f);}
function petals(cx:number,cy:number,R:number,n:number,rr:number):string{let s='';for(let i=0;i<n;i++){const t=i*2*Math.PI/n;s+=`<ellipse cx="${cx+R*Math.cos(t)}" cy="${cy+R*Math.sin(t)}" rx="${rr}" ry="${rr*.62}" fill="url(#gg)" transform="rotate(${i*360/n} ${cx+R*Math.cos(t)} ${cy+R*Math.sin(t)})"/>`;}return s;}

const ART: Record<string, () => string> = {
  brooch:()=>svg(`${petals(100,88,30,10,13)}<circle cx="100" cy="88" r="24" fill="url(#mm)" stroke="${G}" stroke-width="2.5"/>
    <circle cx="100" cy="88" r="12" fill="url(#gg)"/><circle cx="100" cy="88" r="5" fill="${MD}"/>
    ${[70,100,130].map(x=>`<path d="M${x} 116 L${x} ${140+(x===100?12:0)}" stroke="${GD}" stroke-width="1.6"/>${bead(x,146+(x===100?12:0),7)}`).join('')}`),
  brooch2:()=>svg(`<path d="M100 46 L128 88 L100 130 L72 88 Z" fill="url(#mm)" stroke="${G}" stroke-width="2.4"/>
    ${petals(100,88,34,8,10)}<circle cx="100" cy="88" r="13" fill="url(#gg)"/>
    ${[76,100,124].map((x,i)=>`<path d="M${x} ${118+i%2*6} L${x} ${142+i%2*6}" stroke="${GD}" stroke-width="1.5"/>${stone(x,150+i%2*6,7)}`).join('')}`),
  brooch3:()=>svg(`<circle cx="100" cy="86" r="38" fill="none" stroke="url(#gg)" stroke-width="4"/>
    ${petals(100,86,26,12,11)}<circle cx="100" cy="86" r="20" fill="url(#mm)" stroke="${G}" stroke-width="2"/>
    <path d="M100 74 L106 86 L100 98 L94 86 Z" fill="url(#gg)"/>
    ${arcBeads(100,128,42,18,7,6,200,340)}`),
  miniBrooch:()=>svg(`${[62,138].map(x=>`${petals(x,96,17,8,7)}<circle cx="${x}" cy="96" r="12" fill="url(#mm)" stroke="${G}" stroke-width="1.8"/><circle cx="${x}" cy="96" r="5" fill="url(#gg)"/>`).join('')}`),
  mala:()=>svg(`${[0,1,2].map(i=>uBeads(100,44+i*6,62-i*8,54-i*6,17-i,5.2-i*0.3)).join('')}
    <path d="M100 106 L100 122" stroke="${GD}" stroke-width="2"/>
    <path d="M100 122 L120 142 L100 168 L80 142 Z" fill="url(#mm)" stroke="${G}" stroke-width="2.2"/>
    <circle cx="100" cy="143" r="8" fill="url(#gg)"/>`),
  mala2:()=>svg(`${uBeads(100,46,64,56,19,5.6)}
    <path d="M100 104 L100 120" stroke="${GD}" stroke-width="2"/>${stone(100,138,17)}<circle cx="100" cy="138" r="7" fill="url(#gg)"/>`),
  mala3:()=>svg(`${[0,1].map(i=>uBeads(100,40+i*10,68-i*10,58-i*8,15-i*2,7-i)).join('')}
    <path d="M100 100 L100 116" stroke="${GD}" stroke-width="2.4"/>
    <circle cx="100" cy="140" r="21" fill="url(#mm)" stroke="${G}" stroke-width="2.6"/>${petals(100,140,21,8,7)}`),
  necklace:()=>svg(`<path d="M34 52 Q100 148 166 52" fill="none" stroke="url(#gg)" stroke-width="4.5"/>
    ${uBeads(100,52,62,44,11,9)}
    ${[74,100,126].map((x,i)=>`<path d="M${x} ${96+(i===1?12:2)} L${x} ${110+(i===1?14:2)}" stroke="${GD}" stroke-width="1.6"/>${stone(x,122+(i===1?18:2),i===1?15:10)}`).join('')}`),
  necklace2:()=>svg(`${[0,1].map(i=>`<path d="M${34+i*12} ${46+i*14} Q100 ${138+i*22} ${166-i*12} ${46+i*14}" fill="none" stroke="url(#gg)" stroke-width="3.4"/>`).join('')}
    ${uBeads(100,46,64,44,9,7)}${stone(100,150,18)}<circle cx="100" cy="150" r="7" fill="url(#gg)"/>`),
  pendant:()=>svg(`<path d="M52 40 Q100 118 148 40" fill="none" stroke="url(#gg)" stroke-width="3"/>
    ${petals(100,124,20,8,10)}<circle cx="100" cy="124" r="16" fill="url(#mm)" stroke="${G}" stroke-width="2"/>
    <circle cx="100" cy="124" r="6" fill="url(#gg)"/>
    ${[58,142].map(x=>`${petals(x,168,9,6,5)}<circle cx="${x}" cy="168" r="6" fill="url(#mm)"/>`).join('')}`),
  pendant2:()=>svg(`<path d="M52 40 Q100 116 148 40" fill="none" stroke="url(#gg)" stroke-width="3"/>
    <path d="M100 96 A30 30 0 1 0 128 132 A24 24 0 1 1 100 96 Z" fill="url(#gg)"/>${stone(120,110,8)}
    ${[58,168].map((x,i)=>i===0?`<circle cx="58" cy="170" r="7" fill="url(#mm)" stroke="${G}" stroke-width="1.4"/><circle cx="142" cy="170" r="7" fill="url(#mm)" stroke="${G}" stroke-width="1.4"/>`:'').join('')}`),
  earrings:()=>svg(`${[62,138].map(x=>`<circle cx="${x}" cy="52" r="7" fill="none" stroke="url(#gg)" stroke-width="2.6"/>
    <path d="M${x} 59 L${x} 74" stroke="${GD}" stroke-width="2"/>
    <path d="M${x-24} 108 A24 24 0 0 1 ${x+24} 108 Z" fill="url(#mm)" stroke="${G}" stroke-width="2.2"/>
    ${arcBeads(x,108,22,4,6,4.6,0,180)}${bead(x,132,8)}`).join('')}`),
  earrings2:()=>svg(`${[62,138].map(x=>`<circle cx="${x}" cy="48" r="6.5" fill="none" stroke="url(#gg)" stroke-width="2.4"/>
    ${petals(x,74,12,6,6)}<circle cx="${x}" cy="74" r="9" fill="url(#mm)"/>
    <path d="M${x-26} 118 A26 26 0 0 1 ${x+26} 118 Z" fill="url(#gg)"/>
    ${arcBeads(x,120,24,6,7,4.2,0,180,'url(#mm)')}`).join('')}`),
  bracelet:()=>svg(`<circle cx="100" cy="100" r="58" fill="none" stroke="url(#gg)" stroke-width="11"/>
    <circle cx="100" cy="100" r="58" fill="none" stroke="${GD}" stroke-width="1" opacity=".5"/>
    ${[0,1,2,3,4,5,6,7].map(i=>{const t=i*Math.PI/4;return stone(100+58*Math.cos(t),100+58*Math.sin(t),8);}).join('')}`),
  bracelet2:()=>svg(`${[52,64].map(r=>`<circle cx="100" cy="100" r="${r}" fill="none" stroke="url(#gg)" stroke-width="2"/>`).join('')}
    ${[0,1].map(k=>[...Array(16)].map((_,i)=>{const t=i*Math.PI/8;const r=k?64:52;return bead(100+r*Math.cos(t),100+r*Math.sin(t),4.4,'#F2E4C6');}).join('')).join('')}
    ${stone(100,164,11)}`),
  kalgi:()=>svg(`<path d="M100 176 L100 108" stroke="url(#gg)" stroke-width="5"/>
    ${[-1,1].map(s=>`<path d="M100 112 Q${100+s*54} 74 ${100+s*20} 22 Q${100+s*6} 62 100 112 Z" fill="url(#gg)" opacity=".92"/>`).join('')}
    <path d="M100 108 Q112 62 100 18 Q88 62 100 108 Z" fill="url(#mm)" stroke="${G}" stroke-width="1.8"/>
    ${stone(100,110,15)}<circle cx="100" cy="110" r="6" fill="url(#gg)"/>${bead(100,176,9)}`),
  kalgi2:()=>svg(`<path d="M100 178 L100 116" stroke="url(#gg)" stroke-width="4.5"/>
    ${[-1,1].map(s=>`<path d="M100 118 Q${100+s*62} 88 ${100+s*44} 26 Q${100+s*18} 72 100 118 Z" fill="url(#gg)" opacity=".85"/>
      <circle cx="${100+s*40}" cy="42" r="9" fill="url(#mm)" stroke="${G}" stroke-width="1.4"/>`).join('')}
    <path d="M100 116 Q114 66 100 24 Q86 66 100 116 Z" fill="url(#mm)" stroke="${G}" stroke-width="1.8"/>
    ${petals(100,120,16,8,7)}<circle cx="100" cy="120" r="11" fill="url(#gg)"/>`),
  haarStone:()=>svg(`<path d="M46 56 Q100 140 154 56" fill="none" stroke="url(#gg)" stroke-width="4"/>
    ${uBeads(100,56,54,42,9,8)}
    ${[76,100,124].map((x,i)=>`<path d="M${x} ${98+(i===1?10:2)} L${x} ${110+(i===1?12:2)}" stroke="${GD}" stroke-width="1.5"/>${stone(x,122+(i===1?16:2),i===1?14:9,'#2F6B4F')}`).join('')}`),
  haarPearl:()=>svg(`${[0,1].map(i=>`<path d="M${46+i*14} ${52+i*16} Q100 ${126+i*18} ${154-i*14} ${52+i*16}" fill="none" stroke="#E4D3AE" stroke-width="2.4"/>
    ${uBeads(100,52+i*16,54-i*13,40-i*8,13-i*2,5.6,'#F5EAD3')}`).join('')}
    ${stone(100,132,14,'#F5EAD3')}`),
  haarFlower:()=>svg(`<path d="M44 58 Q100 142 156 58" fill="none" stroke="#7FA36B" stroke-width="3"/>
    ${[...Array(9)].map((_,i)=>{const t=(180*i/8)*Math.PI/180;const x=100+56*Math.cos(t),y=58+42*Math.sin(t);
      return `${petals(x,y,7,6,5)}<circle cx="${x}" cy="${y}" r="4.6" fill="${i%2?M:G}"/>`;}).join('')}
    ${petals(100,132,15,8,8)}<circle cx="100" cy="132" r="10" fill="url(#mm)"/>`),
  lapel:()=>svg(`${[[64,72],[136,72],[64,138],[136,138]].map(([x,y])=>`${petals(x,y,13,6,6.5)}<circle cx="${x}" cy="${y}" r="9" fill="url(#mm)" stroke="${G}" stroke-width="1.6"/><circle cx="${x}" cy="${y}" r="3.6" fill="url(#gg)"/>`).join('')}`),
  set:()=>svg(`${uBeads(100,40,58,38,13,5)}
    <path d="M100 78 L100 94" stroke="${GD}" stroke-width="2"/>${stone(100,108,15)}
    <path d="M46 178 L46 150" stroke="url(#gg)" stroke-width="3.4"/><path d="M46 152 Q56 122 46 100 Q36 122 46 152 Z" fill="url(#gg)"/>
    ${petals(154,156,15,8,7)}<circle cx="154" cy="156" r="10" fill="url(#mm)" stroke="${G}" stroke-width="1.6"/>`),
  set2:()=>svg(`${[...Array(11)].map((_,i)=>`<path d="M${52+i*10} 52 L${52+i*10} ${104+((i%3)*10)}" stroke="#E4D3AE" stroke-width="2"/>${bead(52+i*10,108+((i%3)*10),5,'#F5EAD3')}`).join('')}
    <path d="M44 50 H156" stroke="url(#gg)" stroke-width="6"/>
    <path d="M78 48 Q100 18 122 48" fill="none" stroke="${G}" stroke-width="3"/>
    ${petals(100,158,17,8,8)}<circle cx="100" cy="158" r="11" fill="url(#mm)"/>`),
};
function artFor(k: string, uid: string): string {
  return (ART[k] || ART.brooch)()
    .replace(/id="gg"/g, `id="gg${uid}"`)
    .replace(/url\(#gg\)/g, `url(#gg${uid})`)
    .replace(/id="mm"/g, `id="mm${uid}"`)
    .replace(/url\(#mm\)/g, `url(#mm${uid})`);
}
const KEYS = Object.keys(ART);

/** Deterministic pick so a given product always gets the same illustration. */
function pickArt(seed: string, category?: string | null): string {
  const c = (category ?? "").toLowerCase();
  if (c.includes("mala")) return "mala";
  if (c.includes("kalgi") || c.includes("kalangi")) return "kalgi";
  if (c.includes("lapel")) return "lapel";
  if (c.includes("set")) return "set";
  if (c.includes("stone")) return "haarStone";
  if (c.includes("pearl")) return "haarPearl";
  if (c.includes("flower")) return "haarFlower";
  if (c.includes("pendant")) return "pendant";
  if (c.includes("earring")) return "earrings";
  if (c.includes("bracelet")) return "bracelet";
  if (c.includes("necklace")) return "necklace";
  if (c.includes("brooch")) return "brooch";
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return KEYS[h % KEYS.length];
}

export default function JewelArt({
  seed,
  category,
  className = "",
}: {
  seed: string;
  category?: string | null;
  className?: string;
}) {
  const key = pickArt(seed, category);
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 33 + seed.charCodeAt(i)) >>> 0;
  const uid = h.toString(36);
  return (
    <span
      className={className}
      aria-hidden
      style={{ display: "block", width: "100%", height: "100%" }}
      dangerouslySetInnerHTML={{ __html: artFor(key, uid) }}
    />
  );
}
