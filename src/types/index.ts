export type AppRole = 'vitrine' | 'gerant' | 'boutique' | 'livreur' | 'client' | 'admin';

export type VehicleType = 'moto' | 'tricycle' | 'voiture' | 'a_pied';

export type ClientType = 'boutiques_ecommerce' | 'restaurants' | 'entreprises' | 'particuliers';

export interface Company {
  id: string;
  name: string;
  logoUrl?: string;
  city: string;
  address: string;
  creationYear: number;
  managerName: string;
  managerPhone: string;
  managerSecondaryPhone?: string;
  managerEmail: string;
  password?: string;
  fleetSize: number;
  vehicleTypes: VehicleType[];
  zonesCovered: string[];
  avgDeliveriesPerDay: string;
  clientTypes: ClientType[];
  trialActive: boolean;
  trialExpiresAt: string;
  subscriptionStatus: 'active' | 'pending_payment' | 'suspended';
  lastInvoiceAmount: number;
  invoiceDueAt?: string;
  paymentProofUrl?: string;
  paymentProofDate?: string;
  paymentVerifiedByAdmin?: boolean;
  createdAt: string;
}

export interface Driver {
  id: string;
  companyId: string;
  name: string;
  phone: string;
  vehicleType: VehicleType;
  status: 'available' | 'on_delivery' | 'offline';
  currentZone: string;
  currentLat: number;
  currentLng: number;
  todayDeliveries: number;
  weekDeliveries: number;
  monthDeliveries: number;
  totalEarningsFcfa: number;
  rating: number;
  avatarUrl?: string;
}

export interface Boutique {
  id: string;
  companyId: string;
  name: string;
  phone: string;
  slug: string;
  quartier: string;
  category: string;
  isThirdParty: boolean; // true = client tiers sans boutique physique (pour réseaux sociaux / bio)
  createdAt: string;
}

export interface Manager {
  id: string;
  companyId: string;
  name: string;
  phone: string;
  email?: string;
  role: 'gerant_principal' | 'gerant_secondaire' | 'dispatch' | 'operations';
  addedAt: string;
}

export type OrderStatus = 'to_assign' | 'in_progress' | 'delivered';

export interface Order {
  id: string;
  orderNumber: string; // e.g. "FLYT-2849"
  companyId: string;
  boutiqueId?: string;
  boutiqueName: string;
  isThirdParty: boolean;
  
  // Expéditeur
  senderName: string;
  senderPhone: string;
  pickupQuartier: string;
  
  // Destinataire
  recipientName: string;
  recipientPhone: string;
  deliveryQuartier: string;
  deliveryAddressDetails?: string;
  
  // Données colis & financier
  parcelType: string;
  parcelPhotoUrl?: string;
  amountToCollect: number; // Montant à verser / COD en FCFA (0 si payé d'avance)
  deliveryFee: number; // Frais de livraison FLYT en FCFA (ex: 1500)
  
  // État logistique
  status: OrderStatus;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  
  // Timestamps
  createdAt: string;
  assignedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  
  // Preuve de livraison
  clientSignatureUrl?: string;
  proofDeliveryPhotoUrl?: string;
  signatureTimestamp?: string;
  deliveryNotes?: string; // Note de livraison laissée par le coursier (ex: Remis au gardien)
  
  // Géolocalisation simulée / temps réel
  currentLat?: number;
  currentLng?: number;
  trackingToken: string;
}

export interface DailyReport {
  id: string;
  companyId: string;
  date: string;
  totalDeliveries: number;
  topDrivers: { driverId: string; driverName: string; count: number }[];
  topZone: string;
  topZoneCount: number;
  topBoutique: string;
  topBoutiqueCount: number;
  totalVolumeFcfa: number;
  generatedAt: string;
}

export interface PushNotification {
  id: string;
  companyId?: string;
  title: string;
  message: string;
  type: 'order_new' | 'order_assigned' | 'order_delivered' | 'invoice_due' | 'admin_announcement' | 'payment_verified' | 'incident_alert' | 'alert';
  targetRole?: AppRole | 'all';
  targetId?: string; // e.g. driverId or companyId
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface OfflinePendingDelivery {
  orderId: string;
  driverId: string;
  signatureDataUrl: string;
  proofDeliveryPhotoUrl?: string;
  deliveryNotes?: string;
  completedAt: string;
  orderNumber: string;
  recipientName: string;
  deliveryQuartier: string;
}

export interface DailySyncStat {
  date: string;
  dayLabel: string;
  fullDate: string;
  successful: number;
  pending: number;
}

export interface AdminInvoice {
  id: string;
  companyId: string;
  companyName: string;
  companyEmail: string;
  month: string; // e.g. "Septembre 2026"
  baseFee: number; // 20,000 FCFA fixe
  perDeliveryFee: number; // 100 FCFA
  validatedDeliveriesCount: number;
  totalAmount: number; // baseFee + (perDeliveryFee * count)
  dueDate: string; // 48h après notification
  status: 'pending' | 'proof_submitted' | 'approved' | 'suspended';
  paymentLink: string; // https://link.saspay.me/gw53q9tcu4m
  proofFileUrl?: string;
  proofFileName?: string;
  proofSubmittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
}
