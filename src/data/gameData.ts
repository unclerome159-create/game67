import {
  BossConfig,
  CharacterClassMeta,
  ElementId,
  ElementMeta,
  PlayerProfile,
  Question,
  Quest,
  ShopSkinItem,
  StudentRecord,
} from '../types/game';

export const ELEMENTS: Record<ElementId, ElementMeta> = {
  chronos: {
    id: 'chronos',
    name: 'Хронос',
    subject: 'Математика',
    biomeTitle: 'Обсерватория Хроноса',
    biomeSubtitle: 'Алгебра, геометрия, пропорции и логика чисел',
    imageUrl: '/src/assets/images/biome_math_chronos_1794735118737.jpg',
    accentHex: '#D97706',
    bgTintClass: 'bg-amber-50',
    textAccentClass: 'text-amber-700',
    strongAgainst: 'volta',
    weakAgainst: 'ether',
  },
  ether: {
    id: 'ether',
    name: 'Эфир',
    subject: 'Лингвистика',
    biomeTitle: 'Библиотека Эфира',
    biomeSubtitle: 'Синтаксис, орфография, этимология и точность речи',
    imageUrl: '/src/assets/images/biome_linguistics_ether_1794735118696.jpg',
    accentHex: '#059669',
    bgTintClass: 'bg-emerald-50',
    textAccentClass: 'text-emerald-700',
    strongAgainst: 'chronos',
    weakAgainst: 'terra',
  },
  terra: {
    id: 'terra',
    name: 'Терра',
    subject: 'История',
    biomeTitle: 'Амфитеатр Терры',
    biomeSubtitle: 'Хронология эпох, цивилизации и исторические источники',
    imageUrl: '/src/assets/images/biome_history_terra_1794735119877.jpg',
    accentHex: '#B45309',
    bgTintClass: 'bg-orange-50',
    textAccentClass: 'text-orange-800',
    strongAgainst: 'ether',
    weakAgainst: 'volta',
  },
  volta: {
    id: 'volta',
    name: 'Вольта',
    subject: 'Физика',
    biomeTitle: 'Цитадель Вольты',
    biomeSubtitle: 'Механика, электричество, оптика и законы сохранения',
    imageUrl: '/src/assets/images/biome_physics_volta_1794735120816.jpg',
    accentHex: '#2563EB',
    bgTintClass: 'bg-blue-50',
    textAccentClass: 'text-blue-700',
    strongAgainst: 'terra',
    weakAgainst: 'chronos',
  },
};

export const ELEMENT_LIST: ElementMeta[] = [
  ELEMENTS.chronos,
  ELEMENTS.ether,
  ELEMENTS.terra,
  ELEMENTS.volta,
];

export const CHARACTER_CLASSES: CharacterClassMeta[] = [
  {
    id: 'mathematician',
    name: 'Математик',
    element: 'chronos',
    specialty: 'Точный расчёт и усиление урона стихии Хроноса',
    bonusLabel: '+20% к атаке в квестах и боях по математике',
    baseAttack: 28,
    baseHp: 110,
  },
  {
    id: 'linguist',
    name: 'Лингвист',
    element: 'ether',
    specialty: 'Мастер резонанса и восстановления здоровья',
    bonusLabel: '+15% к исцелению за правильные ответы',
    baseAttack: 24,
    baseHp: 120,
  },
  {
    id: 'historian',
    name: 'Историк',
    element: 'terra',
    specialty: 'Стойкая защита и устойчивость к фазам босса',
    bonusLabel: '-20% входящего урона от контратак',
    baseAttack: 25,
    baseHp: 125,
  },
  {
    id: 'physicist',
    name: 'Физик',
    element: 'volta',
    specialty: 'Импульсные атаки с высоким критическим множителем',
    bonusLabel: '+25% к урону при серии из 2+ верных ответов',
    baseAttack: 30,
    baseHp: 105,
  },
];

/**
 * Чистая функция расчёта стихийного резонанса (packages/shared/src/elements.ts).
 */
export function calculateElementalResonance(
  attacker: ElementId,
  defender: ElementId
): { multiplier: number; label: string; relation: 'resonance' | 'neutral' | 'resistance' } {
  if (ELEMENTS[attacker].strongAgainst === defender) {
    return {
      multiplier: 1.5,
      label: 'Стихийный резонанс (×1.5)',
      relation: 'resonance',
    };
  }
  if (ELEMENTS[attacker].weakAgainst === defender) {
    return {
      multiplier: 0.8,
      label: 'Сопротивление стихии (×0.8)',
      relation: 'resistance',
    };
  }
  return {
    multiplier: 1.0,
    label: 'Нейтральный удар (×1.0)',
    relation: 'neutral',
  };
}

export const INITIAL_QUESTIONS: Question[] = [
  // Математика (Хронос)
  {
    id: 'q-math-1',
    element: 'chronos',
    difficulty: 1,
    prompt: 'Чему равен корень линейного уравнения?',
    formula: '3x - 7 = 14',
    options: ['x = 5', 'x = 7', 'x = 21', 'x = 6'],
    correctIndex: 1,
    explanation: 'Прибавим 7 к обеим частям: 3x = 21. Разделим на 3 и получим x = 7.',
  },
  {
    id: 'q-math-2',
    element: 'chronos',
    difficulty: 2,
    prompt: 'Катеты прямоугольного треугольника равны 6 см и 8 см. Найдите гипотенузу.',
    formula: 'c = √(a² + b²)',
    options: ['10 см', '12 см', '14 см', '9 см'],
    correctIndex: 0,
    explanation: 'По теореме Пифагора: 6² + 8² = 36 + 64 = 100. Квадратный корень из 100 равен 10 см.',
  },
  {
    id: 'q-math-3',
    element: 'chronos',
    difficulty: 2,
    prompt: 'В библиотеке 240 книг, из них 35% — учебники. Сколько учебников в библиотеке?',
    formula: '240 × 0.35',
    options: ['72 учебника', '84 учебника', '96 учебников', '68 учебников'],
    correctIndex: 1,
    explanation: '10% от 240 — это 24 книги. 30% = 72 книги, а 5% = 12 книг. В сумме 72 + 12 = 84.',
  },
  {
    id: 'q-math-4',
    element: 'chronos',
    difficulty: 3,
    prompt: 'Найдите сумму углов выпуклого пятиугольника.',
    formula: 'S = 180° × (n - 2)',
    options: ['360°', '540°', '720°', '450°'],
    correctIndex: 1,
    explanation: 'Для n = 5 формула даёт 180° × (5 − 2) = 180° × 3 = 540°.',
  },

  // Лингвистика (Эфир)
  {
    id: 'q-ling-1',
    element: 'ether',
    difficulty: 1,
    prompt: 'В каком слове на месте пропуска пишется буква «И»?',
    options: ['ц..плёнок', 'ц..фра', 'ц..ган', 'на ц..почках'],
    correctIndex: 1,
    explanation: 'В корне слова после «ц» пишется «и» (цифра). Слова цыплёнок, цыган и цыпочки — исключения.',
  },
  {
    id: 'q-ling-2',
    element: 'ether',
    difficulty: 2,
    prompt: 'Укажите предложение, в котором нужно поставить одну запятую.',
    options: [
      'Ветер стих и на небе показались первые звёзды.',
      'Мы собрали тетради и учебники.',
      'На рассвете роса блестела на траве и листьях.',
      'Ученик быстро решил задачу и записал ответ.',
    ],
    correctIndex: 0,
    explanation: 'Это сложносочинённое предложение с двумя грамматическими основами («ветер стих» и «показались звёзды»), соединёнными союзом «и».',
  },
  {
    id: 'q-ling-3',
    element: 'ether',
    difficulty: 2,
    prompt: 'Какой частью речи является слово «вследствие» в фразе: «Вследствие дождя поход перенесли»?',
    options: ['Наречие', 'Производный предлог', 'Союз', 'Существительное'],
    correctIndex: 1,
    explanation: 'Слово «вследствие» можно заменить предлогом «из-за», оно связывает слова в предложении — это производный предлог.',
  },
  {
    id: 'q-ling-4',
    element: 'ether',
    difficulty: 3,
    prompt: 'В каком варианте правильно указано ударение?',
    options: ['звОнит', 'красИвее', 'тОрты (неверно: тортЫ)', 'бАнты (неверно: бантЫ)'],
    correctIndex: 1,
    explanation: 'В сравнительной степени прилагательного «красивый» ударение сохраняется на корне: красИвее.',
  },

  // История (Терра)
  {
    id: 'q-hist-1',
    element: 'terra',
    difficulty: 1,
    prompt: 'Какое событие положило начало эпохе книгопечатания в Европе в XV веке?',
    options: [
      'Открытие Александрийской библиотеки',
      'Изобретение печатного станка Иоганном Гутенбергом',
      'Создание кириллицы Кириллом и Мефодием',
      'Издание первой газеты в Венеции',
    ],
    correctIndex: 1,
    explanation: 'Около 1440 года Иоганн Гутенберг создал наборный печатный станок с подвижными литерами.',
  },
  {
    id: 'q-hist-2',
    element: 'terra',
    difficulty: 2,
    prompt: 'В каком году состоялось первое кругосветное путешествие, возглавленное Фернаном Магелланом (начало экспедиции)?',
    options: ['1492 год', '1519 год', '1588 год', '1612 год'],
    correctIndex: 1,
    explanation: 'Экспедиция Магеллана отплыла из Севильи в 1519 году и завершилась под командованием Элькано в 1522 году.',
  },
  {
    id: 'q-hist-3',
    element: 'terra',
    difficulty: 2,
    prompt: 'Как называлась форма правления в Древних Афинах, при которой ключевые решения принимало народное собрание?',
    options: ['Олигархия', 'Демократия', 'Тирания', 'Диархия'],
    correctIndex: 1,
    explanation: 'Слово «демократия» происходит от греческих слов demos (народ) и kratos (власть).',
  },
  {
    id: 'q-hist-4',
    element: 'terra',
    difficulty: 3,
    prompt: 'Какой документ 1215 года в Англии впервые ограничил власть монарха законом?',
    options: [
      'Билль о правах',
      'Великая хартия вольностей',
      'Версальский трактат',
      'Эдикт о веротерпимости',
    ],
    correctIndex: 1,
    explanation: 'Великая хартия вольностей (Magna Carta) была подписана королём Иоанном Безземельным в 1215 году.',
  },

  // Физика (Вольта)
  {
    id: 'q-phys-1',
    element: 'volta',
    difficulty: 1,
    prompt: 'Автомобиль ехал 2 часа со скоростью 75 км/ч. Какое расстояние он преодолел?',
    formula: 's = v × t',
    options: ['150 км', '37.5 км', '140 км', '165 км'],
    correctIndex: 0,
    explanation: 'Расстояние равно произведению скорости на время: s = 75 км/ч × 2 ч = 150 км.',
  },
  {
    id: 'q-phys-2',
    element: 'volta',
    difficulty: 2,
    prompt: 'Какая физическая величина измеряется в омах (Ом)?',
    formula: 'R = U / I',
    options: ['Сила тока', 'Электрическое сопротивление', 'Напряжение', 'Мощность тока'],
    correctIndex: 1,
    explanation: 'По закону Ома сопротивление R = U / I измеряется в омах (Ом) в честь Георга Ома.',
  },
  {
    id: 'q-phys-3',
    element: 'volta',
    difficulty: 2,
    prompt: 'При переходе света из воздуха в стекло луч преломляется. Почему это происходит?',
    options: [
      'Изменяется скорость распространения света в новой среде',
      'Свет полностью поглощается поверхностью стекла',
      'Увеличивается частота световой волны',
      'Исчезает магнитная составляющая волны',
    ],
    correctIndex: 0,
    explanation: 'При переходе в оптически более плотную среду фазовая скорость света уменьшается, поэтому меняется направление луча.',
  },
  {
    id: 'q-phys-4',
    element: 'volta',
    difficulty: 3,
    prompt: 'Чему равна кинетическая энергия тела массой 4 кг, движущегося со скоростью 5 м/с?',
    formula: 'E = (m × v²) / 2',
    options: ['20 Дж', '50 Дж', '100 Дж', '40 Дж'],
    correctIndex: 1,
    explanation: 'Подставим значения: E = (4 × 5²) / 2 = (4 × 25) / 2 = 50 Дж.',
  },
];

export const INITIAL_QUESTS: Quest[] = [
  {
    id: 'quest-chronos-1',
    title: 'Тайна небесной астролябии',
    element: 'chronos',
    description: 'Настройте шестерни обсерватории с помощью уравнений, процентов и теоремы Пифагора.',
    questionIds: ['q-math-1', 'q-math-2', 'q-math-3', 'q-math-4'],
    rewardXp: 140,
    rewardCoins: 65,
    rewardBadge: 'Хранитель пропорций',
    assignedClass: '7 «А»',
  },
  {
    id: 'quest-ether-1',
    title: 'Свитки воздушного архива',
    element: 'ether',
    description: 'Восстановите утраченные манускрипты: орфография, пунктуация и точность ударений.',
    questionIds: ['q-ling-1', 'q-ling-2', 'q-ling-3', 'q-ling-4'],
    rewardXp: 130,
    rewardCoins: 60,
    rewardBadge: 'Мастер синтаксиса',
    assignedClass: '7 «А»',
  },
  {
    id: 'quest-terra-1',
    title: 'Компас древних цивилизаций',
    element: 'terra',
    description: 'Сопоставьте ключевые вехи истории от античных полисов до эпохи великих открытий.',
    questionIds: ['q-hist-1', 'q-hist-2', 'q-hist-3', 'q-hist-4'],
    rewardXp: 135,
    rewardCoins: 60,
    rewardBadge: 'Летописец эпох',
    assignedClass: '7 «Б»',
  },
  {
    id: 'quest-volta-1',
    title: 'Резонанс башни Вольты',
    element: 'volta',
    description: 'Запустите конденсаторы цитадели, решив задачи на движение, оптику и энергию.',
    questionIds: ['q-phys-1', 'q-phys-2', 'q-phys-3', 'q-phys-4'],
    rewardXp: 150,
    rewardCoins: 75,
    rewardBadge: 'Инженер импульса',
    assignedClass: '7 «А»',
  },
];

export const BOSS_CONFIGS: BossConfig[] = [
  {
    id: 'boss-chrono-golem',
    name: 'Хроно-Голем Архитектор',
    title: 'Страж рассогласованного времени',
    element: 'chronos',
    weakness: 'ether',
    maxHp: 180,
    baseDamage: 18,
    imageUrl: '/src/assets/images/boss_chrono_golem_1794735120365.jpg',
    phases: [
      {
        phase: 1,
        title: 'Фаза I · Щит Точности',
        hpThresholdPercent: 100,
        mechanicNote: 'Босс проверяет базовые расчёты. Стихия Эфира наносит ×1.5 урона.',
      },
      {
        phase: 2,
        title: 'Фаза II · Резонанс Времени',
        hpThresholdPercent: 60,
        mechanicNote: 'Шестерни ускоряются: контратаки босса усиливаются на 25%.',
      },
      {
        phase: 3,
        title: 'Фаза III · Финальный Разлом',
        hpThresholdPercent: 25,
        mechanicNote: 'Последний барьер! Серия из 2 верных ответов пробивает защиту.',
      },
    ],
  },
];

export const SKIN_SHOP_CATALOG: ShopSkinItem[] = [
  {
    id: 'skin-starter-scholar',
    name: 'Академическая мантия',
    category: 'Костюм',
    element: 'chronos',
    price: 0,
    description: 'Классическая форма ученика Хроноакадемии с медными застёжками.',
    patch: { outfitStyle: 'scholar', outfitColor: '#1E3A8A' },
  },
  {
    id: 'skin-glasses-archivist',
    name: 'Очки архивариуса',
    category: 'Аксессуар',
    element: 'ether',
    price: 45,
    description: 'Тонкая латунная оправа для чтения парящих свитков.',
    patch: { accessory: 'glasses' },
  },
  {
    id: 'skin-warden-volta',
    name: 'Костюм хранителя Вольты',
    category: 'Костюм',
    element: 'volta',
    price: 90,
    description: 'Изолированный плащ исследователя электрических разрядов.',
    patch: { outfitStyle: 'warden', outfitColor: '#0369A1' },
  },
  {
    id: 'skin-astrolabe-amulet',
    name: 'Нагрудная астролябия',
    category: 'Аксессуар',
    element: 'chronos',
    price: 110,
    description: 'Миниатюрный механизм с золотыми кольцами стихии Хроноса.',
    patch: { accessory: 'astrolabe' },
  },
  {
    id: 'skin-alchemist-terra',
    name: 'Облачение летописца',
    category: 'Костюм',
    element: 'terra',
    price: 120,
    description: 'Укреплённый камзол для экспедиций в Амфитеатр Терры.',
    patch: { outfitStyle: 'alchemist', outfitColor: '#92400E' },
  },
  {
    id: 'skin-crown-ether',
    name: 'Венец ясной речи',
    category: 'Аксессуар',
    element: 'ether',
    price: 150,
    description: 'Лёгкая изумрудная диадема мастеров Библиотеки Эфира.',
    patch: { accessory: 'crown' },
  },
  {
    id: 'skin-reward-navigator',
    name: 'Мундир первооткрывателя',
    category: 'Костюм',
    element: 'chronos',
    price: 0,
    description: 'Парадный мундир с тёмным жилетом за освоение всех четырёх стихий.',
    patch: { outfitStyle: 'navigator', outfitColor: '#1E293B' },
    exclusiveNote: 'Награда за достижение «Исследователь четырёх стихий»',
  },
  {
    id: 'skin-reward-scarf',
    name: 'Шарф дуэлянта арены',
    category: 'Аксессуар',
    element: 'volta',
    price: 0,
    description: 'Отличительный шарф победителя дуэлей на арене Хроноакадемии.',
    patch: { accessory: 'scarf' },
    exclusiveNote: 'Награда за достижение «Мастер арены»',
  },
];

export const DEFAULT_PLAYER_PROFILE: PlayerProfile = {
  name: 'Алиса Воронцова',
  classId: 'mathematician',
  level: 4,
  xp: 220,
  xpToNext: 400,
  coins: 140,
  streakDays: 5,
  soundEnabled: true,
  appearance: {
    skinTone: '#F3D2B3',
    hairStyle: 'bob',
    hairColor: '#3B2F2F',
    outfitStyle: 'scholar',
    outfitColor: '#1E3A8A',
    accessory: 'none',
  },
  ownedItemIds: ['skin-starter-scholar'],
  equippedItemIds: ['skin-starter-scholar'],
  completedQuestIds: ['quest-chronos-1'],
  elementMastery: {
    chronos: 72,
    ether: 48,
    terra: 35,
    volta: 58,
  },
  bossesDefeated: 0,
  pvpWins: 0,
  pvpRating: 1000,
  perfectQuestsCount: 0,
  unlockedAchievementIds: ['ach-first-quest'],
};

export function getPvpRank(rating: number): {
  title: string;
  nextTitle: string | null;
  nextRating: number | null;
} {
  if (rating >= 1300) {
    return { title: 'Грандмастер арены', nextTitle: null, nextRating: null };
  }
  if (rating >= 1150) {
    return { title: 'Мастер арены', nextTitle: 'Грандмастер арены', nextRating: 1300 };
  }
  if (rating >= 1050) {
    return { title: 'Ученик-дуэлянт', nextTitle: 'Мастер арены', nextRating: 1150 };
  }
  return { title: 'Новичок арены', nextTitle: 'Ученик-дуэлянт', nextRating: 1050 };
}

export const ACHIEVEMENTS: import('../types/game').AchievementDefinition[] = [
  {
    id: 'ach-first-quest',
    title: 'Первый шаг в науке',
    description: 'Завершите первый учебный квест на Карте миров.',
    category: 'quests',
    criteriaLabel: 'Пройдено квестов',
    targetValue: 1,
    rewardCoins: 50,
    getProgress: (p) => p.completedQuestIds.length,
  },
  {
    id: 'ach-all-biomes',
    title: 'Исследователь четырёх стихий',
    description: 'Пройдите хотя бы по одному квесту в каждом из четырёх предметов.',
    category: 'quests',
    criteriaLabel: 'Изучено биомов',
    targetValue: 4,
    rewardCoins: 150,
    rewardSkinId: 'skin-reward-navigator',
    getProgress: (p, quests) => {
      const doneElements = new Set(
        quests
          .filter((q) => p.completedQuestIds.includes(q.id))
          .map((q) => q.element)
      );
      return doneElements.size;
    },
  },
  {
    id: 'ach-perfect-scholar',
    title: 'Безупречная точность',
    description: 'Завершите 2 квеста без единой ошибки в ответах.',
    category: 'mastery',
    criteriaLabel: 'Безупречных квестов',
    targetValue: 2,
    rewardCoins: 100,
    getProgress: (p) => p.perfectQuestsCount,
  },
  {
    id: 'ach-boss-slayer',
    title: 'Покоритель Хроно-Голема',
    description: 'Одержите первую победу над боссом в режиме PvE.',
    category: 'pve',
    criteriaLabel: 'Побед над боссами',
    targetValue: 1,
    rewardCoins: 120,
    getProgress: (p) => p.bossesDefeated,
  },
  {
    id: 'ach-boss-veteran',
    title: 'Хранитель равновесия',
    description: 'Победите боссов 3 раза, используя стихийные резонансы.',
    category: 'pve',
    criteriaLabel: 'Побед над боссами',
    targetValue: 3,
    rewardCoins: 200,
    getProgress: (p) => p.bossesDefeated,
  },
  {
    id: 'ach-pvp-first',
    title: 'Первая победа в дуэли',
    description: 'Выиграйте поединок против другого академика в режиме PvP.',
    category: 'pvp',
    criteriaLabel: 'Побед в PvP',
    targetValue: 1,
    rewardCoins: 80,
    getProgress: (p) => p.pvpWins,
  },
  {
    id: 'ach-pvp-rank',
    title: 'Мастер арены',
    description: 'Достигните PvP-ранга «Мастер арены» (1150 рейтинга).',
    category: 'pvp',
    criteriaLabel: 'Рейтинг PvP',
    targetValue: 1150,
    rewardCoins: 160,
    rewardSkinId: 'skin-reward-scarf',
    getProgress: (p) => p.pvpRating,
  },
  {
    id: 'ach-collector',
    title: 'Гардероб исследователя',
    description: 'Соберите 3 предмета экипировки и аксессуара в коллекции.',
    category: 'mastery',
    criteriaLabel: 'Предметов в коллекции',
    targetValue: 3,
    rewardCoins: 90,
    getProgress: (p) => p.ownedItemIds.length,
  },
];

export function evaluateAchievements(
  profile: PlayerProfile,
  quests: Quest[]
): {
  newlyUnlocked: import('../types/game').AchievementDefinition[];
  bonusCoins: number;
  unlockedSkinIds: string[];
} {
  const newlyUnlocked = ACHIEVEMENTS.filter((ach) => {
    if (profile.unlockedAchievementIds.includes(ach.id)) return false;
    return ach.getProgress(profile, quests) >= ach.targetValue;
  });

  const bonusCoins = newlyUnlocked.reduce((sum, a) => sum + a.rewardCoins, 0);
  const unlockedSkinIds = newlyUnlocked
    .map((a) => a.rewardSkinId)
    .filter((id): id is string => Boolean(id));

  return { newlyUnlocked, bonusCoins, unlockedSkinIds };
}

export const INITIAL_CLASS_ROSTER: StudentRecord[] = [
  {
    id: 'st-1',
    name: 'Алиса Воронцова',
    className: '7 «А»',
    classId: 'mathematician',
    level: 4,
    accuracyPercent: 88,
    completedQuests: 3,
    weakestElement: 'terra',
    recentMistakeTopic: 'Даты кругосветных экспедиций XVI века',
  },
  {
    id: 'st-2',
    name: 'Максим Соколов',
    className: '7 «А»',
    classId: 'physicist',
    level: 5,
    accuracyPercent: 91,
    completedQuests: 4,
    weakestElement: 'ether',
    recentMistakeTopic: 'Запятые в сложносочинённых предложениях',
  },
  {
    id: 'st-3',
    name: 'Дарья Морозова',
    className: '7 «А»',
    classId: 'linguist',
    level: 3,
    accuracyPercent: 79,
    completedQuests: 2,
    weakestElement: 'volta',
    recentMistakeTopic: 'Формула кинетической энергии',
  },
  {
    id: 'st-4',
    name: 'Артём Кузнецов',
    className: '7 «Б»',
    classId: 'historian',
    level: 4,
    accuracyPercent: 84,
    completedQuests: 3,
    weakestElement: 'chronos',
    recentMistakeTopic: 'Сумма углов выпуклых многоугольников',
  },
  {
    id: 'st-5',
    name: 'София Лебедева',
    className: '7 «А»',
    classId: 'linguist',
    level: 4,
    accuracyPercent: 93,
    completedQuests: 4,
    weakestElement: 'chronos',
    recentMistakeTopic: 'Процентные соотношения',
  },
];

export const ARCHITECTURE_STAGES = [
  {
    stage: 'Этап 1',
    title: 'Фундамент и инфраструктура',
    duration: '4–6 недель',
    summary: 'Монорепозиторий, Docker multi-stage сборки, Traefik TLS, PostgreSQL, Redis, Garage S3.',
  },
  {
    stage: 'Этап 2',
    title: 'Ядро RPG и персонажи',
    duration: '6–8 недель',
    summary: 'Аутентификация, модели User/Character/Element/Inventory, генерация базовых скинов.',
  },
  {
    stage: 'Этап 3',
    title: 'Контент и прогрессия',
    duration: '8–10 недель',
    summary: 'Квесты, мгновенная обратная связь без штрафов, разбор ошибок и кабинет учителя.',
  },
  {
    stage: 'Этап 4',
    title: 'Боевая система и PvP',
    duration: '8–10 недель',
    summary: 'Комнаты Colyseus, стихийные резонансы, 3-фазные боссы и 2D-сцена на PixiJS 8.',
  },
  {
    stage: 'Этап 5',
    title: 'Кастомизация и магазин',
    duration: '4–6 недель',
    summary: 'Магазин скинов за игровую валюту, редактор внешности и хранение ассетов в Garage S3.',
  },
  {
    stage: 'Этап 6',
    title: 'Тестирование и запуск',
    duration: '4–6 недель',
    summary: 'E2E-тесты Playwright, нагрузочные тесты Colyseus, Grafana/Sentry и пилотный класс.',
  },
];
