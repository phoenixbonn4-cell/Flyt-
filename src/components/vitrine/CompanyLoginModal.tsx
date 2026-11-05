import React, { useState, useEffect } from 'react';
import { Company } from '../../types';
import { 
  Building2, 
  X, 
  LogIn, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sparkles, 
  UserCheck, 
  ShieldCheck, 
  MapPin, 
  Search,
  RotateCcw
} from 'lucide-react';

interface CompanyLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: Company[];
  onLoginSuccess: (company: Company, rememberMe: boolean) => void;
  onOpenRegister: () => void;
}

export const CompanyLoginModal: React.FC<CompanyLoginModalProps> = ({
  isOpen,
  onClose,
  companies,
  onLoginSuccess,
  onOpenRegister,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successCompany, setSuccessCompany] = useState<Company | null>(null);

  // Quick switch tab: 'form' | 'list'
  const [viewMode, setViewMode] = useState<'form' | 'list'>('form');

  // Load remembered info from localStorage
  const [rememberedCompany, setRememberedCompany] = useState<Company | null>(null);

  useEffect(() => {
    try {
      const savedCompId = localStorage.getItem('flyt_remembered_company_id');
      const savedIdentifier = localStorage.getItem('flyt_remembered_identifier');
      if (savedIdentifier && !identifier) {
        setIdentifier(savedIdentifier);
      }
      if (savedCompId) {
        const found = companies.find((c) => c.id === savedCompId);
        if (found) {
          setRememberedCompany(found);
        }
      }
    } catch {
      // ignore
    }
  }, [companies, isOpen]);

  if (!isOpen) return null;

  // Helper to normalize phone / text for matching
  const normalizeString = (str: string) =>
    (str || '').toLowerCase().replace(/[\s\-_+()]/g, '');

  const handleForgetRemembered = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      localStorage.removeItem('flyt_remembered_company_id');
      localStorage.removeItem('flyt_remembered_identifier');
    } catch {
      // ignore
    }
    setRememberedCompany(null);
    setIdentifier('');
  };

  const handleDirectConnect = (targetCompany: Company) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessCompany(targetCompany);

    if (rememberMe) {
      try {
        localStorage.setItem('flyt_remembered_company_id', targetCompany.id);
        localStorage.setItem(
          'flyt_remembered_identifier',
          targetCompany.managerPhone || targetCompany.managerEmail || targetCompany.name
        );
      } catch {
        // ignore
      }
    } else {
      try {
        localStorage.removeItem('flyt_remembered_company_id');
        localStorage.removeItem('flyt_remembered_identifier');
      } catch {
        // ignore
      }
    }

    setTimeout(() => {
      onLoginSuccess(targetCompany, rememberMe);
      setIsSubmitting(false);
    }, 600);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const query = identifier.trim();
    if (!query) {
      setErrorMessage('Veuillez renseigner votre numéro de téléphone ou votre adresse email de gérant.');
      return;
    }

    const normQuery = normalizeString(query);

    // Search in companies
    const foundCompany = companies.find((c) => {
      const normPhone = normalizeString(c.managerPhone);
      const normSecPhone = normalizeString(c.managerSecondaryPhone || '');
      const normEmail = (c.managerEmail || '').toLowerCase();
      const normName = normalizeString(c.name);
      const normId = normalizeString(c.id);

      return (
        normPhone.includes(normQuery) ||
        normQuery.includes(normPhone) ||
        (normSecPhone && (normSecPhone.includes(normQuery) || normQuery.includes(normSecPhone))) ||
        normEmail === query.toLowerCase() ||
        normName === normQuery ||
        normId === normQuery
      );
    });

    if (!foundCompany) {
      setErrorMessage(
        `Aucune société de livraison trouvée pour "${query}". Vérifiez votre numéro/email ou enregistrez votre entreprise en 90 secondes.`
      );
      return;
    }

    // Check password if set on company
    if (foundCompany.password && foundCompany.password.trim().length > 0) {
      if (password && password.trim() !== foundCompany.password.trim()) {
        setErrorMessage('Mot de passe incorrect pour cette société. Veuillez réessayer.');
        return;
      }
    }

    handleDirectConnect(foundCompany);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-[#0D131F] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-6 text-slate-100 ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-inner shrink-0">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">Connexion Entreprise</h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  Espace Gérant
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Retrouvez instantanément votre flotte, vos boutiques et vos statistiques en temps réel.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Fermer la fenêtre"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* SUCCESS BANNER */}
          {successCompany && (
            <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs flex items-center gap-3 animate-in fade-in duration-300">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 font-black">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <strong className="block text-white text-sm font-bold">
                  Reconnexion réussie !
                </strong>
                <span>Chargement du Bureau Gérant pour <strong>{successCompany.name}</strong>...</span>
              </div>
            </div>
          )}

          {/* REMEMBERED COMPANY QUICK 1-CLICK RECONNECT CARD */}
          {!successCompany && rememberedCompany && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/40 border-2 border-emerald-500/50 shadow-xl space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                  <UserCheck className="w-4 h-4" />
                  <span>Session Mémorisée sur cet appareil</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
                </div>
                <button
                  type="button"
                  onClick={handleForgetRemembered}
                  className="text-[11px] text-slate-400 hover:text-red-300 transition-colors underline cursor-pointer"
                  title="Oublier cette société sur cet appareil"
                >
                  Oublier / Changer
                </button>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {rememberedCompany.logoUrl ? (
                    <img
                      src={rememberedCompany.logoUrl}
                      alt={rememberedCompany.name}
                      className="w-10 h-10 rounded-xl object-cover border border-emerald-500/40 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center font-black text-sm shrink-0">
                      {rememberedCompany.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="truncate">
                    <strong className="text-white block text-sm font-bold truncate">
                      {rememberedCompany.name}
                    </strong>
                    <span className="text-slate-400 text-xs block">
                      Gérant : {rememberedCompany.managerName} · {rememberedCompany.city}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDirectConnect(rememberedCompany)}
                  disabled={isSubmitting}
                  className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer shrink-0 disabled:opacity-50"
                >
                  <span>Reprendre en 1 Clic</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* VIEW TOGGLE TABS (Formulaire de saisie vs Liste des sociétés enregistrées) */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => {
                setViewMode('form');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 rounded-lg font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                viewMode === 'form'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Numéro WhatsApp / Email</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode('list');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 rounded-lg font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                viewMode === 'list'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Choisir parmi les sociétés ({companies.length})</span>
            </button>
          </div>

          {/* ERROR ALERT */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-500/50 text-xs text-red-200 flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed flex-1">
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* MODE 1: FORMULAIRE DE CONNEXION AVEC "SE RAPPELER DE MOI" */}
          {viewMode === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Identifiant Gérant */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Numéro WhatsApp, Email ou Nom de Société</span>
                  </span>
                  <span className="text-[10px] text-slate-500">Requis</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Ex: +237 655 42 10 99 ou contact@express.cm"
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  Le numéro ou l'email indiqué lors de l'enregistrement de votre entreprise.
                </p>
              </div>

              {/* Mot de passe / Code d'accès (optionnel) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Mot de passe</span>
                  </span>
                  <span className="text-[10px] text-slate-500">Optionnel si non défini</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Entrez votre mot de passe gérant"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* SE RAPPELER DE MOI CHECKBOX OPTION */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3 transition-colors hover:bg-slate-900/90">
                <input
                  type="checkbox"
                  id="rememberMeCheckbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 cursor-pointer accent-emerald-500"
                />
                <label htmlFor="rememberMeCheckbox" className="text-xs text-slate-300 cursor-pointer select-none leading-relaxed">
                  <strong className="text-white block font-semibold flex items-center gap-1.5">
                    <span>Se rappeler de moi sur cet appareil</span>
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  </strong>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Conserve votre session active en mémoire locale. Lors de vos prochaines visites sur le site, vous retrouverez votre espace gérant en un seul clic sans ressaisie.
                  </span>
                </label>
              </div>

              {/* BOUTON DE SOUMISSION */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-500/25 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Connexion en cours...' : 'Se Reconnecter à Mon Espace'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* MODE 2: LISTE RAPIDE DE TOUTES LES SOCIÉTÉS ENREGISTRÉES */}
          {viewMode === 'list' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Sélectionnez votre société pour vous reconnecter instantanément et restaurer toutes ses données de flotte :
              </p>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-800/60">
                {companies.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-500">
                    Aucune société n'est encore enregistrée sur la plateforme.
                  </div>
                ) : (
                  companies.map((comp) => (
                    <div
                      key={comp.id}
                      onClick={() => handleDirectConnect(comp)}
                      className="pt-2 pb-2 px-2.5 rounded-xl hover:bg-slate-800/60 transition-all flex items-center justify-between gap-3 cursor-pointer group border border-transparent hover:border-slate-700"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {comp.logoUrl ? (
                          <img
                            src={comp.logoUrl}
                            alt={comp.name}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-700 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-slate-800 text-emerald-400 border border-slate-700 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                            {comp.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="truncate">
                          <strong className="text-white block text-xs font-semibold group-hover:text-emerald-300 transition-colors truncate">
                            {comp.name}
                          </strong>
                          <span className="text-slate-400 text-[11px] block truncate">
                            Gérant : {comp.managerName} · {comp.city} ({comp.managerPhone})
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="px-2.5 py-1.5 bg-slate-800 group-hover:bg-emerald-500 group-hover:text-slate-950 text-slate-300 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1 shadow-sm"
                      >
                        <span>Choisir</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* FOOTER : INSCRIPTION NOUVELLE ENTREPRISE */}
          <div className="pt-3 border-t border-slate-800 text-center space-y-2">
            <p className="text-xs text-slate-400">
              Votre entreprise n'est pas encore enregistrée sur FLYT ?
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenRegister();
              }}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:underline transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>Inscrire une nouvelle société (90s Chrono)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
