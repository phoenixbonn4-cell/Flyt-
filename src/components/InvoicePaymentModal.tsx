import React, { useState } from 'react';
import { AdminInvoice, Company } from '../types';
import { FlytStorage } from '../services/storage';
import { 
  CreditCard, 
  ExternalLink, 
  Upload, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  FileText, 
  Check, 
  X,
  Sparkles
} from 'lucide-react';

interface InvoicePaymentModalProps {
  invoice: AdminInvoice;
  company: Company;
  isOpen: boolean;
  onClose: () => void;
  onProofSubmitted?: () => void;
}

export const InvoicePaymentModal: React.FC<InvoicePaymentModalProps> = ({
  invoice,
  company,
  isOpen,
  onClose,
  onProofSubmitted,
}) => {
  const [proofPreview, setProofPreview] = useState<string>(invoice.proofFileUrl || '');
  const [proofFileName, setProofFileName] = useState<string>(invoice.proofFileName || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitProof = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofPreview) return;
    setIsSubmitting(true);

    FlytStorage.submitPaymentProof(invoice.id, proofPreview, proofFileName);
    setIsSubmitting(false);
    setShowSuccessToast(true);
    onProofSubmitted?.();

    setTimeout(() => {
      setShowSuccessToast(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-amber-950/40 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Facturation Mensuelle FLYT</h3>
              <p className="text-[11px] text-slate-400">Période : {invoice.month}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Status banner */}
          <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-xs text-amber-200">
            <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Délai de règlement 48h :</strong> Veuillez régler votre facture via le lien sécurisé SasPay ci-dessous puis téléverser votre reçu sous peine de suspension de votre accès logiciel.
            </div>
          </div>

          {/* Breakdown Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2.5">
            <div className="flex justify-between items-center text-xs text-slate-300">
              <span>Abonnement mensuel fixe plateforme FLYT</span>
              <span className="font-mono font-semibold text-white">
                {invoice.baseFee.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-300">
              <span>
                Livraisons validées sur le mois ({invoice.validatedDeliveriesCount} × 100 FCFA)
              </span>
              <span className="font-mono font-semibold text-white">
                {(invoice.validatedDeliveriesCount * invoice.perDeliveryFee).toLocaleString('fr-FR')} FCFA
              </span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-bold text-emerald-400">
              <span>Total à régler</span>
              <span className="font-mono text-base font-extrabold text-emerald-300">
                {invoice.totalAmount.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
          </div>

          {/* SasPay Payment Link button */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              1. Régler via la passerelle officielle SasPay :
            </label>
            <a
              href={invoice.paymentLink}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950 hover:scale-[1.01]"
            >
              <span>Ouvrir SasPay ({invoice.totalAmount.toLocaleString('fr-FR')} FCFA)</span>
              <ExternalLink className="w-4 h-4" />
            </a>
            <span className="text-[10px] text-slate-500 mt-1 block text-center">
              Paiement sécurisé par MTN Mobile Money, Orange Money, Wave ou Carte Bancaire
            </span>
          </div>

          {/* Proof upload form */}
          <form onSubmit={handleSubmitProof} className="space-y-3 pt-2 border-t border-slate-800">
            <label className="block text-xs font-semibold text-slate-300">
              2. Téléverser la preuve de paiement (Capture d'écran ou reçu) *
            </label>

            <div className="p-3.5 border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-xl flex items-center gap-3 transition-colors bg-slate-900/40">
              <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                <Upload className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 text-xs">
                <p className="text-slate-300 font-medium truncate">
                  {proofFileName || 'Preuve de paiement (Image ou PDF)'}
                </p>
                <p className="text-[10px] text-slate-500">
                  Sera transmise à phoenixbonn4@gmail.com pour validation immédiate
                </p>
              </div>
              <input
                type="file"
                accept="image/*,application/pdf"
                required={!proofPreview}
                onChange={handleFileUpload}
                className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[11px] file:bg-slate-800 file:text-emerald-400 hover:file:bg-slate-700 cursor-pointer"
              />
            </div>

            {proofPreview && (
              <div className="p-2 bg-slate-900 rounded-lg flex items-center gap-2 text-xs text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Preuve prête à l'envoi : {proofFileName || 'Reçu chargé'}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!proofPreview || isSubmitting}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                proofPreview
                  ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 shadow-md'
                  : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <span>Envoi en cours...</span>
              ) : invoice.status === 'proof_submitted' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Preuve déjà transmise (En attente de validation Phoenix)</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Transmettre la preuve de paiement à l'Administrateur</span>
                </>
              )}
            </button>
          </form>

          {showSuccessToast && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
              <Sparkles className="w-4 h-4" />
              <span>Preuve transmise avec succès ! L'administrateur Phoenix valide votre accès.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
