import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import Layout from '../components/Layout';
import { Fuel, DollarSign, Plus, AlertCircle, Check } from 'lucide-react';

const FuelExpenses = () => {
  const { user, hasAccess } = useContext(AuthContext);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);

  // Log Fuel Form
  const [fuelVehicleId, setFuelVehicleId] = useState('');
  const [fuelLiters, setFuelLiters] = useState('');
  const [fuelCost, setFuelCost] = useState('');
  const [fuelDate, setFuelDate] = useState('');

  // Add Expense Form
  const [expVehicleId, setExpVehicleId] = useState('');
  const [expTripId, setExpTripId] = useState('');
  const [expToll, setExpToll] = useState('');
  const [expOther, setExpOther] = useState('');
  const [expDate, setExpDate] = useState('');

  // Forms view toggles
  const [showFuelForm, setShowFuelForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const canWrite = hasAccess('fuelExpense', 'write');
  const canRead = hasAccess('fuelExpense', 'read');

  const fetchData = async () => {
    try {
      setLoading(true);
      const fuelRes = await api.get('/fuel-logs');
      setFuelLogs(fuelRes.data);

      const expRes = await api.get('/expenses');
      setExpenses(expRes.data);

      if (canWrite) {
        const vehRes = await api.get('/trips/eligible-vehicles');
        setVehicles(vehRes.data);

        const tripsRes = await api.get('/trips');
        setTrips(tripsRes.data);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load operational cost records.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canRead) {
      fetchData();
    }
  }, [canRead, canWrite]);

  const handleFuelSubmit = async (e) => {
    e.preventDefault();
    try {
      setErrorMsg('');
      setSuccessMsg('');
      await api.post('/fuel-logs', {
        vehicle_id: fuelVehicleId,
        liters: Number(fuelLiters),
        cost: Number(fuelCost),
        date: fuelDate || undefined
      });
      setSuccessMsg('Fuel log added successfully!');
      setFuelVehicleId('');
      setFuelLiters('');
      setFuelCost('');
      setFuelDate('');
      setShowFuelForm(false);
      fetchData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error adding fuel log');
    }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    try {
      setErrorMsg('');
      setSuccessMsg('');
      await api.post('/expenses', {
        vehicle_id: expVehicleId,
        trip_id: expTripId || undefined,
        toll: Number(expToll || 0),
        other: Number(expOther || 0),
        date: expDate || undefined
      });
      setSuccessMsg('Operational expense logged successfully!');
      setExpVehicleId('');
      setExpTripId('');
      setExpToll('');
      setExpOther('');
      setExpDate('');
      setShowExpenseForm(false);
      fetchData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error adding expense');
    }
  };

  // Sum total operational cost (Fuel + Maintenance costs)
  const totalFuelCost = fuelLogs.reduce((sum, item) => sum + Number(item.cost || 0), 0);
  const totalMaintCost = expenses.reduce((sum, item) => sum + Number(item.maintenance_cost || 0), 0);
  const totalOperationalCost = totalFuelCost + totalMaintCost;

  if (!canRead) {
    return (
      <Layout>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h2>
          <p className="text-slate-500">You do not have access to view Fuel & Expenses.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Fuel & Expenses</h1>
          <p className="text-slate-500 mt-1">Manage toll costs, fuel consumption logs, and operational overheads.</p>
        </div>
        {canWrite && (
          <div className="flex gap-3">
            <button
              onClick={() => { setShowFuelForm(true); setShowExpenseForm(false); }}
              className="flex items-center px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-700/20 transition-all"
            >
              <Fuel className="h-4 w-4 mr-2" />
              + Log Fuel
            </button>
            <button
              onClick={() => { setShowExpenseForm(true); setShowFuelForm(false); }}
              className="flex items-center px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-slate-900 hover:bg-slate-850 shadow-md shadow-slate-900/10 transition-all"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              + Add Expense
            </button>
          </div>
        )}
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

      {/* Fuel Form Modal */}
      {showFuelForm && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900">Log Fuel Fill-Up</h3>
              <button onClick={() => setShowFuelForm(false)} className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100">
                &times;
              </button>
            </div>
            <form onSubmit={handleFuelSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Vehicle</label>
                <select
                  required
                  value={fuelVehicleId}
                  onChange={e => setFuelVehicleId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="">Choose a vehicle...</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.registration_number}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Liters</label>
                <input
                  type="number"
                  required
                  min="0.1"
                  step="any"
                  placeholder="Liters filled"
                  value={fuelLiters}
                  onChange={e => setFuelLiters(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Total Fuel Cost ($)</label>
                <input
                  type="number"
                  required
                  min="0.1"
                  step="any"
                  placeholder="Total cost in $"
                  value={fuelCost}
                  onChange={e => setFuelCost(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Date</label>
                <input
                  type="date"
                  value={fuelDate}
                  onChange={e => setFuelDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowFuelForm(false)}
                  className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-500 hover:bg-slate-55"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-700/20"
                >
                  Log Fuel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Form Modal */}
      {showExpenseForm && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900">Log Operational Expense</h3>
              <button onClick={() => setShowExpenseForm(false)} className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100">
                &times;
              </button>
            </div>
            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Vehicle</label>
                <select
                  required
                  value={expVehicleId}
                  onChange={e => setExpVehicleId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="">Choose a vehicle...</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.registration_number}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Linked Trip (Optional)</label>
                <select
                  value={expTripId}
                  onChange={e => setExpTripId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="">None / Not linked</option>
                  {trips.map(t => (
                    <option key={t.id} value={t.id}>{t.source} → {t.destination} ({t.status})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Toll Cost ($)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Toll cost in $"
                  value={expToll}
                  onChange={e => setExpToll(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Other Cost ($)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Other miscellaneous costs"
                  value={expOther}
                  onChange={e => setExpOther(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Date</label>
                <input
                  type="date"
                  value={expDate}
                  onChange={e => setExpDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowExpenseForm(false)}
                  className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-500 hover:bg-slate-55"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-700/20"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Two Tables Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Fuel Logs */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
            <Fuel className="h-5 w-5 mr-2 text-emerald-500" />
            Fuel Logs
          </h2>
          
          {loading ? (
            <div className="text-center py-8 text-slate-500 text-sm">Loading logs...</div>
          ) : fuelLogs.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm border-2 border-dashed border-slate-200 rounded-xl">
              No fuel consumption recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 pr-4">Vehicle</th>
                    <th className="pb-3 px-4">Date</th>
                    <th className="pb-3 px-4">Liters</th>
                    <th className="pb-3 pl-4 text-right">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {fuelLogs.map(log => (
                    <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-all">
                      <td className="py-4 pr-4 font-semibold text-slate-800">{log.vehicle_name}</td>
                      <td className="py-4 px-4 text-slate-500">{new Date(log.date).toLocaleDateString()}</td>
                      <td className="py-4 px-4 font-medium text-slate-700">{log.liters} L</td>
                      <td className="py-4 pl-4 text-right font-bold text-slate-900">${Number(log.cost).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Other Expenses */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-emerald-500" />
            Other Operational Expenses
          </h2>

          {loading ? (
            <div className="text-center py-8 text-slate-500 text-sm">Loading expenses...</div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm border-2 border-dashed border-slate-200 rounded-xl">
              No other expenses logged yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 pr-4">Route / Vehicle</th>
                    <th className="pb-3 px-4">Toll</th>
                    <th className="pb-3 px-4">Other</th>
                    <th className="pb-3 px-4">Maint. (linked)</th>
                    <th className="pb-3 pl-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(exp => (
                    <tr key={exp.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-all">
                      <td className="py-4 pr-4">
                        {exp.source && exp.destination ? (
                          <p className="font-semibold text-slate-800">{exp.source} → {exp.destination}</p>
                        ) : (
                          <p className="text-slate-400 italic">General overhead</p>
                        )}
                        <p className="text-xs text-slate-400">{exp.vehicle_name} • {new Date(exp.date).toLocaleDateString()}</p>
                      </td>
                      <td className="py-4 px-4 text-slate-650 font-medium">${exp.toll.toFixed(2)}</td>
                      <td className="py-4 px-4 text-slate-650 font-medium">${exp.other.toFixed(2)}</td>
                      <td className="py-4 px-4 text-slate-400">${exp.maintenance_cost.toFixed(2)}</td>
                      <td className="py-4 pl-4 text-right font-bold text-slate-900">${exp.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Operational cost calculation footer card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-600/10 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="text-lg font-bold">Total Operational Cost (Auto)</h3>
          <p className="text-emerald-100 text-xs mt-1">Calculated dynamically: Total Fuel Costs + Cumulative Maintenance release expenses.</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-emerald-100 font-semibold uppercase tracking-wider">Live System Expenses</p>
          <p className="text-3xl font-extrabold mt-0.5">${totalOperationalCost.toFixed(2)}</p>
        </div>
      </div>
    </Layout>
  );
};

export default FuelExpenses;
