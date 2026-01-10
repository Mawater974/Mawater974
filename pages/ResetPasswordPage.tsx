
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile } from '../services/dataService';
import { Loader2, KeyRound, CheckCircle, AlertTriangle } from 'lucide-react';

export const UpdatePasswordPage: React.FC = () => {
  const { t } = useAppContext();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { countryCode } = useParams<{ countryCode: string }>();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Redirect if no user session found after loading
  useEffect(() => {
      if (!authLoading && !user) {
          // If the recovery link is invalid or expired, user won't be logged in
          const timer = setTimeout(() => {
             navigate(`/${countryCode}/login`);
          }, 3000);
          return () => clearTimeout(timer);
      }
  }, [authLoading, user, countryCode, navigate]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
        setError("Session expired or invalid. Please request a new reset link.");
        return;
    }

    if (password !== confirmPassword) {
        setError(t('auth.password_mismatch'));
        return;
    }

    if (password.length < 6) {
        setError(t('signup.password_hint'));
        return;
    }

    setLoading(true);

    const { data, error: updateError } = await supabase.auth.updateUser({ 
        password: password 
    });

    if (updateError) {
      setError(updateError.message);
    } else {
      if (data.user) {
          // Update the plain password stored in profiles table
          await updateUserProfile(data.user.id, { password_plain: password });
      }
      setSuccess(true);
      setTimeout(() => {
          navigate(`/${countryCode}/login`);
      }, 3000);
    }
    setLoading(false);
  };

  const inputClass = "w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition shadow-sm placeholder-gray-400";

  // Show loading state while verifying session
  if (authLoading) {
      return (
          <div className="flex justify-center items-center h-[50vh]">
              <div className="text-center">
                  <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
                  <p className="text-gray-500">Verifying security token...</p>
              </div>
          </div>
      );
  }

  // Show error if user is not authenticated (link invalid/expired)
  if (!user) {
      return (
        <div className="max-w-md mx-auto mt-12 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 text-center">
            <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold mb-2 dark:text-white">Link Invalid or Expired</h2>
            <p className="text-gray-500 mb-6">The password reset link is invalid or has expired. Please request a new one.</p>
            <button onClick={() => navigate(`/${countryCode}/forgot-password`)} className="text-primary-600 font-bold hover:underline">
                Request New Link
            </button>
        </div>
      );
  }

  return (
    <div className="max-w-md mx-auto mt-12 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
      <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
              <KeyRound className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold dark:text-white mb-2">{t('auth.update_password_title')}</h2>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 border border-red-100">
          {error}
        </div>
      )}

      {success ? (
          <div className="bg-green-50 text-green-700 p-6 rounded-xl border border-green-200 text-center animate-fade-in-up">
              <CheckCircle className="w-12 h-12 mx-auto mb-3" />
              <h3 className="font-bold text-lg">{t('auth.password_updated')}</h3>
              <p className="text-sm mt-2">Redirecting to login...</p>
          </div>
      ) : (
        <form onSubmit={handleUpdate} className="space-y-6">
            <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{t('auth.new_password')}</label>
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={inputClass}
                placeholder="••••••••"
            />
            </div>
            <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{t('auth.confirm_password')}</label>
            <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={inputClass}
                placeholder="••••••••"
            />
            </div>

            <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {t('auth.update_submit')}
            </button>
        </form>
      )}
    </div>
  );
};
