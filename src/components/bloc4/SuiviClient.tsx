import React, { useState } from 'react';
import { Order, Company, Driver } from '../../types';
import { FlytStorage } from '../../services/storage';
import { 
  Package, 
  Bike, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  Clock, 
  Search, 
  ShieldCheck, 
  MessageCircle, 
  Store, 
  Sparkles,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { FlytLogo } from '../FlytLogo';

interface SuiviClientProps {
  initialToken?: string;
  orders: Order[];
  company: Company;
}

export const SuiviClient: React.FC<SuiviClientProps> = ({
  initialToken = 'TRK-BASTOS-99',
  orders,
  company,
}) => {
  const [tokenInput, setTokenInput] = useState(initialToken);
  const [activeToken, setActiveToken] = useState(initialToken);

  const selectedOrder = orders.find(
    (o) =>
      o.trackingToken.toUpperCase() === activeToken.trim().toUpperCase() ||
      o.orderNumber.toUpperCase() === activeToken.trim().toUpperCase()
  ) || orders[0];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenInput.trim()) {
      setActiveToken(tokenInput.trim());
    }
  };

  const driver = selectedOrder?.driverId
    ? FlytStorage.getDriverById(selectedOrder.driverId)
    : undefined;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Brand & Search Topbar */}
      <div className="bg-[#0B132B] border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <FlytLogo size="md" showTagline={false} />
          <div className="h-6 w-px bg-slate-800" />
          <div>
            <h1 className="text-sm font-bold text-white">Portail Suivi Colis en Direct</h1>
            <p className="text-[11px] text-slate-400">
              Assuré par <strong className="text-emerald-400">{company.name}</strong>
            </p>
          </div>
        </div>

        {/* Tracking Token Search Form */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Ex: TRK-BASTOS-99"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white uppercase font-mono tracking-wider focus:outline-hidden focus:border-emerald-500 w-44 sm:w-52"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Suivre
          </button>
        </form>
      </div>

      {/* Quick Token Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto text-[11px] text-slate-400 py-1">
        <span className="shrink-0 font-medium">Exemples récents :</span>
        {orders.slice(0, 4).map((o) => (
          <button
            key={o.id}
            onClick={() => {
              setTokenInput(o.trackingToken);
              setActiveToken(o.trackingToken);
            }}
            className={`px-2.5 py-1 rounded-md font-mono shrink-0 transition-colors ${
              activeToken === o.trackingToken
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-900 border border-slate-800 hover:text-white'
            }`}
          >
            {o.trackingToken} ({o.recipientName.split(' ')[0]})
          </button>
        ))}
      </div>

      {!selectedOrder ? (
        <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-2xl text-slate-400 text-xs">
          Numéro de suivi introuvable. Veuillez vérifier votre code de suivi reçu par SMS.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Status Hero Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <span className="text-[11px] uppercase font-bold text-slate-400 block tracking-wider">
                  Colis N° <span className="font-mono text-emerald-400">{selectedOrder.orderNumber}</span>
                </span>
                <h2 className="text-xl font-black text-white mt-0.5">{selectedOrder.parcelType}</h2>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Expédié par : <strong className="text-slate-200">{selectedOrder.boutiqueName}</strong></span>
                </p>
              </div>

              {/* Status Badge */}
              <div className="text-right">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-xs uppercase tracking-wider ${
                    selectedOrder.status === 'delivered'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                      : selectedOrder.status === 'in_progress'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.3)] animate-pulse'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-current" />
                  {selectedOrder.status === 'delivered'
                    ? 'Colis Livré'
                    : selectedOrder.status === 'in_progress'
                    ? 'En route vers vous'
                    : 'En cours de préparation'}
                </span>
                {selectedOrder.deliveredAt && (
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">
                    Livré à {selectedOrder.signatureTimestamp || '14h32'} par {selectedOrder.driverName}
                  </p>
                )}
              </div>
            </div>

            {/* Stepper Progress Bar */}
            <div className="mt-6 pt-2">
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                {[
                  { label: 'Reçu', done: true, sub: 'Boutique' },
                  { label: 'Assigné', done: Boolean(selectedOrder.driverId), sub: 'Dispatch' },
                  { label: 'En Moto', done: selectedOrder.status === 'in_progress' || selectedOrder.status === 'delivered', sub: 'En route' },
                  { label: 'Livré & Signé', done: selectedOrder.status === 'delivered', sub: selectedOrder.signatureTimestamp || 'Sur place' },
                ].map((step, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        step.done
                          ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                          : 'bg-slate-800'
                      }`}
                    />
                    <span className={`font-bold block text-[11px] ${step.done ? 'text-white' : 'text-slate-600'}`}>
                      {step.label}
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate">
                      {step.sub}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Livreur Card - Le Service qui rassure */}
          {driver ? (
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg">
                  <Bike className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-base">{driver.name}</h3>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      ★ {driver.rating}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Votre coursier dédié · Véhicule : <strong className="text-slate-200 capitalize">{driver.vehicleType}</strong>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {driver.todayDeliveries} livraisons certifiées aujourd'hui
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`tel:${driver.phone}`}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-950"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Appeler ({driver.phone})</span>
                </a>
                <a
                  href={`https://wa.me/${driver.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl border border-slate-700"
                  title="WhatsApp Livreur"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs text-slate-400">
              Un coursier est en train d'être assigné par le bureau du dispatch.
            </div>
          )}

          {/* Interactive Live Map Simulation of Driver Moving */}
          <div className="bg-[#050811] border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                Trajectoire en direct vers votre adresse : {selectedOrder.deliveryQuartier}
              </span>
              <span className="font-mono text-cyan-400 text-[11px] animate-pulse">
                GPS Connecté
              </span>
            </div>

            {/* Visual Simulated Route Card */}
            <div className="relative h-44 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 flex items-center justify-between px-8 overflow-hidden">
              {/* Route line */}
              <div className="absolute left-16 right-16 top-1/2 -translate-y-1/2 h-1 bg-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-1000"
                  style={{
                    width: selectedOrder.status === 'delivered' ? '100%' : '65%',
                  }}
                />
              </div>

              {/* Point A : Ramassage */}
              <div className="relative z-10 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs mx-auto shadow-md">
                  A
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block font-medium">
                  {selectedOrder.pickupQuartier}
                </span>
              </div>

              {/* Moto en transit */}
              <div
                className="relative z-10 text-center transition-all duration-1000"
                style={{
                  transform: selectedOrder.status === 'delivered' ? 'translateX(70px)' : 'none',
                }}
              >
                <div className="w-12 h-12 rounded-2xl bg-cyan-500 text-slate-950 flex items-center justify-center font-bold text-xs mx-auto shadow-lg shadow-cyan-500/50 animate-bounce">
                  <Bike className="w-6 h-6" />
                </div>
                <span className="text-[10px] text-cyan-300 font-mono font-bold mt-1 block">
                  {driver ? driver.name.split(' ')[0] : 'Moto'}
                </span>
              </div>

              {/* Point B : Votre domicile */}
              <div className="relative z-10 text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-500 border-2 border-emerald-400 flex items-center justify-center text-slate-950 font-black text-xs mx-auto shadow-lg shadow-emerald-500/40">
                  B
                </div>
                <span className="text-[10px] text-emerald-300 mt-1 block font-bold">
                  {selectedOrder.deliveryQuartier}
                </span>
              </div>
            </div>

            {/* Live GPS Telemetry Beacon from Driver */}
            {driver && selectedOrder.status === 'in_progress' && (
              <div className="p-3 bg-slate-900/90 border border-cyan-500/40 rounded-2xl flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-80" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
                  </span>
                  <div>
                    <span className="text-[11px] text-cyan-400 font-bold block">
                      Position GPS en temps réel partagée par {driver.name}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      Coordonnées : {driver.currentLat?.toFixed(4) || '3.8824'}° N, {driver.currentLng?.toFixed(4) || '11.5126'}° E · Zone : {driver.currentZone}
                    </span>
                  </div>
                </div>
                <span className="font-mono font-bold text-cyan-300 text-[11px] bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                  ETA : ~7 min
                </span>
              </div>
            )}

            {selectedOrder.amountToCollect > 0 && (
              <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs text-amber-200">
                <span>Montant à régler au livreur à l'arrivée (espèces) :</span>
                <span className="font-mono text-sm font-black text-amber-300">
                  {selectedOrder.amountToCollect.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            )}
          </div>

          {/* Proof Certificate if Delivered */}
          {selectedOrder.clientSignatureUrl && (
            <div className="p-5 bg-emerald-950/30 border border-emerald-500/40 rounded-3xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>Preuve de Livraison Certifiée avec Signature Électronique</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] block">Signature enregistrée :</span>
                  <span className="text-white font-medium">Reçu par {selectedOrder.recipientName}</span>
                </div>
                <span className="font-mono text-emerald-400 font-bold">
                  {selectedOrder.signatureTimestamp || '14h32'}
                </span>
              </div>

              {/* Photo du colis remis */}
              {selectedOrder.proofDeliveryPhotoUrl && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedOrder.proofDeliveryPhotoUrl}
                      alt="Preuve photo"
                      className="w-12 h-12 rounded-lg object-cover border border-emerald-500/40"
                    />
                    <div>
                      <span className="text-white font-medium block">Photo du colis réceptionné</span>
                      <span className="text-[10px] text-slate-400">Prise en direct par le livreur</span>
                    </div>
                  </div>
                  <span className="text-emerald-400 font-bold text-[10px] bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                    Photo Certifiée
                  </span>
                </div>
              )}

              {/* Note du coursier / instructions livraison */}
              {selectedOrder.deliveryNotes && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Note du livreur :
                  </span>
                  <p className="text-emerald-300 font-medium italic bg-emerald-950/30 px-2.5 py-1.5 rounded-lg border border-emerald-500/30">
                    « {selectedOrder.deliveryNotes} »
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
