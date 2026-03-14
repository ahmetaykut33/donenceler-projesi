import React, { useState } from "react";
import LandingPage from "./LandingPage";
import SolarSimulation from "./SolarSimulation";

export default function App() {
  // Simülasyonun başlayıp başlamadığını takip eden durum (state)
  const [isSimulationStarted, setIsSimulationStarted] = useState(false);

  return (
    <>
      {!isSimulationStarted ? (
        // Eğer başlamadıysa Giriş Sayfasını göster
        <LandingPage onStart={() => setIsSimulationStarted(true)} />
      ) : (
        // Butona tıklandıysa 3D Simülasyonu göster
        <SolarSimulation />
      )}
    </>
  );
}