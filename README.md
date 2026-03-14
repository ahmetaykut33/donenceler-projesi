# ☀ Dönenceler & Gündönümü Simülasyonu — React + Three.js

## Kurulum

### 1. Yeni Proje Oluştur
```bash
npm create vite@latest solar-sim -- --template react
cd solar-sim
npm install
```

### 2. Three.js Kur
```bash
npm install three
```

### 3. Dosyayı Yerleştir
`SolarSimulation.jsx` dosyasını `src/` klasörüne kopyala.

### 4. App.jsx'i Güncelle
`src/App.jsx` içeriğini şöyle değiştir:

```jsx
import SolarSimulation from './SolarSimulation';

export default function App() {
  return <SolarSimulation />;
}
```

### 5. Çalıştır
```bash
npm run dev
```

---

## Proje Yapısı

```
src/
├── App.jsx               ← Sadece SolarSimulation'ı render eder
└── SolarSimulation.jsx   ← Tüm uygulama bu dosyada
```

---

## Bileşen Mimarisi

### Three.js Sahne Hiyerarşisi
```
scene
 ├── Points (8.000 yıldız — çok hafif, sizeAttenuation)
 ├── earthGroup  ← rotation.z = 23.5° (sabit eksen eğikliği)
 │    ├── spinGroup  ← rotation.y = kullanıcı sürüklemesi
 │    │    ├── SphereGeometry (ShaderMaterial — gece/gündüz)
 │    │    ├── Line 23.5°K  → kırmızı (Yengeç)
 │    │    ├── Line 0°      → sarı   (Ekvator)
 │    │    └── Line 23.5°G  → mavi   (Oğlak)
 │    ├── Line (eksen — döndürülmez)
 │    └── subSolarGroup ← Güneş yönünü takip eder, döndürülmez
 │         ├── RingGeometry (altın halka — pulse efekti)
 │         ├── CircleGeometry (beyaz nokta)
 │         └── RingGeometry (dış glow)
 ├── sunGroup (5 katmanlı glow — AdditiveBlending)
 └── DirectionalLight + AmbientLight
```

### Neden spinGroup Ayrı?
Kullanıcı Dünya'yı döndürdüğünde kıtalar ve paralel çizgiler birlikte hareket etmeli.
Ama `subSolarGroup` (güneşin dik düştüğü nokta) her zaman güneşe bakan yarımkürede kalmalı.
Bu yüzden:
- `spinGroup` → kullanıcı rotasyonunu alır
- `subSolarGroup` → `earthGroup` içinde ama `spinGroup` dışında → döndürülmez

### Shader (GLSL) — Gece/Gündüz Efekti
```glsl
// Terminator (aydınlanma çizgisi)
float d = dot(normalize(vWorldNormal), normalize(sunDirection));
float t = smoothstep(-0.08, 0.12, d);
// -0.08 → -0.12 arası yumuşak geçiş (gerçekçi atmosferik refraksiyon)

// Gece/gündüz mix
vec4 earth = mix(night * 0.55, day, t);

// Atmosfer rim ışığı
float rim = 1.0 - max(dot(normalize(vNormal), vec3(0,0,1)), 0.0);
vec3 atm = vec3(0.26, 0.53, 1.0) * pow(rim, 3.5) * 0.5;
```

### Deklinasyon Formülü
```js
// Astronomik olarak doğru güneş deklinasyonu
declination(doy) = -23.45 * cos(2π/365 * (doy + 10))
// doy = 0 (1 Ocak) ... 364 (31 Aralık)
// Yaz Gündönümü (21 Haziran, doy≈172) → +23.45°
// Kış Gündönümü (21 Aralık, doy≈355) → -23.45°
// Ekinokslar (doy≈79, doy≈265) → 0°
```

### Shader'a Güneş Yönü İletimi
```js
// Deklinasyon açısından dünya-yerel koordinatlarda güneş yönü vektörü
earthMat.uniforms.sunDirection.value.set(
  Math.cos(declRad),  // x: enlemsel bileşen
  Math.sin(declRad),  // y: kuzey/güney bileşen
  0                   // z: derinlik (her zaman sıfır — 2D düzlem)
);
```

---

## State Yönetimi

### stateRef (mutable — animation loop için)
```js
stateRef.current = {
  currentDoy: 172,    // Mevcut gün (0-364)
  currentDecl: 23.45, // Smooth interpolation için mevcut değer
  targetDecl: 23.45,  // Hedef değer (kaydırıcıdan gelir)
  rotY: 0,            // Y rotasyonu (radyan)
  velY: 0,            // Angular velocity (inertia için)
  isDragging: false,
  prevX: 0,
  autoPlay: false,
  animDoy: 172,       // Oto-oynat için float gün sayacı
}
```

### useState (React UI için)
```js
const [uiDoy, setUiDoy] = useState(172);     // Slider + date display
const [autoPlay, setAutoPlay] = useState(false);
const [toast, setToast] = useState({ msg:"", visible:false });
```

**Neden ikisi birden?**
- `stateRef` → animation loop'ta her frame erişilir, re-render tetiklememeli
- `useState` → UI güncellemesi için React'a haber vermeli

---

## Önemli Notlar

### Three.js'i React ile Kullanmak
- Tüm Three.js başlatma kodu `useEffect(..., [])` içinde
- Cleanup fonksiyonu ile renderer ve event listener'lar temizleniyor
- `animFrameRef` ile requestAnimationFrame ID saklanıyor → unmount'ta iptal edilebilir

### Performans
- `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))` → 4K ekranlarda aşırı yük önlenir
- Tekstürler procedural olarak üretilir (CDN'e bağımlılık yok)
- Stars için tek `Points` objesi kullanılır (8000 ayrı mesh değil)

### Responsive
- `window.addEventListener("resize", onResize)` ile kamera aspect ratio güncellenir
- CSS `@media (max-width: 700px)` için legend gizlenebilir

---

## Olası Geliştirmeler
- Gerçek NASA uydu dokusu (NASA Blue Marble) eklenebilir
- OrbitControls ile zoom eklenebilir
- Gün uzunluğu grafiği (recharts ile) eklenebilir
- Kutup gece/gündüzü animasyonu vurgulanabilir
