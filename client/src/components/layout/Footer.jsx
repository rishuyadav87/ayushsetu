import React from 'react';
import toast from 'react-hot-toast';

const Footer = () => {
  const handleComingSoon = (e) => {
    e.preventDefault();
    toast('This feature is coming soon!', { icon: '🚧' });
  };

  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="text-white text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-primary">AYUSH</span>-SETU
          </div>
          <p className="text-sm">Connecting AYUSH talent with industry opportunities through AI-powered skills mapping.</p>
        </div>
        <div>
          <h4 className="text-white font-medium mb-4">Platform</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" onClick={handleComingSoon} className="hover:text-white transition">About Us</a></li>
            <li><a href="#" onClick={handleComingSoon} className="hover:text-white transition">Contact</a></li>
            <li><a href="#" onClick={handleComingSoon} className="hover:text-white transition">Privacy Policy</a></li>
            <li><a href="#" onClick={handleComingSoon} className="hover:text-white transition">Terms of Service</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4">Contact</h4>
          <p className="text-sm text-gray-400">Email: support@ayush-setu.gov.in</p>
          <p className="text-sm text-gray-400 mt-2">Ministry of Ayush, Government of India</p>
        </div>
      </div>
      <div className="border-t border-gray-700 mt-8 pt-4 text-center text-xs text-gray-500">
        &copy; {new Date().getFullYear()} AYUSH-SETU. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
