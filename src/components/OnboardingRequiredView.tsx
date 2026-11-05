import React from 'react';
import { Building2, Sparkles, Truck, ShieldCheck, ArrowRight, ArrowLeft, UserCheck, CheckCircle2 } from 'lucide-react';
import { FlytLogo } from './FlytLogo';

interface OnboardingRequiredViewProps {
  onStartRegistration: () => void;
  onReturnToVitrine?: () => void;
}

export const OnboardingRequiredView: React.FC<OnboardingRequiredViewProps> = ({
  onStartRegistration,
  onReturnToVitrine,
}) => {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8 animate-in fade-in duration-300">
      {/* Top Banner Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#0B132B] to-emerald-950/60 border-2 border-emerald-500/40 p-8 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 justify-between">
            <div className="flex items-center gap-3">
              <FlytLogo size="lg" showTagline={false} />
            </div>
            <div className="flex items-center gap-2">
              {onReturnToVitrine && (
                <button
                  onClick={onReturnToVitrine}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Retour au site</span>
                </button>
              )}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wide uppercase">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" style={{ animationDuration: '4s' }} />
                <span>Inscription Préalable</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Bienvenue sur FLYT Delivery Suite
            </h1>
            <p className="text-base sm:text-lg text-emerald-300/90 font-medium">
              Chaque société de livraison doit d'abord s'inscrire avant d'utiliser l'application.
            </p>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Toutes les données précédentes ont été réinitialisées. Configurez votre propre entreprise en 
              <span className="font-bold text-white"> 4 étapes rapides (90 secondes chrono) </span> 
              pour activer votre tableau de bord gérant, vos portails boutiques et l'application livreur.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <button
              onClick={onStartRegistration}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-base rounded-2xl shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-98 transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              <Building2 className="w-5 h-5" />
              <span>Inscrire ma Société Maintenant (90s)</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            {onReturnToVitrine && (
              <button
                onClick={onReturnToVitrine}
                className="w-full sm:w-auto px-6 py-4 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-sm rounded-2xl border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98"
              >
                <ArrowLeft className="w-4 h-4 text-emerald-400" />
                <span>Retourner vers le site</span>
              </button>
            )}
            <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-slate-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Gratuit 7 jours d'essai · Sans carte bancaire</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Steps Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
            1
          </div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
            Identité de l'Entreprise
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Renseignez le nom officiel de votre structure, votre ville principale (Yaoundé, Douala, etc.) et vos coordonnées de facturation.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
            2
          </div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            Gérant & Dispatchers
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Définissez votre compte responsable avec numéro WhatsApp pour la réception instantanée des alertes et rapports d'activité.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
            3
          </div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Truck className="w-4 h-4 text-emerald-400" />
            Flotte & Zones de Livraison
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Spécifiez le type de véhicules (motos, tricycles) et les quartiers couverts par vos livreurs pour le dispatch intelligent.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
            4
          </div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Lien Recrutement & Live Sync
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Obtenez votre lien d'invitation livreurs WhatsApp à partager à votre équipe et accédez instantanément à votre Bureau Gérant.
          </p>
        </div>
      </div>
    </div>
  );
};
