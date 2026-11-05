import React, { useState } from 'react';
import { Driver, VehicleType, Company } from '../types';
import { FlytStorage } from '../services/storage';
import { saveDriverToFirestore } from '../services/firebase';
import { Bike, Phone, User, MapPin, CheckCircle2, ArrowRight, ArrowLeft, X, ShieldCheck } from 'lucide-react';
import { FlytLogo } from './FlytLogo';

interface DriverRegistrationModalProps {
  isOpen: boolean;
  company: Company;
  onClose: () => void;
  onRegistered: (driver: Driver) => void;
  onReturnToVitrine?: () => void;
}

export const DriverRegistrationModal: React.FC<DriverRegistrationModalProps> = ({
  isOpen,
  company,
  onClose,
  onRegistered,
  onReturnToVitrine,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+237 6');
  const [vehicleType, setVehicleType] = useState<VehicleType>('moto');
  const [quartier, setQuartier] = useState(company.zonesCovered?.[0] || 'Bastos');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Veuillez renseigner votre Nom et Prénom.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 8) {
      setErrorMsg('Veuillez renseigner un numéro WhatsApp valide.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const newDriverId = `drv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newDriver: Driver = {
      id: newDriverId,
      companyId: company.id,
      name: name.trim(),
      phone: phone.trim(),
      vehicleType,
      status: 'available',
      currentZone: quartier,
      currentLat: 3.8667,
      currentLng: 11.5167,
      todayDeliveries: 0,
      weekDeliveries: 0,
      monthDeliveries: 0,
      totalEarningsFcfa: 0,
      rating: 5.0,
    };

    // Save in local storage and in Firestore in real-time
    FlytStorage.saveDriver(newDriver);
    await saveDriverToFirestore(newDriver).catch(() => {});

    // Notify the manager in real-time
    FlytStorage.addNotification({
      companyId: company.id,
      title: `Nouveau livreur connecté !`,
      message: `${newDriver.name} (${newDriver.phone}) vient de s'enregistrer via votre lien et est prêt pour ses missions.`,
      type: 'admin_announcement',
      targetRole: 'gerant',
    });

    setIsSubmitting(false);
    onRegistered(newDriver);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-[#0F172A] border-2 border-emerald-500/50 rounded-3xl shadow-2xl overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Company Branding */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border-b border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
              <Bike className="w-6 h-6" />
            </div>
            <div className="truncate">
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
                Rejoindre la flotte
              </span>
              <h3 className="text-sm font-black text-white truncate">{company.name}</h3>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {onReturnToVitrine && (
              <button
                type="button"
                onClick={onReturnToVitrine}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
                title="Retourner vers le site vitrine"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Retour au site</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content & Simple Registration Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <h4 className="text-base font-bold text-white">Enregistrement Livreur</h4>
            <p className="text-xs text-slate-400">
              Remplissez vos coordonnées ci-dessous pour être activé instantanément et commencer à recevoir des courses.
            </p>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-red-950/70 border border-red-500/60 rounded-xl text-xs text-red-300">
              {errorMsg}
            </div>
          )}

          {/* Nom + Prénom */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>Nom + Prénom</span>
              <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Eric Kamdem"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Numéro WhatsApp */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Numéro de téléphone WhatsApp</span>
              <span className="text-red-400">*</span>
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+237 655 42 10 99"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
            />
            <p className="text-[10px] text-slate-400">
              Sert au gérant et aux clients pour vous contacter en cours de livraison.
            </p>
          </div>

          {/* Type de véhicule & Quartier */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Bike className="w-3.5 h-3.5 text-emerald-400" />
                <span>Véhicule</span>
              </label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="moto">Moto</option>
                <option value="tricycle">Tricycle</option>
                <option value="voiture">Voiture</option>
                <option value="a_pied">À pied</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zone habituelle</span>
              </label>
              <input
                type="text"
                value={quartier}
                onChange={(e) => setQuartier(e.target.value)}
                placeholder="Ex: Bastos"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-500/25 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Enregistrement en cours...' : "S'enregistrer et commencer"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            {onReturnToVitrine && (
              <button
                type="button"
                onClick={onReturnToVitrine}
                className="w-full py-2 bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-700/80 active:scale-98"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
                <span>Retourner au site vitrine</span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 text-center pt-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Accès sécurisé · Sauvegarde automatique en temps réel</span>
          </div>
        </form>
      </div>
    </div>
  );
};
