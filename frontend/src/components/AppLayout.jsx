import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu, Bell, Shield, Plus, AlertCircle } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useAuth } from '../services/AuthContext';
import { Badge } from './Badge';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard':
        return 'System Overview & Metrics';
      case '/disasters':
        return 'Disaster Incidents Directory';
      case '/emergency-requests':
        return 'Emergency Assistance Requests';
      case '/rescue-teams':
        return 'Rescue Response Teams';
      case '/profile':
        return 'User Account Profile';
      default:
        return 'Dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-sm border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base font-semibold text-slate-900 leading-tight">
                {getPageTitle()}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>DisasterManagement DB Live</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/disasters?action=report"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Report Disaster</span>
            </Link>

            <Link
              to="/emergency-requests?action=request"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium shadow-sm transition-colors"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Emergency Help</span>
            </Link>

            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>

            <Link
              to="/profile"
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 text-xs font-semibold">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
