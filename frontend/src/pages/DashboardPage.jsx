import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  AlertTriangle, 
  LifeBuoy, 
  HeartHandshake, 
  Users, 
  ShieldCheck, 
  Plus, 
  AlertCircle, 
  RefreshCw,
  Building,
  Clock,
  MapPin,
  Phone,
  Shield,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Home,
  Radio
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { api } from '../services/api';
import { useAuth } from '../services/AuthContext';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';

export function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals for Citizen direct actions
  const [isReportDisasterOpen, setIsReportDisasterOpen] = useState(false);
  const [isEmergencyRequestOpen, setIsEmergencyRequestOpen] = useState(false);

  // Disaster form state
  const [disasterForm, setDisasterForm] = useState({
    disaster_type: '',
    severity: 'Moderate',
    location: '',
    city: user?.city || '',
    description: ''
  });
  const [disasterSubmitting, setDisasterSubmitting] = useState(false);
  const [disasterError, setDisasterError] = useState('');
  const [disasterSuccess, setDisasterSuccess] = useState('');

  // Emergency request form state
  const [requestForm, setRequestForm] = useState({
    request_type: 'Medical',
    priority: 'High',
    people_count: 1,
    location: '',
    description: '',
    disaster_id: ''
  });
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [requestSuccess, setRequestSuccess] = useState('');

  // Auxiliary list of active disasters for dropdown
  const [activeDisastersList, setActiveDisastersList] = useState([]);

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.dashboard.getStats();
      setData(res);
      // Fetch active disasters for request dropdown if needed
      const disRes = await api.disasters.list({ status: 'Ongoing' });
      setActiveDisastersList(disRes.disasters || []);
      if (disRes.disasters?.length > 0 && !requestForm.disaster_id) {
        setRequestForm(prev => ({ ...prev, disaster_id: disRes.disasters[0].DisasterID }));
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleDisasterSubmit = async (e) => {
    e.preventDefault();
    setDisasterSubmitting(true);
    setDisasterError('');
    setDisasterSuccess('');
    try {
      await api.disasters.create(disasterForm);
      setDisasterSuccess('Disaster reported successfully! Verification team alerted.');
      setTimeout(() => {
        setIsReportDisasterOpen(false);
        setDisasterSuccess('');
        setDisasterForm({
          disaster_type: '',
          severity: 'Moderate',
          location: '',
          city: user?.city || '',
          description: ''
        });
        fetchStats();
      }, 1200);
    } catch (err) {
      setDisasterError(err.message || 'Failed to submit disaster report.');
    } finally {
      setDisasterSubmitting(false);
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setRequestSubmitting(true);
    setRequestError('');
    setRequestSuccess('');
    try {
      await api.emergency.create({
        ...requestForm,
        people_count: parseInt(requestForm.people_count, 10)
      });
      setRequestSuccess('Emergency rescue dispatched! First responder teams notified.');
      setTimeout(() => {
        setIsEmergencyRequestOpen(false);
        setRequestSuccess('');
        setRequestForm({
          request_type: 'Medical',
          priority: 'High',
          people_count: 1,
          location: '',
          description: '',
          disaster_id: activeDisastersList[0]?.DisasterID || ''
        });
        fetchStats();
      }, 1200);
    } catch (err) {
      setRequestError(err.message || 'Failed to submit emergency request.');
    } finally {
      setRequestSubmitting(false);
    }
  };

  const SEVERITY_COLORS = {
    Critical: '#ef4444',
    High: '#f97316',
    Moderate: '#3b82f6',
    Low: '#64748b'
  };

  const STATUS_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#64748b'];

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
          <span>Synchronizing with DisasterManagement DB...</span>
        </div>
      </div>
    );
  }

  const isAdmin = user?.user_type === 'Admin';
  const citizenData = data?.citizen_data;

  // =====================================================================
  // CITIZEN DASHBOARD VIEW
  // =====================================================================
  if (!isAdmin) {
    const counts = citizenData?.counts || {};
    const myRequests = citizenData?.my_requests || [];
    const myDisasters = citizenData?.my_disasters || [];
    const activeAlerts = citizenData?.active_alerts || [];
    const safeShelters = citizenData?.safe_shelters || [];

    return (
      <div className="space-y-8">
        {/* Citizen Hero & Quick Action Banner */}
        <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-800/80 text-blue-200 text-xs font-medium mb-3 border border-blue-700/50">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Citizen Emergency Portal &bull; {user?.city || 'India'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
              Hello, {user?.name || 'Citizen'}
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed mb-6 font-normal">
              Quickly report emerging disaster hazards or request immediate rescue assistance for stranded family and neighbors.
            </p>

            {/* Prominent Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIsReportDisasterOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow transition-colors"
              >
                <Radio className="w-4 h-4" />
                <span>Report New Disaster</span>
              </button>

              <button
                onClick={() => setIsEmergencyRequestOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl shadow transition-colors"
              >
                <LifeBuoy className="w-4 h-4" />
                <span>Request Emergency Rescue</span>
              </button>

              <a
                href="tel:112"
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-rose-400" />
                <span>Emergency: 112</span>
              </a>
            </div>
          </div>
        </div>

        {/* Citizen Personal Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-500">My Active Requests</span>
            <div className="mt-3">
              <div className="text-2xl font-bold text-amber-600">
                {counts.my_active_requests ?? 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {counts.my_total_requests ?? 0} total submitted
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-500">Disasters Reported by Me</span>
            <div className="mt-3">
              <div className="text-2xl font-bold text-blue-600">
                {counts.my_reported_disasters ?? 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Incidents registered
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-500">Open Relief Shelters</span>
            <div className="mt-3">
              <div className="text-2xl font-bold text-emerald-600">
                {counts.open_shelters ?? 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {counts.available_beds ?? 0} available beds
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-500">Local Area Status</span>
            <div className="mt-3">
              <div className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Response Active</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {user?.city || 'National'} Jurisdiction
              </p>
            </div>
          </div>
        </div>

        {/* Section 1: My Emergency Requests Status Tracker */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                My Emergency Assistance Requests
              </h2>
              <p className="text-xs text-slate-500">
                Track your active requests and assigned rescue teams in real time
              </p>
            </div>
            <button
              onClick={() => setIsEmergencyRequestOpen(true)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New SOS Request</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {myRequests.length > 0 ? (
              myRequests.map((req) => (
                <div key={req.RequestID} className="p-5 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-slate-400">#{req.RequestID}</span>
                      <span className="text-sm font-semibold text-slate-900">{req.RequestType} Assistance</span>
                      <Badge variant={req.Priority}>{req.Priority}</Badge>
                      <span className="text-xs text-slate-500">&bull; {req.PeopleCount} people</span>
                    </div>
                    <Badge variant={req.Status}>{req.Status}</Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-slate-400 block mb-0.5">Location</span>
                      <span className="font-medium text-slate-800">{req.Location}</span>
                      <span className="text-slate-500 block text-[11px]">{req.DisasterType} ({req.DisasterCity})</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-0.5">Assigned Rescue Team</span>
                      <span className="font-medium text-slate-800">{req.AssignedTeam}</span>
                      {req.TeamPhone && (
                        <span className="text-blue-600 block text-[11px] font-medium">Contact: {req.TeamPhone}</span>
                      )}
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-0.5">Time of Request</span>
                      <span className="font-medium text-slate-800">{req.RequestTime}</span>
                    </div>
                  </div>

                  {req.Description && (
                    <p className="mt-2 text-xs text-slate-500 italic">
                      "{req.Description}"
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                You have not submitted any emergency requests yet. If you are in danger, click <strong>"Request Emergency Rescue"</strong>.
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Active Disasters in City & Nearby Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Local Alerts */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Active Incident Advisories</h3>
                <p className="text-xs text-slate-500">Live hazards in {user?.city || 'your region'}</p>
              </div>
              <Link to="/disasters" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                View all
              </Link>
            </div>

            <div className="divide-y divide-slate-100 flex-1">
              {activeAlerts.length > 0 ? (
                activeAlerts.map((d) => (
                  <div key={d.DisasterID} className="p-4 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-900">{d.DisasterType}</span>
                      <Badge variant={d.Severity}>{d.Severity}</Badge>
                    </div>
                    <p className="text-xs text-slate-600 mb-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{d.Location}, {d.City}</span>
                    </p>
                    <p className="text-[11px] text-slate-500 line-clamp-1">
                      {d.Description}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-400">
                  No active disaster hazards reported in your region.
                </div>
              )}
            </div>
          </div>

          {/* Safe Havens & Shelters */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Open Relief Shelters</h3>
                <p className="text-xs text-slate-500">Available safe camps with provisions</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 flex-1">
              {safeShelters.length > 0 ? (
                safeShelters.map((s) => (
                  <div key={s.ShelterID} className="p-4 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-900">{s.ShelterName}</span>
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/50">
                        {s.AvailableBeds} Beds Free
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mb-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{s.Location}, {s.City}</span>
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>Provisions: {s.Facilities}</span>
                      <span className="font-medium text-slate-700">Tel: {s.Contact}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-400">
                  No open shelter facilities found.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Disasters Reported by This Citizen */}
        {myDisasters.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Disasters Reported by Me</h3>
              <p className="text-xs text-slate-500">Incidents you submitted for rescue verification</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-100 font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Disaster</th>
                    <th className="py-2.5 px-4">Severity</th>
                    <th className="py-2.5 px-4">Location</th>
                    <th className="py-2.5 px-4">Reported On</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myDisasters.map((d) => (
                    <tr key={d.DisasterID} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-semibold text-slate-900">{d.DisasterType}</td>
                      <td className="py-3 px-4"><Badge variant={d.Severity}>{d.Severity}</Badge></td>
                      <td className="py-3 px-4 text-slate-600">{d.Location}, {d.City}</td>
                      <td className="py-3 px-4 text-slate-500">{d.ReportedAt}</td>
                      <td className="py-3 px-4"><Badge variant={d.Status}>{d.Status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Section 4: National Emergency Helplines Card */}
        <div className="bg-slate-900 text-white rounded-xl p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
            National Disaster & Emergency Contacts
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs">
            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
              <span className="block text-slate-400 text-[11px] mb-1">National Helpline</span>
              <a href="tel:112" className="text-lg font-bold text-white hover:text-blue-400">112</a>
            </div>
            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
              <span className="block text-slate-400 text-[11px] mb-1">NDRF Disaster</span>
              <a href="tel:1078" className="text-lg font-bold text-amber-400 hover:underline">1078</a>
            </div>
            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
              <span className="block text-slate-400 text-[11px] mb-1">Ambulance</span>
              <a href="tel:108" className="text-lg font-bold text-emerald-400 hover:underline">108</a>
            </div>
            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
              <span className="block text-slate-400 text-[11px] mb-1">Fire Response</span>
              <a href="tel:101" className="text-lg font-bold text-rose-400 hover:underline">101</a>
            </div>
            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60 col-span-2 sm:col-span-1">
              <span className="block text-slate-400 text-[11px] mb-1">Police Dispatch</span>
              <a href="tel:100" className="text-lg font-bold text-sky-400 hover:underline">100</a>
            </div>
          </div>
        </div>

        {/* Modal: Report New Disaster (Citizen Direct) */}
        <Modal
          isOpen={isReportDisasterOpen}
          onClose={() => setIsReportDisasterOpen(false)}
          title="Report New Disaster Incident"
        >
          {disasterError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
              {disasterError}
            </div>
          )}
          {disasterSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs">
              {disasterSuccess}
            </div>
          )}
          <form onSubmit={handleDisasterSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Disaster Type *</label>
                <input
                  type="text"
                  value={disasterForm.disaster_type}
                  onChange={(e) => setDisasterForm({ ...disasterForm, disaster_type: e.target.value })}
                  placeholder="e.g. Flood, Landslide, Fire, Building Collapse"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Severity Level *</label>
                <select
                  value={disasterForm.severity}
                  onChange={(e) => setDisasterForm({ ...disasterForm, severity: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600"
                >
                  <option value="Low">Low - Minor localized issue</option>
                  <option value="Moderate">Moderate - Property risk</option>
                  <option value="High">High - Widespread emergency</option>
                  <option value="Critical">Critical - Immediate life threat</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City *</label>
                <input
                  type="text"
                  value={disasterForm.city}
                  onChange={(e) => setDisasterForm({ ...disasterForm, city: e.target.value })}
                  placeholder="e.g. Mumbai, Delhi, Pune"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Specific Location *</label>
                <input
                  type="text"
                  value={disasterForm.location}
                  onChange={(e) => setDisasterForm({ ...disasterForm, location: e.target.value })}
                  placeholder="Street name, landmark, colony"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Observations & Hazards</label>
              <textarea
                rows={3}
                value={disasterForm.description}
                onChange={(e) => setDisasterForm({ ...disasterForm, description: e.target.value })}
                placeholder="Describe current situation, rising water, blocked roads..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsReportDisasterOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={disasterSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50"
              >
                {disasterSubmitting ? 'Submitting Report...' : 'Submit Report'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal: Request Emergency Rescue (Citizen Direct) */}
        <Modal
          isOpen={isEmergencyRequestOpen}
          onClose={() => setIsEmergencyRequestOpen(false)}
          title="Request Immediate Emergency Rescue"
        >
          {requestError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
              {requestError}
            </div>
          )}
          {requestSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs">
              {requestSuccess}
            </div>
          )}
          <form onSubmit={handleRequestSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assistance Type *</label>
                <select
                  value={requestForm.request_type}
                  onChange={(e) => setRequestForm({ ...requestForm, request_type: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600"
                >
                  <option value="Medical">Medical Aid / Trauma Care</option>
                  <option value="Rescue">Evacuation / Boat Rescue</option>
                  <option value="Food">Food Ration Packs</option>
                  <option value="Water">Clean Drinking Water</option>
                  <option value="Transport">Emergency Transport</option>
                  <option value="Shelter">Shelter Bed Accommodation</option>
                  <option value="Other">Other Distress</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Priority *</label>
                <select
                  value={requestForm.priority}
                  onChange={(e) => setRequestForm({ ...requestForm, priority: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600"
                >
                  <option value="Critical">Critical - Immediate Life Danger</option>
                  <option value="High">High - Urgent Assistance</option>
                  <option value="Medium">Medium - Required in few hours</option>
                  <option value="Low">Low - Non-emergency</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">People in Danger * (Min: 1)</label>
                <input
                  type="number"
                  min="1"
                  value={requestForm.people_count}
                  onChange={(e) => setRequestForm({ ...requestForm, people_count: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Related Disaster Incident</label>
                <select
                  value={requestForm.disaster_id}
                  onChange={(e) => setRequestForm({ ...requestForm, disaster_id: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600"
                >
                  {activeDisastersList.map((d) => (
                    <option key={d.DisasterID} value={d.DisasterID}>
                      {d.DisasterType} - {d.City}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Stranded Location / Landmark *</label>
              <input
                type="text"
                value={requestForm.location}
                onChange={(e) => setRequestForm({ ...requestForm, location: e.target.value })}
                placeholder="e.g. Floor 2, House 15, Near Water Tank, Kurla West"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Distress Details</label>
              <textarea
                rows={3}
                value={requestForm.description}
                onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
                placeholder="Mention elderly persons, medical condition, water depth..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEmergencyRequestOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={requestSubmitting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50"
              >
                {requestSubmitting ? 'Transmitting SOS...' : 'Dispatch Request Now'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  // =====================================================================
  // ADMINISTRATOR CONTROL ROOM DASHBOARD VIEW
  // =====================================================================
  const counts = data?.counts || {};
  const charts = data?.charts || {};
  const recentDisasters = data?.recent_disasters || [];
  const recentRequests = data?.recent_requests || [];

  return (
    <div className="space-y-8">
      {/* Admin Top Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Emergency Response Live Console
            </h1>
            <Badge variant="Admin">HQ Admin Console</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time status synced with MySQL 8 &bull; Table aggregation metrics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
            title="Refresh database metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <Link
            to="/disasters?action=report"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Report Disaster</span>
          </Link>
          <Link
            to="/emergency-requests?action=request"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Emergency Help</span>
          </Link>
        </div>
      </div>

      {/* 5 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Disasters</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {counts.total_disasters ?? 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Recorded in database</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Disasters</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-rose-600 tracking-tight">
              {counts.active_disasters ?? 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Ongoing & Verified</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pending Requests</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <LifeBuoy className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-amber-600 tracking-tight">
              {counts.pending_requests ?? 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Awaiting dispatch</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Rescued Victims</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <HeartHandshake className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-emerald-600 tracking-tight">
              {counts.rescued_victims ?? 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Safely evacuated</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Available Teams</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-blue-600 tracking-tight">
              {counts.available_rescue_teams ?? 0}
              <span className="text-xs font-normal text-slate-400 ml-1">
                / {counts.total_rescue_teams ?? 0}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Trigger-managed status</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Disasters by Severity Level
              </h2>
              <p className="text-xs text-slate-500">SQL GROUP BY Severity Aggregation</p>
            </div>
          </div>
          <div className="h-64 w-full">
            {charts.severity_distribution && charts.severity_distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.severity_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="Severity" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {charts.severity_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.Severity] || '#2563eb'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No disaster severity data available
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Emergency Requests by Status
              </h2>
              <p className="text-xs text-slate-500">SQL GROUP BY Status Aggregation</p>
            </div>
          </div>
          <div className="h-64 w-full">
            {charts.request_status_distribution && charts.request_status_distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.request_status_distribution}
                    dataKey="count"
                    nameKey="Status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={45}
                    paddingAngle={3}
                  >
                    {charts.request_status_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No emergency request status data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Two Recent Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Recent Disaster Reports</h3>
              <p className="text-xs text-slate-500">Latest 5 reported incidents</p>
            </div>
            <Link to="/disasters" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              View all
            </Link>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-100 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Disaster</th>
                  <th className="py-2.5 px-4">Severity</th>
                  <th className="py-2.5 px-4">City</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentDisasters.length > 0 ? (
                  recentDisasters.map((d) => (
                    <tr key={d.DisasterID} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {d.DisasterType}
                        <div className="text-[11px] text-slate-500 truncate max-w-[140px]">{d.Location}</div>
                      </td>
                      <td className="py-3 px-4"><Badge variant={d.Severity}>{d.Severity}</Badge></td>
                      <td className="py-3 px-4 text-slate-600">{d.City}</td>
                      <td className="py-3 px-4"><Badge variant={d.Status}>{d.Status}</Badge></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-6 text-center text-slate-400">
                      No disaster reports found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Recent Emergency Requests</h3>
              <p className="text-xs text-slate-500">Live rescue assistance queue</p>
            </div>
            <Link to="/emergency-requests" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              View all
            </Link>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-100 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Priority</th>
                  <th className="py-2.5 px-4">Location</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentRequests.length > 0 ? (
                  recentRequests.map((r) => (
                    <tr key={r.RequestID} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {r.RequestType}
                        <div className="text-[11px] text-slate-500">{r.PeopleCount} people</div>
                      </td>
                      <td className="py-3 px-4"><Badge variant={r.Priority}>{r.Priority}</Badge></td>
                      <td className="py-3 px-4 text-slate-600 truncate max-w-[140px]">{r.Location}</td>
                      <td className="py-3 px-4"><Badge variant={r.Status}>{r.Status}</Badge></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-6 text-center text-slate-400">
                      No emergency requests found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
