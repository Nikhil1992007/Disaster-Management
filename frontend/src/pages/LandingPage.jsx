import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldAlert, 
  LifeBuoy, 
  Radio, 
  Home, 
  Gift, 
  ArrowRight, 
  CheckCircle2, 
  Database,
  Users
} from 'lucide-react';
import { useAuth } from '../services/AuthContext';

export function LandingPage() {
  const { user } = useAuth();

  const features = [
    {
      icon: Radio,
      title: 'Disaster Incident Reporting',
      description: 'Citizens report local disasters with exact GPS coordinates, city classification, and severity evaluation in real time.'
    },
    {
      icon: LifeBuoy,
      title: 'Emergency Rescue Dispatch',
      description: 'First responders and NDRF battalions are automatically assigned with automated availability tracking triggers.'
    },
    {
      icon: Home,
      title: 'Shelter Management',
      description: 'Real-time monitoring of shelter capacities, resident occupancy, and essential emergency supplies of food and medicine.'
    },
    {
      icon: Gift,
      title: 'Relief & NGO Coordination',
      description: 'Transparent management of humanitarian aid, material donations, and monetary funds allocated to affected regions.'
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-100 bg-white/95 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-slate-900 text-sm tracking-tight">DisasterResQ</span>
              <span className="ml-2 text-[10px] font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200/50">DBMS Part 1</span>
            </div>
          </div>

          <nav className="flex items-center gap-4">
            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                Go to Dashboard
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  Register Citizen
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6 max-w-4xl mx-auto text-center flex-1 flex flex-col justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 mx-auto mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Connected to MySQL 8 &bull; 11 Integrated Relational Tables
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-950 mb-6 leading-[1.15]">
          Smart Disaster Management & Emergency Response
        </h1>

        <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          An integrated relational emergency coordination platform. Enables citizen distress reporting, 
          rapid rescue team deployment, shelter occupancy management, and humanitarian relief tracking.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to={user ? "/dashboard" : "/login"}
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm hover:shadow transition-all inline-flex items-center justify-center gap-2"
          >
            Launch System Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/register"
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm font-semibold shadow-sm transition-all inline-flex items-center justify-center"
          >
            Create Citizen Account
          </Link>
        </div>

        {/* Tech Highlights Pill Bar */}
        <div className="mt-14 pt-8 border-t border-slate-100 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span>Pure SQL &bull; No ORM</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span>Automated MySQL Triggers</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span>Role-Based Data Isolation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span>Atomic Transactions</span>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-20 bg-slate-50 border-t border-slate-200/80 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-3">
              Comprehensive Relief Coordination
            </h2>
            <p className="text-sm text-slate-600">
              Built on 11 strictly normalized relational tables for end-to-end disaster preparedness.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div 
                  key={idx}
                  className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all flex flex-col"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-white border-t border-slate-100 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>&copy; {new Date().getFullYear()} Smart Disaster Management & Emergency Response System. DBMS College Project.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>MySQL 8.0</span>
            <span>&bull;</span>
            <span>Python Flask</span>
            <span>&bull;</span>
            <span>React + Vite</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
