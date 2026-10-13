import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Shield, Calendar, LogOut, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../services/AuthContext';
import { Badge } from '../components/Badge';

export function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="text-center py-12 text-slate-500 text-xs">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          User Account Profile
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Authenticated credentials stored in USER & CITIZEN database records
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Profile Card Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold shadow-sm">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{user.name}</h2>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
          </div>
          <Badge variant={user.user_type}>{user.user_type}</Badge>
        </div>

        {/* Profile Details Grid */}
        <div className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block mb-1">User ID / Reference</span>
              <span className="font-semibold text-slate-800 font-mono">USER #{user.user_id}</span>
              {user.citizen_id && (
                <span className="text-slate-500 block text-[11px] mt-0.5">
                  Citizen Table ID: #{user.citizen_id}
                </span>
              )}
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block mb-1">Contact Phone</span>
              <span className="font-semibold text-slate-800">{user.phone || 'N/A'}</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block mb-1">City</span>
              <span className="font-semibold text-slate-800">{user.city || 'N/A'}</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block mb-1">Emergency Contact</span>
              <span className="font-semibold text-slate-800">{user.emergency_contact || user.phone}</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block mb-1">Residential Address</span>
            <span className="font-semibold text-slate-800">{user.address || 'Not specified'}</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block mb-1">Account Creation Date</span>
              <span className="font-semibold text-slate-800">
                {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active Member'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>Verified Active</span>
            </div>
          </div>
        </div>

        {/* Footer with Logout */}
        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-end">
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-200 hover:border-red-200 text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out of session</span>
          </button>
        </div>
      </div>
    </div>
  );
}
