"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { kplTeams, rosterDisclaimer, type KplTeam } from "@/data/kpl";

const PRODUCT_TITLE = "购买爱因斯坦大脑";
const MAX_RESERVE = 999;

function clampReserve(n: number): number {
  if (Number.isNaN(n) || n < 0) return 0;
  if (n > MAX_RESERVE) return MAX_RESERVE;
  return Math.floor(n);
}

type IqFloater = { id: string; playerId: string };

function newFloaterId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function sumTeamInjections(team: KplTeam, map: Record<string, number>): number {
  return team.players.reduce((s, p) => s + (map[p.id] ?? 0), 0);
}

function trimToPool(
  team: KplTeam,
  map: Record<string, number>,
  pool: number,
): Record<string, number> {
  let used = sumTeamInjections(team, map);
  if (used <= pool) return { ...map };
  const next = { ...map };
  let over = used - pool;
  for (const p of [...team.players].reverse()) {
    while (over > 0 && (next[p.id] ?? 0) > 0) {
      next[p.id] = (next[p.id] ?? 0) - 1;
      over--;
    }
  }
  return next;
}

export function BrainFanApp() {
  const [teamId, setTeamId] = useState<string>(kplTeams[0]?.id ?? "");
  const [reserveInput, setReserveInput] = useState(20);
  const [injections, setInjections] = useState<Record<string, number>>({});
  const [iqFloaters, setIqFloaters] = useState<IqFloater[]>([]);

  const team = useMemo(
    () => kplTeams.find((t) => t.id === teamId) as KplTeam | undefined,
    [teamId],
  );

  const pool = clampReserve(reserveInput);
  const used = team ? sumTeamInjections(team, injections) : 0;
  const remaining = Math.max(0, pool - used);

  function selectTeam(id: string) {
    setTeamId(id);
    setInjections({});
    setIqFloaters([]);
  }

  function onReserveChange(raw: string) {
    const n = parseInt(raw, 10);
    const nextPool = clampReserve(Number.isNaN(n) ? 0 : n);
    setReserveInput(nextPool);
    if (!team) return;
    setInjections((prev) => trimToPool(team, prev, nextPool));
  }

  function inject(playerId: string) {
    if (!team || remaining <= 0) return;
    setInjections((prev) => ({
      ...prev,
      [playerId]: (prev[playerId] ?? 0) + 1,
    }));
    setIqFloaters((prev) => [...prev, { id: newFloaterId(), playerId }]);
  }

  function dismissFloater(id: string) {
    setIqFloaters((prev) => prev.filter((f) => f.id !== id));
  }

  return (
    <div className="relative mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 255, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      <header className="mb-10 text-center sm:text-left">
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.35em] text-cyan-300/80">
          KPL · Fan Booster
        </p>
        <h1 className="bg-gradient-to-r from-cyan-200 via-fuchsia-200 to-violet-300 bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-4xl">
          爱因斯坦大脑 · 电竞应援台
        </h1>
        <p className="mt-3 max-w-xl text-sm text-zinc-500">
          暗黑霓虹风演示：先囤货「智商储备」，再给主队选手逐次注入脑力。
        </p>
      </header>

      {/* 购买 / 智商储备 */}
      <section className="relative mb-10 overflow-hidden rounded-2xl border border-cyan-500/25 bg-zinc-950/80 p-6 shadow-[0_0_40px_-12px_rgba(34,211,238,0.35)] backdrop-blur-md sm:p-8">
        <div className="absolute -right-16 -top-16 size-48 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 size-56 rounded-full bg-fuchsia-600/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-white">
              <span
                className="inline-flex size-9 items-center justify-center rounded-lg border border-cyan-400/40 bg-cyan-500/10 text-lg shadow-[0_0_20px_rgba(34,211,238,0.25)]"
                aria-hidden
              >
                🧠
              </span>
              {PRODUCT_TITLE}
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              输入「智商储备」——即可注入下方选手，每次注入消耗{" "}
              <span className="font-mono text-cyan-300">1</span> 单位脑力。
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="iq-reserve"
                className="text-xs font-semibold uppercase tracking-wider text-fuchsia-300/90"
              >
                智商储备
              </label>
              <input
                id="iq-reserve"
                type="number"
                min={0}
                max={MAX_RESERVE}
                value={pool}
                onChange={(e) => onReserveChange(e.target.value)}
                className="w-36 rounded-xl border border-white/10 bg-black/50 px-4 py-3 font-mono text-lg text-cyan-100 shadow-inner outline-none ring-0 transition focus:border-cyan-400/60 focus:shadow-[0_0_24px_rgba(34,211,238,0.2)]"
              />
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 px-5 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                剩余可注入
              </p>
              <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-cyan-300">
                {remaining}
                <span className="ml-1 text-sm font-normal text-zinc-500">
                  / {pool}
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 战队选择 */}
      <section className="mb-8">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-zinc-400">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-zinc-700" />
          选择战队
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-zinc-700" />
        </h3>
        <div className="flex flex-wrap gap-2">
          {kplTeams.map((t) => {
            const active = t.id === teamId;
            return (
              <button
                key={t.id}
                type="button"
                aria-label={`选择战队 ${t.name}`}
                onClick={() => selectTeam(t.id)}
                className={`group relative flex items-center gap-2.5 overflow-hidden rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                  active
                    ? "border-transparent text-white shadow-[0_0_24px_rgba(217,70,239,0.25)]"
                    : "border-white/10 bg-zinc-900/50 text-zinc-400 hover:border-fuchsia-500/30 hover:text-zinc-200"
                }`}
                style={
                  active
                    ? {
                        background: `linear-gradient(135deg, ${t.accent}33, rgba(0,0,0,0.5))`,
                        boxShadow: `inset 0 0 0 1px ${t.accent}66, 0 0 28px ${t.accent}22`,
                      }
                    : undefined
                }
              >
                <img
                  src={t.iconPath}
                  alt=""
                  width={32}
                  height={32}
                  decoding="async"
                  className="relative z-10 size-8 shrink-0 rounded-lg border border-white/15 bg-black/40 object-cover shadow-sm"
                />
                <span className="relative z-10 leading-tight">{t.shortName}</span>
                <span className="relative z-10 text-xs font-normal leading-tight opacity-70">
                  {t.city}
                </span>
                {active && (
                  <span className="absolute inset-0 -z-0 bg-gradient-to-t from-fuchsia-600/20 to-transparent opacity-80" />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* 选手卡片 */}
      {team && (
        <section>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <img
                src={team.iconPath}
                alt=""
                width={44}
                height={44}
                decoding="async"
                className="size-11 shrink-0 rounded-2xl border border-white/15 bg-black/40 shadow-[0_0_24px_rgba(0,0,0,0.45)]"
              />
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-white">{team.name}</h3>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                  {rosterDisclaimer}
                </p>
              </div>
            </div>
            <p className="shrink-0 font-mono text-xs text-zinc-500 sm:pt-1">
              ROSTER · 5
            </p>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {team.players.map((p, idx) => {
              const count = injections[p.id] ?? 0;
              const canInject = remaining > 0;
              return (
                <li key={p.id}>
                  <article className="group relative flex h-full flex-col rounded-2xl border border-white/[0.08] bg-gradient-to-b from-zinc-900/90 to-black/90 p-4 shadow-lg transition hover:border-fuchsia-500/35 hover:shadow-[0_0_32px_-8px_rgba(217,70,239,0.35)]">
                    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
                      <div
                        className="absolute -right-8 -top-8 size-24 rounded-full opacity-40 blur-2xl transition group-hover:opacity-70"
                        style={{ backgroundColor: team.accent }}
                      />
                    </div>

                    <div className="relative z-10 mb-3 flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="relative mx-auto mb-3 flex w-fit flex-col items-center">
                          <div className="pointer-events-none absolute bottom-full left-1/2 z-20 flex min-h-[1.25rem] w-0 justify-center">
                            <AnimatePresence>
                              {iqFloaters
                                .filter((f) => f.playerId === p.id)
                                .map((f) => (
                                  <div
                                    key={f.id}
                                    className="absolute bottom-0 left-1/2 z-20 -translate-x-1/2"
                                  >
                                    <motion.span
                                      aria-hidden
                                      initial={{ opacity: 1, y: 10, scale: 0.88 }}
                                      animate={{ opacity: 0, y: -76 }}
                                      transition={{
                                        duration: 1.2,
                                        ease: [0.22, 1, 0.36, 1],
                                      }}
                                      onAnimationComplete={() => dismissFloater(f.id)}
                                      className="block whitespace-nowrap font-mono text-sm font-black tracking-tight text-cyan-300 drop-shadow-[0_0_12px_rgba(34,211,238,0.9)]"
                                    >
                                      +100 IQ
                                    </motion.span>
                                  </div>
                                ))}
                            </AnimatePresence>
                          </div>

                          <div
                            className="relative flex size-14 shrink-0 items-center justify-center rounded-2xl border-2 border-white/15 bg-gradient-to-br from-zinc-800 to-zinc-950 font-mono text-xl font-black text-white shadow-[0_0_24px_rgba(0,0,0,0.5)] ring-2 ring-cyan-400/25"
                            aria-hidden
                          >
                            {p.nickname.slice(0, 1)}
                          </div>
                        </div>

                        <p className="text-[10px] font-bold uppercase tracking-widest text-fuchsia-400/80">
                          {p.role}
                        </p>
                        <p className="mt-1 truncate text-lg font-bold text-white">
                          {p.nickname}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 font-mono text-[10px] text-cyan-200">
                        #{idx + 1}
                      </span>
                    </div>

                    <div className="relative z-10 mt-auto space-y-3 border-t border-white/5 pt-4">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs text-zinc-500">已注入脑力</span>
                        <span className="font-mono text-3xl font-black tabular-nums tracking-tight text-transparent bg-gradient-to-br from-cyan-300 to-fuchsia-400 bg-clip-text">
                          {count}
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={!canInject}
                        onClick={() => inject(p.id)}
                        className="w-full rounded-xl border border-fuchsia-500/40 bg-gradient-to-r from-fuchsia-600/80 to-violet-600/80 py-2.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(192,38,211,0.25)] transition enabled:hover:brightness-110 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-zinc-800 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-600 disabled:shadow-none"
                      >
                        注入脑力
                      </button>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
