import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Briefcase, BookOpen, Building, ChevronRight, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });
  
  const { register } = useAuth();

  const roles = [
    { id: 'student', title: 'Student', icon: <User size={32} />, desc: 'Learn, assess skills, find opportunities' },
    { id: 'industry', title: 'Industry Partner', icon: <Briefcase size={32} />, desc: 'Post jobs, find qualified candidates' },
    { id: 'academician', title: 'Academician', icon: <BookOpen size={32} />, desc: 'Mentor, collaborate on research' },
    { id: 'institution', title: 'Institution', icon: <Building size={32} />, desc: 'Track outcomes, manage students' },
  ];

  const handleNext = () => {
    setLocalError('');
    setStep(step + 1);
  };
  const handleBack = () => {
    setLocalError('');
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLocalError('');
    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: role.toUpperCase()
      });
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-3xl">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Join AYUSH-SETU
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Create your account to connect with the ecosystem
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-3xl">
        <div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10">
          
          {localError && (
            <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg flex items-center text-sm">
              <AlertCircle size={18} className="mr-2" />
              {localError}
            </div>
          )}

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= s ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {step > s ? <Check size={16} /> : s}
                  </div>
                  <span className="text-xs mt-2 text-gray-500">
                    {s === 1 ? 'Role' : s === 2 ? 'Basic Info' : 'Details'}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-2 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Step 1: Role Selection */}
          {step === 1 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Select your role</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roles.map((r) => (
                  <div 
                    key={r.id}
                    onClick={() => setRole(r.id)}
                    className={`cursor-pointer border-2 rounded-xl p-6 flex flex-col items-center text-center transition-all ${
                      role === r.id ? 'border-primary bg-primary/5 shadow-md' : 'border-gray-200 hover:border-primary/30 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`mb-4 ${role === r.id ? 'text-primary' : 'text-gray-400'}`}>
                      {r.icon}
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">{r.title}</h4>
                    <p className="text-sm text-gray-500">{r.desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleNext}
                  disabled={!role}
                  className="bg-primary text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 flex items-center"
                >
                  Continue <ChevronRight size={18} className="ml-1" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Basic Info */}
          {step === 2 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-6">Basic Information</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name / Organization Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone (Optional)</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
              <div className="mt-8 flex justify-between">
                <button
                  onClick={handleBack}
                  className="text-gray-600 px-6 py-2 rounded-lg font-medium border border-gray-300 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={!formData.name || !formData.email || !formData.password}
                  className="bg-primary text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 flex items-center"
                >
                  Continue <ChevronRight size={18} className="ml-1" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Role Specific Details */}
          {step === 3 && (
            <form onSubmit={handleSubmit}>
              <h3 className="text-lg font-medium text-gray-900 mb-6">Additional Details</h3>
              <div className="space-y-6">
                {role === 'student' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">AYUSH Discipline</label>
                      <select className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary">
                        <option>Ayurveda</option>
                        <option>Yoga & Naturopathy</option>
                        <option>Unani</option>
                        <option>Siddha</option>
                        <option>Homeopathy</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Institution Name</label>
                      <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" />
                    </div>
                  </>
                )}
                {/* Other role fields would go here */}
                {role !== 'student' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Verification Document ID</label>
                    <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" />
                  </div>
                )}
              </div>
              <div className="mt-8 flex justify-between">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading}
                  className="text-gray-600 px-6 py-2 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-primary text-white px-6 py-2 rounded-lg font-medium shadow-md hover:bg-primary/90 flex items-center disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  ) : null}
                  {loading ? 'Completing...' : 'Complete Registration'}
                </button>
              </div>
            </form>
          )}

        </div>
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:text-primary/80">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
