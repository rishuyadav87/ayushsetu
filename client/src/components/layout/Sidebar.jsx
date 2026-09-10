import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Home, BookOpen, Briefcase, Award, 
  FileText, Users, FileSearch, Settings,
  Activity, GraduationCap, BarChart2
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();

  const getNavItems = () => {
    switch (user?.role) {
      case 'student':
        return [
          { name: 'Dashboard', path: '/student', icon: <Home size={20} /> },
          { name: 'Skill Profile', path: '/student/skills', icon: <Award size={20} /> },
          { name: 'Assessments', path: '/student/assessments', icon: <FileText size={20} /> },
          { name: 'Opportunities', path: '/student/opportunities', icon: <Briefcase size={20} /> },
          { name: 'Portfolio', path: '/student/portfolio', icon: <BookOpen size={20} /> },
          { name: 'Applications', path: '/student/applications', icon: <Activity size={20} /> },
        ];
      case 'industry':
        return [
          { name: 'Dashboard', path: '/industry', icon: <Home size={20} /> },
          { name: 'Post Opportunity', path: '/industry/post-opportunity', icon: <FileText size={20} /> },
          { name: 'Manage Opportunities', path: '/industry/manage-opportunities', icon: <Briefcase size={20} /> },
          { name: 'Candidate Search', path: '/industry/candidate-search', icon: <Users size={20} /> },
        ];
      case 'academician':
        return [
          { name: 'Dashboard', path: '/academician', icon: <Home size={20} /> },
          { name: 'Mentoring', path: '/academician/mentoring', icon: <Users size={20} /> },
          { name: 'Research Hub', path: '/academician/research-hub', icon: <FileSearch size={20} /> },
          { name: 'FDP Access', path: '/academician/fdp-access', icon: <GraduationCap size={20} /> },
        ];
      case 'institution':
        return [
          { name: 'Dashboard', path: '/institution', icon: <Home size={20} /> },
          { name: 'Readiness', path: '/institution/readiness', icon: <BarChart2 size={20} /> },
          { name: 'Outcomes', path: '/institution/outcomes', icon: <Activity size={20} /> },
          { name: 'Students', path: '/institution/students', icon: <Users size={20} /> },
        ];
      case 'admin':
        return [
          { name: 'Dashboard', path: '/admin', icon: <Home size={20} /> },
          { name: 'User Management', path: '/admin/users', icon: <Users size={20} /> },
          { name: 'Skill Taxonomy', path: '/admin/taxonomy', icon: <BookOpen size={20} /> },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-full overflow-y-auto hidden md:block">
      <div className="py-6 flex flex-col gap-2 px-4">
        {navItems.map((item) => (
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
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
