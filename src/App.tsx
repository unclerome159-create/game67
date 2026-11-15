import { useEffect, useState } from 'react';
import { Award, X } from 'lucide-react';
import {
  AchievementDefinition,
  AppSection,
  PlayerProfile,
  Question,
  Quest,
  QuestAnswerRecord,
  ShopSkinItem,
} from './types/game';
import {
  DEFAULT_PLAYER_PROFILE,
  INITIAL_CLASS_ROSTER,
  INITIAL_QUESTS,
  INITIAL_QUESTIONS,
  evaluateAchievements,
} from './data/gameData';
import { WorldMapView } from './components/WorldMapView';
import { BattleArenaView } from './components/BattleArenaView';
import { CharacterStudioView } from './components/CharacterStudioView';
import { TeacherCabinetView } from './components/TeacherCabinetView';
import { PlatformArchitectureView } from './components/PlatformArchitectureView';

const STORAGE_KEY = 'chronoacademy_state_v1';

interface PersistedState {
  profile: PlayerProfile;
  questions: Question[];
  quests: Quest[];
}

function loadInitialState(): PersistedState {
  if (typeof window === 'undefined') {
    return {
      profile: DEFAULT_PLAYER_PROFILE,
      questions: INITIAL_QUESTIONS,
      quests: INITIAL_QUESTS,
    };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        profile: DEFAULT_PLAYER_PROFILE,
        questions: INITIAL_QUESTIONS,
        quests: INITIAL_QUESTS,
      };
    }
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return {
      profile: {
        ...DEFAULT_PLAYER_PROFILE,
        ...(parsed.profile ?? {}),
        appearance: {
          ...DEFAULT_PLAYER_PROFILE.appearance,
          ...(parsed.profile?.appearance ?? {}),
        },
        elementMastery: {
          ...DEFAULT_PLAYER_PROFILE.elementMastery,
          ...(parsed.profile?.elementMastery ?? {}),
        },
      },
      questions:
        parsed.questions && parsed.questions.length > 0 ? parsed.questions : INITIAL_QUESTIONS,
      quests: parsed.quests && parsed.quests.length > 0 ? parsed.quests : INITIAL_QUESTS,
    };
  } catch {
    return {
      profile: DEFAULT_PLAYER_PROFILE,
      questions: INITIAL_QUESTIONS,
      quests: INITIAL_QUESTS,
    };
  }
}

const NAV_ITEMS: Array<{ id: AppSection; label: string }> = [
  { id: 'map', label: 'Карта миров' },
  { id: 'arena', label: 'Арена боёв' },
  { id: 'character', label: 'Персонаж' },
  { id: 'teacher', label: 'Учителю' },
  { id: 'architecture', label: 'Архитектура' },
];

export default function App() {
  const [initial] = useState<PersistedState>(loadInitialState);
  const [activeSection, setActiveSection] = useState<AppSection>('map');
  const [activeQuestId, setActiveQuestId] = useState<string | null>(null);
  const [profile, setProfile] = useState<PlayerProfile>(initial.profile);
  const [questions, setQuestions] = useState<Question[]>(initial.questions);
  const [quests, setQuests] = useState<Quest[]>(initial.quests);
  const [unlockedToast, setUnlockedToast] = useState<AchievementDefinition[]>([]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ profile, questions, quests })
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [profile, questions, quests]);

  const applyProfileWithAchievements = (
    updater: (prev: PlayerProfile) => PlayerProfile,
    currentQuests: Quest[] = quests
  ) => {
    setProfile((prev) => {
      const updated = updater(prev);
      const { newlyUnlocked, bonusCoins, unlockedSkinIds } = evaluateAchievements(
        updated,
        currentQuests
      );

      if (newlyUnlocked.length === 0) {
        return updated;
      }

      setUnlockedToast((existing) => [...existing, ...newlyUnlocked]);

      const mergedOwned = Array.from(
        new Set([...updated.ownedItemIds, ...unlockedSkinIds])
      );
      const mergedAchievements = Array.from(
        new Set([
          ...updated.unlockedAchievementIds,
          ...newlyUnlocked.map((a) => a.id),
        ])
      );

      return {
        ...updated,
        coins: updated.coins + bonusCoins,
        ownedItemIds: mergedOwned,
        unlockedAchievementIds: mergedAchievements,
      };
    });
  };

  const addXpAndCoins = (
    prev: PlayerProfile,
    xpGain: number,
    coinsGain: number
  ): PlayerProfile => {
    let nextXp = prev.xp + xpGain;
    let nextLevel = prev.level;
    let nextXpToNext = prev.xpToNext;

    while (nextXp >= nextXpToNext) {
      nextXp -= nextXpToNext;
      nextLevel += 1;
      nextXpToNext = Math.round(nextXpToNext * 1.25);
    }

    return {
      ...prev,
      level: nextLevel,
      xp: nextXp,
      xpToNext: nextXpToNext,
      coins: prev.coins + coinsGain,
    };
  };

  const handleEarnBattleReward = (
    xpGain: number,
    coinsGain: number,
    mode: 'pve' | 'pvp'
  ) => {
    applyProfileWithAchievements((prev) => {
      const progressed = addXpAndCoins(prev, xpGain, coinsGain);
      return {
        ...progressed,
        bossesDefeated: mode === 'pve' ? prev.bossesDefeated + 1 : prev.bossesDefeated,
        pvpWins: mode === 'pvp' ? prev.pvpWins + 1 : prev.pvpWins,
        pvpRating: mode === 'pvp' ? prev.pvpRating + 55 : prev.pvpRating,
      };
    });
  };

  const handleCompleteQuest = (quest: Quest, records: QuestAnswerRecord[]) => {
    const correctCount = records.filter((r) => r.isCorrect).length;
    const isPerfect = records.length > 0 && correctCount === records.length;
    const accuracyRatio = records.length > 0 ? correctCount / records.length : 1;
    const xpEarned = Math.max(40, Math.round(quest.rewardXp * (0.5 + accuracyRatio * 0.5)));
    const coinsEarned = Math.max(
      20,
      Math.round(quest.rewardCoins * (0.5 + accuracyRatio * 0.5))
    );

    applyProfileWithAchievements((prev) => {
      const progressed = addXpAndCoins(prev, xpEarned, coinsEarned);
      const prevMastery = prev.elementMastery[quest.element] ?? 0;
      const masteryBoost = Math.round(accuracyRatio * 18);
      return {
        ...progressed,
        perfectQuestsCount: isPerfect
          ? prev.perfectQuestsCount + 1
          : prev.perfectQuestsCount,
        completedQuestIds: prev.completedQuestIds.includes(quest.id)
          ? prev.completedQuestIds
          : [...prev.completedQuestIds, quest.id],
        elementMastery: {
          ...prev.elementMastery,
          [quest.element]: Math.min(100, prevMastery + masteryBoost),
        },
      };
    });
  };

  const handleUpdateProfile = (patch: Partial<PlayerProfile>) => {
    setProfile((prev) => ({ ...prev, ...patch }));
  };

  const handleBuySkin = (item: ShopSkinItem) => {
    applyProfileWithAchievements((prev) => {
      if (prev.ownedItemIds.includes(item.id) || prev.coins < item.price) return prev;
      return {
        ...prev,
        coins: prev.coins - item.price,
        ownedItemIds: [...prev.ownedItemIds, item.id],
        equippedItemIds: [...prev.equippedItemIds, item.id],
        appearance: { ...prev.appearance, ...item.patch },
      };
    });
  };

  const handleEquipSkin = (item: ShopSkinItem) => {
    setProfile((prev) => {
      if (!prev.ownedItemIds.includes(item.id)) return prev;
      return {
        ...prev,
        equippedItemIds: prev.equippedItemIds.includes(item.id)
          ? prev.equippedItemIds
          : [...prev.equippedItemIds, item.id],
        appearance: { ...prev.appearance, ...item.patch },
      };
    });
  };

  const handleResetProgress = () => {
    setProfile(DEFAULT_PLAYER_PROFILE);
    setQuestions(INITIAL_QUESTIONS);
    setQuests(INITIAL_QUESTS);
    setActiveQuestId(null);
    setUnlockedToast([]);
  };

  const handleAddQuestion = (q: Question) => {
    setQuestions((prev) => [...prev, q]);
  };

  const handleAddQuest = (quest: Quest) => {
    setQuests((prev) => [quest, ...prev]);
  };

  const navigateTo = (section: AppSection) => {
    setActiveSection(section);
    if (section !== 'map') {
      setActiveQuestId(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-6 py-3.5">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => navigateTo('map')}
            className="font-display text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            Хроноакадемия
          </button>

          {/* Zone 2: 5 clean single-line text links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateTo(item.id)}
                  className={`border-b-2 py-1 transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'border-blue-600 text-slate-950 font-semibold'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => navigateTo('arena')}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 whitespace-nowrap shrink-0"
            >
              В бой
            </button>
          </div>
        </div>

        {/* Mobile navigation row */}
        <nav className="flex items-center gap-4 overflow-x-auto border-t border-slate-100 px-6 py-2 md:hidden">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateTo(item.id)}
                className={`text-xs font-medium whitespace-nowrap shrink-0 ${
                  isActive ? 'font-semibold text-blue-700' : 'text-slate-600'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Unlocked Achievement Notification Banner */}
      {unlockedToast.length > 0 && (
        <div className="border-b border-emerald-200 bg-emerald-50">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
            <div className="flex items-center gap-3 text-sm text-emerald-950">
              <Award className="h-5 w-5 shrink-0 text-emerald-700" />
              <div>
                <span className="font-semibold">
                  Новое достижение: {unlockedToast.map((a) => `«${a.title}»`).join(', ')}
                </span>
                <span className="ml-2 text-emerald-800">
                  Награда: +{unlockedToast.reduce((s, a) => s + a.rewardCoins, 0)} монет
                  {unlockedToast.some((a) => a.rewardSkinId)
                    ? ' и эксклюзивный предмет гардероба'
                    : ''}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setUnlockedToast([]);
                  navigateTo('character');
                }}
                className="text-xs font-semibold text-emerald-800 underline hover:text-emerald-950 whitespace-nowrap shrink-0"
              >
                Открыть профиль
              </button>
              <button
                type="button"
                onClick={() => setUnlockedToast([])}
                aria-label="Закрыть уведомление"
                className="text-emerald-700 hover:text-emerald-950"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1">
        {activeSection === 'map' && (
          <WorldMapView
            profile={profile}
            quests={quests}
            questions={questions}
            activeQuestId={activeQuestId}
            onStartQuest={(id) => setActiveQuestId(id)}
            onExitQuest={() => setActiveQuestId(null)}
            onCompleteQuest={handleCompleteQuest}
            onGoToArena={() => navigateTo('arena')}
            onGoToProfile={() => navigateTo('character')}
          />
        )}

        {activeSection === 'arena' && (
          <BattleArenaView
            profile={profile}
            questions={questions}
            onEarnBattleReward={handleEarnBattleReward}
          />
        )}

        {activeSection === 'character' && (
          <CharacterStudioView
            profile={profile}
            quests={quests}
            onUpdateProfile={handleUpdateProfile}
            onBuySkin={handleBuySkin}
            onEquipSkin={handleEquipSkin}
            onResetProgress={handleResetProgress}
          />
        )}

        {activeSection === 'teacher' && (
          <TeacherCabinetView
            questions={questions}
            quests={quests}
            roster={INITIAL_CLASS_ROSTER}
            onAddQuestion={handleAddQuestion}
            onAddQuest={handleAddQuest}
          />
        )}

        {activeSection === 'architecture' && <PlatformArchitectureView />}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-6 text-xs text-slate-500">
          <span>Хроноакадемия · Образовательная RPG-платформа</span>
          <div className="flex flex-wrap items-center gap-5">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateTo(item.id)}
                className="transition-colors hover:text-slate-900"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
