import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import Link from 'next/link';

// Components
import Header from '@/components/Header';
import SummaryStats from '@/components/SummaryStats';
import ProgressChart from '@/components/ProgressChart';
import IncomeDistribution from '@/components/IncomeDistribution';
import DataLoader from '@/components/DataLoader';
import HCDDataUpload from '@/components/HCDDataUpload';
import RefreshDataButton from '@/components/RefreshDataButton';
import AIAssistant from '@/components/AIAssistant';
import LanguageToggle from '@/components/LanguageToggle';

// Context and translations
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/auth/AuthContext';
import { uiTranslations } from '@/lib/translations';

// Dynamic import for components with browser-only dependencies
const HousingMap = dynamic(() => import('@/components/HousingMap'), {
  ssr: false,
});

// Title translations
const pageTitles = {
  en: 'San Mateo County Housing Element Dashboard',
  es: 'Panel de elementos de vivienda del condado de San Mateo',
  zh: '圣马特奥县住房元素仪表板'
};

// Description translations
const pageDescriptions = {
  en: 'Housing Element Annual Report Dashboard for San Mateo County',
  es: 'Panel de informes anuales de elementos de vivienda para el condado de San Mateo',
  zh: '圣马特奥县住房元素年度报告仪表板'
};

export default function Home() {
  const { language } = useLanguage();
  const { isAuthenticated, user, logout } = useAuth();
  const [showUploadSection, setShowUploadSection] = useState(false);
  const [dataKey, setDataKey] = useState(Date.now());
  // Track current view to provide context to the AI Assistant
  const [currentView, setCurrentView] = useState('overview');
  
  // Function to force reload data when refresh button is clicked
  const handleDataRefresh = () => {
    setDataKey(Date.now());
  };
  
  // Get UI translations
  const t = uiTranslations[language];
  
  // Check if user has admin privileges
  const isAdmin = isAuthenticated && (user?.role === 'admin' || user?.role === 'dataManager');
  
  return (
    <>
      <Head>
        <title>{pageTitles[language]}</title>
        <meta name="description" content={pageDescriptions[language]} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <main>
        <Header title={pageTitles[language]} />
        
        <div className="dashboard-container">
          <div className="admin-controls">
            {isAdmin ? (
              <>
                <RefreshDataButton 
                  onRefreshComplete={handleDataRefresh} 
                  isAdmin={showUploadSection} 
                  currentView={currentView}
                />
                <button 
                  onClick={() => setShowUploadSection(!showUploadSection)}
                  className="admin-button"
                >
                  {showUploadSection ? t.hideAdminPanel : t.showAdminPanel}
                </button>
                <button
                  onClick={() => logout()}
                  className="admin-button logout-button"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link href="/login" className="admin-button">
                Admin Login
              </Link>
            )}
          </div>
          
          {isAdmin && showUploadSection && (
            <HCDDataUpload />
          )}
          
          <DataLoader key={dataKey}>
            {(data) => (
              <>
                {/* AI Assistant */}
                <AIAssistant dashboardData={data} currentView={currentView} />
                
                {/* Main overview section */}
                <div id="overview" onClick={() => setCurrentView('overview')}>
                  <SummaryStats data={data.summaryStats} />
                </div>
                
                {/* Progress chart section */}
                <div id="progress" onClick={() => setCurrentView('progress')} className="card">
                  <h2>{t.housingDevelopmentProgress}</h2>
                  <div className="chart-container">
                    <ProgressChart data={data.progressChart} />
                  </div>
                </div>
                
                <div className="grid">
                  {/* Income distribution section */}
                  <div id="income" onClick={() => setCurrentView('income')} className="card">
                    <h2>{t.incomeLevelDistribution}</h2>
                    <IncomeDistribution data={data.incomeDistribution} />
                  </div>
                  
                  {/* Map section */}
                  <div id="map" onClick={() => setCurrentView('map')} className="card">
                    <h2>{t.housingProjectsMap}</h2>
                    <div className="map-container">
                      <HousingMap projects={data.housingProjects} />
                    </div>
                  </div>
                </div>
              </>
            )}
          </DataLoader>
        </div>
      </main>
    </>
  );
} 