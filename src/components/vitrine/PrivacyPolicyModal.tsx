import React from 'react';
import { X, ShieldCheck, Lock, EyeOff, UserCheck, Mail, Database, MapPin } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in">
      <div 
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-[#0B101D] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-[#090D16]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Politique de Confidentialité</h2>
              <p className="text-xs text-slate-400">Protection des données personnelles & engagements FLYT Suite</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-300 text-sm leading-relaxed">
          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 flex items-start gap-3">
            <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-200/90 leading-relaxed">
              <strong>Engagement de Confidentialité :</strong> FLYT Delivery Suite (opéré par Phoenix Technologies) s'engage formellement à respecter la vie privée de ses utilisateurs, entreprises clientes, livreurs partenaires et destinataires finaux. Aucune donnée personnelle n'est vendue, louée ou cédée à des tiers à des fins publicitaires.
            </div>
          </div>

          {/* Section 1 */}
          <section className="space-y-2">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              1. Données collectées et finalités
            </h3>
            <p className="text-xs text-slate-400">
              Dans le cadre de l’exploitation des services de dispatch et de livraison, FLYT collecte strictement les informations nécessaires à l'accomplissement des missions :
            </p>
            <ul className="list-disc list-inside text-xs text-slate-300 space-y-1.5 pl-2">
              <li><strong className="text-white">Données de l'entreprise :</strong> Nom de la société, ville d’opération, email professionnel, numéros de téléphone du gérant et des coordinateurs logistiques.</li>
              <li><strong className="text-white">Données des boutiques partenaires :</strong> Dénomination commerciale, quartier de localisation, numéro de contact pour l'enlèvement des colis.</li>
              <li><strong className="text-white">Données des livreurs & coursiers :</strong> Nom complet, numéro de téléphone WhatsApp, type de véhicule (moto, tricycle, voiture, etc.), statut de disponibilité en temps réel.</li>
              <li><strong className="text-white">Données de livraison destinataire :</strong> Nom ou pseudonyme du client destinataire, adresse ou quartier de livraison, numéro de téléphone pour notification WhatsApp/appel de livraison, montant à encaisser (Cash On Delivery).</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-2">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              2. Géolocalisation en temps réel & Respect de la vie privée
            </h3>
            <p className="text-xs text-slate-400">
              La géolocalisation des livreurs est activée uniquement lorsque le coursier indique être en service (« En ligne » ou « En mission »). Cette donnée permet :
            </p>
            <ul className="list-disc list-inside text-xs text-slate-300 space-y-1.5 pl-2">
              <li>L’attribution intelligente de la course au livreur le plus proche afin de minimiser les temps de trajet.</li>
              <li>L'affichage de l'estimation d'arrivée (ETA) sur la page de suivi public sécurisée dédiée au destinataire.</li>
              <li>La géolocalisation cesse immédiatement dès que le coursier passe en statut « Hors-ligne » ou à la clôture de sa journée.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-2">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-emerald-400" />
              3. Chiffrement et Sécurité du Stockage
            </h3>
            <p className="text-xs text-slate-400">
              Toutes les données transitent via des protocoles sécurisés et chiffrés (HTTPS / TLS 1.3). Les bases de données sont hébergées sur l'infrastructure Cloud certifiée ISO 27001 et SOC 2 de Google Cloud Platform (Firestore), garantissant une haute résilience, des sauvegardes automatiques et une isolation stricte entre entreprises.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-2">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              4. Vos Droits (Accès, Rectification, Suppression)
            </h3>
            <p className="text-xs text-slate-400">
              Conformément aux réglementations internationales en matière de protection des données (RGPD et lois applicables relatives aux données personnelles), chaque utilisateur ou entreprise dispose des droits suivants :
            </p>
            <ul className="list-disc list-inside text-xs text-slate-300 space-y-1.5 pl-2">
              <li><strong className="text-white">Droit d'accès :</strong> Obtenir une copie intégrale des données vous concernant.</li>
              <li><strong className="text-white">Droit de rectification :</strong> Modifier toute information inexacte ou obsolète depuis votre tableau de bord.</li>
              <li><strong className="text-white">Droit à l'effacement :</strong> Demander la purge définitive et irréversible de l'ensemble de votre compte entreprise et des historiques associés.</li>
            </ul>
          </section>

          {/* Section 5: Contact DPO */}
          <section className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-400" />
              5. Contact du Délégué à la Protection des Données (DPO)
            </h3>
            <p className="text-xs text-slate-400">
              Pour exercer vos droits ou pour toute question relative au traitement de vos données personnelles, veuillez contacter directement notre équipe dédiée à l'adresse suivante :
            </p>
            <div className="pt-1">
              <a
                href="mailto:phoenixbonn4@gmail.com?subject=Confidentialité - FLYT Delivery Suite"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-mono font-medium transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                phoenixbonn4@gmail.com
              </a>
            </div>
            <p className="text-[11px] text-slate-400">
              Dernière mise à jour : 24 Septembre 2026. Entité responsable : Phoenix Technologies.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-[#090D16] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
