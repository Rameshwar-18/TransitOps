import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import Layout from '../components/Layout';
import { Play, Check, X, Plus, AlertCircle, MapPin, Navigation, Dumbbell } from 'lucide-react';

const Trips = () => {
  const { user, hasAccess } = useContext(AuthContext);
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);

  // Form State
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [cargoWeight, setCargoWeight] = useState('');
  const [plannedDistance, setPlannedDistance] = useState('');
  const [revenue, setRevenue] = useState('');

  // Complete Modal State
  const [completingTripId, setCompletingTripId] = useState(null);
  const [actualDistance, setActualDistance] = useState('');
  const [fuelConsumed, setFuelConsumed] = useState('');
  const [fuelCost, setFuelCost] = useState('');

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const canWrite = hasAccess('trip', 'write');
  const canRead = hasAccess('trip', 'read');

  const fetchTripsAndDropdowns = async () => {
    try {
      setLoading(true);
      const tripsRes = await api.get('/trips');
      setTrips(tripsRes.data);

      if (tripsRes.data.length > 0) {
        setSelectedTrip(tripsRes.data[0]);
      }

      if (canWrite) {
        const vehiclesRes = await api.get('/trips/eligible-vehicles');
        setVehicles(vehiclesRes.data);

        const driversRes = await api.get('/trips/eligible-drivers');
        setDrivers(driversRes.data);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load trips or eligible resource data.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canRead) {
      fetchTripsAndDropdowns();
    }
  }, [canRead, canWrite]);

  const selectedVehicle = vehicles.find(v => v.id === vehicleId);
  const isOverweight = selectedVehicle && Number(cargoWeight) > Number(selectedVehicle.max_load_capacity);
  const overage = selectedVehicle && isOverweight ? Number(cargoWeight) - Number(selectedVehicle.max_load_capacity) : 0;

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    if (isOverweight) return;

    try {
      setErrorMsg('');
      setSuccessMsg('');
      const body = {
        source,
        destination,
        vehicle_id: vehicleId,
        driver_id: driverId,
        cargo_weight: Number(cargoWeight),
        planned_distance: plannedDistance ? Number(plannedDistance) : null,
        revenue: revenue ? Number(revenue) : null
      };

      await api.post('/trips', body);
      setSuccessMsg('Draft trip created successfully!');
      
      // Reset form
      setSource('');
      setDestination('');
      setVehicleId('');
      setDriverId('');
      setCargoWeight('');
      setPlannedDistance('');
      setRevenue('');

      fetchTripsAndDropdowns();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error creating trip');
    }
  };

  const handleDispatch = async (tripId) => {
    try {
      setErrorMsg('');
      setSuccessMsg('');
      await api.patch(`/trips/${tripId}/dispatch`);
      setSuccessMsg('Trip dispatched successfully!');
      fetchTripsAndDropdowns();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error dispatching trip');
    }
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    try {
      setErrorMsg('');
      setSuccessMsg('');
      await api.patch(`/trips/${completingTripId}/complete`, {
        actual_distance: Number(actualDistance),
        fuel_consumed: Number(fuelConsumed),
        fuel_cost: fuelCost ? Number(fuelCost) : undefined
      });
      setSuccessMsg('Trip completed successfully and fuel log inserted!');
      setCompletingTripId(null);
      setActualDistance('');
      setFuelConsumed('');
      setFuelCost('');
      fetchTripsAndDropdowns();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error completing trip');
    }
  };

  const handleCancel = async (tripId) => {
    try {
      setErrorMsg('');
      setSuccessMsg('');
      await api.patch(`/trips/${tripId}/cancel`);
      setSuccessMsg('Trip cancelled.');
      fetchTripsAndDropdowns();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error cancelling trip');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Draft':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-800 border border-slate-200">Draft</span>;
      case 'Dispatched':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">Dispatched</span>;
      case 'Completed':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Completed</span>;
      case 'Cancelled':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">Cancelled</span>;
      default:
        return null;
    }
  };

  if (!canRead) {
    return (
      <Layout>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h2>
          <p className="text-slate-500">You do not have access to view Trip Management.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Trip Dispatcher</h1>
        <p className="text-slate-500 mt-1">Manage draft dispatches, live trip completions, and vehicle assignments.</p>
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

      {/* Stepper (Selected/Latest Trip Status) */}
      {selectedTrip && (
        <div className="mb-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-800">
              Trip Details: <span className="text-emerald-600 font-semibold">{selectedTrip.source} → {selectedTrip.destination}</span>
            </h3>
            {getStatusBadge(selectedTrip.status)}
          </div>
          
          {/* Progress Stepper bar */}
          <div className="relative flex items-center justify-between w-full mt-6">
            <div className="absolute left-0 right-0 top-1/2 h-1 bg-slate-200 -translate-y-1/2 z-0" />
            
            {['Draft', 'Dispatched', 'Completed', 'Cancelled'].map((step, idx) => {
              const stepIndex = ['Draft', 'Dispatched', 'Completed', 'Cancelled'].indexOf(selectedTrip.status);
              const isActive = step === selectedTrip.status;
              const isPast = ['Draft', 'Dispatched', 'Completed'].indexOf(step) < stepIndex;
              const isCancelled = selectedTrip.status === 'Cancelled' && step === 'Cancelled';
              
              // Cancelled step shouldn't be green/blue
              let stepBg = 'bg-white border-slate-350 text-slate-400';
              if (isActive) {
                stepBg = isCancelled ? 'bg-rose-600 text-white ring-4 ring-rose-100 border-rose-600' : 'bg-emerald-600 text-white ring-4 ring-emerald-100 border-emerald-600';
              } else if (isPast && selectedTrip.status !== 'Cancelled') {
                stepBg = 'bg-emerald-100 text-emerald-700 border-emerald-200';
              }

              return (
                <div key={step} className="flex flex-col items-center z-10">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-semibold text-sm transition-all ${stepBg}`}>
                    {isPast && selectedTrip.status !== 'Cancelled' ? <Check className="h-4 w-4" /> : idx + 1}
                  </div>
                  <span className={`text-xs font-semibold mt-2 ${isActive ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Create Trip Form */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-fit">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
            <Navigation className="h-5 w-5 mr-2 text-emerald-500" />
            Create Dispatch Draft
          </h2>

          {canWrite ? (
            <form onSubmit={handleCreateTrip} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Source</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Warehouse A"
                  value={source}
                  onChange={e => setSource(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Destination</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hub B"
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Select Vehicle</label>
                <select
                  required
                  value={vehicleId}
                  onChange={e => setVehicleId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm bg-white transition-all"
                >
                  <option value="">Choose a vehicle...</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.registration_number} — {v.max_load_capacity} kg limit
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Select Driver</label>
                <select
                  required
                  value={driverId}
                  onChange={e => setDriverId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm bg-white transition-all"
                >
                  <option value="">Choose a driver...</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Cargo Weight (kg)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 400"
                  value={cargoWeight}
                  onChange={e => setCargoWeight(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all"
                />
              </div>

              {/* Overage Warning Block */}
              {isOverweight && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start text-amber-800">
                  <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5 text-amber-600" />
                  <div className="text-sm">
                    <p className="font-bold">Overweight Warning</p>
                    <p className="mt-1 text-xs">
                      This vehicle capacity is **{selectedVehicle.max_load_capacity} kg**. You entered **{cargoWeight} kg**, which exceeds the capacity by **{overage} kg**.
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Planned Distance (km)</label>
                <input
                  type="number"
                  placeholder="e.g. 150"
                  value={plannedDistance}
                  onChange={e => setPlannedDistance(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Estimated Revenue ($)</label>
                <input
                  type="number"
                  placeholder="e.g. 800"
                  value={revenue}
                  onChange={e => setRevenue(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isOverweight}
                className="w-full flex items-center justify-center px-4 py-3 rounded-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-700/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Draft Trip
              </button>
            </form>
          ) : (
            <p className="text-slate-500 text-sm text-center py-8">
              Only **Dispatchers** are authorized to create new trips.
            </p>
          )}
        </div>

        {/* Right Side: Live Board List */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-emerald-500" />
              Live Board
            </h2>

            {loading ? (
              <div className="text-center py-12 text-slate-500 text-sm">Loading board...</div>
            ) : trips.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm border-2 border-dashed border-slate-200 rounded-xl">
                No trips found in database. Create one!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 pr-4">Trip Details</th>
                      <th className="pb-3 px-4">Vehicle & Driver</th>
                      <th className="pb-3 px-4">Cargo / Revenue</th>
                      <th className="pb-3 px-4">Status</th>
                      {canWrite && <th className="pb-3 pl-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {trips.map(trip => (
                      <tr 
                        key={trip.id}
                        onClick={() => setSelectedTrip(trip)}
                        className={`border-b border-slate-100 text-sm hover:bg-slate-50/50 cursor-pointer transition-all ${
                          selectedTrip?.id === trip.id ? 'bg-slate-50 font-medium' : ''
                        }`}
                      >
                        <td className="py-4 pr-4">
                          <p className="font-bold text-slate-800">{trip.source} → {trip.destination}</p>
                          {trip.planned_distance && (
                            <p className="text-xs text-slate-400 mt-0.5">Planned: {trip.planned_distance} km</p>
                          )}
                          {trip.completed_at && (
                            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Completed</p>
                          )}
                        </td>
                        <td className="py-4 px-4 text-slate-600">
                          <p className="font-semibold text-slate-700">{trip.vehicle_name}</p>
                          <p className="text-xs text-slate-400">{trip.driver_name}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-slate-800 font-medium">{trip.cargo_weight} kg</p>
                          {trip.revenue && <p className="text-xs text-slate-500">${trip.revenue}</p>}
                        </td>
                        <td className="py-4 px-4">{getStatusBadge(trip.status)}</td>
                        {canWrite && (
                          <td className="py-4 pl-4 text-right" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-end gap-1.5">
                              {trip.status === 'Draft' && (
                                <>
                                  <button
                                    onClick={() => handleDispatch(trip.id)}
                                    className="p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-all"
                                    title="Dispatch Trip"
                                  >
                                    <Play className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleCancel(trip.id)}
                                    className="p-2 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-all"
                                    title="Cancel Trip"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </>
                              )}

                              {trip.status === 'Dispatched' && (
                                <>
                                  <button
                                    onClick={() => setCompletingTripId(trip.id)}
                                    className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-all"
                                    title="Complete Trip"
                                  >
                                    <Check className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleCancel(trip.id)}
                                    className="p-2 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-all"
                                    title="Cancel Trip"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Completion Modal */}
      {completingTripId && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900">Complete Trip & Log Details</h3>
              <button 
                onClick={() => setCompletingTripId(null)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCompleteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Actual Distance Traveled (km)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 155"
                  value={actualDistance}
                  onChange={e => setActualDistance(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Fuel Consumed (Liters)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 15"
                  value={fuelConsumed}
                  onChange={e => setFuelConsumed(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Fuel Cost ($ - optional)</label>
                <input
                  type="number"
                  placeholder="e.g. 45"
                  value={fuelCost}
                  onChange={e => setFuelCost(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setCompletingTripId(null)}
                  className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-500 hover:bg-slate-55"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-700/20"
                >
                  Confirm Completion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Trips;
