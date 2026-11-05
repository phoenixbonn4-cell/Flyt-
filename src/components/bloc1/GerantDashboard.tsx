import React, { useState } from 'react';
import { Company, Driver, Boutique, Order, Manager } from '../../types';
import { FlytStorage } from '../../services/storage';
import { LiveCityMap } from '../LiveCityMap';
import { DailyReportModal } from '../DailyReportModal';
import { InvoicePaymentModal } from '../InvoicePaymentModal';
import { 
  Layers, 
  MapPin, 
  Wallet, 
  Moon, 
  Plus, 
  Store, 
  Copy, 
  Check, 
  UserCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  ArrowRight, 
  ShieldCheck, 
  CreditCard, 
  ExternalLink,
  Search,
  Filter,
  UserPlus,
  Share2,
  MessageCircle,
  X,
  Users
} from 'lucide-react';

interface GerantDashboardProps {
  company: Company;
  drivers: Driver[];
  boutiques: Boutique[];
  orders: Order[];
  onNavigateToBoutique: (slug: string) => void;
  onNavigateToDriver: (driverId: string) => void;
  onNavigateToTracking: (token: string) => void;
}

export const GerantDashboard: React.FC<GerantDashboardProps> = ({
  company,
  drivers,
  boutiques,
  orders,
  onNavigateToBoutique,
  onNavigateToDriver,
  onNavigateToTracking,
}) => {
  const [activeTab, setActiveTab] = useState<'mur' | 'carte' | 'portefeuille' | 'boutiques' | 'facturation'>('mur');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBoutiqueFilter, setSelectedBoutiqueFilter] = useState<string>('all');
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);
  const [selectedDriverForAssign, setSelectedDriverForAssign] = useState<string>('');
  
  // Modals state
  const [showDailyReport, setShowDailyReport] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showNewBoutiqueModal, setShowNewBoutiqueModal] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Driver Invitation & Secondary Managers Modal State
  const [showDriverInviteModal, setShowDriverInviteModal] = useState(false);
  const [hasCopiedDriverInvite, setHasCopiedDriverInvite] = useState(false);
  const [showManagersModal, setShowManagersModal] = useState(false);
  const [managersList, setManagersList] = useState<Manager[]>(() => FlytStorage.getManagers(company.id));
  const [newMgrName, setNewMgrName] = useState('');
  const [newMgrPhone, setNewMgrPhone] = useState('+237 6');
  const [newMgrEmail, setNewMgrEmail] = useState('');
  const [newMgrRole, setNewMgrRole] = useState<'gerant_secondaire' | 'dispatch' | 'operations'>('dispatch');

  const handleAddSecondaryManager = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMgrName.trim() || !newMgrPhone.trim()) return;
    const newMgr: Manager = {
      id: `mgr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      companyId: company.id,
      name: newMgrName.trim(),
      phone: newMgrPhone.trim(),
      ...(newMgrEmail.trim() ? { email: newMgrEmail.trim() } : {}),
      role: newMgrRole,
      addedAt: new Date().toISOString(),
    };
    FlytStorage.saveManager(newMgr);
    setManagersList(FlytStorage.getManagers(company.id));
    setNewMgrName('');
    setNewMgrPhone('+237 6');
    setNewMgrEmail('');
  };

  const getDriverInviteUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/?joinCompany=${company.id}&companyName=${encodeURIComponent(company.name)}`;
  };

  const handleCopyDriverInvite = async () => {
    const link = getDriverInviteUrl();
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(link);
      }
      setHasCopiedDriverInvite(true);
      setTimeout(() => setHasCopiedDriverInvite(false), 2500);
    } catch {
      // ignore
    }
  };

  // New Boutique Form
  const [newBoutiqueName, setNewBoutiqueName] = useState('');
  const [newBoutiquePhone, setNewBoutiquePhone] = useState('');
  const [newBoutiqueQuartier, setNewBoutiqueQuartier] = useState('');
  const [newBoutiqueCategory, setNewBoutiqueCategory] = useState('E-commerce');
  const [newBoutiqueIsThirdParty, setNewBoutiqueIsThirdParty] = useState(false);

  // Current Invoice
  const currentInvoice = FlytStorage.getInvoices().find((i) => i.companyId === company.id) || {
    id: 'inv_current',
    companyId: company.id,
    companyName: company.name,
    companyEmail: company.managerEmail,
    month: 'Septembre 2026',
    baseFee: 25000,
    perDeliveryFee: 100,
    validatedDeliveriesCount: orders.filter((o) => o.status === 'delivered').length,
    totalAmount: 25000 + orders.filter((o) => o.status === 'delivered').length * 100,
    dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    status: 'pending' as const,
    paymentLink: 'https://link.saspay.me/gw53q9tcu4m',
  };

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch = 
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.deliveryQuartier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.boutiqueName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBoutique = selectedBoutiqueFilter === 'all' || o.boutiqueId === selectedBoutiqueFilter;
    return matchesSearch && matchesBoutique;
  });

  const ordersToAssign = filteredOrders.filter((o) => o.status === 'to_assign');
  const ordersInProgress = filteredOrders.filter((o) => o.status === 'in_progress');
  const ordersDelivered = filteredOrders.filter((o) => o.status === 'delivered');

  const handleAssignSubmit = (e: React.FormEvent, orderId: string) => {
    e.preventDefault();
    if (!selectedDriverForAssign) return;
    FlytStorage.assignOrderToDriver(orderId, selectedDriverForAssign);
    setAssigningOrderId(null);
    setSelectedDriverForAssign('');
  };

  const handleCreateBoutique = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoutiqueName.trim()) return;

    const slug = newBoutiqueName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const newBoutique: Boutique = {
      id: `btq_${Date.now()}`,
      companyId: company.id,
      name: newBoutiqueName,
      phone: newBoutiquePhone || company.managerPhone,
      slug,
      quartier: newBoutiqueQuartier || company.city,
      category: newBoutiqueCategory,
      isThirdParty: newBoutiqueIsThirdParty,
      createdAt: new Date().toISOString(),
    };

    FlytStorage.saveBoutique(newBoutique);
    setShowNewBoutiqueModal(false);
    setNewBoutiqueName('');
    setNewBoutiquePhone('');
    setNewBoutiqueQuartier('');
  };

  const copyBoutiqueLink = (slug: string) => {
    const url = `${window.location.origin}/expedier/${slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2500);
    }
  };

  const dailyReportData = FlytStorage.generateDailyReport(company.id);

  return (
    <div className="space-y-6">
      {/* Top Banner / Corporate Command Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-display font-extrabold text-xl shadow-lg shrink-0">
              {company.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {company.name}
                </h1>
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {company.city} · Bastos
                </span>
                {company.trialActive && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    Essai 7j Actif
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                <span>Gérant : <strong className="text-slate-200">{company.managerName}</strong></span>
                <span>·</span>
                <span>Flotte active : <strong className="text-emerald-400">{drivers.length} livreurs</strong></span>
                <span>·</span>
                <span>Tél DG : <span className="font-mono text-slate-300">{company.managerPhone}</span></span>
              </p>
            </div>
          </div>

          {/* Quick Action Tools */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* INVITATION LIVREUR LINK BUTTON */}
            <button
              onClick={() => setShowDriverInviteModal(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all cursor-pointer active:scale-95"
              title="Générer et partager le lien d'inscription pour vos livreurs (WhatsApp / SMS)"
            >
              <UserPlus className="w-4 h-4" />
              <span>Inviter Livreur (WhatsApp)</span>
            </button>

            {/* SECONDARY MANAGERS & DISPATCH TEAM */}
            <button
              onClick={() => setShowManagersModal(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors cursor-pointer"
              title="Gérer les gérants secondaires et dispatchers"
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Équipe & Dispatch ({managersList.length})</span>
            </button>

            <button
              onClick={() => setShowDailyReport(true)}
              className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors"
            >
              <Moon className="w-4 h-4 text-cyan-400" />
              <span>Rapport du Soir (23h59)</span>
            </button>

            <button
              onClick={() => setShowInvoiceModal(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-950 transition-all"
            >
              <CreditCard className="w-4 h-4" />
              <span>Facture FLYT ({currentInvoice.totalAmount.toLocaleString('fr-FR')} F)</span>
            </button>
          </div>
        </div>

        {/* Real-time KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
            <span className="text-slate-400 text-[11px] block">À Assigner (Bouchon)</span>
            <span className="text-xl font-mono font-bold text-amber-400 mt-0.5 block">
              {orders.filter((o) => o.status === 'to_assign').length}
            </span>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
            <span className="text-slate-400 text-[11px] block">En Course GPS</span>
            <span className="text-xl font-mono font-bold text-cyan-400 mt-0.5 block">
              {orders.filter((o) => o.status === 'in_progress').length}
            </span>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
            <span className="text-slate-400 text-[11px] block">Livrées & Signées</span>
            <span className="text-xl font-mono font-bold text-emerald-400 mt-0.5 block">
              {orders.filter((o) => o.status === 'delivered').length}
            </span>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
            <span className="text-slate-400 text-[11px] block">Boutiques Partenaires</span>
            <span className="text-xl font-mono font-bold text-white mt-0.5 block">
              {boutiques.length}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-3 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('mur')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'mur'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            1. Le Mur de Commandes
          </button>

          <button
            onClick={() => setActiveTab('carte')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'carte'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            2. La Carte en Direct
          </button>

          <button
            onClick={() => setActiveTab('portefeuille')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'portefeuille'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            3. Le Portefeuille Livreurs
          </button>

          <button
            onClick={() => setActiveTab('boutiques')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'boutiques'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            4. Boutiques & Liens Bio
          </button>
        </div>

        {/* Global Search and Filter */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher colis, client, quartier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-hidden focus:border-emerald-500 w-52 sm:w-64"
            />
          </div>

          <select
            value={selectedBoutiqueFilter}
            onChange={(e) => setSelectedBoutiqueFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-hidden focus:border-emerald-500"
          >
            <option value="all">Toutes les boutiques</option>
            {boutiques.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TAB 1 : LE MUR DE COMMANDES (3 Colonnes Kanban) */}
      {activeTab === 'mur' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Colonne 1 : À ASSIGNER */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl flex flex-col h-[700px] overflow-hidden">
            <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">
                  À Assigner
                </h3>
              </div>
              <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {ordersToAssign.length}
              </span>
            </div>

            <div className="flex-1 p-3 overflow-y-auto space-y-3">
              {ordersToAssign.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-xs">
                  Aucun colis en attente. Tout est sous contrôle !
                </div>
              ) : (
                ordersToAssign.map((order) => (
                  <div
                    key={order.id}
                    className="p-3.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 rounded-xl space-y-2.5 transition-all shadow-md group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-emerald-400">
                        {order.orderNumber}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-white truncate">
                        {order.parcelType}
                      </div>
                      <div className="text-[11px] text-slate-300 mt-0.5 flex items-center gap-1 truncate">
                        <Store className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span className="truncate">{order.boutiqueName}</span>
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Ramassage :</span>
                        <strong className="text-slate-200">{order.pickupQuartier}</strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Livrer à :</span>
                        <strong className="text-emerald-300">{order.deliveryQuartier} ({order.recipientName.split(' ')[0]})</strong>
                      </div>
                      {order.amountToCollect > 0 && (
                        <div className="flex items-center justify-between text-amber-300 font-mono pt-1 border-t border-slate-800/80">
                          <span>À Encaisser (COD) :</span>
                          <span className="font-bold">{order.amountToCollect.toLocaleString('fr-FR')} FCFA</span>
                        </div>
                      )}
                    </div>

                    {/* Quick Dispatch Assignment */}
                    {assigningOrderId === order.id ? (
                      <form onSubmit={(e) => handleAssignSubmit(e, order.id)} className="space-y-2 pt-1">
                        <label className="text-[11px] font-semibold text-slate-300 block">
                          Choisir un livreur disponible :
                        </label>
                        <select
                          required
                          value={selectedDriverForAssign}
                          onChange={(e) => setSelectedDriverForAssign(e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                        >
                          <option value="">Sélectionner un coursier...</option>
                          {drivers.map((drv) => (
                            <option key={drv.id} value={drv.id}>
                              {drv.name} ({drv.vehicleType} · {drv.currentZone} · {drv.status})
                            </option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold"
                          >
                            Confirmer Assignation
                          </button>
                          <button
                            type="button"
                            onClick={() => setAssigningOrderId(null)}
                            className="px-2 py-1.5 bg-slate-700 text-slate-300 rounded text-xs"
                          >
                            Annuler
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => {
                          setAssigningOrderId(order.id);
                          // Auto suggest closest driver or first available
                          const avail = drivers.find((d) => d.status === 'available') || drivers[0];
                          if (avail) setSelectedDriverForAssign(avail.id);
                        }}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Assigner un livreur</span>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Colonne 2 : EN COURS */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl flex flex-col h-[700px] overflow-hidden">
            <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">
                  En Cours d'Acheminement
                </h3>
              </div>
              <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                {ordersInProgress.length}
              </span>
            </div>

            <div className="flex-1 p-3 overflow-y-auto space-y-3">
              {ordersInProgress.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-xs">
                  Aucune course sur le terrain actuellement.
                </div>
              ) : (
                ordersInProgress.map((order) => (
                  <div
                    key={order.id}
                    className="p-3.5 bg-slate-800/80 border border-cyan-500/30 rounded-xl space-y-2.5 shadow-md relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />

                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-cyan-300">
                        {order.orderNumber}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-400 animate-spin" />
                        En route
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-white truncate">
                        {order.parcelType}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <span>Client : <strong className="text-slate-200">{order.recipientName}</strong></span>
                      </div>
                    </div>

                    {/* Driver In-flight Card */}
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700/80 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Livreur sur le terrain :</span>
                        <span className="font-bold text-white">{order.driverName}</span>
                      </div>
                      <a
                        href={`tel:${order.driverPhone}`}
                        className="p-1.5 rounded-md bg-emerald-600/30 text-emerald-400 hover:bg-emerald-600 hover:text-white transition-colors"
                        title="Appeler le coursier"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>Destination : <strong className="text-white">{order.deliveryQuartier}</strong></span>
                      <button
                        onClick={() => onNavigateToTracking(order.trackingToken)}
                        className="text-cyan-400 hover:underline flex items-center gap-1"
                      >
                        <span>Suivi GPS</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Colonne 3 : LIVRÉ */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl flex flex-col h-[700px] overflow-hidden">
            <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">
                  Livré & Signé
                </h3>
              </div>
              <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {ordersDelivered.length}
              </span>
            </div>

            <div className="flex-1 p-3 overflow-y-auto space-y-3">
              {ordersDelivered.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-xs">
                  Aucune commande livrée aujourd'hui.
                </div>
              ) : (
                ordersDelivered.map((order) => (
                  <div
                    key={order.id}
                    className="p-3.5 bg-slate-800/50 border border-emerald-500/20 rounded-xl space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-300">
                        {order.orderNumber}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Livré à {order.signatureTimestamp || '14h30'}
                      </span>
                    </div>

                    <div className="text-xs text-white font-medium">
                      {order.parcelType}
                    </div>

                    <div className="text-[11px] text-slate-400">
                      Livré à <strong className="text-slate-200">{order.recipientName}</strong> ({order.deliveryQuartier}) par <strong className="text-emerald-400">{order.driverName}</strong>
                    </div>

                    {order.amountToCollect > 0 && (
                      <div className="text-[11px] text-slate-300 font-mono">
                        Montant encaissé : <strong className="text-emerald-300">{order.amountToCollect.toLocaleString('fr-FR')} FCFA</strong>
                      </div>
                    )}

                    {order.deliveryNotes && (
                      <div className="text-[11px] text-amber-200/90 bg-amber-950/30 px-2 py-1 rounded-lg border border-amber-500/20 italic">
                        Note coursier : « {order.deliveryNotes} »
                      </div>
                    )}

                    {order.clientSignatureUrl && (
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Signature client certifiée</span>
                        <div className="flex items-center gap-2">
                          {order.proofDeliveryPhotoUrl && (
                            <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">
                              + Photo
                            </span>
                          )}
                          <span className="text-emerald-400 font-mono">Validé</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2 : LA CARTE EN DIRECT (Radar Live Map) */}
      {activeTab === 'carte' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-300">
              Surveillance satellite et radar GPS des coursiers en circulation à <strong>{company.city}</strong>.
            </span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-mono text-emerald-400">Flux télémétrique actif</span>
            </div>
          </div>

          <LiveCityMap
            city={company.city}
            drivers={drivers}
            orders={orders}
            onSelectDriver={(d) => onNavigateToDriver(d.id)}
            onSelectOrder={(o) => onNavigateToTracking(o.trackingToken)}
          />
        </div>
      )}

      {/* TAB 3 : LE PORTEFEUILLE LIVREURS (Cagnottes) */}
      {activeTab === 'portefeuille' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
            <div>
              <h3 className="font-bold text-white text-sm">Portefeuilles & Cagnottes des Coursiers</h3>
              <p className="text-slate-400 mt-0.5">
                Comptabilisation quotidienne, hebdomadaire et mensuelle des performances et commissions de chaque livreur.
              </p>
            </div>
            <div className="font-mono text-right">
              <span className="text-[10px] text-slate-500 block">Total cagnottes cumulées</span>
              <span className="text-base font-bold text-emerald-400">
                {drivers.reduce((acc, d) => acc + d.totalEarningsFcfa, 0).toLocaleString('fr-FR')} FCFA
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {drivers.map((drv) => (
              <div
                key={drv.id}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm">{drv.name}</h4>
                    <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                      <span className="capitalize">{drv.vehicleType}</span>
                      <span>·</span>
                      <span>Zone : {drv.currentZone}</span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                      drv.status === 'on_delivery'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : drv.status === 'available'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {drv.status === 'on_delivery' ? 'En course' : drv.status === 'available' ? 'Disponible' : 'Hors-ligne'}
                  </span>
                </div>

                {/* Cagnotte Highlights */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-800/60 p-2 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Aujourd'hui</span>
                    <span className="font-mono font-bold text-white text-base mt-0.5 block">
                      {drv.todayDeliveries}
                    </span>
                  </div>
                  <div className="bg-slate-800/60 p-2 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Semaine</span>
                    <span className="font-mono font-bold text-white text-base mt-0.5 block">
                      {drv.weekDeliveries}
                    </span>
                  </div>
                  <div className="bg-slate-800/60 p-2 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Mois</span>
                    <span className="font-mono font-bold text-white text-base mt-0.5 block">
                      {drv.monthDeliveries}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Solde Cagnotte Encaissé</span>
                    <span className="font-mono font-extrabold text-emerald-400 text-sm">
                      {drv.totalEarningsFcfa.toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                  <button
                    onClick={() => onNavigateToDriver(drv.id)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <span>Vue Livreur</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4 : BOUTIQUES & LIENS BIO */}
      {activeTab === 'boutiques' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs flex-wrap gap-3">
            <div>
              <h3 className="font-bold text-white text-sm">Gestion des Boutiques Clientes & Liens Tiers</h3>
              <p className="text-slate-400 mt-0.5">
                Chaque boutique cliente dispose de son lien privé. Vos clients commandent en autonomie : zéro ressaisie, zéro erreur d'adresse !
              </p>
            </div>
            <button
              onClick={() => setShowNewBoutiqueModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-950"
            >
              <Plus className="w-4 h-4" />
              <span>Créer un compte Boutique ou Lien Tiers</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {boutiques.map((btq) => {
              const privateUrl = `livraison.express-yaounde.com/${btq.slug}`;
              const orderCount = orders.filter((o) => o.boutiqueId === btq.id).length;

              return (
                <div
                  key={btq.id}
                  className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-sm">{btq.name}</h4>
                        {btq.isThirdParty && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            Client Tiers / Bio Réseaux
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {btq.category} · {btq.quartier}
                      </p>
                    </div>
                    <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {orderCount} {orderCount > 1 ? 'colis' : 'colis'}
                    </span>
                  </div>

                  {/* Private Link Generator Box */}
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                      Lien Privé de Commande Autonome
                    </span>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-mono text-slate-300 truncate">{privateUrl}</span>
                      <button
                        onClick={() => copyBoutiqueLink(btq.slug)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium flex items-center gap-1 transition-colors text-[11px] shrink-0"
                      >
                        {copiedSlug === btq.slug ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copié</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copier</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-400">
                      Contact : <span className="font-mono text-slate-200">{btq.phone}</span>
                    </span>
                    <button
                      onClick={() => onNavigateToBoutique(btq.slug)}
                      className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 text-xs"
                    >
                      <span>Ouvrir l'Espace Boutique</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Create Boutique */}
      {showNewBoutiqueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-md bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Store className="w-4 h-4 text-emerald-400" />
              Nouveau Compte Boutique ou Lien Réseaux
            </h3>

            <form onSubmit={handleCreateBoutique} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nom de la boutique ou du service *
                </label>
                <input
                  type="text"
                  required
                  value={newBoutiqueName}
                  onChange={(e) => setNewBoutiqueName(e.target.value)}
                  placeholder="Ex: Grâce Cosmetics ou Commande Bio Instagram"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Numéro de téléphone / WhatsApp boutique *
                </label>
                <input
                  type="tel"
                  required
                  value={newBoutiquePhone}
                  onChange={(e) => setNewBoutiquePhone(e.target.value)}
                  placeholder="Ex: +237 691 00 22 33"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Quartier / Adresse de collecte par défaut
                </label>
                <input
                  type="text"
                  value={newBoutiqueQuartier}
                  onChange={(e) => setNewBoutiqueQuartier(e.target.value)}
                  placeholder="Ex: Bastos, Yaoundé"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Catégorie
                </label>
                <select
                  value={newBoutiqueCategory}
                  onChange={(e) => setNewBoutiqueCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  <option value="E-commerce & Mode">E-commerce & Mode</option>
                  <option value="Beauté & Cosmétiques">Beauté & Cosmétiques</option>
                  <option value="Restauration Gourmet">Restauration Gourmet</option>
                  <option value="High-Tech & Gadgets">High-Tech & Gadgets</option>
                  <option value="Particuliers & Colis Express">Particuliers & Colis Express</option>
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={newBoutiqueIsThirdParty}
                    onChange={(e) => setNewBoutiqueIsThirdParty(e.target.checked)}
                    className="accent-emerald-500"
                  />
                  <span>Client tiers / Lien public pour bio TikTok ou Instagram</span>
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewBoutiqueModal(false)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-md"
                >
                  Générer le lien privé
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modals for Daily Report and Invoices */}
      <DailyReportModal
        report={dailyReportData}
        isOpen={showDailyReport}
        onClose={() => setShowDailyReport(false)}
      />

      <InvoicePaymentModal
        invoice={currentInvoice}
        company={company}
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        onProofSubmitted={() => {
          // re-render automatically happens via storage listener
        }}
      />

      {/* MODAL 1 : PARTAGE DU LIEN D'INVITATION LIVREUR (TEMPS RÉEL) */}
      {showDriverInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div 
            className="w-full max-w-lg bg-[#0F172A] border-2 border-emerald-500/60 rounded-3xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Inviter un Livreur dans votre Flotte</h3>
                  <p className="text-xs text-slate-400">{company.name} · Inscription automatique 30s</p>
                </div>
              </div>
              <button
                onClick={() => setShowDriverInviteModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Partagez ce lien sécurisé avec vos coursiers par WhatsApp ou SMS. Dès qu'un livreur remplit son Nom et WhatsApp, il est <strong>instantanément visible en temps réel</strong> dans votre bureau et vous pouvez lui confier des courses immédiatement !
            </p>

            {/* Link Copy Box */}
            <div className="flex items-center gap-2 p-2.5 bg-slate-950 rounded-xl border border-slate-800">
              <input
                type="text"
                readOnly
                value={getDriverInviteUrl()}
                className="flex-1 bg-transparent text-xs text-emerald-300 font-mono truncate focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyDriverInvite}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  hasCopiedDriverInvite
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
              >
                {hasCopiedDriverInvite ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{hasCopiedDriverInvite ? 'Copié !' : 'Copier'}</span>
              </button>
            </div>

            {/* Direct WhatsApp Action Button */}
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `Bonjour, rejoins l'équipe de livraison de ${company.name} sur FLYT en t'enregistrant en 30s ici pour recevoir tes courses en direct : ${getDriverInviteUrl()}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 bg-[#25D366] hover:bg-[#20ba59] text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-slate-950" />
              <span>Envoyer l'invitation sur WhatsApp</span>
            </a>

            <div className="pt-1 flex justify-end">
              <button
                onClick={() => setShowDriverInviteModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2 : GESTION DES GÉRANTS SECONDAIRES & DISPATCHERS */}
      {showManagersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div 
            className="w-full max-w-lg bg-[#0F172A] border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Équipe de Gérance & Dispatch</h3>
                  <p className="text-xs text-slate-400">
                    Ajoutez d'autres gérants ou dispatchers pour administrer la flotte
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowManagersModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Gérant Principal Card */}
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                  Gérant Principal (Propriétaire)
                </span>
                <h4 className="font-bold text-white text-sm mt-1">{company.managerName}</h4>
                <p className="text-slate-400 font-mono text-[11px]">{company.managerPhone} · {company.managerEmail}</p>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>

            {/* Form to add secondary manager */}
            <form onSubmit={handleAddSecondaryManager} className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 space-y-2.5 text-xs">
              <h4 className="font-bold text-white text-xs">+ Ajouter un Gérant Adjoint ou Dispatcher</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Nom complet"
                  value={newMgrName}
                  onChange={(e) => setNewMgrName(e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
                <input
                  type="tel"
                  required
                  placeholder="WhatsApp (+237...)"
                  value={newMgrPhone}
                  onChange={(e) => setNewMgrPhone(e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                />
                <input
                  type="email"
                  placeholder="Email professionnel"
                  value={newMgrEmail}
                  onChange={(e) => setNewMgrEmail(e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
                <select
                  value={newMgrRole}
                  onChange={(e) => setNewMgrRole(e.target.value as any)}
                  className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white cursor-pointer"
                >
                  <option value="dispatch">Dispatch & Opérations</option>
                  <option value="gerant_secondaire">Gérant Secondaire</option>
                  <option value="operations">Superviseur Flotte</option>
                </select>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Enregistrer dans la base
                </button>
              </div>
            </form>

            {/* List of appointed managers */}
            {managersList.length > 0 && (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {managersList.map((m) => (
                  <div key={m.id} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white">{m.name}</span>
                      <span className="text-slate-400 text-[11px] font-mono ml-2">{m.phone}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowManagersModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
