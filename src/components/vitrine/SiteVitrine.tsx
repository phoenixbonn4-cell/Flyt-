import React, { useState, useEffect } from 'react';
import { FlytLogo } from '../FlytLogo';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';
import { 
  ArrowRight, 
  CheckCircle2, 
  MapPin, 
  Zap, 
  ShieldCheck, 
  Smartphone, 
  Building2, 
  Bike, 
  Users, 
  BarChart3, 
  Mail, 
  Phone, 
  MessageSquare, 
  Send, 
  Clock, 
  HelpCircle, 
  ExternalLink, 
  ChevronRight,
  Sparkles,
  Wifi,
  Coins,
  Globe2,
  FileText,
  Lock,
  Layers,
  Bell,
  Receipt,
  LogIn,
  UserCheck
} from 'lucide-react';
import { AppRole, Company } from '../../types';
import { CompanyLoginModal } from './CompanyLoginModal';

interface SiteVitrineProps {
  onLaunchApp: (role?: AppRole) => void;
  onOpenOnboarding: () => void;
  activeCompany?: Company | null;
  companiesCount: number;
  companies?: Company[];
  onSelectCompany?: (companyId: string) => void;
}

export const SiteVitrine: React.FC<SiteVitrineProps> = ({
  onLaunchApp,
  onOpenOnboarding,
  activeCompany,
  companiesCount,
  companies = [],
  onSelectCompany,
}) => {
  // Modal states
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Remembered company state (persisting across sessions via "Se rappeler de moi")
  const [rememberedCompany, setRememberedCompany] = useState<Company | null>(null);

  useEffect(() => {
    try {
      const savedCompId = localStorage.getItem('flyt_remembered_company_id');
      if (savedCompId && companies.length > 0) {
        const found = companies.find((c) => c.id === savedCompId);
        if (found) {
          setRememberedCompany(found);
        }
      }
    } catch {
      // ignore
    }
  }, [companies]);

  const handleFastReconnect = (company: Company) => {
    if (onSelectCompany) {
      onSelectCompany(company.id);
    }
    onLaunchApp('gerant');
  };

  const handleForgetCompany = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      localStorage.removeItem('flyt_remembered_company_id');
      localStorage.removeItem('flyt_remembered_identifier');
    } catch {
      // ignore
    }
    setRememberedCompany(null);
  };

  // Currency switcher: 'FCFA' | 'EUR' | 'USD'
  const [currency, setCurrency] = useState<'FCFA' | 'EUR' | 'USD'>('FCFA');

  // Interactive Product Block Preview Tab
  const [activePreviewTab, setActivePreviewTab] = useState<'gerant' | 'boutique' | 'livreur' | 'client'>('gerant');

  // ROI / Savings Calculator State (FLYT: Abonnement unique 25 000 FCFA / mois + 100 FCFA / livraison)
  const [dailyDeliveries, setDailyDeliveries] = useState<number>(30);
  const avgCommissionCompetitor = 0.20; // 20% commission on other apps
  const avgCoursePrice = currency === 'FCFA' ? 1500 : currency === 'EUR' ? 6 : 7;
  const monthlyVolume = dailyDeliveries * 30;

  // FLYT unique pricing model: 25000 / month + 100 per delivery
  const fixedMonthlySub = currency === 'FCFA' ? 25000 : currency === 'EUR' ? 38 : 40;
  const perDeliveryFee = currency === 'FCFA' ? 100 : currency === 'EUR' ? 0.15 : 0.16;
  const monthlyDeliveryFees = Math.round(monthlyVolume * perDeliveryFee);
  const flytTotalCostMonthly = fixedMonthlySub + monthlyDeliveryFees;

  const competitorCostMonthly = Math.round(monthlyVolume * avgCoursePrice * avgCommissionCompetitor);
  const savingsMonthly = Math.max(0, competitorCostMonthly - flytTotalCostMonthly);

  // Contact Form State
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: '',
  });
  const [contactSuccess, setContactSuccess] = useState(false);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.email || !contactForm.name) return;
    
    // Open user's email client directly targeted at phoenixbonn4@gmail.com with structured data
    const subject = encodeURIComponent(`[Contact FLYT Vitrine] Demande de ${contactForm.name} (${contactForm.company || 'Nouvelle Société'})`);
    const body = encodeURIComponent(
      `Bonjour Phoenix Technologies,\n\nNom: ${contactForm.name}\nEmail: ${contactForm.email}\nTéléphone: ${contactForm.phone}\nSociété: ${contactForm.company}\n\nMessage:\n${contactForm.message}\n\n--\nEnvoyé depuis le site vitrine FLYT Suite`
    );
    window.location.href = `mailto:phoenixbonn4@gmail.com?subject=${subject}&body=${body}`;
    setContactSuccess(true);
    setTimeout(() => setContactSuccess(false), 6000);
  };

  // Currency conversion helpers
  const formatPrice = (amountFcfa: number, amountEur: number, amountUsd: number) => {
    if (currency === 'FCFA') return `${amountFcfa.toLocaleString()} FCFA`;
    if (currency === 'EUR') return `${amountEur} €`;
    return `$${amountUsd}`;
  };

  return (
    <div className="min-h-screen bg-[#070A11] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* 1. STICKY TOPBAR / VITRINE HEADER */}
      <header className="sticky top-0 z-40 bg-[#090D16]/95 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <FlytLogo size="md" showTagline={false} />
            <div className="hidden sm:flex flex-col">
              <span className="text-xs font-semibold text-emerald-400 tracking-wider uppercase">Suite Logistique</span>
              <span className="text-[11px] text-slate-400">Dispatch & Flottes Urbaines</span>
            </div>
          </div>

          {/* Quick Anchor Links (No pills, clean hover links) */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-300">
            <a href="#fonctionnalites" className="hover:text-emerald-400 transition-colors">
              Fonctionnalités
            </a>
            <a href="#avantages" className="hover:text-emerald-400 transition-colors">
              Avantages
            </a>
            <a href="#fonctionnement" className="hover:text-emerald-400 transition-colors">
              Fonctionnement
            </a>
            <a href="#tarification" className="hover:text-emerald-400 transition-colors">
              Tarification
            </a>
            <a href="#faq" className="hover:text-emerald-400 transition-colors">
              FAQ
            </a>
            <a href="#contact" className="hover:text-emerald-400 transition-colors">
              Contact
            </a>
          </nav>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="px-3 sm:px-3.5 py-2 text-xs font-bold text-emerald-300 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-emerald-500/50 hover:border-emerald-400 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-950/20 active:scale-95"
              title="Se reconnecter à l'espace de votre société et retrouver vos données"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-400" />
              <span>Connexion</span>
            </button>

            <button
              onClick={() => onLaunchApp('gerant')}
              className="hidden md:flex px-3.5 py-2 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl transition-all items-center gap-1.5 cursor-pointer"
            >
              <span>Accéder à l'App</span>
              <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
            </button>

            <button
              onClick={onOpenOnboarding}
              className="px-3.5 sm:px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 hover:from-emerald-300 hover:to-teal-300 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <span>Inscrire ma Société</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden pt-14 pb-20 md:pt-20 md:pb-28 border-b border-slate-800/60">
        {/* Background glow meshes */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-emerald-600/15 via-teal-500/10 to-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            {/* Quiet metadata line without pills */}
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <span className="text-emerald-400 font-semibold tracking-wide uppercase">FLYT Delivery Suite</span>
              <span aria-hidden="true">·</span>
              <span>4 Blocs Interconnectés</span>
              <span aria-hidden="true">·</span>
              <span>0% Commission</span>
              <span aria-hidden="true">·</span>
              <span>100% WhatsApp Ready</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.12]">
              La Suite Logistique & Dispatch <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                Nouvelle Génération
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
              Interconnectez vos gérants de flotte, boutiques partenaires, coursiers sur le terrain et clients finaux en temps réel. Gérez vos livraisons urbaines sans aucun prélèvement au pourcentage.
            </p>

            {/* REMEMBERED COMPANY QUICK SESSION BANNER (SE RAPPELER DE MOI) */}
            {rememberedCompany && (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/70 border-2 border-emerald-500/60 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-left animate-in fade-in duration-300">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 font-black flex items-center justify-center shrink-0 shadow-md">
                    {rememberedCompany.logoUrl ? (
                      <img
                        src={rememberedCompany.logoUrl}
                        alt={rememberedCompany.name}
                        className="w-10 h-10 rounded-xl object-cover"
                      />
                    ) : (
                      <Building2 className="w-5 h-5" />
                    )}
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 font-mono tracking-wider">
                        Session Mémorisée Détectée
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <strong className="text-white text-sm font-bold block truncate">
                      {rememberedCompany.name}
                    </strong>
                    <span className="text-slate-400 text-[11px] block truncate">
                      Gérant : {rememberedCompany.managerName} · {rememberedCompany.city}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  <button
                    onClick={() => handleFastReconnect(rememberedCompany)}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    <span>Reprendre mon espace gérant</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleForgetCompany}
                    className="px-2.5 py-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl text-xs transition-colors cursor-pointer whitespace-nowrap border border-slate-700"
                    title="Changer de société ou oublier"
                  >
                    Changer
                  </button>
                </div>
              </div>
            )}

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              <button
                onClick={onOpenOnboarding}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm rounded-xl shadow-xl shadow-emerald-500/25 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Inscrire mon entreprise (90s Chrono)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="px-5 py-3 bg-slate-900/90 hover:bg-slate-800 text-emerald-300 hover:text-white font-bold text-sm rounded-xl border border-emerald-500/40 hover:border-emerald-400 transition-all flex items-center gap-2 cursor-pointer shadow-lg active:scale-95"
              >
                <LogIn className="w-4 h-4 text-emerald-400" />
                <span>Se Reconnecter à Mon Espace</span>
              </button>

              <button
                onClick={() => onLaunchApp('gerant')}
                className="px-4 py-3 bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-sm rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Tester la Démo</span>
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              </button>
            </div>

            {/* Reconnection link & reassurance line */}
            <div className="pt-2 text-xs text-slate-400 flex items-center justify-center gap-1.5 flex-wrap">
              <span>Déjà inscrit sur FLYT ?</span>
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="text-emerald-400 hover:text-emerald-300 font-bold underline inline-flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Accédez à votre compte pour retrouver vos livreurs, boutiques et caisse COD</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Key benefits bar */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-slate-400 border-t border-slate-800/80">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Configuration instantanée</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Encaissements COD (Espèces) sécurisés</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Mode Hors-Ligne certifié (PWA)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Multi-entreprises & Flottes illimitées</span>
              </span>
            </div>
          </div>

          {/* Interactive Live Product Preview Tabs */}
          <div className="mt-14 max-w-5xl mx-auto bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-xl">
            {/* Segmented Filter Control */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 p-1 bg-slate-950/80 rounded-2xl border border-slate-800/80 mb-6">
              <button
                onClick={() => setActivePreviewTab('gerant')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  activePreviewTab === 'gerant'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Bloc 1 : Bureau Gérant</span>
              </button>
              <button
                onClick={() => setActivePreviewTab('boutique')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  activePreviewTab === 'boutique'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Bloc 2 : Portail Boutiques</span>
              </button>
              <button
                onClick={() => setActivePreviewTab('livreur')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  activePreviewTab === 'livreur'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Bike className="w-4 h-4" />
                <span>Bloc 3 : App Livreur Mobile</span>
              </button>
              <button
                onClick={() => setActivePreviewTab('client')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  activePreviewTab === 'client'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>Bloc 4 : Suivi Destinataire</span>
              </button>
            </div>

            {/* Preview Frame */}
            <div className="bg-[#0B101D] border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden min-h-[320px]">
              {activePreviewTab === 'gerant' && (
                <div className="space-y-5 animate-in fade-in">
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
                    <div>
                      <div className="text-xs text-emerald-400 font-semibold uppercase">Tour de Contrôle & Dispatch</div>
                      <h3 className="text-lg font-bold text-white">Radar en direct & Répartition des courses</h3>
                    </div>
                    <button
                      onClick={() => onLaunchApp('gerant')}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Ouvrir dans l'application</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                      <div className="text-xs text-slate-400">Livreurs en service</div>
                      <div className="text-2xl font-extrabold text-white mt-1">12 actifs</div>
                      <div className="text-[11px] text-emerald-400 mt-1">9 disponibles · 3 en course</div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                      <div className="text-xs text-slate-400">Livraisons du jour</div>
                      <div className="text-2xl font-extrabold text-white mt-1">48 courses</div>
                      <div className="text-[11px] text-emerald-400 mt-1">96% livrées dans les délais</div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                      <div className="text-xs text-slate-400">Fonds encaissés (COD)</div>
                      <div className="text-2xl font-extrabold text-emerald-400 mt-1">142 500 FCFA</div>
                      <div className="text-[11px] text-slate-400 mt-1">Clôture journalière contrôlée</div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    Visualisez chaque livreur sur la carte en temps réel, affectez les commandes en un clic, recevez des alertes de mission automatiques et contrôlez précisément chaque franc encaissé en espèces.
                  </p>
                </div>
              )}

              {activePreviewTab === 'boutique' && (
                <div className="space-y-5 animate-in fade-in">
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
                    <div>
                      <div className="text-xs text-emerald-400 font-semibold uppercase">Espace Marchands Partenaires</div>
                      <h3 className="text-lg font-bold text-white">Saisie de courses express en 30 secondes</h3>
                    </div>
                    <button
                      onClick={() => onLaunchApp('boutique')}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Tester le portail boutique</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-white">Boutique Glamour Paris</span>
                        <span className="text-emerald-400 font-mono">Bastos, Yaoundé</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Vos commerçants saisissent le destinataire, le quartier et le montant à encaisser. Le tarif de livraison est calculé automatiquement.
                      </p>
                      <div className="text-xs font-semibold text-slate-200">
                        🔗 Lien bio & commande WhatsApp prêt à partager
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                      <div className="text-xs text-slate-400">Dernière course saisie</div>
                      <div className="text-sm font-bold text-white">Commande #FLYT-882 · Robe de soirée</div>
                      <div className="text-xs text-slate-300">Destinataire: Sarah N. (699 22 33 44)</div>
                      <div className="text-[11px] text-emerald-400">Attribué au livreur Jean-Paul en 12s</div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    Fini les dizaines de coups de fil et les malentendus. Vos boutiques partenaires ont leur propre interface claire pour saisir leurs commandes en autonomie totale.
                  </p>
                </div>
              )}

              {activePreviewTab === 'livreur' && (
                <div className="space-y-5 animate-in fade-in">
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
                    <div>
                      <div className="text-xs text-emerald-400 font-semibold uppercase">Application Mobile Terrain</div>
                      <h3 className="text-lg font-bold text-white">L'App coursier pensée pour la moto et le vélo</h3>
                    </div>
                    <button
                      onClick={() => onLaunchApp('livreur')}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Tester l'interface coursier</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                      <div className="text-xs text-slate-400">Guidage GPS 1 Clic</div>
                      <div className="text-sm font-bold text-white mt-1">Google Maps / Waze</div>
                      <div className="text-[11px] text-slate-400 mt-1">Lancement instantané de l'itinéraire</div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                      <div className="text-xs text-slate-400">Contact WhatsApp Direct</div>
                      <div className="text-sm font-bold text-white mt-1">Appel & Message 1 Clic</div>
                      <div className="text-[11px] text-slate-400 mt-1">Message d'arrivée pré-rédigé</div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                      <div className="text-xs text-slate-400">Résilience Réseau</div>
                      <div className="text-sm font-bold text-emerald-400 mt-1">100% Hors-Ligne</div>
                      <div className="text-[11px] text-slate-400 mt-1">Enregistrement sans coupure</div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    Boutons surdimensionnés, alertes sonores de nouvelle mission, validation de livraison avec preuve photo et calcul des gains journaliers du coursier.
                  </p>
                </div>
              )}

              {activePreviewTab === 'client' && (
                <div className="space-y-5 animate-in fade-in">
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
                    <div>
                      <div className="text-xs text-emerald-400 font-semibold uppercase">Expérience Destinataire</div>
                      <h3 className="text-lg font-bold text-white">Suivi GPS en temps réel sans application requise</h3>
                    </div>
                    <button
                      onClick={() => onLaunchApp('client')}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Tester le suivi client</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                      <div className="text-xs text-slate-400">Statut de la course</div>
                      <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>En cours de livraison · Arrivée estimée 14 min</span>
                      </div>
                      <div className="text-xs text-slate-300">Coursier: Jean-Paul (Moto Yamaha)</div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                      <div className="text-xs text-slate-400">Transparence & Confiance</div>
                      <p className="text-xs text-slate-300">
                        Le client reçoit son lien de suivi par SMS ou WhatsApp. Il voit le livreur s'approcher sur la carte et peut l'appeler directement.
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    Éliminez les 80% d'appels clients demandant « Où est mon colis ? ». Réduisez drastiquement les échecs de livraison dus à l'absence du client.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. FONCTIONNALITÉS COMPLÈTES (4 PILLIERS + CAPACITÉS CLÉS) */}
      <section id="fonctionnalites" className="py-20 border-b border-slate-800/60 bg-[#080C16]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mx-auto text-center space-y-3 mb-16">
            <span className="text-xs font-bold text-emerald-400 tracking-wider uppercase">Architecture Interconnectée</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Toutes les Fonctionnalités pour Dominer votre Marché
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Un écosystème logiciel complet qui élimine le chaos des messages vocaux et centralise vos opérations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pilier 1 */}
            <div className="p-6 rounded-2xl bg-[#0B101D] border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">1. Bureau Gérant & Dispatch</h3>
                <ul className="text-xs text-slate-400 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Radar GPS satellite des livreurs en temps réel</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Attribution de commande en 1 clic</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Contrôle de caisse journalière (espèces COD)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Export comptable & rapports de performance</span>
                  </li>
                </ul>
              </div>
              <div className="pt-6">
                <button
                  onClick={() => onLaunchApp('gerant')}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span>Explorer le bureau gérant</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Pilier 2 */}
            <div className="p-6 rounded-2xl bg-[#0B101D] border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 group-hover:scale-105 transition-transform">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">2. Portail Boutiques</h3>
                <ul className="text-xs text-slate-400 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-teal-400 font-bold">✓</span>
                    <span>Saisie simplifiée de livraison en 30 secondes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-400 font-bold">✓</span>
                    <span>Calcul tarifaire automatique par quartier</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-400 font-bold">✓</span>
                    <span>Lien bio client direct pour les réseaux sociaux</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-400 font-bold">✓</span>
                    <span>Historique de facturation transparent</span>
                  </li>
                </ul>
              </div>
              <div className="pt-6">
                <button
                  onClick={() => onLaunchApp('boutique')}
                  className="text-xs text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span>Tester le portail boutique</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Pilier 3 */}
            <div className="p-6 rounded-2xl bg-[#0B101D] border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">3. App Mobile Livreur</h3>
                <ul className="text-xs text-slate-400 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">✓</span>
                    <span>Mode Hors-Ligne certifié (sauvegarde locale PWA)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">✓</span>
                    <span>Guidage Waze & Google Maps en un clic</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">✓</span>
                    <span>Bouton d'appel client & WhatsApp pré-rempli</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">✓</span>
                    <span>Preuve de livraison & signature digitale</span>
                  </li>
                </ul>
              </div>
              <div className="pt-6">
                <button
                  onClick={() => onLaunchApp('livreur')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span>Voir l'app livreur</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Pilier 4 */}
            <div className="p-6 rounded-2xl bg-[#0B101D] border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                  <MapPin className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">4. Suivi Destinataire Direct</h3>
                <ul className="text-xs text-slate-400 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">✓</span>
                    <span>Suivi temps réel sans aucune application requise</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">✓</span>
                    <span>Estimation précise de l'heure d'arrivée (ETA)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">✓</span>
                    <span>Partage direct par SMS ou WhatsApp</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">✓</span>
                    <span>Évaluation du service par le client</span>
                  </li>
                </ul>
              </div>
              <div className="pt-6">
                <button
                  onClick={() => onLaunchApp('client')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span>Tester le suivi direct</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. AVANTAGES COMPÉTITIFS (POURQUOI FLYT ?) */}
      <section id="avantages" className="py-20 border-b border-slate-800/60 bg-[#070A11]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mx-auto text-center space-y-3 mb-16">
            <span className="text-xs font-bold text-emerald-400 tracking-wider uppercase">Rentabilité & Autonomie</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Pourquoi les Meilleures Entreprises Choisissent FLYT
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Conçu spécifiquement pour les défis du terrain en Afrique et à l'international : réseau instable, gestion du cash et réactivité WhatsApp.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Coins className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">0% de Commission Prélevée</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Les plateformes intermédiaires prélèvent entre 15% et 25% sur chaque course. Avec FLYT, vous bénéficiez d'un abonnement unique transparent de 25 000 FCFA par mois + 100 FCFA par livraison, et vous conservez 100% de la valeur de votre travail.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Déploiement en 90 Secondes</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pas besoin de semaines d'intégration ou d'ingénieurs informatiques. Enregistrez votre société en 4 étapes simples, connectez vos boutiques et commencez à dispatcher vos premières courses immédiatement.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">100% WhatsApp Interconnecté</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                WhatsApp est le canal roi du commerce. FLYT génère automatiquement des liens d'invitation livreurs, des confirmations de commande aux boutiques et des liens de suivi personnalisés envoyés en un clic.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Wifi className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Mode Hors-Ligne Ininterrompu</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Votre livreur se trouve dans une zone blanche ou subit une panne de réseau ? L'application continue de fonctionner, mémorise les étapes et synchronise automatiquement toutes les données dès le retour de la connexion.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Maîtrise Totale du Cash (COD)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Le paiement à la livraison représente l'immense majorité des transactions. FLYT suit au centime près les sommes perçues par chaque livreur avec un module de validation de clôture de caisse quotidienne.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Globe2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Multi-Véhicules & Flotte Évolutive</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Que votre flotte soit composée de motos, tricycles cargo, camionnettes ou coursiers à pied, FLYT adapte les affectations de courses et permet de gérer plusieurs agences ou villes depuis une interface unique.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. MODE DE FONCTIONNEMENT (ÉTAPES CLAIRES) */}
      <section id="fonctionnement" className="py-20 border-b border-slate-800/60 bg-[#080C16]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mx-auto text-center space-y-3 mb-16">
            <span className="text-xs font-bold text-emerald-400 tracking-wider uppercase">Comment ça marche</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Un Fonctionnement Fluide en 5 Étapes Simples
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              De l'inscription de votre société jusqu'à l'encaissement final chez le client, découvrez le cycle de vie d'une livraison sur FLYT.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            {/* Step 1 */}
            <div className="p-5 rounded-2xl bg-[#0B101D] border border-slate-800 space-y-3 relative">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-xs flex items-center justify-center">
                01
              </div>
              <h3 className="text-sm font-bold text-white">Inscription Société</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Le gérant renseigne le nom de sa société, ses zones couvertes et la taille de sa flotte en 90 secondes chrono.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-2xl bg-[#0B101D] border border-slate-800 space-y-3 relative">
              <div className="w-8 h-8 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 font-mono font-bold text-xs flex items-center justify-center">
                02
              </div>
              <h3 className="text-sm font-bold text-white">Connexion Boutiques</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ajoutez vos commerçants partenaires ou partagez leur lien d'accès direct pour qu'ils saisissent leurs courses.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-5 rounded-2xl bg-[#0B101D] border border-slate-800 space-y-3 relative">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono font-bold text-xs flex items-center justify-center">
                03
              </div>
              <h3 className="text-sm font-bold text-white">Dispatch Intelligent</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                La commande apparaît sur le radar. Affectez le coursier le plus proche en un clic avec alerte de mission push.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-5 rounded-2xl bg-[#0B101D] border border-slate-800 space-y-3 relative">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-mono font-bold text-xs flex items-center justify-center">
                04
              </div>
              <h3 className="text-sm font-bold text-white">Livraison & Suivi</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Le livreur se déplace avec le GPS. Le client final suit la livraison en direct sur son téléphone sans application.
              </p>
            </div>

            {/* Step 5 */}
            <div className="p-5 rounded-2xl bg-[#0B101D] border border-slate-800 space-y-3 relative">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-xs flex items-center justify-center">
                05
              </div>
              <h3 className="text-sm font-bold text-white">Clôture Caisse & Facture Fin de Mois</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Validation des encaissements COD. À chaque fin de mois, votre facture est calculée et envoyée automatiquement par notification sur votre tableau de bord gérant (délai de 48h pour régler).
              </p>
            </div>
          </div>

          {/* Quick CTA */}
          <div className="mt-12 text-center">
            <button
              onClick={onOpenOnboarding}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/25 transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <span>Démarrer l'enregistrement de ma société</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 6. TARIFICATION (ABONNEMENT UNIQUE : 25 000 FCFA/MOIS + 100 FCFA/LIVRAISON) */}
      <section id="tarification" className="py-20 border-b border-slate-800/60 bg-[#070A11]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-14">
            <span className="text-xs font-bold text-emerald-400 tracking-wider uppercase">Tarification Unique & 100% Transparente</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Un Abonnement Unique : 25 000 FCFA / mois + 100 FCFA / livraison
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              FLYT applique un modèle tarifaire simple, équitable et sans surprise : un abonnement unique fixe de 
              <strong className="text-white"> 25 000 FCFA par mois </strong> 
              pour la suite logicielle complète, complété par seulement 
              <strong className="text-emerald-400"> 100 FCFA par livraison </strong> 
              effectuée avec succès. Chaque facture est <strong className="text-white">calculée et envoyée automatiquement par notification sur le tableau de bord du gérant à chaque fin de mois</strong> à chaque société, avec un <strong className="text-amber-300">délai de 48h pour régler</strong>.
            </p>

            {/* Currency Switcher */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
                <button
                  onClick={() => setCurrency('FCFA')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    currency === 'FCFA' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  FCFA (XAF/XOF)
                </button>
                <button
                  onClick={() => setCurrency('EUR')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    currency === 'EUR' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  EUR (€)
                </button>
                <button
                  onClick={() => setCurrency('USD')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    currency === 'USD' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  USD ($)
                </button>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>14 jours d'essai gratuit complet</span>
              </div>
            </div>
          </div>

          {/* Main Featured Pricing Card */}
          <div className="max-w-4xl mx-auto">
            <div className="p-7 sm:p-10 rounded-3xl bg-gradient-to-b from-[#0F1A2A] via-[#0C1524] to-[#0A121E] border-2 border-emerald-500/60 shadow-2xl shadow-emerald-500/15 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-8">
                {/* Header & Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold uppercase tracking-wider mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Formule Unique Tout-en-Un</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      Abonnement Unique FLYT Delivery Suite
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                      Accès intégral aux 4 blocs interconnectés pour propulser votre société de livraison.
                    </p>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <div className="flex items-baseline gap-1.5 sm:justify-end">
                      <span className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                        {currency === 'FCFA' ? '25 000 FCFA' : currency === 'EUR' ? '38 €' : '$40'}
                      </span>
                      <span className="text-xs sm:text-sm text-slate-400 font-normal">/ mois</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-400 font-extrabold text-sm sm:text-base sm:justify-end mt-1">
                      <span>+ {currency === 'FCFA' ? '100 FCFA' : currency === 'EUR' ? '0,15 €' : '$0.16'}</span>
                      <span className="text-xs text-emerald-300 font-medium">/ livraison livrée</span>
                    </div>
                    <span className="inline-block mt-2 text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                      Sans engagement de durée
                    </span>
                  </div>
                </div>

                {/* 2 Breakdown Pills */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-400" />
                      <span>1. Abonnement Fixe ({currency === 'FCFA' ? '25 000 FCFA' : currency === 'EUR' ? '38 €' : '$40'}/mois)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Couvre l'infrastructure cloud haute performance, la synchronisation temps réel, les serveurs sécurisés et le support client continu.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <Bike className="w-4 h-4 text-teal-400" />
                      <span>2. Frais à l'Usage ({currency === 'FCFA' ? '100 FCFA' : currency === 'EUR' ? '0,15 €' : '$0.16'}/course)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Un micro-frais appliqué exclusivement aux livraisons clôturées avec succès. Vous ne payez que lorsque votre activité tourne !
                    </p>
                  </div>
                </div>

                {/* Notification Facture Fin de Mois & Délai 48h Callout */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/60 border-2 border-emerald-500/50 shadow-lg space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                        <Bell className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                        <span>Facturation Automatique & Notification Fin de Mois</span>
                      </h4>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-black w-fit font-mono">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Délai de règlement : 48h</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    À chaque fin de mois, chaque facture est <strong className="text-white">calculée et envoyée automatiquement par notification push</strong> directement sur le tableau de bord du gérant pour chaque société. Chaque entreprise dispose d'un <strong className="text-amber-300">délai strict de 48 heures pour régler sa facture</strong> en toute simplicité via Mobile Money (Orange Money, MTN, Wave), carte ou virement.
                  </p>
                </div>

                {/* Features List (Comprehensive 2-column grid) */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Ce qui est inclus dans votre abonnement unique (Zéro surcoût caché) :
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong className="text-white">Livreurs illimités :</strong> Connectez tous vos coursiers sans payer de licence par utilisateur.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong className="text-white">Boutiques partenaires illimitées :</strong> Accordez un accès autonome à tous vos commerçants et restaurants.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong className="text-white">Bureau du Gérant tout-en-un :</strong> Dispatch intelligent, radar des tournées, assignation en 1 clic.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong className="text-white">App Mobile Livreurs (PWA) :</strong> Guidage GPS, alertes sonores de courses, mode hors-ligne sans coupure.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong className="text-white">Portail Boutiques Express :</strong> Saisie rapide en 30s et suivi des commandes sans identifiants fastidieux.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong className="text-white">Suivi Destinataire en Direct (ETA) :</strong> Liens WhatsApp de tracking dynamique sans aucune installation requise.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong className="text-white">Gestion Caisse & COD en Espèces :</strong> Calcul automatique des montants dus par livreur et clôture de caisse en fin de tournée.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong className="text-white">Facturation Automatique Fin de Mois :</strong> Notification directe au gérant récapitulant l'abonnement et les courses (règlement sous 48h).</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong className="text-white">Partage WhatsApp Instantané :</strong> Liens d'invitation livreurs et notifications prêtes à envoyer en 1 clic.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong className="text-white">Support WhatsApp Prioritaire 7j/7 :</strong> Assistance réactive assurée directement par l'équipe Phoenix.</span>
                    </div>
                  </div>
                </div>

                {/* Primary CTA Button */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    onClick={onOpenOnboarding}
                    className="w-full sm:flex-1 py-4 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Inscrire ma Société & Démarrer l'Essai Gratuit (14j)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onLaunchApp('gerant')}
                    className="w-full sm:w-auto px-6 py-4 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-2xl border border-slate-700 transition-colors cursor-pointer"
                  >
                    Accéder à l'Application
                  </button>
                </div>

                <div className="flex items-center justify-center gap-4 text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>14 jours d'essai sans carte bancaire</span>
                  </span>
                  <span>•</span>
                  <span>Mise en service en 90 secondes</span>
                  <span>•</span>
                  <span>Sans engagement</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Pillars of Transparency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto mt-12">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs">
                25 000
              </div>
              <h4 className="text-xs font-bold text-white">Forfait Fixe Mensuel</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                25 000 FCFA/mois couvrent vos serveurs haute vitesse, la sauvegarde temps réel, le radar GPS et les mises à jour.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 font-bold text-xs">
                +100
              </div>
              <h4 className="text-xs font-bold text-white">100 FCFA / Course</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Uniquement sur les courses livrées avec succès. Vous ne payez que proportionnellement à votre activité réelle.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">
                <Bell className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white">Notification Fin de Mois</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Chaque facture est calculée et envoyée automatiquement par notification sur le tableau de bord du gérant à chaque fin de mois.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-xs">
                48h
              </div>
              <h4 className="text-xs font-bold text-white">Délai Règlement : 48h</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Chaque société dispose de 48 heures pour régler sa facture en toute sécurité par Mobile Money, carte ou virement.
              </p>
            </div>
          </div>

          {/* Interactive Savings Calculator based on 25000/mo + 100/delivery */}
          <div className="mt-16 p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 max-w-4xl mx-auto space-y-6 shadow-xl">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold uppercase">
                Simulateur de Rentabilité en Direct
              </div>
              <h3 className="text-xl font-bold text-white">Calculez Vos Économies Mensuelles avec FLYT</h3>
              <p className="text-xs text-slate-400 max-w-lg mx-auto">
                Ajustez le nombre moyen de courses quotidiennes de votre flotte pour constater vos gains réels face aux plateformes à commission de 20%.
              </p>
            </div>

            <div className="space-y-3 max-w-xl mx-auto bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
              <div className="flex justify-between text-xs font-semibold text-slate-300">
                <span>Activité estimée de votre flotte :</span>
                <span className="text-emerald-400 font-mono text-sm font-bold">
                  {dailyDeliveries} courses / jour ({monthlyVolume} courses / mois)
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={200}
                step={5}
                value={dailyDeliveries}
                onChange={(e) => setDailyDeliveries(Number(e.target.value))}
                className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>5 courses/j</span>
                <span>100 courses/j</span>
                <span>200+ courses/j</span>
              </div>
            </div>

            {/* Calculations Breakdown Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto pt-2">
              {/* FLYT Cost Card */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1">
                <div className="text-[11px] font-semibold text-slate-400">Coût Total FLYT (Unique)</div>
                <div className="text-lg sm:text-xl font-black text-white font-mono">
                  {currency === 'FCFA' ? `${flytTotalCostMonthly.toLocaleString()} FCFA` : `${flytTotalCostMonthly} ${currency}`}
                </div>
                <div className="text-[10px] text-slate-500">
                  {currency === 'FCFA'
                    ? `25 000 fixe + (${monthlyVolume} × 100 FCFA)`
                    : `Fixe + (${monthlyVolume} livraisons)`}
                </div>
              </div>

              {/* Competitor Cost Card */}
              <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/25 text-center space-y-1">
                <div className="text-[11px] font-semibold text-rose-300">Concurrents à 20% com.</div>
                <div className="text-lg sm:text-xl font-black text-rose-400 font-mono">
                  ~{competitorCostMonthly.toLocaleString()} {currency}
                </div>
                <div className="text-[10px] text-rose-300/70">
                  Sur base de 1 500 FCFA / course
                </div>
              </div>

              {/* Net Savings Card */}
              <div className="p-4 rounded-2xl bg-emerald-950/30 border-2 border-emerald-500/50 text-center space-y-1 shadow-lg shadow-emerald-500/10">
                <div className="text-[11px] font-bold text-emerald-300 uppercase">Économies Nettes / mois</div>
                <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                  +{savingsMonthly.toLocaleString()} {currency}
                </div>
                <div className="text-[10px] text-emerald-300/80 font-semibold">
                  Restant dans la poche de votre entreprise
                </div>
              </div>
            </div>

            <div className="text-center pt-2">
              <p className="text-xs text-slate-400">
                Soit <strong className="text-emerald-400">{(savingsMonthly * 12).toLocaleString()} {currency} d'économies annuelles</strong> réinjectées directement dans votre flotte et le développement de votre entreprise.
              </p>
            </div>
          </div>

          {/* Payment Methods Banner */}
          <div className="mt-12 text-center space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Moyens de Paiement Disponibles & Sécurisés
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-medium text-slate-300">
              <span className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                <span>Orange Money</span>
              </span>
              <span className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-yellow-400" />
                <span>MTN Mobile Money</span>
              </span>
              <span className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>Wave</span>
              </span>
              <span className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Carte Visa / Mastercard</span>
              </span>
              <span className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Virement Bancaire</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FOIRE AUX QUESTIONS (FAQ) */}
      <section id="faq" className="py-20 border-b border-slate-800/60 bg-[#080C16]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-3 mb-12">
            <span className="text-xs font-bold text-emerald-400 tracking-wider uppercase">Questions Fréquentes</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Tout ce que vous devez savoir sur FLYT
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Une interrogation ? Trouvez votre réponse immédiate ci-dessous.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "Quel est le tarif de l'abonnement FLYT et comment fonctionne la facturation ?",
                a: "FLYT fonctionne sur un modèle d'abonnement unique très clair et rentable : un forfait fixe de 25 000 FCFA par mois + 100 FCFA par livraison effectuée avec succès. Aucune commission en pourcentage n'est prélevée sur le montant de vos courses, et tout est inclus en illimité (livreurs illimités, boutiques illimitées, radar GPS, bureau gérant, app mobile livreurs, suivi client et caisse COD). Vous bénéficiez en plus de 14 jours d'essai gratuit sans carte bancaire.",
              },
              {
                q: "Comment et quand chaque société reçoit-elle sa facture, et quel est le délai accordé pour la régler ?",
                a: "À chaque fin de mois, la facture de chaque société est calculée et envoyée automatiquement par notification push directement sur le tableau de bord du gérant. Elle détaille l'abonnement mensuel unique de 25 000 FCFA ainsi que les 100 FCFA par livraison réussie. Chaque société dispose d'un délai strict de 48 heures pour régler sa facture en toute sécurité via Orange Money, MTN Mobile Money, Wave, Carte Bancaire ou Virement.",
              },
              {
                q: "Mes livreurs doivent-ils posséder un smartphone haut de gamme ?",
                a: "Non. FLYT fonctionne sur n'importe quel smartphone Android ou iPhone d'entrée de gamme disposant d'un navigateur internet moderne (Chrome, Safari, Firefox). Grâce à la technologie PWA (Progressive Web App), aucune installation complexe n'est obligatoire.",
              },
              {
                q: "Comment fonctionne l'application en cas de coupure de réseau ou de 4G ?",
                a: "L'application intègre un mode hors-ligne résilient. Le coursier peut continuer à consulter ses courses, valider ses livraisons et enregistrer les encaissements. Toutes les actions sont stockées en cache local et se synchronisent automatiquement vers le Cloud dès que la connexion est rétablie.",
              },
              {
                q: "Comment mes commerçants partenaires saisissent-ils leurs courses ?",
                a: "Chaque boutique partenaire reçoit son lien sécurisé vers son portail dédié. Elle peut y saisir ses livraisons en 30 secondes sans mot de passe compliqué, suivre les statuts en direct et même partager un lien de commande bio à ses clients sur Instagram ou WhatsApp.",
              },
              {
                q: "Comment s'effectue le contrôle des espèces (Cash On Delivery) ?",
                a: "Le gérant dispose d'un module de caisse précis qui calcule en direct la somme totale due par chaque coursier en fonction des courses livrées. À la fin de sa tournée, le livreur remet l'argent liquide et le gérant valide la clôture en 1 clic.",
              },
              {
                q: "Puis-je tester l'application avant de payer ?",
                a: "Oui, absolument ! Vous bénéficiez d'un essai complet de 14 jours sans engagement, sans carte bancaire requise lors de l'inscription.",
              },
            ].map((faq, index) => (
              <div
                key={index}
                className="rounded-2xl bg-[#0B101D] border border-slate-800 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 font-semibold text-sm text-white hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <span className="text-slate-400 text-lg leading-none shrink-0 font-mono">
                    {openFaqIndex === index ? '−' : '+'}
                  </span>
                </button>
                {openFaqIndex === index && (
                  <div className="px-6 pb-4 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. SECTION CONTACT DIRECTE & FORMULAIRE */}
      <section id="contact" className="py-20 border-b border-slate-800/60 bg-[#070A11]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
            {/* Left Column: Direct Info */}
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold text-emerald-400 tracking-wider uppercase">Contact & Support</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
                  Une Question ? Échangeons Directement
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                  Notre équipe est à votre écoute pour vous accompagner dans le déploiement de FLYT au sein de votre entreprise de livraison.
                </p>
              </div>

              <div className="space-y-4">
                <a
                  href="mailto:phoenixbonn4@gmail.com?subject=Contact FLYT Delivery Suite"
                  className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 flex items-center gap-4 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Email Officiel</div>
                    <div className="text-sm font-bold text-white font-mono group-hover:text-emerald-400 transition-colors">
                      phoenixbonn4@gmail.com
                    </div>
                  </div>
                </a>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Disponibilité</div>
                    <div className="text-sm font-bold text-white">7j / 7 · Réponse en moins de 2h</div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Éditeur & Développeur</div>
                    <div className="text-sm font-bold text-white">Phoenix Technologies</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Contact Form */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0B101D] border border-slate-800 shadow-xl">
              <h3 className="text-base font-bold text-white mb-4">Envoyez-nous un message direct</h3>

              {contactSuccess && (
                <div className="mb-4 p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Votre client de messagerie s'est ouvert. Votre message est prêt à être transmis à phoenixbonn4@gmail.com !</span>
                </div>
              )}

              <form onSubmit={handleContactSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Votre Nom *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: David M."
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="nom@entreprise.com"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Téléphone / WhatsApp</label>
                    <input
                      type="tel"
                      placeholder="+237 / +225 / +33..."
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Nom de votre Société</label>
                  <input
                    type="text"
                    placeholder="Ex: Swift Express Douala"
                    value={contactForm.company}
                    onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Votre Message</label>
                  <textarea
                    rows={3}
                    placeholder="Bonjour, je souhaite déployer FLYT pour ma flotte de 8 motos..."
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Envoyer à phoenixbonn4@gmail.com</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 9. PIED DE PAGE (FOOTER) AVEC LIEN POLITIQUE, CONTACT & LIENS RAPIDES */}
      <footer className="bg-[#05080E] border-t border-slate-800/80 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800/80">
            {/* Col 1: Brand & Presentation */}
            <div className="space-y-4 md:col-span-1">
              <FlytLogo size="md" showTagline={false} />
              <p className="text-xs text-slate-400 leading-relaxed">
                FLYT est la suite logicielle tout-en-un de gestion logistique et dispatch de livraison interconnectant le Bureau Gérant, le Portail Boutiques, l'App Livreur et le Suivi Client.
              </p>
              <div className="text-[11px] text-slate-400">
                Développé avec passion par <span className="text-emerald-400 font-semibold">Phoenix Technologies</span>.
              </div>
            </div>

            {/* Col 2: Liens Rapides - Navigation Vitrine */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Liens Rapides</h4>
              <ul className="text-xs text-slate-400 space-y-2">
                <li>
                  <a href="#fonctionnalites" className="hover:text-emerald-400 transition-colors">
                    Fonctionnalités
                  </a>
                </li>
                <li>
                  <a href="#avantages" className="hover:text-emerald-400 transition-colors">
                    Avantages & ROI
                  </a>
                </li>
                <li>
                  <a href="#fonctionnement" className="hover:text-emerald-400 transition-colors">
                    Mode de Fonctionnement
                  </a>
                </li>
                <li>
                  <a href="#tarification" className="hover:text-emerald-400 transition-colors">
                    Tarifs & Forfaits
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-emerald-400 transition-colors">
                    Foire Aux Questions
                  </a>
                </li>
                <li>
                  <button
                    onClick={() => setIsPrivacyModalOpen(true)}
                    className="hover:text-emerald-400 transition-colors text-left cursor-pointer text-emerald-400/90 font-medium"
                  >
                    Politiques de Confidentialité
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Liens Rapides - Accès à l'Application */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Accès Plateforme</h4>
              <ul className="text-xs text-slate-400 space-y-2">
                <li>
                  <button
                    onClick={() => onLaunchApp('gerant')}
                    className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
                  >
                    1. Bureau du Gérant
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onLaunchApp('boutique')}
                    className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
                  >
                    2. Portail Boutiques Partenaires
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onLaunchApp('livreur')}
                    className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
                  >
                    3. Application Mobile Livreur
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onLaunchApp('client')}
                    className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
                  >
                    4. Suivi Direct Destinataire
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="hover:text-emerald-400 transition-colors text-left cursor-pointer font-bold text-emerald-400 flex items-center gap-1.5"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Connexion Entreprise (Se Reconnecter)</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={onOpenOnboarding}
                    className="hover:text-emerald-400 transition-colors text-left cursor-pointer font-semibold text-slate-300"
                  >
                    Inscrire une Société (90s)
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 4: Contact & Légal */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Contact Officiel</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pour toute demande commerciale, partenariat ou assistance technique :
              </p>
              <div>
                <a
                  href="mailto:phoenixbonn4@gmail.com"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-emerald-400 font-mono text-xs font-medium transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>phoenixbonn4@gmail.com</span>
                </a>
              </div>

              {/* Bouton Politique de Confidentialité */}
              <div className="pt-2">
                <button
                  onClick={() => setIsPrivacyModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="underline decoration-slate-700 underline-offset-4">
                    Politiques de confidentialité (RGPD)
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Copyright & Terms */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div>
              © 2026 FLYT Delivery Suite. Tous droits réservés.
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsPrivacyModalOpen(true)}
                className="hover:text-slate-200 transition-colors cursor-pointer"
              >
                Politiques de confidentialité
              </button>
              <span aria-hidden="true">·</span>
              <a
                href="mailto:phoenixbonn4@gmail.com"
                className="hover:text-emerald-400 transition-colors"
              >
                phoenixbonn4@gmail.com
              </a>
              <span aria-hidden="true">·</span>
              <button
                onClick={() => onLaunchApp('gerant')}
                className="hover:text-emerald-400 transition-colors cursor-pointer text-emerald-400 font-medium"
              >
                Lancer l'Application
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* MODALE POLITIQUE DE CONFIDENTIALITÉ */}
      <PrivacyPolicyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />

      {/* MODALE DE CONNEXION ENTREPRISE (AVEC SE RAPPELER DE MOI) */}
      <CompanyLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        companies={companies}
        onLoginSuccess={(company) => {
          setIsLoginModalOpen(false);
          if (onSelectCompany) {
            onSelectCompany(company.id);
          }
          onLaunchApp('gerant');
        }}
        onOpenRegister={() => {
          setIsLoginModalOpen(false);
          onOpenOnboarding();
        }}
      />
    </div>
  );
};
