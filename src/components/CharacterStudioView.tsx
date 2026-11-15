import { useState } from 'react';
import { Check, Volume2, VolumeX, RotateCcw, Award, Lock } from 'lucide-react';
import {
  AchievementCategory,
  CharacterClassId,
  PlayerProfile,
  Quest,
  ShopSkinItem,
  SkinAppearance,
} from '../types/game';
import {
  ACHIEVEMENTS,
  CHARACTER_CLASSES,
  ELEMENTS,
  SKIN_SHOP_CATALOG,
  getPvpRank,
} from '../data/gameData';
import { CharacterAvatar } from './CharacterAvatar';

interface CharacterStudioViewProps {
  profile: PlayerProfile;
  quests: Quest[];
  onUpdateProfile: (patch: Partial<PlayerProfile>) => void;
  onBuySkin: (item: ShopSkinItem) => void;
  onEquipSkin: (item: ShopSkinItem) => void;
  onResetProgress: () => void;
}

const SKIN_TONES = ['#F8DFC9', '#F3D2B3', '#DFAF86', '#B97E56', '#7A4E33'];
const HAIR_COLORS = ['#1E293B', '#3B2F2F', '#92400E', '#D97706', '#0F766E'];
const OUTFIT_COLORS = ['#1E3A8A', '#065F46', '#92400E', '#334155', '#7C2D12'];

const HAIR_STYLES: Array<{ id: SkinAppearance['hairStyle']; label: string }> = [
  { id: 'short', label: 'Короткая' },
  { id: 'bob', label: 'Каре' },
  { id: 'long', label: 'Длинная' },
  { id: 'bun', label: 'Пучок' },
  { id: 'curly', label: 'Кудри' },
];

const ACHIEVEMENT_CATEGORIES: Array<{ id: AchievementCategory | 'all'; label: string }> = [
  { id: 'all', label: 'Все' },
  { id: 'quests', label: 'Квесты' },
  { id: 'pve', label: 'Боссы PvE' },
  { id: 'pvp', label: 'Дуэли PvP' },
  { id: 'mastery', label: 'Мастерство' },
];

export function CharacterStudioView({
  profile,
  quests,
  onUpdateProfile,
  onBuySkin,
  onEquipSkin,
  onResetProgress,
}: CharacterStudioViewProps) {
  const [nameInput, setNameInput] = useState(profile.name);
  const [savedNotice, setSavedNotice] = useState(false);
  const [achFilter, setAchFilter] = useState<AchievementCategory | 'all'>('all');

  const activeClass =
    CHARACTER_CLASSES.find((c) => c.id === profile.classId) ?? CHARACTER_CLASSES[0];
  const pvpRank = getPvpRank(profile.pvpRating);

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    onUpdateProfile({ name: trimmed });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 1800);
  };

  const updateAppearance = (patch: Partial<SkinAppearance>) => {
    onUpdateProfile({
      appearance: { ...profile.appearance, ...patch },
    });
  };

  const filteredAchievements =
    achFilter === 'all'
      ? ACHIEVEMENTS
      : ACHIEVEMENTS.filter((a) => a.category === achFilter);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Профиль героя · Достижения, редактор внешности и магазин скинов
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold text-slate-900">
            Персонаж, достижения и гардероб
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onUpdateProfile({ soundEnabled: !profile.soundEnabled })}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            {profile.soundEnabled ? (
              <>
                <Volume2 className="h-4 w-4" /> Звук включён
              </>
            ) : (
              <>
                <VolumeX className="h-4 w-4" /> Звук выключен
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onResetProgress}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-4 w-4" /> Сбросить прогресс
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left: Live Preview & Class Selection */}
        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left sm:gap-6">
              <CharacterAvatar
                appearance={profile.appearance}
                element={activeClass.element}
                size={136}
                className="shrink-0"
              />
              <div className="mt-4 min-w-0 flex-1 sm:mt-0">
                <p className="text-xs font-medium text-slate-500">
                  Уровень {profile.level} · {activeClass.name}
                </p>
                <h2 className="mt-1 truncate font-display text-2xl font-bold text-slate-900">
                  {profile.name}
                </h2>
                <p className="mt-1 text-sm text-slate-600">{activeClass.specialty}</p>

                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-600 tabular-nums">
                  <span>
                    Атака:{' '}
                    <strong className="font-mono text-slate-900">{activeClass.baseAttack}</strong>
                  </span>
                  <span>
                    Здоровье:{' '}
                    <strong className="font-mono text-slate-900">{activeClass.baseHp} HP</strong>
                  </span>
                  <span>
                    Баланс:{' '}
                    <strong className="font-mono text-amber-700">{profile.coins} монет</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* PvP Rank & Combat Stats summary */}
            <div className="mt-5 grid grid-cols-3 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs tabular-nums">
              <div>
                <p className="text-slate-500">Ранг PvP</p>
                <p className="mt-0.5 font-semibold text-slate-900">{pvpRank.title}</p>
              </div>
              <div>
                <p className="text-slate-500">Рейтинг / Победы</p>
                <p className="mt-0.5 font-mono font-semibold text-slate-900">
                  {profile.pvpRating} ({profile.pvpWins})
                </p>
              </div>
              <div>
                <p className="text-slate-500">Боссы PvE</p>
                <p className="mt-0.5 font-mono font-semibold text-slate-900">
                  {profile.bossesDefeated} побед
                </p>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-200 pt-5">
              <label htmlFor="hero-name" className="block text-xs font-semibold text-slate-700">
                Имя персонажа
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  id="hero-name"
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  maxLength={32}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSaveName}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 whitespace-nowrap shrink-0"
                >
                  {savedNotice ? 'Сохранено' : 'Сохранить'}
                </button>
              </div>
            </div>
          </div>

          {/* Class selector */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="font-display text-lg font-bold text-slate-900">Выбор класса</h3>
            <p className="mt-1 text-xs text-slate-500">
              Класс определяет базовые характеристики и стихийный бонус
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {CHARACTER_CLASSES.map((cls) => {
                const isSelected = cls.id === profile.classId;
                return (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => onUpdateProfile({ classId: cls.id as CharacterClassId })}
                    className={`rounded-xl border p-3.5 text-left transition-colors ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-900">{cls.name}</p>
                    <p className="mt-0.5 text-xs text-slate-600">
                      Стихия: {ELEMENTS[cls.element].name}
                    </p>
                    <p className="mt-2 text-xs text-slate-700">{cls.bonusLabel}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Parameter Customizer & Skin Shop */}
        <div className="space-y-6 lg:col-span-7">
          {/* Appearance parameters */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="font-display text-lg font-bold text-slate-900">
              Параметрический редактор облика
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Настройте тон кожи, причёску и палитру костюма для портрета и боевой арены
            </p>

            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold text-slate-700">Тон кожи</p>
                <div className="mt-2 flex items-center gap-2.5">
                  {SKIN_TONES.map((tone) => (
                    <button
                      key={tone}
                      type="button"
                      aria-label={`Выбрать тон кожи ${tone}`}
                      onClick={() => updateAppearance({ skinTone: tone })}
                      className={`h-8 w-8 rounded-full border-2 transition-transform ${
                        profile.appearance.skinTone === tone
                          ? 'scale-110 border-blue-600'
                          : 'border-slate-300'
                      }`}
                      style={{ backgroundColor: tone }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-700">Цвет волос</p>
                <div className="mt-2 flex items-center gap-2.5">
                  {HAIR_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Выбрать цвет волос ${color}`}
                      onClick={() => updateAppearance({ hairColor: color })}
                      className={`h-8 w-8 rounded-full border-2 transition-transform ${
                        profile.appearance.hairColor === color
                          ? 'scale-110 border-blue-600'
                          : 'border-slate-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-700">Причёска</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {HAIR_STYLES.map((hs) => (
                    <button
                      key={hs.id}
                      type="button"
                      onClick={() => updateAppearance({ hairStyle: hs.id })}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                        profile.appearance.hairStyle === hs.id
                          ? 'border-blue-600 bg-blue-50 text-blue-900'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {hs.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-700">Цвет костюма</p>
                <div className="mt-2 flex items-center gap-2.5">
                  {OUTFIT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Выбрать цвет костюма ${color}`}
                      onClick={() => updateAppearance({ outfitColor: color })}
                      className={`h-8 w-8 rounded-full border-2 transition-transform ${
                        profile.appearance.outfitColor === color
                          ? 'scale-110 border-blue-600'
                          : 'border-slate-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Skin & Artifact Shop */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900">
                  Магазин скинов и наградных предметов
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Покупайте образы за монеты или открывайте эксклюзивные предметы за достижения
                </p>
              </div>
              <span className="font-mono text-sm font-semibold text-amber-700 tabular-nums">
                {profile.coins} монет
              </span>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {SKIN_SHOP_CATALOG.map((item) => {
                const isOwned = profile.ownedItemIds.includes(item.id);
                const isEquipped = profile.equippedItemIds.includes(item.id);
                const canAfford = profile.coins >= item.price;

                return (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div>
                      <p className="text-xs text-slate-500">
                        {item.category} · Стихия {ELEMENTS[item.element].name}
                      </p>
                      <h4 className="mt-1 font-semibold text-slate-900">{item.name}</h4>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-200 pt-3">
                      <span className="font-mono text-xs font-semibold text-slate-800 tabular-nums">
                        {item.exclusiveNote
                          ? isOwned
                            ? 'Открыто достижением'
                            : 'За достижение'
                          : item.price === 0
                            ? 'Стартовый'
                            : `${item.price} монет`}
                      </span>
                      {isOwned ? (
                        <button
                          type="button"
                          onClick={() => onEquipSkin(item)}
                          disabled={isEquipped}
                          className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                            isEquipped
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-900 text-white hover:bg-slate-800'
                          }`}
                        >
                          {isEquipped ? (
                            <>
                              <Check className="h-3.5 w-3.5" /> Надето
                            </>
                          ) : (
                            'Применить'
                          )}
                        </button>
                      ) : item.exclusiveNote ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 whitespace-nowrap shrink-0">
                          <Lock className="h-3.5 w-3.5" /> Закрыто
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() => onBuySkin(item)}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 whitespace-nowrap shrink-0"
                        >
                          Купить
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Achievements & Rewards Showcase */}
      <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-slate-500 tabular-nums">
              Получено {profile.unlockedAchievementIds.length} из {ACHIEVEMENTS.length} достижений
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold text-slate-900">
              Достижения и награды
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1">
            {ACHIEVEMENT_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setAchFilter(cat.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  achFilter === cat.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredAchievements.map((ach) => {
            const unlocked = profile.unlockedAchievementIds.includes(ach.id);
            const currentVal = Math.min(ach.targetValue, ach.getProgress(profile, quests));
            const pct = Math.min(100, Math.round((currentVal / ach.targetValue) * 100));
            const rewardSkin = ach.rewardSkinId
              ? SKIN_SHOP_CATALOG.find((s) => s.id === ach.rewardSkinId)
              : null;

            return (
              <div
                key={ach.id}
                className={`flex flex-col justify-between rounded-xl border p-5 ${
                  unlocked ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        {ach.criteriaLabel} ·{' '}
                        <span className="font-mono tabular-nums">
                          {currentVal} / {ach.targetValue}
                        </span>
                      </p>
                      <h3 className="mt-1 font-display text-lg font-bold text-slate-900">
                        {ach.title}
                      </h3>
                    </div>
                    {unlocked ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 whitespace-nowrap shrink-0">
                        <Award className="h-4 w-4" /> Получено
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 whitespace-nowrap shrink-0">
                        <Lock className="h-3.5 w-3.5" /> В процессе
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm text-slate-600">{ach.description}</p>
                </div>

                <div className="mt-4">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full transition-all duration-300 ${
                        unlocked ? 'bg-emerald-600' : 'bg-blue-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-mono font-semibold text-amber-700 tabular-nums">
                      Награда: +{ach.rewardCoins} монет
                      {rewardSkin ? ` + «${rewardSkin.name}»` : ''}
                    </span>
                    {unlocked && rewardSkin && (
                      <button
                        type="button"
                        onClick={() => onEquipSkin(rewardSkin)}
                        className="font-semibold text-blue-700 hover:text-blue-800 whitespace-nowrap shrink-0"
                      >
                        {profile.equippedItemIds.includes(rewardSkin.id)
                          ? 'Предмет надет'
                          : 'Применить предмет'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
