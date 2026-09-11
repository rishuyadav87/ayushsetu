import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Bell, User, LogOut, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { notificationAPI } from '../../services/api';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const [unreadCount, setUnreadCount] = useState(3); // Default fallback

  useEffect(() => {
    if (user) {
      const fetchNotifications = async () => {
        try {
          const res = await notificationAPI.getAll();
          const unread = res.data?.filter(n => !n.isRead)?.length || 0;
          setUnreadCount(unread);
        } catch (err) {
          console.error("Failed to fetch notifications", err);
        }
      };
      fetchNotifications();
    }
  }, [user]);

  return (
    <nav className="bg-primary text-white shadow-md px-6 py-3 flex justify-between items-center sticky top-0 z-50">
      <Link to={user ? `/${user.role}` : '/'} className="flex items-center gap-2">
        <span className="font-bold text-xl tracking-wider">AYUSH-SETU</span>
      </Link>
      
      <div className="flex items-center gap-6">
        <button 
          onClick={toggleLanguage}
          className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full text-sm font-medium transition-colors"
          title="Toggle Language (English/Hindi)"
        >
          <Globe size={16} />
          <span>{language === 'en' ? '🇮🇳 EN' : '🇮🇳 हि'}</span>
        </button>

        {user && (
          <>
            <button onClick={() => toast('Feature coming soon!', { icon: '🚧' })} className="hover:text-accent transition-colors relative">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-secondary text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end hidden md:flex">
                <span className="text-sm font-medium">{user.name || 'User'}</span>
                <span className="text-xs text-green-200 capitalize">{user.role}</span>
              </div>
              <div className="bg-white text-primary rounded-full p-2">
                <User size={20} />
              </div>
              <button onClick={logout} className="hover:text-secondary transition-colors ml-2" title="Logout">
                <LogOut size={20} />
              </button>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
