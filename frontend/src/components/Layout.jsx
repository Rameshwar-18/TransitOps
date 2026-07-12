import React, { useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  MapPin, 
  Wrench, 
  Fuel, 
  BarChart3, 
  LogOut, 
  User as UserIcon, 
  Truck
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout, hasAccess } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      show: true
    },
    {
      name: 'Trip Dispatcher',
      path: '/trips',
      icon: MapPin,
      show: hasAccess('trip', 'read')
    },
    {
      name: 'Maintenance Logs',
      path: '/maintenance',
      icon: Wrench,
      show: hasAccess('maintenance', 'read')
    },
    {
      name: 'Fuel & Expenses',
      path: '/fuel-expenses',
      icon: Fuel,
      show: hasAccess('fuelExpense', 'read')
    },
    {
      name: 'Reports & Analytics',
      path: '/analytics',
      icon: BarChart3,
      show: hasAccess('analytics', 'read')
    }
  ];

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'FleetManager':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Dispatcher':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'FinancialAnalyst':
        return 'bg-violet-50 text-violet-700 border-violet-200';
      case 'SafetyOfficer':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="flex h-screen bg-slate-55 flex-row overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col justify-between shadow-xl z-20">
        <div>
          {/* Brand Logo */}
          <div className="h-16 flex items-center px-6 bg-slate-950 border-b border-slate-800">
            <Truck className="h-8 w-8 text-emerald-400 mr-3" />
            <span className="text-xl font-bold tracking-tight text-white">TransitOps</span>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 px-4 space-y-1">
            {navItems.filter(item => item.show).map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
              <UserIcon className="h-5 w-5 text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-200 truncate">{user?.name}</p>
              <span className={`inline-block mt-0.5 px-2 py-0.5 text-[10px] font-bold border rounded-full ${getRoleBadgeColor(user?.role)}`}>
                {user?.role}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-100 border border-slate-800 hover:border-slate-700 transition-all"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-slate-50 relative">
        <div className="max-w-7xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
