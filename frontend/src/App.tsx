import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { NavigationTab } from './types';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { AlertBanner } from './components/AlertBanner';
import { DashboardPage } from './pages/DashboardPage';
import { DevicesPage } from './pages/DevicesPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { DisabledFeaturePage } from './pages/DisabledFeaturePage';
import { AuthPage } from './pages/AuthPage';

export const App: React.FC = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavigationTab>('overview');
  const [isOpenAddDeviceModal, setIsOpenAddDeviceModal] = useState<boolean>(false);
  const [isOpenAddProjectModal, setIsOpenAddProjectModal] = useState<boolean>(false);

  // If user signs out completely
  if (!user) {
    return (
      <div className="app-shell">
        <AlertBanner />
        <Header />
        <main id="main-content">
          <AuthPage />
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <AlertBanner />
      <Header />
      <Navigation currentTab={currentTab} onSelectTab={setCurrentTab} />

      <main id="main-content" className="main-container">
        {currentTab === 'overview' && (
          <DashboardPage
            onNavigate={setCurrentTab}
            onOpenAddDevice={() => {
              setCurrentTab('devices');
              setIsOpenAddDeviceModal(true);
            }}
            onOpenAddProject={() => {
              setCurrentTab('projects');
              setIsOpenAddProjectModal(true);
            }}
          />
        )}

        {currentTab === 'devices' && (
          <DevicesPage
            isOpenAddModal={isOpenAddDeviceModal}
            onCloseAddModal={() => setIsOpenAddDeviceModal(false)}
            onOpenAddModal={() => setIsOpenAddDeviceModal(true)}
          />
        )}

        {currentTab === 'projects' && (
          <ProjectsPage
            isOpenAddModal={isOpenAddProjectModal}
            onCloseAddModal={() => setIsOpenAddProjectModal(false)}
            onOpenAddModal={() => setIsOpenAddProjectModal(true)}
          />
        )}

        {(currentTab === 'label_builder' || 
          currentTab === 'compliance' || 
          currentTab === 'compare' || 
          currentTab === 'rules' || 
          currentTab === 'review' || 
          currentTab === 'audit') && (
          <DisabledFeaturePage
            tab={currentTab}
            onNavigateToDevices={() => setCurrentTab('devices')}
          />
        )}
      </main>
    </div>
  );
};

export default App;
