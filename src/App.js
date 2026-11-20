import { useEffect, useMemo, useState } from 'react';
import Board3D from './Board3D';
import { applyMove, BOARDS, chooseAiMove, createGame, getLegalMoves, getWinner } from './gameLogic';
import './App.css';

const copy = {
  fr: {
    navGame: 'La partie', navRules: 'Les règles', eyebrow: 'UN HÉRITAGE MALAGASY',
    headline: 'Un jeu ancien.', headlineAccent: 'Une stratégie vivante.',
    intro: 'Entrez dans l’univers du Fanorona, un jeu de réflexion né à Madagascar. Prenez le temps de penser, le plaisir de surprendre.',
    play: 'Jouer maintenant', tradition: 'Transmis de génération en génération',
    gameTitle: 'À vous de jouer', gameIntro: 'Choisissez votre plateau et lancez la partie.',
    vsAi: 'Contre l’IA', vsPeople: 'À deux joueurs', easy: 'Facile', intermediate: 'Intermédiaire', hard: 'Difficile',
    difficulty: 'Niveau', variant: 'Plateau', newGame: 'Nouvelle partie', yourTurn: 'À vous de jouer',
    aiTurn: 'L’IA réfléchit…', playerTurn: 'Au tour du joueur', white: 'Blancs', black: 'Noirs',
    approach: 'Approche', withdrawal: 'Retrait', chooseCapture: 'Choisissez votre prise',
    mandatoryCapture: 'Une prise est possible : vous devez capturer.', chain: 'Continuez avec le même pion.',
    placePiece: 'Placez un pion sur un point libre.',
    winner: 'Victoire', tie: 'Partie terminée', pieces: 'pions', captured: 'Capturés',
    aiVictory: 'Vous avez gagné contre l’IA !', aiDefeat: 'Vous avez perdu contre l’IA.',
    aiWinnerColor: 'Les {color} remportent la partie.', localWinner: 'Les {color} remportent la partie !',
    rulesTitle: 'L’art de la prise', rulesSubtitle: 'Quelques règles pour entrer dans la danse.',
    rule1Title: 'Avancer sur les lignes', rule1: 'Déplacez un pion d’un point vers un point voisin libre, en suivant les lignes tracées. Les diagonales ne sont présentes que sur les croisements du plateau.',
    rule2Title: 'Prendre par approche ou retrait', rule2: 'En arrivant au point voisin, capturez les pions adverses alignés juste devant vous (approche), ou juste derrière votre point de départ (retrait). Toute la ligne contiguë est prise.',
    rule3Title: 'La prise est obligatoire', rule3: 'Si une prise est possible, vous devez en choisir une. Après une prise, le même pion continue si une autre prise est disponible ; il ne repasse pas par un point déjà visité.',
    rule4Title: 'Gagner la partie', rule4: 'Au Fanoron-telo, placez vos trois pions chacun votre tour : aligner les trois fait gagner ; sinon, la partie continue par déplacement. Dans les autres variantes, éliminez tous les pions adverses ou bloquez leurs déplacements.',
    rulesNote: 'Les règles de prise s’inspirent du Fanorona traditionnel. Certaines variantes régionales peuvent différer.',
    footer: 'Né à Madagascar, joué partout.', footerSmall: 'Fait avec fihavanana · partage et lien entre les personnes',
    languages: 'Langue', selectBoard: 'Sélectionner le plateau', gameBoard: 'Plateau de jeu',
  },
  mg: {
    navGame: 'Hilalao', navRules: 'Fitsipika', eyebrow: 'LOVANTSOFINA MALAGASY',
    headline: 'Lalao fahiny.', headlineAccent: 'Paikady velona.',
    intro: 'Midira ao anatin’ny tontolon’ny Fanorona, lalao paikady nipoitra teto Madagasikara. Makà fotoana hieritreretana, ary ankafizo ny hafetsena.',
    play: 'Hilalao izao', tradition: 'Lalao nifandovana hatramin’ny ela',
    gameTitle: 'Anjaranao izao', gameIntro: 'Safidio ny solaitrabe ary atombohy ny lalao.',
    vsAi: 'Hilalao amin’ny IA', vsPeople: 'Mpilalao roa', easy: 'Mora', intermediate: 'Antonony', hard: 'Sarotra',
    difficulty: 'Haavo', variant: 'Solaitrabe', newGame: 'Lalao vaovao', yourTurn: 'Anjaranao izao',
    aiTurn: 'Mieritreritra ny IA…', playerTurn: 'Anjaran’ny mpilalao', white: 'Fotsy', black: 'Mainty',
    approach: 'Fanatonana', withdrawal: 'Fialana', chooseCapture: 'Fidio ny fomba fakana',
    mandatoryCapture: 'Misy azo alaina : tsy maintsy maka ianao.', chain: 'Tohizo amin’io vato io ihany.',
    placePiece: 'Apetraho eo amin’ny teboka malalaka ny vato iray.',
    winner: 'Mpandresy', tie: 'Tapitra ny lalao', pieces: 'vato', captured: 'Voafaka',
    aiVictory: 'Nandresy ny IA ianao !', aiDefeat: 'Resin’ny IA ianao.',
    aiWinnerColor: 'Ny {color} no nandresy.', localWinner: 'Nandresy ny {color} !',
    rulesTitle: 'Ny fomba fakana', rulesSubtitle: 'Fitsipika vitsivitsy hanombohana.',
    rule1Title: 'Mandroso manaraka ny tsipika', rule1: 'Afindrao amin’ny teboka malalaka mifanila aminy ny vato iray, manaraka ny tsipika. Eo amin’ny fihaonan’ny tsipika ihany no misy diagonal.',
    rule2Title: 'Maka amin’ny fanatonana na fialana', rule2: 'Rehefa tonga eo amin’ny teboka mifanila ianao, alao ireo vato fahavalo mifanesy eo alohanao (fanatonana), na ao ambadiky ny toerana niainganao (fialana).',
    rule3Title: 'Tsy maintsy maka', rule3: 'Raha misy azo alaina dia tsy maintsy misafidy iray ianao. Raha mbola misy fakana hafa, tohizo amin’io vato io ihany ; aza miverina amin’ny teboka efa nolalovana.',
    rule4Title: 'Fandresena', rule4: 'Amin’ny Fanorona-telo, mifandimby mametraka vato telo ny mpilalao tsirairay : izay mampilahatra azy telo no mandresy ; raha tsy izany dia mitohy amin’ny famindrana vato ny lalao. Amin’ny karazany hafa, esory ny vato fahavalo rehetra na sakanana tsy hihetsika.',
    rulesNote: 'Natao hanakaiky ny Fanorona nentim-paharazana ireo fitsipika ireo. Mety hiova arakaraka ny faritra ny fomba filalao.',
    footer: 'Teraka teto Madagasikara, lalaovina eran-tany.', footerSmall: 'Natao amim-pihavanana · fifampizarana sy fifandraisana',
    languages: 'Fiteny', selectBoard: 'Hisafidy solaitrabe', gameBoard: 'Solaitrabe',
  },
  en: {
    navGame: 'Play', navRules: 'How to play', eyebrow: 'A MALAGASY HERITAGE',
    headline: 'An ancient game.', headlineAccent: 'A living strategy.',
    intro: 'Step into the world of Fanorona, a strategy game born in Madagascar. Take your time, think ahead, and enjoy the art of the unexpected.',
    play: 'Play now', tradition: 'Passed down through generations',
    gameTitle: 'Your move', gameIntro: 'Choose a board and start a game.',
    vsAi: 'Play the AI', vsPeople: 'Two players', easy: 'Easy', intermediate: 'Intermediate', hard: 'Hard',
    difficulty: 'Difficulty', variant: 'Board', newGame: 'New game', yourTurn: 'Your turn',
    aiTurn: 'AI is thinking…', playerTurn: 'Player’s turn', white: 'White', black: 'Black',
    approach: 'Approach', withdrawal: 'Withdrawal', chooseCapture: 'Choose your capture',
    mandatoryCapture: 'A capture is available — you must take it.', chain: 'Continue with the same piece.',
    placePiece: 'Place a piece on an empty point.',
    winner: 'Winner', tie: 'Game over', pieces: 'pieces', captured: 'Captured',
    aiVictory: 'You beat the AI!', aiDefeat: 'The AI won this game.',
    aiWinnerColor: '{color} win the game.', localWinner: '{color} win!',
    rulesTitle: 'The art of the capture', rulesSubtitle: 'A few rules to get you started.',
    rule1Title: 'Move along the lines', rule1: 'Move a piece to a free neighboring point along a marked line. Diagonal links only appear at marked intersections.',
    rule2Title: 'Capture by approach or withdrawal', rule2: 'On arrival, capture a contiguous line of enemy pieces immediately ahead (approach), or immediately behind your starting point (withdrawal).',
    rule3Title: 'Captures are compulsory', rule3: 'If a capture is available, you must choose one. After capturing, the same piece continues if another capture is available; it cannot revisit a point already visited.',
    rule4Title: 'Win the game', rule4: 'In Fanoron-telo, players take turns placing three pieces each: align all three to win; otherwise, continue by moving pieces. In the other variants, capture all opposing pieces or block all their moves.',
    rulesNote: 'These capture rules are based on traditional Fanorona. Some regional variations may differ.',
    footer: 'Born in Madagascar, played everywhere.', footerSmall: 'Made with fihavanana · sharing and human connection',
    languages: 'Language', selectBoard: 'Select a board', gameBoard: 'Game board',
  },
};

const variants = [
  { id: 'telo', short: 'Telo', size: '3 × 3' },
  { id: 'dimy', short: 'Dimy', size: '5 × 5' },
  { id: 'tsivy', short: 'Tsivy', size: '9 × 5' },
];

function Mark() {
  return (
    <svg viewBox="0 0 42 42" aria-hidden="true">
      <path d="M21 2 40 21 21 40 2 21 21 2Z" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="m21 9 12 12-12 12L9 21 21 9Z" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="21" cy="21" r="4" fill="currentColor" />
    </svg>
  );
}

function App() {
  const [language, setLanguage] = useState('fr');
  const [variant, setVariant] = useState('tsivy');
  const [mode, setMode] = useState('ai');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [game, setGame] = useState(() => createGame('tsivy'));
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [captureType, setCaptureType] = useState('approach');
  const [showRules, setShowRules] = useState(false);
  const t = copy[language];
  const winner = getWinner(game);
  const legalMoves = useMemo(() => getLegalMoves(game), [game]);
  const selectedMoves = useMemo(
    () => game.phase === 'placement'
      ? legalMoves
      : game.chainPiece !== null
      ? getLegalMoves(game)
      : selectedPiece === null ? [] : getLegalMoves(game, selectedPiece),
    [game, selectedPiece, legalMoves],
  );
  const highlightedTo = useMemo(
    () => [...new Set(selectedMoves.map((move) => move.to))],
    [selectedMoves],
  );
  const pieceCounts = game.board.reduce((counts, piece) => {
    if (piece) counts[piece] += 1;
    return counts;
  }, { 1: 0, 2: 0 });
  const capturedCounts = {
    1: (game.piecesPlaced?.[1] ?? BOARDS[variant].pieces) - pieceCounts[1],
    2: (game.piecesPlaced?.[2] ?? BOARDS[variant].pieces) - pieceCounts[2],
  };
  const captureOptions = selectedMoves.some((move) => move.captureType)
    ? [...new Set(selectedMoves.map((move) => move.captureType).filter(Boolean))]
    : [];
  const forcedCapture = !game.chainPiece && legalMoves.some((move) => move.captureType);
  const aiThinking = !winner && mode === 'ai' && game.turn === 2;
  const currentSide = game.turn === 1 ? t.white : t.black;
  const winnerColor = winner === 1 ? t.white : t.black;
  const resultMessage = winner
    ? mode === 'ai'
      ? winner === 1 ? t.aiVictory : t.aiDefeat
      : t.localWinner.replace('{color}', winnerColor)
    : '';
  const resultDetail = winner && mode === 'ai'
    ? t.aiWinnerColor.replace('{color}', winnerColor)
    : '';

  useEffect(() => {
    if (!aiThinking) return undefined;
    const timer = window.setTimeout(() => {
      setGame((current) => {
        const move = chooseAiMove(current, difficulty);
        return move ? applyMove(current, move) : current;
      });
    }, 420);
    return () => window.clearTimeout(timer);
  }, [aiThinking, game, difficulty]);

  const resetGame = (nextVariant = variant) => {
    setVariant(nextVariant);
    setGame(createGame(nextVariant));
    setSelectedPiece(null);
    setCaptureType('approach');
  };

  const selectMode = (nextMode) => {
    setMode(nextMode);
    setSelectedPiece(null);
    setGame(createGame(variant));
  };

  const handlePointClick = (point) => {
    if (winner || aiThinking) return;

    if (game.phase === 'placement') {
      const move = legalMoves.find((option) => option.to === point);
      if (move) setGame((current) => applyMove(current, move));
      return;
    }

    if (game.chainPiece !== null) {
      const move = legalMoves.find((option) => option.to === point);
      if (move) setGame((current) => applyMove(current, move));
      return;
    }

    if (selectedPiece !== null && highlightedTo.includes(point)) {
      const options = selectedMoves.filter((move) => move.to === point);
      const move = options.find((option) => option.captureType === captureType) || options[0];
      setGame((current) => applyMove(current, move));
      setSelectedPiece(null);
      setCaptureType('approach');
      return;
    }

    if (game.chainPiece !== null) return;
    if (game.board[point] === game.turn && getLegalMoves(game, point).length) {
      setSelectedPiece(point);
      setCaptureType('approach');
    } else {
      setSelectedPiece(null);
    }
  };

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#accueil" aria-label="Fanorona — accueil">
          <span className="brand-mark"><Mark /></span>
          <span><strong>FANORONA</strong><small>MADAGASIKARA</small></span>
        </a>
        <nav className="main-nav" aria-label="Navigation principale">
          <a href="#partie">{t.navGame}</a>
          <a href="#fitsipika">{t.navRules}</a>
        </nav>
        <label className="language-picker">
          <span className="sr-only">{t.languages}</span>
          <select value={language} onChange={(event) => setLanguage(event.target.value)} aria-label={t.languages}>
            <option value="mg">MG</option>
            <option value="fr">FR</option>
            <option value="en">EN</option>
          </select>
        </label>
      </header>

      <main>
        <section className="hero" id="accueil">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" />{t.eyebrow}</div>
            <h1>{t.headline}<br /><em>{t.headlineAccent}</em></h1>
            <p className="hero-intro">{t.intro}</p>
            <a className="primary-button" href="#partie">
              {t.play}
            </a>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="hero-orbit orbit-one" />
            <div className="hero-orbit orbit-two" />
            <div className="hero-sun" />
            <div className="hero-stamp"><Mark /><span>FANORONA<br />MADAGASIKARA</span></div>
          </div>
        </section>

        <section className="game-section" id="partie">
          <div className="section-heading">
            <div>
              <span className="section-kicker">01 / {t.navGame}</span>
              <h2>{t.gameTitle}<span className="heading-period">.</span></h2>
              <p>{t.gameIntro}</p>
            </div>
            <button type="button" className="text-button" onClick={() => resetGame()}>
              <span className="refresh-icon">↻</span>{t.newGame}
            </button>
          </div>

          <div className="game-controls">
            <div className="control-block">
              <span className="control-label">{t.variant}</span>
              <div className="segmented-control board-picker" role="group" aria-label={t.selectBoard}>
                {variants.map(({ id, short, size }) => (
                  <button
                    key={id}
                    type="button"
                    className={variant === id ? 'segment active' : 'segment'}
                    onClick={() => resetGame(id)}
                    aria-pressed={variant === id}
                  >
                    <span>{short}</span><small>{size}</small>
                  </button>
                ))}
              </div>
            </div>
            <div className="control-block mode-control">
              <span className="control-label">{t.gameTitle}</span>
              <div className="segmented-control" role="group" aria-label={t.gameTitle}>
                <button type="button" className={mode === 'ai' ? 'segment active' : 'segment'} onClick={() => selectMode('ai')} aria-pressed={mode === 'ai'}>
                  <span className="mode-icon">✳</span>{t.vsAi}
                </button>
                <button type="button" className={mode === 'local' ? 'segment active' : 'segment'} onClick={() => selectMode('local')} aria-pressed={mode === 'local'}>
                  <span className="mode-icon">◎</span>{t.vsPeople}
                </button>
              </div>
            </div>
            {mode === 'ai' && (
              <div className="control-block difficulty-control">
                <label className="control-label" htmlFor="difficulty">{t.difficulty}</label>
                <select id="difficulty" className="difficulty-select" value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
                  <option value="easy">{t.easy}</option>
                  <option value="intermediate">{t.intermediate}</option>
                  <option value="hard">{t.hard}</option>
                </select>
              </div>
            )}
          </div>

          <div className="game-layout">
            <div className="board-card">
              <div className="board-topline">
                <span className="board-name">{BOARDS[variant].label}</span>
                <span className="board-dimensions">{BOARDS[variant].cols} × {BOARDS[variant].rows}</span>
              </div>
              {winner && (
                <div className={`result-banner ${winner === 1 ? 'result-player-one' : 'result-player-two'}`} role="status" aria-live="polite">
                  <span className={`player-token token-${winner}`} />
                  <div>
                    <strong>{resultMessage}</strong>
                    {resultDetail && <span>{resultDetail}</span>}
                  </div>
                </div>
              )}
              <Board3D
                game={game}
                onPointClick={handlePointClick}
                selectedPiece={game.chainPiece ?? selectedPiece}
                highlightedTo={highlightedTo}
              />
              <div className="board-footnote"><span className="board-dot" />{t.gameBoard}</div>
            </div>

            <aside className="game-aside">
              <div className={`turn-card ${winner ? 'game-over' : ''}`}>
                <span className="turn-overline">{winner ? t.winner : t.playerTurn}</span>
                <div className="turn-player">
                  <span className={`player-token token-${winner || game.turn}`} />
                  <strong>{winner ? (winner === 1 ? t.white : t.black) : aiThinking ? t.aiTurn : `${currentSide}${mode === 'local' ? ` · ${game.turn}` : ''}`}</strong>
                </div>
                <span className="turn-status">
                  {winner ? t.tie : game.phase === 'placement' ? t.placePiece : game.chainPiece !== null ? t.chain : forcedCapture ? t.mandatoryCapture : selectedPiece !== null ? t.chooseCapture : t.yourTurn}
                </span>
              </div>
              {captureOptions.length > 0 && (
                <div className="capture-picker">
                  <span className="control-label">{t.chooseCapture}</span>
                  <div className="capture-buttons">
                    {captureOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={captureType === option ? 'capture-choice chosen' : 'capture-choice'}
                        onClick={() => setCaptureType(option)}
                      >
                        {t[option]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="score-card">
                <div className="score-heading"><span>{t.captured}</span><span>{t.pieces}</span></div>
                <div className="score-row">
                  <span className="score-player"><i className="score-dot light" />{t.white}</span>
                  <strong>{capturedCounts[1]}<small> / {BOARDS[variant].pieces}</small></strong>
                </div>
                <div className="score-row">
                  <span className="score-player"><i className="score-dot dark" />{t.black}</span>
                  <strong>{capturedCounts[2]}<small> / {BOARDS[variant].pieces}</small></strong>
                </div>
              </div>
              <div className="aside-tip">
                <span className="tip-symbol">✳</span>
                <p>{language === 'mg' ? 'Ny faharetana sy ny fahitana mialoha no lakilen’ny fandresena.' : language === 'en' ? 'Patience and foresight are your best allies.' : 'La patience et l’anticipation sont vos meilleures alliées.'}</p>
              </div>
              <button type="button" className="rules-link" onClick={() => setShowRules(true)}>
                {t.navRules}<span aria-hidden="true">↗</span>
              </button>
            </aside>
          </div>
        </section>

        <section className="rules-section" id="fitsipika">
          <div className="rules-intro">
            <span className="section-kicker">02 / FANORONA</span>
            <h2>{t.rulesTitle}<span className="heading-period">.</span></h2>
            <p>{t.rulesSubtitle}</p>
            <div className="rules-ornament"><Mark /></div>
          </div>
          <div className="rules-list">
            {[t.rule1Title, t.rule2Title, t.rule3Title, t.rule4Title].map((title, index) => (
              <article className="rule-item" key={title}>
                <span className="rule-number">0{index + 1}</span>
                <div><h3>{title}</h3><p>{t[`rule${index + 1}`]}</p></div>
                <span className="rule-arrow">↗</span>
              </article>
            ))}
            <p className="rules-note">{t.rulesNote}</p>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <a className="brand footer-brand" href="#accueil">
          <span className="brand-mark"><Mark /></span>
          <span><strong>FANORONA</strong><small>MADAGASIKARA</small></span>
        </a>
        <span className="footer-motif" aria-hidden="true"><Mark /></span>
      </footer>

      {showRules && (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowRules(false)}>
          <section className="rules-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setShowRules(false)} aria-label="Close">×</button>
            <span className="section-kicker">FANORONA / 01</span>
            <h2 id="modal-title">{t.rulesTitle}</h2>
            {[t.rule1, t.rule2, t.rule3, t.rule4].map((rule, index) => <p className="modal-rule" key={rule}><b>0{index + 1}</b>{rule}</p>)}
            <p className="rules-note">{t.rulesNote}</p>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
