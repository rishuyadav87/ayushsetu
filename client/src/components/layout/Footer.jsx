import React from 'react';
import { toast } from 'react-hot-toast';

const Footer = () => {
  return (
    <footer className="bg-dark text-white py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-xl font-bold mb-4 text-accent">AYUSH-SETU</h3>
          <p className="text-gray-400 text-sm">One Platform, One Ecosystem for the AYUSH community bridging the gap between education and industry.</p>
        </div>
        <div>
          <h4 className="font-semibold mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><a href="#" className="hover:text-white transition">About Us</a></li>
            <li><a href="#" className="hover:text-white transition">Contact</a></li>
            <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4">Empowering AYUSH Professionals</h4>
          <p className="text-sm text-gray-400">The premier portal for Academia–Industry collaboration, driving skill mapping, internships, and high-value placements.</p>
          <div className="mt-4 flex items-center gap-3">
            <span className="text-sm text-gray-500 font-bold">AYUSH-SETU</span>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-700 mt-8 pt-4 text-center text-xs text-gray-500">
        &copy; {new Date().getFullYear()} AYUSH-SETU. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
