import { useState, useEffect, useRef } from 'react';

type LevelInfo = { name: string };
const levels: Record<string, LevelInfo> = {
  easy: { name: 'Łatwy' },
  medium: { name: 'Średni' },
  hard: { name: 'Trudny' },
};

const myImages = [
  './puzzle/fig31.jpg', './puzzle/fig32.jpg', './puzzle/fig33.jpg',
  './puzzle/fig34.jpg', './puzzle/fig35.jpg', './puzzle/fig36.jpg',
  './puzzle/fig37.jpg', './puzzle/fig38.jpg', './puzzle/fig39.jpg',
  './puzzle/fig40.jpg',
  './puzzle/10.jpg', './puzzle/11.jpg', './puzzle/12.jpg',
  './puzzle/13.jpg', './puzzle/14.jpg', './puzzle/15.jpg',
  './puzzle/16.jpg', './puzzle/17.jpg', './puzzle/18.jpg',
  './puzzle/19.jpg', './puzzle/20.jpg', './puzzle/21.jpg',
  './puzzle/22.jpg', './puzzle/23.jpg', './puzzle/24.jpg',
  './puzzle/25.jpg', './puzzle/26.jpg', './puzzle/27.jpg',
  './puzzle/28.jpg', './puzzle/29.jpg'
];

export default function Puzzle({ goBack, onSaveScore }: { goBack: () => void, onSaveScore: (g: string, t: string, n: number, tm: number | null) => void }) {
  const [level, setLevel] = useState<string | null>(null);
  const [gridConfig, setGridConfig] = useState({ rows: 3, cols: 4 });
  const [imgRatio, setImgRatio] = useState<number>(4 / 3);
  
  const [tiles, setTiles] = useState<number[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [moves, setMoves] = useState(0);
  const [imageUrl, setImageUrl] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [timer, setTimer] = useState(0);

  // --- SYSTEM STEROWANIA PADEM DLA PUZZLI ---
  const [cursorIndex, setCursorIndex] = useState(0);
  
  const padStateRef = useRef({ cursorIndex, isPlaying, isFinished, showPreview, cols: gridConfig.cols, rows: gridConfig.rows, level });
  useEffect(() => {
    padStateRef.current = { cursorIndex, isPlaying, isFinished, showPreview, cols: gridConfig.cols, rows: gridConfig.rows, level };
  }, [cursorIndex, isPlaying, isFinished, showPreview, gridConfig, level]);

  const lastNavTime = useRef(0);
  const navCooldown = 200; 

  // TIMER EFFECT
  useEffect(() => {
    let interval: number;
    if (isPlaying && !isFinished) {
      interval = window.setInterval(() => {
        setTimer(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isFinished, startTime]);

  // GAMEPAD EFFECT
  useEffect(() => {
    let loopId: number;
    let wasAPressed = false;

    const pollGamepad = () => {
      const pad = Array.from(navigator.getGamepads()).find(p => p !== null);
      if (pad) {
        const now = Date.now();
        const state = padStateRef.current;
        const deadzone = 0.4;
        
        const up = pad.buttons[12]?.pressed || pad.axes[1] < -deadzone;
        const down = pad.buttons[13]?.pressed || pad.axes[1] > deadzone;
        const left = pad.buttons[14]?.pressed || pad.axes[0] < -deadzone;
        const right = pad.buttons[15]?.pressed || pad.axes[0] > deadzone;

        // NAWIGACJA PO KAFELKACH / PRZYCISKACH
        if (now - lastNavTime.current > navCooldown) {
          if (!state.level) {
            // 1. Ekran wyboru poziomu (Pionowo od 0 do 3)
            if (down && state.cursorIndex < 3) { setCursorIndex(c => c + 1); lastNavTime.current = now; }
            if (up && state.cursorIndex > 0) { setCursorIndex(c => c - 1); lastNavTime.current = now; }
          } else if (state.isFinished) {
            // 2. Ekran wygranej (Pionowo od 0 do 1)
            if (down && state.cursorIndex < 1) { setCursorIndex(c => c + 1); lastNavTime.current = now; }
            if (up && state.cursorIndex > 0) { setCursorIndex(c => c - 1); lastNavTime.current = now; }
          } else if (!state.isPlaying) {
            // 3. Przed rozpoczęciem (Tylko przycisk Mieszaj - indeks zawsze 0)
            setCursorIndex(0);
          } else {
            // 4. W trakcie rozgrywki (Siatka 2D + przyciski dolne)
            const totalTiles = state.cols * state.rows;

            if (state.cursorIndex < totalTiles) {
              // Poruszanie się wewnątrz siatki puzzli
              if (right && state.cursorIndex < totalTiles - 1) { setCursorIndex(c => c + 1); lastNavTime.current = now; }
              if (left && state.cursorIndex > 0) { setCursorIndex(c => c - 1); lastNavTime.current = now; }
              
              if (down) {
                // Jeśli jesteśmy w ostatnim rzędzie, zjeżdżamy na dolne przyciski
                if (state.cursorIndex + state.cols >= totalTiles) {
                  setCursorIndex(totalTiles); // Przejdź do przycisku podglądu
                } else {
                  setCursorIndex(c => c + state.cols);
                }
                lastNavTime.current = now;
              }
              if (up && state.cursorIndex - state.cols >= 0) { setCursorIndex(c => c - state.cols); lastNavTime.current = now; }
            } else {
              // Poruszanie się po dolnych przyciskach menu (indeksy: totalTiles = Podgląd, totalTiles + 1 = Przerwij)
              if (up) {
                // Wracamy na sam dół siatki puzzli do ostatniej kolumny
                setCursorIndex(totalTiles - 1);
                lastNavTime.current = now;
              }
              if (right && state.cursorIndex === totalTiles) { setCursorIndex(totalTiles + 1); lastNavTime.current = now; }
              if (left && state.cursorIndex === totalTiles + 1) { setCursorIndex(totalTiles); lastNavTime.current = now; }
            }
          }
        }

        // UNIWERSALNE KLIKNIĘCIE PRZYCISKU PO ID HTML
        const isAPressed = pad.buttons[0]?.pressed;
        if (isAPressed && !wasAPressed) {
          const state = padStateRef.current;
          let idToClick = `puzzle-btn-${state.cursorIndex}`;
          
          if (state.level && !state.isFinished) {
            if (!state.isPlaying) {
              idToClick = "puzzle-btn-start";
            } else {
              const totalTiles = state.cols * state.rows;
              if (state.cursorIndex === totalTiles) idToClick = "puzzle-btn-active-preview";
              if (state.cursorIndex === totalTiles + 1) idToClick = "puzzle-btn-active-quit";
            }
          }

          const btn = document.getElementById(idToClick);
          if (btn) btn.click();
        }
        wasAPressed = isAPressed;
      }
      loopId = requestAnimationFrame(pollGamepad);
    };

    pollGamepad();
    return () => cancelAnimationFrame(loopId);
  }, []);

  // --- LOGIKA AKCJI ---
  const initGame = (lvlKey: string) => {
    const selectedImg = myImages[Math.floor(Math.random() * myImages.length)];
    setImageUrl(selectedImg);
    const img = new Image();
    
    img.onload = () => {
      const exactRatio = img.width / img.height;
      setImgRatio(exactRatio);
      const isVertical = img.height > img.width;
      let c = 4, r = 3;

      if (lvlKey === 'easy') { c = isVertical ? 3 : 4; r = isVertical ? 4 : 3; } 
      else if (lvlKey === 'medium') { c = isVertical ? 4 : 5; r = isVertical ? 5 : 4; } 
      else if (lvlKey === 'hard') { c = isVertical ? 6 : 7; r = isVertical ? 7 : 6; }

      setGridConfig({ cols: c, rows: r });
      setLevel(lvlKey);
      setTiles(Array.from({ length: c * r }, (_, i) => i));
      setIsPlaying(false);
      if (isFinished) setIsFinished(false);
      setShowPreview(false);
      setMoves(0);
      setTimer(0);
      setSelectedIdx(null);
      setCursorIndex(0); 
    };

    img.onerror = () => {
      setImgRatio(4/3);
      setGridConfig({ cols: 4, rows: 3 });
      setLevel(lvlKey);
      setTiles(Array.from({ length: 12 }, (_, i) => i));
      setCursorIndex(0);
    };
    img.src = `${selectedImg}?t=${Date.now()}`;
  };

  const startGame = () => {
    const shuffled = [...tiles];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setTiles(shuffled);
    setIsPlaying(true);
    setShowPreview(false);
    setStartTime(Date.now());
    setMoves(0);
    setTimer(0);
    setCursorIndex(0); 
  };

  const handleTileClick = (index: number) => {
    if (!isPlaying || isFinished || showPreview) return;

    if (selectedIdx === null) {
      setSelectedIdx(index);
    } else {
      if (selectedIdx !== index) {
        const newTiles = [...tiles];
        [newTiles[selectedIdx], newTiles[index]] = [newTiles[index], newTiles[selectedIdx]];
        setTiles(newTiles);
        setMoves(m => m + 1);
        
        if (newTiles.every((val, i) => val === i)) {
          setIsFinished(true);
          setIsPlaying(false);
          setCursorIndex(0); 
        }
      }
      setSelectedIdx(null);
    }
  };

  // ================= EKRAN WYBORU POZIOMU =================
  if (!level) {
    return (
      <div className="flex flex-col items-center gap-4 w-full">
        <h2 className="text-3xl text-blue-900 font-bold mb-6">Morskie Puzzle</h2>
        <button id="puzzle-btn-0" onMouseEnter={() => setCursorIndex(0)} onClick={() => initGame('easy')} className={`font-bold py-3 px-8 rounded-full w-80 shadow-md transition duration-200 ${cursorIndex === 0 ? 'bg-cyan-400 text-white ring-4 ring-yellow-400 scale-105' : 'bg-cyan-500 text-white'}`}>👶 Łatwy (12 elementów)</button>
        <button id="puzzle-btn-1" onMouseEnter={() => setCursorIndex(1)} onClick={() => initGame('medium')} className={`font-bold py-3 px-8 rounded-full w-80 shadow-md transition duration-200 ${cursorIndex === 1 ? 'bg-blue-500 text-white ring-4 ring-yellow-400 scale-105' : 'bg-blue-600 text-white'}`}>🏖️ Średni (20 elementów)</button>
        <button id="puzzle-btn-2" onMouseEnter={() => setCursorIndex(2)} onClick={() => initGame('hard')} className={`font-bold py-3 px-8 rounded-full w-80 shadow-md transition duration-200 ${cursorIndex === 2 ? 'bg-blue-800 text-white ring-4 ring-yellow-400 scale-105' : 'bg-blue-900 text-white'}`}>⚓ Trudny (42 elementy)</button>
        <button id="puzzle-btn-3" onMouseEnter={() => setCursorIndex(3)} onClick={goBack} className={`mt-6 font-bold py-2 px-6 rounded-full transition duration-200 ${cursorIndex === 3 ? 'bg-gray-200 text-red-600 ring-4 ring-yellow-400 scale-105' : 'text-red-500 underline'}`}>Wróć do Menu</button>
      </div>
    );
  }

  // ================= EKRAN WYGRANEJ =================
  if (isFinished) {
    return (
      <div className="flex flex-col items-center gap-4 p-4 w-full animate-fadeIn">
        <h2 className="text-4xl text-blue-900 font-black mb-2 uppercase tracking-tighter">Zadanie Wykonane!</h2>
        
        <div className="relative mb-6 group">
          <div className="absolute -inset-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-1000"></div>
          <div className="relative bg-white p-2 rounded-xl shadow-2xl border-4 border-white">
            <img src={imageUrl} alt="Ułożony obraz" className="max-h-[350px] rounded-lg shadow-inner object-contain" />
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-inner text-center w-full max-w-sm mb-4 border border-white">
          <div className="flex justify-around mb-2">
            <div><p className="text-xs text-gray-400 uppercase font-bold">Ruchy</p><p className="text-3xl text-red-500 font-black">{moves}</p></div>
            <div className="border-l border-gray-200"></div>
            <div><p className="text-xs text-gray-400 uppercase font-bold">Czas</p><p className="text-3xl text-blue-600 font-black">{timer}s</p></div>
          </div>
          <p className="text-sm text-gray-400 italic mt-2 border-t pt-2">Poziom: {levels[level].name}</p>
        </div>

        <div className="flex flex-col gap-3 w-64">
          <button 
            id="puzzle-btn-0"
            onMouseEnter={() => setCursorIndex(0)}
            onClick={() => onSaveScore(`PUZZLE (${levels[level].name.toUpperCase()})`, `${moves} RUCHÓW`, moves, timer)} 
            className={`font-black py-4 px-8 rounded-full shadow-lg transition duration-200 text-xl uppercase ${cursorIndex === 0 ? 'bg-yellow-400 text-blue-900 ring-4 ring-blue-600 scale-105' : 'bg-yellow-300 text-blue-900'}`}
          >
            Zapisz Wynik
          </button>
          <button 
            id="puzzle-btn-1"
            onMouseEnter={() => setCursorIndex(1)}
            onClick={goBack} 
            className={`py-2 px-8 rounded-full font-bold underline transition duration-200 ${cursorIndex === 1 ? 'bg-gray-100 text-gray-900 ring-4 ring-yellow-400 scale-105' : 'text-gray-500'}`}
          >
            Menu Główne
          </button>
        </div>
      </div>
    );
  }

  // ================= EKRAN ROZGRYWKI (GRA) =================
  const totalTiles = gridConfig.cols * gridConfig.rows;

  return (
    <div className="flex flex-col items-center w-full relative">
      <div className="flex justify-between w-full mb-4 px-4 max-w-2xl">
        <span className="text-xl text-red-500 font-bold tracking-wider bg-white/50 px-4 py-1 rounded-full shadow-sm">Ruchy: {moves}</span>
        <span className="text-xl text-blue-600 font-bold tracking-wider font-mono bg-white/50 px-4 py-1 rounded-full shadow-sm">Czas: {timer}s</span>
      </div>

      <div 
        className="grid gap-[2px] bg-blue-950 p-1 rounded-lg shadow-xl relative w-full max-w-[700px] border-4 border-white/40 max-h-[60vh]"
        style={{ 
          gridTemplateColumns: `repeat(${gridConfig.cols}, minmax(0, 1fr))`,
          aspectRatio: `${imgRatio}` 
        }}
      >
        {tiles.map((correctVal, currentIdx) => {
          const correctRow = Math.floor(correctVal / gridConfig.cols);
          const correctCol = correctVal % gridConfig.cols;
          const posX = (correctCol / (gridConfig.cols - 1)) * 100;
          const posY = (correctRow / (gridConfig.rows - 1)) * 100;

          const isSelected = selectedIdx === currentIdx;
          const isCorrectPos = isPlaying && correctVal === currentIdx;

          return (
            <div
              id={`puzzle-btn-${currentIdx}`} 
              key={currentIdx}
              onMouseEnter={() => isPlaying && !showPreview && setCursorIndex(currentIdx)}
              onClick={() => handleTileClick(currentIdx)}
              className={`w-full h-full bg-no-repeat transition-all duration-200 border-2 
                ${isSelected ? 'border-red-500 scale-90 z-20 shadow-[0_0_15px_red]' : 
                  (cursorIndex === currentIdx && isPlaying && !showPreview) ? 'border-yellow-400 ring-4 ring-yellow-400 scale-95 z-10' : 'border-white/20'} 
                ${isCorrectPos && !isSelected ? 'border-green-400 shadow-[0_0_10px_#4ade80] animate-pulseSlow' : ''} 
                ${isPlaying && !showPreview ? 'cursor-pointer' : 'cursor-default'}`}
              style={{
                backgroundImage: `url('${imageUrl}')`,
                backgroundSize: `${gridConfig.cols * 100}% ${gridConfig.rows * 100}%`,
                backgroundPosition: `${posX}% ${posY}%`
              }}
            />
          );
        })}

        {showPreview && (
            <div className="absolute inset-0 bg-blue-950 p-1 rounded-lg z-20 animate-fadeIn">
                <div className="grid gap-[2px] w-full h-full" style={{ gridTemplateColumns: `repeat(${gridConfig.cols}, minmax(0, 1fr))` }}>
                  {Array.from({ length: gridConfig.rows * gridConfig.cols }).map((_, i) => {
                    const correctRow = Math.floor(i / gridConfig.cols);
                    const correctCol = i % gridConfig.cols;
                    const posX = (correctCol / (gridConfig.cols - 1)) * 100;
                    const posY = (correctRow / (gridConfig.rows - 1)) * 100;
                    return (
                      <div key={`prev-${i}`} className="w-full h-full bg-no-repeat border border-white/20" style={{ backgroundImage: `url('${imageUrl}')`, backgroundSize: `${gridConfig.cols * 100}% ${gridConfig.rows * 100}%`, backgroundPosition: `${posX}% ${posY}%` }} />
                    );
                  })}
                </div>
                <div className="absolute inset-x-0 bottom-2 text-center z-30 pointer-events-none">
                  <span className="bg-white/90 text-blue-950 font-bold px-4 py-1 rounded-full shadow text-sm uppercase tracking-wider">Podgląd Rozwiązania</span>
                </div>
            </div>
        )}
      </div>

      <div className="flex gap-4 items-center mt-8">
        {!isPlaying ? (
            <button 
              id="puzzle-btn-start" 
              onMouseEnter={() => setCursorIndex(0)}
              onClick={startGame} 
              className={`font-bold py-4 px-10 rounded-full shadow-lg transition text-xl border-2
                ${cursorIndex === 0 ? 'bg-teal-400 text-white ring-4 ring-yellow-400 scale-105' : 'bg-teal-500 text-white animate-pulse'}`}
            >
                MIESZAJ I START!
            </button>
        ) : (
            <>
                <button 
                    id="puzzle-btn-active-preview"
                    onMouseEnter={() => setCursorIndex(totalTiles)}
                    onClick={() => setShowPreview(!showPreview)} 
                    className={`font-semibold py-3 px-6 rounded-xl transition shadow flex items-center gap-2 border-2 text-white
                      ${showPreview ? 'bg-orange-500' : 'bg-green-600'}
                      ${cursorIndex === totalTiles ? 'ring-4 ring-yellow-400 border-yellow-400 scale-105' : 'border-transparent'}`}
                >
                    {showPreview ? 'Ukryj Podgląd' : 'Pokaż Wzór 1:1'}
                </button>
                <button 
                    id="puzzle-btn-active-quit"
                    onMouseEnter={() => setCursorIndex(totalTiles + 1)}
                    onClick={() => setLevel(null)} 
                    className={`font-bold underline transition-colors py-2 px-4 rounded-xl
                      ${cursorIndex === totalTiles + 1 ? 'bg-red-100 text-red-600 ring-4 ring-yellow-400 scale-105' : 'text-red-400 hover:text-red-600'}`}
                >
                    Przerwij
                </button>
            </>
        )}
      </div>
    </div>
  );
}