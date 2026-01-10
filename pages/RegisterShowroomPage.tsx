
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { getDealershipByUserId } from '../services/dataService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ShowroomForm } from '../components/ShowroomForm';

export const RegisterShowroomPage: React.FC = () => {
    // Destructure loading from auth to prevent premature redirect
    const { user, profile, loading: authLoading } = useAuth();
    const { t } = useAppContext();
    const navigate = useNavigate();
    const { countryCode } = useParams<{ countryCode: string }>();

    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const init = async () => {
            // Wait for auth to finish loading before checking user
            if (authLoading) return;

            if (!user) {
                navigate(`/${countryCode}/login`);
                return;
            }

            // Check if already a dealer
            const existing = await getDealershipByUserId(user.id);
            if (existing) {
                alert("You are already registered as a dealer.");
                navigate(`/${countryCode}/showrooms/${existing.id}`);
                return;
            }

            setChecking(false);
        };
        init();
    }, [user, authLoading, countryCode, navigate]);

    const handleSuccess = () => {
        alert("Registration submitted successfully! Please wait for admin approval.");
        navigate(`/${countryCode}`);
    };

    // Show spinner during auth check or initial data load
    if (authLoading || checking) return (
        <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
            <LoadingSpinner className="w-16 h-16" />
        </div>
    );

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">{t('register_showroom.title')}</h1>
                <p className="text-gray-500">{t('register_showroom.subtitle')}</p>
            </div>

            <ShowroomForm
                userId={user?.id}
                userProfile={profile}
                onSuccess={handleSuccess}
            />
        </div>
    );
};
