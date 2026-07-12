import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import Layout from '../components/Layout';
import { Wrench, CheckCircle, Plus, AlertCircle, Clock, Check } from 'lucide-react';

const Maintenance = () => {
  const { user, hasAccess } = useContext(AuthContext);
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  // Form State
  const [vehicleId, setVehicleId] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [date, setDate] = useState('');

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const canWrite = hasAccess('maintenance', 'write');
  const canRead = hasAccess('maintenance', 'read');

  const fetchLogsAndVehicles = async () => {
    try {
      setLoading(true);
      const logsRes = await api.get('/maintenance');
      setLogs(logsRes.data);

      if (canWrite) {
        // Fetch all vehicles to select for maintenance
        const vehRes = await api.get('/trips/eligible-vehicles'); // Using vehicle list endpoint or direct fetch
        setVehicles(vehRes.data);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load maintenance logs.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canRead) {
      fetchLogsAndVehicles();
    }
  }, [canRead, canWrite]);

  const handleCreateLog = async (e) => {
    e.preventDefault();
    try {
      setErrorMsg('');
      setSuccessMsg('');

      const body = {
        vehicle_id: vehicleId,
        description,
        cost: cost ? Number(cost) : null,
        date: date || new Date().toISOString().split('T')[0]
      };

      await api.post('/maintenance', body);
      setSuccessMsg('Vehicle placed in maintenance log successfully!');

      setVehicleId('');
      setDescription('');
      setCost('');
      setDate('');

      fetchLogsAndVehicles();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error creating maintenance log');
    }
  };

  const handleCloseLog = async (logId) => {
    try {
      setErrorMsg('');
      setSuccessMsg('');
      await api.patch(`/maintenance/${logId}/close`);
      setSuccessMsg('Maintenance log closed. Vehicle is now Available.');
      fetchLogsAndVehicles();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error closing maintenance log');
    }
  };

  if (!canRead) {
    return (
      <Layout>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h2>
          <p className="text-slate-500">You do not have access to view Maintenance Logs.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Maintenance & Services</h1>
        <p className="text-slate-500 mt-1">Track vehicle health logs, ongoing repairs, and total servicing costs.</p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start">
          <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
          <span className="text-sm font-medium">{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start">
          <Check className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Create Service Log Form */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-fit">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
            <Wrench className="h-5 w-5 mr-2 text-emerald-500" />
            Log Service Record
          </h2>

          {canWrite ? (
            <form onSubmit={handleCreateLog} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Vehicle</label>
                <select
                  required
                  value={vehicleId}
                  onChange={e => setVehicleId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm bg-white transition-all"
                >
                  <option value="">Choose a vehicle...</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.registration_number} ({v.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Service Type / Description</label>
                <textarea
                  required
                  rows="3"
                  placeholder="e.g. Engine oil change, brake pad replacement..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Cost ($)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 250"
                  value={cost}
                  onChange={e => setCost(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center px-4 py-3 rounded-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-700/20 transition-all"
              >
                <Plus className="h-5 w-5 mr-2" />
                Place In Shop
              </button>
            </form>
          ) : (
            <p className="text-slate-500 text-sm text-center py-8">
              Only **Fleet Managers** are authorized to log new maintenance services.
            </p>
          )}
        </div>

        {/* Right Side: Service Log Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-emerald-500" />
              Service Logs
            </h2>

            {loading ? (
              <div className="text-center py-12 text-slate-500 text-sm">Loading logs...</div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm border-2 border-dashed border-slate-200 rounded-xl">
                No maintenance history recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 pr-4">Vehicle</th>
                      <th className="pb-3 px-4">Service Details</th>
                      <th className="pb-3 px-4">Cost & Date</th>
                      <th className="pb-3 px-4">Status</th>
                      {canWrite && <th className="pb-3 pl-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id} className="border-b border-slate-100 text-sm hover:bg-slate-50/50 transition-all">
                        <td className="py-4 pr-4 font-bold text-slate-800">{log.vehicle_name}</td>
                        <td className="py-4 px-4 text-slate-600 max-w-xs truncate" title={log.description}>
                          {log.description}
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-semibold text-slate-700">${log.cost || '0.00'}</p>
                          <p className="text-xs text-slate-400">{new Date(log.date).toLocaleDateString()}</p>
                        </td>
                        <td className="py-4 px-4">
                          {log.status === 'Open' ? (
                            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center w-fit">
                              <Clock className="h-3.5 w-3.5 mr-1" />
                              In Shop
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center w-fit">
                              <Check className="h-3.5 w-3.5 mr-1" />
                              Closed
                            </span>
                          )}
                        </td>
                        {canWrite && (
                          <td className="py-4 pl-4 text-right">
                            {log.status === 'Open' && (
                              <button
                                onClick={() => handleCloseLog(log.id)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-semibold text-xs transition-all"
                              >
                                Close & Release
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-400 italic">
              ℹ️ In Shop vehicles are removed from the dispatch pool.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Maintenance;
