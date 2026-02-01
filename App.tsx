
import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameView from './components/GameView';
import { GameStatus, GameSettings, Commentary, Personality } from './types';
import { THEME_COLORS, MATCH_DURATION } from './constants';
import { getCommentary } from './services/geminiService';

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.START);
  const [scores, setScores] = useState({ player: 0, ai: 0 });
  const [timeLeft, setTimeLeft] = useState(MATCH_DURATION);
  const [settings, setSettings] = useState<GameSettings>({
    difficulty: 'medium',
    color: THEME_COLORS.cyan,
    mode: '1P',
    personality: 'sarcastic'
  });
  const [commentaries, setCommentaries] = useState<Commentary[]>([]);
  const rallyCount = useRef(0);

  const addCommentary = useCallback(async (event: string, isGameOver: boolean = false) => {
    const text = await getCommentary(event, scores.player, scores.ai, settings.personality, isGameOver);
    setCommentaries(prev => [{ text, timestamp: Date.now() }, ...prev].slice(0, 5));
  }, [scores, settings.personality]);

  useEffect(() => {
    if (status === GameStatus.GAMEOVER) {
      addCommentary("Game over summary", true);
    }
  }, [status === GameStatus.GAMEOVER, addCommentary]);

  useEffect(() => {
    let timer: number;
    if (status === GameStatus.PLAYING && timeLeft > 0) {
      timer = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setStatus(GameStatus.GAMEOVER);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [status, timeLeft]);

  const handleScore = useCallback((winner: 'player' | 'ai') => {
    setScores(prev => {
      const newScores = { ...prev, [winner]: prev[winner] + 1 };
      const event = winner === 'player' ? "Player scored!" : "Opponent scored!";
      
      getCommentary(event, newScores.player, newScores.ai, settings.personality, false).then(text => {
        setCommentaries(prevC => [{ text, timestamp: Date.now() }, ...prevC].slice(0, 5));
      });

      return newScores;
    });
  }, [settings.personality]);

  const handleRally = useCallback((count: number) => {
    rallyCount.current = count;
    if (count > 0 && count % 5 === 0) {
      addCommentary(`Massive rally! ${count} consecutive hits.`);
    }
  }, [addCommentary]);

  const togglePlay = () => {
    if (status === GameStatus.GAMEOVER) {
      resetGame();
      setStatus(GameStatus.PLAYING);
      return;
    }
    setStatus(prev => prev === GameStatus.PLAYING ? GameStatus.PAUSED : GameStatus.PLAYING);
    if (status === GameStatus.START) {
      addCommentary(`Game start! ${settings.mode} battle engaged.`);
    }
  };

  const resetGame = () => {
    setScores({ player: 0, ai: 0 });
    setTimeLeft(MATCH_DURATION);
    setStatus(GameStatus.START);
    setCommentaries([]);
    rallyCount.current = 0;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col overflow-x-hidden">
      {/* Header Area */}
      <header className="bg-slate-900/80 border-b border-slate-800 p-3 md:p-4 sticky top-0 z-20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center md:items-start">
            <h1 className="text-xl md:text-2xl font-orbitron font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
              NEON PADDLE <span className="text-[9px] align-top px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 ml-1">AI</span>
            </h1>
          </div>

          {/* Quick Stats/Timer Area */}
          <div className="flex items-center gap-6 md:gap-10">
            <div className="text-center">
              <div className="text-[9px] uppercase tracking-widest text-slate-500 mb-0.5">Time</div>
              <div className={`text-2xl font-orbitron font-bold w-16 ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
            </div>

            <div className="flex items-center gap-4 bg-slate-950/50 px-4 py-1.5 rounded-xl border border-slate-800">
              <div className="text-center">
                <p className="text-[9px] uppercase tracking-widest text-slate-500">P1</p>
                <p className="text-2xl font-orbitron font-bold text-cyan-400">{scores.player}</p>
              </div>
              <div className="text-lg font-orbitron text-slate-700">:</div>
              <div className="text-center">
                <p className="text-[9px] uppercase tracking-widest text-slate-500">{settings.mode === '1P' ? 'AI' : 'P2'}</p>
                <p className="text-2xl font-orbitron font-bold text-pink-500">{scores.ai}</p>
              </div>
            </div>
          </div>

          {/* Main Action Buttons in Header for Visibility */}
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className={`px-6 py-2 rounded-lg font-bold text-xs tracking-widest transition-all ${
                status === GameStatus.PLAYING 
                ? 'bg-slate-700 text-slate-300' 
                : 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(8,145,178,0.4)] hover:scale-105'
              }`}
            >
              {status === GameStatus.PLAYING ? 'PAUSE' : status === GameStatus.GAMEOVER ? 'REPLAY' : 'START'}
            </button>
            <button
              onClick={resetGame}
              className="p-2 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:text-white transition-all"
              title="Reset Match"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-2 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Settings Column - Visible on desktop, wrap on mobile */}
        <aside className="lg:col-span-3 flex flex-col gap-4 order-2 lg:order-1">
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4 space-y-4">
            <h3 className="text-[10px] font-orbitron uppercase tracking-widest text-slate-500 border-b border-slate-800 pb-2">Configuration</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Game Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setSettings(s => ({...s, mode: '1P'}))}
                    className={`px-2 py-1.5 text-[10px] font-bold rounded-md border ${settings.mode === '1P' ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                  >1P vs AI</button>
                  <button 
                    onClick={() => setSettings(s => ({...s, mode: '2P'}))}
                    className={`px-2 py-1.5 text-[10px] font-bold rounded-md border ${settings.mode === '2P' ? 'bg-pink-600 border-pink-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                  >LOCAL 2P</button>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-1">AI Personality</label>
                <select 
                  className="w-full bg-slate-800 text-[11px] text-slate-200 px-3 py-1.5 rounded-md border border-slate-700 outline-none focus:ring-1 focus:ring-cyan-500"
                  value={settings.personality}
                  onChange={(e) => setSettings(s => ({ ...s, personality: e.target.value as Personality }))}
                >
                  <option value="sarcastic">Sarcastic</option>
                  <option value="enthusiastic">Enthusiastic</option>
                  <option value="neutral">Neutral Analyst</option>
                </select>
              </div>

              {settings.mode === '1P' && (
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">AI Difficulty</label>
                  <select 
                    className="w-full bg-slate-800 text-[11px] text-slate-200 px-3 py-1.5 rounded-md border border-slate-700 outline-none focus:ring-1 focus:ring-cyan-500"
                    value={settings.difficulty}
                    onChange={(e) => setSettings(s => ({ ...s, difficulty: e.target.value as any }))}
                  >
                    <option value="easy">Beginner</option>
                    <option value="medium">Pro</option>
                    <option value="hard">Insane</option>
                  </select>
                </div>
              )}

              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Theme Color</label>
                <div className="flex gap-2">
                  {Object.entries(THEME_COLORS).map(([name, val]) => (
                    <button
                      key={name}
                      onClick={() => setSettings(s => ({ ...s, color: val }))}
                      className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${settings.color === val ? 'border-white' : 'border-transparent'}`}
                      style={{ backgroundColor: val }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tips Section */}
          <div className="hidden lg:block bg-slate-900/30 rounded-xl border border-slate-800/50 p-4">
             <h4 className="text-[10px] text-slate-600 uppercase tracking-widest mb-2">Controls</h4>
             <ul className="text-[10px] text-slate-500 space-y-1">
               <li>• Mouse/Touch: Move Paddle</li>
               <li>• P1: Left Side of Screen</li>
               <li>• P2: Right Side of Screen</li>
               <li>• Space: Pause Match</li>
             </ul>
          </div>
        </aside>

        {/* Game Column */}
        <div className="lg:col-span-6 flex flex-col gap-4 order-1 lg:order-2">
          <GameView 
            status={status} 
            settings={settings} 
            onScore={handleScore} 
            onRally={handleRally}
          />
        </div>

        {/* Commentary Column */}
        <aside className="lg:col-span-3 h-full flex flex-col order-3">
          <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-4 h-full min-h-[250px] lg:min-h-0 flex flex-col">
            <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <h3 className="text-[10px] font-orbitron uppercase tracking-widest text-slate-400">AI Sidekick</h3>
            </div>
            
            <div className="flex-1 space-y-2 overflow-y-auto max-h-[300px] lg:max-h-none pr-1 custom-scrollbar">
              {commentaries.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <p className="text-[10px] italic">Ready for play-by-play analysis...</p>
                </div>
              ) : (
                commentaries.map((c, i) => (
                  <div 
                    key={c.timestamp} 
                    className={`p-2.5 rounded-lg border text-xs leading-snug transition-all duration-300 ${
                      i === 0 
                      ? 'bg-cyan-950/20 border-cyan-800/50 text-cyan-100 shadow-[0_0_10px_rgba(8,145,178,0.1)]' 
                      : 'bg-slate-800/10 border-slate-800/50 text-slate-500'
                    }`}
                  >
                    “{c.text}”
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </main>

      {/* Simplified Mobile Footer */}
      <footer className="lg:hidden p-4 border-t border-slate-900 bg-slate-950 text-center">
         <p className="text-[9px] text-slate-700 uppercase tracking-widest leading-loose">
           P1: Tap Left • P2: Tap Right • Pause to Change Settings
         </p>
      </footer>

      <KeyboardShortcuts onToggle={togglePlay} onReset={resetGame} />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
      `}</style>
    </div>
  );
};

const KeyboardShortcuts: React.FC<{ onToggle: () => void, onReset: () => void }> = ({ onToggle, onReset }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); onToggle(); }
      if (e.code === 'KeyR') onReset();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggle, onReset]);
  return null;
};

export default App;
