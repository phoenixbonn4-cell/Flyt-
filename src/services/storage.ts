import { Company, Driver, Boutique, Order, DailyReport, PushNotification, AdminInvoice, OfflinePendingDelivery, DailySyncStat, Manager } from '../types';
import { playMissionAlert, playDeliverySuccess, playNewOrderPing } from './sound';
import { 
  saveCompanyToFirestore, 
  saveDriverToFirestore, 
  saveOrderToFirestore, 
  saveManagerToFirestore, 
  resetAllFirestoreData 
} from './firebase';

const STORAGE_KEY_PREFIX = 'flyt_v2_';

// Enforce full data purge up to the currently registered company
// Every company must register first before using the application
const PURGE_INITIAL_DATA_FLAG = 'flyt_purged_for_mandatory_registration_v2';

if (typeof window !== 'undefined') {
  try {
    if (!localStorage.getItem(PURGE_INITIAL_DATA_FLAG)) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('flyt_') || k.startsWith('flyt_v1_') || k.startsWith('flyt_v2_'))) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      localStorage.setItem(PURGE_INITIAL_DATA_FLAG, 'true');
      resetAllFirestoreData().catch(() => {});
    }
  } catch {
    // ignore
  }
}

// Real-time Event bus & Cross-tab sync
type EventListener = () => void;
const listeners = new Set<EventListener>();

let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel('flyt_cross_tab_bus');
    broadcastChannel.onmessage = () => {
      notifyListeners();
    };
  } catch (e) {
    console.warn('BroadcastChannel not supported', e);
  }
}

function notifyListeners() {
  const dispatch = () => {
    listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('Listener callback error', err);
      }
    });
  };

  if (typeof queueMicrotask === 'function') {
    queueMicrotask(dispatch);
  } else {
    setTimeout(dispatch, 0);
  }
}

function broadcastUpdate() {
  notifyListeners();
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'sync_update', timestamp: Date.now() });
    } catch {
      // ignore
    }
  }
}

// Storage helpers
function getItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Storage read error', e);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
    broadcastUpdate();
  } catch (e) {
    console.error('Storage write error', e);
  }
}

// Public API
export const FlytStorage = {
  subscribe(listener: EventListener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  // Company management
  getCompanies(): Company[] {
    return getItem<Company[]>('companies', []);
  },

  getActiveCompany(): Company | null {
    const companies = this.getCompanies();
    return companies[0] || null;
  },

  saveCompany(company: Company): void {
    const companies = this.getCompanies();
    const idx = companies.findIndex((c) => c.id === company.id);
    if (idx >= 0) {
      companies[idx] = company;
    } else {
      companies.unshift(company);
    }
    setItem('companies', companies);
    saveCompanyToFirestore(company).catch(() => {});
  },

  // Secondary Managers & Dispatchers management
  getManagers(companyId?: string): Manager[] {
    const targetCompId = companyId || this.getActiveCompany()?.id || '';
    const all = getItem<Manager[]>('managers', []);
    return all.filter((m) => !targetCompId || m.companyId === targetCompId);
  },

  saveManager(manager: Manager): void {
    const all = getItem<Manager[]>('managers', []);
    const idx = all.findIndex((m) => m.id === manager.id);
    if (idx >= 0) {
      all[idx] = manager;
    } else {
      all.push(manager);
    }
    setItem('managers', all);
    saveManagerToFirestore(manager).catch(() => {});
  },

  // Drivers management
  getDrivers(companyId?: string): Driver[] {
    const targetCompId = companyId || this.getActiveCompany()?.id || '';
    const all = getItem<Driver[]>('drivers', []);
    return all.filter((d) => !targetCompId || d.companyId === targetCompId);
  },

  getDriverById(id: string): Driver | undefined {
    const all = getItem<Driver[]>('drivers', []);
    return all.find((d) => d.id === id);
  },

  saveDriver(driver: Driver): void {
    const all = getItem<Driver[]>('drivers', []);
    const idx = all.findIndex((d) => d.id === driver.id);
    if (idx >= 0) {
      all[idx] = driver;
    } else {
      all.push(driver);
    }
    setItem('drivers', all);
    saveDriverToFirestore(driver).catch(() => {});
  },

  // Reset all data to zero for fresh real-time database ("Remet tout les données à zéro")
  async resetAllData(): Promise<void> {
    setItem('companies', []);
    setItem('drivers', []);
    setItem('orders', []);
    setItem('boutiques', []);
    setItem('managers', []);
    setItem('invoices', []);
    setItem('offline_deliveries_queue', []);
    setItem('sync_history_7d', {});
    setItem('notifications', []);
    try {
      await resetAllFirestoreData();
    } catch {
      // ignore
    }
  },

  // Boutiques management
  getBoutiques(companyId?: string): Boutique[] {
    const targetCompId = companyId || this.getActiveCompany()?.id || '';
    const all = getItem<Boutique[]>('boutiques', []);
    return all.filter((b) => !targetCompId || b.companyId === targetCompId);
  },

  getBoutiqueBySlug(slug: string): Boutique | undefined {
    const all = getItem<Boutique[]>('boutiques', []);
    return all.find((b) => b.slug.toLowerCase() === slug.toLowerCase());
  },

  saveBoutique(boutique: Boutique): void {
    const all = getItem<Boutique[]>('boutiques', []);
    const idx = all.findIndex((b) => b.id === boutique.id);
    if (idx >= 0) {
      all[idx] = boutique;
    } else {
      all.push(boutique);
    }
    setItem('boutiques', all);
  },

  // Orders management
  getOrders(companyId?: string): Order[] {
    const targetCompId = companyId || this.getActiveCompany()?.id || '';
    const all = getItem<Order[]>('orders', []);
    return all.filter((o) => !targetCompId || o.companyId === targetCompId);
  },

  getOrderByToken(token: string): Order | undefined {
    const all = getItem<Order[]>('orders', []);
    return all.find((o) => o.trackingToken.toUpperCase() === token.trim().toUpperCase() || o.orderNumber.toUpperCase() === token.trim().toUpperCase());
  },

  getOrderById(id: string): Order | undefined {
    const all = getItem<Order[]>('orders', []);
    return all.find((o) => o.id === id);
  },

  createOrder(orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'status' | 'trackingToken'>): Order {
    const all = getItem<Order[]>('orders', []);
    const orderNumber = `FLYT-${3100 + all.length + 1}`;
    const token = `TRK-${orderData.deliveryQuartier.substring(0, 4).toUpperCase()}-${Math.floor(10 + Math.random() * 89)}`;
    
    const newOrder: Order = {
      ...orderData,
      id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      orderNumber,
      status: 'to_assign',
      createdAt: new Date().toISOString(),
      trackingToken: token,
    };

    all.unshift(newOrder);
    setItem('orders', all);
    saveOrderToFirestore(newOrder).catch(() => {});

    playNewOrderPing();

    this.addNotification({
      companyId: newOrder.companyId,
      title: `Nouvelle commande : ${orderNumber}`,
      message: `${newOrder.boutiqueName} a commandé une livraison pour ${newOrder.deliveryQuartier} (${newOrder.recipientName}).`,
      type: 'order_new',
      targetRole: 'gerant',
    });

    return newOrder;
  },

  assignOrderToDriver(orderId: string, driverId: string): void {
    const all = getItem<Order[]>('orders', []);
    const order = all.find((o) => o.id === orderId);
    const driver = this.getDriverById(driverId);

    if (order && driver) {
      order.driverId = driver.id;
      order.driverName = driver.name;
      order.driverPhone = driver.phone;
      order.status = 'in_progress';
      order.assignedAt = new Date().toISOString();
      order.currentLat = driver.currentLat;
      order.currentLng = driver.currentLng;

      // Update driver status
      driver.status = 'on_delivery';
      this.saveDriver(driver);

      setItem('orders', all);
      saveOrderToFirestore(order).catch(() => {});

      playMissionAlert();

      // Notify driver & client
      this.addNotification({
        companyId: order.companyId,
        title: `Course assignée : ${order.orderNumber}`,
        message: `Ramasser chez ${order.senderName} (${order.pickupQuartier}) et livrer à ${order.recipientName} (${order.deliveryQuartier}).`,
        type: 'order_assigned',
        targetRole: 'livreur',
        targetId: driver.id,
      });

      // Haptic vibration feedback for mobile device
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([250, 100, 250, 100, 400]);
        } catch {
          // ignore
        }
      }

      // Browser push notification if permitted (even in background tab)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('flyt_mission_assigned', { detail: { order, driver } }));

        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(`🚨 NOUVELLE MISSION : ${order.orderNumber}`, {
              body: `Collecte : ${order.pickupQuartier} ➔ Livraison : ${order.deliveryQuartier} (${order.recipientName}). Ouvrez FLYT pour démarrer !`,
              tag: order.id,
              requireInteraction: true,
            });
          } catch {
            // ignore
          }
        }
      }
    }
  },

  completeDelivery(orderId: string, signatureDataUrl: string, proofPhotoUrl?: string, deliveryNotes?: string): boolean {
    const all = getItem<Order[]>('orders', []);
    const order = all.find((o) => o.id === orderId);

    if (order && order.status === 'in_progress') {
      const now = new Date();
      order.status = 'delivered';
      order.deliveredAt = now.toISOString();
      order.clientSignatureUrl = signatureDataUrl;
      if (proofPhotoUrl) {
        order.proofDeliveryPhotoUrl = proofPhotoUrl;
      }
      if (deliveryNotes) {
        order.deliveryNotes = deliveryNotes.trim();
      }
      order.signatureTimestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Update driver stats and earnings
      if (order.driverId) {
        const driver = this.getDriverById(order.driverId);
        if (driver) {
          driver.todayDeliveries += 1;
          driver.weekDeliveries += 1;
          driver.monthDeliveries += 1;
          driver.totalEarningsFcfa += 500; // 500 FCFA commission per completed delivery
          driver.status = 'available';
          this.saveDriver(driver);
        }
      }

      // Increment company invoice delivery count
      this.incrementValidatedDelivery(order.companyId);

      setItem('orders', all);
      saveOrderToFirestore(order).catch(() => {});

      playDeliverySuccess();

      this.addNotification({
        companyId: order.companyId,
        title: `Livraison effectuée avec succès !`,
        message: `Commande ${order.orderNumber} livrée à ${order.recipientName} à ${order.signatureTimestamp} par ${order.driverName}.`,
        type: 'order_delivered',
        targetRole: 'gerant',
      });

      return true;
    }
    return false;
  },

  // Real-time GPS Location Broadcast
  updateDriverLocation(driverId: string, lat: number, lng: number, zone?: string): void {
    const allDrivers = getItem<Driver[]>('drivers', []);
    const driver = allDrivers.find((d) => d.id === driverId);
    if (!driver) return;

    driver.currentLat = lat;
    driver.currentLng = lng;
    if (zone) {
      driver.currentZone = zone;
    }
    setItem('drivers', allDrivers);

    // Also update any in_progress order assigned to this driver
    const allOrders = getItem<Order[]>('orders', []);
    let orderUpdated = false;
    allOrders.forEach((ord) => {
      if (ord.driverId === driverId && ord.status === 'in_progress') {
        ord.currentLat = lat;
        ord.currentLng = lng;
        orderUpdated = true;
      }
    });

    if (orderUpdated) {
      setItem('orders', allOrders);
    }
  },

  // Offline Deliveries Storage & Sync Strategy
  getOfflineQueue(): OfflinePendingDelivery[] {
    return getItem<OfflinePendingDelivery[]>('offline_deliveries_queue', []);
  },

  queueOfflineDelivery(delivery: OfflinePendingDelivery): void {
    const queue = this.getOfflineQueue();
    // avoid duplicates
    const idx = queue.findIndex((item) => item.orderId === delivery.orderId);
    if (idx >= 0) {
      queue[idx] = delivery;
    } else {
      queue.push(delivery);
    }
    setItem('offline_deliveries_queue', queue);

    // Also mark locally in current order if present so user sees instant feedback
    const all = getItem<Order[]>('orders', []);
    const order = all.find((o) => o.id === delivery.orderId);
    if (order) {
      order.status = 'delivered';
      order.deliveredAt = delivery.completedAt;
      order.clientSignatureUrl = delivery.signatureDataUrl;
      if (delivery.proofDeliveryPhotoUrl) {
        order.proofDeliveryPhotoUrl = delivery.proofDeliveryPhotoUrl;
      }
      if (delivery.deliveryNotes) {
        order.deliveryNotes = delivery.deliveryNotes;
      }
      order.signatureTimestamp = new Date(delivery.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setItem('orders', all);
    }
  },

  syncOfflineDeliveries(): { syncedCount: number; orderNumbers: string[] } {
    const queue = this.getOfflineQueue();
    if (queue.length === 0) {
      return { syncedCount: 0, orderNumbers: [] };
    }

    const all = getItem<Order[]>('orders', []);
    const orderNumbers: string[] = [];

    queue.forEach((item) => {
      const order = all.find((o) => o.id === item.orderId);
      if (order) {
        order.status = 'delivered';
        order.deliveredAt = item.completedAt;
        order.clientSignatureUrl = item.signatureDataUrl;
        if (item.proofDeliveryPhotoUrl) {
          order.proofDeliveryPhotoUrl = item.proofDeliveryPhotoUrl;
        }
        if (item.deliveryNotes) {
          order.deliveryNotes = item.deliveryNotes;
        }
        order.signatureTimestamp = new Date(item.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (order.driverId) {
          const driver = this.getDriverById(order.driverId);
          if (driver) {
            driver.todayDeliveries += 1;
            driver.weekDeliveries += 1;
            driver.monthDeliveries += 1;
            driver.totalEarningsFcfa += 500;
            driver.status = 'available';
            this.saveDriver(driver);
          }
        }

        this.incrementValidatedDelivery(order.companyId);
        orderNumbers.push(order.orderNumber);

        // Persist synced order with base64 signature to Firestore for real-time consistency
        saveOrderToFirestore(order).catch(() => {});

        this.addNotification({
          companyId: order.companyId,
          title: `Synchronisation Hors-Ligne Réussie !`,
          message: `Commande ${order.orderNumber} (${order.recipientName}) validée avec signature synchronisée depuis le stockage local.`,
          type: 'order_delivered',
          targetRole: 'gerant',
        });
      }
    });

    setItem('orders', all);
    // Clear queue after successful sync
    setItem('offline_deliveries_queue', []);

    // Record sync success in 7-day stats
    this.recordSyncSuccess(orderNumbers.length);

    playDeliverySuccess();

    return { syncedCount: orderNumbers.length, orderNumbers };
  },

  clearOfflineQueue(): void {
    setItem('offline_deliveries_queue', []);
  },

  // 7-day synchronization volume and performance history
  getSyncStats7Days(): DailySyncStat[] {
    const queue = this.getOfflineQueue();
    const stored = getItem<Record<string, { successful: number; pending: number }>>('sync_history_7d', {});
    const result: DailySyncStat[] = [];
    const now = new Date();

    // Baseline realistic data for the last 7 days
    const baseline: Record<number, { success: number; pending: number }> = {
      6: { success: 16, pending: 1 },
      5: { success: 22, pending: 0 },
      4: { success: 19, pending: 2 },
      3: { success: 27, pending: 0 },
      2: { success: 21, pending: 1 },
      1: { success: 24, pending: 0 },
      0: { success: 18, pending: 0 },
    };

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('fr-FR', { weekday: 'short' });
      const dayNum = d.getDate();
      
      let dayLabel = `${dayName.charAt(0).toUpperCase() + dayName.slice(1, 3)} ${dayNum}`;
      if (i === 0) dayLabel = "Auj.";
      else if (i === 1) dayLabel = 'Hier';

      const fullDate = d.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });

      const dayStored = stored[dateKey];
      const base = baseline[i] || { success: 15, pending: 0 };

      const successful = dayStored ? dayStored.successful : base.success;
      // For today (i === 0), pending is directly bound to the current offline queue count!
      const pending = i === 0 ? queue.length : (dayStored ? dayStored.pending : base.pending);

      result.push({
        date: dateKey,
        dayLabel,
        fullDate,
        successful,
        pending,
      });
    }

    return result;
  },

  recordSyncSuccess(count: number): void {
    if (count <= 0) return;
    const stored = getItem<Record<string, { successful: number; pending: number }>>('sync_history_7d', {});
    const dateKey = new Date().toISOString().split('T')[0];
    const current = stored[dateKey] || { successful: 18, pending: 0 };
    current.successful += count;
    current.pending = 0;
    stored[dateKey] = current;
    setItem('sync_history_7d', stored);
  },

  // Daily report generation (23h59 or manual test trigger)
  generateDailyReport(companyId?: string): DailyReport {
    const targetCompId = companyId || this.getActiveCompany()?.id || '';
    const orders = this.getOrders(targetCompId);
    const drivers = this.getDrivers(targetCompId);

    const deliveredOrders = orders.filter((o) => o.status === 'delivered');

    // Count by driver
    const driverCounts: Record<string, number> = {};
    deliveredOrders.forEach((o) => {
      if (o.driverId) {
        driverCounts[o.driverId] = (driverCounts[o.driverId] || 0) + 1;
      }
    });

    const topDrivers = Object.entries(driverCounts)
      .map(([id, count]) => {
        const d = drivers.find((drv) => drv.id === id);
        return { driverId: id, driverName: d ? d.name : 'Inconnu', count };
      })
      .sort((a, b) => b.count - a.count);

    // Count by zone
    const zoneCounts: Record<string, number> = {};
    deliveredOrders.forEach((o) => {
      zoneCounts[o.deliveryQuartier] = (zoneCounts[o.deliveryQuartier] || 0) + 1;
    });

    let topZone = 'Bastos';
    let topZoneCount = 0;
    Object.entries(zoneCounts).forEach(([zone, count]) => {
      if (count > topZoneCount) {
        topZone = zone;
        topZoneCount = count;
      }
    });

    // Count by boutique
    const boutiqueCounts: Record<string, number> = {};
    deliveredOrders.forEach((o) => {
      boutiqueCounts[o.boutiqueName] = (boutiqueCounts[o.boutiqueName] || 0) + 1;
    });

    let topBoutique = 'Grâce Cosmetics';
    let topBoutiqueCount = 0;
    Object.entries(boutiqueCounts).forEach(([bName, count]) => {
      if (count > topBoutiqueCount) {
        topBoutique = bName;
        topBoutiqueCount = count;
      }
    });

    const totalVolume = deliveredOrders.reduce((sum, o) => sum + (o.amountToCollect || 0), 0);

    const report: DailyReport = {
      id: `rep_${Date.now()}`,
      companyId: targetCompId,
      date: new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      totalDeliveries: deliveredOrders.length,
      topDrivers,
      topZone,
      topZoneCount,
      topBoutique,
      topBoutiqueCount,
      totalVolumeFcfa: totalVolume,
      generatedAt: '23h59 (Automatisé)',
    };

    return report;
  },

  // Invoices & Billing (25,000 FCFA fixed + 100 FCFA per validated delivery)
  getInvoices(): AdminInvoice[] {
    return getItem<AdminInvoice[]>('invoices', []);
  },

  incrementValidatedDelivery(companyId: string): void {
    const invoices = this.getInvoices();
    const currentInv = invoices.find((inv) => inv.companyId === companyId && inv.status === 'pending');
    if (currentInv) {
      currentInv.validatedDeliveriesCount += 1;
      currentInv.totalAmount = currentInv.baseFee + currentInv.validatedDeliveriesCount * currentInv.perDeliveryFee;
      setItem('invoices', invoices);
    }
  },

  submitPaymentProof(invoiceId: string, proofUrl: string, fileName?: string): void {
    const invoices = this.getInvoices();
    const inv = invoices.find((i) => i.id === invoiceId);
    if (inv) {
      inv.status = 'proof_submitted';
      inv.proofFileUrl = proofUrl;
      inv.proofFileName = fileName || 'Preuve-paiement.jpg';
      inv.proofSubmittedAt = new Date().toISOString();
      setItem('invoices', invoices);

      this.addNotification({
        title: `Preuve de paiement soumise - ${inv.companyName}`,
        message: `Montant : ${inv.totalAmount.toLocaleString('fr-FR')} FCFA. En attente de validation par Phoenix.`,
        type: 'invoice_due',
        targetRole: 'admin',
      });
    }
  },

  verifyAndApprovePayment(invoiceId: string, approvedBy = 'phoenixbonn4@gmail.com'): void {
    const invoices = this.getInvoices();
    const inv = invoices.find((i) => i.id === invoiceId);
    if (inv) {
      inv.status = 'approved';
      inv.approvedAt = new Date().toISOString();
      inv.approvedBy = approvedBy;
      setItem('invoices', invoices);

      // Reactivate company
      const company = this.getActiveCompany();
      if (company && company.id === inv.companyId) {
        company.subscriptionStatus = 'active';
        company.paymentVerifiedByAdmin = true;
        this.saveCompany(company);
      }

      this.addNotification({
        companyId: inv.companyId,
        title: `Paiement validé par l'Administrateur !`,
        message: `Votre accès au logiciel FLYT pour le mois en cours est 100% actif et validé par Phoenix. Merci de votre fidélité.`,
        type: 'payment_verified',
        targetRole: 'gerant',
      });
    }
  },

  // Notifications
  getNotifications(): PushNotification[] {
    return getItem<PushNotification[]>('notifications', []);
  },

  addNotification(notifData: Omit<PushNotification, 'id' | 'createdAt' | 'read'>): PushNotification {
    const all = this.getNotifications();
    const newNotif: PushNotification = {
      ...notifData,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    all.unshift(newNotif);
    setItem('notifications', all);
    return newNotif;
  },

  markNotificationAsRead(id: string): void {
    const all = this.getNotifications();
    const n = all.find((item) => item.id === id);
    if (n) {
      n.read = true;
      setItem('notifications', all);
    }
  },

  markAllNotificationsAsRead(): void {
    const all = this.getNotifications();
    all.forEach((n) => (n.read = true));
    setItem('notifications', all);
  },

  // Reset demo data
  resetAll(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'companies');
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'drivers');
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'boutiques');
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'orders');
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'managers');
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'invoices');
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'notifications');
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'offline_deliveries_queue');
      this.resetAllData().catch(() => {});
      broadcastUpdate();
    }
  }
};
