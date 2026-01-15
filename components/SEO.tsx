
import React, { useEffect } from 'react';
import { useAppContext } from '../context/AppContext';

interface SEOProps {
    title: string;
    description?: string;
    keywords?: string;
    image?: string;
    type?: string;
}

export const SEO: React.FC<SEOProps> = ({ title, description, keywords, image, type = 'website' }) => {
    const { language } = useAppContext();

    useEffect(() => {
        // 1. Update Title
        document.title = title;

        // 2. Helper to set/update meta tag by name
        const setMeta = (name: string, content: string) => {
            let element = document.querySelector(`meta[name="${name}"]`);
            if (!element) {
                element = document.createElement('meta');
                element.setAttribute('name', name);
                document.head.appendChild(element);
            }
            element.setAttribute('content', content);
        };

        // 3. Helper for OG tags (property instead of name)
        const setOg = (property: string, content: string) => {
            let element = document.querySelector(`meta[property="${property}"]`);
            if (!element) {
                element = document.createElement('meta');
                element.setAttribute('property', property);
                document.head.appendChild(element);
            }
            element.setAttribute('content', content);
        };

        // 4. Update Description
        if (description) {
            setMeta('description', description);
            setOg('og:description', description);
            setMeta('twitter:description', description);
        }

        // 5. Update Keywords
        if (keywords) {
            setMeta('keywords', keywords);
        }

        // 6. Update OG/Twitter Basics
        setOg('og:title', title);
        setOg('og:type', type);
        setMeta('twitter:title', title);
        setMeta('twitter:card', 'summary_large_image');

        // 7. Update Image
        if (image) {
            setOg('og:image', image);
            setOg('og:image:width', '1200');
            setOg('og:image:height', '630');
            setMeta('twitter:image', image);
        }

        // 8. Update HTML Lang attribute
        document.documentElement.lang = language;

    }, [title, description, keywords, image, type, language]);

    return null;
};
