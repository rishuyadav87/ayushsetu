import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Home, BookOpen, Briefcase, Award, FileText, Users, FileSearch,
  Activity, GraduationCap, BarChart2, Bell, Layers, Upload, ShieldAlert, Radio, TrendingUp,
} from 'lucide-react';
import { getPagesForRole } from '../../utils/navigationCatalog';

const ICONS = {
  home: Home, book: BookOpen, briefcase: Briefcase, award: Award, file: FileText, users: Users,
  search: FileSearch, activity: Activity, graduation: GraduationCap, chart: BarChart2,
  bell: Bell, layers: Layers, upload: Upload, shield: ShieldAlert, radio: Radio, trending: TrendingUp,
};

const Sidebar = () => {
  const { user } = useAuth();
  const navItems = getPagesForRole(user?.role).filter(p => p.sidebar !== false);

  return (
    <aside className="w-64 bg-white border-r border-gray-100 h-full overflow-y-auto hidden md:flex flex-col shadow-soft">
      <div className="py-6 flex flex-col gap-1 px-3 flex-1">
        {navItems.map((item) => {
          const Icon = ICONS[item.icon] || Home;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path.split('/').length === 2}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-200'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-indigo-600'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {!isActive && (
                    <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-5 transition-opacity" />
                  )}
                  <Icon size={18} className={`shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : ''}`} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Bottom User Card */}
      <div className="p-3 border-t border-gray-100">
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-3 border border-indigo-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-indigo-600 capitalize font-medium">{user?.role?.toLowerCase() || 'Member'}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
