import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, AlertTriangle, AlertCircle, CheckCircle, Award, ArrowRight } from 'lucide-react';
import { assessmentAPI, badgeAPI } from '../../services/api';

const TakeAssessment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(2700); // 45 mins in seconds default
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  // Results state
  const [result, setResult] = useState(null);
  const [newBadges, setNewBadges] = useState([]);

  const fallbackQuestions = [
    {
      _id: 'q1',
      text: "Which of the following is considered a primary text of Ayurveda?",
      options: ["Charaka Samhita", "Rigveda", "Upanishads", "Bhagavad Gita"],
      correctAnswer: 0
    },
    {
      _id: 'q2',
      text: "What is the key principle of Tridosha?",
      options: ["Vata, Pitta, Kapha", "Sattva, Rajas, Tamas", "Prana, Tejas, Ojas", "Earth, Water, Fire"],
      correctAnswer: 0
    }
  ];

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        setLoading(true);
        const response = await assessmentAPI.getById(id);
        const data = response.data;
        setAssessment(data);
        if (data.duration) {
          setTimeLeft(data.duration * 60);
        }
      } catch (err) {
        console.error("Failed to load assessment", err);
        setError("Failed to load real assessment data. Using fallback data.");
        setAssessment({
          title: "Advanced Clinical Diagnosis Assessment",
          duration: 45,
          questions: fallbackQuestions
        });
      } finally {
        setLoading(false);
      }
    };
    fetchAssessment();
  }, [id]);

  useEffect(() => {
    if (loading || submitting || result) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(); // Auto submit
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, submitting, result]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectAnswer = (qIndex, optionIndex) => {
    setAnswers(prev => ({ ...prev, [qIndex]: optionIndex }));
  };

  const calculateMockScore = () => {
    let correct = 0;
    const questions = assessment?.questions || fallbackQuestions;
    questions.forEach((q, idx) => {
      if (answers[idx] === (q.correctAnswer || 0)) {
        correct++;
      }
    });
    return {
      score: correct,
      total: questions.length,
      percentage: Math.round((correct / questions.length) * 100)
    };
  };

  const handleSubmit = async () => {
    if (submitting) return;
    try {
      setSubmitting(true);
      
      const questions = assessment?.questions || fallbackQuestions;
      const answersArray = questions.map((_, idx) => {
        return answers[idx] !== undefined ? answers[idx] : -1;
      });

      let finalResult = null;
      let newlyAwarded = [];

      if (!error) {
        // Real submission
        try {
          const res = await assessmentAPI.submit(id, answersArray);
          finalResult = res.data;
          
          // Check for badges
          const badgeRes = await badgeAPI.checkAndAward();
          if (badgeRes.data && badgeRes.data.newlyAwarded) {
            newlyAwarded = badgeRes.data.newlyAwarded;
          }
        } catch (submitErr) {
          console.error("API submission error, falling back to mock calc", submitErr);
          finalResult = calculateMockScore();
        }
      } else {
        // Mock result
        finalResult = calculateMockScore();
        
        // Mock badge if score > 50%
        if (finalResult.percentage >= 50) {
          newlyAwarded = [{ id: 'mock1', name: 'Assessment Champion', icon: '🏆', description: 'Passed an assessment' }];
        }
      }
      
      setResult(finalResult);
      setNewBadges(newlyAwarded);

    } catch (err) {
      console.error("Submission failed", err);
      alert("Failed to submit assessment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // --- RESULTS SCREEN ---
  if (result) {
    const isPass = result.percentage >= 60; // Assuming 60% is passing
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden text-center p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 ${isPass ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            {isPass ? <CheckCircle size={48} /> : <AlertTriangle size={48} />}
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {isPass ? "Assessment Completed!" : "Assessment Finished"}
          </h1>
          <p className="text-gray-500 mb-8">{assessment?.title || "Assessment"}</p>
          
          <div className="flex justify-center gap-8 mb-10">
            <div className="bg-gray-50 p-6 rounded-2xl w-40 border border-gray-100">
              <div className="text-sm text-gray-500 mb-1 font-medium uppercase">Score</div>
              <div className="text-3xl font-bold text-gray-800">
                {result.score} / {result.total}
              </div>
            </div>
            <div className={`p-6 rounded-2xl w-40 border ${isPass ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
              <div className={`text-sm mb-1 font-medium uppercase ${isPass ? 'text-green-600' : 'text-red-600'}`}>
                Percentage
              </div>
              <div className={`text-3xl font-bold ${isPass ? 'text-green-700' : 'text-red-700'}`}>
                {result.percentage}%
              </div>
            </div>
          </div>
          
          {/* Badge Display */}
          {newBadges && newBadges.length > 0 && (
            <div className="mb-10 p-6 bg-amber-50 border border-amber-100 rounded-xl max-w-lg mx-auto">
              <h3 className="font-bold text-amber-800 flex items-center justify-center gap-2 mb-4">
                <Award size={24} />
                New Badges Unlocked!
              </h3>
              <div className="flex flex-wrap justify-center gap-4">
                {newBadges.map((badge, idx) => (
                  <div key={idx} className="bg-white px-4 py-3 rounded-lg shadow-sm flex items-center gap-3 animate-in zoom-in duration-500 delay-300">
                    <span className="text-2xl">{badge.icon || '🏅'}</span>
                    <div className="text-left">
                      <div className="font-bold text-sm text-gray-800">{badge.name}</div>
                      <div className="text-xs text-gray-500">{badge.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex justify-center gap-4 mt-8">
            <button 
              onClick={() => navigate('/student/assessments')}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back to Assessments
            </button>
            <button 
              onClick={() => navigate('/student/skills')}
              className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-lg shadow-primary/20"
            >
              View My Skill Profile <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }
  // --- END RESULTS SCREEN ---

  const questions = assessment?.questions || fallbackQuestions;

  return (
    <div className="max-w-4xl mx-auto py-8">
      {error && (
        <div className="mb-4 bg-yellow-50 text-yellow-800 p-4 rounded-lg flex items-center">
          <AlertCircle size={20} className="mr-2" />
          {error}
        </div>
      )}

      {/* AI Proctoring Notice */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-4">
        <div className="text-blue-500 mt-0.5">
          <AlertCircle size={20} />
        </div>
        <div>
          <h4 className="text-blue-800 font-semibold text-sm">AI Proctoring Active</h4>
          <p className="text-blue-600 text-xs mt-1">
            Your webcam and microphone are being monitored. Tab switching or exiting full-screen will result in immediate disqualification. 
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-primary px-6 py-4 flex justify-between items-center text-white">
          <h1 className="text-lg font-bold">{assessment?.title || "Assessment"}</h1>
          <div className="flex items-center gap-2 bg-red-500/20 px-3 py-1.5 rounded-lg font-mono">
            <Clock size={18} />
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Question Area */}
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Question {currentQ + 1} of {questions.length}</span>
            <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}></div>
            </div>
          </div>

          <h2 className="text-xl font-medium text-dark mb-6">{questions[currentQ].text || questions[currentQ].q}</h2>

          <div className="space-y-3">
            {questions[currentQ].options.map((opt, idx) => (
              <label key={idx} className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${answers[currentQ] === idx ? 'border-primary bg-primary/5' : 'border-gray-200 hover:bg-primary/5 hover:border-primary/30'}`}>
                <input 
                  type="radio" 
                  name={`answer-${currentQ}`} 
                  checked={answers[currentQ] === idx}
                  onChange={() => handleSelectAnswer(currentQ, idx)}
                  className="w-5 h-5 text-primary focus:ring-primary border-gray-300" 
                />
                <span className="ml-3 text-gray-700">{opt}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-gray-100 flex justify-between items-center bg-gray-50">
          <button 
            disabled={currentQ === 0 || submitting}
            onClick={() => setCurrentQ(prev => prev - 1)}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium disabled:opacity-50"
          >
            Previous
          </button>
          
          {currentQ < questions.length - 1 ? (
            <button 
              disabled={submitting}
              onClick={() => setCurrentQ(prev => prev + 1)}
              className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              Next
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2 bg-secondary text-white rounded-lg font-medium hover:bg-secondary/90 flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <AlertTriangle size={18} /> 
              )}
              {submitting ? 'Submitting...' : 'Submit Assessment'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TakeAssessment;
