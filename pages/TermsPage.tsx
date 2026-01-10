
import React from 'react';
import { useAppContext } from '../context/AppContext';
import { FileText, CheckCircle, UserCheck, AlertTriangle } from 'lucide-react';

export const TermsPage: React.FC = () => {
    const { t } = useAppContext();

    const sections = [
        {
            title: t('terms.usage.title'),
            desc: t('terms.usage.desc'),
            icon: CheckCircle
        },
        {
            title: t('terms.account.title'),
            desc: t('terms.account.desc'),
            icon: UserCheck
        },
        {
            title: t('terms.termination.title'),
            desc: t('terms.termination.desc'),
            icon: AlertTriangle
        }
    ];

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <div className="text-center mb-16">
                <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4 flex items-center justify-center gap-3">
                    <FileText className="w-10 h-10 text-primary-600" />
                    {t('terms.title')}
                </h1>
                <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-4">{t('terms.intro')}</p>
                <p className="text-sm text-gray-400">{t('terms.last_updated')}: {new Date().toLocaleDateString()}</p>
            </div>

            <div className="space-y-8">
                {sections.map((section, idx) => (
                    <div key={idx} className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex gap-6">
                        <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center text-primary-600">
                                <section.icon className="w-6 h-6" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{section.title}</h2>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">
                                {section.desc}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
