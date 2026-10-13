import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  RefreshCw, 
  AlertTriangle, 
  Eye, 
  Calendar, 
  MapPin, 
  User, 
  Phone,
  CheckCircle,
  XCircle,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../services/AuthContext';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';

export function DisastersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const [disasters, setDisasters] = useState([]);
  const [filterOptions, setFilterOptions] = useState({ cities: [], types: [], severities: [], statuses: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(searchParams.get('action') === 'report');
  const [detailDisaster, setDetailDisaster] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Create Form State
  const [formData, setFormData] = useState({
    disaster_type: '',
    severity: 'Moderate',
    location: '',
    city: '',
    description: '',
    latitude: '',
    longitude: ''
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  // Status Update State
  const [statusUpdating, setStatusUpdating] = useState(false);

  const fetchDisasters = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.disasters.list({
        search: searchQuery,
        type: selectedType,
        city: selectedCity,
        severity: selectedSeverity,
        status: selectedStatus
      });
      setDisasters(res.disasters || []);
      if (res.filters) setFilterOptions(res.filters);
    } catch (err) {
      setError(err.message || 'Failed to load disasters.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisasters();
  }, [selectedType, selectedCity, selectedSeverity, selectedStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDisasters();
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateSubmitting(true);
    setCreateError('');
    try {
      await api.disasters.create({
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null
      });
      setIsCreateOpen(false);
      setFormData({
        disaster_type: '',
        severity: 'Moderate',
        location: '',
        city: '',
        description: '',
        latitude: '',
        longitude: ''
      });
      // Clear URL parameter if present
      searchParams.delete('action');
      setSearchParams(searchParams);
      fetchDisasters();
    } catch (err) {
      setCreateError(err.message || 'Failed to submit disaster report.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleViewDetail = async (id) => {
    try {
      const res = await api.disasters.get(id);
      setDetailDisaster(res.disaster);
      setIsDetailOpen(true);
    } catch (err) {
      alert('Error fetching details: ' + err.message);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    setStatusUpdating(true);
    try {
      await api.disasters.updateStatus(id, newStatus);
      if (detailDisaster && detailDisaster.DisasterID === id) {
        setDetailDisaster(prev => ({ ...prev, Status: newStatus }));
      }
      fetchDisasters();
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    } finally {
      setStatusUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Disaster Incidents Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time multi-criteria filtering across DISASTER table records
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDisasters}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm"
            title="Refresh Table"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Report New Disaster</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by disaster type, location, city, or description..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Search
          </button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100">
          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-blue-600"
          >
            <option value="">All Disaster Types</option>
            {filterOptions.types?.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* City Filter */}
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-blue-600"
          >
            <option value="">All Cities</option>
            {filterOptions.cities?.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Severity Filter */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-blue-600"
          >
            <option value="">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Moderate">Moderate</option>
            <option value="Low">Low</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-blue-600"
          >
            <option value="">All Statuses</option>
            <option value="Reported">Reported</option>
            <option value="Verified">Verified</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Disasters Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-100 font-semibold">
              <tr>
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Disaster Type</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Location & City</th>
                <th className="py-3 px-4">Reported By</th>
                <th className="py-3 px-4">Report Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {disasters.length > 0 ? (
                disasters.map((d) => (
                  <tr key={d.DisasterID} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400">#{d.DisasterID}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {d.DisasterType}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={d.Severity}>{d.Severity}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{d.City}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[200px]">{d.Location}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{d.ReportedByName}</div>
                      <div className="text-[11px] text-slate-400">{d.ReporterPhone}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {d.ReportedAt}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={d.Status}>{d.Status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleViewDetail(d.DisasterID)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    {loading ? 'Executing search query...' : 'No disaster incidents matching the selected criteria.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Disaster Report */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Report Disaster Incident"
      >
        {createError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
            {createError}
          </div>
        )}
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Disaster Type *
              </label>
              <input
                type="text"
                value={formData.disaster_type}
                onChange={(e) => setFormData({ ...formData, disaster_type: e.target.value })}
                placeholder="e.g. Flash Flood, Earthquake, Landslide"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Severity Level *
              </label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              >
                <option value="Low">Low - Minor disruptions</option>
                <option value="Moderate">Moderate - Structural risk</option>
                <option value="High">High - Widespread hazard</option>
                <option value="Critical">Critical - Immediate life threat</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                City *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Mumbai, Delhi, Chennai"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Specific Location / Landmark *
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Kurla West, Near Station"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description & Current Observations
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe rising water levels, blocked access routes, trapped residents, etc."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Latitude (Optional)
              </label>
              <input
                type="number"
                step="0.000001"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                placeholder="19.0760"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Longitude (Optional)
              </label>
              <input
                type="number"
                step="0.000001"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                placeholder="72.8777"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50"
            >
              {createSubmitting ? 'Recording Report...' : 'Submit Disaster Report'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: View Details & Status Update */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Disaster Incident Details"
        maxWidth="max-w-2xl"
      >
        {detailDisaster && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
              <div>
                <span className="text-xs font-mono text-slate-400">ID #{detailDisaster.DisasterID}</span>
                <h3 className="text-lg font-bold text-slate-900">{detailDisaster.DisasterType}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {detailDisaster.Location}, {detailDisaster.City}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={detailDisaster.Severity}>{detailDisaster.Severity}</Badge>
                <Badge variant={detailDisaster.Status}>{detailDisaster.Status}</Badge>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Description
              </h4>
              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                {detailDisaster.Description || 'No description provided.'}
              </p>
            </div>

            {/* Reporting Citizen details */}
            <div className="grid grid-cols-2 gap-4 p-3 rounded-lg border border-slate-100 bg-slate-50 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Reported By Citizen</span>
                <span className="font-semibold text-slate-800">{detailDisaster.ReportedByName}</span>
                <span className="text-slate-500 block">{detailDisaster.ReporterPhone}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Report Timestamp</span>
                <span className="font-semibold text-slate-800">{detailDisaster.ReportedAt}</span>
              </div>
            </div>

            {/* Admin status update control */}
            {user?.user_type === 'Admin' && (
              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200/60">
                <h4 className="text-xs font-semibold text-slate-900 mb-2">
                  Administrator Status Control
                </h4>
                <div className="flex flex-wrap items-center gap-2">
                  {['Reported', 'Verified', 'Ongoing', 'Resolved', 'Closed'].map((s) => (
                    <button
                      key={s}
                      disabled={statusUpdating || detailDisaster.Status === s}
                      onClick={() => handleUpdateStatus(detailDisaster.DisasterID, s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        detailDisaster.Status === s
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Associated Emergency Requests */}
            <div>
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Emergency Requests for this Disaster ({detailDisaster.emergency_requests?.length || 0})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {detailDisaster.emergency_requests && detailDisaster.emergency_requests.length > 0 ? (
                  detailDisaster.emergency_requests.map((req) => (
                    <div key={req.RequestID} className="p-2.5 rounded-lg border border-slate-100 bg-white flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-800 mr-2">{req.RequestType}</span>
                        <span className="text-slate-500">({req.PeopleCount} people) &bull; {req.Location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={req.Priority}>{req.Priority}</Badge>
                        <Badge variant={req.Status}>{req.Status}</Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No emergency requests attached to this disaster.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
