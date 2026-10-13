import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  AlertTriangle, 
  LifeBuoy, 
  Users, 
  User, 
  LogOut, 
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../services/AuthContext';
import { Badge } from './Badge';

export function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Disasters', to: '/disasters', icon: AlertTriangle },
    { label: 'Emergency Requests', to: '/emergency-requests', icon: LifeBuoy },
    { label: 'Rescue Teams', to: '/rescue-teams', icon: Users },
    { label: 'Profile', to: '/profile', icon: User },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-900 leading-tight">DisasterResQ</h1>
            <p className="text-[11px] text-slate-500 font-medium tracking-tight">Smart Response System</p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Management
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'}
                `}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100" />
              </NavLink>
            );
          })}
        </nav>

        {/* User profile & logout section */}
        {user && (
          <div className="p-3 border-t border-slate-100">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-900 truncate max-w-[120px]">
                  {user.name}
                </span>
                <Badge variant={user.user_type} size="xs">
                  {user.user_type}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-500" />
              <span>Sign out</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
