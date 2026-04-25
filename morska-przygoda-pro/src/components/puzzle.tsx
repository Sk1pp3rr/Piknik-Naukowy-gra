import { useState, useEffect } from 'react';

// Konfiguracja poziomów na podstawie Twojego pierwotnego pomysłu
type LevelConfig = {
  name: string;
  rows: number;
  cols: number;
};

const levels: Record<string, LevelConfig> = {
  easy: { name: 'Łatwy', rows: 3, cols: 4 },     // 12 elementów
  medium: { name: 'Średni', rows: 4, cols: 5 },   // 20 elementów
  hard: { name: 'Trudny', rows: 6, cols: 7 },     // 42 elementy
};

// Pula zdjęć (możesz tu wpisać linki do folderu public, np. '/assets/images/puzzle1.jpg')
const myImages = [
  'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800&q=80',
];

export default function Puzzle({ goBack }: { goBack: () => void }) {
  // Stany gry
  const [level, setLevel] = useState<string | null>(null);
  const [tiles, setTiles] = useState<number[]>([]); // Tablica przechowująca aktualne rozłożenie puzzli
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [moves, setMoves] = useState(0);
  const [imageUrl, setImageUrl] = useState('');
  
  // Czasomierz
  const [startTime, setStartTime] = useState(0);
  const [timer, setTimer] = useState(0);

  // Aktualizacja stopera co sekundę
  useEffect(() => {
    let interval: number;
    if (isPlaying && !isFinished) {
      interval = window.setInterval(() => {
        setTimer(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval); // Sprzątanie pamięci przy wyjściu!
  }, [isPlaying, isFinished, startTime]);

  // Funkcja budująca czystą planszę przed tasowaniem
  const initGame = (lvlKey: string) => {
    const config = levels[lvlKey];
    const totalTiles = config.rows * config.cols;
    
    // Generujemy startową, ułożoną tablicę np. [0, 1, 2, 3... 11]
    const initialTiles = Array.from({ length: totalTiles }, (_, i) => i);
    
    setLevel(lvlKey);
    setTiles(initialTiles);
    setImageUrl(myImages[Math.floor(Math.random() * myImages.length)]);
    setIsPlaying(false);
    setIsFinished(false);
    setMoves(0);
    setTimer(0);
    setSelectedIdx(null);
  };

  // Rozpoczęcie gry i tasowanie
  const startGame = () => {
    const shuffled = [...tiles];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    setTiles(shuffled);
    setIsPlaying(true);
    setStartTime(Date.now());
    setMoves(0);
    setTimer(0);
  };

  // Mechanika zamiany miejscami
  const handleTileClick = (index: number) => {
    if (!isPlaying || isFinished) return;

    if (selectedIdx === null) {
      setSelectedIdx(index);
    } else {
      if (selectedIdx !== index) {
        const newTiles = [...tiles];
        // Podmiana kafelków w tablicy
        [newTiles[selectedIdx], newTiles[index]] = [newTiles[index], newTiles[selectedIdx]];
        setTiles(newTiles);
        setMoves(m => m + 1);
        
        // Czy wszystkie elementy wróciły na swoje indeksy?
        const won = newTiles.every((val, i) => val === i);
        if (won) {
          setIsFinished(true);
          setIsPlaying(false);
        }
      }
      setSelectedIdx(null); // Odznacz bez względu na wynik
    }
  };

  // --- WIDOK 1: WYBÓR POZIOMU (Ilość elementów) ---
  if (!level) {
    return (
      <div className="flex flex-col items-center gap-4 w-full">
        <h2 className="text-3xl text-blue-900 font-bold mb-6">Morskie Puzzle</h2>
        <button onClick={() => initGame('easy')} className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold py-3 px-8 rounded-full w-80 shadow-md transition transform hover:scale-105">👶 Łatwy (3x4 = 12 elementów)</button>
        <button onClick={() => initGame('medium')} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-full w-80 shadow-md transition transform hover:scale-105">🏖️ Średni (4x5 = 20 elementów)</button>
        <button onClick={() => initGame('hard')} className="bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 px-8 rounded-full w-80 shadow-md transition transform hover:scale-105">⚓ Trudny (6x7 = 42 elementy)</button>
        <button onClick={goBack} className="mt-6 text-red-500 hover:text-red-400 font-bold underline">Wróć do Menu</button>
      </div>
    );
  }

  // --- WIDOK 2: WYGRANA ---
  if (isFinished) {
    return (
      <div className="flex flex-col items-center gap-4 bg-blue-50 p-8 rounded-3xl border-4 border-blue-200">
        <h2 className="text-4xl text-blue-900 font-bold mb-2">Ułożone! 🎉</h2>
        <div className="bg-white p-6 rounded-2xl shadow-inner text-center w-full max-w-sm mb-4">
          <p className="text-lg text-gray-500 mb-1">Poziom: <span className="font-bold text-blue-800 uppercase">{levels[level].name}</span></p>
          <p className="text-xl text-blue-800 mb-2">Ruchy: <span className="font-bold text-red-500 text-3xl block">{moves}</span></p>
          <p className="text-xl text-blue-800">Czas: <span className="font-bold text-blue-600">{timer} s</span></p>
        </div>
        <button className="bg-yellow-400 hover:bg-yellow-300 text-blue-900 border-4 border-blue-900 font-extrabold py-3 px-8 rounded-full shadow-lg transform transition hover:-translate-y-1 text-xl">
          Zapisz Wynik
        </button>
        <button onClick={goBack} className="mt-4 text-gray-500 hover:text-gray-700 font-bold underline">
          Wróć do Menu
        </button>
      </div>
    );
  }

  // --- WIDOK 3: GRA (Plansza) ---
  const config = levels[level];

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex justify-between w-full mb-4 px-4 max-w-2xl">
        <span className="text-xl text-red-500 font-bold tracking-wider">
          Ruchy: {moves}
        </span>
        <span className="text-xl text-blue-600 font-bold tracking-wider font-mono">
          Czas: {timer}s
        </span>
      </div>

      {/* Dynamiczna siatka układanki */}
      <div 
        className="grid gap-[2px] bg-blue-900 p-1 rounded-lg shadow-xl"
        style={{ 
          // React sam wstrzykuje kolumny na podstawie configu!
          gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`,
          width: '100%',
          maxWidth: '700px',
          // Utrzymujemy proporcje siatki, by kafelki były kwadratami
          aspectRatio: `${config.cols} / ${config.rows}` 
        }}
      >
        {tiles.map((correctVal, currentIdx) => {
          // Matematyka - gdzie docelowo miał leżeć ten element?
          const correctRow = Math.floor(correctVal / config.cols);
          const correctCol = correctVal % config.cols;
          
          // Ustawiamy background-position jako procent, dzięki czemu obrazek tnie się sam
          const posX = (correctCol / (config.cols - 1)) * 100;
          const posY = (correctRow / (config.rows - 1)) * 100;

          const isSelected = selectedIdx === currentIdx;

          return (
            <div
              key={currentIdx}
              onClick={() => handleTileClick(currentIdx)}
              className={`w-full h-full cursor-pointer transition-all duration-200 border-2 ${isSelected ? 'border-red-500 scale-90 z-10 shadow-[0_0_15px_red]' : 'border-white/20 hover:border-white/50'}`}
              style={{
                backgroundImage: `url('${imageUrl}')`,
                backgroundSize: `${config.cols * 100}% ${config.rows * 100}%`,
                backgroundPosition: `${posX}% ${posY}%`
              }}
            />
          );
        })}
      </div>

      {/* Przyciski sterujące pod planszą */}
      {!isPlaying ? (
        <button 
          onClick={startGame} 
          className="mt-8 bg-teal-500 hover:bg-teal-400 text-white font-bold py-4 px-10 rounded-full shadow-lg transform transition hover:scale-105 text-xl animate-pulse"
        >
          MIESZAJ I START!
        </button>
      ) : (
        <button 
          onClick={() => setLevel(null)} 
          className="mt-8 text-red-400 hover:text-red-600 font-bold underline transition-colors"
        >
          Przerwij i zmień poziom
        </button>
      )}
    </div>
  );
}