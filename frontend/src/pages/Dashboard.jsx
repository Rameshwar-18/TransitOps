import React from 'react';
import { ChevronDown } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';

const Dashboard = () => {
  return (
    <MainLayout>
      <div className="pb-12 text-black">
        <div className="flex justify-between items-end mb-8 border-b-4 border-black pb-4">
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mix-blend-darken">
            FLEET<span className="text-neo-blue">_STATUS</span>
          </h2>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <span className="font-mono text-sm font-bold bg-black text-white px-3 py-1">/// FILTERS</span>
          <div className="flex items-center bg-white border-2 border-black px-3 py-1.5 cursor-hover hover:bg-neo-yellow transition-colors shadow-[4px_4px_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]">
            <span className="font-mono text-sm font-bold mr-2">TYPE:</span>
            <span className="font-bold uppercase">All</span>
            <ChevronDown className="h-4 w-4 ml-2" strokeWidth={3} />
          </div>
          <div className="flex items-center bg-white border-2 border-black px-3 py-1.5 cursor-hover hover:bg-neo-green transition-colors shadow-[4px_4px_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]">
            <span className="font-mono text-sm font-bold mr-2">STATUS:</span>
            <span className="font-bold uppercase">All</span>
            <ChevronDown className="h-4 w-4 ml-2" strokeWidth={3} />
          </div>
          <div className="flex items-center bg-white border-2 border-black px-3 py-1.5 cursor-hover hover:bg-neo-pink transition-colors shadow-[4px_4px_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]">
            <span className="font-mono text-sm font-bold mr-2">REGION:</span>
            <span className="font-bold uppercase">All</span>
            <ChevronDown className="h-4 w-4 ml-2" strokeWidth={3} />
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-neo-blue border-4 border-black p-6 shadow-hard hover:shadow-hard-xl hover:-translate-y-1 hover:-translate-x-1 transition-all">
            <div className="font-mono text-xs font-bold uppercase mb-2 bg-white inline-block px-1 border border-black">Active_Vehicles</div>
            <div className="text-5xl font-black tracking-tighter">53</div>
          </div>
          <div className="bg-neo-green border-4 border-black p-6 shadow-hard hover:shadow-hard-xl hover:-translate-y-1 hover:-translate-x-1 transition-all">
            <div className="font-mono text-xs font-bold uppercase mb-2 bg-white inline-block px-1 border border-black">Available_Vehicles</div>
            <div className="text-5xl font-black tracking-tighter">42</div>
          </div>
          <div className="bg-neo-orange border-4 border-black p-6 shadow-hard hover:shadow-hard-xl hover:-translate-y-1 hover:-translate-x-1 transition-all">
            <div className="font-mono text-xs font-bold uppercase mb-2 bg-white inline-block px-1 border border-black">In_Maintenance</div>
            <div className="text-5xl font-black tracking-tighter">05</div>
          </div>
          <div className="bg-neo-yellow border-4 border-black p-6 shadow-hard hover:shadow-hard-xl hover:-translate-y-1 hover:-translate-x-1 transition-all">
            <div className="font-mono text-xs font-bold uppercase mb-2 bg-white inline-block px-1 border border-black">Active_Trips</div>
            <div className="text-5xl font-black tracking-tighter">18</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Recent Trips */}
          <div className="col-span-2">
            <h3 className="text-2xl font-black uppercase mb-4 tracking-tighter inline-block bg-neo-pink px-2 border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">RECENT_TRIPS</h3>
            <div className="bg-white border-4 border-black shadow-hard overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-black text-white font-mono text-sm uppercase">
                  <tr>
                    <th className="py-3 px-4">Trip_ID</th>
                    <th className="py-3 px-4">Vehicle</th>
                    <th className="py-3 px-4">Driver</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">ETA</th>
                  </tr>
                </thead>
                <tbody className="font-bold divide-y-2 divide-black">
                  <tr className="hover:bg-gray-100 transition-colors">
                    <td className="py-4 px-4 font-mono">TR001</td>
                    <td className="py-4 px-4">VAN-05</td>
                    <td className="py-4 px-4">Alex</td>
                    <td className="py-4 px-4">
                      <span className="bg-neo-blue border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] px-3 py-1 text-xs uppercase font-black">On Trip</span>
                    </td>
                    <td className="py-4 px-4 font-mono">45 min</td>
                  </tr>
                  <tr className="hover:bg-gray-100 transition-colors">
                    <td className="py-4 px-4 font-mono">TR002</td>
                    <td className="py-4 px-4">TRK-12</td>
                    <td className="py-4 px-4">Sam</td>
                    <td className="py-4 px-4">
                      <span className="bg-neo-green border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] px-3 py-1 text-xs uppercase font-black">Completed</span>
                    </td>
                    <td className="py-4 px-4 font-mono">--</td>
                  </tr>
                  <tr className="hover:bg-gray-100 transition-colors">
                    <td className="py-4 px-4 font-mono">TR003</td>
                    <td className="py-4 px-4">ATAT-03</td>
                    <td className="py-4 px-4">Priya</td>
                    <td className="py-4 px-4">
                      <span className="bg-neo-yellow border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] px-3 py-1 text-xs uppercase font-black">Dispatched</span>
                    </td>
                    <td className="py-4 px-4 font-mono">1h 10m</td>
                  </tr>
                  <tr className="hover:bg-gray-100 transition-colors opacity-70">
                    <td className="py-4 px-4 font-mono">TR004</td>
                    <td className="py-4 px-4">--</td>
                    <td className="py-4 px-4">--</td>
                    <td className="py-4 px-4">
                      <span className="bg-gray-300 border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] px-3 py-1 text-xs uppercase font-black">Draft</span>
                    </td>
                    <td className="py-4 px-4 font-mono">Awaiting vehicle</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Vehicle Status */}
          <div>
            <h3 className="text-2xl font-black uppercase mb-4 tracking-tighter inline-block bg-neo-purple px-2 border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]">STATUS_LOG</h3>
            <div className="bg-white border-4 border-black p-6 shadow-hard space-y-6">
              <div>
                <div className="flex justify-between font-mono text-sm font-bold uppercase mb-2">
                  <span>Available</span>
                  <span>60%</span>
                </div>
                <div className="w-full border-2 border-black h-4 bg-gray-200">
                  <div className="bg-neo-green h-full border-r-2 border-black" style={{ width: '60%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between font-mono text-sm font-bold uppercase mb-2">
                  <span>On_Trip</span>
                  <span>25%</span>
                </div>
                <div className="w-full border-2 border-black h-4 bg-gray-200">
                  <div className="bg-neo-blue h-full border-r-2 border-black" style={{ width: '25%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between font-mono text-sm font-bold uppercase mb-2">
                  <span>In_Shop</span>
                  <span>10%</span>
                </div>
                <div className="w-full border-2 border-black h-4 bg-gray-200">
                  <div className="bg-neo-orange h-full border-r-2 border-black" style={{ width: '10%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between font-mono text-sm font-bold uppercase mb-2">
                  <span>Retired</span>
                  <span>5%</span>
                </div>
                <div className="w-full border-2 border-black h-4 bg-gray-200">
                  <div className="bg-neo-pink h-full border-r-2 border-black" style={{ width: '5%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
