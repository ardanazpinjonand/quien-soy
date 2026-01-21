
import React, { useState, useCallback, useEffect } from 'react';
import { GamePhase, Player, ACCENTS } from './types';
import { GAME_CATEGORIES, BURLAS, HALAGOS, INTRO_PHRASES, BAR_ITEMS } from './constants';
import BarReceipt from './components/BarReceipt';
import GoldenBuzzer from './components/GoldenBuzzer';

const App: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>(GamePhase.INTRO);
  const [players, setPlayers] = useState<Player[]>([
    { id: 1, name: 'Jugador 1', word: '', category: '', score: 0, revealed: false },
    { id: 2, name: 'Jugador 2', word: '', category: '', score: 0, revealed: false },
  ]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [modoPueblo, setModoPueblo] = useState(false);
  const [currentRevealIndex, setCurrentRevealIndex] = useState(0);
  const [currentTurnPlayerIndex, setCurrentTurnPlayerIndex] = useState<number | null>(null);
  const [currentAccent, setCurrentAccent] = useState('');
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [gameMessage, setGameMessage] = useState('');
  const [showGameMessage, setShowGameMessage] = useState(false);
  const [lastActionMessage, setLastActionMessage] = useState<{ text: string, type: 'praise' | 'insult' } | null>(null);
  const [selectingPlayerId, setSelectingPlayerId] = useState<number | null>(null);
  const [buzzerPressed, setBuzzerPressed] = useState(false);

  const resetToHome = () => {
    setPhase(GamePhase.INTRO);
    setPlayers([
      { id: 1, name: 'Jugador 1', word: '', category: '', score: 0, revealed: false },
      { id: 2, name: 'Jugador 2', word: '', category: '', score: 0, revealed: false },
    ]);
    setSelectedCategories([]);
    setModoPueblo(false);
    setCurrentRevealIndex(0);
    setCurrentTurnPlayerIndex(null);
    setLastActionMessage(null);
    setShowExitConfirm(false);
    setBuzzerPressed(false);
    setShowGameMessage(false);
  };

  const addPlayer = () => {
    if (players.length < 4) {
      setPlayers([...players, { 
        id: players.length + 1, 
        name: `Jugador ${players.length + 1}`, 
        word: '', 
        category: '', 
        score: 0, 
        revealed: false 
      }]);
    }
  };

  const removePlayer = () => {
    if (players.length > 2) {
      setPlayers(players.slice(0, -1));
    }
  };

  const updatePlayerName = (id: number, name: string) => {
    // Limit name length to 12 characters to prevent UI breaking
    if (name.length <= 12) {
      setPlayers(players.map(p => p.id === id ? { ...p, name } : p));
    }
  };

  const toggleCategory = (catName: string) => {
    if (selectedCategories.includes(catName)) {
      setSelectedCategories(selectedCategories.filter(c => c !== catName));
    } else {
      setSelectedCategories([...selectedCategories, catName]);
    }
  };

  const assignNewWords = (existingPlayers: Player[]) => {
    return existingPlayers.map(player => {
      const catIndex = Math.floor(Math.random() * selectedCategories.length);
      const categoryName = selectedCategories[catIndex];
      const categoryObj = GAME_CATEGORIES.find(c => c.name === categoryName)!;
      const wordIndex = Math.floor(Math.random() * categoryObj.words.length);
      return { 
        ...player, 
        word: categoryObj.words[wordIndex],
        category: categoryName,
        revealed: false 
      };
    });
  };

  const startRevealPhase = () => {
    if (selectedCategories.length === 0) {
      alert("¡Oye picha, selecciona al menos una categoría!");
      return;
    }
    setPlayers(assignNewWords(players));
    setCurrentRevealIndex(0);
    setPhase(GamePhase.REVEAL);
  };

  const finishReveal = () => {
    const randomIndex = Math.floor(Math.random() * players.length);
    setCurrentTurnPlayerIndex(randomIndex);
    const phrases = INTRO_PHRASES(players[randomIndex].name);
    setGameMessage(phrases[Math.floor(Math.random() * phrases.length)]);
    setShowGameMessage(true);
    if (modoPueblo) {
      setCurrentAccent(ACCENTS[Math.floor(Math.random() * ACCENTS.length)]);
    }
    setBuzzerPressed(false);
    setPhase(GamePhase.MAIN_GAME);
  };

  const handleRevealNext = () => {
    if (currentRevealIndex < players.length - 1) {
      setCurrentRevealIndex(currentRevealIndex + 1);
    } else {
      finishReveal();
    }
  };

  const handleBuzzerClick = () => {
    setBuzzerPressed(true);
    setSelectingPlayerId(null);
    setLastActionMessage(null);
    setShowGameMessage(false); 
  };

  const handlePlayerSelect = (pId: number) => {
    setSelectingPlayerId(pId);
  };

  const handleRoundResult = (success: boolean) => {
    if (selectingPlayerId === null) return;

    // Scoring logic: 
    // 1st correct gets 4 points
    // 2nd correct gets 3 points
    // 3rd correct gets 2 points
    // 4th correct gets 1 point
    const revealedAlreadyCount = players.filter(p => p.revealed).length;
    const roundPoints = players.length - revealedAlreadyCount;

    setPlayers(prev => prev.map(p => {
      if (p.id === selectingPlayerId) {
        return { 
          ...p, 
          score: success ? p.score + roundPoints : p.score, 
          revealed: true 
        };
      }
      return p;
    }));

    const msg = success 
      ? HALAGOS[Math.floor(Math.random() * HALAGOS.length)]
      : BURLAS[Math.floor(Math.random() * BURLAS.length)];
    
    setLastActionMessage({ text: msg, type: success ? 'praise' : 'insult' });
    setSelectingPlayerId(null);

    setTimeout(() => {
      setLastActionMessage(null);
      setBuzzerPressed(false);
    }, 2500);
  };

  useEffect(() => {
    if (phase === GamePhase.MAIN_GAME && players.every(p => p.revealed)) {
      setTimeout(() => setPhase(GamePhase.PODIUM), 1500);
    }
  }, [players, phase]);

  const ExitConfirmation = () => (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 text-center">
      <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full border-4 border-yellow-500">
        <h2 className="text-2xl font-black mb-6 text-slate-800 uppercase tracking-tight">¿Seguro que quieres abandonar, fiera?</h2>
        <div className="flex gap-4">
          <button onClick={() => setShowExitConfirm(false)} className="flex-1 bg-gray-200 py-4 rounded-xl font-black hover:bg-gray-300 transition">CANCELAR</button>
          <button onClick={resetToHome} className="flex-1 bg-red-600 text-white py-4 rounded-xl font-black hover:bg-red-700 transition shadow-lg">SÍ, SALIR</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative flex flex-col bg-red-50 text-slate-900 overflow-x-hidden">
      <div className="absolute top-0 left-0 w-full h-2 bg-yellow-400"></div>
      <div className="absolute top-2 left-0 w-full h-2 bg-red-600"></div>

      {phase !== GamePhase.INTRO && (
        <button onClick={() => setShowExitConfirm(true)} className="absolute top-6 left-6 z-40 bg-white/90 backdrop-blur border-2 border-red-600 text-red-600 p-3 px-6 rounded-full font-black shadow-xl hover:bg-red-600 hover:text-white transition transform hover:scale-105 active:scale-95">SALIR</button>
      )}

      {showExitConfirm && <ExitConfirmation />}

      {/* INTRO PHASE */}
      {phase === GamePhase.INTRO && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="mb-8 p-12 bg-white rounded-[3rem] shadow-2xl border-b-[12px] border-yellow-500 relative transform -rotate-2">
            <h2 className="font-impact text-6xl text-red-600 mb-2">BAR DE TAPAS</h2>
            <p className="text-xl font-comic text-gray-500 tracking-tight">¡Donde el cuñadismo es ley!</p>
            <div className="absolute -top-4 -right-4 bg-red-600 text-white px-4 py-1 rounded-full font-bold rotate-12 shadow-lg">ABIERTOS</div>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-impact text-red-600 drop-shadow-2xl mb-2 tracking-tight">¿QUIÉN SOY?</h1>
          <p className="text-xl font-comic text-yellow-600 mb-8">Edición Española</p>
          
          <div className="bg-white/90 p-4 px-8 rounded-full shadow-md border-b-4 border-yellow-500 mb-12 transform rotate-1">
             <p className="italic text-gray-500 font-black">Hecho por Jon Ander Ardanaz</p>
          </div>
          
          <button onClick={() => setPhase(GamePhase.SETUP)} className="bg-red-600 text-white text-4xl font-impact px-16 py-6 rounded-full shadow-[0_12px_0_rgb(153,27,27)] hover:translate-y-2 hover:shadow-[0_6px_0_rgb(153,27,27)] transition-all active:translate-y-4 active:shadow-none animate-bounce">VAMOS ALLÁ</button>
        </div>
      )}

      {/* SETUP PHASE */}
      {phase === GamePhase.SETUP && (
        <div className="flex-1 flex flex-col p-6 max-w-2xl mx-auto w-full pt-20">
          <h2 className="text-4xl font-impact text-red-600 mb-8 text-center drop-shadow-sm">CONFIGURA LA RONDA</h2>
          
          <div className="bg-white p-8 rounded-3xl shadow-xl mb-6 border-b-8 border-yellow-500">
            <h3 className="font-black text-xl mb-6 uppercase tracking-wider text-slate-700 flex items-center gap-2">
               <span>👥</span> Jugadores (2-4)
            </h3>
            <div className="flex items-center gap-6 mb-8">
              <button onClick={removePlayer} className="w-16 h-16 bg-gray-100 rounded-2xl hover:bg-gray-200 transition font-black text-3xl shadow-inner">-</button>
              <div className="flex-1 text-center font-black text-5xl text-red-600">{players.length}</div>
              <button onClick={addPlayer} className="w-16 h-16 bg-gray-100 rounded-2xl hover:bg-gray-200 transition font-black text-3xl shadow-inner">+</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {players.map(p => (
                <div key={p.id} className="relative">
                  <input 
                    type="text" 
                    value={p.name} 
                    maxLength={12} 
                    onChange={(e) => updatePlayerName(p.id, e.target.value)} 
                    className="w-full bg-red-50 p-4 rounded-xl border-4 border-red-100 focus:border-red-500 outline-none font-black text-slate-700 transition-all shadow-inner" 
                    placeholder={`Jugador ${p.id}`} 
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-red-300 font-black">{p.name.length}/12</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-xl mb-6 border-b-8 border-yellow-500">
            <h3 className="font-black text-xl mb-6 uppercase tracking-wider text-slate-700">🗂️ Categorías</h3>
            <div className="flex flex-wrap gap-2">
              {GAME_CATEGORIES.map(cat => (
                <button 
                  key={cat.name} 
                  onClick={() => toggleCategory(cat.name)} 
                  className={`px-5 py-2.5 rounded-full border-4 transition-all font-black text-sm ${
                    selectedCategories.includes(cat.name) 
                      ? 'bg-red-600 border-red-600 text-white shadow-md transform scale-105' 
                      : 'bg-white border-gray-100 text-gray-500 hover:border-red-300'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-xl mb-10 border-b-8 border-yellow-500 flex items-center justify-between">
            <div>
              <h3 className="font-black text-xl uppercase tracking-wider text-slate-700">🏡 Modo Pueblo</h3>
              <p className="text-sm text-gray-500 italic font-bold">Acentos regionales al azar</p>
            </div>
            <button 
              onClick={() => setModoPueblo(!modoPueblo)} 
              className={`w-20 h-10 rounded-full relative transition-colors shadow-inner ${modoPueblo ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-1 w-8 h-8 bg-white rounded-full transition-all shadow-md ${modoPueblo ? 'left-11' : 'left-1'}`}></div>
            </button>
          </div>

          <button onClick={startRevealPhase} className="bg-yellow-400 text-red-900 text-3xl font-impact py-6 rounded-2xl shadow-[0_12px_0_rgb(180,130,10)] hover:translate-y-2 hover:shadow-[0_6px_0_rgb(180,130,10)] transition-all active:translate-y-4 active:shadow-none mb-12 uppercase tracking-tighter">
            COMENZAR JUEGO
          </button>
        </div>
      )}

      {/* REVEAL PHASE */}
      {phase === GamePhase.REVEAL && (
        <div className="flex-1 flex flex-col p-6 items-center pt-24">
          <div className="w-full flex justify-end items-center mb-10 max-w-4xl px-10">
             <button onClick={handleRevealNext} className="bg-green-600 text-white px-12 py-4 rounded-full font-black shadow-2xl hover:bg-green-700 transition transform hover:scale-110 active:scale-95 text-xl tracking-tighter ring-4 ring-green-100">CONTINUAR ➔</button>
          </div>
          <div className="mb-6 text-center">
             <h2 className="text-3xl font-black text-red-600 uppercase tracking-tighter">Turno de: <span className="text-yellow-500">{players[currentRevealIndex].name}</span></h2>
             <p className="text-gray-500 italic font-black text-lg">¡Desliza el datáfono de tus rivales!</p>
          </div>
          <div className="flex flex-wrap gap-10 justify-center w-full max-h-[70vh] overflow-y-auto pb-24 pt-4 px-4 scroll-smooth">
            {players.map((p, idx) => (
              <BarReceipt 
                key={p.id} 
                playerName={p.name} 
                word={p.word} 
                isHidden={idx === currentRevealIndex} 
                items={BAR_ITEMS}
              />
            ))}
          </div>
        </div>
      )}

      {/* MAIN GAME PHASE */}
      {phase === GamePhase.MAIN_GAME && (
        <div className="flex-1 flex flex-col p-6 items-center justify-center pt-24 relative">
          <div className="text-center mb-12 min-h-[140px] flex flex-col items-center justify-center">
            {showGameMessage && (
              <div className="animate-in fade-in zoom-in duration-500">
                <h2 className="text-5xl font-impact text-red-600 mb-4 uppercase tracking-wider drop-shadow-md">{gameMessage}</h2>
                {modoPueblo && currentAccent && (
                  <div className="inline-block bg-yellow-400 px-10 py-4 rounded-full font-black text-red-900 border-4 border-red-600 shadow-2xl scale-110 transform -rotate-1">
                    ACENTO: {currentAccent.toUpperCase()}
                  </div>
                )}
              </div>
            )}
          </div>

          {lastActionMessage ? (
            <div className={`p-12 rounded-[3.5rem] border-[12px] text-center max-w-lg animate-bounce font-black text-4xl shadow-2xl ${lastActionMessage.type === 'praise' ? 'bg-green-50 border-green-600 text-green-700' : 'bg-red-50 border-red-600 text-red-700'}`}>
              {lastActionMessage.text}
            </div>
          ) : !buzzerPressed ? (
            <GoldenBuzzer onClick={handleBuzzerClick} />
          ) : !selectingPlayerId ? (
            <div className="w-full max-w-xl bg-white p-10 rounded-[4rem] shadow-2xl border-b-[12px] border-yellow-500 animate-in slide-in-from-bottom-10">
               <h3 className="text-center font-impact text-4xl mb-10 text-red-600 tracking-tighter">¿QUIÉN LA SUELTA?</h3>
               <div className="grid grid-cols-2 gap-6">
                 {players.map(p => (
                   <button 
                    key={p.id} 
                    disabled={p.revealed} 
                    onClick={() => handlePlayerSelect(p.id)} 
                    className={`p-10 rounded-[2.5rem] border-4 font-black text-2xl transition-all ${
                      p.revealed 
                        ? 'bg-gray-100 border-gray-200 text-gray-300 grayscale cursor-not-allowed opacity-50' 
                        : 'bg-white border-red-500 text-red-600 shadow-[0_10px_0_rgb(185,28,28)] hover:bg-red-50 active:translate-y-2 active:shadow-none transform hover:scale-102'
                    }`}
                   >
                     {p.name}
                   </button>
                 ))}
               </div>
               <button onClick={() => setBuzzerPressed(false)} className="mt-12 w-full text-gray-400 font-black hover:text-red-500 transition-colors uppercase tracking-[0.2em] text-xs">↩ volver al pulsador</button>
            </div>
          ) : (
            <div className="w-full max-w-lg bg-white p-12 rounded-[5rem] shadow-2xl border-b-[16px] border-yellow-500 text-center animate-in zoom-in duration-300">
              <h3 className="text-4xl font-black mb-2 text-red-600 uppercase tracking-tighter leading-none">{players.find(p => p.id === selectingPlayerId)?.name}</h3>
              <div className="text-6xl md:text-7xl font-impact my-12 text-slate-800 tracking-wide uppercase bg-slate-100 p-14 rounded-[3rem] border-4 border-slate-200 shadow-inner flex items-center justify-center min-h-[200px] break-words">
                {players.find(p => p.id === selectingPlayerId)?.word}
              </div>
              <div className="flex gap-10">
                <button onClick={() => handleRoundResult(false)} className="flex-1 aspect-square bg-red-100 border-[8px] border-red-600 rounded-[3rem] flex items-center justify-center hover:bg-red-200 transition-transform active:scale-90 shadow-xl"><span className="text-8xl">❌</span></button>
                <button onClick={() => handleRoundResult(true)} className="flex-1 aspect-square bg-green-100 border-[8px] border-green-600 rounded-[3rem] flex items-center justify-center hover:bg-green-200 transition-transform active:scale-90 shadow-xl"><span className="text-8xl">✅</span></button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PODIUM PHASE */}
      {phase === GamePhase.PODIUM && (
        <div className="flex-1 flex flex-col p-6 items-center justify-center pt-24">
          <h2 className="text-7xl font-impact text-red-600 mb-16 tracking-[0.2em] drop-shadow-2xl">PODIUM</h2>
          <div className="flex items-end justify-center gap-6 mb-24 h-[400px] w-full max-w-3xl px-6">
            {[...players].sort((a,b) => b.score - a.score).map((p, idx) => {
              const height = idx === 0 ? 'h-full' : idx === 1 ? 'h-[85%]' : idx === 2 ? 'h-[70%]' : 'h-[55%]';
              const color = idx === 0 ? 'bg-yellow-400' : idx === 1 ? 'bg-slate-300' : idx === 2 ? 'bg-amber-600' : 'bg-red-300';
              const rankLabels = ["PRIMERO", "SEGUNDO", "TERCERO", "CUARTO"];
              return (
                <div key={p.id} className="flex flex-col items-center flex-1 transition-all duration-1000 animate-in slide-in-from-bottom-20">
                  <div className="mb-6 font-black text-center text-xl uppercase truncate w-full px-2 text-slate-700 tracking-tight">{p.name}</div>
                  <div className={`${height} ${color} w-full rounded-t-[3rem] border-x-4 border-t-4 border-black/10 flex flex-col items-center justify-start pt-10 shadow-2xl relative overflow-hidden ring-4 ring-white/20`}>
                    <div className="absolute top-0 w-full h-1/2 bg-white/30 -skew-y-12 translate-y-[-30%]"></div>
                    <span className="text-2xl font-impact relative z-10 leading-none text-black/60 mb-2">{rankLabels[idx]}</span>
                    <span className="text-8xl font-impact relative z-10 leading-none">{idx + 1}</span>
                    <div className="mt-6 bg-black/10 px-5 py-2 rounded-full relative z-10">
                      <span className="text-lg font-black">{p.score} <span className="text-xs">PTOS</span></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex flex-col gap-8 w-full max-w-sm pb-12">
            <button 
              onClick={() => {
                const nextPlayers = assignNewWords(players.map(p => ({ ...p, revealed: false })));
                setPlayers(nextPlayers);
                setCurrentRevealIndex(0);
                setShowGameMessage(false);
                setPhase(GamePhase.REVEAL);
              }} 
              className="bg-red-600 text-white py-8 rounded-3xl font-impact text-4xl shadow-[0_12px_0_rgb(153,27,27)] active:translate-y-3 active:shadow-none transition-all uppercase tracking-widest hover:brightness-110"
            >
              SEGUIR JUGANDO
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
