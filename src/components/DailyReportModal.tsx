import React from 'react';
import { DailyReport } from '../types';
import { Moon, Award, MapPin, Store, CheckCircle, X, Download } from 'lucide-react';

interface DailyReportModalProps {
  report: DailyReport;
  isOpen: boolean;
  onClose: () => void;
}

export const DailyReportModal: React.FC<DailyReportModalProps> = ({
  report,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Rapport du Soir FLYT</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {report.generatedAt}
                </span>
              </div>
              <p className="text-xs text-slate-400 capitalize mt-0.5">{report.date}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl text-center">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
                Total Livraisons
              </span>
              <span className="font-mono text-xl font-black text-emerald-400 mt-1 block">
                {report.totalDeliveries}
              </span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl text-center">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
                Volume Financier
              </span>
              <span className="font-mono text-sm font-bold text-white mt-1.5 block">
                {report.totalVolumeFcfa.toLocaleString('fr-FR')} F
              </span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl text-center">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
                Zone N°1
              </span>
              <span className="font-mono text-sm font-bold text-cyan-400 mt-1.5 block truncate">
                {report.topZone}
              </span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl text-center">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
                Top Boutique
              </span>
              <span className="font-mono text-sm font-bold text-amber-400 mt-1.5 block truncate">
                {report.topBoutique.split(' ')[0]}
              </span>
            </div>
          </div>

          {/* Classement des Livreurs */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-amber-400" />
              Classement Performance des Livreurs
            </h4>

            {report.topDrivers.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">Aucune livraison effectuée ce jour.</p>
            ) : (
              <div className="space-y-2">
                {report.topDrivers.map((driver, idx) => (
                  <div
                    key={driver.driverId}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold text-[11px] ${
                          idx === 0
                            ? 'bg-amber-400 text-slate-950'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-950'
                            : idx === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-slate-200">{driver.driverName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-emerald-400">
                        {driver.count} {driver.count > 1 ? 'courses' : 'course'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Zones & Boutiques breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl flex items-start gap-3">
              <div className="p-2 rounded-lg bg-cyan-950/50 border border-cyan-800/40 text-cyan-400 shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Zone la plus demandée</span>
                <span className="font-bold text-white text-sm block mt-0.5">{report.topZone}</span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {report.topZoneCount} colis livrés dans cette zone aujourd'hui
                </span>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-950/50 border border-amber-800/40 text-amber-400 shrink-0">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Boutique Championne</span>
                <span className="font-bold text-white text-sm block mt-0.5">{report.topBoutique}</span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Partenaire ayant généré le plus de commandes
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <CheckCircle className="w-4 h-4" />
            <span>Rapport certifié et archivé dans FLYT DB</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Fermer le rapport
          </button>
        </div>
      </div>
    </div>
  );
};
