import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import Layout from '../components/Layout';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  MapPin, 
  Wrench, 
  Fuel, 
  BarChart3, 
  Info, 
  TrendingUp, 
  Clock 
} from 'lucide-react';

const Dashboard = () => {
  const { user, hasAccess } = useContext(AuthContext);
  const [stats, setStats] = useState({
    tripsCount: 0,
    maintCount: 0,
    operationalCost: 0,
    activeDispatches: 0
  });
  const [recentTrips, setRecentTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        let trips = [];
        let maint = [];
        let opCost = 0;

        if (hasAccess('trip', 'read')) {
          const tripsRes = await api.get('/trips');
          trips = tripsRes.data;
          setRecentTrips(trips.slice(0, 4));
        }

        if (hasAccess('maintenance', 'read')) {
          const maintRes = await api.get('/maintenance');
          maint = maintRes.data;
        }

        if (hasAccess('analytics', 'read')) {
          const analyticsRes = await api.get('/analytics');
          opCost = analyticsRes.data.summary.operationalCost;
        }

        const activeDispatches = trips.filter(t => t.status === 'Dispatched').length;

        setStats({
          tripsCount: trips.length,
          maintCount: maint.length,
          operationalCost: opCost,
          activeDispatches
        });
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard summary:', err);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const getModulePermissionStatus = (moduleName, title, desc, icon shadow) => {
    const Icon = icon;
    const canRead = hasAccess(moduleName, 'read');
    const canWrite = hasAccess(moduleName, 'write');

    let permissionLabel = 'No Access';
    let labelColor = 'bg-slate-100 text-slate-600 border-slate-200';
    if (canWrite) {
      permissionLabel = 'Full Access (Read & Write)';
      labelColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (canRead) {
      permissionLabel = 'Read Only';
      labelColor = 'bg-blue-50 text-blue-700 border-blue-200';
    }

    return (
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-start space-x-4">
        <div className={`p-3 rounded-xl bg-slate-50 text-slate-600`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 text-sm">{title}</p>
          <p className="text-slate-400 text-xs mt-0.5 truncate">{desc}</p>
          <span className={`inline-block mt-3 px-2 py-0.5 text-[10px] font-bold border rounded-full ${labelColor}`}>
            {permissionLabel}
          </span>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">System Overview</h1>
        <p className="text-slate-500 mt-1">Welcome back, {user?.name}. Here is a summary of TransitOps.</p>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Registered Trips</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{stats.tripsCount}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Dispatches</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-2 text-blue-600">{stats.activeDispatches}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active/Closed Maintenance Logs</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{stats.maintCount}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fleet Operational Cost</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-2 text-emerald-600">${Number(stats.operationalCost).toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Module Permissions Status */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-emerald-500" />
              Your Module Access Permissions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getModulePermissionStatus('trip', 'Trip Dispatcher', 'Manage route dispatches & driver assignments', MapPin)}
              {getModulePermissionStatus('maintenance', 'Maintenance & Services', 'Track vehicle servicing & shop logs', Wrench)}
              {getModulePermissionStatus('fuelExpense', 'Fuel & Expense Tracker', 'Log operational overheads and fuels', Fuel)}
              {getModulePermissionStatus('analytics', 'Reports & Analytics', 'Examine aggregates, ROI and revenues', BarChart3)}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 flex items-start text-slate-700">
            <Info className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5 text-slate-500" />
            <span className="text-xs leading-relaxed">
              **Note on Role Switching**: Access levels are controlled dynamically by the system's middleware. To test features owned by other roles, use the **Sign Out** button in the sidebar to log back in with another account.
            </span>
          </div>
        </div>

        {/* Recent Board Activity */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-emerald-500" />
              Live Board Activity
            </h2>
            
            {loading ? (
              <p className="text-sm text-slate-500">Loading activity...</p>
            ) : recentTrips.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6">No recent trip activities found.</p>
            ) : (
              <div className="space-y-4">
                {recentTrips.map(trip => (
                  <div key={trip.id} className="flex justify-between items-start text-sm border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
                    <div>
                      <p className="font-semibold text-slate-800">{trip.source} → {trip.destination}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{trip.vehicle_name} • {trip.driver_name}</p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      trip.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' :
                      trip.status === 'Dispatched' ? 'bg-blue-50 text-blue-700' :
                      trip.status === 'Cancelled' ? 'bg-rose-50 text-rose-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {trip.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {hasAccess('trip', 'read') && (
            <div className="mt-6 border-t border-slate-100 pt-4">
              <Link to="/trips" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center justify-center">
                Go to Trip Dispatcher &rarr;
              </Link>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
