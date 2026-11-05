import React, { useId, useMemo, useState } from 'react';
import * as d3 from 'd3';
import {
  MapPin,
  Navigation,
  CheckCircle2,
  Clock,
  Compass,
  Maximize2,
  Phone,
  Package,
  Flag,
  User,
  X,
  Bike,
  Store,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';
import { Order } from '../../types';

// Coordinates lookup for Cameroon neighborhoods (Yaoundé & Douala)
const QUARTIER_COORDINATES: Record<string, { lat: number; lng: number }> = {
  bastos: { lat: 3.892, lng: 11.512 },
  mokolo: { lat: 3.871, lng: 11.498 },
  omnisports: { lat: 3.882, lng: 11.536 },
  'biyem-assi': { lat: 3.845, lng: 11.487 },
  'centre-ville': { lat: 3.866, lng: 11.516 },
  mendong: { lat: 3.832, lng: 11.478 },
  nlongkak: { lat: 3.881, lng: 11.518 },
  essos: { lat: 3.872, lng: 11.539 },
  tsinga: { lat: 3.883, lng: 11.502 },
  mvan: { lat: 3.818, lng: 11.514 },
  melen: { lat: 3.858, lng: 11.495 },
  ngousso: { lat: 3.896, lng: 11.545 },
  odza: { lat: 3.812, lng: 11.532 },
  akwa: { lat: 4.051, lng: 9.704 },
  bonanjo: { lat: 4.043, lng: 9.689 },
  bonapriso: { lat: 4.032, lng: 9.697 },
  deido: { lat: 4.062, lng: 9.712 },
};

function resolveCoords(quartier: string, fallbackLat = 3.8667, fallbackLng = 11.5167) {
  const norm = (quartier || '').trim().toLowerCase();
  for (const [key, coords] of Object.entries(QUARTIER_COORDINATES)) {
    if (norm.includes(key) || key.includes(norm)) {
      return coords;
    }
  }
  return { lat: fallbackLat, lng: fallbackLng };
}

function haversineDistKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface DeliveryPathMapProps {
  order: Order;
  isDarkMode?: boolean;
  height?: number;
  expanded?: boolean;
  onExpand?: () => void;
  className?: string;
  avoidTraffic?: boolean;
  trafficDensityScore?: number;
  bypassSavingsMinutes?: number;
}

interface WaypointPoint {
  x: number;
  y: number;
  label: string;
  type: 'start' | 'transit' | 'end';
}

export const DeliveryPathMap: React.FC<DeliveryPathMapProps> = ({
  order,
  isDarkMode = true,
  height = 135,
  expanded = false,
  onExpand,
  className = '',
  avoidTraffic = true,
  trafficDensityScore = 78,
  bypassSavingsMinutes = 8,
}) => {
  const uniqueId = useId().replace(/:/g, '');
  const [selectedMarker, setSelectedMarker] = useState<'pickup' | 'delivery' | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<{
    x: number;
    y: number;
    text: string;
    sub: string;
  } | null>(null);

  // Derive start & end geographic coordinates
  const pickupCoords = useMemo(() => {
    return resolveCoords(order.pickupQuartier || 'Bastos', 3.881, 11.518);
  }, [order.pickupQuartier]);

  const deliveryCoords = useMemo(() => {
    return resolveCoords(order.deliveryQuartier || 'Mendong', 3.832, 11.478);
  }, [order.deliveryQuartier]);

  // Compute road distance and realistic delivery duration
  const distanceKm = useMemo(() => {
    const rawDist = haversineDistKm(
      pickupCoords.lat,
      pickupCoords.lng,
      deliveryCoords.lat,
      deliveryCoords.lng
    );
    // Factor for road network curve (1.35x)
    return Math.max(1.2, Math.round(rawDist * 1.35 * 10) / 10);
  }, [pickupCoords, deliveryCoords]);

  const estimatedDurationMinutes = useMemo(() => {
    return Math.max(8, Math.round(distanceKm * 3.2));
  }, [distanceKm]);

  // Viewbox width & height
  const svgWidth = 380;
  const svgHeight = Math.max(125, height);

  // Generate D3 projection points and path
  const { pathData, waypoints, startPoint, endPoint, secondaryRoads, chevrons, midVehiclePoint } = useMemo(() => {
    // Generate 5-6 realistic GPS waypoints representing street turns
    const seed = (order.orderNumber || order.id || 'FLYT')
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);

    const jitter1 = ((seed % 17) - 8) / 100;
    const jitter2 = (((seed * 3) % 19) - 9) / 100;
    const jitter3 = (((seed * 7) % 23) - 11) / 100;

    // Relative progress points from 0 (pickup) to 1 (delivery)
    const detourSign = (seed % 2 === 0 ? 1 : -1);
    const bypassLatOffset = avoidTraffic ? detourSign * 0.012 : 0;
    const bypassLonOffset = avoidTraffic ? -detourSign * 0.010 : 0;

    const rawPoints = [
      {
        lon: pickupCoords.lng,
        lat: pickupCoords.lat,
        label: `Départ : ${order.pickupQuartier || 'Boutique'}`,
        type: 'start' as const,
      },
      {
        lon: pickupCoords.lng * 0.75 + deliveryCoords.lng * 0.25 + (avoidTraffic ? bypassLonOffset * 0.7 : jitter1 * 0.02),
        lat: pickupCoords.lat * 0.75 + deliveryCoords.lat * 0.25 + (avoidTraffic ? bypassLatOffset * 0.7 : -jitter2 * 0.02),
        label: avoidTraffic ? 'Déviation secondaire anti-bouchon' : 'Axe principal / Boulevard',
        type: 'transit' as const,
      },
      {
        lon: pickupCoords.lng * 0.5 + deliveryCoords.lng * 0.5 + (avoidTraffic ? bypassLonOffset : -jitter3 * 0.02),
        lat: pickupCoords.lat * 0.5 + deliveryCoords.lat * 0.5 + (avoidTraffic ? bypassLatOffset : jitter1 * 0.02),
        label: avoidTraffic ? 'Rocade fluide (Carrefour saturé évité)' : 'Carrefour / Transit intermédiaire (Trafic dense)',
        type: 'transit' as const,
      },
      {
        lon: pickupCoords.lng * 0.25 + deliveryCoords.lng * 0.75 + (avoidTraffic ? bypassLonOffset * 0.5 : jitter2 * 0.02),
        lat: pickupCoords.lat * 0.25 + deliveryCoords.lat * 0.75 + (avoidTraffic ? bypassLatOffset * 0.5 : jitter3 * 0.02),
        label: 'Voie de desserte quartier',
        type: 'transit' as const,
      },
      {
        lon: deliveryCoords.lng,
        lat: deliveryCoords.lat,
        label: `Arrivée : ${order.deliveryQuartier} (${order.recipientName})`,
        type: 'end' as const,
      },
    ];

    // Create D3 Linear Scales to fit nicely into the SVG canvas with margins
    const minLon = d3.min(rawPoints, (d) => d.lon) ?? 0;
    const maxLon = d3.max(rawPoints, (d) => d.lon) ?? 1;
    const minLat = d3.min(rawPoints, (d) => d.lat) ?? 0;
    const maxLat = d3.max(rawPoints, (d) => d.lat) ?? 1;

    const lonSpan = Math.max(0.007, maxLon - minLon);
    const latSpan = Math.max(0.007, maxLat - minLat);

    // Margins ensuring full clearance for custom pin teardrops (which stand 32px high)
    const leftMargin = 48;
    const rightMargin = 48;
    const topMargin = 40;
    const bottomMargin = 28;

    const xScale = d3
      .scaleLinear()
      .domain([minLon - lonSpan * 0.12, maxLon + lonSpan * 0.12])
      .range([leftMargin, svgWidth - rightMargin]);

    const yScale = d3
      .scaleLinear()
      .domain([minLat - latSpan * 0.12, maxLat + latSpan * 0.12])
      .range([svgHeight - bottomMargin, topMargin]);

    // Project points into SVG coordinates
    const projectedCoords: [number, number][] = rawPoints.map((p) => [
      xScale(p.lon),
      yScale(p.lat),
    ]);

    // D3 Line generator with Catmull-Rom smoothing for realistic road trajectory curves
    const lineGenerator = d3
      .line<[number, number]>()
      .x((d) => d[0])
      .y((d) => d[1])
      .curve(d3.curveCatmullRom.alpha(0.6));

    const pathString = lineGenerator(projectedCoords) || '';

    const projectedWaypoints: WaypointPoint[] = rawPoints.map((p, idx) => ({
      x: projectedCoords[idx][0],
      y: projectedCoords[idx][1],
      label: p.label,
      type: p.type,
    }));

    // Calculate directional chevrons along path segments for driver route context
    const chevronList: { x: number; y: number; angle: number }[] = [];
    for (let i = 0; i < projectedCoords.length - 1; i++) {
      const p1 = projectedCoords[i];
      const p2 = projectedCoords[i + 1];
      const midX = (p1[0] + p2[0]) / 2;
      const midY = (p1[1] + p2[1]) / 2;
      const angle = (Math.atan2(p2[1] - p1[1], p2[0] - p1[0]) * 180) / Math.PI;
      chevronList.push({ x: midX, y: midY, angle });
    }

    // Static secondary road network lines for background city grid effect
    const roads = [
      `M 0 ${svgHeight * 0.35} Q ${svgWidth * 0.5} ${svgHeight * 0.22} ${svgWidth} ${svgHeight * 0.38}`,
      `M 0 ${svgHeight * 0.72} Q ${svgWidth * 0.4} ${svgHeight * 0.82} ${svgWidth} ${svgHeight * 0.68}`,
      `M ${svgWidth * 0.26} 0 Q ${svgWidth * 0.3} ${svgHeight * 0.5} ${svgWidth * 0.22} ${svgHeight}`,
      `M ${svgWidth * 0.74} 0 Q ${svgWidth * 0.7} ${svgHeight * 0.5} ${svgWidth * 0.78} ${svgHeight}`,
    ];

    return {
      pathData: pathString,
      waypoints: projectedWaypoints,
      startPoint: projectedWaypoints[0],
      endPoint: projectedWaypoints[projectedWaypoints.length - 1],
      secondaryRoads: roads,
      chevrons: chevronList,
      midVehiclePoint: projectedWaypoints[2],
    };
  }, [order, pickupCoords, deliveryCoords, svgWidth, svgHeight]);

  // Smart label placement calculations to prevent clipping
  const startBadge = useMemo(() => {
    if (!startPoint) return { x: 0, y: 0, isBelow: false };
    const isBelow = startPoint.y < 58;
    const y = isBelow ? startPoint.y + 16 : startPoint.y - 38;
    const x = Math.min(Math.max(startPoint.x, 58), svgWidth - 58);
    return { x, y, isBelow };
  }, [startPoint, svgWidth]);

  const endBadge = useMemo(() => {
    if (!endPoint) return { x: 0, y: 0, isBelow: false };
    const isBelow = endPoint.y < 58;
    const y = isBelow ? endPoint.y + 16 : endPoint.y - 38;
    const x = Math.min(Math.max(endPoint.x, 58), svgWidth - 58);
    return { x, y, isBelow };
  }, [endPoint, svgWidth]);

  const gradientId = `routeGrad-${uniqueId}`;
  const glowFilterId = `glow-${uniqueId}`;
  const gridPatternId = `grid-${uniqueId}`;
  const markerShadowId = `markerShadow-${uniqueId}`;
  const pickupGradId = `pickupGrad-${uniqueId}`;
  const deliveryGradId = `deliveryGrad-${uniqueId}`;

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border transition-all select-none ${
        isDarkMode
          ? 'bg-slate-950/95 border-slate-800 shadow-inner'
          : 'bg-slate-100/95 border-slate-200 shadow-sm'
      } ${className}`}
    >
      {/* Top Header Information Overlay */}
      <div className="absolute top-2 left-2.5 right-2.5 flex items-center justify-between z-10 pointer-events-none">
        <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-800 text-[10px] text-slate-300 shadow-md">
          <Compass className="w-3 h-3 text-cyan-400" />
          <span className="font-semibold text-slate-400">Itinéraire Coursier :</span>
          <span className="font-bold text-amber-400 truncate max-w-[110px] sm:max-w-[130px]">
            {order.pickupQuartier || 'Bastos'}
          </span>
          <span className="text-cyan-400">➔</span>
          <span className="font-bold text-emerald-400 truncate max-w-[110px] sm:max-w-[130px]">
            {order.deliveryQuartier}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {avoidTraffic ? (
            <div className="bg-emerald-950/90 border border-emerald-500/50 px-2 py-0.5 rounded-lg text-[9px] font-bold text-emerald-300 flex items-center gap-1 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Voie bis (-{bypassSavingsMinutes}m)</span>
            </div>
          ) : (
            <div className="bg-amber-950/90 border border-amber-500/40 px-2 py-0.5 rounded-lg text-[9px] font-bold text-amber-300 flex items-center gap-1 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Trafic {trafficDensityScore}%</span>
            </div>
          )}

          <div className="bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-800 text-[10px] font-mono text-emerald-300 font-bold flex items-center gap-1 shadow-md">
            <Navigation className="w-2.5 h-2.5 text-cyan-400" />
            <span>{distanceKm} km</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-300 font-normal flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" />
              {estimatedDurationMinutes} min
            </span>
          </div>

          {onExpand && !expanded && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onExpand();
              }}
              className="pointer-events-auto p-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors shadow-md"
              title="Agrandir le tracé"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Interactive Tooltip on Hover/Touch */}
      {activeTooltip && (
        <div
          className="absolute z-30 pointer-events-none px-2.5 py-1.5 rounded-xl bg-slate-900/95 border border-cyan-500/40 text-white text-[10px] shadow-2xl backdrop-blur-md -translate-x-1/2 -translate-y-full"
          style={{
            left: `${(activeTooltip.x / svgWidth) * 100}%`,
            top: `${activeTooltip.y - 12}px`,
          }}
        >
          <p className="font-bold text-cyan-300">{activeTooltip.text}</p>
          <p className="text-[9px] text-slate-400">{activeTooltip.sub}</p>
        </div>
      )}

      {/* SVG Canvas with D3 Road Map & Custom Pickup/Delivery Markers */}
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto block"
        style={{ height: `${svgHeight}px` }}
        role="img"
        aria-label={`Tracé de livraison effectué avec marqueur de ramassage à ${order.pickupQuartier} et destination finale à ${order.deliveryQuartier}`}
      >
        <defs>
          {/* Subtle Map Grid Pattern */}
          <pattern
            id={gridPatternId}
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 24 0 L 0 0 0 24"
              fill="none"
              stroke={isDarkMode ? '#334155' : '#cbd5e1'}
              strokeWidth="0.5"
              strokeOpacity={isDarkMode ? '0.22' : '0.4'}
            />
          </pattern>

          {/* Marker Drop Shadow for 3D Pin Elevation */}
          <filter id={markerShadowId} x="-40%" y="-40%" width="180%" height="190%">
            <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.65" />
          </filter>

          {/* Neon Glow Filter for Trajectory */}
          <filter id={glowFilterId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Trajectory Gradient (Amber/Cyan -> Emerald) */}
          <linearGradient
            id={gradientId}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="35%" stopColor="#06b6d4" />
            <stop offset="75%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>

          {/* Custom Pickup Marker Gradient (Amber / Orange) */}
          <linearGradient
            id={pickupGradId}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="60%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>

          {/* Custom Delivery Marker Gradient (Emerald / Teal) */}
          <linearGradient
            id={deliveryGradId}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="60%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>

        {/* Map Grid Background */}
        <rect
          width={svgWidth}
          height={svgHeight}
          fill={isDarkMode ? '#030712' : '#f8fafc'}
        />
        <rect width={svgWidth} height={svgHeight} fill={`url(#${gridPatternId})`} />

        {/* Subtle Background City Road Network */}
        <g stroke={isDarkMode ? '#1e293b' : '#e2e8f0'} strokeWidth="1.5" fill="none">
          {secondaryRoads.map((d, i) => (
            <path key={i} d={d} strokeDasharray={i % 2 === 0 ? 'none' : '4 4'} opacity="0.8" />
          ))}
        </g>

        {/* Outer Glow Path for the Route */}
        <path
          d={pathData}
          fill="none"
          stroke="#06b6d4"
          strokeWidth="6"
          strokeOpacity="0.22"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Middle Soft Glow Path */}
        <path
          d={pathData}
          fill="none"
          stroke="#10b981"
          strokeWidth="4"
          strokeOpacity="0.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#${glowFilterId})`}
        />

        {/* Main D3 Curved Trajectory Line */}
        <path
          d={pathData}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Direction Flow Dots / Dynamic Delivery Pulse Along Trajectory */}
        <path
          d={pathData}
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.2"
          strokeDasharray="5 14"
          strokeLinecap="round"
          strokeOpacity="0.85"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="100"
            to="0"
            dur="4s"
            repeatCount="indefinite"
          />
        </path>

        {/* Segment Directional Chevron Arrows for Visual Route Flow Context */}
        {chevrons.map((ch, idx) => (
          <g
            key={`ch-${idx}`}
            transform={`translate(${ch.x}, ${ch.y}) rotate(${ch.angle})`}
            opacity="0.9"
          >
            <path
              d="M -3 -3 L 1 0 L -3 3"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        ))}

        {/* Intermediate Waypoints */}
        {waypoints.map((wp, idx) => {
          if (wp.type !== 'transit') return null;
          return (
            <g
              key={idx}
              className="cursor-pointer group"
              onMouseEnter={() =>
                setActiveTooltip({
                  x: wp.x,
                  y: wp.y,
                  text: wp.label,
                  sub: 'Carrefour de transit intermédiaire',
                })
              }
              onMouseLeave={() => setActiveTooltip(null)}
            >
              <circle
                cx={wp.x}
                cy={wp.y}
                r="4.5"
                fill={isDarkMode ? '#0f172a' : '#ffffff'}
                stroke="#06b6d4"
                strokeWidth="1.6"
              />
              <circle cx={wp.x} cy={wp.y} r="2" fill="#38bdf8" />
            </g>
          );
        })}

        {/* Mid-route Courier Transit Icon */}
        {midVehiclePoint && (
          <g
            transform={`translate(${midVehiclePoint.x}, ${midVehiclePoint.y})`}
            className="pointer-events-none"
          >
            <circle r="7" fill="#06b6d4" fillOpacity="0.2" className="animate-pulse" />
            <circle r="3.5" fill="#0891b2" stroke="#ffffff" strokeWidth="1" />
          </g>
        )}

        {/* ========================================================================= */}
        {/* CUSTOM PICKUP LOCATION MARKER (POINT A - RAMASSAGE)                      */}
        {/* ========================================================================= */}
        {startPoint && (
          <g
            className="cursor-pointer transition-transform hover:scale-105"
            onClick={() => setSelectedMarker(selectedMarker === 'pickup' ? null : 'pickup')}
            onMouseEnter={() =>
              setActiveTooltip({
                x: startPoint.x,
                y: startPoint.y,
                text: `Point A (Ramassage) : ${order.pickupQuartier || 'Boutique'}`,
                sub: `Expéditeur : ${order.senderName || order.boutiqueName} · ${order.senderPhone || ''}`,
              })
            }
            onMouseLeave={() => setActiveTooltip(null)}
          >
            {/* Ground Contact Shadow */}
            <ellipse
              cx={startPoint.x}
              cy={startPoint.y + 1}
              rx="8.5"
              ry="3"
              fill="#000000"
              fillOpacity="0.45"
            />

            {/* Ground Pulsing Radar Waves */}
            <circle
              cx={startPoint.x}
              cy={startPoint.y}
              r="10"
              fill="#f59e0b"
              fillOpacity="0.3"
              className="animate-ping"
            />

            {/* Ground Anchor Point */}
            <circle
              cx={startPoint.x}
              cy={startPoint.y}
              r="3.5"
              fill="#f59e0b"
              stroke="#ffffff"
              strokeWidth="1.5"
            />

            {/* Custom 3D Teardrop Pin for Pickup */}
            <g
              transform={`translate(${startPoint.x}, ${startPoint.y})`}
              filter={`url(#${markerShadowId})`}
            >
              {/* Teardrop Pin Shape (Tip at 0, 0) */}
              <path
                d="M 0 0 C -2.8 -4.5 -11 -12 -11 -21 A 11 11 0 1 1 11 -21 C 11 -12 2.8 -4.5 0 0 Z"
                fill={`url(#${pickupGradId})`}
                stroke="#ffffff"
                strokeWidth="1.8"
              />

              {/* Inner Circular Badge */}
              <circle cx="0" cy="-21" r="7.5" fill="#ffffff" />

              {/* Stylized Package / Store Icon */}
              <g transform="translate(0, -21)">
                {/* 3D Box Package */}
                <path d="M -4 -2.5 L 0 -4.5 L 4 -2.5 L 0 -0.5 Z" fill="#d97706" />
                <path d="M -4 -2.5 L 0 -0.5 L 0 4 L -4 2 Z" fill="#b45309" />
                <path d="M 4 -2.5 L 0 -0.5 L 0 4 L 4 2 Z" fill="#f59e0b" />
                <line x1="0" y1="-0.5" x2="0" y2="4" stroke="#ffffff" strokeWidth="0.5" opacity="0.8" />
              </g>

              {/* Badge Label "A" at Top-Right */}
              <g transform="translate(5, -31)">
                <rect
                  x="0"
                  y="0"
                  width="13"
                  height="11"
                  rx="3.5"
                  fill="#92400e"
                  stroke="#ffffff"
                  strokeWidth="1"
                />
                <text
                  x="6.5"
                  y="8.5"
                  textAnchor="middle"
                  fontSize="7.5"
                  fontWeight="900"
                  fill="#ffffff"
                  fontFamily="system-ui, sans-serif"
                >
                  A
                </text>
              </g>
            </g>

            {/* Accompanying Floating Callout Badge for Point A */}
            <g transform={`translate(${startBadge.x}, ${startBadge.y})`}>
              <rect
                x="-52"
                y="-9"
                width="104"
                height="18"
                rx="6"
                fill={isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.98)'}
                stroke="#f59e0b"
                strokeWidth="1.2"
                filter={`url(#${markerShadowId})`}
              />
              <circle cx="-42" cy="0" r="3.5" fill="#f59e0b" />
              <text
                x="-34"
                y="3"
                fontSize="7.5"
                fontWeight="800"
                fill="#f59e0b"
                fontFamily="system-ui, sans-serif"
              >
                A · RAMASSAGE
              </text>
              <text
                x="26"
                y="3"
                textAnchor="middle"
                fontSize="7"
                fontWeight="700"
                fill={isDarkMode ? '#ffffff' : '#0f172a'}
                fontFamily="system-ui, sans-serif"
              >
                {order.pickupQuartier
                  ? order.pickupQuartier.length > 8
                    ? order.pickupQuartier.slice(0, 8) + '…'
                    : order.pickupQuartier
                  : 'Boutique'}
              </text>
            </g>
          </g>
        )}

        {/* ========================================================================= */}
        {/* CUSTOM DELIVERY LOCATION MARKER (POINT B - DESTINATION CLIENT)           */}
        {/* ========================================================================= */}
        {endPoint && (
          <g
            className="cursor-pointer transition-transform hover:scale-105"
            onClick={() => setSelectedMarker(selectedMarker === 'delivery' ? null : 'delivery')}
            onMouseEnter={() =>
              setActiveTooltip({
                x: endPoint.x,
                y: endPoint.y,
                text: `Point B (Livré) : ${order.deliveryQuartier}`,
                sub: `Destinataire : ${order.recipientName} · ${order.signatureTimestamp || 'Livré'}`,
              })
            }
            onMouseLeave={() => setActiveTooltip(null)}
          >
            {/* Ground Contact Shadow */}
            <ellipse
              cx={endPoint.x}
              cy={endPoint.y + 1}
              rx="9.5"
              ry="3.5"
              fill="#000000"
              fillOpacity="0.45"
            />

            {/* Ground Pulsing Radar Waves */}
            <circle
              cx={endPoint.x}
              cy={endPoint.y}
              r="12"
              fill="#10b981"
              fillOpacity="0.32"
              className="animate-ping"
            />

            {/* Ground Anchor Point */}
            <circle
              cx={endPoint.x}
              cy={endPoint.y}
              r="4"
              fill="#10b981"
              stroke="#ffffff"
              strokeWidth="1.6"
            />

            {/* Custom 3D Teardrop Pin for Delivery */}
            <g
              transform={`translate(${endPoint.x}, ${endPoint.y})`}
              filter={`url(#${markerShadowId})`}
            >
              {/* Teardrop Pin Shape (Tip at 0, 0) */}
              <path
                d="M 0 0 C -2.8 -4.5 -12 -13 -12 -22 A 12 12 0 1 1 12 -22 C 12 -13 2.8 -4.5 0 0 Z"
                fill={`url(#${deliveryGradId})`}
                stroke="#ffffff"
                strokeWidth="2"
              />

              {/* Inner Circular Badge */}
              <circle cx="0" cy="-22" r="8" fill="#ffffff" />

              {/* Stylized Checkmark / Destination Flag Icon */}
              <g transform="translate(0, -22)">
                <path
                  d="M -3.5 -0.5 L -1 2 L 4 -3"
                  fill="none"
                  stroke="#059669"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>

              {/* Badge Label "B" at Top-Right */}
              <g transform="translate(5, -33)">
                <rect
                  x="0"
                  y="0"
                  width="13"
                  height="11"
                  rx="3.5"
                  fill="#065f46"
                  stroke="#ffffff"
                  strokeWidth="1"
                />
                <text
                  x="6.5"
                  y="8.5"
                  textAnchor="middle"
                  fontSize="7.5"
                  fontWeight="900"
                  fill="#ffffff"
                  fontFamily="system-ui, sans-serif"
                >
                  B
                </text>
              </g>
            </g>

            {/* Accompanying Floating Callout Badge for Point B */}
            <g transform={`translate(${endBadge.x}, ${endBadge.y})`}>
              <rect
                x="-52"
                y="-9"
                width="104"
                height="18"
                rx="6"
                fill={isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.98)'}
                stroke="#10b981"
                strokeWidth="1.2"
                filter={`url(#${markerShadowId})`}
              />
              <circle cx="-42" cy="0" r="3.5" fill="#10b981" />
              <text
                x="-34"
                y="3"
                fontSize="7.5"
                fontWeight="800"
                fill="#10b981"
                fontFamily="system-ui, sans-serif"
              >
                B · DESTINATION
              </text>
              <text
                x="26"
                y="3"
                textAnchor="middle"
                fontSize="7"
                fontWeight="700"
                fill={isDarkMode ? '#ffffff' : '#0f172a'}
                fontFamily="system-ui, sans-serif"
              >
                {order.deliveryQuartier
                  ? order.deliveryQuartier.length > 8
                    ? order.deliveryQuartier.slice(0, 8) + '…'
                    : order.deliveryQuartier
                  : 'Client'}
              </text>
            </g>
          </g>
        )}
      </svg>

      {/* Interactive Detail Drawer for Selected Marker (Point A or B) */}
      {selectedMarker && (
        <div className="absolute inset-x-2 bottom-9 z-20 p-2.5 rounded-xl bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-2 duration-150 text-xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
            <div className="flex items-center gap-1.5 font-bold">
              {selectedMarker === 'pickup' ? (
                <>
                  <div className="w-4 h-4 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-black">
                    A
                  </div>
                  <span className="text-amber-400">Point de Ramassage (Enlèvement)</span>
                </>
              ) : (
                <>
                  <div className="w-4 h-4 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-black">
                    B
                  </div>
                  <span className="text-emerald-400">Destination Client (Livraison)</span>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedMarker(null)}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
              title="Fermer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="pt-1.5 space-y-1 text-[11px]">
            {selectedMarker === 'pickup' ? (
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div>
                  <span className="text-[10px] text-slate-500 block">Lieu & Expéditeur</span>
                  <p className="font-bold text-white truncate">{order.pickupQuartier || 'Boutique'}</p>
                  <p className="text-slate-400 truncate">{order.senderName || order.boutiqueName}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Contact & Heure</span>
                  {order.senderPhone ? (
                    <a
                      href={`tel:${order.senderPhone}`}
                      className="font-bold text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      {order.senderPhone}
                    </a>
                  ) : (
                    <p className="text-slate-400">Non renseigné</p>
                  )}
                  <p className="text-[10px] text-slate-400">
                    Pris en charge : {order.pickedUpAt ? new Date(order.pickedUpAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '14h10'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div>
                  <span className="text-[10px] text-slate-500 block">Destinataire & Quartier</span>
                  <p className="font-bold text-white truncate">{order.recipientName}</p>
                  <p className="text-emerald-400 font-semibold truncate">{order.deliveryQuartier}</p>
                  {order.deliveryAddressDetails && (
                    <p className="text-[10px] text-slate-400 truncate">{order.deliveryAddressDetails}</p>
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Téléphone & Preuve</span>
                  {order.recipientPhone ? (
                    <a
                      href={`tel:${order.recipientPhone}`}
                      className="font-bold text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      {order.recipientPhone}
                    </a>
                  ) : (
                    <p className="text-slate-400">Non renseigné</p>
                  )}
                  {order.amountToCollect > 0 && (
                    <p className="text-[10px] font-mono text-amber-300 font-bold">
                      COD : {order.amountToCollect.toLocaleString('fr-FR')} FCFA
                    </p>
                  )}
                  {order.signatureTimestamp && (
                    <p className="text-[10px] text-emerald-300 font-mono">
                      Remis à {order.signatureTimestamp}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interactive Legend Bar & Route Summary */}
      <div className="px-3 py-1.5 bg-slate-900/95 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-300 gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Quick Marker A Focus Chip */}
          <button
            type="button"
            onClick={() => setSelectedMarker(selectedMarker === 'pickup' ? null : 'pickup')}
            className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-all ${
              selectedMarker === 'pickup'
                ? 'bg-amber-500/25 border-amber-400 text-amber-300 ring-2 ring-amber-500/30'
                : 'bg-slate-800/80 border-slate-700 text-amber-400 hover:border-amber-500/50'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            <span className="truncate max-w-[85px] sm:max-w-[110px]">
              A : {order.pickupQuartier || 'Ramassage'}
            </span>
          </button>

          <span className="text-slate-600 text-xs">➔</span>

          {/* Quick Marker B Focus Chip */}
          <button
            type="button"
            onClick={() => setSelectedMarker(selectedMarker === 'delivery' ? null : 'delivery')}
            className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-all ${
              selectedMarker === 'delivery'
                ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 ring-2 ring-emerald-500/30'
                : 'bg-slate-800/80 border-slate-700 text-emerald-400 hover:border-emerald-500/50'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            <span className="truncate max-w-[85px] sm:max-w-[110px]">
              B : {order.deliveryQuartier}
            </span>
          </button>
        </div>

        {/* Status / ETA */}
        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 ml-auto">
          <span className="text-cyan-400 font-bold">{distanceKm} km</span>
          <span>·</span>
          <span className="text-slate-300">~{estimatedDurationMinutes} min</span>
          {order.status === 'delivered' ? (
            <span className="text-emerald-400 font-bold flex items-center gap-0.5">
              <CheckCircle2 className="w-2.5 h-2.5" />
              Livré
            </span>
          ) : (
            <span className="text-cyan-400 font-bold flex items-center gap-0.5">
              <Bike className="w-2.5 h-2.5" />
              En cours
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
