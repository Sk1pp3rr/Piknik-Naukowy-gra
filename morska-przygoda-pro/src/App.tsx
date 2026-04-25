import { useState } from 'react'
import Quiz from './components/quiz'
import Puzzle from './components/puzzle'
import Wiry from './components/wiry'

// Definiujemy w TypeScript, jakie mamy dostępne ekrany (zapobiega literówkom!)
type Screen = 'menu' | 'wiry' | 'puzzle' | 'quiz' | 'scoreboard';

function App() {
  // useState to najważniejsze narzędzie w React. 
  // Przechowuje informację o tym, gdzie aktualnie jesteśmy.
  const [currentScreen, setCurrentScreen] = useState<Screen>('menu');

  // Funkcja, która decyduje, co wyrenderować (narysować) na ekranie
  const renderScreen = () => {
    switch (currentScreen) {
      case 'menu':
        return (
          <div className="flex flex-col items-center gap-4">
            <h1 className="text-3xl md:text-5xl font-bold text-blue-900 border-b-4 border-dashed border-cyan-400 pb-4 mb-4 uppercase drop-shadow-md">
              Bałtycka Akademia Odkrywców
            </h1>
            <p className="text-xl text-blue-800 mb-6 font-medium">
              Wybierz przygodę, aby rozpocząć naukową misję!
            </p>

            {/* Przyciski nawigacyjne */}
            <button 
              onClick={() => setCurrentScreen('wiry')} 
              className="bg-blue-900 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition hover:-translate-y-1 text-lg w-64"
            >
              🌀 Zapanuj nad Wirami
            </button>
            
            <button 
              onClick={() => setCurrentScreen('puzzle')} 
              className="bg-blue-900 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition hover:-translate-y-1 text-lg w-64"
            >
              🧩 Morskie Puzzle
            </button>
            
            <button 
              onClick={() => setCurrentScreen('quiz')} 
              className="bg-blue-900 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition hover:-translate-y-1 text-lg w-64"
            >
              ❓ Quiz Oceaniczny
            </button>

            <button 
              onClick={() => setCurrentScreen('scoreboard')} 
              className="mt-8 bg-yellow-400 hover:bg-yellow-300 text-blue-900 border-4 border-blue-900 font-extrabold py-3 px-8 rounded-full shadow-lg transform transition hover:-translate-y-1 text-xl"
            >
              🏆 HALL OF FAME 🏆
            </button>
          </div>
        );

      // Zastępcze ekrany - zbudujemy je w następnych krokach!
      case 'wiry':
        return <Wiry goBack={() => setCurrentScreen('menu')} />;
      case 'puzzle':
        return <Puzzle goBack={() => setCurrentScreen('menu')} />;
      case 'quiz':
        return <Quiz goBack={() => setCurrentScreen('menu')} />;
      case 'scoreboard':
        return (
          <div className="bg-gray-900 p-8 rounded-2xl border-4 border-gray-700">
            <h2 className="text-3xl text-fuchsia-500 font-mono mb-4">=== HALL OF FAME ===</h2>
            <p className="text-green-400 font-mono mb-8">NO DATA...</p>
            <button onClick={() => setCurrentScreen('menu')} className="border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-bold py-2 px-6 font-mono transition">WRÓĆ DO MENU</button>
          </div>
        );
    }
  };

  return (
    // Główny kontener - zastępuje stare body z CSS
    <div className="min-h-screen bg-gradient-to-b from-sky-300 via-cyan-400 to-orange-200 flex items-center justify-center p-4 font-sans">
      <div className="bg-white/95 w-full max-w-3xl p-8 md:p-12 rounded-3xl border-8 border-blue-900 shadow-2xl text-center">
        {renderScreen()}
      </div>
    </div>
  )
}

export default App