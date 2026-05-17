"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useMemo, useState } from "react";
import { kplTeams, rosterDisclaimer, type KplTeam } from "@/data/kpl";

const PRODUCT_TITLE = "爱因斯坦的大脑";
const MAX_BRAIN_COUNT = 999;
const DEFAULT_BRAIN_COUNT = 12;

type AllocationMap = Record<string, number>;

type Spark = {
  id: string;
  playerId: string;
};

type Receipt = {
  orderId: string;
  createdAt: string;
  teamName: string;
  teamShortName: string;
  totalBrains: number;
  allocations: Array<{
    playerId: string;
    nickname: string;
    role: string;
    count: number;
  }>;
};

function clampBrainCount(raw: number): number {
  if (Number.isNaN(raw) || raw < 1) return 1;
  return Math.min(MAX_BRAIN_COUNT, Math.floor(raw));
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildOrderId(): string {
  return `KPL-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

function sumAllocations(team: KplTeam | undefined, map: AllocationMap): number {
  if (!team) return 0;
  return team.players.reduce((sum, player) => sum + (map[player.id] ?? 0), 0);
}

function trimAllocations(
  team: KplTeam,
  map: AllocationMap,
  totalBrains: number,
): AllocationMap {
  const next = { ...map };
  let over = sumAllocations(team, next) - totalBrains;

  if (over <= 0) return next;

  for (const player of [...team.players].reverse()) {
    const current = next[player.id] ?? 0;
    if (current <= 0) continue;

    const reduceBy = Math.min(current, over);
    const nextValue = current - reduceBy;

    if (nextValue > 0) {
      next[player.id] = nextValue;
    } else {
      delete next[player.id];
    }

    over -= reduceBy;
    if (over <= 0) break;
  }

  return next;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function BrainFanApp() {
  const [teamId, setTeamId] = useState<string>(kplTeams[0]?.id ?? "");
  const [brainCount, setBrainCount] = useState<number>(DEFAULT_BRAIN_COUNT);
  const [allocations, setAllocations] = useState<AllocationMap>({});
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  const team = useMemo(
    () => kplTeams.find((item) => item.id === teamId),
    [teamId],
  );

  const allocatedBrains = sumAllocations(team, allocations);
  const remainingBrains = Math.max(0, brainCount - allocatedBrains);
  const selectedPlayers = team
    ? team.players.filter((player) => (allocations[player.id] ?? 0) > 0)
    : [];

  function clearReceipt() {
    setReceipt(null);
  }

  function selectTeam(nextTeamId: string) {
    setTeamId(nextTeamId);
    setAllocations({});
    setSparks([]);
    clearReceipt();
  }

  function updateBrainCount(rawValue: string) {
    const parsed = Number.parseInt(rawValue, 10);
    const nextValue = clampBrainCount(Number.isNaN(parsed) ? 1 : parsed);
    setBrainCount(nextValue);
    clearReceipt();

    if (!team) return;

    setAllocations((prev) => trimAllocations(team, prev, nextValue));
  }

  function setPlayerBrains(playerId: string, nextCount: number) {
    if (!team) return;

    const sanitized = Math.max(0, Math.min(brainCount, Math.floor(nextCount)));

    setAllocations((prev) => {
      const next = { ...prev };
      if (sanitized > 0) {
        next[playerId] = sanitized;
      } else {
        delete next[playerId];
      }

      return trimAllocations(team, next, brainCount);
    });
    clearReceipt();

    if (sanitized > (allocations[playerId] ?? 0)) {
      setSparks((prev) => [...prev, { id: newId(), playerId }]);
    }
  }

  function incrementPlayer(playerId: string) {
    const current = allocations[playerId] ?? 0;
    setPlayerBrains(playerId, current + 1);
  }

  function decrementPlayer(playerId: string) {
    const current = allocations[playerId] ?? 0;
    setPlayerBrains(playerId, current - 1);
  }

  function clearPlayer(playerId: string) {
    setPlayerBrains(playerId, 0);
  }

  function submitOrder() {
    if (!team || allocatedBrains <= 0) return;

    setReceipt({
      orderId: buildOrderId(),
      createdAt: new Date().toISOString(),
      teamName: team.name,
      teamShortName: team.shortName,
      totalBrains: allocatedBrains,
      allocations: team.players
        .filter((player) => (allocations[player.id] ?? 0) > 0)
        .map((player) => ({
          playerId: player.id,
          nickname: player.nickname,
          role: player.role,
          count: allocations[player.id] ?? 0,
        })),
    });
  }

  const quickPicks = [3, 5, 8, 12, 20];

  return (
    <main className="relative mx-auto min-h-screen w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] opacity-80"
        style={{
          background:
            "radial-gradient(circle at 20% 20%, rgba(34,211,238,0.18), transparent 32%), radial-gradient(circle at 80% 10%, rgba(236,72,153,0.14), transparent 28%), radial-gradient(circle at 50% 100%, rgba(59,130,246,0.08), transparent 28%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.18]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      <section className="mb-8 overflow-hidden rounded-[2rem] border border-cyan-400/15 bg-zinc-950/80 shadow-[0_0_60px_-24px_rgba(34,211,238,0.2)] backdrop-blur">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1.2fr)_320px] lg:p-10">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200/80">
              KPL Fan Lab
            </div>

            <div>
              <h1 className="max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl">
                把 {PRODUCT_TITLE} 分配给你支持的 KPL 选手
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
                这是一个粉丝向的玩梗演示页，先选战队，再买脑子，最后把脑子装到指定选手头上。前端交互已经打通，后续可以很方便接入支付、订单和 Vercel 部署。
              </p>
            </div>

            <p className="max-w-2xl text-xs leading-5 text-zinc-500">
              {rosterDisclaimer}
            </p>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                  当前战队
                </p>
                <p className="mt-2 text-lg font-bold text-white">{team?.shortName}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                  已选选手
                </p>
                <p className="mt-2 text-lg font-bold text-white">
                  {selectedPlayers.length} 位
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                  剩余脑子
                </p>
                <p className="mt-2 text-lg font-bold text-cyan-300">
                  {remainingBrains} / {brainCount}
                </p>
              </div>
            </div>
          </div>

          <aside className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-fuchsia-300/80">
              订单中心
            </p>
            <div className="mt-4">
              <label
                htmlFor="brain-count"
                className="text-sm font-medium text-zinc-200"
              >
                购买脑子数量
              </label>
              <input
                id="brain-count"
                type="number"
                min={1}
                max={MAX_BRAIN_COUNT}
                value={brainCount}
                onChange={(event) => updateBrainCount(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-2xl font-black tracking-tight text-white outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {quickPicks.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => updateBrainCount(String(count))}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    brainCount === count
                      ? "border-cyan-400/40 bg-cyan-400/15 text-cyan-100"
                      : "border-white/10 bg-black/30 text-zinc-400 hover:border-white/20 hover:text-white"
                  }`}
                >
                  {count} 颗
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                已分配
              </p>
              <p className="mt-2 font-mono text-3xl font-black text-transparent bg-gradient-to-r from-cyan-300 to-fuchsia-300 bg-clip-text">
                {allocatedBrains}
              </p>
            </div>

            <button
              type="button"
              onClick={submitOrder}
              disabled={allocatedBrains <= 0}
              className="mt-5 w-full rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-fuchsia-500 px-4 py-3 text-sm font-bold text-white shadow-[0_18px_45px_-20px_rgba(34,211,238,0.55)] transition enabled:hover:brightness-110 enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
            >
              生成订单预览
            </button>

            <p className="mt-3 text-xs leading-5 text-zinc-500">
              目前为纯前端模拟，不会真的发起支付。你后续如果想接淘宝跳转、支付宝、订单接口或 Vercel Server Actions，我们可以继续往下接。
            </p>
          </aside>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_360px]">
        <section className="space-y-6">
          <div>
            <h2 className="flex items-center gap-3 text-sm font-bold uppercase tracking-[0.28em] text-zinc-400">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-700 to-zinc-700" />
              选择支持的战队
              <span className="h-px flex-1 bg-gradient-to-l from-transparent via-zinc-700 to-zinc-700" />
            </h2>

            <div className="mt-4 flex flex-wrap gap-2">
              {kplTeams.map((item) => {
                const active = item.id === teamId;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectTeam(item.id)}
                    className={`group relative flex min-w-[160px] items-center gap-3 overflow-hidden rounded-2xl border px-3 py-2.5 text-left transition ${
                      active
                        ? "border-transparent text-white shadow-[0_0_28px_rgba(34,211,238,0.18)]"
                        : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:text-white"
                    }`}
                    style={
                      active
                        ? {
                            background: `linear-gradient(135deg, ${item.accent}26, rgba(0,0,0,0.72))`,
                            boxShadow: `inset 0 0 0 1px ${item.accent}55`,
                          }
                        : undefined
                    }
                  >
                    <Image
                      src={item.iconPath}
                      alt=""
                      width={36}
                      height={36}
                      className="size-9 shrink-0 rounded-xl border border-white/10 bg-black/40 object-cover"
                    />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-semibold">
                        {item.shortName}
                      </span>
                      <span className="truncate text-xs opacity-70">
                        {item.city}
                      </span>
                    </span>
                    {active ? (
                      <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-1 text-[10px] font-semibold text-cyan-100">
                        已选
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {team ? (
            <section>
              <div className="mb-4 flex items-start gap-3">
                <Image
                  src={team.iconPath}
                  alt=""
                  width={48}
                  height={48}
                  className="size-12 shrink-0 rounded-2xl border border-white/10 bg-black/40"
                />
                <div className="min-w-0">
                  <h3 className="text-xl font-bold text-white">{team.name}</h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    点击卡片下方的输入框或按钮，把脑子分配给对应选手。
                  </p>
                </div>
              </div>

              <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {team.players.map((player) => {
                  const count = allocations[player.id] ?? 0;
                  const selected = count > 0;

                  return (
                    <li key={player.id}>
                      <article
                        className={`relative flex h-full flex-col overflow-hidden rounded-3xl border p-4 transition ${
                          selected
                            ? "border-cyan-400/35 bg-gradient-to-b from-cyan-400/10 via-white/[0.04] to-black/50 shadow-[0_0_30px_rgba(34,211,238,0.12)]"
                            : "border-white/10 bg-white/[0.03] hover:border-white/20"
                        }`}
                      >
                        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
                          <div
                            className="absolute -right-8 -top-8 size-24 rounded-full opacity-40 blur-2xl"
                            style={{ backgroundColor: team.accent }}
                          />
                        </div>

                        <div className="relative z-10 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-fuchsia-300/80">
                              {player.role}
                            </p>
                            <h4 className="mt-1 truncate text-lg font-bold text-white">
                              {player.nickname}
                            </h4>
                          </div>

                          <button
                            type="button"
                            onClick={() => (selected ? clearPlayer(player.id) : incrementPlayer(player.id))}
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                              selected
                                ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-100"
                                : "border-white/10 bg-black/30 text-zinc-300 hover:border-cyan-400/30 hover:text-white"
                            }`}
                          >
                            {selected ? "已装配" : "选择"}
                          </button>
                        </div>

                        <div className="relative z-10 mt-3 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                          <div className="relative aspect-[4/3]">
                            <Image
                              src={player.photoPath}
                              alt={`${player.nickname} 最新定妆照`}
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 33vw, 20vw"
                              className="object-cover object-top"
                            />
                          </div>
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/40 to-transparent px-3 py-2">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/70">
                              2026 定妆照
                            </p>
                          </div>
                        </div>

                        <div className="relative z-10 mt-3 min-h-8">
                          <AnimatePresence>
                            {sparks
                              .filter((spark) => spark.playerId === player.id)
                              .map((spark) => (
                                <motion.span
                                  key={spark.id}
                                  aria-hidden
                                  initial={{ opacity: 1, y: 8, scale: 0.94 }}
                                  animate={{ opacity: 0, y: -62 }}
                                  transition={{
                                    duration: 1.1,
                                    ease: [0.22, 1, 0.36, 1],
                                  }}
                                  onAnimationComplete={() =>
                                    setSparks((prev) =>
                                      prev.filter((item) => item.id !== spark.id),
                                    )
                                  }
                                  className="absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap font-mono text-sm font-black text-cyan-300 drop-shadow-[0_0_12px_rgba(34,211,238,0.85)]"
                                >
                                  +1 脑子
                                </motion.span>
                              ))}
                          </AnimatePresence>
                        </div>

                        <div className="relative z-10 mt-4 grid gap-3 border-t border-white/5 pt-4">
                          <div className="flex items-baseline justify-between gap-3">
                            <span className="text-xs text-zinc-500">分配数量</span>
                            <span className="font-mono text-3xl font-black text-transparent bg-gradient-to-br from-cyan-300 to-fuchsia-400 bg-clip-text">
                              {count}
                            </span>
                          </div>

                          <div className="grid grid-cols-[auto_1fr_auto] gap-2">
                            <button
                              type="button"
                              onClick={() => decrementPlayer(player.id)}
                              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm font-bold text-white transition hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-40"
                              disabled={count <= 0}
                            >
                              -
                            </button>

                            <input
                              type="number"
                              min={0}
                              max={brainCount}
                              value={count}
                              onChange={(event) =>
                                setPlayerBrains(
                                  player.id,
                                  Number.parseInt(event.target.value, 10) || 0,
                                )
                              }
                              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-center font-mono text-base font-semibold text-white outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/15"
                            />

                            <button
                              type="button"
                              onClick={() => incrementPlayer(player.id)}
                              className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-bold text-white transition hover:border-cyan-400/30 hover:bg-cyan-400/10"
                              disabled={remainingBrains <= 0 && !selected}
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => clearPlayer(player.id)}
                            className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-zinc-400 transition hover:border-white/20 hover:text-white"
                          >
                            清空该选手
                          </button>
                        </div>
                      </article>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
        </section>

        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">
              订单预览
            </p>

            {receipt ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-100/80">
                    已生成订单
                  </p>
                  <p className="mt-2 font-mono text-sm text-white">{receipt.orderId}</p>
                  <p className="mt-1 text-xs text-cyan-100/70">
                    {formatDateTime(receipt.createdAt)}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-zinc-400">战队</span>
                    <span className="text-sm font-semibold text-white">
                      {receipt.teamName}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-sm text-zinc-400">脑子总数</span>
                    <span className="font-mono text-2xl font-black text-cyan-300">
                      {receipt.totalBrains}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-sm font-semibold text-white">分配明细</p>
                  <ul className="mt-3 space-y-2">
                    {receipt.allocations.map((item) => (
                      <li
                        key={item.playerId}
                        className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.04] px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">
                            {item.nickname}
                          </p>
                          <p className="text-xs text-zinc-500">{item.role}</p>
                        </div>
                        <span className="font-mono text-sm font-bold text-fuchsia-300">
                          {item.count}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={clearReceipt}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-zinc-300 transition hover:border-white/20 hover:text-white"
                >
                  继续编辑
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-sm font-medium text-white">当前草稿</p>
                  <dl className="mt-3 space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-zinc-500">支持战队</dt>
                      <dd className="font-semibold text-white">{team?.name}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-zinc-500">已选选手</dt>
                      <dd className="font-semibold text-white">
                        {selectedPlayers.length} 位
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-zinc-500">已分配</dt>
                      <dd className="font-mono text-xl font-black text-cyan-300">
                        {allocatedBrains}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-zinc-500">剩余</dt>
                      <dd className="font-mono text-xl font-black text-fuchsia-300">
                        {remainingBrains}
                      </dd>
                    </div>
                  </dl>
                </div>

                <button
                  type="button"
                  onClick={submitOrder}
                  disabled={allocatedBrains <= 0}
                  className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-fuchsia-500 px-4 py-3 text-sm font-bold text-white shadow-[0_18px_45px_-20px_rgba(34,211,238,0.55)] transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  生成订单预览
                </button>
              </div>
            )}
          </section>

          <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">
              使用说明
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-400">
              <li>1. 先点战队，再调整要买的脑子总数。</li>
              <li>2. 在选手卡片里输入数量，或者点加减按钮快速分配。</li>
              <li>3. 右侧会实时显示当前草稿，点“生成订单预览”就能看到最终清单。</li>
            </ul>
          </section>
        </aside>
      </div>
    </main>
  );
}
