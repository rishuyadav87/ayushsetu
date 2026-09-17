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
    <aside className="w-64 bg-white border-r border-gray-200 h-full overflow-y-auto hidden md:block">
      <div className="py-6 flex flex-col gap-2 px-4">
        {navItems.map((item) => {
          const Icon = ICONS[item.icon] || Home;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path.split('/').length === 2}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                }`
              }
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
};

export default Sidebar;
