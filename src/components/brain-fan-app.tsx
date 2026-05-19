"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { kplTeams, rosterDisclaimer, type KplTeam } from "@/data/kpl";

const PRODUCT_TITLE = "爱因斯坦的大脑";
const MAX_BRAIN_COUNT = 999;
const DEFAULT_BRAIN_COUNT = 12;
const QUICK_PICKS = [3, 5, 8, 12, 20];

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

type ThemeMode = "dark" | "light";

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

function buildReceiptSummary(receipt: Receipt, pageUrl?: string): string {
  const lines = [
    "KPL 爱因斯坦的大脑 · 订单卡片",
    `战队：${receipt.teamName}`,
    `简称：${receipt.teamShortName}`,
    `总脑子：${receipt.totalBrains}`,
    `订单号：${receipt.orderId}`,
    `时间：${formatDateTime(receipt.createdAt)}`,
    "分配明细：",
    ...receipt.allocations.map(
      (item) => `- ${item.nickname} · ${item.role} × ${item.count}`,
    ),
  ];

  if (pageUrl) {
    lines.push(`页面：${pageUrl}`);
  }

  return lines.join("\n");
}

function withAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");

  if (normalized.length === 3) {
    const [r, g, b] = normalized.split("");
    return `rgba(${parseInt(r + r, 16)}, ${parseInt(g + g, 16)}, ${parseInt(
      b + b,
      16,
    )}, ${alpha})`;
  }

  const bigint = Number.parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function BrainFanApp() {
  const [teamId, setTeamId] = useState<string>(kplTeams[0]?.id ?? "");
  const [brainCount, setBrainCount] = useState<number>(DEFAULT_BRAIN_COUNT);
  const [allocations, setAllocations] = useState<AllocationMap>({});
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimerRef = useRef<number | null>(null);

  const team = useMemo(
    () => kplTeams.find((item) => item.id === teamId),
    [teamId],
  );

  const selectedTeam = team ?? kplTeams[0];
  const teamAccent = selectedTeam?.accent ?? "#22d3ee";
  const allocatedBrains = sumAllocations(team, allocations);
  const remainingBrains = Math.max(0, brainCount - allocatedBrains);
  const selectedPlayers = team
    ? team.players.filter((player) => (allocations[player.id] ?? 0) > 0)
    : [];
  const allocationProgress = brainCount > 0 ? allocatedBrains / brainCount : 0;
  const allocationPercent = Math.min(100, Math.round(allocationProgress * 100));
  const canAllocateMore = remainingBrains > 0;

  useEffect(() => {
    const savedTheme =
      typeof window !== "undefined"
        ? window.localStorage.getItem("kpl-brain-theme")
        : null;

    const prefersLight =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: light)").matches;

    const nextTheme =
      savedTheme === "dark" || savedTheme === "light"
        ? savedTheme
        : prefersLight
          ? "light"
          : "dark";

    const frame = window.requestAnimationFrame(() => {
      setTheme(nextTheme);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("kpl-brain-theme", theme);
  }, [theme]);

  useEffect(
    () => () => {
      if (noticeTimerRef.current) {
        window.clearTimeout(noticeTimerRef.current);
      }
    },
    [],
  );

  function flashNotice(message: string) {
    setNotice(message);
    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current);
    }
    noticeTimerRef.current = window.setTimeout(() => {
      setNotice(null);
      noticeTimerRef.current = null;
    }, 1800);
  }

  function toggleTheme(nextTheme?: ThemeMode) {
    setTheme((current) => nextTheme ?? (current === "dark" ? "light" : "dark"));
  }

  async function copyReceiptCard() {
    if (!receipt) return;

    const text = buildReceiptSummary(receipt, window.location.href);

    try {
      await navigator.clipboard.writeText(text);
      flashNotice("卡片文案已复制");
    } catch {
      flashNotice("复制失败，请手动重试");
    }
  }

  async function shareReceiptCard() {
    if (!receipt) return;

    const text = buildReceiptSummary(receipt, window.location.href);

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${receipt.teamShortName} 订单卡片`,
          text,
          url: window.location.href,
        });
        flashNotice("已打开系统分享");
        return;
      }

      await navigator.clipboard.writeText(text);
      flashNotice("当前浏览器不支持分享，已复制文案");
    } catch {
      flashNotice("分享已取消");
    }
  }

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
    const previousCount = allocations[playerId] ?? 0;

    setAllocations((prev) => {
      const next = { ...prev };

      if (sanitized > 0) {
        next[playerId] = sanitized;
      } else {
        delete next[playerId];
      }

      return trimAllocations(team, next, brainCount);
    });

    if (sanitized > previousCount) {
      setSparks((current) => [...current, { id: newId(), playerId }]);
    }

    clearReceipt();
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

  return (
      <main className="relative isolate mx-auto min-h-screen w-full max-w-7xl overflow-hidden px-3 pb-28 pt-4 sm:px-6 sm:pb-10 lg:px-8 lg:py-10">
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_30%),radial-gradient(circle_at_85%_0%,rgba(236,72,153,0.08),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:48px_48px]" />

      {notice ? (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full border border-white/10 bg-black/80 px-4 py-2 text-sm font-medium text-white shadow-[0_18px_45px_-18px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          {notice}
        </div>
      ) : null}

      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950/85 shadow-[0_30px_90px_-45px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:rounded-[2.5rem]">
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            background: [
              `radial-gradient(circle at 18% 18%, ${withAlpha(teamAccent, 0.18)}, transparent 32%)`,
              `radial-gradient(circle at 85% 0%, rgba(236, 72, 153, 0.15), transparent 24%)`,
              `linear-gradient(180deg, rgba(255, 255, 255, 0.04), transparent 28%)`,
            ].join(", "),
          }}
        />

        <div className="relative grid gap-6 p-4 sm:p-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)] lg:gap-10 lg:p-10">
          <div className="space-y-5 sm:space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-100">
                KPL Fan Lab
              </div>

              <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur">
                <button
                  type="button"
                  onClick={() => toggleTheme("dark")}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
                    theme === "dark"
                      ? "bg-cyan-400/15 text-cyan-100 shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  暗色
                </button>
                <button
                  type="button"
                  onClick={() => toggleTheme("light")}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
                    theme === "light"
                      ? "bg-cyan-400/15 text-cyan-100 shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  更亮
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h1
                className="max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                把 {PRODUCT_TITLE} 交给你支持的 KPL 选手
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-zinc-300 sm:text-base sm:leading-7">
                先选战队，再配置脑子数量，最后把它们分配给你最信任的选手。
                这是一页可演示、可交互、也方便后续接支付和订单接口的粉丝向前端。
              </p>
            </div>

            <p className="max-w-2xl text-xs leading-5 text-zinc-500 sm:text-sm">
              {rosterDisclaimer}
            </p>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-black/30 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                  当前战队
                </p>
                <p
                  className="mt-2 text-lg font-bold text-white"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {selectedTeam?.shortName}
                </p>
                <p className="mt-1 text-xs text-zinc-500">{selectedTeam?.city}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/30 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                  已选选手
                </p>
                <p
                  className="mt-2 text-lg font-bold text-white"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {selectedPlayers.length} 位
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  共 {selectedTeam?.players.length ?? 0} 位可选
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/30 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                  剩余脑子
                </p>
                <p
                  className="mt-2 text-lg font-bold text-cyan-300"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {remainingBrains} / {brainCount}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  已分配 {allocatedBrains} 颗
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                    分配进度
                  </p>
                  <p className="mt-2 text-sm text-zinc-300">
                    已把脑子送到 <span className="font-semibold text-white">{allocatedBrains}</span>{" "}
                    / {brainCount} 颗
                  </p>
                </div>
                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-sm font-semibold text-cyan-100">
                  {allocationPercent}%
                </span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-fuchsia-400 transition-all duration-500"
                  style={{ width: `${allocationPercent}%` }}
                />
              </div>
            </div>
          </div>

          <aside className="rounded-[1.75rem] border border-white/10 bg-black/35 p-5 shadow-[0_20px_60px_-35px_rgba(34,211,238,0.45)] backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/70">
              订单中心
            </p>

            <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center gap-3">
                <Image
                  src={selectedTeam?.iconPath ?? "/teams/ag.svg"}
                  alt=""
                  width={52}
                  height={52}
                  className="h-[52px] w-[52px] shrink-0 rounded-2xl border border-white/10 bg-black/40"
                />
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold text-white">
                    {selectedTeam?.name}
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">
                    {selectedTeam?.city} · {selectedTeam?.shortName}
                  </p>
                </div>
                <span
                  className="ml-auto rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                  style={{
                    borderColor: withAlpha(teamAccent, 0.35),
                    backgroundColor: withAlpha(teamAccent, 0.12),
                    color: teamAccent,
                  }}
                >
                  当前
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                    选手数
                  </p>
                  <p className="mt-2 text-xl font-bold text-white">
                    {selectedTeam?.players.length ?? 0}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                    已分配
                  </p>
                  <p className="mt-2 text-xl font-bold text-cyan-300">
                    {allocatedBrains}
                  </p>
                </div>
              </div>
            </div>

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
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-2xl font-black tracking-tight text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {QUICK_PICKS.map((count) => (
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
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                  已分配
                </p>
                <p className="text-xs text-zinc-500">
                  剩余 {remainingBrains} 颗
                </p>
              </div>
              <p className="mt-2 font-mono text-3xl font-black text-transparent bg-gradient-to-r from-cyan-300 to-fuchsia-300 bg-clip-text">
                {allocatedBrains}
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-fuchsia-400 transition-all duration-500"
                  style={{ width: `${allocationPercent}%` }}
                />
              </div>
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
              目前为纯前端模拟，不会真的发起支付。后续如果要接淘宝跳转、支付宝、订单接口或 Vercel
              Server Actions，可以直接在这个结构上继续扩展。
            </p>
          </aside>
        </div>
      </section>

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-6">
          <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2
                  className="text-lg font-bold tracking-tight text-white"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  选择支持的战队
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  切换战队会自动清空当前草稿，避免把脑子分给错误的队伍。
                </p>
              </div>
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                {kplTeams.length} 支战队
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {kplTeams.map((item) => {
                const active = item.id === teamId;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectTeam(item.id)}
                    className={`group relative flex min-h-[88px] items-center gap-3 overflow-hidden rounded-3xl border px-4 py-3 text-left transition duration-300 ${
                      active
                        ? "border-transparent text-white shadow-[0_0_28px_rgba(34,211,238,0.16)]"
                        : "border-white/10 bg-white/[0.02] text-zinc-400 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
                    }`}
                    style={
                      active
                        ? {
                            background: `linear-gradient(135deg, ${withAlpha(
                              item.accent,
                              0.26,
                            )}, rgba(0, 0, 0, 0.78))`,
                            boxShadow: `inset 0 0 0 1px ${withAlpha(
                              item.accent,
                              0.4,
                            )}`,
                          }
                        : undefined
                    }
                  >
                    <span
                      className="absolute inset-y-0 left-0 w-1.5 rounded-r-full"
                      style={{
                        backgroundColor: active
                          ? item.accent
                          : withAlpha(item.accent, 0.18),
                      }}
                    />
                    <Image
                      src={item.iconPath}
                      alt=""
                      width={42}
                      height={42}
                      className="size-10 shrink-0 rounded-2xl border border-white/10 bg-black/40 object-cover"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {item.shortName}
                      </span>
                      <span className="block truncate text-xs opacity-70">
                        {item.name}
                      </span>
                    </span>
                    <span className="rounded-full border border-white/10 bg-black/30 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]">
                      {item.city}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {team ? (
            <section className="space-y-4">
              <div className="flex items-start gap-3">
                <Image
                  src={team.iconPath}
                  alt=""
                  width={56}
                  height={56}
                  className="size-14 shrink-0 rounded-2xl border border-white/10 bg-black/40"
                />
                <div className="min-w-0">
                  <h3
                    className="text-2xl font-bold text-white"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {team.name}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    点击卡片里的按钮或输入框，直接把脑子分配给对应选手。
                  </p>
                </div>
              </div>

              <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {team.players.map((player) => {
                  const count = allocations[player.id] ?? 0;
                  const selected = count > 0;

                  return (
                    <li key={player.id}>
                      <motion.article
                        whileHover={{ y: -4 }}
                        transition={{ type: "spring", stiffness: 300, damping: 24 }}
                        className={`relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border p-4 transition ${
                          selected
                            ? "border-cyan-400/35 bg-gradient-to-b from-cyan-400/12 via-white/[0.04] to-black/50 shadow-[0_0_30px_rgba(34,211,238,0.12)]"
                            : "border-white/10 bg-white/[0.03] hover:border-white/20"
                        }`}
                      >
                        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[1.75rem]">
                          <div
                            className="absolute -right-8 -top-8 size-24 rounded-full opacity-35 blur-2xl"
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
                            onClick={() =>
                              selected ? clearPlayer(player.id) : incrementPlayer(player.id)
                            }
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
                              alt={`${player.nickname} 定妆照`}
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 33vw, 20vw"
                              className="object-cover object-top"
                            />
                          </div>
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/45 to-transparent px-3 py-2">
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
                              className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-bold text-white transition hover:border-cyan-400/30 hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-40"
                              disabled={!selected && !canAllocateMore}
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
                      </motion.article>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
        </section>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">
              订单预览
            </p>

            {receipt ? (
              <div className="mt-4 space-y-4">
                <div className="overflow-hidden rounded-[1.75rem] border border-cyan-400/20 bg-[linear-gradient(180deg,rgba(34,211,238,0.12),rgba(255,255,255,0.03))] p-4 shadow-[0_24px_60px_-28px_rgba(34,211,238,0.28)]">
                  <div className="flex items-start gap-3">
                    <Image
                      src={selectedTeam?.iconPath ?? "/teams/ag.svg"}
                      alt=""
                      width={52}
                      height={52}
                      className="h-[52px] w-[52px] shrink-0 rounded-2xl border border-white/10 bg-black/40"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-100/80">
                        订单已生成
                      </p>
                      <p
                        className="mt-1 truncate text-xl font-bold text-white"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {receipt.teamShortName} · 成品卡片
                      </p>
                      <p className="mt-1 text-xs text-cyan-100/70">
                        {receipt.orderId} · {formatDateTime(receipt.createdAt)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={clearReceipt}
                      className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-white/20"
                    >
                      继续编辑
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                        总脑子
                      </p>
                      <p
                        className="mt-2 font-mono text-2xl font-black text-cyan-300"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {receipt.totalBrains}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                        选手数
                      </p>
                      <p
                        className="mt-2 text-2xl font-black text-white"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {receipt.allocations.length}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                        分配完成
                      </p>
                      <p
                        className="mt-2 text-2xl font-black text-fuchsia-300"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        100%
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
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
                          <span className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 font-mono text-sm font-bold text-fuchsia-300">
                            {item.count}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={copyReceiptCard}
                      className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white transition hover:border-cyan-400/30 hover:bg-cyan-400/10"
                    >
                      复制卡片
                    </button>
                    <button
                      type="button"
                      onClick={shareReceiptCard}
                      className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white transition hover:border-cyan-400/30 hover:bg-cyan-400/10"
                    >
                      分享卡片
                    </button>
                    <button
                      type="button"
                      onClick={submitOrder}
                      className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/15"
                    >
                      重新生成
                    </button>
                  </div>
                </div>
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

                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-sm font-medium text-white">使用说明</p>
                  <ul className="mt-3 space-y-3 text-sm leading-6 text-zinc-400">
                    <li>1. 先点战队，再调整要买的脑子总数。</li>
                    <li>2. 在选手卡片里输入数量，或点加减按钮快速分配。</li>
                    <li>3. 订单中心会实时更新，点“生成订单预览”即可查看结果。</li>
                  </ul>
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
        </aside>
      </div>

      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-transparent px-3 py-3 backdrop-blur-xl lg:hidden"
        style={{ backgroundColor: "var(--panel-strong)" }}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {selectedTeam?.shortName} · {allocatedBrains}/{brainCount}
            </p>
            <p className="truncate text-xs text-zinc-500">
              剩余 {remainingBrains} 颗 · {selectedPlayers.length} 位已分配
            </p>
          </div>

          {receipt ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyReceiptCard}
                className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-semibold text-white"
              >
                复制
              </button>
              <button
                type="button"
                onClick={shareReceiptCard}
                className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-semibold text-white"
              >
                分享
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={submitOrder}
              disabled={allocatedBrains <= 0}
              className="rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-fuchsia-500 px-4 py-2 text-xs font-bold text-white shadow-[0_18px_45px_-20px_rgba(34,211,238,0.55)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              生成
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
