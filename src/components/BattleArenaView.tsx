import { useEffect, useState } from 'react';
import { Shield, Swords, Heart, RotateCcw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { ElementId, PlayerProfile, Question } from '../types/game';
import {
  BOSS_CONFIGS,
  CHARACTER_CLASSES,
  ELEMENTS,
  ELEMENT_LIST,
  calculateElementalResonance,
} from '../data/gameData';
import { BattleAnimationEvent, BattleCanvas } from './BattleCanvas';
import { playFeedbackSound } from '../utils/sound';

interface BattleArenaViewProps {
  profile: PlayerProfile;
  questions: Question[];
  onEarnBattleReward: (xp: number, coins: number, mode: 'pve' | 'pvp') => void;
}

type BattleState = 'IDLE' | 'PLAYER_TURN' | 'ENEMY_THINKING' | 'VICTORY' | 'DEFEAT';

interface CombatLogEntry {
  id: number;
  text: string;
  tone: 'info' | 'good' | 'warn';
}

export function BattleArenaView({
  profile,
  questions,
  onEarnBattleReward,
}: BattleArenaViewProps) {
  const boss = BOSS_CONFIGS[0];
  const playerClass =
    CHARACTER_CLASSES.find((c) => c.id === profile.classId) ?? CHARACTER_CLASSES[0];

  const [mode, setMode] = useState<'pve' | 'pvp'>('pve');
  const [attackElement, setAttackElement] = useState<ElementId>(playerClass.element);
  const [battleState, setBattleState] = useState<BattleState>('IDLE');
  const [playerHp, setPlayerHp] = useState(playerClass.baseHp);
  const [enemyHp, setEnemyHp] = useState(boss.maxHp);
  const [comboStreak, setComboStreak] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [actionIntent, setActionIntent] = useState<'attack' | 'heal'>('attack');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedbackNote, setFeedbackNote] = useState<string | null>(null);
  const [lastEvent, setLastEvent] = useState<BattleAnimationEvent | null>(null);
  const [logs, setLogs] = useState<CombatLogEntry[]>([]);
  const [mistakes, setMistakes] = useState<Question[]>([]);

  const enemyMaxHp = mode === 'pve' ? boss.maxHp : 140;
  const enemyElement: ElementId = mode === 'pve' ? boss.element : 'volta';
  const enemyName = mode === 'pve' ? boss.name : 'Артём (Соперник PvP)';

  const hpPercentEnemy = Math.max(0, Math.round((enemyHp / enemyMaxHp) * 100));
  const bossPhase: 1 | 2 | 3 =
    hpPercentEnemy > 60 ? 1 : hpPercentEnemy > 25 ? 2 : 3;

  const activePhaseMeta =
    boss.phases.find((p) => p.phase === bossPhase) ?? boss.phases[0];

  const pool = questions.filter((q) => q.element === attackElement);
  const activePool = pool.length > 0 ? pool : questions;
  const currentQuestion = activePool[questionIndex % activePool.length];

  const resonance = calculateElementalResonance(attackElement, enemyElement);

  const pushLog = (text: string, tone: 'info' | 'good' | 'warn') => {
    setLogs((prev) => [{ id: Date.now() + Math.random(), text, tone }, ...prev.slice(0, 5)]);
  };

  const startBattle = (nextMode: 'pve' | 'pvp' = mode) => {
    setMode(nextMode);
    setPlayerHp(playerClass.baseHp);
    setEnemyHp(nextMode === 'pve' ? boss.maxHp : 140);
    setComboStreak(0);
    setQuestionIndex(0);
    setSelectedOption(null);
    setFeedbackNote(null);
    setMistakes([]);
    setLastEvent(null);
    setLogs([
      {
        id: Date.now(),
        text:
          nextMode === 'pve'
            ? `Бой начался: ${boss.name}. Подберите стихию для резонанса.`
            : 'PvP-дуэль началась. Отвечайте точно, чтобы опередить соперника.',
        tone: 'info',
      },
    ]);
    setBattleState('PLAYER_TURN');
  };

  // Simulated PvP / Boss turn when ENEMY_THINKING
  useEffect(() => {
    if (battleState !== 'ENEMY_THINKING') return;

    const timer = setTimeout(() => {
      if (mode === 'pvp') {
        const opponentSolvedCorrectly = Math.random() < 0.7;
        if (opponentSolvedCorrectly) {
          const dmg = playerClass.id === 'historian' ? 16 : 20;
          setPlayerHp((hp) => {
            const next = Math.max(0, hp - dmg);
            if (next === 0) setBattleState('DEFEAT');
            else setBattleState('PLAYER_TURN');
            return next;
          });
          setLastEvent({
            id: Date.now(),
            type: 'enemy_attack',
            amount: dmg,
            element: enemyElement,
          });
          playFeedbackSound('mistake', profile.soundEnabled);
          pushLog(`Соперник дал верный ответ и нанёс ${dmg} урона.`, 'warn');
        } else {
          pushLog('Соперник ошибся в задании — ход возвращается к вам.', 'info');
          setBattleState('PLAYER_TURN');
        }
      } else {
        const phaseMultiplier = bossPhase === 2 ? 1.25 : bossPhase === 3 ? 1.4 : 1;
        const rawDamage = Math.round(boss.baseDamage * phaseMultiplier);
        const dmg = playerClass.id === 'historian' ? Math.round(rawDamage * 0.8) : rawDamage;
        setPlayerHp((hp) => {
          const next = Math.max(0, hp - dmg);
          if (next === 0) setBattleState('DEFEAT');
          else setBattleState('PLAYER_TURN');
          return next;
        });
        setLastEvent({
          id: Date.now(),
          type: 'enemy_attack',
          amount: dmg,
          element: enemyElement,
        });
        playFeedbackSound('mistake', profile.soundEnabled);
        pushLog(`${boss.name} контратаковал на ${dmg} урона (${activePhaseMeta.title}).`, 'warn');
      }
      setQuestionIndex((i) => i + 1);
      setSelectedOption(null);
    }, 750);

    return () => clearTimeout(timer);
  }, [
    battleState,
    mode,
    boss.baseDamage,
    boss.name,
    bossPhase,
    activePhaseMeta.title,
    enemyElement,
    playerClass.id,
    profile.soundEnabled,
  ]);

  const handleSubmitCombatAnswer = () => {
    if (battleState !== 'PLAYER_TURN' || selectedOption === null) return;
    const isCorrect = selectedOption === currentQuestion.correctIndex;

    if (isCorrect) {
      const nextStreak = comboStreak + 1;
      setComboStreak(nextStreak);
      setFeedbackNote(`Верно: ${currentQuestion.explanation}`);

      if (actionIntent === 'attack') {
        let base = playerClass.baseAttack;
        if (playerClass.element === attackElement) base = Math.round(base * 1.15);
        if (playerClass.id === 'physicist' && nextStreak >= 2) base = Math.round(base * 1.25);
        const damage = Math.round(base * resonance.multiplier);

        playFeedbackSound('attack', profile.soundEnabled);
        setLastEvent({
          id: Date.now(),
          type: 'player_attack',
          amount: damage,
          element: attackElement,
          multiplier: resonance.multiplier,
        });

        const nextEnemyHp = Math.max(0, enemyHp - damage);
        setEnemyHp(nextEnemyHp);
        pushLog(
          `Ваш удар стихией ${ELEMENTS[attackElement].name} нанёс ${damage} урона (${resonance.label}).`,
          'good'
        );

        if (nextEnemyHp === 0) {
          playFeedbackSound('victory', profile.soundEnabled);
          onEarnBattleReward(mode === 'pve' ? 180 : 120, mode === 'pve' ? 90 : 55, mode);
          setBattleState('VICTORY');
          return;
        }
      } else {
        const healBase = playerClass.id === 'linguist' ? 32 : 26;
        setPlayerHp((hp) => Math.min(playerClass.baseHp, hp + healBase));
        playFeedbackSound('correct', profile.soundEnabled);
        setLastEvent({
          id: Date.now(),
          type: 'player_heal',
          amount: healBase,
          element: 'ether',
        });
        pushLog(`Вы восстановили ${healBase} HP благодаря точному ответу.`, 'good');
      }

      if (mode === 'pvp') {
        setBattleState('ENEMY_THINKING');
      } else {
        setQuestionIndex((i) => i + 1);
        setSelectedOption(null);
      }
    } else {
      setComboStreak(0);
      setMistakes((prev) => [...prev, currentQuestion]);
      setFeedbackNote(
        `Пояснение: ${currentQuestion.explanation} (Ошибка даёт противнику право на ход.)`
      );
      setBattleState('ENEMY_THINKING');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Боевая сцена 2D · Пошаговая система стихий
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold text-slate-900">
            Арена боёв и дуэлей
          </h1>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-slate-200/70 p-1">
          <button
            type="button"
            onClick={() => startBattle('pve')}
            className={`rounded-md px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              mode === 'pve'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Бой с боссом (PvE)
          </button>
          <button
            type="button"
            onClick={() => startBattle('pvp')}
            className={`rounded-md px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              mode === 'pvp'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Дуэль игроков (PvP)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left: 2D Battle Canvas + HUD */}
        <div className="space-y-4 lg:col-span-7">
          {/* Top Combat HUD (Unobtrusive, explicit numeric & state labels) */}
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
            <div>
              <div className="flex items-center justify-between text-xs font-medium text-slate-600 tabular-nums">
                <span className="font-semibold text-slate-900">{profile.name}</span>
                <span className="font-mono">
                  HP: {playerHp}/{playerClass.baseHp} · {playerHp > 35 ? 'СТАБИЛЬНО' : 'НИЗКОЕ HP'}
                </span>
              </div>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full transition-all duration-200 ${
                    playerHp > 35 ? 'bg-emerald-600' : 'bg-red-600'
                  }`}
                  style={{ width: `${Math.round((playerHp / playerClass.baseHp) * 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-medium text-slate-600 tabular-nums">
                <span className="font-semibold text-slate-900">{enemyName}</span>
                <span className="font-mono">
                  HP: {enemyHp}/{enemyMaxHp} · {ELEMENTS[enemyElement].name}
                </span>
              </div>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full bg-amber-600 transition-all duration-200"
                  style={{ width: `${hpPercentEnemy}%` }}
                />
              </div>
            </div>
          </div>

          <BattleCanvas
            mode={mode}
            playerElement={attackElement}
            enemyElement={enemyElement}
            playerAppearance={profile.appearance}
            playerName={profile.name}
            enemyName={enemyName}
            bossPhase={bossPhase}
            lastEvent={lastEvent}
            bossImageUrl={boss.imageUrl}
          />

          {mode === 'pve' && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">{activePhaseMeta.title}</p>
                <span className="text-xs font-medium text-slate-600 tabular-nums">
                  Серия верных ответов: {comboStreak}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{activePhaseMeta.mechanicNote}</p>
            </div>
          )}

          {/* Recent combat events */}
          {logs.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold text-slate-500">Ход поединка</p>
              <ul className="mt-2 space-y-1.5 text-sm">
                {logs.map((entry) => (
                  <li
                    key={entry.id}
                    className={
                      entry.tone === 'good'
                        ? 'text-emerald-800'
                        : entry.tone === 'warn'
                          ? 'text-amber-800'
                          : 'text-slate-700'
                    }
                  >
                    {entry.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right: Combat Command & Question Deck */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-5">
          {battleState === 'IDLE' && (
            <div className="flex h-full flex-col justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  {mode === 'pve' ? 'Режим PvE · Бой с боссом' : 'Режим PvP · Дуэль'}
                </p>
                <h2 className="mt-1 font-display text-2xl font-bold text-slate-900">
                  {mode === 'pve' ? boss.name : 'Тренировочная дуэль с академиком'}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {mode === 'pve'
                    ? 'Правильный ответ наносит урон боссу или восстанавливает здоровье. Если вы выберете стихию Эфира против Хроноса, сработает резонанс ×1.5.'
                    : 'Соперник отвечает на задания в реальном времени. Опередите его по урону или переиграйте за счёт стихийного преимущества.'}
                </p>

                <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">Правила безопасности ошибок</p>
                  <p className="mt-1">
                    Ошибка даёт боссу право на атаку, но вы всегда получаете подробное объяснение и не теряете накопленный опыт.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => startBattle(mode)}
                className="mt-6 w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Начать бой
              </button>
            </div>
          )}

          {(battleState === 'VICTORY' || battleState === 'DEFEAT') && (
            <div className="flex h-full flex-col justify-between">
              <div>
                <div className="flex items-center gap-2">
                  {battleState === 'VICTORY' ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="h-6 w-6 text-amber-600" />
                  )}
                  <h2 className="font-display text-2xl font-bold text-slate-900">
                    {battleState === 'VICTORY' ? 'Победа на арене' : 'Поединок завершён'}
                  </h2>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {battleState === 'VICTORY'
                    ? `Вы победили и заработали +${mode === 'pve' ? 180 : 120} XP и +${mode === 'pve' ? 90 : 55} монет.`
                    : 'Ничего страшного — изучите сложные вопросы ниже и попробуйте другую стихию.'}
                </p>

                {mistakes.length > 0 && (
                  <div className="mt-5 space-y-3">
                    <p className="text-sm font-semibold text-slate-900">
                      Разбор сложных вопросов ({mistakes.length})
                    </p>
                    {mistakes.slice(0, 3).map((q, idx) => (
                      <div
                        key={q.id + '-' + idx}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm"
                      >
                        <p className="font-medium text-slate-900">{q.prompt}</p>
                        <p className="mt-1 text-emerald-700">
                          Ответ: {q.options[q.correctIndex]}
                        </p>
                        <p className="mt-1 text-slate-600">{q.explanation}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => startBattle(mode)}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                <RotateCcw className="h-4 w-4" />
                Играть снова
              </button>
            </div>
          )}

          {(battleState === 'PLAYER_TURN' || battleState === 'ENEMY_THINKING') && (
            <div>
              {/* Element & Intent controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-4">
                <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setActionIntent('attack')}
                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      actionIntent === 'attack'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600'
                    }`}
                  >
                    <Swords className="h-3.5 w-3.5" /> Атака
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionIntent('heal')}
                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      actionIntent === 'heal'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600'
                    }`}
                  >
                    <Heart className="h-3.5 w-3.5" /> Лечение
                  </button>
                </div>

                <span
                  className={`text-xs font-semibold ${
                    resonance.relation === 'resonance'
                      ? 'text-emerald-700'
                      : resonance.relation === 'resistance'
                        ? 'text-amber-700'
                        : 'text-slate-600'
                  }`}
                >
                  {resonance.label}
                </span>
              </div>

              {/* Element selector */}
              <div className="mt-4">
                <p className="mb-2 text-xs font-medium text-slate-500">
                  Выберите стихию предмета для хода
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {ELEMENT_LIST.map((el) => (
                    <button
                      key={el.id}
                      type="button"
                      onClick={() => {
                        setAttackElement(el.id);
                        setSelectedOption(null);
                      }}
                      className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors whitespace-nowrap truncate ${
                        attackElement === el.id
                          ? 'border-blue-600 bg-blue-50 text-blue-900'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {el.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question */}
              <div className="mt-5">
                <p className="text-xs font-medium text-slate-500">
                  {ELEMENTS[currentQuestion.element].subject} · Сложность {currentQuestion.difficulty}
                </p>
                <h3 className="mt-1 text-base font-semibold leading-snug text-slate-900">
                  {currentQuestion.prompt}
                </h3>
                {currentQuestion.formula && (
                  <p className="mt-2 inline-block rounded-md border border-slate-200 bg-slate-50 px-3 py-1 font-mono text-sm text-slate-800">
                    {currentQuestion.formula}
                  </p>
                )}

                <div className="mt-4 space-y-2.5">
                  {currentQuestion.options.map((opt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={battleState !== 'PLAYER_TURN'}
                      onClick={() => setSelectedOption(idx)}
                      className={`min-h-[44px] w-full rounded-xl border px-3.5 py-2.5 text-left text-sm transition-colors ${
                        selectedOption === idx
                          ? 'border-blue-600 bg-blue-50 font-medium text-blue-950'
                          : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {feedbackNote && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">
                  {feedbackNote}
                </div>
              )}

              <div className="mt-5 flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                  <Shield className="h-3.5 w-3.5" />
                  {battleState === 'ENEMY_THINKING' ? 'Ход противника...' : 'Ваш ход'}
                </span>
                <button
                  type="button"
                  disabled={battleState !== 'PLAYER_TURN' || selectedOption === null}
                  onClick={handleSubmitCombatAnswer}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 whitespace-nowrap shrink-0"
                >
                  {actionIntent === 'attack' ? 'Нанести удар' : 'Восстановить HP'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
