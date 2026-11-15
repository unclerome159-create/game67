export type ElementId = 'chronos' | 'ether' | 'terra' | 'volta';

export type CharacterClassId = 'mathematician' | 'linguist' | 'historian' | 'physicist';

export type AppSection = 'map' | 'arena' | 'character' | 'teacher' | 'architecture';

export interface ElementMeta {
  id: ElementId;
  name: string;
  subject: string;
  biomeTitle: string;
  biomeSubtitle: string;
  imageUrl: string;
  accentHex: string;
  bgTintClass: string;
  textAccentClass: string;
  strongAgainst: ElementId;
  weakAgainst: ElementId;
}

export interface CharacterClassMeta {
  id: CharacterClassId;
  name: string;
  element: ElementId;
  specialty: string;
  bonusLabel: string;
  baseAttack: number;
  baseHp: number;
}

export interface SkinAppearance {
  skinTone: string;
  hairStyle: 'short' | 'bob' | 'long' | 'bun' | 'curly';
  hairColor: string;
  outfitStyle: 'scholar' | 'warden' | 'alchemist' | 'navigator';
  outfitColor: string;
  accessory: 'none' | 'glasses' | 'astrolabe' | 'crown' | 'scarf';
}

export type AchievementCategory = 'quests' | 'pve' | 'pvp' | 'mastery';

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  criteriaLabel: string;
  targetValue: number;
  rewardCoins: number;
  rewardSkinId?: string;
  getProgress: (profile: PlayerProfile, quests: Quest[]) => number;
}

export interface ShopSkinItem {
  id: string;
  name: string;
  category: 'Костюм' | 'Аксессуар' | 'Облик';
  element: ElementId;
  price: number;
  description: string;
  patch: Partial<SkinAppearance>;
  exclusiveNote?: string;
}

export interface PlayerProfile {
  name: string;
  classId: CharacterClassId;
  level: number;
  xp: number;
  xpToNext: number;
  coins: number;
  streakDays: number;
  soundEnabled: boolean;
  appearance: SkinAppearance;
  ownedItemIds: string[];
  equippedItemIds: string[];
  completedQuestIds: string[];
  elementMastery: Record<ElementId, number>;
  bossesDefeated: number;
  pvpWins: number;
  pvpRating: number;
  perfectQuestsCount: number;
  unlockedAchievementIds: string[];
}

export interface Question {
  id: string;
  element: ElementId;
  difficulty: 1 | 2 | 3;
  prompt: string;
  formula?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  author?: string;
}

export interface Quest {
  id: string;
  title: string;
  element: ElementId;
  description: string;
  questionIds: string[];
  rewardXp: number;
  rewardCoins: number;
  rewardBadge: string;
  assignedClass?: string;
}

export interface BossConfig {
  id: string;
  name: string;
  title: string;
  element: ElementId;
  weakness: ElementId;
  maxHp: number;
  baseDamage: number;
  imageUrl: string;
  phases: Array<{
    phase: 1 | 2 | 3;
    title: string;
    hpThresholdPercent: number;
    mechanicNote: string;
  }>;
}

export interface StudentRecord {
  id: string;
  name: string;
  className: string;
  classId: CharacterClassId;
  level: number;
  accuracyPercent: number;
  completedQuests: number;
  weakestElement: ElementId;
  recentMistakeTopic: string;
}

export interface QuestAnswerRecord {
  question: Question;
  selectedIndex: number;
  isCorrect: boolean;
}
