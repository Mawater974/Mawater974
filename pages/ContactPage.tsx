
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { sendContactMessage } from '../services/dataService';
import { Mail, Phone, MapPin, Send, Loader2, CheckCircle } from 'lucide-react';

export const ContactPage: React.FC = () => {
    const { t, selectedCountryId } = useAppContext();
    const { user, profile } = useAuth();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    useEffect(() => {
        if (profile) {
            setName(profile.full_name || '');
        }
        if (user?.email) {
            setEmail(user.email);
        }
    }, [user, profile]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus('idle');

        const success = await sendContactMessage({
            name,
            email,
            message,
            user_id: user?.id,
            country_id: selectedCountryId || undefined,
            status: 'unread'
        });

        if (success) {
            setStatus('success');
            if (!user) {
                setName('');
                setEmail('');
            }
            setMessage('');
        } else {
            setStatus('error');
        }
        setLoading(false);
    };

    const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition shadow-sm placeholder-gray-400";

    return (
        <div className="container mx-auto px-4 py-12 max-w-6xl">
            {/* Header */}
            <div className="text-center mb-16">
                <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">{t('contact.title')}</h1>
                <p className="text-xl text-gray-500 max-w-2xl mx-auto">{t('contact.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
                {/* Contact Info */}
                <div className="space-y-8">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center text-primary-600 flex-shrink-0">
                                <Phone className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{t('contact.call_us')}</h3>
                                <p className="text-gray-500 text-sm mb-2">{t('contact.hours')}</p>
                                <a href="tel:+97412345678" className="text-xl font-bold text-primary-600 hover:underline" dir="ltr">+974 1234 5678</a>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center text-primary-600 flex-shrink-0">
                                <Mail className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{t('contact.email_us')}</h3>
                                <p className="text-gray-500 text-sm mb-2">{t('contact.email_desc')}</p>
                                <a href="mailto:support@mawater974.com" className="text-lg font-bold text-gray-700 dark:text-gray-200 hover:text-primary-600 transition">support@mawater974.com</a>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center text-primary-600 flex-shrink-0">
                                <MapPin className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{t('contact.visit_us')}</h3>
                                <p className="text-gray-500 text-sm mb-2">{t('contact.office_type')}</p>
                                <p className="text-gray-700 dark:text-gray-200">{t('footer.address')}<br />{t('footer.pobox')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Map Placeholder */}
                    <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-3xl overflow-hidden relative">
                        <iframe
                            title="map"
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3606.8679698717!2d51.53123437596001!3d25.32585252723145!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e45c4b105555555%3A0x8888888888888888!2sWest%20Bay%2C%20Doha!5e0!3m2!1sen!2sqa!4v1709222222222!5m2!1sen!2sqa"
                            className="w-full h-full border-0 grayscale opacity-80 hover:grayscale-0 transition duration-500"
                            loading="lazy"
                        ></iframe>
                    </div>
                </div>

                {/* Contact Form */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-8 md:p-12 rounded-3xl border border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold mb-6 dark:text-white">{t('contact.form_title')}</h2>

                    {status === 'success' ? (
                        <div className="bg-green-100 text-green-800 p-6 rounded-2xl text-center animate-fade-in-up">
                            <CheckCircle className="w-12 h-12 mx-auto mb-3" />
                            <h3 className="font-bold text-lg mb-1">{t('contact.thank_you')}</h3>
                            <p>{t('contact.success')}</p>
                            <button
                                onClick={() => setStatus('idle')}
                                className="mt-4 text-green-700 font-bold hover:underline"
                            >
                                {t('contact.send_another')}
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {status === 'error' && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">
                                    {t('contact.error')}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t('contact.name')}</label>
                                <input
                                    type="text"
                                    required
                                    className={inputClass}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="John Doe"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t('contact.email')}</label>
                                <input
                                    type="email"
                                    required
                                    className={inputClass}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t('contact.message')}</label>
                                <textarea
                                    required
                                    rows={5}
                                    className={inputClass}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="How can we help you?"
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary-600 text-white font-bold py-4 rounded-xl hover:bg-primary-700 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-1 transform duration-200"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                {loading ? t('common.loading') : t('contact.send')}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
