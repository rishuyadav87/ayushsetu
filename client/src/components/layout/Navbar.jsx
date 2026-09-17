import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Bell, User, LogOut, Globe, Menu, X } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { notificationAPI } from '../../services/api';
import { getPagesForRole } from '../../utils/navigationCatalog';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = user ? getPagesForRole(user.role).filter(p => p.sidebar !== false) : [];

  useEffect(() => {
    if (!user) return undefined;
    const fetchNotifications = async () => {
      try {
        const res = await notificationAPI.getAll();
        setUnreadCount(res.data?.filter(n => !n.isRead)?.length || 0);
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    window.addEventListener('notifications:changed', fetchNotifications);
    return () => {
      clearInterval(interval);
      window.removeEventListener('notifications:changed', fetchNotifications);
    };
  }, [user, location.pathname]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      <nav className="bg-primary text-white shadow-md px-4 md:px-6 py-3 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          {user && (
            <button className="md:hidden" onClick={() => setMobileMenuOpen(true)}>
              <Menu size={24} />
            </button>
          )}
          <Link to={user ? `/${user.role}` : '/'} className="flex items-center gap-2">
            <span className="font-bold text-lg md:text-xl tracking-wider">AYUSH-SETU</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-4 md:gap-6">
          <button 
            onClick={toggleLanguage}
            className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium transition-colors"
            title="Toggle Language (English/Hindi)"
          >
            <Globe size={16} />
            <span>{language === 'en' ? 'EN' : 'हि'}</span>
          </button>

          {user && (
            <>
              <button onClick={() => navigate(`/${user.role}/notifications`)} className="hover:text-accent transition-colors relative" title="Notices">
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-secondary text-[10px] rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              
              <div className="flex items-center gap-2 md:gap-3">
                <div className="flex flex-col items-end hidden md:flex">
                  <span className="text-sm font-medium">{user.name || 'User'}</span>
                  <span className="text-xs text-green-200 capitalize">{user.role}</span>
                </div>
                <div className="bg-white text-primary rounded-full p-1.5 md:p-2">
                  <User size={18} className="md:w-5 md:h-5" />
                </div>
                <button onClick={logout} className="hover:text-secondary transition-colors ml-1" title="Logout">
                  <LogOut size={20} />
                </button>
              </div>
            </>
          )}
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-black/50 md:hidden flex flex-col">
          <div className="bg-white w-3/4 max-w-sm h-full flex flex-col animate-in slide-in-from-left">
            <div className="bg-primary text-white p-4 flex justify-between items-center">
              <span className="font-bold text-lg">Menu</span>
              <button onClick={() => setMobileMenuOpen(false)}><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 ${location.pathname === item.path ? 'bg-primary/10 text-primary font-bold' : ''}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-between items-center bg-gray-50">
               <div className="flex flex-col">
                  <span className="text-sm font-bold text-dark">{user?.name}</span>
                  <span className="text-xs text-gray-500 capitalize">{user?.role}</span>
               </div>
               <button onClick={logout} className="text-red-600 hover:text-red-800 p-2"><LogOut size={20} /></button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)}></div>
        </div>
      )}
    </>
  );
};

export default Navbar;
