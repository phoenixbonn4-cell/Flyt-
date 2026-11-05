import React, { useState, useRef } from 'react';
import { Company, Driver, VehicleType, ClientType, Manager } from '../types';
import { FlytStorage } from '../services/storage';
import { saveCompanyToFirestore, saveDriverToFirestore, saveManagerToFirestore } from '../services/firebase';
import { 
  Building2, 
  UserCheck, 
  Truck, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  AlertTriangle, 
  CheckCircle2, 
  Upload, 
  Phone, 
  Mail, 
  Lock, 
  X,
  UserPlus,
  Share2,
  Copy,
  Check,
  MessageCircle,
  Clock,
  ShieldCheck,
  Plus,
  Trash2
} from 'lucide-react';
import { FlytLogo } from './FlytLogo';

interface CompanyRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted: (company: Company) => void;
  canDismiss?: boolean;
  onReturnToVitrine?: () => void;
}

const CAMEROON_CITIES = [
  'Yaoundé',
  'Douala',
  'Bafoussam',
  'Garoua',
  'Bamenda',
  'Maroua',
  'Ngaoundéré',
  'Kribi',
  'Limbe',
  'Autre'
];

const PRESET_ZONES = [
  'Tout Yaoundé',
  'Yaoundé 1 (Nlongkak / Etoudi)',
  'Yaoundé 2 (Tsinga / Mokolo)',
  'Yaoundé 3 (Biyem-Assi / Efoulan)',
  'Yaoundé 4 (Kondengui / Ekounou)',
  'Yaoundé 5 (Essos / Ngousso)',
  'Yaoundé 6 (Biyem-Assi / Mendong)',
  'Yaoundé 7 (Nkolbisson)',
  'Bastos & Ambassades',
  'Tout Douala',
  'Douala 1 (Bonanjo / Akwa)',
  'Douala 2 (New Bell)',
  'Douala 3 (Logbaba / Bassa)',
  'Douala 4 (Bonabéri)',
  'Douala 5 (Bonamoussadi / Makepe)'
];

export const CompanyRegistrationModal: React.FC<CompanyRegistrationModalProps> = ({
  isOpen,
  onClose,
  onCompleted,
  canDismiss = true,
  onReturnToVitrine,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const handleReturnToSite = () => {
    if (onReturnToVitrine) {
      onReturnToVitrine();
    } else {
      onClose();
    }
  };

  // ÉTAPE 1 : L'IDENTITÉ DE L'ENTREPRISE
  const [companyName, setCompanyName] = useState('');
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [city, setCity] = useState('Yaoundé');
  const [address, setAddress] = useState('');
  const [creationYear, setCreationYear] = useState<number>(new Date().getFullYear());
  const [logoError, setLogoError] = useState<string>('');
  const [stepError, setStepError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ÉTAPE 2 : LE GÉRANT
  const [managerName, setManagerName] = useState('');
  const [managerPhone, setManagerPhone] = useState('');
  const [managerSecondaryPhone, setManagerSecondaryPhone] = useState('');
  const [managerEmail, setManagerEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Secondary managers / dispatchers appointed by the main manager
  const [secondaryManagers, setSecondaryManagers] = useState<Array<{ name: string; phone: string; email: string; role: string }>>([]);
  const [showAddSecondary, setShowAddSecondary] = useState(false);
  const [secName, setSecName] = useState('');
  const [secPhone, setSecPhone] = useState('');
  const [secEmail, setSecEmail] = useState('');
  const [secRole, setSecRole] = useState('Dispatch & Opérations');

  // ÉTAPE 3 : LA FLOTTE
  const [fleetSize, setFleetSize] = useState<number>(5);
  const [fleetError, setFleetError] = useState<string>('');
  const [selectedVehicles, setSelectedVehicles] = useState<VehicleType[]>(['moto']);
  const [zonesCovered, setZonesCovered] = useState<string[]>(['Tout Yaoundé']);
  const [customZoneInput, setCustomZoneInput] = useState('');
  const [avgDeliveriesPerDay, setAvgDeliveriesPerDay] = useState<string>('20-50');
  const [clientTypes, setClientTypes] = useState<ClientType[]>([
    'boutiques_ecommerce',
    'restaurants',
  ]);

  // ÉTAPE 4 : FÉLICITATIONS & AJOUT DE LIVREURS
  const [createdCompany, setCreatedCompany] = useState<Company | null>(null);
  const [hasCopiedInviteLink, setHasCopiedInviteLink] = useState(false);
  const [showManualDriverForm, setShowManualDriverForm] = useState(false);
  const [manualDriverName, setManualDriverName] = useState('');
  const [manualDriverPhone, setManualDriverPhone] = useState('');
  const [manualDriverVehicle, setManualDriverVehicle] = useState<VehicleType>('moto');
  const [manualDriverSuccess, setManualDriverSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle Logo Upload (with instant client preview)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setLogoError('Veuillez sélectionner un fichier image valide (PNG, JPG, SVG).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setLogoError("L'image est trop volumineuse (max 2 Mo).");
      return;
    }

    setLogoError('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      setLogoPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setStepError('Veuillez renseigner le nom commercial de votre société.');
      return;
    }
    if (!address.trim()) {
      setStepError("Veuillez renseigner l'adresse du siège / bureau.");
      return;
    }
    setStepError('');
    setStep(2);
  };

  const handleAddSecondaryManager = () => {
    if (!secName.trim() || !secPhone.trim()) return;
    setSecondaryManagers((prev) => [
      ...prev,
      {
        name: secName.trim(),
        phone: secPhone.trim(),
        email: secEmail.trim(),
        role: secRole.trim(),
      },
    ]);
    setSecName('');
    setSecPhone('');
    setSecEmail('');
    setShowAddSecondary(false);
  };

  const handleRemoveSecondaryManager = (index: number) => {
    setSecondaryManagers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managerName.trim()) {
      setStepError('Le nom du gérant est obligatoire.');
      return;
    }
    if (!managerPhone.trim()) {
      setStepError('Le numéro WhatsApp du gérant est obligatoire.');
      return;
    }
    if (!managerEmail.trim()) {
      setStepError("L'email professionnel est obligatoire.");
      return;
    }
    setStepError('');
    setStep(3);
  };

  const handleToggleZone = (z: string) => {
    if (zonesCovered.includes(z)) {
      if (zonesCovered.length > 1) {
        setZonesCovered(zonesCovered.filter((item) => item !== z));
      }
    } else {
      setZonesCovered([...zonesCovered, z]);
    }
  };

  const handleAddCustomZone = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customZoneInput.trim()) {
      e.preventDefault();
      if (!zonesCovered.includes(customZoneInput.trim())) {
        setZonesCovered([...zonesCovered, customZoneInput.trim()]);
      }
      setCustomZoneInput('');
    }
  };

  const handleNextStep3 = async (e: React.FormEvent) => {
    e.preventDefault();

    // STRICT CHECK: Fleet size must be >= 3
    if (fleetSize < 3) {
      setFleetError(
        "FLYT est réservé aux sociétés professionnelles disposant d'au moins 3 livreurs actifs. Si vous avez moins de 3 livreurs, votre demande est mise en attente de validation."
      );
      return;
    }

    setFleetError('');

    // CREATE COMPANY IN FIRESTORE & LOCAL STORAGE
    const newCompanyId = `comp_${Date.now()}`;
    const newCompany: Company = {
      id: newCompanyId,
      name: companyName.trim(),
      ...(logoPreview ? { logoUrl: logoPreview } : {}),
      city,
      address: address.trim(),
      creationYear: Number(creationYear),
      managerName: managerName.trim(),
      managerPhone: managerPhone.trim(),
      ...(managerSecondaryPhone.trim() ? { managerSecondaryPhone: managerSecondaryPhone.trim() } : {}),
      managerEmail: managerEmail.trim(),
      ...(password.trim() ? { password: password.trim() } : {}),
      fleetSize,
      vehicleTypes: selectedVehicles,
      zonesCovered: zonesCovered.length > 0 ? zonesCovered : ['Tout Yaoundé'],
      avgDeliveriesPerDay,
      clientTypes,
      trialActive: true,
      trialExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      subscriptionStatus: 'active',
      lastInvoiceAmount: 25000,
      createdAt: new Date().toISOString(),
    };

    // Save to Firestore and local storage in real-time
    FlytStorage.saveCompany(newCompany);
    try {
      localStorage.setItem('flyt_remembered_company_id', newCompany.id);
      localStorage.setItem('flyt_remembered_identifier', newCompany.managerPhone || newCompany.managerEmail);
    } catch {
      // ignore
    }
    await saveCompanyToFirestore(newCompany).catch(() => {});

    // Save appointed secondary managers in Firestore
    for (const sec of secondaryManagers) {
      const secMgr: Manager = {
        id: `mgr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        companyId: newCompanyId,
        name: sec.name,
        phone: sec.phone,
        ...(sec.email ? { email: sec.email } : {}),
        role: 'dispatch',
        addedAt: new Date().toISOString(),
      };
      FlytStorage.saveManager(secMgr);
      await saveManagerToFirestore(secMgr).catch(() => {});
    }

    // Add Welcome notification
    FlytStorage.addNotification({
      companyId: newCompanyId,
      title: `Bienvenue sur FLYT - Espace ${newCompany.name} opérationnel !`,
      message: `Votre société est activée avec succès en base de données temps réel. Vous pouvez inviter vos livreurs dès maintenant.`,
      type: 'admin_announcement',
      targetRole: 'gerant',
    });

    setCreatedCompany(newCompany);
    setStep(4);
  };

  // Generate unique driver invitation link
  const getInviteLink = () => {
    if (!createdCompany) return window.location.href;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/?joinCompany=${createdCompany.id}&companyName=${encodeURIComponent(createdCompany.name)}`;
  };

  const handleCopyInviteLink = async () => {
    const link = getInviteLink();
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(link);
      } else {
        const ta = document.createElement('textarea');
        ta.value = link;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setHasCopiedInviteLink(true);
      setTimeout(() => setHasCopiedInviteLink(false), 3000);
    } catch (err) {
      console.error('Erreur copie:', err);
    }
  };

  // Handle adding a driver manually from Step 4
  const handleAddManualDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdCompany || !manualDriverName.trim() || !manualDriverPhone.trim()) return;

    const newDriver: Driver = {
      id: `drv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      companyId: createdCompany.id,
      name: manualDriverName.trim(),
      phone: manualDriverPhone.trim(),
      vehicleType: manualDriverVehicle,
      status: 'available',
      currentZone: createdCompany.zonesCovered[0] || 'Centre-ville',
      currentLat: 3.8667,
      currentLng: 11.5167,
      todayDeliveries: 0,
      weekDeliveries: 0,
      monthDeliveries: 0,
      totalEarningsFcfa: 0,
      rating: 5.0,
    };

    FlytStorage.saveDriver(newDriver);
    await saveDriverToFirestore(newDriver).catch(() => {});

    setManualDriverSuccess(`✅ Livreur ${newDriver.name} enregistré avec succès dans votre flotte !`);
    setManualDriverName('');
    setManualDriverPhone('');
    setTimeout(() => setManualDriverSuccess(null), 4000);
  };

  const toggleVehicle = (v: VehicleType) => {
    if (selectedVehicles.includes(v)) {
      if (selectedVehicles.length > 1) {
        setSelectedVehicles(selectedVehicles.filter((item) => item !== v));
      }
    } else {
      setSelectedVehicles([...selectedVehicles, v]);
    }
  };

  const toggleClientType = (ct: ClientType) => {
    if (clientTypes.includes(ct)) {
      if (clientTypes.length > 1) {
        setClientTypes(clientTypes.filter((item) => item !== ct));
      }
    } else {
      setClientTypes([...clientTypes, ct]);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={() => {
        handleReturnToSite();
      }}
    >
      <div 
        className="w-full max-w-2xl bg-[#0F172A] border-2 border-emerald-500/40 rounded-3xl shadow-2xl overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <FlytLogo size="md" showTagline={false} />
            <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block" />
            <div className="truncate">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400 block truncate">
                Inscription Société · 90s Chrono
              </span>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Base de données cloud & sauvegarde automatique en temps réel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleReturnToSite}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
              title="Retourner vers le site vitrine"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400" />
              <span>Retour au site</span>
            </button>
            <button
              type="button"
              onClick={handleReturnToSite}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Fermer et retourner au site"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stepper Progress */}
        <div className="px-4 sm:px-6 py-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs">
          {[
            { num: 1, label: "1. L'Identité" },
            { num: 2, label: '2. Le Gérant' },
            { num: 3, label: '3. La Flotte' },
            { num: 4, label: '4. Espace Créé' },
          ].map((st) => (
            <div key={st.num} className="flex items-center gap-1.5 sm:gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-[11px] transition-all ${
                  step === st.num
                    ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.6)] ring-2 ring-emerald-400/50 scale-105'
                    : step > st.num
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/50'
                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                }`}
              >
                {step > st.num ? '✓' : st.num}
              </div>
              <span
                className={`text-[11px] font-semibold ${
                  step === st.num ? 'text-white' : step > st.num ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                {st.label}
              </span>
            </div>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-7">
          {/* ======================================================== */}
          {/* ÉTAPE 1 : L'IDENTITÉ DE L'ENTREPRISE                     */}
          {/* ======================================================== */}
          {step === 1 && (
            <form onSubmit={handleNextStep1} className="space-y-4 animate-in fade-in">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-400" />
                  ÉTAPE 1 : L'IDENTITÉ DE L'ENTREPRISE
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  C'est pour savoir qui facturer et configurer votre marque blanche.
                </p>
              </div>

              {/* Nom commercial */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Nom commercial de la société <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ex: Express Yaoundé SARL"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Logo Upload (Obligatoire pour marque blanche) */}
              <div className="space-y-1.5 p-3.5 bg-slate-900/60 border border-slate-800 rounded-2xl">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Logo de la société</span>
                    <span className="text-[10px] text-emerald-400 font-mono">(Marque Blanche)</span>
                  </label>
                  <span className="text-[10px] text-slate-400">PNG, JPG, SVG (Max 2 Mo)</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Obligatoire pour la marque blanche : vos clients et livreurs verront ce logo sur tous les reçus et tracking.
                </p>

                <div className="flex items-center gap-3 pt-1">
                  {logoPreview ? (
                    <div className="relative w-14 h-14 rounded-xl border-2 border-emerald-500 overflow-hidden bg-slate-950 flex items-center justify-center shrink-0">
                      <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain" />
                      <button
                        type="button"
                        onClick={() => setLogoPreview('')}
                        className="absolute top-0.5 right-0.5 p-0.5 bg-black/70 text-red-400 rounded-full hover:bg-black"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-xl border border-dashed border-slate-700 bg-slate-950 flex items-center justify-center text-slate-500 shrink-0">
                      <Building2 className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{logoPreview ? 'Changer le logo' : 'Téléverser le logo'}</span>
                    </button>
                    {logoError && <p className="text-[11px] text-red-400 mt-1">{logoError}</p>}
                  </div>
                </div>
              </div>

              {/* Ville principale d'activité & Année de création */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Ville principale d'activité <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {CAMEROON_CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500">Sert à calibrer la carte de guidage et le dispatch.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Année de création <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="1990"
                    max="2026"
                    value={creationYear}
                    onChange={(e) => setCreationYear(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-[10px] text-slate-500">Pour évaluer l'ancienneté de votre flotte.</p>
                </div>
              </div>

              {/* Adresse du bureau / siège */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Adresse du bureau / siège <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Quartier + ville. Ex: Bastos, Yaoundé"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={handleReturnToSite}
                  className="px-4 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-700 active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4 text-emerald-400" />
                  <span>Retour au site vitrine</span>
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
                >
                  <span>Continuer (Le Gérant)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* ÉTAPE 2 : LE GÉRANT                                      */}
          {/* ======================================================== */}
          {step === 2 && (
            <form onSubmit={handleNextStep2} className="space-y-4 animate-in fade-in">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-400" />
                  ÉTAPE 2 : LE GÉRANT
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Tu ne parles pas à un livreur, tu parles au patron. C'est lui qui gère la flotte et prend les décisions.
                </p>
              </div>

              {/* Nom complet du gérant */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Nom complet du gérant principal <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  placeholder="Ex: Alexandre Mbida"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* WhatsApp Gérant & Second Gérant / Dispatch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>WhatsApp personnel du gérant</span>
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={managerPhone}
                    onChange={(e) => setManagerPhone(e.target.value)}
                    placeholder="+237 699 82 41 05"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <p className="text-[10px] text-amber-300/80">Le numéro le plus important : contact direct du décideur.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-cyan-400" />
                    <span>WhatsApp second gérant / dispatch</span>
                    <span className="text-slate-500">(optionnel)</span>
                  </label>
                  <input
                    type="tel"
                    value={managerSecondaryPhone}
                    onChange={(e) => setManagerSecondaryPhone(e.target.value)}
                    placeholder="+237 675 30 19 82"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-500">Souvent le numéro du régulateur / répartiteur terrain.</p>
                </div>
              </div>

              {/* Email pro & Mot de passe */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Email professionnel</span>
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={managerEmail}
                    onChange={(e) => setManagerEmail(e.target.value)}
                    placeholder="direction@votre-societe.cm"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-[10px] text-slate-500">Pour la transmission automatique des factures et bilans.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Mot de passe d'accès</span>
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-500">Sécurise votre espace gérant.</p>
                </div>
              </div>

              {/* GÉRANTS SECONDAIRES / DISPATCHERS ADDITIONNELS */}
              <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Équipe de Gérance & Dispatchers</span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Le gérant principal peut ajouter d'autres gérants qui pourront ainsi se connecter et participer à la gestion.
                    </p>
                  </div>
                  {!showAddSecondary && (
                    <button
                      type="button"
                      onClick={() => setShowAddSecondary(true)}
                      className="px-2.5 py-1.5 bg-emerald-950 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-semibold flex items-center gap-1 hover:bg-emerald-900 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ajouter un gérant</span>
                    </button>
                  )}
                </div>

                {/* Form to add secondary manager */}
                {showAddSecondary && (
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-700 space-y-2 animate-in fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <input
                        type="text"
                        placeholder="Nom complet"
                        value={secName}
                        onChange={(e) => setSecName(e.target.value)}
                        className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />
                      <input
                        type="tel"
                        placeholder="Numéro WhatsApp"
                        value={secPhone}
                        onChange={(e) => setSecPhone(e.target.value)}
                        className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                      />
                      <input
                        type="email"
                        placeholder="Email (optionnel)"
                        value={secEmail}
                        onChange={(e) => setSecEmail(e.target.value)}
                        className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />
                      <select
                        value={secRole}
                        onChange={(e) => setSecRole(e.target.value)}
                        className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white cursor-pointer"
                      >
                        <option value="Gérant Adjoint">Gérant Adjoint</option>
                        <option value="Dispatch & Opérations">Dispatch & Opérations</option>
                        <option value="Responsable Flotte">Responsable Flotte</option>
                      </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddSecondary(false)}
                        className="px-3 py-1 text-slate-400 hover:text-white text-xs"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={handleAddSecondaryManager}
                        className="px-3 py-1 bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs"
                      >
                        Confirmer l'ajout
                      </button>
                    </div>
                  </div>
                )}

                {/* List of secondary managers */}
                {secondaryManagers.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {secondaryManagers.map((m, idx) => (
                      <div
                        key={idx}
                        className="p-2 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{m.name}</span>
                          <span className="text-slate-400 font-mono text-[11px]">({m.phone})</span>
                          <span className="px-1.5 py-0.2 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded text-[10px]">
                            {m.role}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSecondaryManager(idx)}
                          className="text-red-400 hover:text-red-300 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Navigation buttons */}
              <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Retour (Étape 1)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleReturnToSite}
                    className="px-3 py-2 bg-slate-800/60 hover:bg-slate-750 text-slate-400 hover:text-slate-200 rounded-xl text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer border border-slate-700/60"
                  >
                    <span>Retour au site</span>
                  </button>
                </div>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
                >
                  <span>Continuer (La Flotte)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* ÉTAPE 3 : LA FLOTTE                                      */}
          {/* ======================================================== */}
          {step === 3 && (
            <form onSubmit={handleNextStep3} className="space-y-4 animate-in fade-in">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Truck className="w-5 h-5 text-emerald-400" />
                  ÉTAPE 3 : LA FLOTTE
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  C'est ici que tu filtres les pros. Un vrai patron connaît sa capacité de livraison.
                </p>
              </div>

              {/* Nombre de livreurs actifs actuellement (de 3 à 50) */}
              <div className="space-y-1.5 p-3.5 bg-slate-900/60 border border-slate-800 rounded-2xl">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-200">
                    Nombre de livreurs actifs actuellement <span className="text-red-400">*</span>
                  </label>
                  <span className="font-mono text-base font-black text-emerald-400 px-3 py-1 bg-emerald-950/80 border border-emerald-500/40 rounded-xl">
                    {fleetSize} livreurs
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={fleetSize}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setFleetSize(val);
                    if (val < 3) {
                      setFleetError(
                        "⚠️ Attention : FLYT est réservé aux flottes d'au moins 3 livreurs. En dessous, votre dossier est mis en liste d'attente."
                      );
                    } else {
                      setFleetError('');
                    }
                  }}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>1 (Liste d'attente)</span>
                  <span>3 (Minimum requis)</span>
                  <span>15</span>
                  <span>30</span>
                  <span>50+</span>
                </div>

                {/* Fleet error / waiting list warning */}
                {fleetError && (
                  <div className="p-2.5 bg-amber-950/70 border border-amber-500/60 rounded-xl flex items-center gap-2 text-xs text-amber-200 animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{fleetError}</span>
                  </div>
                )}
              </div>

              {/* Types de véhicules (multi-choix) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Type de véhicules exploités <span className="text-red-400">*</span> (Plusieurs choix possibles)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'moto', label: 'Moto', icon: '🏍️' },
                    { id: 'tricycle', label: 'Tricycle', icon: '🛺' },
                    { id: 'voiture', label: 'Voiture / Van', icon: '🚗' },
                    { id: 'a_pied', label: 'À pied / Vélo', icon: '🚶' },
                  ].map((v) => {
                    const isSelected = selectedVehicles.includes(v.id as VehicleType);
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => toggleVehicle(v.id as VehicleType)}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                          isSelected
                            ? 'bg-emerald-950/70 border-emerald-500 text-white font-bold shadow-md shadow-emerald-950'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <span className="text-lg">{v.icon}</span>
                        <span className="text-xs">{v.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Zones que vous couvrez */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Zones de couverture / Quartiers <span className="text-red-400">*</span> (Sert pour le dispatch)
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-slate-900/60 rounded-xl border border-slate-800">
                  {PRESET_ZONES.map((z) => {
                    const isSelected = zonesCovered.includes(z);
                    return (
                      <button
                        key={z}
                        type="button"
                        onClick={() => handleToggleZone(z)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        {z}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  placeholder="Ajouter une autre zone (Appuyez sur Entrée)..."
                  value={customZoneInput}
                  onChange={(e) => setCustomZoneInput(e.target.value)}
                  onKeyDown={handleAddCustomZone}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Nombre moyen de livraisons par jour & Types de clients */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Nombre moyen de livraisons par jour <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={avgDeliveriesPerDay}
                    onChange={(e) => setAvgDeliveriesPerDay(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer font-mono"
                  >
                    <option value="10">10 colis / jour</option>
                    <option value="30">30 colis / jour</option>
                    <option value="50">50 colis / jour</option>
                    <option value="100+">100+ colis / jour</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Types de clients servis (Multi-choix)
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    {[
                      { id: 'boutiques_ecommerce', label: 'E-commerce' },
                      { id: 'restaurants', label: 'Restaurants' },
                      { id: 'entreprises', label: 'Entreprises' },
                      { id: 'particuliers', label: 'Particuliers' },
                    ].map((ct) => (
                      <button
                        key={ct.id}
                        type="button"
                        onClick={() => toggleClientType(ct.id as ClientType)}
                        className={`p-1.5 rounded-lg border text-center transition-colors cursor-pointer ${
                          clientTypes.includes(ct.id as ClientType)
                            ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold'
                            : 'bg-slate-900 border-slate-700 text-slate-400'
                        }`}
                      >
                        {ct.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Retour (Étape 2)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleReturnToSite}
                    className="px-3 py-2 bg-slate-800/60 hover:bg-slate-750 text-slate-400 hover:text-slate-200 rounded-xl text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer border border-slate-700/60"
                  >
                    <span>Retour au site</span>
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={fleetSize < 1}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Créer mon espace société</span>
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* ÉTAPE 4 : FÉLICITATIONS & ESPACE CRÉÉ                   */}
          {/* ======================================================== */}
          {step === 4 && createdCompany && (
            <div className="space-y-5 animate-in zoom-in-95 duration-200">
              {/* Félicitations Hero Banner */}
              <div className="p-5 bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-900 border-2 border-emerald-500/60 rounded-3xl text-center space-y-2 relative overflow-hidden shadow-2xl">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/40">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-white">
                  Félicitations, votre espace {createdCompany.name} est créé !
                </h3>
                <p className="text-xs text-emerald-300/90 max-w-md mx-auto">
                  Votre société est enregistrée avec succès dans la base de données cloud temps réel. Votre essai gratuit de 7 jours est actif.
                </p>
              </div>

              {/* OPTION 1 : LIEN D'INVITATION PARTAGEABLE (LE PLUS RAPIDE) */}
              <div className="p-4 bg-slate-900 border-2 border-emerald-500/40 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Share2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        Lien d'enregistrement direct pour vos livreurs
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Envoyez ce lien à vos livreurs par WhatsApp. Ils s'enregistrent en 30 secondes et atterrissent directement sur leur espace.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono font-bold">
                    Temps Réel
                  </span>
                </div>

                {/* The Shareable URL Box */}
                <div className="flex items-center gap-2 p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <input
                    type="text"
                    readOnly
                    value={getInviteLink()}
                    className="flex-1 bg-transparent text-xs text-emerald-300 font-mono focus:outline-none truncate"
                  />
                  <button
                    type="button"
                    onClick={handleCopyInviteLink}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      hasCopiedInviteLink
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                  >
                    {hasCopiedInviteLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{hasCopiedInviteLink ? 'Copié !' : 'Copier'}</span>
                  </button>
                </div>

                {/* Direct WhatsApp Action Button */}
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Bonjour, rejoins l'équipe de livraison de ${createdCompany.name} sur FLYT en t'enregistrant en 30s sur ce lien pour recevoir tes missions en direct : ${getInviteLink()}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 bg-[#25D366] hover:bg-[#20ba59] text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-slate-950" />
                  <span>Partager directement le lien sur WhatsApp</span>
                </a>
              </div>

              {/* OPTION 2 : AJOUT MANUEL D'UN LIVREUR */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold text-white">
                      Ou ajouter un livreur manuellement maintenant
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowManualDriverForm((prev) => !prev)}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer"
                  >
                    {showManualDriverForm ? 'Fermer le formulaire' : '+ Saisir manuellement'}
                  </button>
                </div>

                {manualDriverSuccess && (
                  <p className="text-xs text-emerald-400 font-semibold">{manualDriverSuccess}</p>
                )}

                {showManualDriverForm && (
                  <form onSubmit={handleAddManualDriver} className="space-y-3 pt-2 animate-in fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[11px] text-slate-300">Nom + Prénom du livreur</label>
                        <input
                          type="text"
                          required
                          value={manualDriverName}
                          onChange={(e) => setManualDriverName(e.target.value)}
                          placeholder="Ex: Eric Kamdem"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-300">Numéro WhatsApp</label>
                        <input
                          type="tel"
                          required
                          value={manualDriverPhone}
                          onChange={(e) => setManualDriverPhone(e.target.value)}
                          placeholder="+237 655 00 11 22"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <select
                        value={manualDriverVehicle}
                        onChange={(e) => setManualDriverVehicle(e.target.value as VehicleType)}
                        className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white cursor-pointer"
                      >
                        <option value="moto">Moto</option>
                        <option value="tricycle">Tricycle</option>
                        <option value="voiture">Voiture</option>
                        <option value="a_pied">À pied</option>
                      </select>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        Enregistrer le livreur
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Complete & Go to Manager Dashboard or Return to Site */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    onCompleted(createdCompany);
                    onClose();
                  }}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-2xl text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-500/25 active:scale-98 cursor-pointer"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Accéder au Bureau du Gérant ({createdCompany.name})</span>
                </button>
                <button
                  type="button"
                  onClick={handleReturnToSite}
                  className="w-full py-2.5 bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-700/80 active:scale-98"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Retourner vers le site vitrine</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
