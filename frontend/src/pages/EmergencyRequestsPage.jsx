import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  LifeBuoy, 
  Plus, 
  RefreshCw, 
  Users, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  Filter,
  UserCheck
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../services/AuthContext';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';

export function EmergencyRequestsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const [requests, setRequests] = useState([]);
  const [rescueTeams, setRescueTeams] = useState([]);
  const [disasters, setDisasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(searchParams.get('action') === 'request');
  const [assignModalReq, setAssignModalReq] = useState(null);
  const [selectedTeamId, setSelectedTeamId] = useState('');

  // Create Form State
  const [formData, setFormData] = useState({
    request_type: 'Medical',
    priority: 'High',
    people_count: 1,
    location: '',
    description: '',
    disaster_id: ''
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.emergency.list({
        status: statusFilter,
        priority: priorityFilter
      });
      setRequests(res.requests || []);
    } catch (err) {
      setError(err.message || 'Failed to load emergency requests.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuxiliaryData = async () => {
    try {
      const [teamsRes, disastersRes] = await Promise.all([
        api.rescueTeams.list(),
        api.disasters.list()
      ]);
      setRescueTeams(teamsRes.teams || []);
      setDisasters(disastersRes.disasters || []);
      if (disastersRes.disasters?.length > 0 && !formData.disaster_id) {
        setFormData(prev => ({ ...prev, disaster_id: disastersRes.disasters[0].DisasterID }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, priorityFilter]);

  useEffect(() => {
    fetchAuxiliaryData();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateSubmitting(true);
    setCreateError('');
    try {
      await api.emergency.create({
        ...formData,
        people_count: parseInt(formData.people_count, 10)
      });
      setIsCreateOpen(false);
      setFormData({
        request_type: 'Medical',
        priority: 'High',
        people_count: 1,
        location: '',
        description: '',
        disaster_id: disasters[0]?.DisasterID || ''
      });
      searchParams.delete('action');
      setSearchParams(searchParams);
      fetchRequests();
    } catch (err) {
      setCreateError(err.message || 'Request failed to submit.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleAssignTeamSubmit = async (e) => {
    e.preventDefault();
    if (!assignModalReq) return;
    try {
      const teamId = selectedTeamId ? parseInt(selectedTeamId, 10) : null;
      await api.emergency.assignTeam(assignModalReq.RequestID, teamId);
      setAssignModalReq(null);
      fetchRequests();
      // Refresh rescue team status
      const teamsRes = await api.rescueTeams.list();
      setRescueTeams(teamsRes.teams || []);
    } catch (err) {
      alert('Failed to assign team: ' + err.message);
    }
  };

  const handleStatusChange = async (requestId, newStatus) => {
    try {
      await api.emergency.updateStatus(requestId, newStatus);
      fetchRequests();
      // Refresh rescue team status (Triggers may update availability)
      const teamsRes = await api.rescueTeams.list();
      setRescueTeams(teamsRes.teams || []);
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Emergency Assistance Requests
            </h1>
            <Badge variant={user?.user_type === 'Admin' ? 'Admin' : 'Citizen'}>
              {user?.user_type === 'Admin' ? 'Admin View: All Requests' : 'Citizen View: My Requests'}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-isolated access &bull; Automatic rescue team availability management via MySQL triggers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchRequests}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm"
            title="Refresh Requests"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Submit Emergency Request</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5" />
          Filter:
        </span>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-blue-600"
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending Dispatch</option>
          <option value="Assigned">Assigned</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-blue-600"
        >
          <option value="">All Priorities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-100 font-semibold">
              <tr>
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Request Type</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">People Count</th>
                <th className="py-3 px-4">Location & Incident</th>
                <th className="py-3 px-4">Assigned Rescue Team</th>
                <th className="py-3 px-4">Status</th>
                {user?.user_type === 'Admin' && (
                  <th className="py-3 px-4 text-right">Admin Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.length > 0 ? (
                requests.map((r) => (
                  <tr key={r.RequestID} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400">#{r.RequestID}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block">{r.RequestType}</span>
                      <span className="text-[11px] text-slate-500">{r.RequestTime}</span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={r.Priority}>{r.Priority}</Badge>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {r.PeopleCount} {r.PeopleCount === 1 ? 'person' : 'persons'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{r.Location}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[220px]">
                        {r.DisasterType} ({r.DisasterCity})
                      </div>
                      {r.Description && (
                        <div className="text-[11px] text-slate-400 italic truncate max-w-[220px] mt-0.5">
                          "{r.Description}"
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {r.TeamName ? (
                        <div>
                          <div className="font-medium text-slate-900">{r.TeamName}</div>
                          <div className="text-[11px] text-slate-500">
                            {r.LeaderName} &bull; {r.TeamPhone}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={r.Status}>{r.Status}</Badge>
                    </td>

                    {/* Admin Team Assignment & Status change */}
                    {user?.user_type === 'Admin' && (
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setAssignModalReq(r);
                              setSelectedTeamId(r.RescueTeamID ? String(r.RescueTeamID) : '');
                            }}
                            className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200/60 transition-colors"
                          >
                            Assign Team
                          </button>

                          <select
                            value={r.Status}
                            onChange={(e) => handleStatusChange(r.RequestID, e.target.value)}
                            className="px-2 py-1 text-xs rounded border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-blue-600"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Assigned">Assigned</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={user?.user_type === 'Admin' ? 8 : 7} className="py-12 text-center text-slate-400">
                    {loading ? 'Querying emergency request table...' : 'No emergency requests recorded.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Emergency Request */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Submit Emergency Request"
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
                Request Type *
              </label>
              <select
                value={formData.request_type}
                onChange={(e) => setFormData({ ...formData, request_type: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              >
                <option value="Medical">Medical Aid & First Aid</option>
                <option value="Rescue">Evacuation & Boat Rescue</option>
                <option value="Food">Food Ration Packets</option>
                <option value="Water">Clean Drinking Water</option>
                <option value="Transport">Emergency Transport</option>
                <option value="Shelter">Temporary Shelter Bed</option>
                <option value="Other">Other Emergency</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Priority Level *
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              >
                <option value="Critical">Critical - Immediate Danger to Life</option>
                <option value="High">High - Urgent Assistance Needed</option>
                <option value="Medium">Medium - Required Within Hours</option>
                <option value="Low">Low - Non-life-threatening</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Number of People in Danger * (Min: 1)
              </label>
              <input
                type="number"
                min="1"
                value={formData.people_count}
                onChange={(e) => setFormData({ ...formData, people_count: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                required
              />
              <span className="text-[10px] text-slate-400">Trigger 1 enforces PeopleCount &ge; 1</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Associated Disaster *
              </label>
              <select
                value={formData.disaster_id}
                onChange={(e) => setFormData({ ...formData, disaster_id: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                required
              >
                {disasters.map((d) => (
                  <option key={d.DisasterID} value={d.DisasterID}>
                    {d.DisasterType} - {d.City}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Exact Stranded Location / Landmark *
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. 2nd Floor, Bldg 14, Opposite State Bank, Kurla"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Detailed Distress Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="State medical issues, age of victims, current water level, access obstacles..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
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
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50"
            >
              {createSubmitting ? 'Transmitting Request...' : 'Dispatch Request Now'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Admin Rescue Team Assignment */}
      <Modal
        isOpen={!!assignModalReq}
        onClose={() => setAssignModalReq(null)}
        title={`Assign Rescue Team to Request #${assignModalReq?.RequestID}`}
      >
        <form onSubmit={handleAssignTeamSubmit} className="space-y-4">
          <div>
            <p className="text-xs text-slate-600 mb-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="font-semibold text-slate-800">Location:</span> {assignModalReq?.Location}<br />
              <span className="font-semibold text-slate-800">Priority:</span> {assignModalReq?.Priority} &bull; {assignModalReq?.PeopleCount} people
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Rescue Battalion / Team
            </label>
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            >
              <option value="">-- Unassigned (Clear assignment) --</option>
              {rescueTeams.map((team) => (
                <option key={team.RescueTeamID} value={team.RescueTeamID}>
                  {team.TeamName} [{team.Status}] - {team.Specialization} ({team.MembersCount} members)
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1.5">
              &bull; Trigger 2 will automatically update the selected team status to <strong>'Busy'</strong> upon assignment.<br />
              &bull; If reassigning, the previous team will safely return to <strong>'Available'</strong> if no other active requests remain.
            </p>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAssignModalReq(null)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm"
            >
              Confirm Assignment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
