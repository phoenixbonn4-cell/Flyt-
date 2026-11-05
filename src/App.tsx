import React, { useState, useEffect } from 'react';
import { AppRole, Company, Driver, Boutique, Order, AdminInvoice, PushNotification } from './types';
import { FlytStorage } from './services/storage';
import { subscribeCompanies, subscribeDrivers, subscribeOrders } from './services/firebase';
import { Navbar } from './components/Navbar';
import { OfflineBanner } from './components/OfflineBanner';
import { NotificationCenter } from './components/NotificationCenter';
import { CompanyRegistrationModal } from './components/CompanyRegistrationModal';
import { DriverRegistrationModal } from './components/DriverRegistrationModal';
import { OnboardingRequiredView } from './components/OnboardingRequiredView';
import { GerantDashboard } from './components/bloc1/GerantDashboard';
import { BoutiquePortal } from './components/bloc2/BoutiquePortal';
import { LivreurApp } from './components/bloc3/LivreurApp';
import { SuiviClient } from './components/bloc4/SuiviClient';
import { SuperAdminDashboard } from './components/admin/SuperAdminDashboard';
import { MissionAlertBanner } from './components/MissionAlertBanner';
import { SiteVitrine } from './components/vitrine/SiteVitrine';
import { Bike, Building2 } from 'lucide-react';

export default function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Storage synced state
  const [companies, setCompanies] = useState<Company[]>(() => FlytStorage.getCompanies());
  const [drivers, setDrivers] = useState<Driver[]>(() => FlytStorage.getDrivers());
  const [boutiques, setBoutiques] = useState<Boutique[]>(() => FlytStorage.getBoutiques());
  const [orders, setOrders] = useState<Order[]>(() => FlytStorage.getOrders());
  const [invoices, setInvoices] = useState<AdminInvoice[]>(() => FlytStorage.getInvoices());
  const [notifications, setNotifications] = useState<PushNotification[]>(() => FlytStorage.getNotifications());

  // Current active role/view: defaults to 'vitrine' if no company exists or url requested
  const [currentRole, setCurrentRole] = useState<AppRole>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      if (viewParam === 'app') return 'gerant';
      if (viewParam === 'vitrine') return 'vitrine';
      const roleParam = params.get('role') as AppRole;
      if (roleParam && ['vitrine', 'gerant', 'boutique', 'livreur', 'client', 'admin'].includes(roleParam)) {
        return roleParam;
      }
    } catch {
      // ignore
    }
    const hasCompanies = FlytStorage.getCompanies().length > 0;
    return hasCompanies ? 'gerant' : 'vitrine';
  });

  // Current selections
  const [currentCompanyId, setCurrentCompanyId] = useState<string>(() => {
    try {
      const remembered = localStorage.getItem('flyt_remembered_company_id');
      if (remembered) return remembered;
    } catch {
      // ignore
    }
    return companies[0]?.id || '';
  });
  const [currentDriverId, setCurrentDriverId] = useState<string>(drivers[0]?.id || '');
  const [currentBoutiqueSlug, setCurrentBoutiqueSlug] = useState<string>(boutiques[0]?.slug || '');
  const [currentTrackingToken, setCurrentTrackingToken] = useState<string>('TRK-BASTOS-99');

  // Modals & Panels: If no company exists and trying to use app dashboard, onboarding modal opens
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [isDriverInviteModalOpen, setIsDriverInviteModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Sync state from storage
  const reloadStateFromStorage = () => {
    const loadedCompanies = FlytStorage.getCompanies();
    setCompanies(loadedCompanies);
    setDrivers(FlytStorage.getDrivers());
    setBoutiques(FlytStorage.getBoutiques());
    setOrders(FlytStorage.getOrders());
    setInvoices(FlytStorage.getInvoices());
    setNotifications(FlytStorage.getNotifications());
    if (loadedCompanies.length === 0) {
      if (currentRole !== 'vitrine' && currentRole !== 'admin') {
        setIsOnboardingOpen(true);
      }
      setCurrentCompanyId('');
    }
  };

  // Automatically open registration if trying to use operational app without any company
  useEffect(() => {
    if (companies.length === 0 && currentRole !== 'vitrine' && currentRole !== 'admin') {
      setIsOnboardingOpen(true);
    }
  }, [companies.length, currentRole]);

  // Check URL parameters for driver invitation link
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const joinCompId = params.get('joinCompany');
      if (joinCompId) {
        setCurrentCompanyId(joinCompId);
        setIsDriverInviteModalOpen(true);
      }
    } catch {
      // ignore
    }
  }, []);

  // Listen to network status & local storage events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribe = FlytStorage.subscribe(() => {
      reloadStateFromStorage();
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  // REAL-TIME FIRESTORE DATA STREAM LISTENERS
  useEffect(() => {
    const unsubCompanies = subscribeCompanies((cloudCompanies) => {
      setCompanies(cloudCompanies);
      if (cloudCompanies.length > 0) {
        setCurrentCompanyId((prev) => {
          try {
            const remembered = localStorage.getItem('flyt_remembered_company_id');
            if (remembered && cloudCompanies.some((c) => c.id === remembered)) {
              return remembered;
            }
          } catch {
            // ignore
          }
          if (!prev || !cloudCompanies.some((c) => c.id === prev)) {
            return cloudCompanies[0].id;
          }
          return prev;
        });
      } else {
        setCurrentCompanyId('');
      }
    });

    const unsubDrivers = subscribeDrivers((cloudDrivers) => {
      setDrivers(cloudDrivers);
      if (cloudDrivers.length > 0) {
        setCurrentDriverId((prev) => {
          if (!prev || !cloudDrivers.some((d) => d.id === prev)) {
            return cloudDrivers[0].id;
          }
          return prev;
        });
      } else {
        setCurrentDriverId('');
      }
    });

    const unsubOrders = subscribeOrders((cloudOrders) => {
      setOrders(cloudOrders);
    });

    return () => {
      unsubCompanies();
      unsubDrivers();
      unsubOrders();
    };
  }, []);

  // Reset all data for a fresh start with real-time sync ("Supprimer toutes les données")
  const handleResetAllData = async () => {
    await FlytStorage.resetAllData();
    reloadStateFromStorage();
    setCurrentCompanyId('');
    setCurrentDriverId('');
    setCompanies([]);
    setDrivers([]);
    setOrders([]);
    setBoutiques([]);
    setCurrentRole('vitrine');
  };

  // Compute selected entities
  const activeCompany = companies.find((c) => c.id === currentCompanyId) || (companies.length > 0 ? companies[0] : null);
  const activeDriver = drivers.find((d) => d.id === currentDriverId) || (drivers.length > 0 ? drivers[0] : null);
  const activeBoutique = boutiques.find((b) => b.slug === currentBoutiqueSlug) || (boutiques.length > 0 ? boutiques[0] : null);

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-[#070A11] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      <OfflineBanner />

      {/* Floating Visual Mission Alert Banner for Instant Push Alerts */}
      <MissionAlertBanner
        onAcceptMission={(order) => {
          if (order.driverId) {
            setCurrentDriverId(order.driverId);
          }
          setCurrentRole('livreur');
          reloadStateFromStorage();
        }}
        onNavigateToMission={(order) => {
          if (order.driverId) {
            setCurrentDriverId(order.driverId);
          }
          setCurrentRole('livreur');
        }}
      />

      {/* VUE VITRINE : SITE VITRINE PUBLIC OFFICIEL */}
      {currentRole === 'vitrine' && (
        <SiteVitrine
          onLaunchApp={(targetRole) => {
            if (companies.length === 0 && targetRole !== 'admin') {
              setIsOnboardingOpen(true);
            }
            setCurrentRole(targetRole || 'gerant');
          }}
          onOpenOnboarding={() => setIsOnboardingOpen(true)}
          activeCompany={activeCompany}
          companiesCount={companies.length}
          companies={companies}
          onSelectCompany={(companyId) => {
            setCurrentCompanyId(companyId);
            setCurrentRole('gerant');
          }}
        />
      )}

      {/* VUES APPLICATIVES : BUREAU GÉRANT, BOUTIQUES, LIVREURS, CLIENT, ADMIN */}
      {currentRole !== 'vitrine' && (
        <>
          {/* Top Bar Navigation */}
          <Navbar
            currentRole={currentRole}
            onSelectRole={setCurrentRole}
            unreadNotificationsCount={unreadNotificationsCount}
            onOpenNotifications={() => setIsNotificationOpen(true)}
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
            onOpenDriverRegister={() => setIsDriverInviteModalOpen(true)}
            onResetAllData={handleResetAllData}
            isOnline={isOnline}
            activeCompany={activeCompany}
            companiesCount={companies.length}
          />

          {/* Main Content View Container */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
            {/* VUE OBLIGATOIRE : SI AUCUNE SOCIÉTÉ N'EST ENREGISTRÉE */}
            {!activeCompany && currentRole !== 'admin' && (
              <OnboardingRequiredView 
                onStartRegistration={() => setIsOnboardingOpen(true)} 
                onReturnToVitrine={() => setCurrentRole('vitrine')}
              />
            )}

            {/* BLOC 1 : LE BUREAU DU GÉRANT */}
            {currentRole === 'gerant' && activeCompany && (
              <GerantDashboard
                company={activeCompany}
                drivers={drivers.filter((d) => d.companyId === activeCompany.id)}
                boutiques={boutiques}
                orders={orders.filter((o) => o.companyId === activeCompany.id)}
                onNavigateToBoutique={(slug) => {
                  setCurrentBoutiqueSlug(slug);
                  setCurrentRole('boutique');
                }}
                onNavigateToDriver={(driverId) => {
                  setCurrentDriverId(driverId);
                  setCurrentRole('livreur');
                }}
                onNavigateToTracking={(token) => {
                  setCurrentTrackingToken(token);
                  setCurrentRole('client');
                }}
              />
            )}

            {/* BLOC 2 : LE BUREAU DES BOUTIQUES */}
            {currentRole === 'boutique' && activeCompany && activeBoutique && (
              <BoutiquePortal
                boutique={activeBoutique}
                company={activeCompany}
                boutiqueOrders={orders.filter((o) => o.boutiqueId === activeBoutique.id)}
                onOrderCreated={() => {
                  reloadStateFromStorage();
                }}
                onNavigateToTracking={(token) => {
                  setCurrentTrackingToken(token);
                  setCurrentRole('client');
                }}
              />
            )}

            {/* SI AUCUNE BOUTIQUE N'A ENCORE ÉTÉ CRÉÉE */}
            {currentRole === 'boutique' && activeCompany && !activeBoutique && (
              <div className="max-w-xl mx-auto py-12 px-6 text-center space-y-4 bg-slate-900/60 border border-slate-800 rounded-3xl animate-in fade-in">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Aucune boutique enregistrée</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Pour que vos commerçants partenaires puissent saisir des courses, créez vos premières boutiques partenaires depuis le Bureau du Gérant.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setCurrentRole('gerant')}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Aller au Bureau du Gérant
                  </button>
                </div>
              </div>
            )}

            {/* BLOC 3 : L'APPLICATION DES LIVREURS */}
            {currentRole === 'livreur' && activeDriver && (
              <LivreurApp
                currentDriver={activeDriver}
                orders={orders.filter((o) => o.companyId === activeDriver.companyId)}
                onDriverChange={(driverId) => setCurrentDriverId(driverId)}
                onNavigateToTracking={(token) => {
                  setCurrentTrackingToken(token);
                  setCurrentRole('client');
                }}
              />
            )}

            {/* SI AUCUN LIVREUR N'A ENCORE ÉTÉ AJOUTÉ */}
            {currentRole === 'livreur' && activeCompany && !activeDriver && (
              <div className="max-w-xl mx-auto py-12 px-6 text-center space-y-4 bg-slate-900/60 border border-slate-800 rounded-3xl animate-in fade-in">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Bike className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Aucun livreur dans l'équipe</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Votre société <span className="text-emerald-400 font-semibold">{activeCompany.name}</span> n'a pas encore de livreur enregistré. Partagez votre lien d'invitation ou saisissez un livreur pour tester l'application mobile.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setIsDriverInviteModalOpen(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Ajouter un livreur
                  </button>
                  <button
                    onClick={() => setCurrentRole('gerant')}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Retour Bureau Gérant
                  </button>
                </div>
              </div>
            )}

            {/* BLOC 4 : LE SUIVI CLIENT FINAL */}
            {currentRole === 'client' && activeCompany && (
              <SuiviClient
                initialToken={currentTrackingToken}
                orders={orders.filter((o) => o.companyId === activeCompany.id)}
                company={activeCompany}
              />
            )}

            {/* SUPER ADMIN PHOENIX */}
            {currentRole === 'admin' && (
              <SuperAdminDashboard
                companies={companies}
                invoices={invoices}
                allOrders={orders}
                drivers={drivers}
                boutiques={boutiques}
                onCompanyUpdated={reloadStateFromStorage}
              />
            )}
          </main>
        </>
      )}

      {/* 4-Step Company Registration Modal (90s Chrono) */}
      <CompanyRegistrationModal
        isOpen={isOnboardingOpen}
        canDismiss={true}
        onClose={() => {
          setIsOnboardingOpen(false);
          if (companies.length === 0 && currentRole !== 'admin') {
            setCurrentRole('vitrine');
          }
        }}
        onReturnToVitrine={() => {
          setIsOnboardingOpen(false);
          setCurrentRole('vitrine');
        }}
        onCompleted={(newCompany: Company) => {
          reloadStateFromStorage();
          setCurrentCompanyId(newCompany.id);
          setCurrentRole('gerant');
          setIsOnboardingOpen(false);
        }}
      />

      {/* Driver Self-Registration via Invitation Link */}
      {activeCompany && (
        <DriverRegistrationModal
          isOpen={isDriverInviteModalOpen}
          company={activeCompany}
          onClose={() => setIsDriverInviteModalOpen(false)}
          onReturnToVitrine={() => {
            setIsDriverInviteModalOpen(false);
            setCurrentRole('vitrine');
          }}
          onRegistered={(registeredDriver) => {
            reloadStateFromStorage();
            setCurrentDriverId(registeredDriver.id);
            setCurrentRole('livreur');
            setIsDriverInviteModalOpen(false);
          }}
        />
      )}

      {/* Push Notification Drawer */}
      <NotificationCenter
        notifications={notifications}
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onOpenInvoiceModal={() => {
          setIsNotificationOpen(false);
          setCurrentRole('gerant');
        }}
      />
    </div>
  );
}
