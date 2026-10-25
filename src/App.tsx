import React, { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import { store, useAppDispatch, useAppSelector } from './store';
import { Navbar } from './components/common/Navbar';
import { Dashboard } from './components/dashboard/Dashboard';
import { Campaigns } from './components/campaigns/Campaigns';
import { CampaignDetails } from './components/campaigns/CampaignDetails';
import { AddCampaign } from './components/campaigns/AddCampaign';
import { EditCampaign } from './components/campaigns/EditCampaign';
import { Contacts } from './components/contacts/Contacts';
import { Templates } from './components/templates/Templates';
import { Analytics } from './components/analytics/Analytics';
import { Login } from './components/auth/Login';
import { CampaignDTO } from './types';
import {
  fetchCampaigns,
  setSelectedCampaign,
  clearSelectedCampaign
} from './store/slices/campaignsSlice';
import { fetchContactsAndGroups } from './store/slices/contactsSlice';
import { fetchTemplates } from './store/slices/templatesSlice';
import { fetchOverviewAnalytics } from './store/slices/analyticsSlice';
import { useTimer } from './services/useTimer';

const MainApp: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { selectedCampaign } = useAppSelector((state) => state.campaigns);

  useTimer();

  const isAdmin = user?.role === 'ADMIN';

  const [activeTab, setActiveTab] = useState('campaigns');
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<CampaignDTO | null>(null);
  const [campaignInitialTemplateId, setCampaignInitialTemplateId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCampaigns());
      dispatch(fetchContactsAndGroups());
      dispatch(fetchTemplates());
      dispatch(fetchOverviewAnalytics());
      if (isAdmin && activeTab === 'campaigns') {
        setActiveTab('dashboard');
      }
    } else {
      setActiveTab('campaigns');
      setIsNewCampaignOpen(false);
      setEditingCampaign(null);
      setCampaignInitialTemplateId(undefined);
      dispatch(clearSelectedCampaign());
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    if (!isAdmin && (activeTab === 'dashboard' || activeTab === 'analytics')) {
      setActiveTab('campaigns');
    }
  }, [isAdmin, activeTab]);

  useEffect(() => {
    const handlePopState = () => {
      dispatch(clearSelectedCampaign());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [dispatch]);

  if (!isAuthenticated) {
    return <Login />;
  }

  const handleOpenNewCampaign = (templateId?: string) => {
    setCampaignInitialTemplateId(templateId);
    setIsNewCampaignOpen(true);
  };

  const handleUseTemplateInCampaign = (templateId: string) => {
    handleOpenNewCampaign(templateId);
  };

  const handleViewCampaign = (campaign: CampaignDTO) => {
    window.history.pushState({ view: 'campaign', id: campaign.id }, '');
    dispatch(setSelectedCampaign(campaign));
  };

  const handleEditCampaign = (campaign: CampaignDTO) => {
    if (campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED') {
      setEditingCampaign(campaign);
    }
  };

  const handleBackFromCampaign = () => {
    dispatch(clearSelectedCampaign());
    if (window.history.state?.view === 'campaign') {
      window.history.back();
    }
  };

  const handleTabChange = (tab: string) => {
    dispatch(clearSelectedCampaign());
    if (!isAdmin && (tab === 'dashboard' || tab === 'analytics')) {
      setActiveTab('campaigns');
      return;
    }
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 antialiased font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onOpenNewCampaign={() => handleOpenNewCampaign()}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {selectedCampaign ? (
          <CampaignDetails
            campaign={selectedCampaign}
            onBack={handleBackFromCampaign}
            onEditCampaign={handleEditCampaign}
          />
        ) : (
          <>
            {activeTab === 'dashboard' && isAdmin && (
              <Dashboard
                onNavigateTab={handleTabChange}
                onOpenNewCampaign={() => handleOpenNewCampaign()}
                onViewCampaign={handleViewCampaign}
              />
            )}

            {(activeTab === 'campaigns' || (!isAdmin && (activeTab === 'dashboard' || activeTab === 'analytics'))) && (
              <Campaigns
                onOpenNewCampaign={() => handleOpenNewCampaign()}
                onViewCampaign={handleViewCampaign}
                onEditCampaign={handleEditCampaign}
              />
            )}

            {activeTab === 'contacts' && <Contacts />}

            {activeTab === 'templates' && (
              <Templates onUseTemplateInCampaign={handleUseTemplateInCampaign} />
            )}

            {activeTab === 'analytics' && isAdmin && <Analytics />}
          </>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">CampaignPro</span>
            <span>·</span>
            <span>Email Campaign Management System</span>
          </div>

          <div className="text-slate-400 text-xs">
            Full-Stack Project
          </div>
        </div>
      </footer>

      <AddCampaign
        isOpen={isNewCampaignOpen}
        initialTemplateId={campaignInitialTemplateId}
        onClose={() => {
          setIsNewCampaignOpen(false);
          setCampaignInitialTemplateId(undefined);
        }}
        onSuccess={() => {
          setIsNewCampaignOpen(false);
          setCampaignInitialTemplateId(undefined);
          dispatch(fetchCampaigns());
          dispatch(fetchOverviewAnalytics());
        }}
      />

      <EditCampaign
        isOpen={!!editingCampaign}
        campaign={editingCampaign}
        onClose={() => setEditingCampaign(null)}
        onSuccess={() => {
          setEditingCampaign(null);
          dispatch(fetchCampaigns());
          dispatch(fetchOverviewAnalytics());
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <Provider store={store}>
      <MainApp />
    </Provider>
  );
}
