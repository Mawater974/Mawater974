'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EnvelopeIcon, PhoneIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';

export default function ContactPage() {
  const { t, dir } = useLanguage();
  const { user } = useAuth();

  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!name || !email || !message) {
      setError(t('contact.requiredFields'));
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('contact_messages')
        .insert({
          name,
          email,
          message,
          user_id: user?.id,
          country_id: user?.user_metadata?.country_id,
          status: 'unread'
        });

      if (error) throw error;

      setSuccess(t('contact.success'));
      setName('');
      setEmail('');
      setMessage('');

      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error) {
      console.error('Contact form error:', error);
      setError(t('contact.error'));
    } finally {
      setLoading(false);
    }
  };
  
 // Track page view
 useEffect(() => {
  const trackPageView = async () => {
    try {
      const response = await fetch('/api/analytics/page-view', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          countryCode: '--', // Default to Qatar since this is a global page
          userId: user?.id,
          pageType: 'contact'
        })
      });

      if (!response.ok) {
        console.error('Failed to track page view:', await response.json());
      }
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  };

  trackPageView();
}, [user?.id]);
  
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8" dir={dir}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            {t('contact.title')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {t('contact.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-6">
                {t('contact.info.title')}
              </h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <EnvelopeIcon className="h-6 w-6 text-qatar-maroon mt-1" />
                  <div className="ml-4">
                    <p className="text-sm font-medium">Email</p>
                    <a href="mailto:info@mawater974.com" className="text-sm text-gray-600 dark:text-gray-400 hover:text-qatar-maroon">
                      {t('contact.info.email')}
                    </a>
                  </div>
                </div>
                <div className="flex items-start">
                  <PhoneIcon className="h-6 w-6 text-qatar-maroon mt-1" />
                  <div className="ml-4">
                    <p className="text-sm font-medium">Phone</p>
                    <a href="tel:+97412345678" className="text-sm text-gray-600 dark:text-gray-400 hover:text-qatar-maroon">
                      {t('contact.info.phone')}
                    </a>
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPinIcon className="h-6 w-6 text-qatar-maroon mt-1" />
                  <div className="ml-4">
                    <p className="text-sm font-medium">Address</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('contact.info.address')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <ClockIcon className="h-6 w-6 text-qatar-maroon mt-1" />
                  <div className="ml-4">
                    <p className="text-sm font-medium">
                      {t('contact.info.workingHours')}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('contact.info.workingHoursValue')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-6">
                {t('contact.form.title')}
              </h2>
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {success && (
                <div className="rounded-md bg-green-50 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-green-700">{success}</p>
                    </div>
                  </div>
                </div>
              )}

              <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                <div className="rounded-md shadow-sm -space-y-px">
                  <div>
                    <label htmlFor="name" className="sr-only">
                      {t('contact.name')}
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-800 dark:border-gray-700 rounded-t-md focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon focus:z-10 sm:text-sm"
                      placeholder={t('contact.name')}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="sr-only">
                      {t('contact.email')}
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon focus:z-10 sm:text-sm"
                      placeholder={t('contact.email')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="sr-only">
                      {t('contact.message')}
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={4}
                      className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon focus:z-10 sm:text-sm"
                      placeholder={t('contact.message')}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-qatar-maroon hover:bg-qatar-maroon-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t('contact.submitting')}
                      </span>
                    ) : (
                      t('contact.submit')
                    )}
                  </button>
                </div>
              </form>

              <div className="text-center mt-6">
                <Link
                  href="/"
                  className="font-medium text-qatar-maroon hover:text-qatar-maroon-dark"
                >
                  {t('contact.backToHome')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
