import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, CloudCheck } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 z-40 px-3.5 py-2 rounded-lg border text-xs flex items-center gap-2.5 shadow-xl transition-all duration-300 ${
        isOnline
          ? 'bg-emerald-950/90 text-emerald-200 border-emerald-800 backdrop-blur-sm'
          : 'bg-amber-950/90 text-amber-200 border-amber-800 backdrop-blur-sm animate-pulse'
      }`}
    >
      {isOnline ? (
        <>
          <CloudCheck className="w-4 h-4 text-emerald-400" />
          <span>Connexion rétablie — Données synchronisées en temps réel.</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 text-amber-400" />
          <span>
            Mode Hors-Ligne actif — Toutes les opérations sont sauvegardées en local.
          </span>
        </>
      )}
    </div>
  );
};
