import React, { useState } from 'react';
import { Boutique, Company, Order } from '../../types';
import { FlytStorage } from '../../services/storage';
import { 
  Store, 
  Send, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  Package, 
  MapPin, 
  Phone, 
  User, 
  Coins, 
  Sparkles, 
  ExternalLink,
  Clock,
  History
} from 'lucide-react';

interface BoutiquePortalProps {
  boutique: Boutique;
  company: Company;
  boutiqueOrders: Order[];
  onOrderCreated: (order: Order) => void;
  onNavigateToTracking: (token: string) => void;
}

export const BoutiquePortal: React.FC<BoutiquePortalProps> = ({
  boutique,
  company,
  boutiqueOrders,
  onOrderCreated,
  onNavigateToTracking,
}) => {
  // Form fields
  const [senderName, setSenderName] = useState(boutique.name);
  const [senderPhone, setSenderPhone] = useState(boutique.phone);
  const [pickupQuartier, setPickupQuartier] = useState(boutique.quartier);

  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [deliveryQuartier, setDeliveryQuartier] = useState('Bastos');
  const [deliveryAddressDetails, setDeliveryAddressDetails] = useState('');

  const [parcelType, setParcelType] = useState('');
  const [amountToCollect, setAmountToCollect] = useState<number>(0);
  const [parcelPhoto, setParcelPhoto] = useState<string>('');
  
  const [validationError, setValidationError] = useState<string>('');
  const [justCreatedOrder, setJustCreatedOrder] = useState<Order | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // Rule: recipient name & phone must be different from sender
    if (recipientName.trim().toLowerCase() === senderName.trim().toLowerCase()) {
      setValidationError("Le nom du destinataire doit être différent de celui de l'expéditeur.");
      return;
    }
    if (recipientPhone.trim().replace(/\s+/g, '') === senderPhone.trim().replace(/\s+/g, '')) {
      setValidationError("Le numéro de téléphone du destinataire doit être différent de celui de l'expéditeur.");
      return;
    }
    if (!deliveryQuartier.trim()) {
      setValidationError("Veuillez spécifier le quartier de livraison.");
      return;
    }

    const created = FlytStorage.createOrder({
      companyId: company.id,
      boutiqueId: boutique.id,
      boutiqueName: boutique.name,
      isThirdParty: boutique.isThirdParty,
      senderName,
      senderPhone,
      pickupQuartier,
      recipientName,
      recipientPhone,
      deliveryQuartier,
      deliveryAddressDetails: deliveryAddressDetails || undefined,
      parcelType: parcelType || 'Colis express',
      amountToCollect: Number(amountToCollect) || 0,
      deliveryFee: 1500,
      parcelPhotoUrl: parcelPhoto || undefined,
    });

    setJustCreatedOrder(created);
    onOrderCreated(created);

    // Reset recipient details
    setRecipientName('');
    setRecipientPhone('');
    setParcelType('');
    setAmountToCollect(0);
    setParcelPhoto('');
  };

  const commonQuartiers = [
    'Bastos',
    'Mokolo',
    'Omnisports',
    'Biyem-Assi',
    'Centre-ville',
    'Mendong',
    'Nlongkak',
    'Essos',
    'Mimboman',
    'Ngousso',
    'Tsinga',
    'Mvan',
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Brand & Boutique Context Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold shrink-0">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-black text-white">{boutique.name}</h1>
              {boutique.isThirdParty ? (
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Lien Public Réseaux Sociaux
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Espace Partenaire Pro
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Service assuré en direct par <strong className="text-emerald-400">{company.name}</strong> · Yaoundé
            </p>
          </div>
        </div>

        <div className="text-right text-xs">
          <span className="text-slate-400 block text-[11px]">Lien privé actif :</span>
          <span className="font-mono text-emerald-400 font-medium">
            livraison.express-yaounde.com/{boutique.slug}
          </span>
        </div>
      </div>

      {/* Success Notification Alert */}
      {justCreatedOrder && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/60 rounded-xl shadow-xl flex items-center justify-between gap-4 text-xs text-emerald-200 animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-white">
                Commande {justCreatedOrder.orderNumber} transmise avec succès !
              </p>
              <p className="text-[11px] text-emerald-300 mt-0.5">
                Elle est apparue instantanément dans le Bureau du Gérant ({company.name}) dans la colonne "À assigner".
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToTracking(justCreatedOrder.trackingToken)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold shrink-0 flex items-center gap-1 transition-colors"
          >
            <span>Suivre ce colis</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Grid: Order Form + Real-time Live History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Container */}
        <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-400" />
                Formulaire d'Expédition Immédiate
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                0 erreur d'adresse. Un coursier moto est automatiquement alerté.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              Étape 1/1 · Instantané
            </span>
          </div>

          {validationError && (
            <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* EXPÉDITEUR */}
            <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                1. Expéditeur (Lieu de ramassage)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Nom de l'expéditeur *
                  </label>
                  <input
                    type="text"
                    required
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Numéro de téléphone expéditeur *
                  </label>
                  <input
                    type="tel"
                    required
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-300 mb-1">
                    Quartier de ramassage du colis *
                  </label>
                  <input
                    type="text"
                    required
                    value={pickupQuartier}
                    onChange={(e) => setPickupQuartier(e.target.value)}
                    placeholder="Ex: Mokolo Marché, Boutique 42"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* DESTINATAIRE */}
            <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                2. Destinataire (Client Final)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Nom complet du destinataire *
                  </label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Ex: M. Paul Atangana"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500">Doit être différent de l'expéditeur</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Téléphone destinataire (WhatsApp) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="Ex: +237 698 12 34 56"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500">Recevra le lien de suivi SMS/WhatsApp</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Quartier de livraison *
                  </label>
                  <select
                    value={deliveryQuartier}
                    onChange={(e) => setDeliveryQuartier(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-emerald-500"
                  >
                    {commonQuartiers.map((q) => (
                      <option key={q} value={q}>
                        {q}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Repère précis (Maison, barrière, carrefour)
                  </label>
                  <input
                    type="text"
                    value={deliveryAddressDetails}
                    onChange={(e) => setDeliveryAddressDetails(e.target.value)}
                    placeholder="Ex: Face Ambassade USA, portail noir"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* COLIS & FINANCES */}
            <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                3. Données du Colis & Montant à Encaisser (COD)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Description du colis *
                  </label>
                  <input
                    type="text"
                    required
                    value={parcelType}
                    onChange={(e) => setParcelType(e.target.value)}
                    placeholder="Ex: Robe en soie + Chaussures ou Plat chaud"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Montant à verser / encaisser à la livraison (FCFA)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={amountToCollect}
                    onChange={(e) => setAmountToCollect(Number(e.target.value))}
                    placeholder="0 si déjà réglé par le client"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-emerald-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-500">Le livreur encaissera ce montant en espèces</span>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-300 mb-1">
                    Photo du colis (recommandé pour vérification rapide)
                  </label>
                  <div className="p-3 border border-dashed border-slate-700 rounded-lg flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-[11px] text-slate-400">
                      <span>Prendre ou importer une photo du paquet</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => setParcelPhoto(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:bg-slate-800 file:text-emerald-400 hover:file:bg-slate-700 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-all text-xs"
            >
              <Send className="w-4 h-4" />
              <span>Envoyer la commande au Bureau du Gérant</span>
            </button>
          </form>
        </div>

        {/* Live Orders Feed of This Boutique */}
        <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-white text-xs uppercase tracking-wider">
                Vos Commandes en Direct
              </h3>
            </div>
            <span className="font-mono text-xs font-bold text-slate-400">
              {boutiqueOrders.length} colis
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3">
            {boutiqueOrders.length === 0 ? (
              <div className="py-20 text-center text-slate-500 text-xs">
                Aucune commande enregistrée pour l'instant. Remplissez le formulaire à gauche pour expédier votre premier colis !
              </div>
            ) : (
              boutiqueOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-3.5 bg-slate-800/60 border border-slate-800 rounded-xl space-y-2 text-xs hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-white">{ord.orderNumber}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                        ord.status === 'delivered'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : ord.status === 'in_progress'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {ord.status === 'delivered'
                        ? 'Livré & Signé'
                        : ord.status === 'in_progress'
                        ? 'En cours'
                        : 'À assigner'}
                    </span>
                  </div>

                  <div className="text-slate-200 font-semibold truncate">
                    {ord.parcelType}
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Vers : <strong className="text-slate-300">{ord.deliveryQuartier}</strong></span>
                    {ord.amountToCollect > 0 && (
                      <span className="font-mono text-amber-300 font-bold">
                        {ord.amountToCollect.toLocaleString('fr-FR')} F
                      </span>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-mono">
                      {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      onClick={() => onNavigateToTracking(ord.trackingToken)}
                      className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                    >
                      <span>Lien Suivi Client</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
