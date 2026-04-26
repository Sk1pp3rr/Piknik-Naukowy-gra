import { useState, useEffect } from 'react';

type LevelConfig = {
  name: string;
  rows: number;
  cols: number;
};

const levels: Record<string, LevelConfig> = {
  easy: { name: 'Łatwy', rows: 3, cols: 4 },
  medium: { name: 'Średni', rows: 4, cols: 5 },
  hard: { name: 'Trudny', rows: 6, cols: 7 },
};

// TWOJE LOKALNE ZDJĘCIA! 
// Vite szuka ich w folderze: public/puzzle/
const myImages = [
  './puzzle/1.jpg',
  './puzzle/2.jpg',
  './puzzle/3.jpg',
  './puzzle/4.jpg',
  './puzzle/5.jpg',
  './puzzle/6.jpg',
  './puzzle/7.jpg',
  './puzzle/8.jpg',
  './puzzle/9.jpg'
];

export default function Puzzle({ goBack, onSaveScore }: { goBack: () => void, onSaveScore: (g: string, t: string, n: number, tm: number | null) => void }) {
  const [level, setLevel] = useState<string | null>(null);
  const [tiles, setTiles] = useState<number[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [moves, setMoves] = useState(0);
  const [imageUrl, setImageUrl] = useState('');
  
  const [showPreview, setShowPreview] = useState(false);
  
  const [startTime, setStartTime] = useState(0);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval: number;
    if (isPlaying && !isFinished) {
      interval = window.setInterval(() => {
        setTimer(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isFinished, startTime]);

  const initGame = (lvlKey: string) => {
    const config = levels[lvlKey];
    const totalTiles = config.rows * config.cols;
    const initialTiles = Array.from({ length: totalTiles }, (_, i) => i);
    
    setLevel(lvlKey);
    setTiles(initialTiles);
    setImageUrl(myImages[Math.floor(Math.random() * myImages.length)]);
    setIsPlaying(false);
    isFinished && setIsFinished(false);
    setShowPreview(false);
    setMoves(0);
    setTimer(0);
    setSelectedIdx(null);
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
        
        const won = newTiles.every((val, i) => val === i);
        if (won) {
          setIsFinished(true);
          setIsPlaying(false);
        }
      }
      setSelectedIdx(null);
    }
  };

  if (!level) {
    return (
      <div className="flex flex-col items-center gap-4 w-full">
        <h2 className="text-3xl text-blue-900 font-bold mb-6">Morskie Puzzle</h2>
        <button onClick={() => initGame('easy')} className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold py-3 px-8 rounded-full w-80 shadow-md transition transform hover:scale-105">👶 Łatwy (3x4 elementy)</button>
        <button onClick={() => initGame('medium')} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-full w-80 shadow-md transition transform hover:scale-105">🏖️ Średni (4x5 elementów)</button>
        <button onClick={() => initGame('hard')} className="bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 px-8 rounded-full w-80 shadow-md transition transform hover:scale-105">⚓ Trudny (6x7 elementów)</button>
        <button onClick={goBack} className="mt-6 text-red-500 hover:text-red-400 font-bold underline">Wróć do Menu</button>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="flex flex-col items-center gap-4 p-4 w-full animate-fadeIn">
        <h2 className="text-4xl text-blue-900 font-black mb-2 uppercase tracking-tighter">Zadanie Wykonane! 🎉</h2>
        
        {/* WYŚWIETLANIE UŁOŻONEGO OBRAZKA */}
        <div className="relative mb-6 group">
          <div className="absolute -inset-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-1000"></div>
          <div className="relative bg-white p-2 rounded-xl shadow-2xl border-4 border-white">
            <img 
              src={imageUrl} 
              alt="Ułożony obraz" 
              className="max-h-[350px] rounded-lg shadow-inner object-contain"
            />
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-inner text-center w-full max-w-sm mb-4 border border-white">
          <div className="flex justify-around mb-2">
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold">Ruchy</p>
              <p className="text-3xl text-red-500 font-black">{moves}</p>
            </div>
            <div className="border-l border-gray-200"></div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold">Czas</p>
              <p className="text-3xl text-blue-600 font-black">{timer}s</p>
            </div>
          </div>
          <p className="text-sm text-gray-400 italic mt-2 border-t pt-2">Poziom: {levels[level!].name}</p>
        </div>

        <div className="flex flex-col gap-3 w-64">
          <button 
            onClick={() => onSaveScore(`PUZZLE (${levels[level!].name.toUpperCase()})`, `${moves} RUCHÓW`, moves, timer)} 
            className="bg-yellow-400 hover:bg-yellow-300 text-blue-900 border-b-4 border-yellow-600 font-black py-4 px-8 rounded-full shadow-lg transform transition hover:-translate-y-1 text-xl uppercase"
          >
            Zapisz Wynik
          </button>
          <button onClick={goBack} className="text-gray-500 hover:text-gray-800 font-bold underline transition-colors">
            Menu Główne
          </button>
        </div>
      </div>
    );
  }

  const config = levels[level];

  return (
    <div className="flex flex-col items-center w-full relative">
      <div className="flex justify-between w-full mb-4 px-4 max-w-2xl">
        <span className="text-xl text-red-500 font-bold tracking-wider bg-white/50 px-4 py-1 rounded-full shadow-sm">
          Ruchy: {moves}
        </span>
        <span className="text-xl text-blue-600 font-bold tracking-wider font-mono bg-white/50 px-4 py-1 rounded-full shadow-sm">
          Czas: {timer}s
        </span>
      </div>

      <div 
        className="grid gap-[2px] bg-blue-950 p-1 rounded-lg shadow-xl relative w-full max-w-[700px] border-4 border-white/40"
        style={{ 
          gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`,
          aspectRatio: `${config.cols} / ${config.rows}` 
        }}
      >
        {tiles.map((correctVal, currentIdx) => {
          const correctRow = Math.floor(correctVal / config.cols);
          const correctCol = correctVal % config.cols;
          
          const posX = (correctCol / (config.cols - 1)) * 100;
          const posY = (correctRow / (config.rows - 1)) * 100;

          const isSelected = selectedIdx === currentIdx;
          // ZMIANA: Sprawdzamy czy kafelek leży na swoim miejscu docelowym (Hint)
          const isCorrectPos = isPlaying && correctVal === currentIdx;

          return (
            <div
              key={currentIdx}
              onClick={() => handleTileClick(currentIdx)}
              // ZMIANA: Dynamiczne klasy dla podświetleń i zaznaczeń
              className={`w-full h-full bg-no-repeat transition-all duration-200 border-2 
                ${isSelected ? 'border-red-500 scale-90 z-10 shadow-[0_0_15px_red]' : 'border-white/20'} 
                ${isCorrectPos && !isSelected ? 'border-green-400 shadow-[0_0_10px_#4ade80] animate-pulseSlow' : ''} 
                ${isPlaying && !showPreview ? 'cursor-pointer hover:border-white/80' : 'cursor-default'}`}
              style={{
                backgroundImage: `url('${imageUrl}')`,
                backgroundSize: `${config.cols * 100}% ${config.rows * 100}%`,
                backgroundPosition: `${posX}% ${posY}%`
              }}
            />
          );
        })}

        {/* NAKŁADKA PODGLĄDU - TERAZ JEST TO IDENTYCZNA SIATKA (Solved Grid) 1:1 */}
        {showPreview && (
            <div className="absolute inset-0 bg-blue-950 p-1 rounded-lg z-20 animate-fadeIn">
                <div 
                  className="grid gap-[2px] w-full h-full"
                  style={{ 
                    gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`,
                    aspectRatio: `${config.cols} / ${config.rows}` 
                  }}
                >
                  {/* Generujemy siatkę "ułożoną" */}
                  {Array.from({ length: config.rows * config.cols }).map((_, i) => {
                    const correctVal = i; // Tu wartość zawsze równa się indeksowi
                    const correctRow = Math.floor(correctVal / config.cols);
                    const correctCol = correctVal % config.cols;
                    
                    const posX = (correctCol / (config.cols - 1)) * 100;
                    const posY = (correctRow / (config.rows - 1)) * 100;

                    return (
                      <div
                        key={`prev-${i}`}
                        className="w-full h-full bg-no-repeat border border-white/20"
                        style={{
                          backgroundImage: `url('${imageUrl}')`,
                          backgroundSize: `${config.cols * 100}% ${config.rows * 100}%`,
                          backgroundPosition: `${posX}% ${posY}%`
                        }}
                      />
                    );
                  })}
                </div>
                {/* Dyskretny napis informujący */}
                <div className="absolute inset-x-0 bottom-2 text-center z-30">
                  <span className="bg-white/80 text-blue-950 font-bold px-4 py-1 rounded-full shadow text-sm uppercase tracking-wider">Podgląd Rozwiązania</span>
                </div>
            </div>
        )}
      </div>

      <div className="flex gap-4 items-center mt-8">
        {!isPlaying ? (
            <button onClick={startGame} className="bg-teal-500 hover:bg-teal-400 text-white font-bold py-4 px-10 rounded-full shadow-lg transition text-xl animate-pulse">
                MIESZAJ I START!
            </button>
        ) : (
            <>
                <button 
                    onClick={() => setShowPreview(!showPreview)} 
                    // ZMIANA: Neonowy zielony styl przycisku hintów
                    className={`${showPreview ? 'bg-orange-500 hover:bg-orange-400' : 'bg-green-600 hover:bg-green-500'} text-white font-semibold py-3 px-6 rounded-xl transition shadow flex items-center gap-2 shadow-[0_0_15px_#22c55e33]`}
                >
                    {showPreview ? 'Ukryj Podgląd' : 'Pokaż Wzór'}
                </button>

                <button onClick={() => setLevel(null)} className="text-red-400 hover:text-red-600 font-bold underline transition-colors">
                    Przerwij
                </button>
            </>
        )}
      </div>
    </div>
  );
}