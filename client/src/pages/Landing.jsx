import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Briefcase, GraduationCap, Users, ShieldCheck, ArrowRight, CheckCircle2, Sparkles, Zap, Globe } from 'lucide-react';
import Footer from '../components/layout/Footer';

const Landing = () => {
  return (
    <div className="min-h-screen bg-[#0A0F1E] font-sans text-white overflow-x-hidden">
      
      {/* Floating Orbs Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-indigo-600/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-purple-600/20 blur-[120px] animate-pulse" style={{animationDelay:'1.5s'}} />
        <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] rounded-full bg-blue-500/10 blur-[80px]" />
      </div>

      {/* Glassmorphism Navbar */}
      <nav className="fixed w-full z-50 border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="font-black text-xl tracking-wider bg-gradient-to-r from-white to-indigo-300 bg-clip-text text-transparent">AYUSH-SETU</span>
          </div>
          <div className="hidden md:flex gap-8 font-medium text-gray-400">
            <a href="#about" className="hover:text-white transition-colors">About</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#impact" className="hover:text-white transition-colors">Impact</a>
          </div>
          <div className="flex gap-3">
            <Link to="/login" className="px-5 py-2 rounded-lg text-gray-300 font-medium hover:text-white hover:bg-white/10 transition-all">Login</Link>
            <Link to="/register" className="px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-900/50">Register</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="about" className="relative pt-36 pb-28 px-6 z-10">
        <div className="max-w-7xl mx-auto text-center">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/40 bg-indigo-500/10 text-indigo-300 font-semibold text-sm mb-8 backdrop-blur-sm">
            <Sparkles size={14} className="animate-pulse" />
            The Premier AYUSH Career Ecosystem
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            <span className="text-white">One Platform.</span>
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              One Ecosystem.
            </span>
          </h1>
          <p className="text-xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            Bridging the gap between AYUSH education and industry needs through skill intelligence, AI-powered opportunities, and verified digital portfolios.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <Link
              to="/register"
              className="group px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg hover:from-indigo-500 hover:to-purple-500 transition-all hover:scale-105 flex items-center justify-center gap-2 shadow-2xl shadow-indigo-900/60"
            >
              Get Started Free <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#features"
              className="px-8 py-4 rounded-xl border border-white/20 text-white font-bold text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2 backdrop-blur-sm"
            >
              Explore Platform
            </a>
          </div>

          {/* 3D Floating Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: "500+", label: "Students Enrolled", icon: "👩‍⚕️" },
              { value: "50+", label: "Institutions", icon: "🏛️" },
              { value: "200+", label: "Opportunities", icon: "💼" },
              { value: "5", label: "AYUSH Disciplines", icon: "🌿" }
            ].map((stat, i) => (
              <div
                key={i}
                className="group relative bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md hover:bg-white/10 hover:-translate-y-2 transition-all duration-500 cursor-default"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-3xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-1">{stat.value}</div>
                <div className="text-xs text-gray-500 font-medium uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-28 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-500/40 bg-purple-500/10 text-purple-300 text-sm font-semibold mb-6">
              <Zap size={14} /> Core Pillars
            </div>
            <h2 className="text-4xl font-black text-white mb-4">Built for the <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">AYUSH Community</span></h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Three foundational pillars designed to modernize and integrate the entire AYUSH ecosystem.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <BookOpen size={32} />,
                gradient: "from-indigo-600 to-blue-600",
                glow: "indigo",
                title: "Skill Intelligence",
                desc: "NSQF-aligned assessments to map capabilities, identify gaps, and generate personalized AI-driven learning pathways.",
                features: ["AI Gap Analysis", "NSQF Level Mapping", "Personalized Roadmap"]
              },
              {
                icon: <Briefcase size={32} />,
                gradient: "from-purple-600 to-pink-600",
                glow: "purple",
                title: "Opportunity Hub",
                desc: "AI-driven matchmaking connecting AYUSH students with internships, jobs, research, and FDP collaborations.",
                features: ["AI Matchmaking", "Industry Partnerships", "Real-time Tracking"]
              },
              {
                icon: <GraduationCap size={32} />,
                gradient: "from-emerald-600 to-teal-600",
                glow: "emerald",
                title: "Digital Portfolio",
                desc: "Verified credentialing system for certifications, project work, and endorsed skills — powered by blockchain verification.",
                features: ["Verified Credentials", "Mentor Endorsements", "Digital Showcase"]
              }
            ].map((pillar, i) => (
              <div
                key={i}
                className="group relative bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md hover:border-white/20 transition-all duration-500 hover:-translate-y-2 overflow-hidden"
              >
                {/* Background gradient on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${pillar.gradient} opacity-0 group-hover:opacity-5 transition-opacity rounded-3xl`} />
                
                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${pillar.gradient} flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                  {pillar.icon}
                </div>

                <h3 className="text-xl font-bold text-white mb-3">{pillar.title}</h3>
                <p className="text-gray-400 leading-relaxed mb-6 text-sm">{pillar.desc}</p>
                
                <ul className="space-y-2">
                  {pillar.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-gray-400">
                      <CheckCircle2 size={14} className="text-indigo-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who Is It For Section */}
      <section id="impact" className="relative py-28 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/40 bg-indigo-500/10 text-indigo-300 text-sm font-semibold mb-6">
              <Globe size={14} /> Ecosystem
            </div>
            <h2 className="text-4xl font-black text-white mb-4">Who is it <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Built For?</span></h2>
            <p className="text-gray-400 max-w-2xl mx-auto">A unified ecosystem serving all key stakeholders in the AYUSH sector.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                role: "Students",
                icon: <Users size={22} />,
                gradient: "from-indigo-600 to-blue-600",
                benefits: ["AI-powered skill assessments & gap analysis", "Access to 200+ internships & job opportunities", "Verified digital portfolio with endorsements"]
              },
              {
                role: "Industry Partners",
                icon: <Briefcase size={22} />,
                gradient: "from-purple-600 to-pink-600",
                benefits: ["Access to pre-assessed, verified AYUSH talent", "Post opportunities to thousands of students", "Collaborate on R&D projects easily"]
              },
              {
                role: "Academicians",
                icon: <BookOpen size={22} />,
                gradient: "from-emerald-600 to-teal-600",
                benefits: ["Mentor students with structured tracking tools", "Access Faculty Development Programs (FDPs)", "Drive collaborative research initiatives"]
              },
              {
                role: "Institutions",
                icon: <ShieldCheck size={22} />,
                gradient: "from-orange-600 to-red-600",
                benefits: ["Track cohort readiness with visual dashboards", "Monitor placement outcomes in real-time", "Align curriculum with industry demand data"]
              }
            ].map((s, i) => (
              <div
                key={i}
                className="group relative bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md hover:border-white/20 transition-all duration-500 flex gap-6 overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform`}>
                  {s.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">{s.role}</h3>
                  <ul className="space-y-3">
                    {s.benefits.map((b, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-gray-400">
                        <CheckCircle2 size={14} className="text-indigo-400 shrink-0 mt-0.5" /> {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative py-20 px-6 z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-12 overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.04%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4 relative">Ready to transform the AYUSH ecosystem?</h2>
            <p className="text-indigo-200 mb-8 relative">Join thousands of students, academicians, and industry partners already on AYUSH-SETU.</p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-indigo-700 font-bold text-lg hover:bg-indigo-50 transition-all hover:scale-105 shadow-2xl relative"
            >
              Join the Platform <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      <Footer dark={true} />
    </div>
  );
};

export default Landing;
