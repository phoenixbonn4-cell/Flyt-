import React, { useState } from 'react';
import { DailySyncStat } from '../../types';
import { BarChart3, CheckCircle2, Clock, Sparkles } from 'lucide-react';

interface SyncVolumeChartProps {
  stats: DailySyncStat[];
  currentPendingCount: number;
}

export const SyncVolumeChart: React.FC<SyncVolumeChartProps> = ({ stats, currentPendingCount }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Compute key summary metrics over the 7-day period
  const totalSuccessful = stats.reduce((acc, curr) => acc + curr.successful, 0);
  const totalPending = stats.reduce((acc, curr, idx) => {
    // For today (last item), ensure it matches currentPendingCount
    if (idx === stats.length - 1) return acc + currentPendingCount;
    return acc + curr.pending;
  }, 0);

  const successRate =
    totalSuccessful + totalPending > 0
      ? ((totalSuccessful / (totalSuccessful + totalPending)) * 100).toFixed(1)
      : '100.0';

  // SVG Chart dimensions
  const chartWidth = 440;
  const chartHeight = 125;
  const topPadding = 18;
  const bottomPadding = 24;
  const leftPadding = 30;
  const rightPadding = 15;
  const usableWidth = chartWidth - leftPadding - rightPadding;
  const usableHeight = chartHeight - topPadding - bottomPadding;

  // Find max value to calibrate Y scale
  const maxVal = Math.max(
    ...stats.map((s, idx) => {
      const p = idx === stats.length - 1 ? currentPendingCount : s.pending;
      return Math.max(s.successful, p, 10);
    }),
    25
  );
  // Round up to nearest multiple of 5
  const yMax = Math.ceil(maxVal / 5) * 5;

  const colWidth = usableWidth / stats.length;
  const barWidth = 10;
  const gap = 3;

  return (
    <div className="sync-volume-dashboard mt-3 pt-3.5 border-t border-slate-800/80 space-y-3">
      {/* HEADER & SUMMARY METRICS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white tracking-wide">
                Volume de Synchronisation (7 derniers jours)
              </span>
              <span className="text-[10px] px-1.5 py-0.2 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded font-mono font-bold">
                {successRate}% succès
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Historique des paquets transmis avec succès vs en attente de réseau
            </p>
          </div>
        </div>

        {/* STAT PILLS */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-2 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-[10px] text-emerald-300 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold">{totalSuccessful} réussies</span>
          </div>
          <div className="px-2 py-1 rounded-lg bg-amber-950/60 border border-amber-500/30 text-[10px] text-amber-300 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="font-semibold">{totalPending} en attente</span>
          </div>
        </div>
      </div>

      {/* SVG CHART CONTAINER */}
      <div className="p-3 bg-slate-950/90 rounded-2xl border border-slate-800/80 relative overflow-hidden">
        {/* Subtitle / Legend */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2 px-1">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-t from-emerald-600 to-emerald-400 inline-block shadow-sm" />
              <span className="text-slate-300 font-medium">Réussies (Synchro)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-t from-amber-600 to-amber-400 inline-block shadow-sm" />
              <span className="text-slate-300 font-medium">En attente (Cache)</span>
            </span>
          </div>
          <span className="text-[9px] text-slate-500 italic hidden sm:inline">
            Touchez ou survolez une barre pour voir le détail
          </span>
        </div>

        {/* SVG RENDER */}
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-28 sm:h-32 select-none"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="syncSuccessGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#059669" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#34d399" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="syncPendingGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#d97706" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity="1" />
              </linearGradient>
            </defs>

            {/* HORIZONTAL GRID LINES & Y LABELS */}
            {[0, 0.5, 1].map((ratio) => {
              const yVal = Math.round(yMax * ratio);
              const yPos = topPadding + usableHeight * (1 - ratio);
              return (
                <g key={ratio}>
                  <line
                    x1={leftPadding}
                    y1={yPos}
                    x2={chartWidth - rightPadding}
                    y2={yPos}
                    stroke="#1e293b"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <text
                    x={leftPadding - 6}
                    y={yPos + 3}
                    textAnchor="end"
                    fill="#64748b"
                    fontSize="8"
                    fontFamily="monospace"
                  >
                    {yVal}
                  </text>
                </g>
              );
            })}

            {/* COLUMNS & BARS FOR EACH OF THE 7 DAYS */}
            {stats.map((day, idx) => {
              const isToday = idx === stats.length - 1;
              const pendingVal = isToday ? currentPendingCount : day.pending;
              const successVal = day.successful;

              const colX = leftPadding + idx * colWidth;
              const centerX = colX + colWidth / 2;

              const successHeight = Math.max((successVal / yMax) * usableHeight, 2);
              const successY = topPadding + (usableHeight - successHeight);

              const pendingHeight = pendingVal > 0 ? Math.max((pendingVal / yMax) * usableHeight, 3) : 0;
              const pendingY = topPadding + (usableHeight - pendingHeight);

              const isHovered = hoveredIndex === idx;

              return (
                <g
                  key={day.date}
                  className="cursor-pointer transition-opacity"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => setHoveredIndex(idx === hoveredIndex ? null : idx)}
                >
                  {/* Column Background Highlight on Hover */}
                  <rect
                    x={colX + 2}
                    y={topPadding - 4}
                    width={colWidth - 4}
                    height={usableHeight + bottomPadding}
                    rx="6"
                    fill={isHovered ? 'rgba(52, 211, 153, 0.08)' : isToday ? 'rgba(255, 255, 255, 0.02)' : 'transparent'}
                    stroke={isHovered ? '#10b981' : isToday ? '#334155' : 'transparent'}
                    strokeWidth={isHovered ? '1' : '0.5'}
                    strokeDasharray={isToday && !isHovered ? '2 2' : 'none'}
                  />

                  {/* SUCCESSFUL SYNC BAR */}
                  <rect
                    x={centerX - barWidth - gap / 2}
                    y={successY}
                    width={barWidth}
                    height={successHeight}
                    rx="2.5"
                    fill="url(#syncSuccessGrad)"
                    className="transition-all duration-300"
                    opacity={hoveredIndex === null || isHovered ? 1 : 0.65}
                  />

                  {/* Number label on top of success bar */}
                  {successVal > 0 && (
                    <text
                      x={centerX - barWidth / 2 - gap / 2}
                      y={successY - 3}
                      textAnchor="middle"
                      fill="#6ee7b7"
                      fontSize="8"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {successVal}
                    </text>
                  )}

                  {/* PENDING SYNC BAR */}
                  {pendingHeight > 0 && (
                    <>
                      <rect
                        x={centerX + gap / 2}
                        y={pendingY}
                        width={barWidth}
                        height={pendingHeight}
                        rx="2.5"
                        fill="url(#syncPendingGrad)"
                        className="transition-all duration-300"
                        opacity={hoveredIndex === null || isHovered ? 1 : 0.65}
                      />
                      <text
                        x={centerX + barWidth / 2 + gap / 2}
                        y={pendingY - 3}
                        textAnchor="middle"
                        fill="#fcd34d"
                        fontSize="8"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {pendingVal}
                      </text>
                    </>
                  )}

                  {/* DAY LABEL */}
                  <text
                    x={centerX}
                    y={chartHeight - 6}
                    textAnchor="middle"
                    fill={isToday ? '#34d399' : isHovered ? '#f1f5f9' : '#94a3b8'}
                    fontSize={isToday ? '9' : '8'}
                    fontWeight={isToday || isHovered ? 'bold' : 'normal'}
                  >
                    {day.dayLabel}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* ACTIVE / HOVERED TOOLTIP POPUP */}
        {hoveredIndex !== null && stats[hoveredIndex] && (
          <div className="mt-2.5 p-2 bg-slate-900 border border-slate-700/80 rounded-xl flex items-center justify-between gap-2 text-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">
                {stats[hoveredIndex].fullDate}
                {hoveredIndex === stats.length - 1 && ' (En direct)'}
              </span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{stats[hoveredIndex].successful} réussies</span>
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {hoveredIndex === stats.length - 1
                    ? currentPendingCount
                    : stats[hoveredIndex].pending}{' '}
                  en attente
                </span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* SUBTLE FIELD ADVICE */}
      <div className="flex items-center gap-2 px-1 text-[10px] text-slate-400">
        <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>
          Le système synchronise automatiquement chaque livraison terminée dès que le signal 4G/WiFi est rétabli.
        </span>
      </div>
    </div>
  );
};
