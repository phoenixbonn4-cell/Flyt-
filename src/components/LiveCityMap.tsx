import React, { useState } from 'react';
import { Driver, Order } from '../types';
import { Navigation, Bike, Compass, MapPin, Radio, Phone } from 'lucide-react';

interface LiveCityMapProps {
  city?: string;
  drivers: Driver[];
  orders: Order[];
  onSelectDriver?: (driver: Driver) => void;
  onSelectOrder?: (order: Order) => void;
}

// Coordinate mapping onto a 800x500 SVG canvas
// Yaoundé coordinates approx 3.84 to 3.91 Lat, 11.48 to 11.54 Lng
function toCanvasCoords(lat: number, lng: number) {
  const minLat = 3.82;
  const maxLat = 3.92;
  const minLng = 11.47;
  const maxLng = 11.55;

  const x = ((lng - minLng) / (maxLng - minLng)) * 760 + 20;
  const y = 480 - ((lat - minLat) / (maxLat - minLat)) * 440;

  return { x: Math.max(30, Math.min(770, x)), y: Math.max(30, Math.min(470, y)) };
}

export const LiveCityMap: React.FC<LiveCityMapProps> = ({
  city = 'Yaoundé',
  drivers,
  orders,
  onSelectDriver,
  onSelectOrder,
}) => {
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  // Key neighborhoods for Yaoundé
  const quartiers = [
    { name: 'Bastos', lat: 3.892, lng: 11.512 },
    { name: 'Mokolo', lat: 3.871, lng: 11.498 },
    { name: 'Omnisports', lat: 3.882, lng: 11.536 },
    { name: 'Biyem-Assi', lat: 3.845, lng: 11.487 },
    { name: 'Centre-ville', lat: 3.866, lng: 11.516 },
    { name: 'Mendong', lat: 3.832, lng: 11.478 },
    { name: 'Nlongkak', lat: 3.881, lng: 11.518 },
    { name: 'Essos', lat: 3.872, lng: 11.539 },
  ];

  const activeOrders = orders.filter((o) => o.status === 'in_progress');
  const selectedDriver = drivers.find((d) => d.id === selectedDriverId);

  return (
    <div className="relative w-full bg-[#070B13] border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col">
      {/* Map Control Bar */}
      <div className="p-3.5 bg-slate-900/80 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Radar GPS Temps Réel · {city}</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            {drivers.filter((d) => d.status !== 'offline').length} livreurs connectés
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[11px] text-slate-400 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
            <span>Disponible</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] animate-pulse" />
            <span>En course</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>Point Livraison</span>
          </div>
        </div>
      </div>

      {/* Interactive SVG Canvas */}
      <div className="relative w-full h-[400px] sm:h-[460px] overflow-hidden bg-[#050811]">
        <svg
          viewBox="0 0 800 500"
          className="w-full h-full select-none"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Grid pattern */}
            <pattern id="radar-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(30, 41, 59, 0.4)" strokeWidth="0.8" />
            </pattern>
            {/* Radar scan gradient */}
            <radialGradient id="radar-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(16, 185, 129, 0.08)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>

          {/* Grid background */}
          <rect width="800" height="500" fill="url(#radar-grid)" />
          <circle cx="400" cy="250" r="280" fill="url(#radar-glow)" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="400" cy="250" r="160" stroke="rgba(16, 185, 129, 0.2)" strokeWidth="1" strokeDasharray="3 3" fill="none" />

          {/* City Arteries & Roads */}
          <path
            d="M 50 180 Q 240 220 400 240 T 750 320"
            fill="none"
            stroke="rgba(51, 65, 85, 0.6)"
            strokeWidth="2.5"
          />
          <path
            d="M 120 450 Q 320 380 400 240 T 560 60"
            fill="none"
            stroke="rgba(51, 65, 85, 0.6)"
            strokeWidth="2.5"
          />
          <path
            d="M 280 80 Q 380 200 680 420"
            fill="none"
            stroke="rgba(51, 65, 85, 0.4)"
            strokeWidth="1.5"
          />

          {/* Neighborhood Labels */}
          {quartiers.map((q) => {
            const pos = toCanvasCoords(q.lat, q.lng);
            return (
              <g key={q.name} transform={`translate(${pos.x}, ${pos.y})`}>
                <circle cx="0" cy="0" r="3" fill="#475569" />
                <text
                  x="0"
                  y="-8"
                  textAnchor="middle"
                  className="fill-slate-500 font-mono text-[10px] tracking-wider uppercase font-semibold"
                >
                  {q.name}
                </text>
              </g>
            );
          })}

          {/* Active Orders connection lines (Route from pickup to destination) */}
          {activeOrders.map((ord) => {
            const driver = drivers.find((d) => d.id === ord.driverId);
            if (!driver) return null;
            const driverPos = toCanvasCoords(driver.currentLat, driver.currentLng);
            
            // Map pickup and delivery quartier
            const pickupQ = quartiers.find((q) => ord.pickupQuartier.toLowerCase().includes(q.name.toLowerCase())) || quartiers[0];
            const delivQ = quartiers.find((q) => ord.deliveryQuartier.toLowerCase().includes(q.name.toLowerCase())) || quartiers[1];

            const pPos = toCanvasCoords(pickupQ.lat, pickupQ.lng);
            const dPos = toCanvasCoords(delivQ.lat, delivQ.lng);

            return (
              <g key={ord.id} className="cursor-pointer" onClick={() => onSelectOrder?.(ord)}>
                {/* Trajectory */}
                <path
                  d={`M ${driverPos.x} ${driverPos.y} L ${dPos.x} ${dPos.y}`}
                  fill="none"
                  stroke="#06B6D4"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                  className="animate-pulse opacity-70"
                />
                {/* Delivery Destination Pin */}
                <circle cx={dPos.x} cy={dPos.y} r="7" fill="#F59E0B" className="drop-shadow-[0_0_8px_#f59e0b]" />
                <circle cx={dPos.x} cy={dPos.y} r="3" fill="#FFFFFF" />
              </g>
            );
          })}

          {/* Drivers Markers */}
          {drivers.map((drv) => {
            const pos = toCanvasCoords(drv.currentLat, drv.currentLng);
            const isSelected = selectedDriverId === drv.id;
            const isMoving = drv.status === 'on_delivery';

            return (
              <g
                key={drv.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                className="cursor-pointer transition-all duration-500"
                onClick={() => {
                  setSelectedDriverId(drv.id);
                  onSelectDriver?.(drv);
                }}
              >
                {/* Pulse ring for active drivers */}
                {isMoving && (
                  <circle
                    cx="0"
                    cy="0"
                    r="16"
                    fill="none"
                    stroke="#22D3EE"
                    strokeWidth="1.5"
                    className="animate-ping opacity-40"
                  />
                )}

                {/* Outer halo if selected */}
                {isSelected && (
                  <circle
                    cx="0"
                    cy="0"
                    r="18"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2"
                  />
                )}

                {/* Marker body */}
                <circle
                  cx="0"
                  cy="0"
                  r="10"
                  fill={isMoving ? '#06B6D4' : '#10B981'}
                  className="drop-shadow-[0_0_10px_rgba(16,185,129,0.7)]"
                />
                {/* Inner vehicle dot */}
                <circle cx="0" cy="0" r="4" fill="#090D16" />

                {/* Driver Tag Badge */}
                <g transform="translate(0, 18)">
                  <rect
                    x="-40"
                    y="0"
                    width="80"
                    height="17"
                    rx="4"
                    fill="#0F172A"
                    stroke={isSelected ? '#10B981' : '#334155'}
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="12"
                    textAnchor="middle"
                    className="fill-slate-200 text-[9px] font-bold font-mono tracking-tight"
                  >
                    {drv.name.split(' ')[0]}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Selected Driver floating telemetry inspector */}
        {selectedDriver && (
          <div className="absolute top-4 left-4 z-20 w-72 bg-slate-900/95 border border-slate-700/80 rounded-xl p-3.5 shadow-2xl backdrop-blur-md animate-in fade-in duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Bike className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white leading-tight">
                    {selectedDriver.name}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                    <span className="capitalize">{selectedDriver.vehicleType}</span>
                    <span>·</span>
                    <span className="font-mono text-emerald-400">★ {selectedDriver.rating}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedDriverId(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800 text-center text-xs">
              <div className="bg-slate-800/60 p-1.5 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Aujourd'hui</span>
                <span className="font-mono font-bold text-white text-sm">
                  {selectedDriver.todayDeliveries}
                </span>
              </div>
              <div className="bg-slate-800/60 p-1.5 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Semaine</span>
                <span className="font-mono font-bold text-white text-sm">
                  {selectedDriver.weekDeliveries}
                </span>
              </div>
              <div className="bg-slate-800/60 p-1.5 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Cagnotte</span>
                <span className="font-mono font-bold text-emerald-400 text-xs">
                  {selectedDriver.totalEarningsFcfa.toLocaleString('fr-FR')} F
                </span>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Zone : <strong className="text-white">{selectedDriver.currentZone}</strong>
              </span>
              <a
                href={`tel:${selectedDriver.phone}`}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-colors"
              >
                <Phone className="w-3 h-3" />
                Appeler
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
