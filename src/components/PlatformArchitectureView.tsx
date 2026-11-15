import { useState } from 'react';
import { ElementId } from '../types/game';
import {
  ARCHITECTURE_STAGES,
  ELEMENT_LIST,
  ELEMENTS,
  calculateElementalResonance,
} from '../data/gameData';

const STACK_LAYERS = [
  {
    layer: 'Вход и TLS',
    tech: 'Traefik v2.11+',
    role: 'Единая точка входа, автоматические сертификаты Let’s Encrypt и динамическая маршрутизация к контейнерам.',
  },
  {
    layer: 'Клиент и 2D-сцена',
    tech: 'Next.js + PixiJS 8 + Framer Motion',
    role: 'Облегчённый рендеринг 2D-сцен (~460 КБ) для школьных устройств, SSR и плавные переходы интерфейса.',
  },
  {
    layer: 'Бизнес-логика API',
    tech: 'NestJS + Prisma + PostgreSQL 16',
    role: 'Модульный бэкенд, типобезопасные миграции, хранение профилей, вопросов, квестов и статистики класса.',
  },
  {
    layer: 'Мультиплеер боёв',
    tech: 'Colyseus + @colyseus/traefik + Redis 7',
    role: 'Синхронизация пошаговых боёв с боссами и PvP-дуэлей, sticky sessions и кэширование сессий.',
  },
  {
    layer: 'Хранение скинов',
    tech: 'Garage S3 + CharacterForge / MineSkin',
    role: 'Компактное S3-совместимое хранилище (30–60 МБ RAM) для сгенерированных портретов и аватаров.',
  },
];

export function PlatformArchitectureView() {
  const [attacker, setAttacker] = useState<ElementId>('ether');
  const [defender, setDefender] = useState<ElementId>('chronos');
  const result = calculateElementalResonance(attacker, defender);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8">
        <p className="text-sm font-medium text-slate-500">
          Справочник платформы · Игровая математика и стек
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold text-slate-900">
          Архитектура и матрица стихий «Хроноакадемии»
        </h1>
      </div>

      {/* Interactive Elemental Resonance Calculator */}
      <section className="rounded-2xl border border-slate-200 bg-white p-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 className="font-display text-xl font-bold text-slate-900">
              Калькулятор стихийного резонанса
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Боевая система использует чистые функции расчёта стихий из общего пакета типов.
              Выберите атакующую и защищающуюся стихии для проверки итогового коэффициента урона.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-700">Стихия ответа (Атака)</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {ELEMENT_LIST.map((el) => (
                    <button
                      key={el.id}
                      type="button"
                      onClick={() => setAttacker(el.id)}
                      className={`rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors ${
                        attacker === el.id
                          ? 'border-blue-600 bg-blue-50 text-blue-950'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {el.name} · {el.subject}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-700">Стихия цели (Босс / Соперник)</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {ELEMENT_LIST.map((el) => (
                    <button
                      key={el.id}
                      type="button"
                      onClick={() => setDefender(el.id)}
                      className={`rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors ${
                        defender === el.id
                          ? 'border-blue-600 bg-blue-50 text-blue-950'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {el.name} · {el.subject}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 p-6 lg:col-span-7">
            <div>
              <p className="text-xs font-medium text-slate-500">Результат расчёта</p>
              <div className="mt-3 flex flex-wrap items-baseline gap-4">
                <span className="font-mono text-4xl font-bold text-slate-900 tabular-nums">
                  ×{result.multiplier.toFixed(1)}
                </span>
                <span
                  className={`text-sm font-semibold ${
                    result.relation === 'resonance'
                      ? 'text-emerald-700'
                      : result.relation === 'resistance'
                        ? 'text-amber-700'
                        : 'text-slate-700'
                  }`}
                >
                  {result.label}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-700">
                {ELEMENTS[attacker].name} ({ELEMENTS[attacker].subject}) против{' '}
                {ELEMENTS[defender].name} ({ELEMENTS[defender].subject}).
              </p>
            </div>

            <div className="mt-6 border-t border-slate-200 pt-5">
              <p className="mb-3 text-xs font-semibold text-slate-700">
                Полный круг превосходства стихий
              </p>
              <div className="grid grid-cols-1 gap-2 text-xs text-slate-700 sm:grid-cols-2">
                {ELEMENT_LIST.map((el) => (
                  <div
                    key={el.id}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                  >
                    <strong className="text-slate-900">{el.name}</strong> ({el.subject}) силён против{' '}
                    <strong className="text-slate-900">{ELEMENTS[el.strongAgainst].name}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Containerized Stack Overview */}
      <section className="mt-10">
        <h2 className="font-display text-2xl font-bold text-slate-900">
          Контейнерная архитектура сервисов
        </h2>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {STACK_LAYERS.map((item) => (
            <div
              key={item.layer}
              className="rounded-2xl border border-slate-200 bg-white p-6"
            >
              <p className="text-xs font-medium text-slate-500">{item.layer}</p>
              <h3 className="mt-1 font-mono text-base font-semibold text-slate-900">
                {item.tech}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6-Stage Roadmap */}
      <section className="mt-10">
        <h2 className="font-display text-2xl font-bold text-slate-900">
          Последовательность реализации (6 этапов)
        </h2>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ARCHITECTURE_STAGES.map((st) => (
            <div
              key={st.stage}
              className="rounded-2xl border border-slate-200 bg-white p-6"
            >
              <p className="text-xs font-medium text-slate-500 tabular-nums">
                {st.stage} · {st.duration}
              </p>
              <h3 className="mt-1 font-display text-lg font-bold text-slate-900">
                {st.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{st.summary}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
