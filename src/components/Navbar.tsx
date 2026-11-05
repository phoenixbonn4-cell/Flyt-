import React from 'react';
import { AppRole, Company } from '../types';
import { FlytLogo } from './FlytLogo';
import { Bell, ShieldCheck, Wifi, UserPlus, RotateCcw, Bike, Building2, AlertCircle, Globe, ArrowLeft } from 'lucide-react';

interface NavbarProps {
  currentRole: AppRole;
  onSelectRole: (role: AppRole) => void;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
  onOpenOnboarding: () => void;
  onOpenDriverRegister?: () => void;
  onResetAllData?: () => void;
  isOnline: boolean;
  activeCompany?: Company | null;
  companiesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onSelectRole,
  unreadNotificationsCount,
  onOpenNotifications,
  onOpenOnboarding,
  onOpenDriverRegister,
  onResetAllData,
  isOnline,
  activeCompany,
  companiesCount,
}) => {
  const handleConfirmReset = () => {
    if (
      window.confirm(
        '⚠️ CONFIRMATION : Voulez-vous supprimer toutes les données actuelles (sociétés, commandes, livreurs, historiques) ? Chaque société devra à nouveau s’inscrire.'
      )
    ) {
      onResetAllData?.();
    }
  };

  const handleRoleClick = (role: AppRole) => {
    if (companiesCount === 0 && role !== 'admin') {
      onOpenOnboarding();
      return;
    }
    onSelectRole(role);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#090D16]/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single Brand element + Company State */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <FlytLogo size="md" showTagline={false} />

          {/* Quick mobile Return to Site button */}
          <button
            onClick={() => onSelectRole('vitrine')}
            className="flex lg:hidden items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-sm"
            title="Retourner vers le site vitrine"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span>Site</span>
          </button>

          {activeCompany ? (
            <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-bold text-white truncate max-w-[150px]">{activeCompany.name}</span>
              <span className="text-[10px] text-slate-400">({activeCompany.city})</span>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Inscription requise</span>
            </div>
          )}
        </div>

        {/* Zone 2: 4-6 clean text navigation links (Vitrine + 4 Blocs + Super Admin) */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800/60">
          <button
            onClick={() => onSelectRole('vitrine')}
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700 text-emerald-300 hover:text-white border border-emerald-500/30 shadow-sm cursor-pointer active:scale-95"
            title="Retourner vers le site vitrine officiel de l'application"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span>Retour vers le site</span>
          </button>

          <button
            onClick={() => handleRoleClick('gerant')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              currentRole === 'gerant' && activeCompany
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            1. Bureau Gérant
          </button>

          <button
            onClick={() => handleRoleClick('boutique')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              currentRole === 'boutique' && activeCompany
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            2. Bureau Boutiques
          </button>

          <button
            onClick={() => handleRoleClick('livreur')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              currentRole === 'livreur' && activeCompany
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            3. App Livreur
          </button>

          <button
            onClick={() => handleRoleClick('client')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              currentRole === 'client' && activeCompany
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            4. Suivi Client
          </button>

          <button
            onClick={() => onSelectRole('admin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
              currentRole === 'admin'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-sm'
                : 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-950/20'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin Phoenix
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2.5">
          {/* Offline indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg">
            <Wifi className={`w-3.5 h-3.5 ${isOnline ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`} />
            <span className="font-mono">{isOnline ? 'Live Sync' : 'Hors-ligne'}</span>
          </div>

          {/* Inscription Société CTA */}
          <button
            onClick={onOpenOnboarding}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all active:scale-95 whitespace-nowrap cursor-pointer ${
              companiesCount === 0
                ? 'text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 hover:from-emerald-300 hover:to-teal-300 ring-2 ring-emerald-400/50 shadow-lg shadow-emerald-500/25 animate-pulse'
                : 'text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-md shadow-emerald-500/20'
            }`}
            title="Inscrire une société de livraison (4 étapes en 90s)"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{companiesCount === 0 ? 'Inscrire ma Société (90s)' : 'Inscrire Société'}</span>
          </button>

          {/* Livreur Join link shortcut */}
          {activeCompany && onOpenDriverRegister && (
            <button
              onClick={onOpenDriverRegister}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700 hover:text-white border border-slate-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              title="Tester la page d'inscription livreur via lien d'invitation"
            >
              <Bike className="w-3.5 h-3.5 text-emerald-400" />
              <span>Lien Livreur</span>
            </button>
          )}

          {/* Reset All Data Button */}
          {onResetAllData && (
            <button
              onClick={handleConfirmReset}
              className="hidden xl:flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 rounded-lg transition-colors cursor-pointer"
              title="Supprimer toutes les données actuelles pour repartir de zéro"
            >
              <RotateCcw className="w-3 h-3 text-rose-400" />
              <span>Remise à zéro</span>
            </button>
          )}

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
            title="Centre de notifications push"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-slate-950 text-[10px] font-bold rounded-full flex items-center justify-center font-mono shadow-[0_0_8px_rgba(16,185,129,0.8)]">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile role switcher */}
      <div className="lg:hidden flex items-center overflow-x-auto px-4 py-2 bg-slate-950 border-t border-slate-800/60 gap-1.5 text-xs scrollbar-none">
        <button
          onClick={() => onSelectRole('vitrine')}
          className="px-2.5 py-1.5 rounded-lg whitespace-nowrap font-bold flex items-center gap-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 shadow-sm shrink-0 active:scale-95 cursor-pointer"
          title="Retourner vers le site vitrine"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
          <span>Retour au site</span>
        </button>
        <button
          onClick={() => handleRoleClick('gerant')}
          className={`px-2.5 py-1 rounded-md whitespace-nowrap font-medium ${
            currentRole === 'gerant' && activeCompany ? 'bg-emerald-600 text-white' : 'text-slate-400'
          }`}
        >
          1. Gérant
        </button>
        <button
          onClick={() => handleRoleClick('boutique')}
          className={`px-2.5 py-1 rounded-md whitespace-nowrap font-medium ${
            currentRole === 'boutique' && activeCompany ? 'bg-emerald-600 text-white' : 'text-slate-400'
          }`}
        >
          2. Boutiques
        </button>
        <button
          onClick={() => handleRoleClick('livreur')}
          className={`px-2.5 py-1 rounded-md whitespace-nowrap font-medium ${
            currentRole === 'livreur' && activeCompany ? 'bg-emerald-600 text-white' : 'text-slate-400'
          }`}
        >
          3. Livreur
        </button>
        <button
          onClick={() => handleRoleClick('client')}
          className={`px-2.5 py-1 rounded-md whitespace-nowrap font-medium ${
            currentRole === 'client' && activeCompany ? 'bg-emerald-600 text-white' : 'text-slate-400'
          }`}
        >
          4. Suivi Client
        </button>
        <button
          onClick={() => onSelectRole('admin')}
          className={`px-2.5 py-1 rounded-md whitespace-nowrap font-medium ${
            currentRole === 'admin' ? 'bg-amber-600 text-white' : 'text-amber-400'
          }`}
        >
          Admin Phoenix
        </button>
      </div>
    </header>
  );
};
