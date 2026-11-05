import React from 'react';
import { PushNotification } from '../types';
import { FlytStorage } from '../services/storage';
import { Bell, CheckCheck, ExternalLink, ShieldAlert, Sparkles, Truck, Package, X } from 'lucide-react';

interface NotificationCenterProps {
  notifications: PushNotification[];
  isOpen: boolean;
  onClose: () => void;
  onOpenInvoiceModal?: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  isOpen,
  onClose,
  onOpenInvoiceModal,
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    FlytStorage.markAllNotificationsAsRead();
  };

  const requestBrowserPermission = async () => {
    if ('Notification' in window) {
      const res = await Notification.requestPermission();
      if (res === 'granted') {
        new Notification('FLYT Push Activé', {
          body: 'Vous recevrez les alertes de commandes et de facturation en direct.',
        });
      }
    }
  };

  const getIcon = (type: PushNotification['type']) => {
    switch (type) {
      case 'order_new':
        return <Package className="w-4 h-4 text-cyan-400" />;
      case 'order_assigned':
      case 'order_delivered':
        return <Truck className="w-4 h-4 text-emerald-400" />;
      case 'invoice_due':
      case 'alert':
      case 'incident_alert':
        return <ShieldAlert className="w-4 h-4 text-amber-400" />;
      case 'payment_verified':
        return <Sparkles className="w-4 h-4 text-emerald-300" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-[#0F172A] border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-400" />
            <h2 className="font-semibold text-slate-100 text-sm tracking-wide">
              Centre de Notifications & Alertes Push
            </h2>
            {unreadCount > 0 && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {unreadCount} new
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Browser Push Permission CTA */}
        {typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted' && (
          <div className="p-3 bg-gradient-to-r from-emerald-950/40 to-slate-900 border-b border-emerald-900/40 flex items-center justify-between">
            <div className="text-xs text-slate-300">
              <span className="font-medium text-emerald-400">Activer les alertes push :</span> Soyez notifié instantanément à chaque course.
            </div>
            <button
              onClick={requestBrowserPermission}
              className="text-xs px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium whitespace-nowrap transition-colors"
            >
              Autoriser
            </button>
          </div>
        )}

        {/* Actions bar */}
        <div className="px-4 py-2 bg-slate-900/30 border-b border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <span>{notifications.length} notifications</span>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 hover:text-emerald-400 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Tout marquer comme lu
            </button>
          )}
        </div>

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
          {notifications.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              Aucune notification pour le moment.
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => FlytStorage.markNotificationAsRead(notif.id)}
                className={`p-4 transition-colors cursor-pointer ${
                  notif.read ? 'bg-transparent hover:bg-slate-800/20' : 'bg-slate-800/40 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-2 rounded-lg bg-slate-800 border border-slate-700/60 shrink-0">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-semibold text-slate-200 truncate">
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {notif.message}
                    </p>

                    {/* Specific Action Link for Invoice or Tracking */}
                    {notif.type === 'invoice_due' && (
                      <div className="mt-2.5 flex items-center gap-2">
                        {onOpenInvoiceModal && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenInvoiceModal();
                              onClose();
                            }}
                            className="text-[11px] px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded hover:bg-amber-500/30 transition-colors inline-flex items-center gap-1 font-medium"
                          >
                            Régler la facture (48h)
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                        <a
                          href="https://link.saspay.me/gw53q9tcu4m"
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[11px] px-2.5 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded hover:text-white transition-colors"
                        >
                          Lien SasPay direct
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
