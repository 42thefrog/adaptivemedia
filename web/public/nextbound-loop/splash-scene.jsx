const { useScene } = window;

function Splash() {
  const { progress } = useScene();
  const t = progress; // 0..1, wraps seamlessly

  const swirlAngle = t * 360; // one full turn per loop
  const bob = Math.sin(t * Math.PI * 2) * 16;
  const glow = (Math.sin(t * Math.PI * 2) + 1) / 2; // 0..1, one breath per loop
  const glowScale = 1 + glow * 0.035;
  const nudge = Math.max(0, Math.sin(t * Math.PI * 4)) * 10; // two nudges per loop
  const arrowGlow = 0.55 + Math.max(0, Math.sin(t * Math.PI * 4)) * 0.45;
  const shimmer = 0.85 + glow * 0.15;

  const orbSize = 620;

  return (
    <div style={{
      width: 1080, height: 1080, position: 'relative', overflow: 'hidden',
      background: 'radial-gradient(circle at 50% 40%, #14172f 0%, #0c0e20 30%, #3a3f66 55%, #cfd3e8 72%, #ffffff 82%, #ffffff 100%)',
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    }}>
      {/* ground reflection */}
      <div style={{
        position: 'absolute', left: '50%', top: 902, width: 520, height: 90,
        transform: `translateX(-50%) scaleY(${shimmer})`,
        background: 'radial-gradient(ellipse at center, rgba(120,90,230,0.55) 0%, rgba(80,60,200,0.25) 45%, rgba(80,60,200,0) 75%)',
        filter: 'blur(6px)', opacity: 0.7 + glow * 0.2,
      }} />

      {/* outer ambient glow */}
      <div style={{
        position: 'absolute', left: '50%', top: 540, width: orbSize + 220, height: orbSize + 220,
        transform: `translate(-50%, calc(-50% + ${bob}px)) scale(${glowScale})`,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(130,90,255,0.35) 0%, rgba(80,60,220,0.16) 45%, rgba(80,60,220,0) 72%)',
        filter: 'blur(10px)',
      }} />

      {/* the orb */}
      <div style={{
        position: 'absolute', left: '50%', top: 540, width: orbSize, height: orbSize,
        transform: `translate(-50%, calc(-50% + ${bob}px))`,
        borderRadius: '50%', overflow: 'hidden',
        boxShadow: 'inset 0 0 70px rgba(255,255,255,0.08), inset 0 -50px 110px rgba(0,0,0,0.7), inset 0 40px 90px rgba(0,0,0,0.35), 0 45px 90px rgba(0,0,0,0.55), 0 10px 25px rgba(0,0,0,0.4)',
      }}>
        {/* rotating internal color swirl */}
        <div style={{
          position: 'absolute', inset: '-25%',
          transform: `rotate(${swirlAngle}deg)`,
          background: 'conic-gradient(from 0deg, #101a3d 0deg, #2c2f8f 70deg, #a53bd8 140deg, #e0559e 190deg, #2451c9 260deg, #0e1230 330deg, #101a3d 360deg)',
          opacity: 0.9,
        }} />
        {/* dark glass depth vignette — heavier for more volume */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'radial-gradient(circle at 42% 38%, rgba(6,7,18,0.05) 0%, rgba(6,7,18,0.35) 40%, rgba(6,7,18,0.75) 70%, rgba(6,7,18,0.95) 100%)',
        }} />
        {/* bottom core shadow for sphere weight */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'radial-gradient(ellipse at 50% 100%, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 55%)',
        }} />
        {/* rim light */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.18), inset 16px 20px 55px rgba(255,255,255,0.22), inset -20px -26px 65px rgba(90,50,200,0.45), inset 0 -14px 40px rgba(0,0,0,0.3)',
        }} />
        {/* specular highlight */}
        <div style={{
          position: 'absolute', left: '14%', top: '10%', width: '38%', height: '26%',
          borderRadius: '50%', transform: `scale(${shimmer})`,
          background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.2) 55%, rgba(255,255,255,0) 75%)',
          filter: 'blur(2px)',
        }} />
        {/* secondary small glint, lower-right */}
        <div style={{
          position: 'absolute', right: '18%', top: '58%', width: '14%', height: '9%',
          borderRadius: '50%', transform: `scale(${shimmer})`,
          background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 70%)',
          filter: 'blur(3px)',
        }} />
      </div>

      {/* text + arrow, fixed over orb, not rotating */}
      <div style={{
        position: 'absolute', left: '50%', top: 540, transform: 'translate(-50%, -50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: 480,
      }}>
        <div style={{
          fontSize: 46, fontWeight: 500, letterSpacing: '-0.01em',
          background: 'linear-gradient(180deg, #ffffff 0%, #c9d3ff 100%)',
          WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
          textShadow: '0 0 30px rgba(150,140,255,0.25)',
        }}>Nextbound Me</div>
        <div style={{ fontSize: 20, color: '#9aa3c9', fontWeight: 400 }}>
          Start your adaptive experience
        </div>
        <div style={{
          marginTop: 8, transform: `translateX(${nudge}px)`,
          filter: `drop-shadow(0 0 ${6 + arrowGlow * 10}px rgba(140,150,255,${arrowGlow}))`,
        }}>
          <svg width="34" height="20" viewBox="0 0 34 20" fill="none">
            <line x1="0" y1="10" x2="27" y2="10" stroke="#cfd6ff" strokeWidth="2.5" strokeLinecap="round" />
            <polyline points="19,2 28,10 19,18" fill="none" stroke="#cfd6ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}

window.Splash = Splash;
