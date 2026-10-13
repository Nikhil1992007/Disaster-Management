import React, { useState, useEffect } from 'react';
import { Users, Phone, MapPin, Wrench, Shield, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { Badge } from '../components/Badge';

export function RescueTeamsPage() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const res = await api.rescueTeams.list({ status: statusFilter });
      setTeams(res.teams || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Rescue Response Teams
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active battalions with trigger-automated deployment availability
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchTeams}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm focus:outline-none focus:border-blue-600"
          >
            <option value="">All Teams</option>
            <option value="Available">Available Only</option>
            <option value="Busy">Busy (Deployed)</option>
            <option value="Off Duty">Off Duty</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map((t) => (
          <div 
            key={t.RescueTeamID}
            className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-sm text-slate-900">
                  {t.TeamName}
                </h3>
                <Badge variant={t.Status}>{t.Status}</Badge>
              </div>

              <p className="text-xs text-blue-600 font-medium mb-3">
                {t.Specialization}
              </p>

              <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                  <span>Leader: <strong className="text-slate-800">{t.LeaderName}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t.Phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t.MembersCount} Responders</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t.CurrentLocation}</span>
                </div>
                {t.Equipment && (
                  <div className="flex items-start gap-2 pt-1 text-[11px] text-slate-500">
                    <Wrench className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{t.Equipment}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Team ID: #{t.RescueTeamID}</span>
              <span className={`inline-block w-2 h-2 rounded-full ${
                t.Status === 'Available' ? 'bg-emerald-500' : 'bg-amber-500'
              }`}></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
