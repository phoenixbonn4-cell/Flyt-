import React, { useState, useEffect } from 'react';
import { Order, Driver } from '../types';
import { playMissionAlert } from '../services/sound';
import { Bell, Navigation, CheckCircle2, X, Volume2, ShieldAlert, Sparkles, Phone } from 'lucide-react';

interface MissionAlertBannerProps {
  onAcceptMission?: (order: Order) => void;
  onNavigateToMission?: (order: Order) => void;
}

export const MissionAlertBanner: React.FC<MissionAlertBannerProps> = ({
  onAcceptMission,
  onNavigateToMission,
}) => {
  const [activeAlert, setActiveAlert] = useState<{ order: Order; driver: Driver } | null>(null);
  const [hasBrowserPermission, setHasBrowserPermission] = useState<boolean>(() => {
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
  });

  useEffect(() => {
    const handleMissionAssigned = (e: Event) => {
      const customEvent = e as CustomEvent<{ order: Order; driver: Driver }>;
      if (customEvent.detail && customEvent.detail.order) {
        playMissionAlert();
        setActiveAlert(customEvent.detail);
      }
    };

    window.addEventListener('flyt_mission_assigned', handleMissionAssigned);
    return () => {
      window.removeEventListener('flyt_mission_assigned', handleMissionAssigned);
    };
  }, []);

  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const result = await Notification.requestPermission();
        setHasBrowserPermission(result === 'granted');
        if (result === 'granted') {
          new Notification('🔔 Notifications FLYT Activées !', {
            body: 'Vous serez alerté même lorsque vous utilisez d\'autres applications ou que votre écran est en veille.',
          });
        }
      } catch {
        // ignore
      }
    }
  };

  if (!activeAlert) {
    // Show quick subtle toggle if browser notifications are not yet permitted
    if (!hasBrowserPermission && typeof window !== 'undefined' && 'Notification' in window) {
      return (
        <div className="fixed bottom-3 right-3 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <button
            onClick={requestNotificationPermission}
            className="px-3.5 py-2 bg-slate-900/95 hover:bg-slate-800 border border-emerald-500/40 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-2xl backdrop-blur-md transition-all group"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <Bell className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-12 transition-transform" />
            <span>Activer Notifications Arrière-plan</span>
          </button>
        </div>
      );
    }
    return null;
  }

  const { order, driver } = activeAlert;

  return (
    <div className="fixed top-20 right-4 z-50 w-full max-w-md animate-in slide-in-from-top-4 duration-300">
      <div className="bg-[#0B132B] border-2 border-emerald-500 rounded-3xl p-5 shadow-[0_0_35px_rgba(16,185,129,0.35)] relative overflow-hidden backdrop-blur-xl">
        {/* Animated radar glow effect */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header Strip */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-90" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_8px_#10b981]" />
            </span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">
                ALERTE NOUVELLE MISSION DÉTECTÉE
              </span>
              <span className="font-mono text-xs font-bold text-white">
                {order.orderNumber} · {order.parcelType}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => playMissionAlert()}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Rejouer le bip"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActiveAlert(null)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Trajectory description */}
        <div className="py-3 space-y-2 text-xs">
          <div className="flex items-start gap-2 text-slate-300">
            <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-[10px] font-bold text-amber-400 shrink-0 mt-0.5">
              A
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Ramassage :</span>
              <strong className="text-white truncate block">{order.senderName} ({order.pickupQuartier})</strong>
            </div>
          </div>

          <div className="flex items-start gap-2 text-slate-300">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-[10px] font-bold text-emerald-400 shrink-0 mt-0.5">
              B
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Livrer à :</span>
              <strong className="text-emerald-300 truncate block">
                {order.recipientName} ({order.deliveryQuartier})
              </strong>
            </div>
          </div>

          {order.amountToCollect > 0 && (
            <div className="p-2 bg-amber-950/40 border border-amber-500/30 rounded-xl flex items-center justify-between text-amber-300 font-mono text-xs">
              <span>Montant COD à encaisser :</span>
              <strong className="text-sm font-bold">{order.amountToCollect.toLocaleString('fr-FR')} FCFA</strong>
            </div>
          )}
        </div>

        {/* Big Action Buttons */}
        <div className="pt-2 flex items-center gap-2">
          <button
            onClick={() => {
              onAcceptMission?.(order);
              onNavigateToMission?.(order);
              setActiveAlert(null);
            }}
            className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Prendre en Charge la Course</span>
          </button>

          <button
            onClick={() => setActiveAlert(null)}
            className="px-3.5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-semibold transition-colors"
          >
            Ignorer
          </button>
        </div>
      </div>
    </div>
  );
};
