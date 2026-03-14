import React from 'react';

export default function LandingPage({ onStart }) {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "radial-gradient(circle at center, #0a1930 0%, #020408 100%)",
      color: "#c8e0ff",
      fontFamily: "'Exo 2', sans-serif",
      overflow: "hidden",
      position: "relative"
    }}>
      {/* Arka plan süslemesi */}
      <div style={{ position: "absolute", top: -100, left: -100, width: 300, height: 300, background: "rgba(68,170,255,0.1)", filter: "blur(100px)", borderRadius: "50%" }} />
      <div style={{ position: "absolute", bottom: -100, right: -100, width: 400, height: 400, background: "rgba(255,215,0,0.05)", filter: "blur(120px)", borderRadius: "50%" }} />

      <div style={{
        maxWidth: "800px",
        padding: "40px",
        background: "rgba(10, 20, 35, 0.6)",
        border: "1px solid rgba(80, 160, 255, 0.2)",
        borderRadius: "16px",
        backdropFilter: "blur(12px)",
        textAlign: "center",
        zIndex: 10,
        boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
      }}>
        <h1 style={{ fontFamily: "'Orbitron', monospace", fontSize: "3rem", color: "#fff", marginBottom: "16px", letterSpacing: "2px" }}>
          Mevsimler ve Dönenceler
        </h1>
        <h2 style={{ fontSize: "1.2rem", color: "#44aaff", fontWeight: 400, marginBottom: "32px", letterSpacing: "1px" }}>
          Etkileşimli 3D Öğretim Materyali
        </h2>
        
        <div style={{ fontSize: "1rem", lineHeight: "1.8", color: "#8ab4f8", marginBottom: "40px", textAlign: "justify" }}>
          <p style={{ marginBottom: "16px" }}>
            Bu simülasyon, Dünya'nın 23.5 derecelik eksen eğikliğinin ve Güneş etrafındaki konumunun mevsimleri nasıl oluşturduğunu anlamanıza yardımcı olmak için tasarlanmıştır.
          </p>
          <p>
            Uygulama içerisinde Dünya'yı kendi ekseninde döndürebilir, yıl içindeki günleri değiştirerek Güneş ışınlarının <strong>Yengeç</strong> ve <strong>Oğlak</strong> dönenceleri arasındaki hareketini anlık olarak gözlemleyebilirsiniz. Ekinoks ve gündönümü tarihlerinin Dünya üzerindeki aydınlanma etkilerini keşfetmeye hazır mısınız?
          </p>
        </div>

        <button 
          onClick={onStart}
          style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: "1.2rem",
            fontWeight: "bold",
            letterSpacing: "2px",
            textTransform: "uppercase",
            padding: "16px 40px",
            borderRadius: "8px",
            border: "1px solid #ffd700",
            background: "linear-gradient(90deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.2) 100%)",
            color: "#ffd700",
            cursor: "pointer",
            transition: "all 0.3s ease",
            boxShadow: "0 0 20px rgba(255,215,0,0.2)"
          }}
          onMouseEnter={e => {
            e.target.style.background = "linear-gradient(90deg, rgba(255,215,0,0.2) 0%, rgba(255,215,0,0.4) 100%)";
            e.target.style.boxShadow = "0 0 30px rgba(255,215,0,0.4)";
          }}
          onMouseLeave={e => {
            e.target.style.background = "linear-gradient(90deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.2) 100%)";
            e.target.style.boxShadow = "0 0 20px rgba(255,215,0,0.2)";
          }}
        >
          SİMÜLASYONU BAŞLAT
        </button>
      </div>
    </div>
  );
}