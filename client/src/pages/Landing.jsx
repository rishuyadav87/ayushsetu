import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Briefcase, GraduationCap, Users, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import Footer from '../components/layout/Footer';

const Landing = () => {
  return (
    <div className="min-h-screen bg-light font-sans">
      {/* Navbar */}
      <nav className="bg-white/90 backdrop-blur-md fixed w-full z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="font-bold text-2xl text-primary tracking-wider">AYUSH-SETU</span>
          </div>
          <div className="hidden md:flex gap-8 font-medium text-gray-600">
            <a href="#about" className="hover:text-primary transition-colors">About</a>
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#impact" className="hover:text-primary transition-colors">Impact</a>
          </div>
          <div className="flex gap-4">
            <Link to="/login" className="px-5 py-2 rounded-lg text-primary font-medium hover:bg-primary/5 transition-colors">Login</Link>
            <Link to="/register" className="px-5 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30">Register</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="about" className="pt-32 pb-20 px-6 bg-gradient-to-br from-primary/5 via-light to-secondary/5">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-6">
            <ShieldCheck size={16} /> Empowering the AYUSH Ecosystem
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-dark mb-6 leading-tight">
            One Platform.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">One Ecosystem.</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Bridging the gap between AYUSH education and industry needs through skill intelligence, opportunities, and digital portfolios.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="px-8 py-4 rounded-xl bg-primary text-white font-bold text-lg hover:bg-primary/90 transition-all hover:scale-105 flex items-center justify-center gap-2 shadow-xl shadow-primary/30">
              Get Started <ArrowRight size={20} />
            </Link>
            <a href="#features" className="px-8 py-4 rounded-xl bg-white text-dark font-bold text-lg border border-gray-200 hover:border-primary/30 hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
              Explore Features
            </a>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 border-t border-gray-200 pt-10">
            {[
              { value: "500+", label: "Students Enrolled" },
              { value: "50+", label: "Institutions" },
              { value: "200+", label: "Opportunities" },
              { value: "5", label: "AYUSH Disciplines" }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl font-black text-primary mb-2">{stat.value}</div>
                <div className="text-sm text-gray-500 font-medium uppercase tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pillars Section */}
      <section id="features" className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-dark mb-4">Core Pillars of AYUSH-SETU</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Our platform is built on three foundational pillars designed to modernize and integrate the entire AYUSH community.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-10">
            {[
              { 
                icon: <BookOpen size={40} />, 
                title: "Skill Intelligence", 
                desc: "NSQF-aligned assessments to map capabilities, identify gaps, and provide personalized learning pathways.",
                color: "bg-indigo-50 text-indigo-600 border-indigo-100"
              },
              { 
                icon: <Briefcase size={40} />, 
                title: "Opportunity Hub", 
                desc: "AI-driven matchmaking connecting students with industry internships, jobs, and research collaborations.",
                color: "bg-indigo-50 text-indigo-600 border-indigo-100"
              },
              { 
                icon: <GraduationCap size={40} />, 
                title: "Digital Portfolio", 
                desc: "Verified credentialing system storing certifications, project work, and mentor endorsements in one place.",
                color: "bg-orange-50 text-orange-600 border-orange-100"
              }
            ].map((pillar, i) => (
              <div key={i} className={`p-8 rounded-2xl border transition-all hover:shadow-lg ${pillar.color} bg-white relative overflow-hidden group`}>
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-6 ${pillar.color}`}>
                  {pillar.icon}
                </div>
                <h3 className="text-xl font-bold text-dark mb-3">{pillar.title}</h3>
                <p className="text-gray-600 leading-relaxed">{pillar.desc}</p>
                <div className="mt-6 flex items-center gap-2 font-semibold text-sm cursor-pointer hover:underline">
                  Learn more <ArrowRight size={16} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stakeholders Section */}
      <section id="impact" className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-dark mb-4">Who is it for?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">A unified ecosystem serving all key stakeholders in the AYUSH sector.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                role: "Students",
                icon: <Users size={24} />,
                benefits: ["Skill assessments & gap analysis", "Access to internships & jobs", "Verified digital portfolio"]
              },
              {
                role: "Industry Partners",
                icon: <Briefcase size={24} />,
                benefits: ["Access to pre-assessed talent", "Post opportunities easily", "Collaborate on R&D projects"]
              },
              {
                role: "Academicians",
                icon: <BookOpen size={24} />,
                benefits: ["Mentor students effectively", "Access Faculty Development Programs", "Drive research initiatives"]
              },
              {
                role: "Institutions",
                icon: <ShieldCheck size={24} />,
                benefits: ["Track student readiness", "Monitor placement outcomes", "Align curriculum with industry"]
              }
            ].map((stakeholder, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex gap-6">
                <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  {stakeholder.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-dark mb-4">{stakeholder.role}</h3>
                  <ul className="space-y-2">
                    {stakeholder.benefits.map((benefit, j) => (
                      <li key={j} className="flex items-center gap-2 text-gray-600">
                        <CheckCircle2 size={16} className="text-secondary" /> {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;
