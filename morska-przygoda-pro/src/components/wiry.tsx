import { useState, useEffect, useRef } from 'react';

// Stałe fizyczne
const W = 400, H = 400;
const bounds = 2.9, dt = 0.04, eps = 0.08, targetRadius = 0.18;

type Point = { x: number; y: number };
type Scenario = { A: Point; B: Point };

const SCENARIOS: Scenario[] = [
  { A: { x: -2.5, y: -2.0 }, B: { x: 2.3, y: 2.0 } },
  { A: { x: -2.5, y: 2.5 }, B: { x: 2.5, y: -2.5 } },
  { A: { x: 0.0, y: -2.6 }, B: { x: 0.0, y: 2.6 } },
  { A: { x: -2.6, y: 0.0 }, B: { x: 2.6, y: 0.0 } },
  { A: { x: 2.5, y: -2.0 }, B: { x: -2.5, y: 2.0 } }
];

function randomStrength() {
  return Math.random()*4 * (Math.random() < 0.5 ? -1 : 1);
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

  // --- SYSTEM STEROWANIA PADEM ---
  const [cursorIndex, setCursorIndex] = useState(0);
  
  // Zabezpieczony stan dla pętli kontrolera
  const stateRef = useRef({ cursorIndex, isPlaying, isFinished, finalScore });
  useEffect(() => { 
    stateRef.current = { cursorIndex, isPlaying, isFinished, finalScore }; 
  }, [cursorIndex, isPlaying, isFinished, finalScore]);
  
  // OPÓŹNIENIA DLA KONTROLERA
  const lastNavTime = useRef(0);
  const lastSliderTime = useRef(0);
  const navCooldown = 250;
  const sliderCooldown = 50;

  useEffect(() => {
    let loopId: number;
    let wasAPressed = false;

    const pollGamepad = () => {
      const pad = Array.from(navigator.getGamepads()).find(p => p !== null); 
      if (pad) {
        const now = Date.now();
        const { cursorIndex, isPlaying, isFinished, finalScore } = stateRef.current;
        
        const deadzone = 0.4; 
        const up = pad.buttons[12]?.pressed || pad.axes[1] < -deadzone;
        const down = pad.buttons[13]?.pressed || pad.axes[1] > deadzone;
        const left = pad.buttons[14]?.pressed || pad.axes[0] < -deadzone;
        const right = pad.buttons[15]?.pressed || pad.axes[0] > deadzone;

        // NAWIGACJA GÓRA/DÓŁ
        if (now - lastNavTime.current > navCooldown) {
          // Różne limity przycisków w zależności od tego, czy wygraliśmy
          const maxIndex = isFinished ? 2 : (errorMsg ? 0 : 4);

          if (down && cursorIndex < maxIndex) {
            setCursorIndex(c => c + 1);
            lastNavTime.current = now;
          }
          if (up && cursorIndex > 0) {
            setCursorIndex(c => c - 1);
            lastNavTime.current = now;
          }
        }

        // ZMIANA WARTOŚCI WIRÓW
        if (!isFinished && !errorMsg && cursorIndex >= 0 && cursorIndex <= 2) {
          if ((left || right) && (now - lastSliderTime.current > sliderCooldown)) {
            const change = left ? -0.2 : 0.2;
            setVortices(prev => prev.map(v => {
              if (v.id === cursorIndex) {
                let newVal = v.strength + change;
                if (newVal > 4) newVal = 4;
                if (newVal < -4) newVal = -4;
                return { ...v, strength: parseFloat(newVal.toFixed(1)) };
              }
              return v;
            }));
            lastSliderTime.current = now; 
          }
        }

        // KLIKNIĘCIA (Uniwersalne przyciski akcji)
        const isAPressed = pad.buttons[0]?.pressed;

        if (isAPressed && !wasAPressed) {
          if (isFinished) {
            // EKRAN WYGRANEJ
            if (cursorIndex === 0) onSaveScore("WIRY", `${finalScore.toFixed(1)} PKT`, finalScore, null);
            else if (cursorIndex === 1) resetAndRandomize();
            else if (cursorIndex === 2) goBack();
          } else if (errorMsg) {
             // EKRAN PRZEGRANEJ
             if (cursorIndex === 0) resetAndRandomize();
          } else {
             // EKRAN GŁÓWNY (GRA)
             if (cursorIndex === 3) !isPlaying ? startGame() : resetAndRandomize();
             else if (cursorIndex === 4) goBack();
          }
        }

        wasAPressed = isAPressed;
      }
      loopId = requestAnimationFrame(pollGamepad);
    };

    pollGamepad();
    return () => cancelAnimationFrame(loopId);
  }, [errorMsg]); // <-- Dodano errorMsg do zależności

  const toPixX = (x: number) => ((x + 3) / 6) * W;
  const toPixY = (y: number) => H - ((y + 3) / 6) * H;

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { A, B } = pointsRef.current;
    ctx.clearRect(0, 0, W, H);
    
    const step = 6 / 16;
    for (let gx = -3; gx <= 3; gx += step) {
      for (let gy = -3; gy <= 3; gy += step) {
        let u = 0, v = 0, maxMag = -1;
        let domColor = "rgba(180, 180, 180, 0.2)"; 

        vorticesRef.current.forEach(vt => {
          if (vt.strength === 0) return;
          let dx = gx - vt.x, dy = gy - vt.y;
          let r2 = dx * dx + dy * dy + eps;
          let cu = -vt.strength * dy / r2;
          let cv = vt.strength * dx / r2;
          u += cu; v += cv;
          let mag = Math.sqrt(cu * cu + cv * cv);
          if (mag > maxMag) { maxMag = mag; domColor = vt.hex; }
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
            ctx.beginPath(); ctx.moveTo(px1, py1); ctx.lineTo(px2, py2);
            const angle = Math.atan2(py2 - py1, px2 - px1);
            ctx.lineTo(px2 - 4 * Math.cos(angle - Math.PI / 6), py2 - 4 * Math.sin(angle - Math.PI / 6));
            ctx.moveTo(px2, py2);
            ctx.lineTo(px2 - 4 * Math.cos(angle + Math.PI / 6), py2 - 4 * Math.sin(angle + Math.PI / 6));
            ctx.stroke();
            ctx.globalAlpha = 1.0; 
        }
      }
    }

    ctx.beginPath(); ctx.arc(toPixX(B.x), toPixY(B.y), targetRadius * (W / 6), 0, Math.PI * 2);
    ctx.fillStyle = "rgba(128, 0, 128, 0.3)"; ctx.fill(); 
    ctx.fillStyle = "purple"; ctx.font = "bold 14px Arial"; ctx.fillText("B", toPixX(B.x) - 5, toPixY(B.y) + 5);

    ctx.beginPath(); ctx.arc(toPixX(A.x), toPixY(A.y), 6, 0, Math.PI * 2); 
    ctx.fillStyle = "black"; ctx.fill(); ctx.fillText("A", toPixX(A.x) - 5, toPixY(A.y) + 20);

    vorticesRef.current.forEach(vt => {
      ctx.beginPath(); ctx.arc(toPixX(vt.x), toPixY(vt.y), 8, 0, Math.PI * 2);
      ctx.fillStyle = vt.hex; ctx.fill();
      ctx.strokeStyle = "white"; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = "white"; ctx.font = "bold 12px Arial";
      let symbol = vt.strength > 0 ? '↺' : (vt.strength < 0 ? '↻' : 'x');
      ctx.fillText(symbol, toPixX(vt.x) - 5, toPixY(vt.y) + 4);
    });

    const { particle, traj } = gameRef.current;
    if (traj.length > 1) {
      ctx.beginPath(); ctx.moveTo(toPixX(traj[0].x), toPixY(traj[0].y));
      for (let i = 1; i < traj.length; i++) ctx.lineTo(toPixX(traj[i].x), toPixY(traj[i].y));
      ctx.strokeStyle = "red"; ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(toPixX(particle.x), toPixY(particle.y), 6, 0, Math.PI * 2);
    ctx.fillStyle = "red"; ctx.fill(); ctx.strokeStyle = "darkred"; ctx.stroke();
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

    let nx = p.x + u * dt; let ny = p.y + v * dt;
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
      setCursorIndex(0); // Resetujemy pozycję gamepada po wygranej
      setIsFinished(true);
      return;
    }
    if (gameRef.current.pathLength > 150) {
        gameRef.current.isRunning = false;
        setIsPlaying(false);
        setCursorIndex(0); // Resetujemy pozycję gamepada po przegranej
        setErrorMsg("Pływak zgubił się w wielkim oceanie!");
        return;
    }
    animRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (!isPlaying && !isFinished) setTimeout(() => draw(), 10);
  }, [vortices, isPlaying, isFinished]);

  const startGame = () => {
    setErrorMsg(null); setLiveDistance(0);
    gameRef.current = { particle: { x: pointsRef.current.A.x, y: pointsRef.current.A.y }, traj: [], pathLength: 0, isRunning: true };
    setIsFinished(false); setIsPlaying(true);
    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(animate);
  };

  const resetAndRandomize = () => {
    const newPoints = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
    setLevelPoints(newPoints); 
    setErrorMsg(null); setLiveDistance(0);
    gameRef.current.isRunning = false;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    gameRef.current.particle = { x: newPoints.A.x, y: newPoints.A.y };
    gameRef.current.traj = []; gameRef.current.pathLength = 0;
    setIsPlaying(false); setIsFinished(false);
    setCursorIndex(0); // Reset na 1szy przycisk po nowej planszy
  };


  // EKRAN WYGRANEJ
  if (isFinished) {
    return (
      <div className="flex flex-col items-center gap-4 p-8 w-full max-w-md mx-auto animate-fadeIn">
        <h2 className="text-4xl text-blue-900 font-bold mb-2">Cel Osiągnięty!</h2>
        
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-inner text-center w-full mb-4 border border-white">
          <p className="text-lg text-gray-500 mb-1">Długość przebytej trasy:</p>
          <p className="text-4xl text-red-500 font-bold mb-2">{finalScore.toFixed(1)} PKT</p>
          <p className="text-sm text-gray-400">(Im mniej punktów, tym krótsza trasa!)</p>
        </div>

        {/* PRZYCISK 0 */}
        <button 
          onMouseEnter={() => setCursorIndex(0)}
          onClick={() => onSaveScore("WIRY", `${finalScore.toFixed(1)} PKT`, finalScore, null)} 
          className={`w-full bg-yellow-400 text-blue-900 font-extrabold py-4 px-8 rounded-full shadow-lg transition-all text-xl uppercase tracking-wider
            ${cursorIndex === 0 ? 'ring-4 ring-blue-500 scale-105' : 'hover:bg-yellow-300'}`}
        >
          Zapisz Wynik
        </button>

        {/* PRZYCISK 1 */}
        <button 
          onMouseEnter={() => setCursorIndex(1)}
          onClick={resetAndRandomize} 
          className={`w-full bg-cyan-600 text-white font-bold py-3 px-8 rounded-full transition-all uppercase
            ${cursorIndex === 1 ? 'ring-4 ring-yellow-400 scale-105 bg-cyan-500' : 'hover:bg-cyan-500'}`}
        >
          Zagraj na nowej trasie
        </button>

        {/* PRZYCISK 2 */}
        <button 
          onMouseEnter={() => setCursorIndex(2)}
          onClick={goBack} 
          className={`w-full font-bold py-3 px-8 rounded-full transition-all uppercase mt-2
            ${cursorIndex === 2 ? 'ring-4 ring-yellow-400 scale-105 bg-gray-200 text-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          Wróć do Menu
        </button>
      </div>
    );
  }

  // EKRAN GŁÓWNY WIRÓW
  return (
    <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-10 w-full max-w-5xl mx-auto">
      
      {/* LEWA KOLUMNA: Plansza */}
      <div className="flex flex-col items-center flex-shrink-0">
        <h2 className="text-3xl text-blue-900 font-bold mb-4 uppercase tracking-wider block md:hidden">Prądy Morskie</h2>
        <div className="bg-sky-50 border-4 border-blue-900 rounded-xl overflow-hidden shadow-2xl relative">
          <canvas ref={canvasRef} width={W} height={H} className="block" />
          
          {errorMsg && (
            <div className="absolute inset-0 bg-red-900/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10 animate-fadeIn">
              <span className="text-5xl mb-4">⚠️</span>
              <h3 className="text-2xl font-bold text-white mb-2">Misja Nieudana</h3>
              <p className="text-red-100 mb-6 text-sm px-4">{errorMsg}</p>
              <button 
                onMouseEnter={() => setCursorIndex(0)}
                onClick={resetAndRandomize} 
                className={`bg-white text-red-900 font-bold py-3 px-8 rounded-full shadow-lg transition-transform ${cursorIndex === 0 ? 'ring-4 ring-yellow-400 scale-110' : 'hover:bg-gray-200'}`}
              >
                Spróbuj od nowa
              </button>
            </div>
          )}
        </div>
        <div className="mt-6 bg-red-100 text-red-600 font-black py-3 px-8 rounded-full border-2 border-red-300 shadow-inner text-2xl w-full text-center">
          Dystans: {liveDistance.toFixed(1)}
        </div>
      </div>

      {/* PRAWA KOLUMNA: Interfejs i Focus System */}
      <div className="flex flex-col items-center w-full max-w-sm pt-2">
        <h2 className="text-4xl text-blue-900 font-black mb-8 uppercase tracking-widest hidden md:block text-center border-b-4 border-dashed border-cyan-400 pb-2">Prądy Morskie</h2>

        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-white w-full mb-8">
          {vortices.map((vt, idx) => (
            <div 
              key={vt.id} 
              onMouseEnter={() => setCursorIndex(idx)}
              className={`flex items-center gap-4 mb-2 p-2 rounded-xl transition-all duration-200 cursor-pointer ${
                cursorIndex === idx ? 'ring-4 ring-yellow-400 bg-yellow-50 scale-105' : 'border border-transparent'
              }`}
            >
              <span className={`font-bold w-20 text-right text-xs uppercase ${vt.colorClass}`}>{vt.name}</span>
              <input 
                type="range" 
                min="-4" max="4" step="0.1" 
                value={vt.strength} 
                onChange={(e) => {
                  setCursorIndex(idx);
                  const val = parseFloat(e.target.value);
                  setVortices(prev => prev.map(v => v.id === vt.id ? { ...v, strength: val } : v));
                }}
                className={`flex-1 h-3 rounded-lg appearance-none bg-gray-200 cursor-pointer ${vt.colorClass}`}
              />
              <span className="font-mono font-black w-10 text-left text-gray-700 text-lg">{vt.strength.toFixed(1)}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4 w-full px-4">
          <button 
            onMouseEnter={() => setCursorIndex(3)}
            onClick={() => { setCursorIndex(3); if(!isPlaying) startGame(); else resetAndRandomize(); }}
            className={`font-black py-4 px-8 rounded-full shadow-lg transform transition text-xl uppercase tracking-wider
              ${cursorIndex === 3 ? 'ring-4 ring-yellow-400 scale-110 bg-teal-400 text-white' : 'bg-teal-500 text-white hover:bg-teal-400'}
              ${isPlaying ? 'bg-red-500 hover:bg-red-400' : ''}`}
          >
            {isPlaying ? 'Zatrzymaj i Zmień' : 'Wypuść Pływak'}
          </button>
          
          <button 
            onMouseEnter={() => setCursorIndex(4)}
            onClick={() => { setCursorIndex(4); goBack(); }} 
            className={`font-bold py-3 px-8 rounded-full transition-all uppercase
              ${cursorIndex === 4 ? 'ring-4 ring-yellow-400 bg-gray-200 text-gray-800 scale-105' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            Wróć do Menu Głównego
          </button>
        </div>
      </div>
      
    </div>
  );
}