'use client';

import { useLanguage } from '../../contexts/LanguageContext';

interface PasswordStrengthIndicatorProps {
  password: string;
}

export default function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const { t } = useLanguage();

  const requirements = [
    { regex: /.{8,}/, text: t('password.requirements.length') },
    { regex: /[A-Z]/, text: t('password.requirements.uppercase') },
    { regex: /[a-z]/, text: t('password.requirements.lowercase') },
    { regex: /[0-9]/, text: t('password.requirements.number') },
    { regex: /[^A-Za-z0-9]/, text: t('password.requirements.special') },
  ];

  const strength = requirements.reduce((count, requirement) => 
    count + (requirement.regex.test(password) ? 1 : 0), 0);

  const getStrengthText = () => {
    if (strength === 0) return '';
    if (strength < 3) return t('password.weak');
    if (strength < 5) return t('password.medium');
    return t('password.strong');
  };

  const getStrengthColor = () => {
    if (strength < 3) return 'bg-red-500';
    if (strength < 5) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="mt-2 space-y-2">
      <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${getStrengthColor()}`}
          style={{ width: `${(strength / requirements.length) * 100}%` }}
        />
      </div>
      {password && (
        <div className="space-y-1">
          <p className={`text-xs ${getStrengthColor().replace('bg-', 'text-')}`}>
            {t('password.strength')}: {getStrengthText()}
          </p>
          <ul className="text-xs space-y-1 text-gray-500 dark:text-gray-400">
            {requirements.map((requirement, index) => (
              <li
                key={index}
                className={`flex items-center space-x-1 ${
                  requirement.regex.test(password)
                    ? 'text-green-500'
                    : 'text-gray-400'
                }`}
              >
                <svg
                  className={`w-3 h-3 ${
                    requirement.regex.test(password)
                      ? 'text-green-500'
                      : 'text-gray-400'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  {requirement.regex.test(password) ? (
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  ) : (
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                      clipRule="evenodd"
                    />
                  )}
                </svg>
                <span>{requirement.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
