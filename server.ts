import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

const ELEMENT_SUBJECTS: Record<string, { subject: string; name: string }> = {
  chronos: { subject: 'Математика', name: 'Хронос' },
  ether: { subject: 'Лингвистика и русский язык', name: 'Эфир' },
  terra: { subject: 'История', name: 'Терра' },
  volta: { subject: 'Физика', name: 'Вольта' },
};

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface GenerateQuestionsBody {
  element?: string;
  difficulty?: '1' | '2' | '3' | 'mixed';
  count?: number;
  topic?: string;
  studyMaterial?: string;
  fileData?: {
    name: string;
    mimeType: string;
    data: string;
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  app.post('/api/ai/generate-questions', async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: 'Не найден ключ GEMINI_API_KEY. Проверьте настройки секретов проекта.',
        });
      }

      const body = req.body as GenerateQuestionsBody;
      const element = body.element && ELEMENT_SUBJECTS[body.element] ? body.element : 'chronos';
      const subjectInfo = ELEMENT_SUBJECTS[element];
      const count = Math.min(6, Math.max(1, Number(body.count) || 3));
      const difficulty = body.difficulty || 'mixed';
      const topic = (body.topic || '').trim();
      const studyMaterial = (body.studyMaterial || '').trim();
      const fileData = body.fileData;

      if (!topic && !studyMaterial && !fileData) {
        return res.status(400).json({
          error: 'Укажите тему, вставьте текст учебного материала или загрузите файл.',
        });
      }

      const difficultyInstruction =
        difficulty === 'mixed'
          ? 'Сложность вопросов распределите равномерно от 1 (базовый) до 3 (повышенный).'
          : `Все вопросы должны иметь уровень сложности ${difficulty} из 3.`;

      const textPrompt = [
        `Создай ${count} образовательных тестовых вопросов на русском языке для учеников 6–9 классов по предмету «${subjectInfo.subject}» (стихия ${subjectInfo.name} в платформе «Хроноакадемия»).`,
        difficultyInstruction,
        topic ? `Тема / фокус задания: ${topic}.` : '',
        studyMaterial ? `Опорный учебный текст от учителя:\n"""\n${studyMaterial}\n"""` : '',
        fileData
          ? `Учитель также прикрепил учебный файл (${fileData.name}). Используй его содержимое для составления точных вопросов.`
          : '',
        'Требования к каждому вопросу:',
        '1. Чёткая формулировка вопроса без лишней воды.',
        '2. Поле formula заполняй только если уместна формула, выражение или короткая схема; иначе передай пустую строку "".',
        '3. Ровно 4 варианта ответа (options), один из которых верный (correctIndex от 0 до 3).',
        '4. Поле explanation должно понятно и доброжелательно объяснять решение ученику (1–2 предложения).',
      ]
        .filter(Boolean)
        .join('\n\n');

      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

      if (fileData?.data && fileData?.mimeType) {
        parts.push({
          inlineData: {
            mimeType: fileData.mimeType,
            data: fileData.data,
          },
        });
      }
      parts.push({ text: textPrompt });

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: { parts },
        config: {
          systemInstruction:
            'Ты — опытный методист и преподаватель школьной образовательной платформы «Хроноакадемия». Ты создаёшь точные, корректные и понятные тестовые задания с разбором ошибок.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                prompt: {
                  type: Type.STRING,
                  description: 'Текст учебного вопроса на русском языке.',
                },
                formula: {
                  type: Type.STRING,
                  description: 'Математическая или физическая формула, либо пустая строка.',
                },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Ровно 4 варианта ответа.',
                },
                correctIndex: {
                  type: Type.INTEGER,
                  description: 'Индекс правильного варианта от 0 до 3.',
                },
                explanation: {
                  type: Type.STRING,
                  description: 'Понятное объяснение правильного решения для разбора ошибок.',
                },
                difficulty: {
                  type: Type.INTEGER,
                  description: 'Уровень сложности: 1, 2 или 3.',
                },
              },
              required: ['prompt', 'options', 'correctIndex', 'explanation', 'difficulty'],
            },
          },
        },
      });

      const rawText = (response.text ?? '[]').trim();
      const parsed = JSON.parse(rawText) as Array<{
        prompt: string;
        formula?: string;
        options: string[];
        correctIndex: number;
        explanation: string;
        difficulty: number;
      }>;

      const normalized = parsed
        .filter((item) => item && item.prompt && Array.isArray(item.options) && item.options.length >= 2)
        .map((item, idx) => {
          const fourOptions = item.options.slice(0, 4);
          while (fourOptions.length < 4) {
            fourOptions.push(`Вариант ${fourOptions.length + 1}`);
          }
          const safeIndex =
            Number.isInteger(item.correctIndex) &&
            item.correctIndex >= 0 &&
            item.correctIndex < fourOptions.length
              ? item.correctIndex
              : 0;
          const safeDiff = item.difficulty === 1 || item.difficulty === 2 || item.difficulty === 3
            ? item.difficulty
            : 2;

          return {
            id: `q-ai-${Date.now()}-${idx}`,
            element,
            difficulty: safeDiff as 1 | 2 | 3,
            prompt: item.prompt.trim(),
            formula: item.formula?.trim() ? item.formula.trim() : undefined,
            options: fourOptions,
            correctIndex: safeIndex,
            explanation: item.explanation?.trim() || 'Проверьте ключевое правило по этой теме.',
            author: 'ИИ-ассистент',
          };
        });

      return res.json({ questions: normalized });
    } catch (error) {
      console.error('Gemini question generation failed:', error);
      const message =
        error instanceof Error ? error.message : 'Не удалось сгенерировать вопросы.';
      return res.status(500).json({
        error: `Ошибка генерации контента: ${message}`,
      });
    }
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ChronoAcademy server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
