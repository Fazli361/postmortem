import React, { useState, useEffect } from 'react';
import { Program } from './types';
import { getAnonymousBrowserId } from './utils/browserId';
import { INITIAL_DEMO_PROGRAM } from './demoData';
import { LandingView } from './components/respondent/LandingView';
import { CodeInputView } from './components/respondent/CodeInputView';
import { FeedbackFormView, FormDataState } from './components/respondent/FeedbackFormView';
import { ReviewView } from './components/respondent/ReviewView';
import { SuccessView } from './components/respondent/SuccessView';
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { AdminDashboard } from './components/admin/AdminDashboard';

export default function App() {
  const [view, setView] = useState<'landing' | 'code' | 'form' | 'review' | 'success' | 'admin'>('landing');
  const [program, setProgram] = useState<Program | null>(null);
  const [validatedCode, setValidatedCode] = useState<string>('');
  const [formData, setFormData] = useState<FormDataState | null>(null);
  const [browserId, setBrowserId] = useState<string>('');
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  // Initialize browser ID and fetch active program
  useEffect(() => {
    const bid = getAnonymousBrowserId();
    setBrowserId(bid);

    fetch('/api/programs/active')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.id) {
          setProgram(data);
        } else {
          setProgram(INITIAL_DEMO_PROGRAM);
        }
      })
      .catch((err) => {
        console.warn('Failed to load active program from server, using local fallback:', err);
        setProgram(INITIAL_DEMO_PROGRAM);
      });
  }, []);

  // When validated code enters
  const handleCodeSuccess = (code: string) => {
    setValidatedCode(code);
    setView('form');
  };

  // When form proceeds to review
  const handleFormReview = (data: FormDataState) => {
    setFormData(data);
    setView('review');
  };

  // When review submits successfully
  const handleSubmitSuccess = () => {
    setView('success');
  };

  // Done from success
  const handleDone = () => {
    setValidatedCode('');
    setFormData(null);
    setView('landing');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* 1. Respondent Landing */}
      {view === 'landing' && (
        <LandingView
          program={program}
          onStart={() => setView('code')}
          onAdminClick={() => {
            if (isAdminLoggedIn) {
              setView('admin');
            } else {
              setShowAdminLoginModal(true);
            }
          }}
        />
      )}

      {/* 2. Access Code Entry */}
      {view === 'code' && (
        <CodeInputView
          program={program}
          browserId={browserId}
          onSuccess={handleCodeSuccess}
          onBack={() => setView('landing')}
        />
      )}

      {/* 3. Feedback Form */}
      {view === 'form' && (
        <FeedbackFormView
          program={program}
          code={validatedCode}
          initialData={formData || undefined}
          onReview={handleFormReview}
          onCancel={() => setView('landing')}
        />
      )}

      {/* 4. Review & Confirm */}
      {view === 'review' && formData && (
        <ReviewView
          program={program}
          code={validatedCode}
          formData={formData}
          browserId={browserId}
          onEdit={() => setView('form')}
          onSubmitSuccess={handleSubmitSuccess}
        />
      )}

      {/* 5. Success Confetti View */}
      {view === 'success' && (
        <SuccessView
          program={program}
          onDone={handleDone}
        />
      )}

      {/* 6. Admin Dashboard */}
      {view === 'admin' && (
        <AdminDashboard
          onLogout={() => {
            setIsAdminLoggedIn(false);
            setView('landing');
          }}
          onViewRespondentPortal={() => {
            setView('landing');
          }}
        />
      )}

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={showAdminLoginModal}
        onClose={() => setShowAdminLoginModal(false)}
        onLoginSuccess={() => {
          setIsAdminLoggedIn(true);
          setView('admin');
        }}
      />

    </div>
  );
}
