import { useEffect, useState, FormEvent, ChangeEvent } from 'react';
import {
  Plus,
  CheckCircle2,
  Sparkles,
  Upload,
  Trash2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { ElementId, Question, Quest, StudentRecord } from '../types/game';
import { CHARACTER_CLASSES, ELEMENT_LIST, ELEMENTS } from '../data/gameData';

interface TeacherCabinetViewProps {
  questions: Question[];
  quests: Quest[];
  roster: StudentRecord[];
  onAddQuestion: (q: Question) => void;
  onAddQuest: (quest: Quest) => void;
}

interface UploadedMaterial {
  name: string;
  mimeType: string;
  data: string; // base64 for binary (PDF/image) or raw text for text files
  isText: boolean;
}

export function TeacherCabinetView({
  questions,
  quests,
  roster,
  onAddQuestion,
  onAddQuest,
}: TeacherCabinetViewProps) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'ai' | 'question' | 'quest'>(
    'analytics'
  );
  const [classFilter, setClassFilter] = useState<'all' | '7 «А»' | '7 «Б»'>('all');

  // Question builder state
  const [qElement, setQElement] = useState<ElementId>('chronos');
  const [qDifficulty, setQDifficulty] = useState<1 | 2 | 3>(1);
  const [qPrompt, setQPrompt] = useState('');
  const [qFormula, setQFormula] = useState('');
  const [qOptions, setQOptions] = useState(['', '', '', '']);
  const [qCorrectIndex, setQCorrectIndex] = useState(0);
  const [qExplanation, setQExplanation] = useState('');
  const [questionSaved, setQuestionSaved] = useState(false);

  // Quest builder state
  const [questTitle, setQuestTitle] = useState('');
  const [questElement, setQuestElement] = useState<ElementId>('chronos');
  const [questDescription, setQuestDescription] = useState('');
  const [questClass, setQuestClass] = useState('7 «А»');
  const [questXp, setQuestXp] = useState(140);
  const [questCoins, setQuestCoins] = useState(60);
  const [selectedQIds, setSelectedQIds] = useState<string[]>([]);
  const [questSaved, setQuestSaved] = useState(false);

  // AI Content Assistant state
  const [aiElement, setAiElement] = useState<ElementId>('chronos');
  const [aiDifficulty, setAiDifficulty] = useState<'1' | '2' | '3' | 'mixed'>('mixed');
  const [aiCount, setAiCount] = useState<number>(3);
  const [aiTopic, setAiTopic] = useState('');
  const [aiMaterialText, setAiMaterialText] = useState('');
  const [aiUploadedFile, setAiUploadedFile] = useState<UploadedMaterial | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiDrafts, setAiDrafts] = useState<Question[]>([]);
  const [aiAddedMessage, setAiAddedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!aiLoading) {
      setAiProgress(0);
      return;
    }
    setAiProgress(12);
    const interval = setInterval(() => {
      setAiProgress((prev) => {
        if (prev >= 92) return 92;
        const step = prev < 45 ? 11 : prev < 75 ? 6 : 2;
        return Math.min(92, prev + step);
      });
    }, 320);
    return () => clearInterval(interval);
  }, [aiLoading]);

  const filteredRoster =
    classFilter === 'all' ? roster : roster.filter((s) => s.className === classFilter);

  const avgAccuracy =
    filteredRoster.length > 0
      ? Math.round(
          filteredRoster.reduce((acc, s) => acc + s.accuracyPercent, 0) /
            filteredRoster.length
        )
      : 0;

  const handleCreateQuestion = (e: FormEvent) => {
    e.preventDefault();
    if (!qPrompt.trim() || qOptions.some((o) => !o.trim()) || !qExplanation.trim()) return;

    const newQ: Question = {
      id: `q-custom-${Date.now()}`,
      element: qElement,
      difficulty: qDifficulty,
      prompt: qPrompt.trim(),
      formula: qFormula.trim() || undefined,
      options: qOptions.map((o) => o.trim()),
      correctIndex: qCorrectIndex,
      explanation: qExplanation.trim(),
      author: 'Учитель',
    };

    onAddQuestion(newQ);
    setQPrompt('');
    setQFormula('');
    setQOptions(['', '', '', '']);
    setQExplanation('');
    setQuestionSaved(true);
    setTimeout(() => setQuestionSaved(false), 2500);
  };

  const handleCreateQuest = (e: FormEvent) => {
    e.preventDefault();
    if (!questTitle.trim() || !questDescription.trim() || selectedQIds.length === 0) return;

    const newQuest: Quest = {
      id: `quest-custom-${Date.now()}`,
      title: questTitle.trim(),
      element: questElement,
      description: questDescription.trim(),
      questionIds: selectedQIds,
      rewardXp: questXp,
      rewardCoins: questCoins,
      rewardBadge: 'Авторский квест',
      assignedClass: questClass,
    };

    onAddQuest(newQuest);
    setQuestTitle('');
    setQuestDescription('');
    setSelectedQIds([]);
    setQuestSaved(true);
    setTimeout(() => setQuestSaved(false), 2500);
  };

  const toggleQuestionForQuest = (id: string) => {
    setSelectedQIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAiError(null);

    if (file.size > 8 * 1024 * 1024) {
      setAiError('Размер файла не должен превышать 8 МБ.');
      return;
    }

    const isTextLike =
      file.type.startsWith('text/') ||
      file.name.endsWith('.txt') ||
      file.name.endsWith('.md') ||
      file.name.endsWith('.csv');

    const reader = new FileReader();
    if (isTextLike) {
      reader.onload = () => {
        const text = typeof reader.result === 'string' ? reader.result : '';
        setAiUploadedFile({
          name: file.name,
          mimeType: file.type || 'text/plain',
          data: text,
          isText: true,
        });
      };
      reader.readAsText(file);
    } else {
      reader.onload = () => {
        const result = typeof reader.result === 'string' ? reader.result : '';
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        setAiUploadedFile({
          name: file.name,
          mimeType: file.type || 'application/pdf',
          data: base64,
          isText: false,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateWithAi = async (e: FormEvent) => {
    e.preventDefault();
    setAiError(null);
    setAiAddedMessage(null);

    if (!aiTopic.trim() && !aiMaterialText.trim() && !aiUploadedFile) {
      setAiError('Введите тему урока, вставьте текст или загрузите учебный файл.');
      return;
    }

    setAiLoading(true);
    try {
      const combinedMaterial = [
        aiMaterialText.trim(),
        aiUploadedFile?.isText ? `Материал из файла (${aiUploadedFile.name}):\n${aiUploadedFile.data}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');

      const response = await fetch('/api/ai/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          element: aiElement,
          difficulty: aiDifficulty,
          count: aiCount,
          topic: aiTopic.trim(),
          studyMaterial: combinedMaterial,
          fileData:
            aiUploadedFile && !aiUploadedFile.isText
              ? {
                  name: aiUploadedFile.name,
                  mimeType: aiUploadedFile.mimeType,
                  data: aiUploadedFile.data,
                }
              : undefined,
        }),
      });

      const data = (await response.json()) as { questions?: Question[]; error?: string };
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Не удалось выполнить запрос к серверу генерации.');
      }

      setAiProgress(100);
      setAiDrafts(data.questions ?? []);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Ошибка генерации вопросов.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleUpdateDraft = (idx: number, patch: Partial<Question>) => {
    setAiDrafts((prev) => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)));
  };

  const handleSaveSingleDraft = (draft: Question, idx: number) => {
    onAddQuestion(draft);
    setAiDrafts((prev) => prev.filter((_, i) => i !== idx));
    setAiAddedMessage(`Вопрос «${draft.prompt.slice(0, 40)}...» добавлен в банк.`);
  };

  const handleSaveAllDrafts = () => {
    if (aiDrafts.length === 0) return;
    aiDrafts.forEach((d) => onAddQuestion(d));
    setAiAddedMessage(`Добавлено вопросов в банк: ${aiDrafts.length}.`);
    setAiDrafts([]);
  };

  const handleSaveAndCreateQuest = () => {
    if (aiDrafts.length === 0) return;
    aiDrafts.forEach((d) => onAddQuestion(d));
    const newQuest: Quest = {
      id: `quest-ai-${Date.now()}`,
      title: aiTopic.trim() ? `Квест: ${aiTopic.trim()}` : `Квест по предмету ${ELEMENTS[aiElement].subject}`,
      element: aiElement,
      description: 'Учебный квест, подготовленный с помощью ИИ-ассистента преподавателя.',
      questionIds: aiDrafts.map((d) => d.id),
      rewardXp: aiDrafts.length * 45,
      rewardCoins: aiDrafts.length * 20,
      rewardBadge: 'Новый модуль',
      assignedClass: '7 «А»',
    };
    onAddQuest(newQuest);
    setAiAddedMessage(`Создан и опубликован на карте квест «${newQuest.title}».`);
    setAiDrafts([]);
  };

  const elementQuestions = questions.filter((q) => q.element === questElement);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Управление учебным контентом · ИИ-генерация и аналитика класса
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold text-slate-900">
            Кабинет учителя
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-200/70 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`rounded-md px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'analytics'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Результаты класса
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'ai'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" /> ИИ-ассистент
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('question')}
            className={`rounded-md px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'question'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Создать вопрос
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quest')}
            className={`rounded-md px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'quest'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Назначить квест
          </button>
        </div>
      </div>

      {/* Top KPI summary row */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Учеников в выборке</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
            {filteredRoster.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Средняя точность</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-emerald-700 tabular-nums">
            {avgAccuracy}%
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Вопросов в банке</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
            {questions.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Активных квестов</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-blue-700 tabular-nums">
            {quests.length}
          </p>
        </div>
      </div>

      {activeTab === 'analytics' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900">
                Прогресс учеников и типичные ошибки
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Данные обновляются по итогам прохождения квестов и боевых арен
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                {(['all', '7 «А»', '7 «Б»'] as const).map((cls) => (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setClassFilter(cls)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      classFilter === cls
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {cls === 'all' ? 'Все классы' : cls}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('ai')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 whitespace-nowrap shrink-0"
              >
                <Sparkles className="h-3.5 w-3.5" /> Генератор вопросов с ИИ
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                  <th className="py-3 pr-4">Ученик</th>
                  <th className="py-3 px-4">Класс</th>
                  <th className="py-3 px-4">Специализация</th>
                  <th className="py-3 px-4 text-right">Уровень</th>
                  <th className="py-3 px-4 text-right">Квесты</th>
                  <th className="py-3 px-4 text-right">Точность</th>
                  <th className="py-3 pl-4">Тема для повторения</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRoster.map((st) => {
                  const clsMeta =
                    CHARACTER_CLASSES.find((c) => c.id === st.classId) ?? CHARACTER_CLASSES[0];
                  return (
                    <tr key={st.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 pr-4 font-semibold text-slate-900">{st.name}</td>
                      <td className="py-3.5 px-4 text-slate-600">{st.className}</td>
                      <td className="py-3.5 px-4 text-slate-600">{clsMeta.name}</td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-900">
                        {st.level}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-900">
                        {st.completedQuests}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold tabular-nums text-emerald-700">
                        {st.accuracyPercent}%
                      </td>
                      <td className="py-3.5 pl-4 text-slate-600">
                        {ELEMENTS[st.weakestElement].subject}: {st.recentMistakeTopic}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="space-y-6">
          <form
            onSubmit={handleGenerateWithAi}
            className="rounded-2xl border border-slate-200 bg-white p-8"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-bold text-slate-900">
                  ИИ-ассистент для генерации учебных материалов
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Укажите тему или загрузите учебный материал (конспект, TXT, Markdown, PDF или фото страницы), чтобы сформировать вопросы с ответами и пояснениями.
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Предмет и стихия
                </label>
                <select
                  value={aiElement}
                  onChange={(e) => setAiElement(e.target.value as ElementId)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                >
                  {ELEMENT_LIST.map((el) => (
                    <option key={el.id} value={el.id}>
                      {el.subject} ({el.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Уровень сложности
                </label>
                <select
                  value={aiDifficulty}
                  onChange={(e) =>
                    setAiDifficulty(e.target.value as '1' | '2' | '3' | 'mixed')
                  }
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                >
                  <option value="mixed">Смешанная (1–3)</option>
                  <option value="1">1 · Базовый</option>
                  <option value="2">2 · Средний</option>
                  <option value="3">3 · Повышенный</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Количество вопросов
                </label>
                <select
                  value={aiCount}
                  onChange={(e) => setAiCount(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                >
                  <option value={2}>2 вопроса</option>
                  <option value={3}>3 вопроса</option>
                  <option value={4}>4 вопроса</option>
                  <option value={5}>5 вопросов</option>
                </select>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Тема урока или учебная задача
                </label>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-400">Примеры:</span>
                  {[
                    { label: 'Теорема Пифагора', el: 'chronos' as ElementId },
                    { label: 'Сложносочинённые предложения', el: 'ether' as ElementId },
                    { label: 'Великие открытия XVI века', el: 'terra' as ElementId },
                    { label: 'Закон Ома', el: 'volta' as ElementId },
                  ].map((sample) => (
                    <button
                      key={sample.label}
                      type="button"
                      onClick={() => {
                        setAiElement(sample.el);
                        setAiTopic(sample.label);
                      }}
                      className="font-medium text-blue-700 hover:text-blue-800 hover:underline whitespace-nowrap shrink-0"
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="text"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="Например: Закон Ома для участка цепи, или Великие географические открытия"
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700">
                Текст учебного материала, конспекта или параграфа
              </label>
              <textarea
                rows={4}
                value={aiMaterialText}
                onChange={(e) => setAiMaterialText(e.target.value)}
                placeholder="Вставьте тему, фрагмент учебника, заметки к уроку или список правил — ИИ предложит вопросы, варианты ответов и объяснения..."
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700">
                Загрузить учебный файл (.txt, .md, .pdf, .png, .jpg)
              </label>
              <div className="mt-1.5 flex flex-wrap items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100">
                  <Upload className="h-4 w-4" />
                  Выбрать файл
                  <input
                    type="file"
                    accept=".txt,.md,.csv,.pdf,image/png,image/jpeg,image/webp"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {aiUploadedFile && (
                  <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700">
                    <span>{aiUploadedFile.name}</span>
                    <button
                      type="button"
                      onClick={() => setAiUploadedFile(null)}
                      aria-label="Удалить загруженный файл"
                      className="text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {aiError && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{aiError}</span>
              </div>
            )}

            {aiAddedMessage && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-800">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{aiAddedMessage}</span>
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-5">
              <span className="text-xs text-slate-500">
                {aiLoading
                  ? aiProgress < 40
                    ? 'Анализ темы и учебного материала...'
                    : aiProgress < 75
                      ? 'Формирование вопросов и вариантов ответа...'
                      : 'Подготовка формул и разбора ошибок...'
                  : 'ИИ сформирует вопросы, варианты ответа и подробные объяснения'}
              </span>
              <button
                type="submit"
                disabled={aiLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-wait disabled:bg-blue-500 whitespace-nowrap shrink-0"
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Генерация... {aiProgress}%
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Сгенерировать
                  </>
                )}
              </button>
            </div>
          </form>

          {aiLoading && (
            <div
              className="rounded-2xl border border-slate-200 bg-white p-8"
              aria-live="polite"
              aria-busy="true"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {aiProgress < 40
                        ? 'Этап 1 из 3 · Анализ темы и учебного материала'
                        : aiProgress < 75
                          ? 'Этап 2 из 3 · Генерация вопросов и вариантов ответа'
                          : 'Этап 3 из 3 · Составление пояснений для разбора ошибок'}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Подготавливаем {aiCount} заданий по предмету «{ELEMENTS[aiElement].subject}»
                    </p>
                  </div>
                </div>
                <span className="font-mono text-sm font-semibold text-blue-700 tabular-nums">
                  {aiProgress}%
                </span>
              </div>

              <div
                className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100"
                role="progressbar"
                aria-valuenow={aiProgress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Прогресс генерации учебных вопросов"
              >
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${aiProgress}%` }}
                />
              </div>

              <div className="mt-6 space-y-4">
                {Array.from({ length: aiCount }).map((_, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="h-3 w-36 animate-pulse rounded bg-slate-200" />
                    <div className="mt-3 h-5 w-3/4 animate-pulse rounded bg-slate-200" />
                    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div className="h-8 animate-pulse rounded-lg bg-slate-200/80" />
                      <div className="h-8 animate-pulse rounded-lg bg-slate-200/80" />
                      <div className="h-8 animate-pulse rounded-lg bg-slate-200/80" />
                      <div className="h-8 animate-pulse rounded-lg bg-slate-200/80" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!aiLoading && aiDrafts.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                  <h3 className="font-display text-xl font-bold text-slate-900">
                    Предпросмотр сгенерированных заданий ({aiDrafts.length})
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    При необходимости отредактируйте текст перед добавлением в банк или создайте готовый квест
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleSaveAllDrafts}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
                  >
                    Добавить все в банк
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAndCreateQuest}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 whitespace-nowrap shrink-0"
                  >
                    Создать квест для 7 «А»
                  </button>
                </div>
              </div>

              <div className="space-y-5">
                {aiDrafts.map((draft, idx) => (
                  <div
                    key={draft.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs font-medium text-slate-500">
                        Вопрос {idx + 1} · {ELEMENTS[draft.element].subject} · Сложность{' '}
                        {draft.difficulty}
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleSaveSingleDraft(draft, idx)}
                          className="text-xs font-semibold text-blue-700 hover:text-blue-800 whitespace-nowrap shrink-0"
                        >
                          Добавить в банк
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setAiDrafts((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="text-xs font-medium text-slate-500 hover:text-red-600 whitespace-nowrap shrink-0"
                        >
                          Удалить
                        </button>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={draft.prompt}
                      onChange={(e) => handleUpdateDraft(idx, { prompt: e.target.value })}
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                    />

                    {draft.formula !== undefined && (
                      <input
                        type="text"
                        value={draft.formula}
                        onChange={(e) => handleUpdateDraft(idx, { formula: e.target.value })}
                        placeholder="Формула"
                        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
                      />
                    )}

                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {draft.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`draft-correct-${draft.id}`}
                            checked={draft.correctIndex === optIdx}
                            onChange={() => handleUpdateDraft(idx, { correctIndex: optIdx })}
                            className="h-4 w-4 accent-blue-600"
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const nextOpts = [...draft.options];
                              nextOpts[optIdx] = e.target.value;
                              handleUpdateDraft(idx, { options: nextOpts });
                            }}
                            className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                          />
                        </div>
                      ))}
                    </div>

                    <textarea
                      rows={2}
                      value={draft.explanation}
                      onChange={(e) =>
                        handleUpdateDraft(idx, { explanation: e.target.value })
                      }
                      className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'question' && (
        <form
          onSubmit={handleCreateQuestion}
          className="rounded-2xl border border-slate-200 bg-white p-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900">
                Новый учебный вопрос
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Добавленный вопрос сразу становится доступен в конструкторе квестов и в боях выбранной стихии.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('ai')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-blue-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              <Sparkles className="h-3.5 w-3.5" /> Сгенерировать с помощью ИИ
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Предмет и стихия
              </label>
              <select
                value={qElement}
                onChange={(e) => setQElement(e.target.value as ElementId)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              >
                {ELEMENT_LIST.map((el) => (
                  <option key={el.id} value={el.id}>
                    {el.subject} ({el.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Сложность (1–3)
              </label>
              <select
                value={qDifficulty}
                onChange={(e) => setQDifficulty(Number(e.target.value) as 1 | 2 | 3)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              >
                <option value={1}>1 · Базовый уровень</option>
                <option value={2}>2 · Средний уровень</option>
                <option value={3}>3 · Повышенная сложность</option>
              </select>
            </div>
          </div>

          <div className="mt-5">
            <label className="block text-xs font-semibold text-slate-700">
              Текст вопроса
            </label>
            <textarea
              required
              rows={2}
              value={qPrompt}
              onChange={(e) => setQPrompt(e.target.value)}
              placeholder="Например: Чему равна сумма внутренних углов треугольника?"
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="mt-4">
            <label className="block text-xs font-semibold text-slate-700">
              Формула или выражение (необязательно)
            </label>
            <input
              type="text"
              value={qFormula}
              onChange={(e) => setQFormula(e.target.value)}
              placeholder="Например: α + β + γ = ?"
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 font-mono text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold text-slate-700">
              Варианты ответа (отметьте правильный)
            </p>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {qOptions.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correctOption"
                    checked={qCorrectIndex === idx}
                    onChange={() => setQCorrectIndex(idx)}
                    aria-label={`Правильный вариант ${idx + 1}`}
                    className="h-4 w-4 accent-blue-600"
                  />
                  <input
                    type="text"
                    required
                    value={opt}
                    onChange={(e) => {
                      const next = [...qOptions];
                      next[idx] = e.target.value;
                      setQOptions(next);
                    }}
                    placeholder={`Вариант ${idx + 1}`}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <label className="block text-xs font-semibold text-slate-700">
              Объяснение для разбора ошибок
            </label>
            <textarea
              required
              rows={2}
              value={qExplanation}
              onChange={(e) => setQExplanation(e.target.value)}
              placeholder="Поясните ученику ход решения — оно отобразится сразу после ответа."
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="mt-6 flex items-center justify-between gap-4 border-t border-slate-200 pt-5">
            {questionSaved ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                <CheckCircle2 className="h-4 w-4" /> Вопрос добавлен в банк заданий
              </span>
            ) : (
              <span className="text-xs text-slate-500">Все поля сохраняются в текущей сессии</span>
            )}
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 whitespace-nowrap shrink-0"
            >
              <Plus className="h-4 w-4" /> Сохранить вопрос
            </button>
          </div>
        </form>
      )}

      {activeTab === 'quest' && (
        <form
          onSubmit={handleCreateQuest}
          className="rounded-2xl border border-slate-200 bg-white p-8"
        >
          <h2 className="font-display text-xl font-bold text-slate-900">
            Конструктор и назначение квеста классу
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Сгруппируйте вопросы в учебный квест — он сразу появится на Карте миров ученика.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Название квеста
              </label>
              <input
                type="text"
                required
                value={questTitle}
                onChange={(e) => setQuestTitle(e.target.value)}
                placeholder="Например: Пропорции и геометрия звёзд"
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Предмет</label>
                <select
                  value={questElement}
                  onChange={(e) => {
                    setQuestElement(e.target.value as ElementId);
                    setSelectedQIds([]);
                  }}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                >
                  {ELEMENT_LIST.map((el) => (
                    <option key={el.id} value={el.id}>
                      {el.subject}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Класс</label>
                <select
                  value={questClass}
                  onChange={(e) => setQuestClass(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                >
                  <option value="7 «А»">7 «А»</option>
                  <option value="7 «Б»">7 «Б»</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-semibold text-slate-700">
              Краткое описание задания
            </label>
            <input
              type="text"
              required
              value={questDescription}
              onChange={(e) => setQuestDescription(e.target.value)}
              placeholder="Что ученику предстоит повторить в этом квесте"
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 sm:max-w-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Награда XP</label>
              <input
                type="number"
                min={20}
                max={500}
                value={questXp}
                onChange={(e) => setQuestXp(Number(e.target.value))}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Монеты</label>
              <input
                type="number"
                min={10}
                max={300}
                value={questCoins}
                onChange={(e) => setQuestCoins(Number(e.target.value))}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900"
              />
            </div>
          </div>

          <div className="mt-6">
            <p className="text-xs font-semibold text-slate-700">
              Выберите вопросы по предмету ({ELEMENTS[questElement].subject}): выбрано{' '}
              {selectedQIds.length}
            </p>
            <div className="mt-2.5 max-h-60 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-3">
              {elementQuestions.map((q) => {
                const checked = selectedQIds.includes(q.id);
                return (
                  <label
                    key={q.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors ${
                      checked ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleQuestionForQuest(q.id)}
                      className="mt-0.5 h-4 w-4 accent-blue-600"
                    />
                    <span>
                      <span className="font-medium text-slate-900">{q.prompt}</span>
                      <span className="block text-xs text-slate-500">
                        Сложность {q.difficulty} {q.author ? `· ${q.author}` : ''}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4 border-t border-slate-200 pt-5">
            {questSaved ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                <CheckCircle2 className="h-4 w-4" /> Квест назначен классу и добавлен на карту
              </span>
            ) : (
              <span className="text-xs text-slate-500">Отметьте минимум один вопрос</span>
            )}
            <button
              type="submit"
              disabled={selectedQIds.length === 0}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 whitespace-nowrap shrink-0"
            >
              Опубликовать квест
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
