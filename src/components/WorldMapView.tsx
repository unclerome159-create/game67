import { useState } from 'react';
import { CheckCircle2, AlertCircle, ArrowRight, RotateCcw, BookOpen } from 'lucide-react';
import {
  ElementId,
  PlayerProfile,
  Question,
  Quest,
  QuestAnswerRecord,
} from '../types/game';
import {
  ACHIEVEMENTS,
  CHARACTER_CLASSES,
  ELEMENT_LIST,
  ELEMENTS,
  getPvpRank,
} from '../data/gameData';
import { CharacterAvatar } from './CharacterAvatar';
import { playFeedbackSound } from '../utils/sound';

interface WorldMapViewProps {
  profile: PlayerProfile;
  quests: Quest[];
  questions: Question[];
  activeQuestId: string | null;
  onStartQuest: (questId: string) => void;
  onExitQuest: () => void;
  onCompleteQuest: (quest: Quest, records: QuestAnswerRecord[]) => void;
  onGoToArena: () => void;
  onGoToProfile: () => void;
}

export function WorldMapView({
  profile,
  quests,
  questions,
  activeQuestId,
  onStartQuest,
  onExitQuest,
  onCompleteQuest,
  onGoToArena,
  onGoToProfile,
}: WorldMapViewProps) {
  const [selectedElement, setSelectedElement] = useState<ElementId | 'all'>('all');
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  // Active Quest Runner state
  const activeQuest = quests.find((q) => q.id === activeQuestId) ?? null;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [records, setRecords] = useState<QuestAnswerRecord[]>([]);
  const [showSummary, setShowSummary] = useState(false);

  const playerClass = CHARACTER_CLASSES.find((c) => c.id === profile.classId) ?? CHARACTER_CLASSES[0];

  const handleOpenQuest = (questId: string) => {
    setCurrentIdx(0);
    setSelectedOption(null);
    setIsSubmitted(false);
    setRecords([]);
    setShowSummary(false);
    onStartQuest(questId);
  };

  if (activeQuest) {
    const questQuestions = activeQuest.questionIds
      .map((id) => questions.find((q) => q.id === id))
      .filter((q): q is Question => Boolean(q));

    const currentQuestion = questQuestions[currentIdx];
    const elementMeta = ELEMENTS[activeQuest.element];

    if (showSummary) {
      const correctCount = records.filter((r) => r.isCorrect).length;
      const mistakes = records.filter((r) => !r.isCorrect);

      return (
        <section className="mx-auto max-w-4xl px-6 py-10">
          <div className="rounded-2xl border border-slate-200 bg-white p-8">
            <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4 border-b border-slate-200 pb-6">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {elementMeta.subject} · Итоги квеста
                </p>
                <h1 className="mt-1 font-display text-3xl font-bold text-slate-900 text-balance">
                  {activeQuest.title}
                </h1>
              </div>
              <div className="text-right tabular-nums">
                <p className="text-sm text-slate-500">Точность ответов</p>
                <p className="font-mono text-2xl font-semibold text-slate-900">
                  {correctCount} / {questQuestions.length}
                </p>
              </div>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">Получено опыта</p>
                <p className="mt-1 font-mono text-xl font-semibold text-blue-700 tabular-nums">
                  +{activeQuest.rewardXp} XP
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">Награда монетами</p>
                <p className="mt-1 font-mono text-xl font-semibold text-amber-700 tabular-nums">
                  +{activeQuest.rewardCoins} монет
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">Достижение</p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {activeQuest.rewardBadge}
                </p>
              </div>
            </div>

            {mistakes.length > 0 ? (
              <div className="mb-8">
                <h2 className="font-display text-xl font-semibold text-slate-900">
                  Разбор ошибок ({mistakes.length})
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Ошибки не отнимают накопленный прогресс или монеты — разберите объяснения ниже, чтобы закрепить тему.
                </p>
                <div className="mt-4 space-y-4">
                  {mistakes.map((rec, i) => (
                    <div
                      key={rec.question.id + '-' + i}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <p className="font-medium text-slate-900">{rec.question.prompt}</p>
                      <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                        <p className="text-red-700">
                          Ваш ответ: {rec.question.options[rec.selectedIndex]}
                        </p>
                        <p className="font-medium text-emerald-700">
                          Верный ответ: {rec.question.options[rec.question.correctIndex]}
                        </p>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-slate-700">
                        {rec.question.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-8 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                  <div>
                    <p className="font-semibold text-emerald-900">
                      Все задания выполнены без ошибок
                    </p>
                    <p className="mt-1 text-sm text-emerald-800">
                      Вы полностью освоили этот квест и готовы проверить знания в бою с боссом.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6">
              <button
                type="button"
                onClick={() => handleOpenQuest(activeQuest.id)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
              >
                <RotateCcw className="h-4 w-4" />
                Пройти заново
              </button>
              <button
                type="button"
                onClick={onExitQuest}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 whitespace-nowrap shrink-0"
              >
                Вернуться на карту
              </button>
            </div>
          </div>
        </section>
      );
    }

    if (!currentQuestion) {
      return (
        <section className="mx-auto max-w-3xl px-6 py-12">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-slate-700">В этом квесте пока нет вопросов.</p>
            <button
              type="button"
              onClick={onExitQuest}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Вернуться на карту
            </button>
          </div>
        </section>
      );
    }

    const handleSubmitAnswer = () => {
      if (selectedOption === null || isSubmitted) return;
      const isCorrect = selectedOption === currentQuestion.correctIndex;
      playFeedbackSound(isCorrect ? 'correct' : 'mistake', profile.soundEnabled);
      setIsSubmitted(true);
      setRecords((prev) => [...prev, { question: currentQuestion, selectedIndex: selectedOption, isCorrect }]);
    };

    const handleNextQuestion = () => {
      if (currentIdx + 1 < questQuestions.length) {
        setCurrentIdx((idx) => idx + 1);
        setSelectedOption(null);
        setIsSubmitted(false);
      } else {
        playFeedbackSound('victory', profile.soundEnabled);
        onCompleteQuest(activeQuest, records);
        setShowSummary(true);
      }
    };

    const isCurrentCorrect = selectedOption === currentQuestion.correctIndex;

    return (
      <section className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-4 flex items-center justify-between text-sm text-slate-600">
          <button
            type="button"
            onClick={onExitQuest}
            className="font-medium text-slate-600 transition-colors hover:text-slate-900"
          >
            Выйти из квеста
          </button>
          <span className="font-mono tabular-nums">
            Вопрос {currentIdx + 1} из {questQuestions.length} · {elementMeta.subject}
          </span>
        </div>

        {/* Clean linear progress track */}
        <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full bg-blue-600 transition-transform duration-200"
            style={{
              width: '100%',
              transform: `translateX(-${100 - ((currentIdx + (isSubmitted ? 1 : 0)) / questQuestions.length) * 100}%)`,
            }}
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8">
          <p className="text-xs font-medium text-slate-500">
            {activeQuest.title} · Сложность {currentQuestion.difficulty} из 3
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold leading-snug text-slate-900 text-balance">
            {currentQuestion.prompt}
          </h2>

          {currentQuestion.formula && (
            <div className="mt-4 inline-block rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 font-mono text-base font-medium text-slate-800">
              {currentQuestion.formula}
            </div>
          )}

          <div className="mt-6 space-y-3">
            {currentQuestion.options.map((option, idx) => {
              const isPicked = selectedOption === idx;
              const isRightOption = idx === currentQuestion.correctIndex;
              let optionStyle =
                'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50';

              if (!isSubmitted && isPicked) {
                optionStyle = 'border-blue-600 bg-blue-50 text-blue-950 font-medium';
              } else if (isSubmitted && isRightOption) {
                optionStyle = 'border-emerald-600 bg-emerald-50 text-emerald-950 font-medium';
              } else if (isSubmitted && isPicked && !isRightOption) {
                optionStyle = 'border-red-500 bg-red-50 text-red-950';
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isSubmitted}
                  onClick={() => setSelectedOption(idx)}
                  className={`flex min-h-[48px] w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-base transition-colors ${optionStyle}`}
                >
                  <span>{option}</span>
                  {isSubmitted && isRightOption && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" /> Верно
                    </span>
                  )}
                  {isSubmitted && isPicked && !isRightOption && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700">
                      <AlertCircle className="h-4 w-4" /> Ошибка
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {isSubmitted && (
            <div
              className={`mt-6 rounded-xl border p-4 ${
                isCurrentCorrect
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                  : 'border-amber-200 bg-amber-50 text-amber-950'
              }`}
            >
              <div className="flex items-start gap-3">
                {isCurrentCorrect ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                ) : (
                  <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                )}
                <div>
                  <p className="text-sm font-semibold">
                    {isCurrentCorrect ? 'Отлично, ответ точный' : 'Разбор задания'}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed">{currentQuestion.explanation}</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-end gap-3">
            {!isSubmitted ? (
              <button
                type="button"
                disabled={selectedOption === null}
                onClick={handleSubmitAnswer}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 whitespace-nowrap shrink-0"
              >
                Ответить
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNextQuestion}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 whitespace-nowrap shrink-0"
              >
                {currentIdx + 1 < questQuestions.length ? 'Следующий вопрос' : 'Завершить квест'}
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

  // World Map & Student Dashboard View
  const filteredQuests =
    selectedElement === 'all'
      ? quests
      : quests.filter((q) => q.element === selectedElement);

  const xpPercent = Math.min(100, Math.round((profile.xp / profile.xpToNext) * 100));

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      {/* Balanced Hero Split */}
      <section className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-8 lg:col-span-7">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Образовательная RPG-платформа · Профиль ученика
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl text-balance">
              Исследуйте биомы знаний и побеждайте в поединках без штрафов за ошибки
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
              Каждый школьный предмет в Хроноакадемии представлен своей стихией. Решайте квесты,
              разбирайте сложные задачи с мгновенными пояснениями и применяйте стихийные резонансы на арене.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => handleOpenQuest(quests[0].id)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 whitespace-nowrap shrink-0"
            >
              Продолжить квест
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onGoToArena}
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              Перейти на арену
            </button>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-8 lg:col-span-5">
          <div className="flex items-center gap-5">
            <CharacterAvatar
              appearance={profile.appearance}
              element={playerClass.element}
              size={96}
              className="shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">
                {playerClass.name} · Стихия {ELEMENTS[playerClass.element].name}
              </p>
              <h2 className="mt-0.5 truncate font-display text-2xl font-bold text-slate-900">
                {profile.name}
              </h2>
              <p className="mt-1 text-sm text-slate-600">{playerClass.bonusLabel}</p>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-xs font-medium text-slate-600 tabular-nums">
              <span>Уровень {profile.level}</span>
              <span>
                {profile.xp} / {profile.xpToNext} XP
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-300"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4 border-t border-slate-200 pt-5 tabular-nums">
            <div>
              <p className="text-xs text-slate-500">Монеты</p>
              <p className="mt-0.5 font-mono text-lg font-semibold text-slate-900">
                {profile.coins}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Квесты</p>
              <p className="mt-0.5 font-mono text-lg font-semibold text-slate-900">
                {profile.completedQuestIds.length} / {quests.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Ранг PvP</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">
                {getPvpRank(profile.pvpRating).title}
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-200 pt-4 text-xs">
            <span className="text-slate-600 tabular-nums">
              Достижения:{' '}
              <strong className="font-mono text-slate-900">
                {profile.unlockedAchievementIds.length} / {ACHIEVEMENTS.length}
              </strong>
              {' · '}
              Рейтинг PvP:{' '}
              <strong className="font-mono text-slate-900">{profile.pvpRating}</strong>
            </span>
            <button
              type="button"
              onClick={onGoToProfile}
              className="font-semibold text-blue-700 transition-colors hover:text-blue-800 whitespace-nowrap shrink-0"
            >
              Все достижения
            </button>
          </div>
        </div>
      </section>

      {/* Biomes Showcase Strip */}
      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900">
              Четыре биома стихий
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Выберите предмет для фильтрации доступных учебных миссий
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-200/70 p-1">
            <button
              type="button"
              onClick={() => setSelectedElement('all')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                selectedElement === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Все предметы
            </button>
            {ELEMENT_LIST.map((el) => (
              <button
                key={el.id}
                type="button"
                onClick={() => setSelectedElement(el.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  selectedElement === el.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {el.subject}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ELEMENT_LIST.map((biome) => {
            const mastery = profile.elementMastery[biome.id] ?? 0;
            const isActive = selectedElement === biome.id;
            return (
              <button
                key={biome.id}
                type="button"
                onClick={() =>
                  setSelectedElement((prev) => (prev === biome.id ? 'all' : biome.id))
                }
                className={`group flex flex-col overflow-hidden rounded-2xl border text-left transition-colors ${
                  isActive
                    ? 'border-blue-600 bg-white'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                  {!brokenImages[biome.id] ? (
                    <img
                      src={biome.imageUrl}
                      alt={biome.biomeTitle}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setBrokenImages((prev) => ({ ...prev, [biome.id]: true }))
                      }
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-200 text-sm font-medium text-slate-600">
                      {biome.biomeTitle}
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      {biome.subject} · Стихия {biome.name}
                    </p>
                    <h3 className="mt-1 font-display text-lg font-bold text-slate-900">
                      {biome.biomeTitle}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                      {biome.biomeSubtitle}
                    </p>
                  </div>
                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between text-xs text-slate-600 tabular-nums">
                      <span>Освоение биома</span>
                      <span className="font-mono font-semibold text-slate-900">{mastery}%</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Active Quests Grid */}
      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold text-slate-900">
          Доступные квесты
        </h2>
        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          {filteredQuests.map((quest) => {
            const el = ELEMENTS[quest.element];
            const isDone = profile.completedQuestIds.includes(quest.id);
            return (
              <div
                key={quest.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 tabular-nums">
                    <span>
                      {el.subject} · {quest.questionIds.length} вопроса · +{quest.rewardXp} XP · +{quest.rewardCoins} монет
                    </span>
                    {isDone && (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Пройдено
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 font-display text-xl font-bold text-slate-900">
                    {quest.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {quest.description}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-xs font-medium text-slate-500">
                    Награда: «{quest.rewardBadge}»
                    {quest.assignedClass ? ` · Класс ${quest.assignedClass}` : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenQuest(quest.id)}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 whitespace-nowrap shrink-0"
                  >
                    {isDone ? 'Повторить' : 'Начать квест'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
