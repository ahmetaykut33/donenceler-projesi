import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const AXIAL_TILT = 23.5 * (Math.PI / 180);
const MONTHS = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran",
                "Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
const MONTH_DAYS = [31,28,31,30,31,30,31,31,30,31,30,31];
const MONTH_LABELS = ["OCA","ŞUB","MAR","NİS","MAY","HAZ","TEM","AĞU","EYL","EKİ","KAS","ARA"];
const MONTH_STARTS = [1,32,60,91,121,152,182,213,244,274,305,335];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function dayOfYear(month, day) {
  let d = 0;
  for (let m = 0; m < month - 1; m++) d += MONTH_DAYS[m];
  return d + day - 1;
}

function declination(doy) {
  return -23.45 * Math.cos((2 * Math.PI / 365) * (doy + 10));
}

function dayOfYearToDate(doy) {
  let m = 0, remaining = doy;
  while (remaining >= MONTH_DAYS[m] && m < 11) { remaining -= MONTH_DAYS[m]; m++; }
  return { month: m + 1, day: remaining + 1 };
}

function specialEvent(doy) {
  const events = [
    { doy: 79,  name: "İLKBAHAR EKİNOKSU — GÜN GECE EŞİTLİĞİ (21 MART)", short: "equinox" },
    { doy: 171, name: "YAZ GÜNDÖNÜMÜ — KUZEY YARIMKÜRE (21 HAZİRAN)",       short: "summer"  },
    { doy: 265, name: "SONBAHAR EKİNOKSU — GÜN GECE EŞİTLİĞİ (23 EYLÜL)", short: "equinox" },
    { doy: 354, name: "KIŞ GÜNDÖNÜMÜ — GÜNEY YARIMKÜRE (21 ARALIK)",       short: "winter"  },
  ];
  for (const e of events) {
    if (Math.abs(doy - e.doy) <= 1) return e;
  }
  return null;
}

function getTodayDoy() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now - start) / 86400000) - 1;
}

// ─── TEXTURE GENERATORS ───────────────────────────────────────────────────────
function generateDayTexture() {
  const W = 2048, H = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");

  const oceanGrad = ctx.createLinearGradient(0, 0, 0, H);
  oceanGrad.addColorStop(0,   "#0a2a5e");
  oceanGrad.addColorStop(0.3, "#0e3870");
  oceanGrad.addColorStop(0.5, "#1558a0");
  oceanGrad.addColorStop(0.7, "#0e3870");
  oceanGrad.addColorStop(1,   "#0a2a5e");
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#3a7a3a";
  ctx.strokeStyle = "#2a6a2a";
  ctx.lineWidth = 2;

  const cont = (shapes) => {
    ctx.beginPath();
    shapes.forEach(pts => {
      pts.forEach(([x, y], j) => {
        const px = x * W, py = y * H;
        j === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      });
      ctx.closePath();
    });
    ctx.fill(); ctx.stroke();
  };

  cont([[
    [0.05,0.15],[0.12,0.12],[0.18,0.10],[0.22,0.08],[0.27,0.12],
    [0.30,0.18],[0.32,0.25],[0.28,0.32],[0.25,0.40],[0.20,0.48],
    [0.15,0.52],[0.10,0.50],[0.08,0.42],[0.06,0.35],[0.04,0.28],
  ]]);
  cont([[
    [0.20,0.55],[0.25,0.52],[0.30,0.55],[0.32,0.62],[0.30,0.72],
    [0.26,0.80],[0.22,0.88],[0.20,0.84],[0.18,0.74],[0.17,0.63],
  ]]);
  cont([[
    [0.42,0.10],[0.50,0.08],[0.56,0.10],[0.58,0.15],[0.56,0.22],
    [0.52,0.28],[0.46,0.28],[0.42,0.24],[0.40,0.18],
  ]]);
  cont([[
    [0.44,0.30],[0.52,0.28],[0.58,0.30],[0.62,0.40],[0.62,0.55],
    [0.58,0.68],[0.52,0.75],[0.46,0.72],[0.42,0.60],[0.40,0.48],[0.40,0.38],
  ]]);
  cont([[
    [0.58,0.08],[0.72,0.05],[0.82,0.08],[0.88,0.15],[0.90,0.25],
    [0.88,0.35],[0.82,0.42],[0.76,0.45],[0.68,0.42],[0.62,0.38],
    [0.58,0.30],[0.56,0.22],
  ]]);
  cont([[
    [0.74,0.58],[0.82,0.55],[0.88,0.58],[0.90,0.65],
    [0.88,0.72],[0.82,0.74],[0.76,0.72],[0.72,0.65],
  ]]);

  ctx.fillStyle = "#ddeeff";
  ctx.beginPath();
  ctx.ellipse(W/2, H*0.97, W*0.45, H*0.06, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(W/2, H*0.03, W*0.35, H*0.04, 0, 0, Math.PI*2);
  ctx.fill();

  return new THREE.CanvasTexture(canvas);
}

function generateNightTexture() {
  const W = 2048, H = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#00010a";
  ctx.fillRect(0, 0, W, H);

  const cities = [
    {cx:0.20,cy:0.28,r:0.06,n:120},{cx:0.12,cy:0.22,r:0.04,n:80},
    {cx:0.48,cy:0.20,r:0.08,n:200},{cx:0.76,cy:0.28,r:0.10,n:220},
    {cx:0.88,cy:0.22,r:0.04,n:100},{cx:0.60,cy:0.32,r:0.04,n:60},
    {cx:0.22,cy:0.65,r:0.05,n:60},{cx:0.50,cy:0.65,r:0.03,n:40},
    {cx:0.82,cy:0.65,r:0.04,n:50},
  ];
  cities.forEach(({cx,cy,r,n}) => {
    for (let i = 0; i < n; i++) {
      const a = Math.random()*Math.PI*2, d = Math.random()*r;
      const x = (cx + Math.cos(a)*d)*W, y = (cy + Math.sin(a)*0.5*d)*H;
      ctx.fillStyle = `rgba(255,${180+Math.random()*75|0},${80+Math.random()*80|0},${0.4+Math.random()*0.6})`;
      ctx.beginPath();
      ctx.arc(x, y, Math.random()*1.5+0.3, 0, Math.PI*2);
      ctx.fill();
    }
  });
  return new THREE.CanvasTexture(canvas);
}

// ─── EARTH SHADER ─────────────────────────────────────────────────────────────
const EARTH_VERT = `
  varying vec3 vNormal;
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const EARTH_FRAG = `
  uniform sampler2D dayTexture;
  uniform sampler2D nightTexture;
  uniform vec3 sunDirection;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  void main() {
    vec4 day   = texture2D(dayTexture,   vUv);
    vec4 night = texture2D(nightTexture, vUv);
    float d = dot(normalize(vWorldNormal), normalize(sunDirection));
    float t = smoothstep(-0.08, 0.12, d);
    vec4 earth = mix(night * 0.55, day, t);
    float rim = 1.0 - max(dot(normalize(vNormal), vec3(0,0,1)), 0.0);
    float rimPow = pow(rim, 3.5);
    vec3 atm = vec3(0.26, 0.53, 1.0) * rimPow * 0.5 * (t * 0.7 + 0.3);
    gl_FragColor = vec4(earth.rgb + atm, 1.0);
  }
`;

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function SolarSimulation() {
  const mountRef    = useRef(null);
  const sceneRef    = useRef({});
  const initialDoy  = getTodayDoy(); 
  
  const stateRef    = useRef({
    currentDoy: initialDoy,
    currentDecl: declination(initialDoy),
    targetDecl:  declination(initialDoy),
    rotY: 0,
    velY: 0,
    isDragging: false,
    prevX: 0,
    autoPlay: false,
    animDoy: initialDoy,
  });
  const animFrameRef = useRef(null);

  const [uiDoy,    setUiDoy]    = useState(initialDoy);
  const [autoPlay, setAutoPlay] = useState(false);
  const [toast,    setToast]    = useState({ msg: "", visible: false });
  const toastTimer = useRef(null);

  const { month, day } = dayOfYearToDate(uiDoy);
  const decl    = declination(uiDoy);
  const event   = specialEvent(uiDoy);
  const declSign = decl >= 0 ? "+" : "";

  function showToast(msg) {
    clearTimeout(toastTimer.current);
    setToast({ msg, visible: true });
    toastTimer.current = setTimeout(() => setToast(t => ({...t, visible: false})), 2600);
  }

  const setDoy = useCallback((doy, withToast = false) => {
    const clamped = Math.max(0, Math.min(364, Math.round(doy)));
    stateRef.current.currentDoy = clamped;
    stateRef.current.targetDecl = declination(clamped);
    setUiDoy(clamped);
    const ev = specialEvent(clamped);
    if (withToast && ev) showToast("☀ " + ev.name);
  }, []);

  // ── THREE.JS INIT ─────────────────────────────────────────────────────────
  useEffect(() => {
    const mount = mountRef.current;
    const W = mount.clientWidth, H = mount.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    mount.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000);
    camera.position.set(0, 1.5, 3.8);
    camera.lookAt(0, 0, 0);

    const scene = new THREE.Scene();

    const starCount = 8000;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 300 + Math.random() * 100;
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      starPos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
      starPos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      starPos[i*3+2] = r * Math.cos(phi);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const starMesh = new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: 0xffffff, size: 0.5, sizeAttenuation: true,
      transparent: true, opacity: 0.85,
    }));
    scene.add(starMesh);

    const earthGroup = new THREE.Group();
    earthGroup.rotation.z = AXIAL_TILT;
    scene.add(earthGroup);

    const spinGroup = new THREE.Group();
    earthGroup.add(spinGroup);

    const earthMat = new THREE.ShaderMaterial({
      uniforms: {
        dayTexture:   { value: generateDayTexture() },
        nightTexture: { value: generateNightTexture() },
        sunDirection: { value: new THREE.Vector3(1, 0, 0) },
      },
      vertexShader:   EARTH_VERT,
      fragmentShader: EARTH_FRAG,
    });
    const earthMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 128), earthMat);
    spinGroup.add(earthMesh);

    const makeLatLine = (latDeg, color) => {
      const lat = latDeg * Math.PI / 180;
      const pts = [];
      for (let i = 0; i <= 256; i++) {
        const a = (i / 256) * Math.PI * 2;
        pts.push(new THREE.Vector3(1.003 * Math.cos(lat) * Math.cos(a), 1.003 * Math.sin(lat), 1.003 * Math.cos(lat) * Math.sin(a)));
      }
      return new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9 })
      );
    };
    spinGroup.add(makeLatLine( 23.5, 0xff3344));
    spinGroup.add(makeLatLine(   0,  0xffe066));
    spinGroup.add(makeLatLine(-23.5, 0x44aaff));

    earthGroup.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,-1.6,0), new THREE.Vector3(0,1.6,0)]),
      new THREE.LineBasicMaterial({ color: 0x445566, transparent: true, opacity: 0.35 })
    ));

    const sunGroup = new THREE.Group();
    sunGroup.position.set(5, 0, 0);
    scene.add(sunGroup);

    const sunLayers = [
      { size: 0.60, color: 0xffffff, opacity: 1.0  },
      { size: 0.85, color: 0xffee88, opacity: 0.55 },
      { size: 1.20, color: 0xffcc44, opacity: 0.28 },
      { size: 1.75, color: 0xff9900, opacity: 0.12 },
      { size: 2.50, color: 0xff6600, opacity: 0.06 },
    ];
    sunLayers.forEach(({size, color, opacity}) => {
      sunGroup.add(new THREE.Mesh(
        new THREE.SphereGeometry(size, 32, 32),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false })
      ));
    });

    const sunLight = new THREE.DirectionalLight(0xfff8e8, 2.5);
    sunLight.position.copy(sunGroup.position);
    scene.add(sunLight);
    scene.add(new THREE.AmbientLight(0x111828, 1.0));

    const subSolarGroup = new THREE.Group();
    earthGroup.add(subSolarGroup);

    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.9, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
    const ringMesh = new THREE.Mesh(new THREE.RingGeometry(0.03, 0.055, 48), ringMat);
    subSolarGroup.add(ringMesh);

    subSolarGroup.add(new THREE.Mesh(
      new THREE.CircleGeometry(0.018, 32),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })
    ));

    const glowMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.3, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
    const glowMesh = new THREE.Mesh(new THREE.RingGeometry(0.06, 0.12, 48), glowMat);
    subSolarGroup.add(glowMesh);

    sceneRef.current = {
      renderer, scene, camera,
      earthGroup, spinGroup, sunGroup, sunLayers,
      earthMat, subSolarGroup, ringMesh, ringMat, glowMat,
    };

    // ── ANIMATION LOOP ───────────────────────────────────────────────────────
    const clock = new THREE.Clock();
    let pulse = 0;

    function applyDeclination(decl) {
      const lat = decl * Math.PI / 180;
      const r = 1.003;
      subSolarGroup.position.set(r * Math.cos(lat), r * Math.sin(lat), 0);
      subSolarGroup.lookAt(0, 0, 0);
      subSolarGroup.rotateX(Math.PI / 2);
      earthMat.uniforms.sunDirection.value.set(Math.cos(lat), Math.sin(lat), 0);
    }

    function loop() {
      animFrameRef.current = requestAnimationFrame(loop);
      const dt = clock.getDelta();
      const t  = clock.getElapsedTime();
      const s  = stateRef.current;

      if (s.autoPlay) {
        s.animDoy = (s.animDoy + dt * 18) % 365;
        const next = Math.round(s.animDoy);
        if (next !== s.currentDoy) {
          s.currentDoy  = next;
          s.targetDecl  = declination(next);
          setUiDoy(next);
        }
      }

      s.currentDecl += (s.targetDecl - s.currentDecl) * Math.min(dt * 3.5, 1);
      applyDeclination(s.currentDecl);

      if (!s.isDragging) { s.velY *= 0.94; s.rotY += s.velY; }
      spinGroup.rotation.y = s.rotY;

      pulse += dt * 2;
      const p = 0.88 + 0.12 * Math.sin(pulse);
      ringMesh.scale.setScalar(p);
      ringMat.opacity = 0.65 + 0.30 * Math.sin(pulse * 1.2);
      glowMat.opacity = 0.15 + 0.15 * Math.sin(pulse * 0.8);

      sunGroup.children.forEach((child, i) => {
        if (i > 0) child.material.opacity = sunLayers[i].opacity * (0.92 + 0.08 * Math.sin(t * 1.5 + i * 1.3));
      });

      starMesh.rotation.y = t * 0.002;

      renderer.render(scene, camera);
    }
    loop();

    // ── RESIZE & EVENTS ─────────────────────────────────────────────────────────
    const onResize = () => {
      const W = mount.clientWidth, H = mount.clientHeight;
      renderer.setSize(W, H);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    const getX = e => e.touches ? e.touches[0].clientX : e.clientX;
    const onDown = e => {
      stateRef.current.isDragging = true;
      stateRef.current.prevX = getX(e);
      stateRef.current.velY  = 0;
    };
    const onMove = e => {
      if (!stateRef.current.isDragging) return;
      const dx = getX(e) - stateRef.current.prevX;
      stateRef.current.rotY  += dx * 0.005;
      stateRef.current.velY   = dx * 0.005;
      stateRef.current.prevX  = getX(e);
    };
    const onUp = () => { stateRef.current.isDragging = false; };

    renderer.domElement.addEventListener("mousedown", onDown);
    renderer.domElement.addEventListener("touchstart", onDown, { passive: true });
    window.addEventListener("mousemove",  onMove);
    window.addEventListener("touchmove",  onMove, { passive: true });
    window.addEventListener("mouseup",    onUp);
    window.addEventListener("touchend",   onUp);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize",    onResize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("mouseup",   onUp);
      window.removeEventListener("touchend",  onUp);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    stateRef.current.autoPlay = autoPlay;
    if (autoPlay) stateRef.current.animDoy = stateRef.current.currentDoy;
  }, [autoPlay]);

  // ── UI HANDLERS ────────────────────────────────────────────────────────────
  const handleSlider = (e) => {
    setAutoPlay(false);
    setDoy(parseInt(e.target.value), true);
  };

  const handleDateInput = (e) => {
    const [,m,d] = e.target.value.split("-").map(Number);
    if (!m || !d) return;
    setDoy(dayOfYear(m, d), true);
  };

  const goToToday = () => {
    const doy = getTodayDoy();
    setDoy(doy);
    const {month, day} = dayOfYearToDate(doy);
    showToast(`📅 Bugün: ${day} ${MONTHS[month-1]}`);
  };

  const toggleAutoPlay = () => {
    setAutoPlay(p => {
      showToast(p ? "⏸ Durduruldu" : "▶ Oto Oynat Aktif");
      return !p;
    });
  };

  const declColor = decl > 20 ? "#ff4455" : decl > 0 ? "#ff8866" : decl < -20 ? "#44aaff" : decl < 0 ? "#88aaff" : "#ffe066";

  return (
    <div style={{ position:"fixed", inset:0, background:"#020408", fontFamily:"'Exo 2', sans-serif", color:"#c8e0ff", overflow:"hidden" }}>
      <link rel="preconnect" href="https://fonts.googleapis.com"/>
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Exo+2:wght@300;400;600&display=swap" rel="stylesheet"/>

      <div ref={mountRef} style={{ position:"absolute", inset:0, zIndex:0 }}/>

      <div style={{
        position:"fixed", top:80, left:"50%", transform:"translateX(-50%)",
        zIndex:30, background:"rgba(255,215,0,0.12)",
        border:"1px solid rgba(255,215,0,0.5)", borderRadius:10,
        padding:"10px 22px", fontSize:12, letterSpacing:1, color:"#ffd700",
        textAlign:"center", pointerEvents:"none", fontFamily:"'Orbitron',monospace",
        transition:"opacity 0.5s",
        opacity: toast.visible ? 1 : 0,
      }}>{toast.msg}</div>

      <div style={{
        position:"fixed", top:0, left:0, right:0, zIndex:20,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"14px 28px",
        background:"linear-gradient(180deg,rgba(2,4,8,0.95) 0%,rgba(2,4,8,0) 100%)",
        borderBottom:"1px solid rgba(80,160,255,0.2)",
        backdropFilter:"blur(4px)",
      }}>
        <div style={{ fontFamily:"'Orbitron',monospace", fontSize:12, fontWeight:700, letterSpacing:3, color:"#44aaff", opacity:0.8 }}>
          ☀ GÜNEŞ SİMÜLASYONU
        </div>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontFamily:"'Orbitron',monospace", fontSize:20, fontWeight:900, color:"#fff", letterSpacing:2 }}>
            {day} {MONTHS[month-1]}
          </div>
          <div style={{
            fontSize:10, letterSpacing:4, textTransform:"uppercase",
            color:"#ffd700", marginTop:2, minHeight:16,
            transition:"opacity 0.4s", opacity: event ? 1 : 0.3,
          }}>
            {event ? event.name : "—"}
          </div>
        </div>
        <div style={{ fontFamily:"'Orbitron',monospace", fontSize:12, color:"#5a7fa0", textAlign:"right", lineHeight:"1.6" }}>
          DEKLİNASYON<br/>
          <span style={{ fontSize:18, color: declColor, fontWeight:700 }}>
            {declSign}{decl.toFixed(1)}°
          </span>
        </div>
      </div>

      <div style={{
        position:"fixed", right:24, top:"50%", transform:"translateY(-50%)",
        zIndex:20, display:"flex", flexDirection:"column", gap:10,
        background:"rgba(4,12,24,0.88)", border:"1px solid rgba(80,160,255,0.25)",
        borderRadius:12, padding:"16px 18px", backdropFilter:"blur(8px)",
      }}>
        <div style={{ fontFamily:"'Orbitron',monospace", fontSize:9, letterSpacing:3, color:"#5a7fa0", textTransform:"uppercase", textAlign:"center", marginBottom:4 }}>
          Paraleller
        </div>
        {[
          { color:"#ff3344", label:"Yengeç Dönencesi (23.5°K)" },
          { color:"#ffe066", label:"Ekvator (0°)" },
          { color:"#44aaff", label:"Oğlak Dönencesi (23.5°G)" },
        ].map(({color, label}) => (
          <div key={label} style={{ display:"flex", alignItems:"center", gap:10, fontSize:11, whiteSpace:"nowrap" }}>
            <div style={{ width:28, height:3, borderRadius:2, background:color, flexShrink:0 }}/>
            {label}
          </div>
        ))}
        <hr style={{ border:"none", borderTop:"1px solid rgba(80,160,255,0.2)", margin:"4px 0" }}/>
        <div style={{ fontSize:10, color:"#5a7fa0", textAlign:"center" }}>🖱 Sürükle → Döndür</div>
      </div>

      <div style={{
        position:"fixed", bottom:0, left:0, right:0, zIndex:20,
        padding:"18px 32px 22px",
        background:"linear-gradient(0deg,rgba(2,4,8,0.97) 60%,rgba(2,4,8,0) 100%)",
        borderTop:"1px solid rgba(80,160,255,0.2)",
        backdropFilter:"blur(8px)",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:14 }}>
          <span style={{ fontFamily:"'Orbitron',monospace", fontSize:10, letterSpacing:2, color:"#5a7fa0", textTransform:"uppercase", whiteSpace:"nowrap" }}>
            Yıl Boyunca
          </span>
          <div style={{ flex:1, position:"relative" }}>
            <input
              type="range" min="0" max="364" value={uiDoy}
              onChange={handleSlider}
              style={{
                width:"100%", WebkitAppearance:"none", appearance:"none",
                height:4, borderRadius:2, outline:"none", cursor:"pointer",
                background:"linear-gradient(90deg,#ff3344 0%,#ffe066 25%,#44aaff 50%,#ffe066 75%,#ff3344 100%)",
              }}
            />
            <div style={{ display:"flex", justifyContent:"space-between", padding:"0 2px", marginTop:6 }}>
              {MONTH_LABELS.map((label, i) => (
                <span
                  key={label}
                  onClick={() => setDoy(MONTH_STARTS[i], true)}
                  style={{ fontSize:9, color:"#5a7fa0", cursor:"pointer", flex:1, textAlign:"center", transition:"color 0.2s" }}
                  onMouseEnter={e => e.target.style.color="#fff"}
                  onMouseLeave={e => e.target.style.color="#5a7fa0"}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          <div style={{
            display:"flex", alignItems:"center", gap:8,
            background:"rgba(10,25,50,0.7)", border:"1px solid rgba(80,160,255,0.25)",
            borderRadius:8, padding:"8px 14px",
          }}>
            <label style={{ fontSize:10, letterSpacing:2, color:"#5a7fa0", textTransform:"uppercase", whiteSpace:"nowrap" }}>
              Tarih
            </label>
            <input
              type="date"
              value={`2026-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`}
              onChange={handleDateInput}
              style={{
                background:"transparent", border:"none", outline:"none",
                color:"#fff", fontFamily:"'Exo 2',sans-serif", fontSize:14,
                cursor:"pointer", colorScheme:"dark",
              }}
            />
          </div>

          <button onClick={goToToday} style={btnStyle}>📅 Bugüne Git</button>
          <button onClick={toggleAutoPlay} style={{
            ...btnStyle,
            background: autoPlay ? "rgba(68,170,255,0.22)" : "rgba(68,170,255,0.1)",
            boxShadow: autoPlay ? "0 0 16px rgba(68,170,255,0.3)" : "none",
          }}>
            {autoPlay ? "⏸ Durdur" : "▶ Oto Oynat"}
          </button>

          <div style={{ display:"flex", gap:6, marginLeft:"auto" }}>
            {[
              { doy: 79,  label:"İlkbahar Ekinoksu", icon:"🌿" },
              { doy: 171, label:"Yaz Gündönümü",      icon:"☀️" },
              { doy: 265, label:"Sonbahar Ekinoksu",  icon:"🍂" },
              { doy: 354, label:"Kış Gündönümü",       icon:"❄️" },
            ].map(({doy, label, icon}) => (
              <button
                key={doy}
                onClick={() => { setAutoPlay(false); setDoy(doy, true); }}
                title={label}
                style={{ ...btnStyle, padding:"8px 12px", fontSize:16 }}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px; height: 20px;
          border-radius: 50%;
          background: radial-gradient(circle, #fff 30%, #ffd700 100%);
          box-shadow: 0 0 12px #ffd700, 0 0 24px rgba(255,215,0,0.4);
          cursor: pointer;
          transition: box-shadow 0.2s;
        }
        input[type=range]::-webkit-slider-thumb:hover {
          box-shadow: 0 0 20px #ffd700, 0 0 40px rgba(255,215,0,0.6);
        }
      `}</style>
    </div>
  );
}

const btnStyle = {
  fontFamily:"'Orbitron',monospace",
  fontSize:10, letterSpacing:2, textTransform:"uppercase",
  padding:"10px 18px", borderRadius:8,
  border:"1px solid #44aaff",
  background:"rgba(68,170,255,0.1)",
  color:"#44aaff", cursor:"pointer",
  transition:"all 0.2s", whiteSpace:"nowrap",
};