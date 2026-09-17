import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import DashboardLayout from './components/layout/DashboardLayout';
import { Toaster } from 'react-hot-toast';

import {
  Landing, Login, Register, StudentDashboard, SkillProfile, Assessments, Opportunities, TakeAssessment, Portfolio, Applications,
  IndustryDashboard, PostOpportunity, ManageOpportunities, CandidateSearch, ViewApplications,
  AcademicianDashboard, Mentoring, ResearchHub, FDPAccess,
  InstitutionDashboard, ReadinessDashboard, OutcomeTracking, StudentManagement,
  AdminDashboard, UserManagement, SkillTaxonomy,
  Notifications, QuestionSets, UploadQuestionSet, ProctoringReports, LiveProctoring, LevelTests
} from './lazyRoutes';
import { Loader2 } from 'lucide-react';

// Routes every role gets inside its own area
const sharedRoutes = (role) => [
  <Route key={`${role}-notifications`} path="notifications" element={<Notifications />} />,
  <Route key={`${role}-qs`} path="question-sets" element={<QuestionSets />} />,
  <Route key={`${role}-qs-upload`} path="question-sets/upload" element={<UploadQuestionSet />} />,
  ...(role !== 'student' ? [
    <Route key={`${role}-qs-reports`} path="question-sets/:id/reports" element={<ProctoringReports />} />,
    <Route key={`${role}-live`} path="live-proctoring" element={<LiveProctoring />} />,
  ] : []),
  ...(['admin', 'institution'].includes(role) ? [<Route key={`${role}-flagged`} path="proctoring-reports" element={<ProctoringReports />} />] : []),
];

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <React.Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-primary" size={48} /></div>}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Student Routes */}
        <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<StudentDashboard />} />
          <Route path="skills" element={<SkillProfile />} />
          <Route path="level-tests" element={<LevelTests />} />
          <Route path="assessments" element={<Assessments />} />
          <Route path="assessments/take/:id" element={<TakeAssessment />} />
          <Route path="opportunities" element={<Opportunities />} />
          <Route path="portfolio" element={<Portfolio />} />
          <Route path="applications" element={<Applications />} />
          {sharedRoutes('student')}
        </Route>

        {/* Industry Routes */}
        <Route path="/industry" element={<ProtectedRoute allowedRoles={['industry']}><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<IndustryDashboard />} />
          <Route path="post-opportunity" element={<PostOpportunity />} />
          <Route path="manage-opportunities" element={<ManageOpportunities />} />
          <Route path="candidate-search" element={<CandidateSearch />} />
          <Route path="applications/:id" element={<ViewApplications />} />
          {sharedRoutes('industry')}
        </Route>

        {/* Academician Routes */}
        <Route path="/academician" element={<ProtectedRoute allowedRoles={['academician']}><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<AcademicianDashboard />} />
          <Route path="mentoring" element={<Mentoring />} />
          <Route path="research-hub" element={<ResearchHub />} />
          <Route path="fdp-access" element={<FDPAccess />} />
          {sharedRoutes('academician')}
        </Route>

        {/* Institution Routes */}
        <Route path="/institution" element={<ProtectedRoute allowedRoles={['institution']}><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<InstitutionDashboard />} />
          <Route path="readiness" element={<ReadinessDashboard />} />
          <Route path="outcomes" element={<OutcomeTracking />} />
          <Route path="students" element={<StudentManagement />} />
          {sharedRoutes('institution')}
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="taxonomy" element={<SkillTaxonomy />} />
          {sharedRoutes('admin')}
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </React.Suspense>
    </>
  );
}

export default App;
