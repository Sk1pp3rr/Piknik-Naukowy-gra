import { useState, useEffect, useRef } from 'react';

// Stałe fizyczne dla planszy
const W = 400, H = 400;
const bounds = 2.9, dt = 0.04, eps = 0.08, targetRadius = 0.18;

type Point = { x: number; y: number };
type Scenario = { A: Point; B: Point };

const SCENARIOS: Scenario[] = [
  { A: { x: -2.5, y: -2.0 }, B: { x: 2.3, y: 2.0 } },  // (Lewy dół -> Prawy góra)
  { A: { x: -2.5, y: 2.5 }, B: { x: 2.5, y: -2.5 } },  // (Lewy góra -> Prawy dół)
  { A: { x: 0.0, y: -2.6 }, B: { x: 0.0, y: 2.6 } },   // Pionowo przez środek
  { A: { x: -2.6, y: 0.0 }, B: { x: 2.6, y: 0.0 } },   // Poziomo przez środek
  { A: { x: 2.5, y: -2.0 }, B: { x: -2.5, y: 2.0 } }   // (Prawy dół -> Lewy góra)
];

function randomStrength() {
  const value = Math.random()*4 * (Math.random() < 0.5 ? -1 : 1);
  return value;
}

type Vortex = { id: number; x: number; y: number; strength: number; colorClass: string; hex: string; name: string };

export default function Wiry({ goBack, onSaveScore }: { goBack: () => void, onSaveScore: (g: string, t: string, n: number, tm: number | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null); 
  
  const [levelPoints, setLevelPoints] = useState<Scenario>(() => SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)]);
  const pointsRef = useRef(levelPoints);

  const gameRef = useRef({
    particle: { x: levelPoints.A.x, y: levelPoints.A.y },
    traj: [] as Point[],
    pathLength: 0,
    isRunning: false
  });

  const [vortices, setVortices] = useState<Vortex[]>([
    { id: 0, x: -1.4, y: 0.0, strength: randomStrength(), colorClass: 'text-blue-500 accent-blue-500', hex: '#3b82f6', name: 'Niebieski' },
    { id: 1, x: 0.0, y: 1.4, strength: randomStrength(), colorClass: 'text-green-500 accent-green-500', hex: '#22c55e', name: 'Zielony' },
    { id: 2, x: 1.4, y: -1.0, strength: randomStrength(), colorClass: 'text-orange-500 accent-orange-500', hex: '#f97316', name: 'Pomarańcz' }
  ]);
  
  const vorticesRef = useRef(vortices);
  
  // Zapewnia odświeżenie referencji, żeby Canvas miał zawsze aktualne dane
  useEffect(() => { vorticesRef.current = vortices; }, [vortices]);
  useEffect(() => { 
    pointsRef.current = levelPoints; 
    draw(); 
  }, [levelPoints]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [liveDistance, setLiveDistance] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toPixX = (x: number) => ((x + 3) / 6) * W;
  const toPixY = (y: number) => H - ((y + 3) / 6) * H;

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { A, B } = pointsRef.current; // Pobieramy aktualne punkty z referencji

    ctx.clearRect(0, 0, W, H);
    
    // STRZAŁKI WEKTOROWE
    const step = 6 / 16;
    for (let gx = -3; gx <= 3; gx += step) {
      for (let gy = -3; gy <= 3; gy += step) {
        let u = 0, v = 0;
        let maxMag = -1;
        let domColor = "rgba(180, 180, 180, 0.2)"; 

        vorticesRef.current.forEach(vt => {
          if (vt.strength === 0) return;
          let dx = gx - vt.x, dy = gy - vt.y;
          let r2 = dx * dx + dy * dy + eps;
          let cu = -vt.strength * dy / r2;
          let cv = vt.strength * dx / r2;
          
          u += cu; 
          v += cv;
          
          let mag = Math.sqrt(cu * cu + cv * cv);
          if (mag > maxMag) {
            maxMag = mag;
            domColor = vt.hex;
          }
        });

        let totalMag = Math.sqrt(u * u + v * v);
        if (totalMag > 0.1) {
            if (totalMag > 3) { u = (u / totalMag) * 3; v = (v / totalMag) * 3; }
            
            const scale = 0.15;
            const px1 = toPixX(gx), py1 = toPixY(gy);
            const px2 = toPixX(gx + u * scale), py2 = toPixY(gy + v * scale);

            ctx.strokeStyle = domColor;
            ctx.globalAlpha = Math.min(1, maxMag * 0.5 + 0.2); 
            ctx.lineWidth = 1.5;

            ctx.beginPath(); 
            ctx.moveTo(px1, py1); 
            ctx.lineTo(px2, py2);
            
            const angle = Math.atan2(py2 - py1, px2 - px1);
            ctx.lineTo(px2 - 4 * Math.cos(angle - Math.PI / 6), py2 - 4 * Math.sin(angle - Math.PI / 6));
            ctx.moveTo(px2, py2);
            ctx.lineTo(px2 - 4 * Math.cos(angle + Math.PI / 6), py2 - 4 * Math.sin(angle + Math.PI / 6));
            ctx.stroke();
            ctx.globalAlpha = 1.0; 
        }
      }
    }

    // BAZA
    ctx.beginPath(); ctx.arc(toPixX(B.x), toPixY(B.y), targetRadius * (W / 6), 0, Math.PI * 2);
    ctx.fillStyle = "rgba(128, 0, 128, 0.3)"; ctx.fill(); 
    ctx.fillStyle = "purple"; ctx.font = "bold 14px Arial"; ctx.fillText("B", toPixX(B.x) - 5, toPixY(B.y) + 5);

    ctx.beginPath(); ctx.arc(toPixX(A.x), toPixY(A.y), 6, 0, Math.PI * 2); 
    ctx.fillStyle = "black"; ctx.fill(); 
    ctx.fillText("A", toPixX(A.x) - 5, toPixY(A.y) + 20);

    vorticesRef.current.forEach(vt => {
      ctx.beginPath(); ctx.arc(toPixX(vt.x), toPixY(vt.y), 8, 0, Math.PI * 2);
      ctx.fillStyle = vt.hex; ctx.fill();
      ctx.strokeStyle = "white"; ctx.lineWidth = 2; ctx.stroke();
      
      ctx.fillStyle = "white"; ctx.font = "bold 12px Arial";
      let symbol = vt.strength > 0 ? '↺' : (vt.strength < 0 ? '↻' : 'x');
      ctx.fillText(symbol, toPixX(vt.x) - 5, toPixY(vt.y) + 4);
    });

    // TRASA
    const { particle, traj } = gameRef.current;
    
    if (traj.length > 1) {
      ctx.beginPath(); 
      ctx.moveTo(toPixX(traj[0].x), toPixY(traj[0].y));
      for (let i = 1; i < traj.length; i++) {
        ctx.lineTo(toPixX(traj[i].x), toPixY(traj[i].y));
      }
      ctx.strokeStyle = "red"; ctx.lineWidth = 2; ctx.stroke();
    }

    ctx.beginPath(); ctx.arc(toPixX(particle.x), toPixY(particle.y), 6, 0, Math.PI * 2);
    ctx.fillStyle = "red"; ctx.fill();
    ctx.strokeStyle = "darkred"; ctx.stroke();
  };

  const animate = () => {
    if (!gameRef.current.isRunning) return;

    const { B } = pointsRef.current;
    let p = gameRef.current.particle;
    let u = 0, v = 0;

    vorticesRef.current.forEach(vt => {
      if (vt.strength === 0) return;
      let dx = p.x - vt.x, dy = p.y - vt.y;
      let r2 = dx * dx + dy * dy + eps;
      u += -vt.strength * dy / r2;
      v += vt.strength * dx / r2;
    });

    let nx = p.x + u * dt;
    let ny = p.y + v * dt;

    if (Math.abs(nx) > bounds) nx = Math.sign(nx) * bounds;
    if (Math.abs(ny) > bounds) ny = Math.sign(ny) * bounds;

    const distStep = Math.sqrt(Math.pow(nx - p.x, 2) + Math.pow(ny - p.y, 2));
    gameRef.current.pathLength += distStep;

    gameRef.current.particle = { x: nx, y: ny };
    gameRef.current.traj.push({ x: nx, y: ny });

    draw(); 
    
    setLiveDistance(gameRef.current.pathLength);

    const distToB = Math.sqrt(Math.pow(nx - B.x, 2) + Math.pow(ny - B.y, 2));
    if (distToB < targetRadius) {
      gameRef.current.isRunning = false;
      setIsPlaying(false);
      setFinalScore(gameRef.current.pathLength);
      setIsFinished(true);
      return;
    }

    if (gameRef.current.pathLength > 500) {
        gameRef.current.isRunning = false;
        setIsPlaying(false);
        setErrorMsg("Pływak zgubił się w wielkim oceanie! Ustaw odpowiednio siły prądów morskich i spróbuj wytyczyć krótszą trasę.");
        return;
    }

    animRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (!isPlaying && !isFinished) {
      setTimeout(() => draw(), 10);
    }
  }, [vortices, isPlaying, isFinished]);

  const startGame = () => {
    setErrorMsg(null); 
    setLiveDistance(0);
    gameRef.current = {
      particle: { x: pointsRef.current.A.x, y: pointsRef.current.A.y },
      traj: [],
      pathLength: 0,
      isRunning: true
    };
    setIsFinished(false);
    setIsPlaying(true);
    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(animate);
  };

  const resetAndRandomize = () => {
    const newPoints = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
    setLevelPoints(newPoints); // To uruchomi useEffect i narysuje nową planszę
    
    setErrorMsg(null);
    setLiveDistance(0);
    gameRef.current.isRunning = false;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    gameRef.current.particle = { x: newPoints.A.x, y: newPoints.A.y };
    gameRef.current.traj = [];
    gameRef.current.pathLength = 0;
    setIsPlaying(false);
    setIsFinished(false);
  };

  const handleSliderChange = (id: number, val: number) => {
    setVortices(prev => prev.map(v => v.id === id ? { ...v, strength: val } : v));
  };

  // EKRAN WYGRANEJ
  if (isFinished) {
    return (
      <div className="flex flex-col items-center gap-4 p-8 w-full">
        <h2 className="text-4xl text-blue-900 font-bold mb-2">Cel Osiągnięty!</h2>
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-inner text-center w-full max-w-sm mb-4 border border-white">
          <p className="text-lg text-gray-500 mb-1">Długość przebytej trasy:</p>
          <p className="text-4xl text-red-500 font-bold mb-2">{finalScore.toFixed(1)} PKT</p>
          <p className="text-sm text-gray-400">(Im mniej punktów, tym krótsza i lepsza trasa!)</p>
        </div>
        <button onClick={() => onSaveScore("WIRY", `${finalScore.toFixed(1)} PKT`, finalScore, null)} className="bg-yellow-400 hover:bg-yellow-300 text-blue-900 border-4 border-blue-900 font-extrabold py-3 px-8 rounded-full shadow-lg transition text-xl mb-2 hover:-translate-y-1">
          Zapisz Wynik
        </button>
        <button onClick={resetAndRandomize} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded-full transition">
          Zagraj na nowej trasie
        </button>
        <button onClick={goBack} className="mt-4 text-gray-500 hover:text-gray-700 font-bold underline">
          Wróć do Menu
        </button>
      </div>
    );
  }

  // DWUKOLUMNOWY UKŁAD
  return (
    <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-10 w-full max-w-5xl mx-auto">
      
      {/* LEWA KOLUMNA: Plansza i Dystans */}
      <div className="flex flex-col items-center flex-shrink-0">
        <h2 className="text-3xl text-blue-900 font-bold mb-4 uppercase tracking-wider block md:hidden">Prądy Morskie</h2>
        
        <div className="bg-sky-50 border-4 border-blue-900 rounded-xl overflow-hidden shadow-2xl relative">
          <canvas ref={canvasRef} width={W} height={H} className="block" />
          
          {errorMsg && (
            <div className="absolute inset-0 bg-red-900/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10 animate-fadeIn">
              <span className="text-5xl mb-4">⚠️</span>
              <h3 className="text-2xl font-bold text-white mb-2">Misja Nieudana</h3>
              <p className="text-red-100 mb-6 text-sm px-4">{errorMsg}</p>
              <button onClick={resetAndRandomize} className="bg-white text-red-900 font-bold py-3 px-8 rounded-full shadow-lg hover:bg-gray-200 transition transform hover:scale-105">
                Spróbuj od nowa
              </button>
            </div>
          )}
        </div>
        
        <div className="mt-6 bg-red-100 text-red-600 font-black py-3 px-8 rounded-full border-2 border-red-300 shadow-inner text-2xl w-full text-center">
          Dystans: {liveDistance.toFixed(1)}
        </div>
      </div>

      {/* PRAWA KOLUMNA: Sterowanie i Przyciski */}
      <div className="flex flex-col items-center w-full max-w-sm pt-2">
        <h2 className="text-4xl text-blue-900 font-black mb-8 uppercase tracking-widest hidden md:block text-center border-b-4 border-dashed border-cyan-400 pb-2">Prądy Morskie</h2>

        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-white w-full mb-8">
          <h3 className="text-center font-bold text-gray-500 mb-6 text-sm uppercase tracking-wider">Zarządzaj siłą prądów (-4 do 4)</h3>
          {vortices.map(vt => (
            <div key={vt.id} className="flex items-center gap-4 mb-4">
              <span className={`font-bold w-24 text-right text-sm ${vt.colorClass}`}>{vt.name}</span>
              <input 
                type="range" 
                min="-4" max="4" step="0.1" 
                value={vt.strength} 
                onChange={(e) => handleSliderChange(vt.id, parseFloat(e.target.value))}
                className={`flex-1 h-3 rounded-lg appearance-none bg-gray-200 outline-none cursor-pointer ${vt.colorClass}`}
              />
              <span className="font-mono font-black w-10 text-left text-gray-700 text-lg">{vt.strength.toFixed(1)}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4 w-full">
          {!isPlaying ? (
            <button onClick={startGame} className="bg-teal-500 hover:bg-teal-400 text-white font-black py-4 px-8 rounded-full shadow-lg transform transition hover:scale-105 text-xl uppercase tracking-wider">
              Wypuść Pływak
            </button>
          ) : (
            <button onClick={resetAndRandomize} className="bg-red-500 hover:bg-red-400 text-white font-bold py-4 px-8 rounded-full shadow-lg transition text-xl">
              Zatrzymaj i Zmień Trasę
            </button>
          )}
          
          <button onClick={goBack} className="mt-4 text-gray-500 hover:text-gray-800 font-bold underline transition-colors">
            Wróć do Menu Głównego
          </button>
        </div>
      </div>
      
    </div>
  );
}