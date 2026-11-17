// Orbit Harvest — all canvas drawing. Purely a function of the world
// state (plus two cosmetic jitters: the ship's flame and the screen
// shake, which never feed back into the simulation).

import { VIEW_HEIGHT, VIEW_WIDTH } from './config.js';

const W = VIEW_WIDTH;
const H = VIEW_HEIGHT;
const TAU = Math.PI * 2;

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function drawShip(world) {
    const player = world.player;
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle + Math.PI / 2);
    if (player.invulnSteps > 0 && Math.floor(player.invulnSteps / 5) % 2 === 0) ctx.globalAlpha = 0.35;
    if (world.shieldOn) {
      ctx.beginPath(); ctx.arc(0, 0, 24, 0, TAU);
      ctx.strokeStyle = 'rgba(52,211,153,.85)'; ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(0, -18); ctx.lineTo(12, 12); ctx.lineTo(4, 7); ctx.lineTo(-4, 7); ctx.lineTo(-12, 12); ctx.closePath();
    const grad = ctx.createLinearGradient(0, -18, 0, 12);
    grad.addColorStop(0, '#a5f3fc'); grad.addColorStop(1, '#2563eb');
    ctx.fillStyle = grad; ctx.fill();
    ctx.beginPath(); ctx.arc(0, -4, 4.5, 0, TAU); ctx.fillStyle = '#fbbf24'; ctx.fill();
    const flame = 8 + Math.random() * 7;
    ctx.beginPath(); ctx.moveTo(-4, 12); ctx.lineTo(0, 12 + flame); ctx.lineTo(4, 12);
    ctx.fillStyle = 'rgba(251,146,60,.9)'; ctx.fill();
    ctx.restore();
  }

  function draw(world) {
    ctx.save();
    if (world.shake > 0) {
      ctx.translate((Math.random() * 2 - 1) * world.shake * 0.4, (Math.random() * 2 - 1) * world.shake * 0.4);
    }
    ctx.clearRect(-30, -30, W + 60, H + 60);
    const bg = ctx.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, 620);
    bg.addColorStop(0, '#0c1333'); bg.addColorStop(1, '#05070f');
    ctx.fillStyle = bg; ctx.fillRect(-30, -30, W + 60, H + 60);

    for (const st of world.stars) {
      ctx.globalAlpha = 0.35 + 0.4 * Math.abs(Math.sin(st.tw));
      ctx.fillStyle = '#cdd7ff';
      ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;

    for (const c of world.cores) {
      const t = c.tSteps / 60;
      const pulse = 1 + 0.18 * Math.sin(t * 5 + c.ph);
      if (c.ttlSteps - c.tSteps < 96 && Math.floor(t * 9) % 2 === 0) ctx.globalAlpha = 0.3;
      ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(t * 1.4 + c.ph); ctx.scale(pulse, pulse);
      ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 16;
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      for (let k = 0; k < 5; k++) {
        const a = -Math.PI / 2 + k * (Math.PI * 4 / 5);
        const px = Math.cos(a) * c.r, py = Math.sin(a) * c.r;
        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill();
      ctx.restore(); ctx.globalAlpha = 1;
    }

    for (const o of world.orbs) {
      ctx.save(); ctx.translate(o.x, o.y);
      ctx.shadowColor = o.kind === 'magnet' ? '#6ee7ff' : '#34d399'; ctx.shadowBlur = 15;
      ctx.beginPath(); ctx.arc(0, 0, o.r, 0, TAU);
      ctx.fillStyle = o.kind === 'magnet' ? '#0ea5e9' : '#059669'; ctx.fill();
      ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(o.kind === 'magnet' ? 'M' : 'S', 0, 1);
      ctx.restore();
    }

    for (const r of world.rocks) {
      ctx.save(); ctx.translate(r.x, r.y); ctx.rotate(r.rot);
      ctx.beginPath();
      for (let v = 0; v < r.verts.length; v++) {
        const va = v / r.verts.length * TAU;
        const vx = Math.cos(va) * r.r * r.verts[v], vy = Math.sin(va) * r.r * r.verts[v];
        if (v === 0) ctx.moveTo(vx, vy); else ctx.lineTo(vx, vy);
      }
      ctx.closePath();
      ctx.fillStyle = '#4b4257'; ctx.fill();
      ctx.strokeStyle = '#7d7391'; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(-r.r * 0.25, -r.r * 0.15, r.r * 0.22, 0, TAU);
      ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fill();
      ctx.restore();
    }

    if (world.state !== 'menu') drawShip(world);

    for (const p of world.parts) {
      ctx.globalAlpha = 1 - p.tSteps / p.lifeSteps;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (world.magnetSteps > 0 && world.state === 'play') {
      ctx.fillStyle = 'rgba(110,231,255,.9)'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('MAGNET ' + Math.ceil(world.magnetSteps / 60) + 's', 14, H - 14);
    }
    ctx.restore();
  }

  return { draw };
}
