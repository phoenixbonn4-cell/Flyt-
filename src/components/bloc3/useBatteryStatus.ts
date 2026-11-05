import { useState, useEffect, useCallback } from 'react';

export interface BatteryState {
  level: number; // 0 to 100
  charging: boolean;
  isSupported: boolean;
  isSimulated: boolean;
}

export function useBatteryStatus() {
  const [batteryState, setBatteryState] = useState<BatteryState>({
    level: 84, // Realistic default
    charging: false,
    isSupported: false,
    isSimulated: false,
  });

  const [realBatteryRef, setRealBatteryRef] = useState<any>(null);

  useEffect(() => {
    let batteryInstance: any = null;
    let isMounted = true;

    // Check if the Battery Status API is available in the current browser
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any)
        .getBattery()
        .then((battery: any) => {
          if (!isMounted) return;
          batteryInstance = battery;
          setRealBatteryRef(battery);

          const updateStatus = () => {
            const rawLevel = typeof battery.level === 'number' ? battery.level : 0.85;
            setBatteryState((prev) => {
              if (prev.isSimulated) return prev; // Keep simulation if user explicitly set it
              return {
                level: Math.round(rawLevel * 100),
                charging: !!battery.charging,
                isSupported: true,
                isSimulated: false,
              };
            });
          };

          updateStatus();

          battery.addEventListener('levelchange', updateStatus);
          battery.addEventListener('chargingchange', updateStatus);
        })
        .catch((err: any) => {
          console.warn('Battery Status API was not granted or failed:', err);
          if (isMounted) {
            setBatteryState((prev) => ({
              ...prev,
              isSupported: false,
            }));
          }
        });
    }

    return () => {
      isMounted = false;
      if (batteryInstance) {
        try {
          batteryInstance.removeEventListener('levelchange');
          batteryInstance.removeEventListener('chargingchange');
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Simulator helper so drivers, testers or reviewers can easily test the < 20% warning
  const simulateLevel = useCallback((level: number, charging = false) => {
    setBatteryState({
      level: Math.max(0, Math.min(100, Math.round(level))),
      charging,
      isSupported: true,
      isSimulated: true,
    });
  }, []);

  const resetBattery = useCallback(() => {
    if (realBatteryRef) {
      setBatteryState({
        level: Math.round((realBatteryRef.level ?? 0.85) * 100),
        charging: !!realBatteryRef.charging,
        isSupported: true,
        isSimulated: false,
      });
    } else {
      setBatteryState({
        level: 84,
        charging: false,
        isSupported: false,
        isSimulated: false,
      });
    }
  }, [realBatteryRef]);

  const isLowBattery = batteryState.level < 20 && !batteryState.charging;

  return {
    ...batteryState,
    isLowBattery,
    simulateLevel,
    resetBattery,
  };
}
