import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import Layout from '../components/Layout';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Fuel, BarChart3, ShieldAlert, Sparkles, DollarSign, Percent } from 'lucide-react';

const Analytics = () => {
  const { hasAccess } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const canRead = hasAccess('analytics', 'read');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/analytics');
      setData(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load analytics data.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canRead) {
      fetchAnalytics();
    }
  }, [canRead]);

  if (!canRead) {
    return (
      <Layout>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h2>
          <p className="text-slate-500">You do not have access to view Reports & Analytics.</p>
        </div>
      </Layout>
    );
  }

  const summary = data?.summary || {
    fuelEfficiency: '0.00',
    utilization: '0.0',
    operationalCost: 0,
    roi: '0.0'
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Reports & Analytics</h1>
        <p className="text-slate-500 mt-1">Real-time performance aggregates, efficiency reports, and financial metrics.</p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start">
          <ShieldAlert className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
          <span className="text-sm font-medium">{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-24 text-slate-500 text-sm">Computing analytics metrics...</div>
      ) : (
        <>
          {/* 4 KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Fuel Efficiency */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fuel Efficiency</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-1.5">{summary.fuelEfficiency} <span className="text-sm font-normal text-slate-400">km/l</span></p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Fuel className="h-6 w-6" />
              </div>
            </div>

            {/* Fleet Utilization */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fleet Utilization</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-1.5">{summary.utilization}%</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Sparkles className="h-6 w-6" />
              </div>
            </div>

            {/* Operational Cost */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Operational Cost</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-1.5">${Number(summary.operationalCost).toFixed(2)}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>

            {/* Vehicle ROI */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fleet ROI</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-1.5">{summary.roi}%</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                <Percent className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Monthly Revenue Bar Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-base font-bold text-slate-800 mb-6 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-emerald-500" />
                Monthly Revenue Trend
              </h2>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.monthlyRevenue || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="Revenue ($)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Costliest Vehicles Horizontal Bar Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-base font-bold text-slate-800 mb-6 flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-rose-500" />
                Top Costliest Vehicles (Fuel + Maintenance)
              </h2>
              <div className="h-80 w-full">
                {data?.topCostliestVehicles && data.topCostliestVehicles.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                    No cost history logged yet.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={data?.topCostliestVehicles || []}
                      margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} width={80} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} />
                      <Bar dataKey="cost" fill="#f43f5e" radius={[0, 4, 4, 0]} name="Total Cost ($)" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
};

export default Analytics;
