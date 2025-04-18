 'use client';

import Link from 'next/link';
import Image from 'next/image';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCountry } from '@/contexts/CountryContext';

export default function Footer() {
  const { t, language, dir } = useLanguage();
  const { currentCountry } = useCountry();

  const quickLinks = [
    { name: t('footer.quickLinks.buyCar'), href: `/${currentCountry?.code.toLowerCase()}/cars` },
    { name: t('footer.quickLinks.sellCar'), href: `/${currentCountry?.code.toLowerCase()}/sell` },
    { name: t('footer.quickLinks.showrooms'), href: `/${currentCountry?.code.toLowerCase()}/showrooms` },
    { name: t('footer.quickLinks.spareParts'), href: `/${currentCountry?.code.toLowerCase()}/spare-parts` },
    { name: t('footer.quickLinks.carRental'), href: `/${currentCountry?.code.toLowerCase()}/car-rental` },
    { name: t('footer.quickLinks.carPhotography'), href: `/${currentCountry?.code.toLowerCase()}/car-photography` },
  ];

  const socialLinks = [
    { 
      icon: 'instagram', 
      href: 'https://instagram.com/mawater.974',
      label: 'Instagram'
    },
    { 
      icon: 'twitter', 
      href: 'https://twitter.com/mawater974',
      label: 'Twitter'
    },
    { 
      icon: 'facebook', 
      href: 'https://facebook.com/mawater.974',
      label: 'Facebook'
    },
    { 
      icon: 'linkedin', 
      href: 'https://linkedin.com',
      label: 'LinkedIn'
    },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300 pt-10 pb-8 border-t border-gray-700">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12 mb-12" dir={dir}>
          {/* Logo and Description */}
          <div className={`space-y-6 ${language === 'ar' ? 'lg:order-last' : ''}`}>
            <Link href="/" className="block w-fit">
              <Image
                src="/logo.png"
                alt="Mawater974 Logo"
                width={180}
                height={60}
                style={{ width: 'auto', height: 'auto' }}
                className="mb-4 hover:opacity-90 transition-opacity"
                priority
              />
            </Link>
            <p className="text-white text-lg font-semibold">
              {t('footer.tagline')}
            </p>
            <div className="flex flex-col space-y-3">
              <div className="flex flex-wrap gap-6">
                <Link
                  href="/terms"
                  className="text-sm hover:text-qatar-maroon transition-colors flex items-center gap-2 group"
                >
                  <i className="fas fa-file-alt text-gray-400 group-hover:text-qatar-maroon transition-colors"></i>
                  {t('footer.legal.terms')}
                </Link>
                <Link
                  href="/privacy"
                  className="text-sm hover:text-qatar-maroon transition-colors flex items-center gap-2 group"
                >
                  <i className="fas fa-shield-alt text-gray-400 group-hover:text-qatar-maroon transition-colors"></i>
                  {t('footer.legal.privacy')}
                </Link>
              </div>
              <div>
                <Link
                  href="/contact"
                  className="text-sm hover:text-qatar-maroon transition-colors flex items-center gap-2 group w-fit"
                >
                  <i className="fas fa-envelope text-gray-400 group-hover:text-qatar-maroon transition-colors"></i>
                  {t('footer.legal.contact')}
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="relative">
            <h3 className="text-white text-lg font-semibold mb-6 flex items-center gap-2">
              <i className="fas fa-link text-qatar-maroon"></i>
              {t('footer.quickLinks')}
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="hover:text-qatar-maroon transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-gray-500 rounded-full group-hover:bg-qatar-maroon transition-colors"></span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Follow Us */}
          <div className="relative">
            <h3 className="text-white text-lg font-semibold mb-6 flex items-center gap-2">
              <i className="fas fa-share-alt text-qatar-maroon"></i>
              {t('footer.followUs')}
            </h3>
            <div className="flex flex-wrap gap-6">
              {socialLinks.map((link) => (
                <a
                  key={link.icon}
                  href={link.href}
                  className="text-gray-300 hover:text-qatar-maroon transition-all transform hover:-translate-y-1 group"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                >
                  <i className={`fab fa-${link.icon} text-2xl text-gray-400 group-hover:text-qatar-maroon transition-colors`}></i>
                </a>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className={`relative ${language === 'ar' ? 'lg:order-first' : ''}`}>
            <h3 className="text-white text-lg font-semibold mb-6 flex items-center gap-2">
              <i className="fas fa-phone-alt text-qatar-maroon"></i>
              {t('footer.contact.title')}
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href={`mailto:${t('footer.contact.email')}`}
                  className="hover:text-qatar-maroon transition-colors flex items-center gap-2 group"
                >
                  <i className="far fa-envelope text-gray-400 group-hover:text-qatar-maroon transition-colors"></i>
                  {t('footer.contact.email')}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${t('footer.contact.phone')}`}
                  className="hover:text-qatar-maroon transition-colors flex items-center gap-2 group"
                >
                  <i className="fas fa-phone text-gray-400 group-hover:text-qatar-maroon transition-colors"></i>
                  <span dir="ltr">{t('footer.contact.phone')}</span>
                </a>
              </li>
              <li className="flex items-center gap-2">
                <i className="fas fa-map-marker-alt text-qatar-maroon"></i>
                {t('footer.contact.address')}
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-700/50 pt-8 text-center" dir={dir}>
          <p className="text-sm text-gray-400">
            {t('footer.copyright', { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </footer>
  );
}
