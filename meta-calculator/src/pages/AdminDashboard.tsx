import React, { useState } from 'react';
import { AdvisorManagement } from '../components/admin/AdvisorManagement';
import { StoreMetrics } from '../components/admin/StoreMetrics';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { getTodayInCR } from '../utils/dateUtils';

export const AdminDashboard: React.FC = () => {
  const [date, setDate] = useState(getTodayInCR());
  const [currentView, setCurrentView] = useState<'advisors' | 'store'>('advisors');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        currentView={currentView} 
        onViewChange={setCurrentView} 
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header 
          date={date} 
          onDateChange={setDate} 
          onMenuClick={() => setIsSidebarOpen(true)} 
        />

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {currentView === 'advisors' ? (
              <AdvisorManagement date={date} />
            ) : (
              <StoreMetrics date={date} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
