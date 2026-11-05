import React, { useState } from 'react';
import { Company, AdminInvoice, Order, Driver, Boutique } from '../../types';
import { FlytStorage } from '../../services/storage';
import { 
  ShieldCheck, 
  CreditCard, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  ExternalLink, 
  Building2, 
  FileText, 
  Clock, 
  Sparkles,
  Eye,
  Mail,
  X,
  Search,
  ArrowLeft,
  ChevronRight,
  Bike,
  Store,
  Package,
  BarChart3,
  Phone,
  MapPin,
  TrendingUp,
  Coins,
  Calendar,
  Layers,
  Globe2,
  DollarSign
} from 'lucide-react';

interface SuperAdminDashboardProps {
  companies: Company[];
  invoices: AdminInvoice[];
  allOrders: Order[];
  onCompanyUpdated: () => void;
  drivers?: Driver[];
  boutiques?: Boutique[];
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  companies,
  invoices,
  allOrders,
  onCompanyUpdated,
  drivers = [],
  boutiques = [],
}) => {
  const [adminEmail, setAdminEmail] = useState('phoenixbonn4@gmail.com');
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);

  // Multi-view mode state: 'all' (Global view of all companies) or specific company id
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');
  const [companySearchFilter, setCompanySearchFilter] = useState<string>('');
  const [companyViewTab, setCompanyViewTab] = useState<'overview' | 'invoices' | 'drivers' | 'orders' | 'boutiques' | 'notify'>('overview');

  // Announcement state
  const [announcementTitle, setAnnouncementTitle] = useState('Rappel Important : Régularisation Facture FLYT');
  const [announcementMsg, setAnnouncementMsg] = useState(
    'Veuillez vous assurer que vos factures de fin de mois sont réglées via SasPay sous 48h afin de maintenir le service dispatch actif.'
  );
  const [announcementTarget, setAnnouncementTarget] = useState<string>('all');
  const [showAnnouncementSuccess, setShowAnnouncementSuccess] = useState(false);

  // Resolve all drivers and boutiques if not passed
  const effectiveDrivers = drivers.length > 0 ? drivers : FlytStorage.getDrivers();
  const effectiveBoutiques = boutiques.length > 0 ? boutiques : FlytStorage.getBoutiques();

  // Consolidated Global Metrics
  const totalDeliveries = allOrders.filter((o) => o.status === 'delivered').length;
  const totalInProgress = allOrders.filter((o) => o.status === 'in_progress').length;
  const totalToAssign = allOrders.filter((o) => o.status === 'to_assign').length;
  const totalPlatformRevenue = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0) || (companies.length * 25000 + totalDeliveries * 100);
  const totalCodCollected = allOrders
    .filter((o) => o.status === 'delivered')
    .reduce((acc, o) => acc + (o.amountToCollect || 0), 0);

  // Filtered companies list for the comparative table
  const filteredCompanies = companies.filter((c) => {
    const q = companySearchFilter.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.managerName.toLowerCase().includes(q) ||
      c.managerPhone.includes(q)
    );
  });

  // Selected company object (if in individual company mode)
  const currentCompany = selectedCompanyId !== 'all' 
    ? companies.find((c) => c.id === selectedCompanyId) || null 
    : null;

  // Selected company's dedicated datasets
  const companyOrders = currentCompany 
    ? allOrders.filter((o) => o.companyId === currentCompany.id) 
    : [];
  const companyDelivered = companyOrders.filter((o) => o.status === 'delivered').length;
  const companyInProgress = companyOrders.filter((o) => o.status === 'in_progress').length;
  const companyCod = companyOrders
    .filter((o) => o.status === 'delivered')
    .reduce((acc, o) => acc + (o.amountToCollect || 0), 0);
  const companyDrivers = currentCompany 
    ? effectiveDrivers.filter((d) => d.companyId === currentCompany.id) 
    : [];
  const companyBoutiques = currentCompany 
    ? effectiveBoutiques.filter((b) => b.companyId === currentCompany.id) 
    : [];
  const companyInvoices = currentCompany 
    ? invoices.filter((i) => i.companyId === currentCompany.id) 
    : [];
  const companyCurrentBillAmount = currentCompany ? (25000 + companyDelivered * 100) : 0;

  const handleValidatePayment = (invoiceId: string) => {
    FlytStorage.verifyAndApprovePayment(invoiceId, adminEmail);
    onCompanyUpdated();
  };

  const handleSendAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle.trim() || !announcementMsg.trim()) return;

    const target = selectedCompanyId !== 'all' ? selectedCompanyId : (announcementTarget === 'all' ? undefined : announcementTarget);

    FlytStorage.addNotification({
      title: announcementTitle,
      message: announcementMsg,
      type: 'admin_announcement',
      targetRole: 'gerant',
      companyId: target,
      link: 'https://link.saspay.me/gw53q9tcu4m',
    });

    setShowAnnouncementSuccess(true);
    setTimeout(() => setShowAnnouncementSuccess(false), 3500);
  };

  const handleSendMonthlyInvoices = () => {
    // Generate notification for all companies
    companies.forEach((comp) => {
      const deliveredCount = allOrders.filter(
        (o) => o.companyId === comp.id && o.status === 'delivered'
      ).length;
      const amount = 25000 + deliveredCount * 100;

      FlytStorage.addNotification({
        companyId: comp.id,
        title: `Facture FLYT de Fin de Mois émise (${amount.toLocaleString('fr-FR')} FCFA)`,
        message: `Abonnement fixe de 25 000 FCFA + ${deliveredCount} livraisons à 100 FCFA. Réglez sous 48h via SasPay : https://link.saspay.me/gw53q9tcu4m sous peine de suspension de votre accès logiciel.`,
        type: 'invoice_due',
        targetRole: 'gerant',
        link: 'https://link.saspay.me/gw53q9tcu4m',
      });
    });

    setShowAnnouncementSuccess(true);
    setTimeout(() => setShowAnnouncementSuccess(false), 3500);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* 1. SUPER ADMIN TOP BANNER */}
      <div className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-lg">
            <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-black text-white">
                Console Super Administrateur FLYT
              </h1>
              <span className="text-[10px] sm:text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                Phoenix Master Control
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-amber-400" />
              <span>Connecté en tant que : <strong className="text-white font-mono">{adminEmail}</strong></span>
            </p>
          </div>
        </div>

        {/* Global Dispatch Invoice Action */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSendMonthlyInvoices}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-950 transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <CreditCard className="w-4 h-4" />
            <span>Émettre les Factures Fin de Mois (48h)</span>
          </button>
        </div>
      </div>

      {/* 2. MODE SELECTOR: VUE GLOBALE vs VUE PAR SOCIÉTÉ */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mr-1">
            <Layers className="w-4 h-4 text-amber-400" />
            Mode d'Analyse :
          </span>

          {/* Toggle Vue Globale */}
          <button
            onClick={() => setSelectedCompanyId('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              selectedCompanyId === 'all'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-lg shadow-amber-950'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700'
            }`}
          >
            <Globe2 className="w-4 h-4" />
            <span>Vue Globale Consolidée</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
              selectedCompanyId === 'all' ? 'bg-slate-950/30 text-slate-950 font-black' : 'bg-slate-700 text-slate-300'
            }`}>
              {companies.length} sociétés
            </span>
          </button>

          {/* Toggle Individual Mode (indicates current selected company if any) */}
          {selectedCompanyId !== 'all' && currentCompany && (
            <div className="flex items-center gap-1.5 bg-emerald-950/70 border border-emerald-500/50 px-3 py-1.5 rounded-xl text-xs text-emerald-300">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Société Active : <strong className="text-white">{currentCompany.name}</strong></span>
              <button
                onClick={() => setSelectedCompanyId('all')}
                className="ml-1 p-0.5 hover:bg-emerald-800 rounded text-emerald-300 hover:text-white"
                title="Quitter la fiche société et revenir à la vue globale"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Company Quick Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-semibold whitespace-nowrap hidden sm:inline">
            Changer de société :
          </label>
          <select
            value={selectedCompanyId}
            onChange={(e) => {
              setSelectedCompanyId(e.target.value);
              setCompanyViewTab('overview');
            }}
            className="w-full sm:w-auto px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer font-medium"
          >
            <option value="all">🌐 Toutes les sociétés (Vue consolidée)</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                🏢 {c.name} — {c.city} ({c.managerName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. VUE GLOBALE CONSOLIDÉE (TOUTES LES SOCIÉTÉS CONFONDUES / MÉLANGÉES)    */}
      {/* ========================================================================= */}
      {selectedCompanyId === 'all' && (
        <div className="space-y-6">
          {/* Consolidated Global KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 text-xs">
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
              <span className="text-slate-400 block text-[11px]">Sociétés Actives</span>
              <span className="font-mono text-2xl font-black text-white mt-1 block">
                {companies.length}
              </span>
              <span className="text-[10px] text-emerald-400 mt-1 block flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Flottes partenaires
              </span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
              <span className="text-slate-400 block text-[11px]">Livraisons Validées</span>
              <span className="font-mono text-2xl font-black text-emerald-400 mt-1 block">
                {totalDeliveries}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Sur {allOrders.length} courses
              </span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
              <span className="text-slate-400 block text-[11px]">Courses en Cours</span>
              <span className="font-mono text-2xl font-black text-cyan-400 mt-1 block">
                {totalInProgress}
              </span>
              <span className="text-[10px] text-cyan-500 mt-1 block">
                {totalToAssign} à assigner
              </span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
              <span className="text-slate-400 block text-[11px]">Facturation Plateforme</span>
              <span className="font-mono text-lg sm:text-xl font-bold text-amber-300 mt-1 block">
                {totalPlatformRevenue.toLocaleString('fr-FR')} F
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">
                25k fixe + 100F/course
              </span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
              <span className="text-slate-400 block text-[11px]">Total COD Manipulé</span>
              <span className="font-mono text-lg sm:text-xl font-bold text-teal-300 mt-1 block truncate">
                {totalCodCollected.toLocaleString('fr-FR')} F
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Encaissements clients
              </span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
              <span className="text-slate-400 block text-[11px]">Flotte Réseau</span>
              <span className="font-mono text-2xl font-black text-indigo-300 mt-1 block">
                {effectiveDrivers.length}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">
                {effectiveBoutiques.length} boutiques
              </span>
            </div>
          </div>

          {/* MATRICE COMPARATIVE INTER-SOCIÉTÉS (TABLEAU TOUTES LES SOCIÉTÉS) */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-amber-400" />
                  Tableau Analytique Comparatif Inter-Sociétés
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Visualisez les performances individuelles de chaque société et filtrez pour examiner sa fiche complète en un clic.
                </p>
              </div>

              {/* Company Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={companySearchFilter}
                  onChange={(e) => setCompanySearchFilter(e.target.value)}
                  placeholder="Filtrer par nom, ville, gérant..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-3">Société & Ville</th>
                    <th className="py-3 px-3">Gérant & Contact</th>
                    <th className="py-3 px-3 text-center">Flotte Livreurs</th>
                    <th className="py-3 px-3 text-right">Courses (Livrées / Total)</th>
                    <th className="py-3 px-3 text-right">Facture Estimée (Mois)</th>
                    <th className="py-3 px-3 text-center">Statut Abonnement</th>
                    <th className="py-3 px-3 text-right">Action Phoenix</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredCompanies.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-slate-500">
                        Aucune société ne correspond à votre recherche.
                      </td>
                    </tr>
                  ) : (
                    filteredCompanies.map((comp) => {
                      const cOrders = allOrders.filter((o) => o.companyId === comp.id);
                      const cDelivered = cOrders.filter((o) => o.status === 'delivered').length;
                      const cDrivers = effectiveDrivers.filter((d) => d.companyId === comp.id);
                      const cAmount = 25000 + cDelivered * 100;

                      return (
                        <tr key={comp.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              {comp.logoUrl ? (
                                <img
                                  src={comp.logoUrl}
                                  alt={comp.name}
                                  className="w-8 h-8 rounded-lg object-cover border border-slate-700 shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-black text-xs shrink-0">
                                  {comp.name.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <strong className="text-white block font-semibold">{comp.name}</strong>
                                <span className="text-slate-400 text-[11px] flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-slate-500" />
                                  {comp.city} {comp.address ? `· ${comp.address}` : ''}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <span className="text-slate-200 block font-medium">{comp.managerName}</span>
                            <span className="text-slate-400 text-[11px] font-mono block">{comp.managerPhone}</span>
                          </td>

                          <td className="py-3 px-3 text-center">
                            <span className="font-mono font-bold text-slate-200 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                              {cDrivers.length} livreur(s)
                            </span>
                          </td>

                          <td className="py-3 px-3 text-right">
                            <div className="font-mono text-xs">
                              <span className="text-emerald-400 font-bold">{cDelivered}</span>
                              <span className="text-slate-500"> / {cOrders.length}</span>
                            </div>
                            <span className="text-[10px] text-slate-500">
                              {cOrders.length > 0 ? `${Math.round((cDelivered / cOrders.length) * 100)}% succès` : '0 course'}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-right">
                            <span className="font-mono font-bold text-amber-300 block">
                              {cAmount.toLocaleString('fr-FR')} FCFA
                            </span>
                            <span className="text-[10px] text-slate-500">25k + {cDelivered}×100F</span>
                          </td>

                          <td className="py-3 px-3 text-center">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider inline-block ${
                                comp.subscriptionStatus === 'active'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : comp.subscriptionStatus === 'pending_payment'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
                              }`}
                            >
                              {comp.subscriptionStatus === 'active'
                                ? 'Actif'
                                : comp.subscriptionStatus === 'pending_payment'
                                ? 'En Attente (48h)'
                                : 'Suspendu'}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => {
                                setSelectedCompanyId(comp.id);
                                setCompanyViewTab('overview');
                              }}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white rounded-lg text-xs font-semibold border border-slate-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                              title={`Accéder à la fiche analytique dédiée de ${comp.name}`}
                            >
                              <span>Voir Fiche</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION FACTURATION GLOBALE SASPAY */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  Facturation SasPay Réseau & Contrôle d'Accès
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Examinez les preuves de paiement SasPay reçues sous 48h et validez l'accès logiciel pour chaque entreprise.
                </p>
              </div>
              <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 w-fit">
                {invoices.length} factures générées
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-3">Société & Contact</th>
                    <th className="py-3 px-3">Mois</th>
                    <th className="py-3 px-3 text-right">Livraisons</th>
                    <th className="py-3 px-3 text-right">Montant Total</th>
                    <th className="py-3 px-3 text-center">Statut</th>
                    <th className="py-3 px-3 text-center">Preuve Reçu</th>
                    <th className="py-3 px-3 text-right">Action Phoenix</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-xs text-slate-500">
                        Aucune facture enregistrée pour le moment.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3">
                          <strong className="text-white block">{inv.companyName}</strong>
                          <span className="text-slate-400 text-[11px] font-mono">{inv.companyEmail}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-300">{inv.month}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-200">
                          {inv.validatedDeliveriesCount}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                          {inv.totalAmount.toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-medium inline-block ${
                              inv.status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : inv.status === 'proof_submitted'
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {inv.status === 'approved'
                              ? 'Accès Validé'
                              : inv.status === 'proof_submitted'
                              ? 'Preuve Reçue'
                              : 'En attente 48h'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {inv.proofFileUrl ? (
                            <button
                              onClick={() => setSelectedProofUrl(inv.proofFileUrl || '')}
                              className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:underline cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Voir Reçu</span>
                            </button>
                          ) : (
                            <span className="text-slate-600 text-[11px]">Aucune</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {inv.status === 'approved' ? (
                            <span className="text-[11px] text-emerald-400 font-mono font-semibold flex items-center justify-end gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Validé
                            </span>
                          ) : (
                            <button
                              onClick={() => handleValidatePayment(inv.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-950 flex items-center gap-1 ml-auto cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Valider Paiement</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. VUE PAR SOCIÉTÉ SPÉCIFIQUE (FICHE ANALYTIQUE INDIVIDUELLE COMPLÈTE)     */}
      {/* ========================================================================= */}
      {selectedCompanyId !== 'all' && currentCompany && (
        <div className="space-y-6">
          {/* Header Profile de la société sélectionnée */}
          <div className="bg-slate-900/90 border border-emerald-500/40 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-4">
                {currentCompany.logoUrl ? (
                  <img
                    src={currentCompany.logoUrl}
                    alt={currentCompany.name}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-lg shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/40 flex items-center justify-center font-black text-xl shadow-lg shrink-0">
                    {currentCompany.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg sm:text-2xl font-black text-white">
                      {currentCompany.name}
                    </h2>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                        currentCompany.subscriptionStatus === 'active'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : currentCompany.subscriptionStatus === 'pending_payment'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-red-500/20 text-red-300 border-red-500/40'
                      }`}
                    >
                      {currentCompany.subscriptionStatus === 'active'
                        ? 'Abonnement Actif'
                        : currentCompany.subscriptionStatus === 'pending_payment'
                        ? 'Paiement en attente (48h)'
                        : 'Accès Suspendu'}
                    </span>
                    {currentCompany.trialActive && (
                      <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full font-mono">
                        Période d'essai 7j
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      {currentCompany.city} {currentCompany.address ? `· ${currentCompany.address}` : ''}
                    </span>
                    <span>·</span>
                    <span>Créée en {currentCompany.creationYear}</span>
                    <span>·</span>
                    <span className="text-emerald-400 font-mono">ID : {currentCompany.id}</span>
                  </p>
                </div>
              </div>

              {/* Back to Global button & Contact Manager links */}
              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={`https://wa.me/${currentCompany.managerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Bonjour M./Mme ${currentCompany.managerName}, ici l'administration FLYT (Phoenix). Nous examinons votre espace dispatch pour ${currentCompany.name}.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md active:scale-95"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>WhatsApp Gérant</span>
                </a>

                <button
                  onClick={() => setSelectedCompanyId('all')}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Vue Globale</span>
                </button>
              </div>
            </div>

            {/* Fiche d'identité Gérant & Zones */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Gérant Principal</span>
                <span className="font-semibold text-white mt-0.5 block">{currentCompany.managerName}</span>
                <span className="text-slate-400 font-mono text-[11px] block">{currentCompany.managerPhone}</span>
                {currentCompany.managerSecondaryPhone && (
                  <span className="text-slate-500 font-mono text-[10px] block">Sec: {currentCompany.managerSecondaryPhone}</span>
                )}
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Email de Facturation</span>
                <span className="text-cyan-300 font-mono mt-0.5 block truncate">{currentCompany.managerEmail}</span>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Reçoit les avis et notifications de clôture fin de mois (48h)
                </span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Zones de Livraison Couvertes</span>
                <div className="flex items-center gap-1 flex-wrap mt-1">
                  {currentCompany.zonesCovered?.slice(0, 3).map((z, idx) => (
                    <span key={idx} className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] border border-slate-700">
                      {z}
                    </span>
                  ))}
                  {(currentCompany.zonesCovered?.length || 0) > 3 && (
                    <span className="text-[10px] text-slate-500">+{currentCompany.zonesCovered.length - 3} autres</span>
                  )}
                </div>
              </div>
            </div>

            {/* Dedicated Company KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Facture Mois en Cours</span>
                <span className="font-mono text-lg font-black text-amber-300 mt-0.5 block">
                  {companyCurrentBillAmount.toLocaleString('fr-FR')} F
                </span>
                <span className="text-[10px] text-slate-500 block">
                  25 000 F + {companyDelivered}×100F
                </span>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Courses Livrées / Total</span>
                <span className="font-mono text-lg font-black text-emerald-400 mt-0.5 block">
                  {companyDelivered} <span className="text-xs text-slate-500 font-normal">/ {companyOrders.length}</span>
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {companyInProgress} en cours de route
                </span>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Total COD Collecté</span>
                <span className="font-mono text-lg font-black text-teal-300 mt-0.5 block truncate">
                  {companyCod.toLocaleString('fr-FR')} F
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Cash on Delivery validé
                </span>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Livreurs & Boutiques</span>
                <span className="font-mono text-lg font-black text-indigo-300 mt-0.5 block">
                  {companyDrivers.length} <span className="text-xs text-slate-500 font-normal">livreurs · {companyBoutiques.length} boutiques</span>
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Flotte opérationnelle
                </span>
              </div>
            </div>

            {/* Navigation Tabs for Company Detail View */}
            <div className="flex items-center gap-1.5 border-b border-slate-800 pt-2 overflow-x-auto text-xs">
              <button
                onClick={() => setCompanyViewTab('overview')}
                className={`px-3 py-2 border-b-2 font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                  companyViewTab === 'overview'
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Vue d'ensemble</span>
              </button>

              <button
                onClick={() => setCompanyViewTab('invoices')}
                className={`px-3 py-2 border-b-2 font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                  companyViewTab === 'invoices'
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Factures SasPay ({companyInvoices.length})</span>
              </button>

              <button
                onClick={() => setCompanyViewTab('drivers')}
                className={`px-3 py-2 border-b-2 font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                  companyViewTab === 'drivers'
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Bike className="w-3.5 h-3.5" />
                <span>Flotte Livreurs ({companyDrivers.length})</span>
              </button>

              <button
                onClick={() => setCompanyViewTab('orders')}
                className={`px-3 py-2 border-b-2 font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                  companyViewTab === 'orders'
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Missions & Courses ({companyOrders.length})</span>
              </button>

              <button
                onClick={() => setCompanyViewTab('boutiques')}
                className={`px-3 py-2 border-b-2 font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                  companyViewTab === 'boutiques'
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Boutiques Partenaires ({companyBoutiques.length})</span>
              </button>

              <button
                onClick={() => setCompanyViewTab('notify')}
                className={`px-3 py-2 border-b-2 font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                  companyViewTab === 'notify'
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Notification Directe</span>
              </button>
            </div>
          </div>

          {/* TAB 1: OVERVIEW */}
          {companyViewTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Facturation en cours Card */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-amber-400" />
                    Calcul Automatique Facture Fin de Mois
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Délai 48h
                  </span>
                </div>
                <div className="space-y-2 text-slate-300">
                  <div className="flex items-center justify-between">
                    <span>Abonnement mensuel unique :</span>
                    <strong className="text-white font-mono">25 000 FCFA</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Livraisons réussies ({companyDelivered} × 100 FCFA) :</span>
                    <strong className="text-emerald-400 font-mono">{(companyDelivered * 100).toLocaleString('fr-FR')} FCFA</strong>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-sm">
                    <span className="font-bold text-white">Total Facture Actuelle :</span>
                    <span className="font-mono font-black text-amber-300 text-base">
                      {companyCurrentBillAmount.toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                  Cette facture sera notifiée automatiquement au gérant chaque fin de mois avec un lien sécurisé SasPay. Le gérant dispose de 48h pour téléverser sa preuve de paiement.
                </p>
              </div>

              {/* Véhicules & Flotte Résumé */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <Bike className="w-4 h-4 text-cyan-400" />
                    Véhicules & Capacité de Flotte
                  </h3>
                  <span className="text-slate-400 font-mono text-[11px]">
                    Taille déclarée : {currentCompany.fleetSize} engins
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {currentCompany.vehicleTypes?.map((v, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 capitalize font-medium">
                        🛵 {v}
                      </span>
                    ))}
                  </div>
                  <div className="pt-2 text-slate-400 text-[11px] space-y-1">
                    <p>• Moyenne de livraisons par jour : <strong className="text-white">{currentCompany.avgDeliveriesPerDay} courses</strong></p>
                    <p>• Types de clients cibles : <strong className="text-white">{currentCompany.clientTypes?.join(', ') || 'Tous'}</strong></p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INVOICES SPECIFIC */}
          {companyViewTab === 'invoices' && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  Historique Facturation de {currentCompany.name}
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-3">Mois</th>
                      <th className="py-2.5 px-3 text-right">Courses Validées</th>
                      <th className="py-2.5 px-3 text-right">Montant Total</th>
                      <th className="py-2.5 px-3 text-center">Statut Facture</th>
                      <th className="py-2.5 px-3 text-center">Preuve Téléversée</th>
                      <th className="py-2.5 px-3 text-right">Action Phoenix</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {companyInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-xs text-slate-500">
                          Aucune facture passée enregistrée pour {currentCompany.name}.
                        </td>
                      </tr>
                    ) : (
                      companyInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-800/40">
                          <td className="py-3 px-3 font-semibold text-white">{inv.month}</td>
                          <td className="py-3 px-3 text-right font-mono">{inv.validatedDeliveriesCount}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                            {inv.totalAmount.toLocaleString('fr-FR')} FCFA
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                              inv.status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : inv.status === 'proof_submitted'
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}>
                              {inv.status === 'approved' ? 'Validé' : inv.status === 'proof_submitted' ? 'Preuve Reçue' : 'En attente 48h'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            {inv.proofFileUrl ? (
                              <button
                                onClick={() => setSelectedProofUrl(inv.proofFileUrl || '')}
                                className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:underline cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Voir Reçu</span>
                              </button>
                            ) : (
                              <span className="text-slate-600 text-[11px]">Aucun reçu</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            {inv.status === 'approved' ? (
                              <span className="text-[11px] text-emerald-400 font-mono font-semibold flex items-center justify-end gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Validé
                              </span>
                            ) : (
                              <button
                                onClick={() => handleValidatePayment(inv.id)}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md ml-auto cursor-pointer"
                              >
                                Valider
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: DRIVERS SPECIFIC */}
          {companyViewTab === 'drivers' && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Bike className="w-4 h-4 text-cyan-400" />
                  Livreurs enregistrés sous {currentCompany.name} ({companyDrivers.length})
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-3">Livreur</th>
                      <th className="py-2.5 px-3">Téléphone</th>
                      <th className="py-2.5 px-3">Véhicule</th>
                      <th className="py-2.5 px-3">Zone de Base</th>
                      <th className="py-2.5 px-3 text-center">Statut</th>
                      <th className="py-2.5 px-3 text-right">Courses Réalisées</th>
                      <th className="py-2.5 px-3 text-center">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {companyDrivers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-xs text-slate-500">
                          Aucun livreur actuellement enregistré dans cette flotte.
                        </td>
                      </tr>
                    ) : (
                      companyDrivers.map((drv) => (
                        <tr key={drv.id} className="hover:bg-slate-800/40">
                          <td className="py-3 px-3 font-semibold text-white">{drv.name}</td>
                          <td className="py-3 px-3 text-slate-300 font-mono">{drv.phone}</td>
                          <td className="py-3 px-3 capitalize text-slate-300">{drv.vehicleType}</td>
                          <td className="py-3 px-3 text-slate-400">{drv.currentZone || 'Centre-ville'}</td>
                          <td className="py-3 px-3 text-center">
                            <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                              drv.status === 'available'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : drv.status === 'on_delivery'
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                : 'bg-slate-700 text-slate-400'
                            }`}>
                              {drv.status === 'available' ? 'Disponible' : drv.status === 'on_delivery' ? 'En livraison' : 'Hors-ligne'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono">
                            <span className="text-white font-bold">{drv.todayDeliveries || 0}</span>
                            <span className="text-slate-500 text-[10px]"> (Auj) · {drv.monthDeliveries || 0} (Mois)</span>
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-amber-400 font-bold">
                            ★ {drv.rating || 5.0}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: ORDERS SPECIFIC */}
          {companyViewTab === 'orders' && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-400" />
                  Missions de Livraison de {currentCompany.name} ({companyOrders.length})
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-3">N° Course</th>
                      <th className="py-2.5 px-3">Boutique / Expéditeur</th>
                      <th className="py-2.5 px-3">Destinataire & Quartier</th>
                      <th className="py-2.5 px-3 text-right">Frais Livraison</th>
                      <th className="py-2.5 px-3 text-right">Montant COD</th>
                      <th className="py-2.5 px-3 text-center">Statut</th>
                      <th className="py-2.5 px-3">Livreur Assigné</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {companyOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-xs text-slate-500">
                          Aucune commande enregistrée pour cette société.
                        </td>
                      </tr>
                    ) : (
                      companyOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-800/40">
                          <td className="py-3 px-3 font-mono font-bold text-emerald-400">{ord.orderNumber}</td>
                          <td className="py-3 px-3">
                            <strong className="text-white block">{ord.boutiqueName}</strong>
                            <span className="text-[11px] text-slate-400">{ord.pickupQuartier}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-slate-200 block">{ord.recipientName}</span>
                            <span className="text-[11px] text-slate-400">{ord.deliveryQuartier}</span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-300">
                            {ord.deliveryFee?.toLocaleString('fr-FR')} F
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-teal-400">
                            {ord.amountToCollect?.toLocaleString('fr-FR')} F
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                              ord.status === 'delivered'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : ord.status === 'in_progress'
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}>
                              {ord.status === 'delivered' ? 'Livré' : ord.status === 'in_progress' ? 'En cours' : 'À assigner'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-300 font-medium">
                            {ord.driverName || 'Non assigné'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: BOUTIQUES SPECIFIC */}
          {companyViewTab === 'boutiques' && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Store className="w-4 h-4 text-emerald-400" />
                  Boutiques & Partenaires rattachés à {currentCompany.name} ({companyBoutiques.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {companyBoutiques.length === 0 ? (
                  <div className="col-span-3 py-6 text-center text-xs text-slate-500">
                    Aucune boutique partenaire affiliée pour le moment.
                  </div>
                ) : (
                  companyBoutiques.map((btq) => (
                    <div key={btq.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <strong className="text-white text-xs font-bold">{btq.name}</strong>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {btq.category}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {btq.quartier}
                      </p>
                      <p className="text-slate-500 text-[10px] font-mono">
                        📞 {btq.phone}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 6: NOTIFY DIRECTLY */}
          {companyViewTab === 'notify' && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-cyan-400" />
                  Envoyer une Notification Push Directe au Gérant de {currentCompany.name}
                </h3>
              </div>

              {showAnnouncementSuccess && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
                  <Sparkles className="w-4 h-4" />
                  <span>Notification transmise avec succès au gérant de {currentCompany.name} !</span>
                </div>
              )}

              <form onSubmit={handleSendAnnouncement} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Titre du Message
                  </label>
                  <input
                    type="text"
                    required
                    value={announcementTitle}
                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Contenu du Message & Instructions
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={announcementMsg}
                    onChange={(e) => setAnnouncementMsg(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-cyan-950 transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Envoyer la Notification Push</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* 5. ÉMETTEUR DE NOTIFICATIONS MULTI-SOCIÉTÉS (DISPONIBLE EN BAS DU DASHBOARD) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-cyan-400" />
              Émetteur de Notifications Push Officielles Phoenix
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Diffuser des alertes ou rappels de facturation 48h sur le tableau de bord des gérants.
            </p>
          </div>
        </div>

        {showAnnouncementSuccess && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
            <Sparkles className="w-4 h-4" />
            <span>Notification push transmise avec succès !</span>
          </div>
        )}

        <form onSubmit={handleSendAnnouncement} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Destinataires Ciblés
              </label>
              <select
                value={selectedCompanyId !== 'all' ? selectedCompanyId : announcementTarget}
                onChange={(e) => setAnnouncementTarget(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="all">🌐 Toutes les Sociétés de Livraison (Diffusion Générale)</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    🏢 {c.name} ({c.city})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Titre de la Notification *
              </label>
              <input
                type="text"
                required
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">
                Message & Instructions *
              </label>
              <textarea
                rows={3}
                required
                value={announcementMsg}
                onChange={(e) => setAnnouncementMsg(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-cyan-950 transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Diffuser la Notification Push aux Gérants</span>
            </button>
          </div>
        </form>
      </div>

      {/* Proof Modal */}
      {selectedProofUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-lg bg-[#0F172A] border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                Vérification du Reçu de Paiement SasPay
              </h3>
              <button
                onClick={() => setSelectedProofUrl(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-96 overflow-auto bg-slate-950 p-2 rounded-xl border border-slate-800 flex items-center justify-center">
              <img
                src={selectedProofUrl}
                alt="Preuve de paiement"
                className="max-w-full max-h-80 object-contain rounded"
              />
            </div>

            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setSelectedProofUrl(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg cursor-pointer hover:bg-slate-700"
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
