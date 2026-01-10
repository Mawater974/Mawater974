
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Loader2, ArrowLeft, Mail } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const { t, dir } = useAppContext();
  const navigate = useNavigate();
  const { countryCode } = useParams<{ countryCode: string }>();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Redirect to root origin. Supabase appends #access_token=...
    // AuthContext will detect PASSWORD_RECOVERY event and redirect to update-password page
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: t('auth.reset_email_sent') });
    }
    setLoading(false);
  };

  const inputClass = "w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition shadow-sm placeholder-gray-400";

  return (
    <div className="max-w-md mx-auto mt-12 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
      <Link to={`/${countryCode}/login`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 mb-6 transition">
         {dir === 'rtl' ? <ArrowLeft className="w-4 h-4 rotate-180" /> : <ArrowLeft className="w-4 h-4" />}
         {t('auth.back_to_login')}
      </Link>

      <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-primary-600">
              <Mail className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold dark:text-white mb-2">{t('auth.forgot_title')}</h2>
          <p className="text-gray-500 text-sm">{t('auth.forgot_desc')}</p>
      </div>
      
      {message && (
        <div className={`p-4 rounded-lg text-sm mb-6 border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleReset} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{t('login.email')}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputClass}
            placeholder="you@example.com"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-5 h-5 animate-spin" />}
          {t('auth.send_reset')}
        </button>
      </form>
    </div>
  );
};
