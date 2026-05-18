/**
 * events/sandikodev-birthday.ts
 *
 * Event: Ulang Tahun Sandikodev — 22 April
 * Untuk menonaktifkan: hapus import di Layout.astro
 * Untuk test: buka URL dengan ?celebrate=1
 */

export const EVENT_NAME = 'sandikodev-birthday';
export const EVENT_DATE = { month: 4, day: 22 }; // April = bulan ke-4

export function isEventActive(): boolean {
  const today = new Date();
  const isDay = today.getMonth() + 1 === EVENT_DATE.month && today.getDate() === EVENT_DATE.day;
  const isTest = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('celebrate');
  return isDay || isTest;
}

export function launchBirthdayEvent(): void {
  if (!isEventActive()) return;

  // ── Banner ────────────────────────────────────────────────────────────────
  const banner = document.createElement('div');
  banner.id = 'birthday-banner';
  banner.style.cssText = [
    'position:fixed', 'bottom:8px', 'left:50%', 'transform:translateX(-50%)',
    'z-index:1000', 'background:linear-gradient(90deg,#db2777,#9333ea,#2563eb)',
    'color:white', 'text-align:center', 'padding:10px 20px', 'font-size:14px',
    'font-weight:500', 'border-radius:12px', 'white-space:nowrap',
    'box-shadow:0 4px 20px rgba(0,0,0,0.4)',
  ].join(';');
  banner.innerHTML = '🎂 Selamat Ulang Tahun, Sandi! Ini hadiahmu untuk dirimu sendiri. Semoga bermanfaat. 🎉 '
    + '<button onclick="document.getElementById(\'birthday-banner\').remove()" '
    + 'style="margin-left:12px;opacity:0.6;cursor:pointer;background:none;border:none;color:white;font-size:16px">✕</button>';
  document.body.appendChild(banner);

  // ── Kembang api ───────────────────────────────────────────────────────────
  const cv = document.createElement('canvas');
  cv.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:999';
  document.body.appendChild(cv);
  const ctx = cv.getContext('2d')!;
  cv.width = innerWidth;
  cv.height = innerHeight;

  const COLORS = ['#f472b6','#a78bfa','#60a5fa','#34d399','#fbbf24','#fb923c','#f87171','#e879f9','#ffffff','#7dd3fc'];

  type Spark = { x:number; y:number; vx:number; vy:number; color:string; life:number; decay:number };
  type Rocket = { x:number; y:number; vy:number; targetY:number };

  const rockets: Rocket[] = [];
  const sparks: Spark[] = [];

  function explode(x: number, y: number) {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const count = 80 + Math.floor(Math.random() * 60);
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;
      const spd = Math.random() * 5 + 2;
      sparks.push({ x, y, vx: Math.cos(a)*spd, vy: Math.sin(a)*spd, color, life: 1, decay: Math.random()*0.015+0.012 });
    }
  }

  function launchRocket() {
    rockets.push({
      x: Math.random() * cv.width * 0.8 + cv.width * 0.1,
      y: cv.height,
      vy: -(Math.random() * 8 + 10),
      targetY: Math.random() * cv.height * 0.45 + cv.height * 0.05,
    });
  }

  let launched = 0;
  const launchInterval = setInterval(() => {
    launchRocket();
    if (++launched >= 12) clearInterval(launchInterval);
  }, 300);

  (function loop() {
    ctx.clearRect(0, 0, cv.width, cv.height);

    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      r.y += r.vy;
      r.vy += 0.2;
      ctx.beginPath();
      ctx.arc(r.x, r.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      if (r.y <= r.targetY) { explode(r.x, r.y); rockets.splice(i, 1); }
    }

    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.x += s.vx; s.y += s.vy;
      s.vy += 0.08; s.vx *= 0.97;
      s.life -= s.decay;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      ctx.globalAlpha = s.life;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (rockets.length > 0 || sparks.length > 0 || launched < 12) {
      requestAnimationFrame(loop);
    } else {
      setTimeout(() => cv.remove(), 500);
    }
  })();
}
