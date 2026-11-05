import React, { useState } from 'react';
import { 
  X, 
  LifeBuoy, 
  PenTool, 
  BatteryWarning, 
  AlertTriangle, 
  PhoneOff, 
  WifiOff, 
  Camera, 
  Send, 
  CheckCircle2, 
  Moon, 
  Sun, 
  Share2, 
  Phone, 
  MessageSquare, 
  ShieldAlert, 
  HelpCircle,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Zap
} from 'lucide-react';
import { Driver, Order } from '../../types';
import { FlytStorage } from '../../services/storage';
import { playMissionAlert } from '../../services/sound';

interface LivreurHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeOrder: Order | null;
  currentDriver: Driver;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onSharePosition: () => void;
  onPreFillDeliveryNotes: (noteText: string) => void;
  onTriggerPhotoCapture?: () => void;
}

type IncidentCategory = 
  | 'Panne mécanique moto / vélo'
  | 'Colis endommagé ou détérioré'
  | 'Client absent / Injoignable'
  | 'Intempéries / Route barrée'
  | 'Accident / Sécurité'
  | 'Autre imprévu';

export const LivreurHelpModal: React.FC<LivreurHelpModalProps> = ({
  isOpen,
  onClose,
  activeOrder,
  currentDriver,
  isDarkMode,
  onToggleTheme,
  onSharePosition,
  onPreFillDeliveryNotes,
  onTriggerPhotoCapture,
}) => {
  // Category filter
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'signature' | 'battery' | 'incident' | 'contact'>('all');

  // Expanded card tracking
  const [expandedCard, setExpandedCard] = useState<string | null>('signature');

  // Incident form state
  const [incidentCategory, setIncidentCategory] = useState<IncidentCategory>('Panne mécanique moto / vélo');
  const [incidentDetails, setIncidentDetails] = useState('');
  const [isSubmittingIncident, setIsSubmittingIncident] = useState(false);
  const [incidentSubmittedReport, setIncidentSubmittedReport] = useState<string | null>(null);

  // Success message after prefill
  const [prefillFeedback, setPrefillFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleExpand = (cardId: string) => {
    setExpandedCard((prev) => (prev === cardId ? null : cardId));
  };

  // Handle reporting an incident
  const handleReportIncident = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingIncident(true);

    try {
      playMissionAlert();

      const timeString = new Date().toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const orderContext = activeOrder
        ? `sur la Course #${activeOrder.orderNumber} (${activeOrder.deliveryQuartier})`
        : 'pendant sa tournée';

      const alertTitle = `🚨 ALERTE INCIDENT : ${incidentCategory}`;
      const alertMessage = `Le livreur ${currentDriver.name} (${currentDriver.phone}) signale : "${incidentCategory}" ${orderContext} à ${timeString}. Note : ${incidentDetails.trim() || 'Aucun détail supplémentaire'}`;

      // Save notification in FlytStorage
      FlytStorage.addNotification({
        title: alertTitle,
        message: alertMessage,
        type: 'alert',
      });

      // Dispatch global window event for live listeners
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('flyt_incident_reported', {
            detail: {
              driver: currentDriver,
              category: incidentCategory,
              details: incidentDetails,
              activeOrder,
              timestamp: new Date().toISOString(),
            },
          })
        );
      }

      setIncidentSubmittedReport(
        `Signalement "${incidentCategory}" transmis avec succès au Dispatcher & Gérant à ${timeString}.`
      );
      setIncidentDetails('');
    } catch {
      // ignore
    } finally {
      setIsSubmittingIncident(false);
    }
  };

  // Handle client unable to sign prefill
  const handleApplyUnableToSignNote = () => {
    const note = `[DÉROGATION SIGNATURE] Remis en main propre ou à tiers mandataire. Client dans l'incapacité physique de signer l'écran au moment de la livraison. Preuve visuelle photographiée certifiée. (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
    onPreFillDeliveryNotes(note);
    setPrefillFeedback('Note officielle ajoutée dans votre formulaire de course !');
    setTimeout(() => {
      setPrefillFeedback(null);
    }, 3500);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Slide-Up Bottom Sheet Modal Container */}
      <div
        className={`w-full max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col transform transition-all duration-300 ease-out animate-in slide-in-from-bottom border ${
          isDarkMode
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Pull Bar (Mobile Friendly Slide Indicator) */}
        <div className="pt-3 pb-1 flex justify-center">
          <div className="w-12 h-1.5 bg-slate-500/40 rounded-full" />
        </div>

        {/* Modal Header */}
        <div className={`px-5 py-3 border-b flex items-center justify-between ${
          isDarkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-100 bg-slate-50/80'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm tracking-tight">
                  Centre d'Assistance & Dépannage
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Terrain
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Livreur : <strong className="text-emerald-400">{currentDriver.name}</strong> • Guides d'urgence & solutions immédiates
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isDarkMode
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
            }`}
            title="Fermer la fenêtre d'assistance"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Category Filter Pills */}
        <div className={`px-4 py-2.5 border-b flex items-center gap-1.5 overflow-x-auto text-[11px] font-bold scrollbar-none ${
          isDarkMode ? 'border-slate-800 bg-slate-950/40' : 'border-slate-100 bg-slate-100/60'
        }`}>
          <button
            type="button"
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              selectedFilter === 'all'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tous les cas
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('signature')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedFilter === 'signature'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <PenTool className="w-3 h-3" />
            <span>Client incapable de signer</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('battery')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedFilter === 'battery'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <BatteryWarning className="w-3.5 h-3.5" />
            <span>Batterie faible</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('incident')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedFilter === 'incident'
                ? 'bg-rose-500 text-white font-black shadow-sm'
                : isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Signaler incident</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('contact')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedFilter === 'contact'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <PhoneOff className="w-3 h-3" />
            <span>Client injoignable</span>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {prefillFeedback && (
            <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{prefillFeedback}</span>
            </div>
          )}

          {/* CARD 1: COMMENT SIGNER SI LE CLIENT NE PEUT PAS */}
          {(selectedFilter === 'all' || selectedFilter === 'signature') && (
            <div
              className={`rounded-2xl border transition-all overflow-hidden ${
                isDarkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div
                onClick={() => toggleExpand('signature')}
                className="p-4 flex items-center justify-between cursor-pointer hover:opacity-90 select-none"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                    <PenTool className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black flex items-center gap-2">
                      <span>Comment signer si le client ne peut pas ?</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-cyan-500/10 text-cyan-400 rounded border border-cyan-500/20 font-normal">
                        Procédure
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Mains prises, motif d'hygiène, tiers mandataire ou handicap
                    </p>
                  </div>
                </div>
                <div className="text-slate-400">
                  {expandedCard === 'signature' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>

              {expandedCard === 'signature' && (
                <div className={`px-4 pb-4 pt-1 text-xs space-y-3 border-t ${
                  isDarkMode ? 'border-slate-800/80 text-slate-300' : 'border-slate-200/80 text-slate-700'
                }`}>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </span>
                      <p>
                        <strong>Signature par un tiers de confiance :</strong> Un collègue, conjoint, gardien ou réceptionniste peut signer l'écran tactile à sa place.
                      </p>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </span>
                      <p>
                        <strong>Preuve photo obligatoire :</strong> Photographiez impérativement le colis posé sur la table ou remis au client avec le bouton caméra FLYT.
                      </p>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </span>
                      <p>
                        <strong>Note formelle de dérogation :</strong> Indiquez la raison dans les notes de livraison pour dégager votre responsabilité en cas de litige.
                      </p>
                    </div>
                  </div>

                  {/* Quick Interactive Actions */}
                  <div className="pt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleApplyUnableToSignNote}
                      className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Insérer note "Client incapable de signer"</span>
                    </button>

                    {onTriggerPhotoCapture && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onTriggerPhotoCapture();
                        }}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Prendre photo de preuve</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CARD 2: QUE FAIRE SI LA BATTERIE EST FAIBLE */}
          {(selectedFilter === 'all' || selectedFilter === 'battery') && (
            <div
              className={`rounded-2xl border transition-all overflow-hidden ${
                isDarkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div
                onClick={() => toggleExpand('battery')}
                className="p-4 flex items-center justify-between cursor-pointer hover:opacity-90 select-none"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <BatteryWarning className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black flex items-center gap-2">
                      <span>Que faire en cas de batterie faible (&lt; 15%) ?</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/10 text-amber-400 rounded border border-amber-500/20 font-normal">
                        Énergie
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Mesures d'urgence pour sécuriser votre tournée avant extinction
                    </p>
                  </div>
                </div>
                <div className="text-slate-400">
                  {expandedCard === 'battery' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>

              {expandedCard === 'battery' && (
                <div className={`px-4 pb-4 pt-1 text-xs space-y-3 border-t ${
                  isDarkMode ? 'border-slate-800/80 text-slate-300' : 'border-slate-200/80 text-slate-700'
                }`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className={`p-2.5 rounded-xl border ${
                      isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                    }`}>
                      <div className="flex items-center gap-1.5 font-bold text-amber-400 mb-1">
                        <Moon className="w-3.5 h-3.5" />
                        <span>1. Mode Sombre immédiat</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Diminue la consommation de la dalle écran OLED jusqu'à 40%.
                      </p>
                    </div>

                    <div className={`p-2.5 rounded-xl border ${
                      isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                    }`}>
                      <div className="flex items-center gap-1.5 font-bold text-emerald-400 mb-1">
                        <Zap className="w-3.5 h-3.5" />
                        <span>2. Mode Hors-Ligne FLYT</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Vous pouvez désactiver les données 4G : FLYT stocke vos livraisons localement.
                      </p>
                    </div>

                    <div className={`p-2.5 rounded-xl border ${
                      isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                    }`}>
                      <div className="flex items-center gap-1.5 font-bold text-cyan-400 mb-1">
                        <Share2 className="w-3.5 h-3.5" />
                        <span>3. Partage GPS en avance</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Envoyez votre lien de position au client dès maintenant pour qu'il vous voie arriver.
                      </p>
                    </div>

                    <div className={`p-2.5 rounded-xl border ${
                      isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                    }`}>
                      <div className="flex items-center gap-1.5 font-bold text-rose-400 mb-1">
                        <Phone className="w-3.5 h-3.5" />
                        <span>4. Noter le contact client</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {activeOrder ? (
                          <span>Tél : <strong>{activeOrder.recipientPhone}</strong> ({activeOrder.deliveryQuartier})</span>
                        ) : (
                          <span>Relevez les numéros des clients avant que le téléphone s'éteigne.</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Battery Quick Actions */}
                  <div className="pt-1 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={onToggleTheme}
                      className={`px-3 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isDarkMode
                          ? 'bg-slate-800 text-amber-300 border border-slate-700 hover:bg-slate-750'
                          : 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                      }`}
                    >
                      {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                      <span>{isDarkMode ? 'Mode Sombre actif (OLED)' : 'Activer Mode Sombre'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSharePosition();
                      }}
                      className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Partager position GPS maintenant</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CARD 3: SIGNALER UN INCIDENT (REPORT INCIDENT) */}
          {(selectedFilter === 'all' || selectedFilter === 'incident') && (
            <div
              className={`rounded-2xl border transition-all overflow-hidden ${
                isDarkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div
                onClick={() => toggleExpand('incident')}
                className="p-4 flex items-center justify-between cursor-pointer hover:opacity-90 select-none"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black flex items-center gap-2">
                      <span>Signaler un incident sur le terrain</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-rose-500/10 text-rose-400 rounded border border-rose-500/20 font-normal">
                        Urgence
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Panne moto, colis endommagé, intempéries ou accident
                    </p>
                  </div>
                </div>
                <div className="text-slate-400">
                  {expandedCard === 'incident' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>

              {expandedCard === 'incident' && (
                <div className={`px-4 pb-4 pt-1 text-xs space-y-3.5 border-t ${
                  isDarkMode ? 'border-slate-800/80 text-slate-300' : 'border-slate-200/80 text-slate-700'
                }`}>
                  {incidentSubmittedReport ? (
                    <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Alerte enregistrée & transmise</span>
                      </div>
                      <p className="text-[11px] opacity-90">{incidentSubmittedReport}</p>
                      <button
                        type="button"
                        onClick={() => setIncidentSubmittedReport(null)}
                        className="text-[10px] font-bold text-emerald-400 underline hover:text-emerald-300"
                      >
                        Signaler un autre problème
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleReportIncident} className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1.5">
                          Type d'imprévu / Incident :
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                          {(
                            [
                              'Panne mécanique moto / vélo',
                              'Colis endommagé ou détérioré',
                              'Client absent / Injoignable',
                              'Intempéries / Route barrée',
                              'Accident / Sécurité',
                              'Autre imprévu',
                            ] as IncidentCategory[]
                          ).map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setIncidentCategory(cat)}
                              className={`p-2 rounded-xl text-[10px] font-bold text-left border transition-all cursor-pointer ${
                                incidentCategory === cat
                                  ? 'bg-rose-500 text-white border-rose-400 shadow-md font-black'
                                  : isDarkMode
                                  ? 'bg-slate-900 hover:bg-slate-850 text-slate-300 border-slate-800'
                                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>

                      {activeOrder && (
                        <div className={`p-2 rounded-xl border text-[11px] flex items-center justify-between ${
                          isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                        }`}>
                          <span>Course active liée :</span>
                          <span className="font-mono font-bold text-amber-400">
                            #{activeOrder.orderNumber} ({activeOrder.deliveryQuartier})
                          </span>
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          Précisions / Localisation exacte :
                        </label>
                        <textarea
                          value={incidentDetails}
                          onChange={(e) => setIncidentDetails(e.target.value)}
                          placeholder="Ex: Pneu crevé vers le carrefour Bastos, besoin d'un livreur relais ou d'un délai supplémentaire..."
                          rows={2}
                          className={`w-full px-3 py-2 rounded-xl text-xs border outline-none focus:ring-1 focus:ring-rose-500 resize-none ${
                            isDarkMode
                              ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500'
                              : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                          }`}
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="submit"
                          disabled={isSubmittingIncident}
                          className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-rose-900/40 transition-all cursor-pointer active:scale-95"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Envoyer le signalement au Dispatch</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Hotline buttons */}
                  <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center gap-2">
                    <a
                      href="tel:+237694887766"
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Appeler la base logistique</span>
                    </a>

                    <a
                      href={`https://wa.me/237694887766?text=${encodeURIComponent(
                        `URGENCE LIVREUR ${currentDriver.name} : Signalement incident sur le terrain.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 font-bold text-[11px] flex items-center gap-1.5 transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                      <span>WhatsApp Dispatch</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CARD 4: CLIENT ABSENT OU INJOIGNABLE */}
          {(selectedFilter === 'all' || selectedFilter === 'contact') && (
            <div
              className={`rounded-2xl border transition-all overflow-hidden ${
                isDarkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div
                onClick={() => toggleExpand('contact')}
                className="p-4 flex items-center justify-between cursor-pointer hover:opacity-90 select-none"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">
                    <PhoneOff className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black flex items-center gap-2">
                      <span>Client absent ou injoignable</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-violet-500/10 text-violet-400 rounded border border-violet-500/20 font-normal">
                        Protocole
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Règle des 3 appels et temps d'attente maximum
                    </p>
                  </div>
                </div>
                <div className="text-slate-400">
                  {expandedCard === 'contact' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>

              {expandedCard === 'contact' && (
                <div className={`px-4 pb-4 pt-1 text-xs space-y-3 border-t ${
                  isDarkMode ? 'border-slate-800/80 text-slate-300' : 'border-slate-200/80 text-slate-700'
                }`}>
                  <ul className="space-y-1.5 text-slate-400 list-disc pl-4">
                    <li>
                      <strong className="text-slate-200">1. Trois tentatives d'appel</strong> espacées de 2 minutes.
                    </li>
                    <li>
                      <strong className="text-slate-200">2. Envoi d'un message WhatsApp</strong> signalant votre présence devant le repère.
                    </li>
                    <li>
                      <strong className="text-slate-200">3. Attente maximale de 10 minutes</strong>. Au-delà, prévenez le gérant de la boutique partenaire pour replanifier la livraison.
                    </li>
                  </ul>

                  {activeOrder && (
                    <div className="pt-1 flex flex-wrap gap-2">
                      <a
                        href={`tel:${activeOrder.recipientPhone}`}
                        className="px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-sm"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Appeler {activeOrder.recipientName}</span>
                      </a>
                      <a
                        href={`https://wa.me/${activeOrder.recipientPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                          `Bonjour ${activeOrder.recipientName}, je suis votre livreur FLYT pour votre colis #${activeOrder.orderNumber}. Je suis actuellement à votre adresse (${activeOrder.deliveryQuartier}).`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp Client</span>
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* CARD 5: PERTE DE CONNEXION INTERNET */}
          {(selectedFilter === 'all' || selectedFilter === 'battery') && (
            <div
              className={`rounded-2xl border transition-all overflow-hidden ${
                isDarkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div
                onClick={() => toggleExpand('network')}
                className="p-4 flex items-center justify-between cursor-pointer hover:opacity-90 select-none"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <WifiOff className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black flex items-center gap-2">
                      <span>Zone blanche / Perte de signal Internet</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20 font-normal">
                        Offline Ready
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Le moteur hors-ligne FLYT protège 100% de vos saisies
                    </p>
                  </div>
                </div>
                <div className="text-slate-400">
                  {expandedCard === 'network' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>

              {expandedCard === 'network' && (
                <div className={`px-4 pb-4 pt-1 text-xs space-y-2.5 border-t ${
                  isDarkMode ? 'border-slate-800/80 text-slate-300' : 'border-slate-200/80 text-slate-700'
                }`}>
                  <p className="text-slate-300">
                    Même sans réseau, continuez normalement votre livraison : faites signer le client et prenez la photo de preuve.
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    FLYT place automatiquement la livraison dans la file d'attente sécurisée locale. Dès que vous retrouvez la 3G/4G, le bouton <span className="font-bold text-amber-400 font-mono">Sync</span> dans l'en-tête synchronise tout en un clic !
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className={`px-5 py-3.5 border-t flex items-center justify-between text-xs ${
          isDarkMode ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Support dispatch 7j/7 : 08h - 22h</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer active:scale-95 shadow-md"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
