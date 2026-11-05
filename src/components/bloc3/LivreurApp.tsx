import React, { useState, useRef, useEffect } from 'react';
import { Driver, Order, OfflinePendingDelivery } from '../../types';
import { FlytStorage } from '../../services/storage';
import { playMissionAlert, playDeliverySuccess } from '../../services/sound';
import { 
  Bike, 
  MapPin, 
  Phone, 
  PhoneCall,
  CheckCircle2, 
  Navigation, 
  AlertCircle, 
  Sparkles, 
  ShieldCheck, 
  RefreshCw, 
  Volume2, 
  Eraser, 
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  MessageCircle,
  Coins,
  Radio,
  Wifi,
  WifiOff,
  CloudOff,
  CloudUpload,
  Gauge,
  Satellite,
  Camera,
  Image as ImageIcon,
  Trash2,
  ListOrdered,
  Maximize2,
  X,
  FileText,
  Share2,
  Sun,
  Moon,
  Copy,
  Check,
  Compass,
  Route,
  Clock,
  Eye,
  PieChart,
  TrendingUp,
  LifeBuoy,
  Battery,
  BatteryCharging,
  BatteryWarning,
  BatteryLow,
  BatteryMedium,
  BatteryFull,
  Zap,
  BarChart3
} from 'lucide-react';
import { DeliveryPathMap } from './DeliveryPathMap';
import { LivreurHelpModal } from './LivreurHelpModal';
import { SyncVolumeChart } from './SyncVolumeChart';
import { useBatteryStatus } from './useBatteryStatus';
import { DailySyncStat } from '../../types';

interface LivreurAppProps {
  currentDriver: Driver;
  orders: Order[];
  onDriverChange: (driverId: string) => void;
  onNavigateToTracking: (token: string) => void;
}

// Key neighborhood coordinates dictionary in Cameroon (Yaoundé / Douala)
const QUARTIER_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'bastos': { lat: 3.892, lng: 11.512 },
  'mokolo': { lat: 3.871, lng: 11.498 },
  'omnisports': { lat: 3.882, lng: 11.536 },
  'biyem-assi': { lat: 3.845, lng: 11.487 },
  'centre-ville': { lat: 3.866, lng: 11.516 },
  'mendong': { lat: 3.832, lng: 11.478 },
  'nlongkak': { lat: 3.881, lng: 11.518 },
  'essos': { lat: 3.872, lng: 11.539 },
  'tsinga': { lat: 3.883, lng: 11.502 },
  'mvan': { lat: 3.818, lng: 11.514 },
  'melen': { lat: 3.858, lng: 11.495 },
  'ngousso': { lat: 3.896, lng: 11.545 },
  'odza': { lat: 3.812, lng: 11.532 },
  'akwa': { lat: 4.051, lng: 9.704 },
  'bonanjo': { lat: 4.043, lng: 9.689 },
  'bonapriso': { lat: 4.032, lng: 9.697 },
  'deido': { lat: 4.062, lng: 9.712 },
};

function getCoordsForQuartier(
  quartierName: string,
  fallbackLat = 3.8667,
  fallbackLng = 11.5167
): { lat: number; lng: number } {
  const normalized = (quartierName || '').trim().toLowerCase();
  for (const [key, coords] of Object.entries(QUARTIER_COORDINATES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return coords;
    }
  }
  return { lat: fallbackLat, lng: fallbackLng };
}

function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

interface OptimalRouteInfo {
  distanceKm: number;
  etaMinutes: number;
  trafficStatus: string;
  recommendedRouteName: string;
  driverCoords: { lat: number; lng: number };
  destinationCoords: { lat: number; lng: number };
}

export const LivreurApp: React.FC<LivreurAppProps> = ({
  currentDriver,
  orders,
  onDriverChange,
  onNavigateToTracking,
}) => {
  // Navigation sub-view: 'detail' (viewing mission execution) or 'list' (viewing all active/incoming missions)
  const [subView, setSubView] = useState<'detail' | 'list'>('detail');

  // Connectivity & offline simulation
  const [isDeviceOnline, setIsDeviceOnline] = useState(navigator.onLine);
  const [simulateOffline, setSimulateOffline] = useState(false);
  const effectiveOnline = isDeviceOnline && !simulateOffline;

  // Offline queue state
  const [offlineQueue, setOfflineQueue] = useState<OfflinePendingDelivery[]>(() =>
    FlytStorage.getOfflineQueue()
  );
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);

  // Manual Sync Progress State
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0); // 0 to 100
  const [syncProcessedCount, setSyncProcessedCount] = useState(0);
  const [syncTotalCount, setSyncTotalCount] = useState(0);

  // GPS Sharing & Live telemetry
  const [isSharingGps, setIsSharingGps] = useState(true);
  const [gpsCoordinates, setGpsCoordinates] = useState({
    lat: currentDriver.currentLat || 3.8824,
    lng: currentDriver.currentLng || 11.5126,
    speed: 36,
  });
  const coordsRef = useRef(gpsCoordinates);
  coordsRef.current = gpsCoordinates;

  // Find orders assigned to this driver
  const myActiveOrder = orders.find(
    (o) => o.driverId === currentDriver.id && o.status === 'in_progress'
  );
  const myCompletedOrders = orders.filter(
    (o) => o.driverId === currentDriver.id && o.status === 'delivered'
  );

  // Incoming unassigned orders
  const incomingOrders = orders.filter((o) => o.status === 'to_assign');

  // Signature canvas state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signatureStatus, setSignatureStatus] = useState<'empty' | 'too_light' | 'valid'>('empty');
  const [signaturePixels, setSignaturePixels] = useState(0);
  const [signatureError, setSignatureError] = useState('');
  const [isShakingCanvas, setIsShakingCanvas] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [acceptedOrderId, setAcceptedOrderId] = useState<string | null>(null);

  // Delivery Notes State
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Camera Parcel Photo State & Full-screen modal
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  // Archived Completed Delivery Details Modal (Shows saved signature and parcel photo)
  const [selectedArchivedOrder, setSelectedArchivedOrder] = useState<Order | null>(null);

  // Dark Mode / Light Mode Theme Toggle (Improves eye comfort for night deliveries)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('flyt_livreur_theme');
      return saved !== 'light'; // Default dark mode for nocturnal safety
    } catch {
      return true;
    }
  });

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('flyt_livreur_theme', next ? 'dark' : 'light');
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Live Geolocation Sharing State & Temporary Link Generator
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [hasCopiedShareLink, setHasCopiedShareLink] = useState(false);
  const [shareLinkData, setShareLinkData] = useState<{
    shareUrl: string;
    googleMapsUrl: string;
    lat: number;
    lng: number;
    accuracyMeters?: number;
    expiresAt: string;
    token: string;
  } | null>(null);

  // Quick Troubleshooting & Assistance Modal State
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Active company info for direct Dispatch emergency contact
  const activeCompany = FlytStorage.getActiveCompany();
  const gerantName = activeCompany?.managerName || 'Gérant Logistique';
  const gerantPhone = activeCompany?.managerPhone || '+237 699 82 41 05';
  const cleanGerantPhone = gerantPhone.replace(/[^0-9]/g, '') || '237699824105';
  const telGerantPhone = gerantPhone.replace(/\s+/g, '') || '+237699824105';

  // Share ETA State & Clipboard Handler
  const [hasCopiedEta, setHasCopiedEta] = useState(false);

  // Battery Status API State & Controls
  const {
    level: batteryLevel,
    charging: isBatteryCharging,
    isSupported: isBatterySupported,
    isLowBattery,
    simulateLevel: simulateBatteryLevel,
    resetBattery: resetBatteryLevel,
  } = useBatteryStatus();
  const [dismissLowBatteryWarning, setDismissLowBatteryWarning] = useState(false);
  const [showBatteryPopover, setShowBatteryPopover] = useState(false);

  // 7-Day Synchronization Volume & Performance State
  const [syncStats7Days, setSyncStats7Days] = useState<DailySyncStat[]>(() =>
    FlytStorage.getSyncStats7Days()
  );

  const refreshSyncStats = () => {
    setSyncStats7Days(FlytStorage.getSyncStats7Days());
  };

  const handleShareEta = async () => {
    if (!myActiveOrder || !optimalRoute) return;

    const etaMinutes = optimalRoute.etaMinutes;
    const arrivalDate = new Date(Date.now() + etaMinutes * 60000);
    const formattedArrivalTime = arrivalDate.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const etaMessage = `Bonjour ${myActiveOrder.recipientName || 'Client'},\nVotre livreur ${currentDriver.name} (${currentDriver.phone}) est en route pour votre commande n° ${myActiveOrder.orderNumber}.\nHeure d'arrivée estimée (ETA) : ${formattedArrivalTime} (dans environ ${etaMinutes} min).\nLieu de livraison : ${myActiveOrder.deliveryQuartier}.\nMerci de rester disponible pour réceptionner votre colis !`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(etaMessage);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = etaMessage;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setHasCopiedEta(true);
      setSyncToastMessage(
        `✅ ETA copié pour la commande ${myActiveOrder.orderNumber} (Arrivée estimée : ${formattedArrivalTime})`
      );
      setTimeout(() => setHasCopiedEta(false), 3500);
      setTimeout(() => setSyncToastMessage(null), 4500);
    } catch (err) {
      console.error('Erreur lors de la copie de l\'ETA :', err);
    }
  };

  const handlePreFillDeliveryNotesFromHelp = (noteText: string) => {
    setDeliveryNotes((prev) => (prev ? `${prev}\n${noteText}` : noteText));
    if (subView !== 'detail' && myActiveOrder) {
      setSubView('detail');
    }
  };

  const handleTriggerPhotoFromHelp = () => {
    if (subView !== 'detail' && myActiveOrder) {
      setSubView('detail');
    }
    if (fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      handleSimulatePhoto();
    }
  };

  const handleShareLivePosition = () => {
    setIsSharingLocation(true);

    const generatePayload = (lat: number, lng: number, acc?: number) => {
      // Sync driver location in storage
      FlytStorage.updateDriverLocation(currentDriver.id, lat, lng);
      const token = `TRK-LIVE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const expTimestamp = Date.now() + 2 * 3600 * 1000; // Valide 2 heures
      const expiresDate = new Date(expTimestamp);
      const expiresFormatted = `${expiresDate.getHours().toString().padStart(2, '0')}h${expiresDate
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;

      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const shareUrl = `${origin}/?track_driver=${currentDriver.id}&lat=${lat.toFixed(
        5
      )}&lng=${lng.toFixed(5)}&token=${token}&exp=${expTimestamp}`;
      const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

      setShareLinkData({
        shareUrl,
        googleMapsUrl,
        lat,
        lng,
        accuracyMeters: acc,
        expiresAt: expiresFormatted,
        token,
      });
      setIsSharingLocation(false);
      setIsShareModalOpen(true);
      setHasCopiedShareLink(false);
    };

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          generatePayload(
            pos.coords.latitude,
            pos.coords.longitude,
            Math.round(pos.coords.accuracy)
          );
        },
        (err) => {
          console.warn('Geolocation warning or fallback:', err);
          const fallbackLat = currentDriver.currentLat || 3.8667;
          const fallbackLng = currentDriver.currentLng || 11.5167;
          generatePayload(fallbackLat, fallbackLng, 25);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    } else {
      const fallbackLat = currentDriver.currentLat || 3.8667;
      const fallbackLng = currentDriver.currentLng || 11.5167;
      generatePayload(fallbackLat, fallbackLng, 30);
    }
  };

  // Avoid Traffic State (Real-time toggle persisting in localStorage)
  const [avoidTraffic, setAvoidTraffic] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('flyt_avoid_traffic');
      return saved !== 'false';
    } catch {
      return true;
    }
  });

  const [trafficData, setTrafficData] = useState<{
    densityScore: number;
    densityLevel: 'low' | 'moderate' | 'heavy' | 'jam';
    delayMinutesWithoutBypass: number;
    avoidedBottlenecks: string[];
    bypassRouteName: string;
    standardRouteName: string;
  }>({
    densityScore: 78,
    densityLevel: 'heavy',
    delayMinutesWithoutBypass: 9,
    avoidedBottlenecks: ['Carrefour Bastos', 'Poste Centrale'],
    bypassRouteName: 'Voie secondaire Bastos Ouest & Rocade',
    standardRouteName: 'Boulevard Central (Trafic dense)',
  });

  // Real-time Traffic Density Profiling Engine (Corridors, bottlenecks & density scores)
  const getTrafficDensityProfile = (destinationQuartier: string, hour = new Date().getHours()) => {
    const norm = (destinationQuartier || '').toLowerCase();
    const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 20);

    let baseDensity = isRushHour ? 84 : 74;
    let delay = isRushHour ? 11 : 8;
    let bottlenecks = ['Carrefour Bastos', 'Rond-Point Nlongkak'];
    let bypassRoute = `Voie de contournement Bastos Ouest & Rocade`;
    let standardRoute = `Boulevard Central Direct (Congestionné)`;

    if (norm.includes('mokolo') || norm.includes('centre') || norm.includes('poste')) {
      baseDensity = isRushHour ? 92 : 86;
      delay = isRushHour ? 14 : 10;
      bottlenecks = ['Marché Mokolo', 'Poste Centrale', 'Avenue Kennedy'];
      bypassRoute = `Itinéraire bis via Tsinga & Bretelle Ouest`;
      standardRoute = `Axe Direct Marché Mokolo / Centre-ville`;
    } else if (norm.includes('biyem') || norm.includes('mendong') || norm.includes('melen')) {
      baseDensity = isRushHour ? 86 : 76;
      delay = isRushHour ? 12 : 9;
      bottlenecks = ['Rond-Point Express', 'Carrefour Biyem-Assi'];
      bypassRoute = `Déviation via Voie Verte Melen & Axe secondaire`;
      standardRoute = `Axe direct Biyem-Assi Express`;
    } else if (norm.includes('omnisports') || norm.includes('ngousso') || norm.includes('essos')) {
      baseDensity = isRushHour ? 78 : 66;
      delay = isRushHour ? 9 : 6;
      bottlenecks = ['Carrefour Omnisports', 'Avenue des Banques'];
      bypassRoute = `Axe secondaire Mfandena & Rocade Nord`;
      standardRoute = `Axe direct Omnisports / Essos`;
    } else if (norm.includes('mvan') || norm.includes('odza')) {
      baseDensity = isRushHour ? 88 : 79;
      delay = isRushHour ? 13 : 9;
      bottlenecks = ['Échangeur Ahala / Mvan', 'Axe Lourd Yaoundé-Douala'];
      bypassRoute = `Voie bis via Odza Résidentiel & Bretelle Sud`;
      standardRoute = `Boulevard Sud Mvan`;
    }

    const level: 'low' | 'moderate' | 'heavy' | 'jam' =
      baseDensity >= 85 ? 'jam' : baseDensity >= 70 ? 'heavy' : baseDensity >= 45 ? 'moderate' : 'low';

    return {
      densityScore: baseDensity,
      densityLevel: level,
      delayMinutesWithoutBypass: delay,
      avoidedBottlenecks: bottlenecks,
      bypassRouteName: bypassRoute,
      standardRouteName: standardRoute,
    };
  };

  // Optimal Route State & Calculation based on Avoid Traffic toggle & Traffic Density
  const [optimalRoute, setOptimalRoute] = useState<OptimalRouteInfo | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

  const calculateOptimalRoute = (destinationQuartier: string, avoidTrafficOverride?: boolean) => {
    setIsCalculatingRoute(true);
    const useAvoidTraffic = avoidTrafficOverride !== undefined ? avoidTrafficOverride : avoidTraffic;
    const driverLat = currentDriver.currentLat || 3.8667;
    const driverLng = currentDriver.currentLng || 11.5167;
    const destCoords = getCoordsForQuartier(destinationQuartier, driverLat + 0.02, driverLng + 0.02);

    const directDist = calculateHaversineDistanceKm(
      driverLat,
      driverLng,
      destCoords.lat,
      destCoords.lng
    );

    const traffic = getTrafficDensityProfile(destinationQuartier);
    setTrafficData(traffic);

    let avgSpeed = 30; // moto
    if (currentDriver.vehicleType === 'voiture') avgSpeed = 22;
    else if (currentDriver.vehicleType === 'tricycle') avgSpeed = 24;
    else if (currentDriver.vehicleType === 'a_pied') avgSpeed = 5;

    let roadDist: number;
    let etaMin: number;
    let recommendedRoute: string;
    let trafficStatus: string;

    if (useAvoidTraffic) {
      // Small detour (+0.3 to +0.5 km) along secondary roads to avoid saturated traffic bottlenecks
      roadDist = Math.max(0.9, Math.round(directDist * 1.42 * 10) / 10);
      const baseEta = Math.max(3, Math.round((roadDist / (avgSpeed * 0.95)) * 60) + 1);
      etaMin = baseEta; // Saved the bottleneck delay!
      recommendedRoute = `${traffic.bypassRouteName} · Déviation fluide`;
      trafficStatus = `🟢 Anti-Bouchons Actif (Densité ${Math.round(traffic.densityScore * 0.3)}% · Gain ~${traffic.delayMinutesWithoutBypass} min)`;
    } else {
      // Direct avenue distance, but suffers the full traffic jam delay
      roadDist = Math.max(0.8, Math.round(directDist * 1.30 * 10) / 10);
      const baseEta = Math.max(3, Math.round((roadDist / avgSpeed) * 60) + 2);
      etaMin = baseEta + traffic.delayMinutesWithoutBypass;
      recommendedRoute = `${traffic.standardRouteName}`;
      trafficStatus = `🔴 Bouchons Denses (Densité ${traffic.densityScore}% · Retard +${traffic.delayMinutesWithoutBypass} min)`;
    }

    setTimeout(() => {
      setOptimalRoute({
        distanceKm: roadDist,
        etaMinutes: etaMin,
        trafficStatus,
        recommendedRouteName: recommendedRoute,
        driverCoords: { lat: driverLat, lng: driverLng },
        destinationCoords: destCoords,
      });
      setIsCalculatingRoute(false);
    }, 200);
  };

  const handleToggleAvoidTraffic = () => {
    const next = !avoidTraffic;
    setAvoidTraffic(next);
    try {
      localStorage.setItem('flyt_avoid_traffic', String(next));
    } catch {
      // ignore
    }
    if (myActiveOrder) {
      calculateOptimalRoute(myActiveOrder.deliveryQuartier, next);
      const profile = getTrafficDensityProfile(myActiveOrder.deliveryQuartier);
      setSyncToastMessage(
        next
          ? `🚀 Anti-Bouchons ACTIVÉ : Déviation par voies secondaires (${profile.avoidedBottlenecks.join(', ')} contournés · -${profile.delayMinutesWithoutBypass} min)`
          : `⚠️ Anti-Bouchons DÉSACTIVÉ : Axe direct principal rétabli (retard estimé +${profile.delayMinutesWithoutBypass} min)`
      );
      setTimeout(() => setSyncToastMessage(null), 5000);
    } else {
      setSyncToastMessage(
        next
          ? '🟢 Mode Anti-Bouchons activé pour vos prochaines missions !'
          : '⚪ Mode direct standard sélectionné'
      );
      setTimeout(() => setSyncToastMessage(null), 3000);
    }
  };

  useEffect(() => {
    if (myActiveOrder) {
      calculateOptimalRoute(myActiveOrder.deliveryQuartier, avoidTraffic);
    } else {
      setOptimalRoute(null);
    }
  }, [
    myActiveOrder?.id,
    myActiveOrder?.deliveryQuartier,
    currentDriver.currentLat,
    currentDriver.currentLng,
    avoidTraffic,
  ]);

  // Helper to add mock offline deliveries if queue is empty so user can test the progress bar anytime
  const handleAddTestOfflineDelivery = (count = 2) => {
    for (let i = 0; i < count; i++) {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const testItem: OfflinePendingDelivery = {
        orderId: `test-offline-${Date.now()}-${i}`,
        driverId: currentDriver.id,
        signatureDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><path d="M10,20 Q30,5 50,20 T90,20" stroke="%2310B981" stroke-width="2" fill="none"/></svg>',
        completedAt: new Date(Date.now() - (i + 1) * 60000).toISOString(),
        orderNumber: `FLYT-${randomNum}`,
        recipientName: i === 0 ? 'Mme. Ngo Ndongo' : 'M. Kamdem Eric',
        deliveryQuartier: i === 0 ? 'Bastos' : 'Mokolo',
      };
      FlytStorage.queueOfflineDelivery(testItem);
    }
    setOfflineQueue(FlytStorage.getOfflineQueue());
    refreshSyncStats();
  };

  // Manual step-by-step sync with visible progress bar showing items processed over total
  const handleManualSyncWithProgress = () => {
    let queue = FlytStorage.getOfflineQueue();
    if (queue.length === 0) {
      handleAddTestOfflineDelivery(2);
      queue = FlytStorage.getOfflineQueue();
    }

    if (isSyncing) return;

    setIsSyncing(true);
    const total = queue.length;
    setSyncTotalCount(total);
    setSyncProcessedCount(0);
    setSyncProgress(5);

    let current = 0;

    const interval = setInterval(() => {
      current += 1;
      const progressPercent = Math.min(100, Math.round((current / total) * 100));
      setSyncProcessedCount(current);
      setSyncProgress(progressPercent);

      if (current >= total) {
        clearInterval(interval);
        setTimeout(() => {
          const res = FlytStorage.syncOfflineDeliveries();
          setOfflineQueue(FlytStorage.getOfflineQueue());
          refreshSyncStats();
          setIsSyncing(false);
          setSyncProgress(100);
          playDeliverySuccess();
          setSyncToastMessage(
            `Synchronisation terminée avec succès : ${res.syncedCount} colis envoyés au serveur !`
          );
          setTimeout(() => setSyncToastMessage(null), 5000);
        }, 500);
      }
    }, 700);
  };

  // Sync offline queue automatically when connection is restored
  const processOfflineSyncAuto = () => {
    const res = FlytStorage.syncOfflineDeliveries();
    setOfflineQueue(FlytStorage.getOfflineQueue());
    refreshSyncStats();
    if (res.syncedCount > 0) {
      setSyncToastMessage(
        `Synchronisation auto réussie : ${res.syncedCount} livraison(s) hors-ligne synchronisée(s) !`
      );
      setTimeout(() => setSyncToastMessage(null), 5000);
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsDeviceOnline(true);
      if (!simulateOffline) {
        processOfflineSyncAuto();
      }
    };
    const handleOffline = () => setIsDeviceOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [simulateOffline]);

  // Live GPS simulation loop
  useEffect(() => {
    if (!isSharingGps) return;

    const interval = setInterval(() => {
      const prev = coordsRef.current;
      const latDelta = (Math.random() - 0.48) * 0.0008;
      const lngDelta = (Math.random() - 0.48) * 0.0008;
      const newLat = +(prev.lat + latDelta).toFixed(5);
      const newLng = +(prev.lng + lngDelta).toFixed(5);
      const newSpeed = Math.floor(28 + Math.random() * 20);

      const nextCoords = { lat: newLat, lng: newLng, speed: newSpeed };
      coordsRef.current = nextCoords;
      setGpsCoordinates(nextCoords);

      FlytStorage.updateDriverLocation(currentDriver.id, newLat, newLng);
    }, 2800);

    return () => clearInterval(interval);
  }, [isSharingGps, currentDriver.id]);

  // Clear canvas
  // Clear canvas
  const handleClearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setSignatureStatus('empty');
    setSignaturePixels(0);
    setSignatureError('');
    setIsShakingCanvas(false);
  };

  // Helper to calculate drawing density and validate signature quality
  const getCanvasSignatureMetrics = (canvas: HTMLCanvasElement | null): {
    drawnPixels: number;
    totalPixels: number;
    densityPercent: number;
    isCompletelyBlank: boolean;
    isTooLight: boolean;
    isValid: boolean;
  } => {
    if (!canvas) {
      return {
        drawnPixels: 0,
        totalPixels: 0,
        densityPercent: 0,
        isCompletelyBlank: true,
        isTooLight: false,
        isValid: false,
      };
    }
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      return {
        drawnPixels: 0,
        totalPixels: 0,
        densityPercent: 0,
        isCompletelyBlank: true,
        isTooLight: false,
        isValid: false,
      };
    }
    try {
      const { width, height } = canvas;
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      const totalPixels = width * height;
      let drawnPixels = 0;

      // Each pixel is represented by 4 values (R, G, B, A).
      // Check the alpha channel (index + 3) to count non-transparent strokes.
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 25) {
          drawnPixels++;
        }
      }

      const densityPercent = totalPixels > 0 ? (drawnPixels / totalPixels) * 100 : 0;
      // Minimum signature pixel threshold: an actual legible signature or initials requires at least 130 pixels.
      // An accidental dot or quick tap with a 3.5px brush covers only ~15 to 40 pixels.
      const MIN_SIGNATURE_PIXELS = 130;
      const isCompletelyBlank = drawnPixels === 0;
      const isTooLight = drawnPixels > 0 && drawnPixels < MIN_SIGNATURE_PIXELS;
      const isValid = drawnPixels >= MIN_SIGNATURE_PIXELS;

      return {
        drawnPixels,
        totalPixels,
        densityPercent,
        isCompletelyBlank,
        isTooLight,
        isValid,
      };
    } catch {
      return {
        drawnPixels: hasSignature ? 150 : 0,
        totalPixels: canvas.width * canvas.height,
        densityPercent: hasSignature ? 0.2 : 0,
        isCompletelyBlank: !hasSignature,
        isTooLight: false,
        isValid: hasSignature,
      };
    }
  };

  // Trigger visual shake animation on signature canvas border
  const triggerSignatureInvalidShake = (customMsg?: string) => {
    setIsShakingCanvas(true);
    setSignatureError(
      customMsg ||
        'La signature tactile du client est obligatoire pour valider la course et créditer votre cagnotte.'
    );
    // Remove shake class after animation completes so it can be re-triggered
    setTimeout(() => {
      setIsShakingCanvas(false);
    }, 600);
  };

  // Drawing event handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    setIsDrawing(true);
    setSignatureError('');

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    // Calculate drawing density as soon as the stroke ends
    const metrics = getCanvasSignatureMetrics(canvasRef.current);
    setSignaturePixels(metrics.drawnPixels);

    if (metrics.isValid) {
      setHasSignature(true);
      setSignatureStatus('valid');
      setSignatureError('');
    } else if (metrics.isTooLight) {
      setHasSignature(true);
      setSignatureStatus('too_light');
    } else {
      setHasSignature(false);
      setSignatureStatus('empty');
    }
  };

  // Camera photo capture
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setCapturedPhotoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Quick fallback camera simulation if device has no camera or user wants 1-click test
  const handleSimulatePhoto = () => {
    // Generate a clean futuristic parcel snapshot SVG data url
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <rect width="400" height="300" fill="#0B132B"/>
      <rect x="50" y="50" width="300" height="200" rx="12" fill="#1E293B" stroke="#10B981" stroke-width="3"/>
      <path d="M 50 110 L 350 110 M 200 50 L 200 250" stroke="#10B981" stroke-dasharray="6,6" stroke-width="2"/>
      <circle cx="200" cy="150" r="28" fill="#10B981" opacity="0.2"/>
      <text x="200" y="145" fill="#10B981" font-size="14" font-weight="bold" font-family="sans-serif" text-anchor="middle">PREUVE LIVRAISON FLYT</text>
      <text x="200" y="165" fill="#94A3B8" font-size="11" font-family="sans-serif" text-anchor="middle">Colis remis en main propre</text>
      <text x="200" y="235" fill="#38BDF8" font-size="10" font-family="monospace" text-anchor="middle">${new Date().toLocaleString('fr-FR')}</text>
    </svg>`;
    const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
    setCapturedPhotoUrl(dataUri);
  };

  // Accept a mission
  const handleAcceptMission = (orderId: string) => {
    playMissionAlert();
    FlytStorage.assignOrderToDriver(orderId, currentDriver.id);
    setAcceptedOrderId(orderId);
    setSubView('detail'); // auto switch to detail view
    setTimeout(() => setAcceptedOrderId(null), 3500);
  };

  // Complete and validate delivery with signature, driver notes and parcel photo
  const handleValidateDelivery = (order: Order) => {
    const canvas = canvasRef.current;

    // 1. Calculate drawing density and check for empty canvas or too light signature
    const metrics = getCanvasSignatureMetrics(canvas);

    if (metrics.isCompletelyBlank) {
      setHasSignature(false);
      setSignatureStatus('empty');
      triggerSignatureInvalidShake(
        'Signature tactile obligatoire : Le client doit impérativement apposer sa signature dans l\'encadré ci-dessous avant de valider.'
      );
      return;
    }

    if (metrics.isTooLight) {
      setSignatureStatus('too_light');
      triggerSignatureInvalidShake(
        `Signature trop légère ou incomplète (${metrics.drawnPixels} pixels détectés) : le tracé est insuffisant. Veuillez faire signer le client plus nettement.`
      );
      return;
    }

    if (!metrics.isValid || !canvas) {
      setHasSignature(false);
      triggerSignatureInvalidShake(
        'Signature non conforme : densité de tracé insuffisante. Veuillez apposer une signature lisible pour certifier la remise du colis.'
      );
      return;
    }

    // 2. Generate and verify reliable base64 data URL
    let dataUrl = '';
    try {
      dataUrl = canvas.toDataURL('image/png');
    } catch (err) {
      console.error('Error generating signature data URL:', err);
    }

    // Safety check: ensure dataUrl is a valid non-empty base64 string
    if (!dataUrl || !dataUrl.startsWith('data:image/png;base64,') || dataUrl.length < 100) {
      triggerSignatureInvalidShake(
        'Erreur technique lors de la capture de la signature. Veuillez retracer la signature.'
      );
      return;
    }

    // 3. Reliable offline queue persistence if no connection is detected
    const isOnlineNow = navigator.onLine && effectiveOnline;

    if (!isOnlineNow) {
      // OFFLINE STRATEGY: Reliably store base64 signature in localStorage queue with photo and notes
      const offlineItem: OfflinePendingDelivery = {
        orderId: order.id,
        driverId: currentDriver.id,
        signatureDataUrl: dataUrl,
        proofDeliveryPhotoUrl: capturedPhotoUrl || undefined,
        deliveryNotes: deliveryNotes.trim() || undefined,
        completedAt: new Date().toISOString(),
        orderNumber: order.orderNumber,
        recipientName: order.recipientName,
        deliveryQuartier: order.deliveryQuartier,
      };

      FlytStorage.queueOfflineDelivery(offlineItem);
      setOfflineQueue(FlytStorage.getOfflineQueue());
      refreshSyncStats();

      playDeliverySuccess();
      setShowSuccessToast(true);
      handleClearSignature();
      setCapturedPhotoUrl(null);
      setDeliveryNotes('');
      setTimeout(() => setShowSuccessToast(false), 4000);
      return;
    }

    // ONLINE FLOW: Save with proof photo and driver delivery notes
    const success = FlytStorage.completeDelivery(
      order.id,
      dataUrl,
      capturedPhotoUrl || undefined,
      deliveryNotes.trim() || undefined
    );
    if (success) {
      setShowSuccessToast(true);
      handleClearSignature();
      setCapturedPhotoUrl(null);
      setDeliveryNotes('');
      setTimeout(() => setShowSuccessToast(false), 3000);
    }
  };

  // Daily Summary statistics (Résumé du Jour) for current day
  const todayCompletedCount =
    Math.max(myCompletedOrders.length, currentDriver.todayDeliveries || 0) +
    offlineQueue.length;
  const todayPendingCount = (myActiveOrder ? 1 : 0) + incomingOrders.length;
  const todayTotalCount = todayCompletedCount + todayPendingCount;

  const todaySuccessRatio = todayTotalCount > 0 ? todayCompletedCount / todayTotalCount : 0;
  const todayPendingRatio = todayTotalCount > 0 ? todayPendingCount / todayTotalCount : 0;

  const todaySuccessPercent = Math.round(todaySuccessRatio * 100);
  const todayPendingPercent = Math.round(todayPendingRatio * 100);

  // SVG Ring Chart Geometry (Radius = 38, Circumference = 2 * PI * 38 ≈ 238.761)
  const ringRadius = 38;
  const ringCircumference = 2 * Math.PI * ringRadius;

  const successArcLength = todaySuccessRatio * ringCircumference;
  const pendingArcLength = todayPendingRatio * ringCircumference;
  const ringGap = todayCompletedCount > 0 && todayPendingCount > 0 ? 3 : 0;

  const successDash = Math.max(0, successArcLength - ringGap);
  const pendingDash = Math.max(0, pendingArcLength - ringGap);

  const todayFormattedDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div
      className={`LivreurApp max-w-xl mx-auto space-y-5 pb-16 transition-colors duration-300 ${
        isDarkMode ? 'livreur-dark' : 'livreur-light'
      }`}
    >
      {/* PERSISTENT HEADER NAVIGATION BAR WITH 'RETOUR' BUTTON & QUICK CONTROLS */}
      <div className="sticky top-2 z-30 bg-slate-900/95 backdrop-blur-md border border-slate-800 px-3 sm:px-4 py-3 rounded-2xl flex items-center justify-between gap-2 text-xs shadow-2xl">
        <div className="flex items-center gap-2">
          {/* BOUTON 'RETOUR' PERSISTANT DANS L'EN-TÊTE */}
          <button
            onClick={() => setSubView('list')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 ${
              subView === 'detail'
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-emerald-500/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
            title="Retourner à la liste de toutes les missions sans recharger l'application"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour</span>
            <span className="hidden sm:inline text-[10px] opacity-75 font-mono">(Missions)</span>
          </button>

          {/* Current view indicator breadcrumb */}
          <div className="hidden sm:flex items-center gap-1.5 text-slate-400 text-[11px]">
            <span>Vue :</span>
            <span className="font-semibold text-white">
              {subView === 'detail' && myActiveOrder
                ? `Course ${myActiveOrder.orderNumber}`
                : 'Toutes les Missions'}
            </span>
          </div>
        </div>

        {/* Quick action buttons in persistent header */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
          {subView === 'list' && myActiveOrder && (
            <button
              onClick={() => setSubView('detail')}
              className="px-2 py-1.5 rounded-xl bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold flex items-center gap-1 hover:bg-cyan-900 transition-colors cursor-pointer"
            >
              <span>Reprendre</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* EMERGENCY CALL DISPATCH BUTTON */}
          <div className="flex items-center shadow-md rounded-xl overflow-hidden border border-red-500/70 bg-gradient-to-r from-red-600 via-rose-600 to-red-600">
            <a
              href={`https://wa.me/${cleanGerantPhone}?text=${encodeURIComponent(
                `🚨 URGENCE DISPATCH - Livreur ${currentDriver.name} (${currentDriver.phone})\nMission active : ${
                  myActiveOrder
                    ? `Commande ${myActiveOrder.orderNumber} vers ${myActiveOrder.deliveryQuartier}`
                    : 'En service terrain'
                }\nPosition GPS : https://maps.google.com/?q=${gpsCoordinates.lat},${gpsCoordinates.lng}\nDemande d'assistance prioritaire du Gérant !`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              role="button"
              className="call-dispatch-btn px-2.5 sm:px-3 py-1.5 hover:from-red-500 hover:to-rose-500 text-white text-[11px] font-black flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              title={`Urgence Dispatch : Appeler / Envoyer message d'urgence au Gérant sur WhatsApp (${gerantName} : ${gerantPhone})`}
              onClick={() => {
                setSyncToastMessage(`🚨 Appel Dispatch initié vers le Gérant (${gerantName})`);
                setTimeout(() => setSyncToastMessage(null), 4000);
              }}
            >
              <PhoneCall className="w-3.5 h-3.5 text-white animate-pulse" />
              <span>Call Dispatch</span>
            </a>
            <span className="w-px h-4 bg-red-400/50" />
            <a
              href={`tel:${telGerantPhone}`}
              role="button"
              className="p-1.5 px-2 bg-red-700 hover:bg-red-600 text-white text-[11px] font-bold flex items-center justify-center transition-all cursor-pointer active:scale-95"
              title={`Appel téléphonique GSM direct au Gérant (${gerantPhone})`}
              onClick={() => {
                setSyncToastMessage(`📞 Appel GSM en cours vers le Gérant (${gerantPhone})`);
                setTimeout(() => setSyncToastMessage(null), 4000);
              }}
            >
              <Phone className="w-3.5 h-3.5 text-rose-100" />
              <span className="sr-only">Appeler {gerantPhone}</span>
            </a>
          </div>

          {/* REAL-TIME 'AVOID TRAFFIC' TOGGLE BUTTON */}
          <button
            type="button"
            onClick={handleToggleAvoidTraffic}
            className={`avoid-traffic-toggle px-2.5 sm:px-3 py-1.5 rounded-xl border text-[11px] font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95 ${
              avoidTraffic
                ? 'bg-emerald-500/25 hover:bg-emerald-500/35 text-emerald-200 border-emerald-500/60 shadow-emerald-950/40 ring-1 ring-emerald-500/40'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title={
              avoidTraffic
                ? `Mode Anti-Bouchons ACTIF : Recalcul en temps réel via axes secondaires selon la densité du trafic (gain ~${trafficData.delayMinutesWithoutBypass} min)`
                : `Mode Anti-Bouchons DÉSACTIVÉ : Cliquez pour recalculer et contourner les embouteillages denses (+${trafficData.delayMinutesWithoutBypass} min prévus)`
            }
          >
            <div className="relative flex items-center justify-center">
              <Zap className={`w-3.5 h-3.5 ${avoidTraffic ? 'text-emerald-400' : 'text-slate-400'}`} />
              {avoidTraffic && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
              )}
            </div>
            <span className="hidden sm:inline">
              {avoidTraffic ? 'Anti-Bouchons' : 'Anti-Bouchons OFF'}
            </span>
            <span className="sm:hidden font-mono">
              {avoidTraffic ? 'Trafic ⚡' : 'Trafic OFF'}
            </span>
            <div
              className={`w-6 h-3.5 rounded-full p-0.5 transition-colors flex items-center ${
                avoidTraffic ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-2.5 h-2.5 rounded-full bg-white transition-transform ${
                  avoidTraffic ? 'translate-x-2.5' : 'translate-x-0'
                }`}
              />
            </div>
          </button>

          {/* BOUTON ASSISTANCE RAPIDE (AIDE & DÉPANNAGE TERRAIN) */}
          <button
            type="button"
            onClick={() => setIsHelpModalOpen(true)}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
            title="Centre d'aide & dépannage rapide : client incapable de signer, batterie faible, signaler un incident..."
          >
            <LifeBuoy className="w-3.5 h-3.5 text-amber-400" />
            <span>Aide</span>
          </button>

          {/* BOUTON PARTAGER POSITION EN TEMPS RÉEL (GÉOLOCALISATION) */}
          <button
            type="button"
            onClick={handleShareLivePosition}
            disabled={isSharingLocation}
            className="px-2.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95 shadow-cyan-900/40"
            title="Générer un lien temporaire sécurisé de votre position GPS en temps réel"
          >
            <Share2 className={`w-3.5 h-3.5 ${isSharingLocation ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Partager position</span>
            <span className="sm:hidden font-mono">GPS</span>
          </button>

          {/* BOUTON BASCULE 'MODE SOMBRE / MODE CLAIR' (RÉDUIT LA FATIGUE OCULAIRE DE NUIT) */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
              isDarkMode
                ? 'bg-slate-800 hover:bg-slate-750 text-amber-300 border-slate-700'
                : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
            }`}
            title={
              isDarkMode
                ? 'Basculer en Mode Clair (Haute visibilité de jour)'
                : 'Basculer en Mode Sombre (Réduit la fatigue oculaire lors des livraisons de nuit)'
            }
          >
            {isDarkMode ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-slate-800" />
            )}
            <span className="hidden md:inline">
              {isDarkMode ? 'Mode Clair' : 'Mode Sombre'}
            </span>
          </button>

          {/* Trigger manual sync directly from persistent header */}
          <button
            onClick={handleManualSyncWithProgress}
            disabled={isSyncing}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
              offlineQueue.length > 0
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400 font-black shadow-md'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Synchroniser manuellement les livraisons enregistrées en local"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-slate-950' : ''}`} />
            <span>Sync ({offlineQueue.length})</span>
          </button>

          {/* BATTERY STATUS INDICATOR IN PERSISTENT HEADER (BATTERY STATUS API) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowBatteryPopover((prev) => !prev)}
              className={`px-2 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                isBatteryCharging
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : batteryLevel < 20
                  ? 'bg-red-500/20 border-red-500/70 text-red-300 animate-pulse shadow-md shadow-red-950/50'
                  : batteryLevel <= 50
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
              }`}
              title={`Batterie appareil : ${batteryLevel}% ${
                isBatteryCharging
                  ? '(En charge ⚡)'
                  : batteryLevel < 20
                  ? '(Batterie faible - Brancher pour GPS continu)'
                  : ''
              } - Cliquez pour détails & test`}
            >
              {isBatteryCharging ? (
                <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
              ) : batteryLevel < 20 ? (
                <BatteryWarning className="w-3.5 h-3.5 text-red-400 animate-bounce" />
              ) : batteryLevel <= 50 ? (
                <BatteryMedium className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <BatteryFull className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span className="font-mono text-[11px]">{batteryLevel}%</span>
            </button>

            {/* BATTERY POPOVER (DETAILS & SIMULATION CONTROLS FOR EVALUATION) */}
            {showBatteryPopover && (
              <div className="absolute right-0 top-full mt-2 w-64 p-3.5 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-40 text-xs space-y-2.5 animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <Battery className="w-4 h-4 text-emerald-400" />
                    <span>Statut Batterie & GPS</span>
                  </div>
                  <button
                    onClick={() => setShowBatteryPopover(false)}
                    className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1 text-[11px] text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Niveau actuel :</span>
                    <span className="font-mono font-bold text-white">{batteryLevel}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Statut alimentation :</span>
                    <span className={isBatteryCharging ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                      {isBatteryCharging ? '⚡ En charge (Secteur/Allume-cigare)' : 'Sur batterie interne'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Source :</span>
                    <span className="text-slate-400">
                      {isBatterySupported ? 'API Battery Status native' : 'Moniteur de bord'}
                    </span>
                  </div>
                </div>

                {/* TEST SIMULATION BUTTONS TO EASILY VERIFY THE <20% WARNING */}
                <div className="pt-2 border-t border-slate-800 space-y-1.5">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    Tester l'alerte &lt; 20% :
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        simulateBatteryLevel(14, false);
                        setDismissLowBatteryWarning(false);
                        setShowBatteryPopover(false);
                      }}
                      className="px-2 py-1 bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-200 rounded-lg text-[10px] font-bold text-center transition-colors cursor-pointer"
                    >
                      ⚠️ Simuler 14%
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        simulateBatteryLevel(35, true);
                        setShowBatteryPopover(false);
                      }}
                      className="px-2 py-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-200 rounded-lg text-[10px] font-bold text-center transition-colors cursor-pointer"
                    >
                      ⚡ Brancher (35%)
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      resetBatteryLevel();
                      setShowBatteryPopover(false);
                    }}
                    className="w-full py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] transition-colors cursor-pointer text-center"
                  >
                    Restaurer niveau réel (85%)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SUBTLE LOW BATTERY WARNING NOTIFICATION (< 20%) */}
      {isLowBattery && !dismissLowBatteryWarning && (
        <div className="p-3 bg-gradient-to-r from-red-950/95 via-amber-950/80 to-slate-900 border-2 border-red-500/70 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/50 flex items-center justify-center shrink-0">
              <BatteryWarning className="w-4 h-4 text-red-400 animate-bounce" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-red-300 text-xs">
                  Batterie faible ({batteryLevel}%)
                </span>
                <span className="text-[10px] px-1.5 py-0.2 bg-red-500/20 border border-red-500/40 text-red-300 font-mono rounded">
                  Alerte Autonomie
                </span>
              </div>
              <p className="text-[11px] text-amber-200/90 leading-tight">
                Pensez à brancher votre smartphone (allume-cigare ou batterie externe) pour assurer le <strong>suivi GPS continu</strong> et le tracking de vos missions sans interruption.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => simulateBatteryLevel(batteryLevel, true)}
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-bold transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
              title="Simuler le branchement du téléphone"
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Brancher</span>
            </button>
            <button
              onClick={() => setDismissLowBatteryWarning(true)}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Masquer la notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Network & Offline Simulation Bar */}
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          {effectiveOnline ? (
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <Wifi className="w-4 h-4" />
              <span>Réseau Connecté</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-amber-400 font-medium animate-pulse">
              <WifiOff className="w-4 h-4" />
              <span>Mode Hors-Ligne (Stockage Local)</span>
            </div>
          )}
        </div>

        {/* Test Toggle for user to easily test offline mode */}
        <button
          onClick={() => {
            const nextVal = !simulateOffline;
            setSimulateOffline(nextVal);
            if (!nextVal && isDeviceOnline) {
              processOfflineSyncAuto();
            }
          }}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
            simulateOffline
              ? 'bg-amber-950/80 text-amber-300 border-amber-500/50'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
          }`}
        >
          {simulateOffline ? 'Simulateur: Hors-Ligne ACTIF' : 'Simuler Coupure Réseau'}
        </button>
      </div>

      {/* Sync toast notification */}
      {syncToastMessage && (
        <div className="p-3.5 bg-emerald-950/90 border border-emerald-500 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs text-emerald-200 animate-in fade-in">
          <CloudUpload className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-medium">{syncToastMessage}</span>
        </div>
      )}

      {/* VISUAL PROGRESS BAR & OFFLINE DELIVERIES SYNCHRONIZATION CARD */}
      <div className="p-4 bg-slate-900/90 border-2 border-amber-500/50 rounded-3xl shadow-xl space-y-3.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <CloudOff className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-xs">
                Synchronisation Manuelle des Livraisons Hors-Ligne
              </h4>
              <p className="text-[11px] text-slate-400">
                {offlineQueue.length > 0
                  ? `${offlineQueue.length} livraison(s) stockée(s) en cache local (localStorage)`
                  : 'Aucun colis en attente (Cache local synchronisé)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {offlineQueue.length === 0 && !isSyncing && (
              <button
                type="button"
                onClick={() => handleAddTestOfflineDelivery(2)}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[11px] border border-slate-700 transition-colors"
                title="Ajouter 2 livraisons pour tester la barre de progression"
              >
                + Simuler 2 colis
              </button>
            )}

            <button
              onClick={handleManualSyncWithProgress}
              disabled={isSyncing}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md shrink-0 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Synchronisation en cours...' : 'Lancer Synchronisation'}</span>
            </button>
          </div>
        </div>

        {/* VISUAL PROGRESS BAR DISPLAYING ITEMS PROCESSED OVER TOTAL */}
        {isSyncing ? (
          <div className="space-y-2 p-3.5 bg-slate-950 rounded-2xl border border-amber-500/40 animate-in fade-in">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </span>
                <span className="text-amber-300 font-bold">
                  Traitement : {syncProcessedCount} / {syncTotalCount} colis traités ({syncProgress}%)
                </span>
              </div>
              <span className="text-amber-400 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                {syncTotalCount - syncProcessedCount > 0
                  ? `Reste : ${syncTotalCount - syncProcessedCount} en attente`
                  : 'Terminé à 100% !'}
              </span>
            </div>

            {/* Glowing animated progress track */}
            <div className="w-full h-4 bg-slate-900 rounded-full overflow-hidden border border-amber-500/50 p-0.5 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-emerald-400 to-cyan-400 rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(245,158,11,0.6)]"
                style={{ width: `${Math.max(4, syncProgress)}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 italic">
              Validation des signatures et envoi des rapports de courses au serveur FLYT...
            </p>
          </div>
        ) : (
          offlineQueue.length > 0 && (
            <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
              <span>Prêt pour l'envoi : {offlineQueue.length} colis en attente de synchronisation.</span>
              <span className="text-amber-400 font-mono font-bold">Cliquez sur « Lancer Synchronisation »</span>
            </div>
          )
        )}

        {/* List of items in local cache */}
        {offlineQueue.length > 0 && (
          <div className="space-y-1.5 pt-1">
            {offlineQueue.map((item, index) => {
              const isProcessed = index < syncProcessedCount;
              const isCurrentlyProcessing = isSyncing && index === syncProcessedCount;

              return (
                <div
                  key={item.orderId}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                    isProcessed
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                      : isCurrentlyProcessing
                      ? 'bg-amber-950/60 border-amber-500 text-amber-200 animate-pulse'
                      : 'bg-slate-950/80 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold">{item.orderNumber}</span>
                    <span className="text-slate-400">{item.recipientName} ({item.deliveryQuartier})</span>
                    {item.proofDeliveryPhotoUrl && (
                      <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 text-[9px] flex items-center gap-1 font-mono">
                        <Camera className="w-2.5 h-2.5" />
                        Photo
                      </span>
                    )}
                  </div>

                  <span className="font-mono text-[10px] font-bold">
                    {isProcessed ? (
                      <span className="text-emerald-400">✓ Synchronisé</span>
                    ) : isCurrentlyProcessing ? (
                      <span className="text-amber-400">⏳ Traitement...</span>
                    ) : (
                      <span className="text-slate-500">En attente</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* 7-DAY SYNCHRONIZATION VOLUME & PERFORMANCE CHART */}
        <SyncVolumeChart stats={syncStats7Days} currentPendingCount={offlineQueue.length} />
      </div>

      {/* Moto Driver Tactical Header */}
      <div className="bg-[#0B132B] border-2 border-emerald-500/40 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/30">
              <Bike className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-white">{currentDriver.name}</h1>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <p className="text-xs text-slate-300 font-mono">
                {currentDriver.phone} · <span className="text-emerald-400 capitalize">{currentDriver.vehicleType}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* BOUTON 'RETOUR' PERSISTANT DANS L'EN-TÊTE DU LIVREUR */}
            <button
              onClick={() => setSubView('list')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95 ${
                subView === 'detail'
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-emerald-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
              title="Retourner à la liste de toutes les missions sans recharger l'application"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour</span>
            </button>

            <button
              onClick={() => playMissionAlert()}
              title="Tester le son BIP BIP"
              className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-emerald-400 transition-colors"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Real-time GPS Sharing Control & Telemetry Panel */}
        <div className="mt-4 p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Satellite className={`w-4 h-4 ${isSharingGps ? 'text-emerald-400 animate-spin' : 'text-slate-500'}`} />
              <div>
                <span className="text-xs font-bold text-white block">
                  {isSharingGps ? 'Balise GPS Active (Temps Réel)' : 'Balise GPS en Pause'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {isSharingGps
                    ? 'Position transmise au Gérant & au Suivi Client'
                    : 'Activez pour afficher votre moto sur la carte'}
                </span>
              </div>
            </div>

            {/* TOGGLE BOUTON 'PARTAGER POSITION GPS' */}
            <button
              onClick={() => {
                const nextState = !isSharingGps;
                setIsSharingGps(nextState);
                if (nextState) {
                  FlytStorage.updateDriverLocation(currentDriver.id, gpsCoordinates.lat, gpsCoordinates.lng);
                }
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
                isSharingGps
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${isSharingGps ? 'animate-pulse' : ''}`} />
              <span>{isSharingGps ? 'Partage GPS Actif' : 'Partager position GPS'}</span>
            </button>
          </div>

          {/* Telemetry live readout */}
          {isSharingGps && (
            <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-2 border-t border-slate-900 font-mono">
              <div className="bg-slate-900/60 p-1.5 rounded-lg">
                <span className="text-[9px] text-slate-500 block uppercase font-sans">Latitude</span>
                <span className="text-emerald-400 font-bold">{gpsCoordinates.lat}° N</span>
              </div>
              <div className="bg-slate-900/60 p-1.5 rounded-lg">
                <span className="text-[9px] text-slate-500 block uppercase font-sans">Longitude</span>
                <span className="text-emerald-400 font-bold">{gpsCoordinates.lng}° E</span>
              </div>
              <div className="bg-slate-900/60 p-1.5 rounded-lg flex items-center justify-center gap-1">
                <Gauge className="w-3 h-3 text-cyan-400" />
                <span className="text-cyan-300 font-bold">{gpsCoordinates.speed} km/h</span>
              </div>
            </div>
          )}
        </div>

        {/* Driver Live Cagnottes */}
        <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-800/80 text-center">
          <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Ce Jour</span>
            <span className="font-mono text-base font-black text-white mt-0.5 block">
              {currentDriver.todayDeliveries + offlineQueue.length}
            </span>
          </div>
          <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Semaine</span>
            <span className="font-mono text-base font-black text-white mt-0.5 block">
              {currentDriver.weekDeliveries + offlineQueue.length}
            </span>
          </div>
          <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Mois</span>
            <span className="font-mono text-base font-black text-white mt-0.5 block">
              {currentDriver.monthDeliveries + offlineQueue.length}
            </span>
          </div>
          <div className="bg-emerald-950/40 p-2 rounded-xl border border-emerald-500/30">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">Cagnotte</span>
            <span className="font-mono text-xs font-black text-emerald-300 mt-1 block truncate">
              {(currentDriver.totalEarningsFcfa + offlineQueue.length * 500).toLocaleString('fr-FR')} F
            </span>
          </div>
        </div>
      </div>

      {/* CARTE RÉCAPITULATIVE 'RÉSUMÉ DU JOUR' AVEC GRAPHIQUE EN ANNEAU (SVG) */}
      <div
        className={`p-4 sm:p-5 rounded-3xl border-2 transition-all shadow-xl space-y-4 ${
          isDarkMode
            ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-emerald-500/30 text-white'
            : 'bg-gradient-to-br from-white via-slate-50 to-white border-emerald-500/40 text-slate-900 shadow-slate-200/80'
        }`}
      >
        {/* Header of the Summary Card */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black uppercase tracking-wider">
                  Résumé du Jour
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                  {todayTotalCount} course{todayTotalCount > 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 capitalize">
                {todayFormattedDate}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Taux de succès
            </span>
            <span className="font-mono text-base font-black text-emerald-400 flex items-center justify-end gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              {todaySuccessPercent}%
            </span>
          </div>
        </div>

        {/* Ring Chart & Breakdown Grid */}
        <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6 pt-1">
          {/* SVG Donut / Ring Chart */}
          <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
            <svg
              className="w-full h-full -rotate-90 transform"
              viewBox="0 0 100 100"
              role="img"
              aria-label={`Graphique en anneau du résumé du jour : ${todaySuccessPercent}% livraisons réussies, ${todayPendingPercent}% en attente`}
            >
              {/* Background track circle */}
              <circle
                cx="50"
                cy="50"
                r={ringRadius}
                fill="none"
                stroke={isDarkMode ? '#1e293b' : '#e2e8f0'}
                strokeWidth="10"
              />

              {todayTotalCount === 0 ? (
                /* Empty state dashed ring */
                <circle
                  cx="50"
                  cy="50"
                  r={ringRadius}
                  fill="none"
                  stroke="#64748b"
                  strokeWidth="10"
                  strokeDasharray="6 4"
                />
              ) : (
                <>
                  {/* Arc Livraisons Réussies (Vert émeraude #10b981) */}
                  {todayCompletedCount > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r={ringRadius}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="10"
                      strokeDasharray={`${todayPendingCount === 0 ? ringCircumference : successDash} ${
                        todayPendingCount === 0 ? 0 : ringCircumference - successDash
                      }`}
                      strokeDashoffset={todayPendingCount === 0 ? '0' : `${-ringGap / 2}`}
                      strokeLinecap="round"
                      className="transition-all duration-700 ease-out"
                    />
                  )}

                  {/* Arc Livraisons En Attente (Ambre #f59e0b) */}
                  {todayPendingCount > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r={ringRadius}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="10"
                      strokeDasharray={`${todayCompletedCount === 0 ? ringCircumference : pendingDash} ${
                        todayCompletedCount === 0 ? 0 : ringCircumference - pendingDash
                      }`}
                      strokeDashoffset={
                        todayCompletedCount === 0
                          ? '0'
                          : `${-(successArcLength + ringGap / 2)}`
                      }
                      strokeLinecap="round"
                      className="transition-all duration-700 ease-out"
                    />
                  )}
                </>
              )}
            </svg>

            {/* Inner Ring Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span
                className={`font-mono text-xl sm:text-2xl font-black leading-none ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                {todaySuccessPercent}%
              </span>
              <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-400 mt-1">
                Réussies
              </span>
            </div>
          </div>

          {/* Detailed Breakdown Legend & Metrics */}
          <div className="flex-1 w-full space-y-2.5">
            {/* Livraisons Réussies Item */}
            <div
              className={`p-2.5 rounded-2xl border flex items-center justify-between gap-3 transition-colors ${
                isDarkMode
                  ? 'bg-slate-950/80 border-slate-800'
                  : 'bg-emerald-50/70 border-emerald-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] shrink-0" />
                <div>
                  <span
                    className={`text-xs font-bold block ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    Livraisons réussies
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Livrées, signées & validées
                  </span>
                </div>
              </div>
              <div className="text-right font-mono">
                <span className="text-sm font-black text-emerald-400">
                  {todayCompletedCount}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  ({todaySuccessPercent}%)
                </span>
              </div>
            </div>

            {/* Livraisons En Attente Item */}
            <div
              className={`p-2.5 rounded-2xl border flex items-center justify-between gap-3 transition-colors ${
                isDarkMode
                  ? 'bg-slate-950/80 border-slate-800'
                  : 'bg-amber-50/70 border-amber-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)] shrink-0 animate-pulse" />
                <div>
                  <span
                    className={`text-xs font-bold block ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    Livraisons en attente
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {myActiveOrder ? '1 en cours d’acheminement' : '0 en cours'} ·{' '}
                    {incomingOrders.length} à récupérer
                  </span>
                </div>
              </div>
              <div className="text-right font-mono">
                <span className="text-sm font-black text-amber-400">
                  {todayPendingCount}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  ({todayPendingPercent}%)
                </span>
              </div>
            </div>

            {/* Status Footer indicator */}
            <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {todayPendingCount === 0
                    ? 'Toutes les courses du jour sont finalisées !'
                    : `${todayPendingCount} course${todayPendingCount > 1 ? 's' : ''} à finaliser aujourd’hui`}
                </span>
              </span>
              <span className="font-mono text-slate-300 font-bold">
                Total: {todayTotalCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {showSuccessToast && (
        <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-2xl flex items-center gap-3 animate-in zoom-in-95 duration-200">
          <CheckCircle2 className="w-6 h-6 shrink-0" />
          <div className="text-xs">
            <p className="font-black text-sm">
              {effectiveOnline ? 'Course validée avec succès !' : 'Course enregistrée en cache local !'}
            </p>
            <p className="opacity-90">
              {effectiveOnline
                ? 'Preuve de livraison et signature transmises. Votre cagnotte est créditée de +500 FCFA.'
                : 'Signature et photo du colis sauvegardées hors-ligne. Prêt pour la synchronisation.'}
            </p>
          </div>
        </div>
      )}

      {/* SMS confirmation alert simulation */}
      {acceptedOrderId && (
        <div className="p-4 bg-cyan-950 border border-cyan-500/40 text-cyan-200 rounded-2xl shadow-xl text-xs space-y-1 animate-in fade-in">
          <p className="font-bold flex items-center gap-1.5 text-white">
            <MessageCircle className="w-4 h-4 text-cyan-400" />
            SMS Client envoyé automatiquement :
          </p>
          <p className="italic text-slate-300">
            « Votre livreur {currentDriver.name} arrive en moto, suivez sa trajectoire en direct ici »
          </p>
        </div>
      )}

      {/* BREADCRUMB NAVIGATION & 'BACK' BUTTON */}
      {myActiveOrder && (
        <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 px-4 py-2.5 rounded-2xl text-xs">
          {/* Breadcrumb Path */}
          <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 text-slate-400">
            <button
              onClick={() => setSubView('list')}
              className={`hover:text-emerald-400 font-semibold transition-colors flex items-center gap-1 ${
                subView === 'list' ? 'text-emerald-400 font-bold' : ''
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Toutes les Missions</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <button
              onClick={() => setSubView('detail')}
              className={`font-mono transition-colors ${
                subView === 'detail' ? 'text-emerald-400 font-bold' : 'hover:text-slate-200'
              }`}
            >
              {myActiveOrder.orderNumber}
            </button>
          </nav>

          {/* 'Back' Button allowing return to active missions list without state reload */}
          {subView === 'detail' ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(true)}
                className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                title="Assistance d'urgence & dépannage rapide sur cette course"
              >
                <LifeBuoy className="w-3.5 h-3.5 text-amber-400" />
                <span>Aide</span>
              </button>

              <button
                onClick={() => setSubView('list')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
                <span>Retour à la liste des missions</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSubView('detail')}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <span>Reprendre Course ({myActiveOrder.orderNumber})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* DETAIL VIEW OF ACTIVE ORDER */}
      {myActiveOrder && subView === 'detail' ? (
        <div className="bg-slate-900/90 border-2 border-cyan-500/50 rounded-3xl p-5 shadow-2xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                Détail Course · {myActiveOrder.orderNumber}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSubView('list')}
                className="text-[11px] text-slate-400 hover:text-white underline"
              >
                Voir autres missions
              </button>
              <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                En cours
              </span>
            </div>
          </div>

          {/* Ramassage & Livraison Cards */}
          <div className="space-y-3 text-xs">
            {/* Étape A : Ramassage */}
            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-800 text-amber-400 flex items-center justify-center font-bold shrink-0 text-xs">
                A
              </div>
              <div className="flex-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Point de Ramassage</span>
                <p className="font-bold text-white text-sm mt-0.5">{myActiveOrder.senderName}</p>
                <p className="text-slate-300 mt-0.5">{myActiveOrder.pickupQuartier}</p>
                <a
                  href={`tel:${myActiveOrder.senderPhone}`}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>Appeler Expéditeur ({myActiveOrder.senderPhone})</span>
                </a>
              </div>
            </div>

            {/* Étape B : Destination Client */}
            <div className="p-3.5 bg-emerald-950/30 rounded-2xl border border-emerald-500/40 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shrink-0 text-xs shadow-md">
                B
              </div>
              <div className="flex-1">
                <span className="text-[10px] uppercase font-bold text-emerald-400 block">Destination Client Final</span>
                <p className="font-black text-white text-base mt-0.5">{myActiveOrder.recipientName}</p>
                <p className="text-emerald-200 font-medium mt-0.5">
                  Quartier : <strong>{myActiveOrder.deliveryQuartier}</strong>
                  {myActiveOrder.deliveryAddressDetails && ` · ${myActiveOrder.deliveryAddressDetails}`}
                </p>

                {myActiveOrder.amountToCollect > 0 && (
                  <div className="mt-2 p-2 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-300 font-mono text-xs flex items-center justify-between">
                    <span>Espèces à Encaisser (COD) :</span>
                    <strong className="text-sm font-black">{myActiveOrder.amountToCollect.toLocaleString('fr-FR')} FCFA</strong>
                  </div>
                )}

                <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                  <a
                    href={`tel:${myActiveOrder.recipientPhone}`}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-md"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Appeler Destinataire</span>
                  </a>
                  <a
                    href={`https://wa.me/${myActiveOrder.recipientPhone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* CALCULATEUR D'ITINÉRAIRE OPTIMAL & NAVIGATION GPS */}
          <div className="p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-2 border-emerald-500/40 rounded-3xl space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <Route className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span>Itinéraire Optimal de Livraison</span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
                      GPS Direct
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Calculé en direct depuis votre position vers {myActiveOrder.deliveryQuartier}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => calculateOptimalRoute(myActiveOrder.deliveryQuartier)}
                disabled={isCalculatingRoute}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95"
                title="Recalculer l'itinéraire en temps réel"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    isCalculatingRoute ? 'animate-spin text-emerald-400' : ''
                  }`}
                />
                <span className="hidden sm:inline">Recalculer</span>
              </button>
            </div>

            {/* Metrics: Distance, ETA, Traffic status */}
            {optimalRoute ? (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 bg-slate-900/90 rounded-2xl border border-slate-800 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Distance</span>
                    <span className="font-mono text-base sm:text-lg font-black text-white">
                      {optimalRoute.distanceKm}{' '}
                      <span className="text-xs font-normal text-slate-400">km</span>
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-900/90 rounded-2xl border border-emerald-500/30 text-center shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                      Temps Estimé
                    </span>
                    <span className="font-mono text-base sm:text-lg font-black text-emerald-300 flex items-center justify-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      ~{optimalRoute.etaMinutes}{' '}
                      <span className="text-xs font-normal text-emerald-400">min</span>
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-900/90 rounded-2xl border border-slate-800 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Véhicule</span>
                    <span className="text-xs font-bold text-slate-200 capitalize flex items-center justify-center gap-1 mt-1">
                      <Bike className="w-3.5 h-3.5 text-cyan-400" />
                      {currentDriver.vehicleType}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-900/70 border border-slate-800 rounded-xl text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <span className="text-white font-medium block">
                        {optimalRoute.recommendedRouteName}
                      </span>
                      <span className="text-[10px] text-emerald-400">
                        Conditions : {optimalRoute.trafficStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Direct GPS App Launchers & Navigation Controls */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 pt-1">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&origin=${optimalRoute.driverCoords.lat},${optimalRoute.driverCoords.lng}&destination=${optimalRoute.destinationCoords.lat},${optimalRoute.destinationCoords.lng}&travelmode=driving`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 min-w-[170px] py-2 px-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-md active:scale-95"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Lancer Navigation (Google Maps)</span>
                  </a>

                  <a
                    href={`https://waze.com/ul?ll=${optimalRoute.destinationCoords.lat},${optimalRoute.destinationCoords.lng}&navigate=yes`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors active:scale-95"
                    title="Ouvrir dans Waze"
                  >
                    <span>Waze</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  {/* BOUTON 'SHARE ETA' AVEC COPIE AUTOMATIQUE DU MESSAGE FORMATÉ DANS LE PRESSE-PAPIERS */}
                  <button
                    type="button"
                    onClick={handleShareEta}
                    className={`share-eta-btn py-2 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer border whitespace-nowrap ${
                      hasCopiedEta
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-emerald-950/40'
                        : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/40 hover:border-emerald-400'
                    }`}
                    title="Copier le message ETA contenant le n° de commande et l'heure d'arrivée estimée pour le client"
                  >
                    {hasCopiedEta ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>ETA Copié !</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Share ETA</span>
                      </>
                    )}
                  </button>
                </div>

                {/* CARTE RADAR TRAFIC EN DIRECT & CONTOURNEMENT OPTIMISÉ */}
                <div className={`p-3 rounded-2xl border transition-all ${
                  avoidTraffic 
                    ? 'bg-gradient-to-r from-emerald-950/50 via-slate-900 to-teal-950/30 border-emerald-500/40 shadow-lg shadow-emerald-950/20' 
                    : 'bg-gradient-to-r from-amber-950/50 via-slate-900 to-red-950/30 border-amber-500/40'
                }`}>
                  <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                        avoidTraffic ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      }`}>
                        <Zap className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-white">Densité du Trafic en Direct</span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                            avoidTraffic ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {avoidTraffic ? `Fluide (${Math.round(trafficData.densityScore * 0.3)}%)` : `Surchargé (${trafficData.densityScore}%)`}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {avoidTraffic 
                            ? `Contournement des goulots d'étranglement actif · Gain : ~${trafficData.delayMinutesWithoutBypass} min` 
                            : `Axe principal direct saturé · Ralentissement estimé : +${trafficData.delayMinutesWithoutBypass} min`}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleAvoidTraffic}
                      className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black border transition-all cursor-pointer ${
                        avoidTraffic
                          ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 border-emerald-400 shadow-sm'
                          : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border-amber-500/40'
                      }`}
                    >
                      {avoidTraffic ? 'Anti-Bouchons : ON' : 'Activer Déviation'}
                    </button>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-[10px]">
                    <div className="flex items-center gap-1 text-slate-300 flex-wrap">
                      <span className="text-slate-400">Points chauds :</span>
                      {trafficData.avoidedBottlenecks.map((spot, idx) => (
                        <span key={idx} className={`px-1.5 py-0.5 rounded border font-mono ${
                          avoidTraffic ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-red-500/10 text-red-300 border-red-500/30'
                        }`}>
                          {avoidTraffic ? `✓ ${spot} évité` : `⚠️ ${spot}`}
                        </span>
                      ))}
                    </div>
                    <span className="text-slate-400 font-mono text-[9px]">
                      {avoidTraffic ? 'Itinéraire bis recalculé' : 'Axe classique'}
                    </span>
                  </div>
                </div>

                {/* Tracé visuel D3 interactif avec marqueurs personnalisés Ramassage & Livraison */}
                <div className="pt-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-cyan-400" />
                      Carte du tracé & points d'étape
                    </span>
                    <span className="text-[10px] text-cyan-400 font-mono">
                      Marqueurs A (Ramassage) & B (Livraison)
                    </span>
                  </div>
                  <DeliveryPathMap
                    order={myActiveOrder}
                    isDarkMode={true}
                    height={140}
                    avoidTraffic={avoidTraffic}
                    trafficDensityScore={trafficData.densityScore}
                    bypassSavingsMinutes={trafficData.delayMinutesWithoutBypass}
                  />
                </div>
              </div>
            ) : (
              <div className="py-3 text-center text-xs text-slate-400">
                Calcul de l'itinéraire optimal en cours...
              </div>
            )}
          </div>

          {/* OBLIGATION PREUVE DE LIVRAISON : SIGNATURE ÉLECTRONIQUE + BOUTON CAPTURE PHOTO CAMERA */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Preuve de Livraison : Signature & Photo Colis
                </h3>
                <p className="text-[11px] text-slate-400">
                  {effectiveOnline
                    ? "Signature au doigt et photo du colis réceptionné pour sécuriser la course."
                    : "Mode Hors-Ligne : Signature et photo sauvegardées en local."}
                </p>
              </div>

              {/* CAMERA CAPTURE BUTTON NEXT TO SIGNATURE PAD */}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={fileInputRef}
                  onChange={handlePhotoSelect}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                  title="Ouvrir l'appareil photo du smartphone"
                >
                  <Camera className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{capturedPhotoUrl ? 'Reprendre Photo' : 'Prendre Photo Colis'}</span>
                </button>

                {/* Quick 1-click photo simulation for desktop testing */}
                {!capturedPhotoUrl && (
                  <button
                    type="button"
                    onClick={handleSimulatePhoto}
                    className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-slate-200 rounded-xl text-[10px] transition-colors"
                    title="Simuler une photo de test"
                  >
                    Auto
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleClearSignature}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-[10px] flex items-center gap-1 transition-colors"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  Effacer
                </button>
              </div>
            </div>

            {/* Photo Thumbnail Preview if taken with Expand Feature */}
            {capturedPhotoUrl && (
              <div className="p-3 bg-cyan-950/30 border border-cyan-500/40 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-3">
                  {/* Clickable thumbnail with expand action */}
                  <button
                    type="button"
                    onClick={() => setIsPhotoModalOpen(true)}
                    className="relative group w-14 h-14 rounded-xl overflow-hidden bg-slate-900 border border-cyan-400/60 shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    title="Cliquer pour agrandir la photo en plein écran"
                  >
                    <img
                      src={capturedPhotoUrl}
                      alt="Preuve Photo Colis"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Maximize2 className="w-4 h-4 text-cyan-300" />
                    </div>
                  </button>

                  <div>
                    <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Preuve Photo Enregistrée
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Certifie l'état et la remise physique du paquet.
                    </span>
                    {/* Explicit Expand button to verify photo quality */}
                    <button
                      type="button"
                      onClick={() => setIsPhotoModalOpen(true)}
                      className="mt-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Maximize2 className="w-3 h-3" />
                      <span>Agrandir / Vérifier la netteté</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsPhotoModalOpen(true)}
                    className="p-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/60 rounded-xl transition-colors cursor-pointer"
                    title="Agrandir en plein écran"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setCapturedPhotoUrl(null)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer"
                    title="Supprimer la photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {signatureError && (
              <div className="p-2.5 bg-red-950/80 border border-red-700 rounded-xl text-xs text-red-200 flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{signatureError}</span>
              </div>
            )}

            {/* Density & Quality live indicator */}
            <div className="flex items-center justify-between text-[11px] px-1 text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Densité du tracé :</span>
              </span>
              {signatureStatus === 'valid' ? (
                <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Certifiée conforme ({signaturePixels} px)
                </span>
              ) : signatureStatus === 'too_light' ? (
                <span className="text-amber-400 font-mono font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Trop léger ({signaturePixels} px - min 130)
                </span>
              ) : (
                <span className="text-slate-500 font-mono">
                  En attente du client (min. 130 px)
                </span>
              )}
            </div>

            {/* Touch Signature Pad Canvas with Visual Shake Animation */}
            <div
              className={`relative border-2 rounded-2xl bg-[#090D16] overflow-hidden touch-none h-44 flex items-center justify-center transition-all duration-200 ${
                isShakingCanvas
                  ? 'animate-shake border-red-500 ring-4 ring-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                  : signatureError
                  ? 'border-red-500/80 bg-red-950/20'
                  : signatureStatus === 'too_light'
                  ? 'border-amber-500/80 bg-amber-950/15'
                  : signatureStatus === 'valid'
                  ? 'border-emerald-500/80 ring-2 ring-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                  : 'border-dashed border-slate-700 hover:border-slate-600'
              }`}
            >
              {!hasSignature && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 pointer-events-none text-xs">
                  <Sparkles className="w-5 h-5 mb-1 text-slate-500" />
                  <span>Le client signe ici avec son doigt</span>
                  <span className="text-[10px] text-slate-600 mt-0.5">(Vérification automatique de densité obligatoire)</span>
                </div>
              )}
              <canvas
                ref={canvasRef}
                width={500}
                height={176}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-full cursor-crosshair"
              />
            </div>

            {/* TEXT INPUT FIELD: DELIVERY NOTES (Placed just below the signature pad) */}
            <div className="space-y-1.5 pt-1">
              <label
                htmlFor="delivery-notes-input"
                className="text-xs font-bold text-slate-300 flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>Note de livraison / Instructions coursier :</span>
                <span className="text-[10px] text-slate-500 font-normal">(optionnel)</span>
              </label>
              <div className="relative">
                <input
                  id="delivery-notes-input"
                  type="text"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="Ex: Remis au gardien, laissé à l'accueil, interphone 4B..."
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
                {deliveryNotes && (
                  <button
                    type="button"
                    onClick={() => setDeliveryNotes('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs px-1.5 py-0.5 rounded hover:bg-slate-800"
                    title="Effacer la note"
                  >
                    ✕
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-400">
                Cette note sera synchronisée avec les détails de la commande et visible par le gérant et le client.
              </p>
            </div>

            {/* Validation Button with Auto Verification */}
            <div className="space-y-1.5 pt-2">
              <button
                type="button"
                onClick={() => handleValidateDelivery(myActiveOrder)}
                className={`w-full py-4 font-black text-sm uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer active:scale-[0.98] ${
                  signatureStatus === 'valid'
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                <CheckCircle2 className={`w-5 h-5 ${signatureStatus === 'valid' ? 'text-slate-950' : 'text-slate-500'}`} />
                <span>
                  {effectiveOnline
                    ? 'Valider la Livraison (En Ligne)'
                    : 'Terminer la Livraison Hors-Ligne (Mise en Cache)'}
                </span>
              </button>
              {signatureStatus !== 'valid' && (
                <p className="text-[10px] text-center text-slate-400">
                  ⚠️ Vérification automatique : une signature nette et suffisante (densité min. 130 px) est requise pour valider la course.
                </p>
              )}
            </div>
          </div>

          {/* FULL-SCREEN MODAL FOR PROOF OF DELIVERY PHOTO VERIFICATION */}
          {isPhotoModalOpen && capturedPhotoUrl && (
            <div
              role="dialog"
              aria-modal="true"
              className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col p-4 sm:p-6 animate-in fade-in duration-200"
            >
              {/* Modal Header with Close Button */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-white max-w-3xl w-full mx-auto">
                <div className="flex items-center gap-2.5">
                  <Camera className="w-5 h-5 text-cyan-400" />
                  <div>
                    <h3 className="text-sm font-black text-white">
                      Contrôle Qualité Photo Preuve de Livraison
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Vérifiez que le colis, l'adresse ou le reçu sont parfaitement nets et lisibles
                    </p>
                  </div>
                </div>

                {/* CLOSE BUTTON */}
                <button
                  type="button"
                  onClick={() => setIsPhotoModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg active:scale-95"
                  title="Fermer la vue plein écran"
                >
                  <X className="w-4 h-4 text-red-400" />
                  <span>Fermer</span>
                </button>
              </div>

              {/* Modal Image Body */}
              <div className="flex-1 flex items-center justify-center p-2 sm:p-4 overflow-auto">
                <div className="relative max-w-2xl max-h-[72vh] w-full h-full flex items-center justify-center">
                  <img
                    src={capturedPhotoUrl}
                    alt="Preuve de livraison plein écran"
                    className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border-2 border-cyan-500/50 bg-slate-950"
                  />
                  <div className="absolute bottom-3 left-3 bg-slate-950/85 backdrop-blur-sm border border-cyan-500/40 px-3 py-1.5 rounded-xl text-[11px] text-cyan-300 font-mono flex items-center gap-1.5 shadow-lg">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Contrôle conformité visuelle</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3 max-w-3xl w-full mx-auto">
                <button
                  type="button"
                  onClick={() => {
                    setIsPhotoModalOpen(false);
                    fileInputRef.current?.click();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-cyan-400" />
                  <span>Reprendre une autre photo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPhotoModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Photo Conforme (Fermer)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* MISSIONS LIST VIEW (Accessible via 'Retour aux missions' or when no active order) */
        <div className="space-y-4">
          {/* Active Mission Quick Resume Banner if exists */}
          {myActiveOrder && (
            <div className="p-4 bg-gradient-to-r from-cyan-950/80 to-slate-900 border-2 border-cyan-500/50 rounded-3xl shadow-xl flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-cyan-400 block tracking-wider">
                  Course en cours d'acheminement
                </span>
                <p className="font-mono font-bold text-white text-sm">
                  {myActiveOrder.orderNumber} · {myActiveOrder.recipientName}
                </p>
                <p className="text-xs text-slate-300">
                  Destination : <strong className="text-emerald-300">{myActiveOrder.deliveryQuartier}</strong>
                </p>
              </div>

              <button
                onClick={() => setSubView('detail')}
                className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md active:scale-95 shrink-0 cursor-pointer"
              >
                <span>Accéder au Détail</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">
              {myActiveOrder ? 'Mission en cours active' : 'Prêt pour une nouvelle course !'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Vous êtes actuellement assigné à <strong>{currentDriver.currentZone}</strong>. Consultez les commandes disponibles ci-dessous.
            </p>
          </div>

          {/* Incoming Orders to Accept */}
          {incomingOrders.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 animate-pulse" />
                Missions en Attente de Prise en Charge ({incomingOrders.length})
              </h3>

              {incomingOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/30 border-2 border-emerald-500/40 rounded-3xl shadow-xl space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-white">
                      {ord.orderNumber}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400 font-bold">
                      Frais : {ord.deliveryFee} F
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white">{ord.parcelType}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Boutique : <strong className="text-slate-200">{ord.boutiqueName}</strong>
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Ramassage :</span>
                      <strong className="text-white">{ord.pickupQuartier}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Livrer à :</span>
                      <strong className="text-emerald-300">{ord.deliveryQuartier} ({ord.recipientName})</strong>
                    </div>
                    {ord.amountToCollect > 0 && (
                      <div className="flex justify-between text-amber-400 font-mono pt-1 border-t border-slate-800">
                        <span>À encaisser :</span>
                        <span className="font-bold">{ord.amountToCollect.toLocaleString('fr-FR')} FCFA</span>
                      </div>
                    )}
                  </div>

                  {/* GROS BOUTON VERT ACCEPTER */}
                  <button
                    onClick={() => handleAcceptMission(ord.id)}
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/30 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Accepter la Course (Gros Bouton Vert)</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Completed Orders Today */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Historique des courses livrées ({myCompletedOrders.length})
        </h3>

        {myCompletedOrders.length === 0 ? (
          <p className="text-xs text-slate-500 py-3 text-center">Aucune course livrée pour l'instant.</p>
        ) : (
          <div className="space-y-3">
            {myCompletedOrders.map((ord) => (
              <div
                key={ord.id}
                className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3 hover:border-slate-700 transition-colors shadow-sm"
              >
                {/* Header: Order Number, Badges, Status & Details Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-white text-sm">{ord.orderNumber}</span>
                    {ord.proofDeliveryPhotoUrl && (
                      <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 text-[9px] flex items-center gap-1 font-mono">
                        <ImageIcon className="w-2.5 h-2.5" />
                        Photo
                      </span>
                    )}
                    {ord.clientSignatureUrl && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[9px] flex items-center gap-1 font-mono">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Signature
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <div className="text-left sm:text-right">
                      <span className="text-emerald-400 font-bold block text-xs">Livré & Signé</span>
                      <span className="text-[10px] text-slate-500 font-mono">{ord.signatureTimestamp || '14h30'}</span>
                    </div>

                    {/* BOUTON 'VOIR DÉTAILS' DE LA COURSE ARCHIVÉE */}
                    <button
                      type="button"
                      onClick={() => setSelectedArchivedOrder(ord)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                      title="Voir la signature, la photo et le tracé archivés"
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Voir détails</span>
                    </button>
                  </div>
                </div>

                {/* Recipient & Pickup Context */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-400">
                  <div>
                    <span className="text-slate-300 font-semibold">{ord.recipientName}</span>
                    {ord.recipientPhone && <span> · {ord.recipientPhone}</span>}
                    {ord.boutiqueName && (
                      <span className="text-slate-500"> ({ord.boutiqueName})</span>
                    )}
                  </div>
                  {ord.amountToCollect > 0 && (
                    <span className="text-amber-400 font-mono font-bold">
                      COD : {ord.amountToCollect.toLocaleString('fr-FR')} FCFA
                    </span>
                  )}
                </div>

                {ord.deliveryNotes && (
                  <p className="text-[10px] text-amber-300/90 italic bg-amber-950/20 px-2 py-1 rounded-lg border border-amber-500/20">
                    Note : « {ord.deliveryNotes} »
                  </p>
                )}

                {/* VISUALISATION DE CARTE D3 DU TRACÉ PARCOURU */}
                <div className="pt-1">
                  <DeliveryPathMap
                    order={ord}
                    isDarkMode={isDarkMode}
                    height={135}
                    onExpand={() => setSelectedArchivedOrder(ord)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL PARTAGER POSITION TEMPORAIRE (GÉOLOCALISATION EN DIRECT) */}
      {isShareModalOpen && shareLinkData && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="bg-slate-900 border-2 border-cyan-500/60 rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl text-white">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    Partager ma Position en Direct
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Lien temporaire géolocalisé pour le client ou le dispatch
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* GPS Coordinates & Accuracy Box */}
            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  Coordonnées GPS captées en direct :
                </span>
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Précision ±{shareLinkData.accuracyMeters || 15}m
                </span>
              </div>

              <p className="font-mono text-sm font-bold text-cyan-300">
                {shareLinkData.lat.toFixed(5)}° N, {shareLinkData.lng.toFixed(5)}° E
              </p>

              <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 text-[11px]">
                <span className="text-slate-400">Validité du lien temporaire :</span>
                <span className="font-mono text-amber-300 font-bold bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">
                  Valide jusqu'à {shareLinkData.expiresAt} (2h)
                </span>
              </div>
            </div>

            {/* Shareable Link Input with Copy Button */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Lien temporaire généré à partager :
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareLinkData.shareUrl}
                  className="flex-1 px-3 py-2.5 bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl text-xs text-slate-200 font-mono select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(shareLinkData.shareUrl);
                    setHasCopiedShareLink(true);
                    setTimeout(() => setHasCopiedShareLink(false), 2500);
                  }}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shrink-0 active:scale-95 ${
                    hasCopiedShareLink
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                  }`}
                >
                  {hasCopiedShareLink ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span>{hasCopiedShareLink ? 'Copié !' : 'Copier'}</span>
                </button>
              </div>
            </div>

            {/* Action buttons: WhatsApp, Google Maps, Web Share */}
            <div className="space-y-2 pt-1">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Bonjour, suivez en direct ma position de coursier FLYT pour votre livraison : ${shareLinkData.shareUrl}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-lg cursor-pointer active:scale-98"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Envoyer ma position sur WhatsApp</span>
              </a>

              <div className="flex items-center gap-2">
                <a
                  href={shareLinkData.googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Ouvrir sur Maps</span>
                </a>

                {typeof navigator !== 'undefined' && 'share' in navigator && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator
                        .share({
                          title: 'Position en direct - Coursier FLYT',
                          text: 'Suivez ma position en direct pour la livraison FLYT',
                          url: shareLinkData.shareUrl,
                        })
                        .catch(() => {});
                    }}
                    className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Partager...</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ARCHIVED DELIVERY DETAILS (SIGNATURE & PHOTO PREUVE DE LIVRAISON) */}
      {selectedArchivedOrder && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedArchivedOrder(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-backdrop-fade-in cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border-2 border-emerald-500/60 rounded-3xl p-5 sm:p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl text-white animate-modal-slide-up cursor-default"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-white">
                      Détails Course · {selectedArchivedOrder.orderNumber}
                    </h3>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Archivée & Certifiée
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Preuves électroniques horodatées de la livraison
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedArchivedOrder(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Fermer les détails"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Order summary recap */}
            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Destinataire</span>
                  <span className="font-bold text-white text-sm">{selectedArchivedOrder.recipientName}</span>
                  <p className="text-slate-400 text-[11px]">{selectedArchivedOrder.recipientPhone}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Lieu de Livraison</span>
                  <span className="font-bold text-emerald-300">{selectedArchivedOrder.deliveryQuartier}</span>
                  {selectedArchivedOrder.deliveryAddressDetails && (
                    <p className="text-slate-400 text-[11px] truncate">{selectedArchivedOrder.deliveryAddressDetails}</p>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] flex-wrap gap-2">
                <span className="text-slate-400">
                  Boutique : <strong className="text-slate-200">{selectedArchivedOrder.boutiqueName}</strong>
                </span>
                <span className="text-slate-400 font-mono">
                  Livré à : <strong className="text-emerald-400">{selectedArchivedOrder.signatureTimestamp || '14h30'}</strong>
                </span>
              </div>

              {selectedArchivedOrder.amountToCollect > 0 && (
                <div className="p-2 bg-amber-950/40 border border-amber-500/30 rounded-xl text-amber-300 font-mono text-xs flex items-center justify-between">
                  <span>Espèces Encaissées (COD) :</span>
                  <strong className="text-sm font-black">{selectedArchivedOrder.amountToCollect.toLocaleString('fr-FR')} FCFA</strong>
                </div>
              )}

              {selectedArchivedOrder.deliveryNotes && (
                <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-amber-400 block">Note du livreur :</span>
                  <p className="text-slate-200 italic font-medium">« {selectedArchivedOrder.deliveryNotes} »</p>
                </div>
              )}
            </div>

            {/* Tracé de livraison D3 archivé */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-cyan-400" />
                  Tracé d'acheminement validé (D3.js)
                </span>
                <span className="text-[9px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 font-mono font-bold">
                  Géolocalisation certifiée
                </span>
              </div>
              <DeliveryPathMap
                order={selectedArchivedOrder}
                isDarkMode={true}
                height={165}
                expanded={true}
              />
            </div>

            {/* Proofs Grid: Signature + Photo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Photo du colis archivée */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-cyan-400" />
                      Photo du colis archivée
                    </span>
                    {selectedArchivedOrder.proofDeliveryPhotoUrl && (
                      <span className="text-[9px] text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800 font-mono">
                        Conforme
                      </span>
                    )}
                  </div>

                  {selectedArchivedOrder.proofDeliveryPhotoUrl ? (
                    <div className="relative group rounded-xl overflow-hidden border border-slate-800 bg-slate-900 aspect-video flex items-center justify-center">
                      <img
                        src={selectedArchivedOrder.proofDeliveryPhotoUrl}
                        alt="Preuve photo archivée"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                        <span className="text-[10px] text-white font-mono">Photo capturée sur le lieu de livraison</span>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/50 aspect-video flex flex-col items-center justify-center text-center p-3 text-slate-500">
                      <ImageIcon className="w-6 h-6 mb-1 opacity-40" />
                      <span className="text-xs">Aucune photo enregistrée</span>
                      <span className="text-[10px] text-slate-600 mt-0.5">Livraison validée par signature</span>
                    </div>
                  )}
                </div>

                {selectedArchivedOrder.proofDeliveryPhotoUrl && (
                  <p className="text-[10px] text-slate-400 font-mono text-center pt-1">
                    Preuve visuelle archivée dans le cloud FLYT
                  </p>
                )}
              </div>

              {/* Signature client archivée */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Signature client archivée
                    </span>
                    {selectedArchivedOrder.clientSignatureUrl && (
                      <span className="text-[9px] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800 font-mono">
                        Certifiée
                      </span>
                    )}
                  </div>

                  {selectedArchivedOrder.clientSignatureUrl ? (
                    <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-900 aspect-video flex items-center justify-center p-2">
                      <img
                        src={selectedArchivedOrder.clientSignatureUrl}
                        alt="Signature client archivée"
                        className="max-h-full max-w-full object-contain filter invert drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                      />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/50 aspect-video flex flex-col items-center justify-center text-center p-3 text-slate-500">
                      <FileText className="w-6 h-6 mb-1 opacity-40" />
                      <span className="text-xs">Aucune signature archivée</span>
                    </div>
                  )}
                </div>

                <div className="pt-1 text-center">
                  <p className="text-[10px] text-slate-400 font-mono">
                    Signé par : <strong className="text-slate-200">{selectedArchivedOrder.recipientName}</strong>
                  </p>
                  <span className="text-[9px] text-emerald-400/90 font-mono block">
                    Horodatage : {selectedArchivedOrder.signatureTimestamp || '14h30'}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Document d'archivage infalsifiable FLYT</span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedArchivedOrder(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer active:scale-95 shadow-md"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK TROUBLESHOOTING & EMERGENCY ASSISTANCE SLIDE-UP MODAL */}
      <LivreurHelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        activeOrder={myActiveOrder || null}
        currentDriver={currentDriver}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        onSharePosition={handleShareLivePosition}
        onPreFillDeliveryNotes={handlePreFillDeliveryNotesFromHelp}
        onTriggerPhotoCapture={handleTriggerPhotoFromHelp}
      />
    </div>
  );
};
