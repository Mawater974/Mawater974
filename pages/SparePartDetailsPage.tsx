import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { getSparePartById, getSimilarSpareParts, getOptimizedImageUrl, toggleFavorite, getFavorites } from '../services/dataService';
import { SparePart } from '../types';
import { MapPin, Calendar, Tag, CheckCircle, ChevronLeft, ChevronRight, Phone, MessageCircle, User, AlertCircle, Heart } from 'lucide-react';
import { ImageCarousel } from '../components/ImageCarousel';
import { CommentSection } from '../components/CommentSection';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { SimilarAdsCarousel } from '../components/SimilarAdsCarousel';
import { SEO } from '../components/SEO';
import { parsePhoneNumber } from 'libphonenumber-js';
import { useAuth } from '../context/AuthContext';

export const SparePartDetailsPage: React.FC = () => {
    const { id, countryCode } = useParams<{ id: string, countryCode: string }>();
    const { t, language, dir, currency } = useAppContext();
    const { user } = useAuth();
    const [part, setPart] = useState<SparePart | null>(null);
    const [similarParts, setSimilarParts] = useState<SparePart[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isFavorite, setIsFavorite] = useState(false);

    useEffect(() => {
        const fetchPart = async () => {
            if (!id) return;
            setLoading(true);
            const data = await getSparePartById(id);
            setPart(data);
            setLoading(false);

            if (data && data.category_id) {
                const similar = await getSimilarSpareParts(data.id, data.category_id, data.country_id);
                setSimilarParts(similar);
            }
        };
        fetchPart();
    }, [id]);

    useEffect(() => {
        if (user && part) {
            getFavorites(user.id).then(favs => {
                const isFav = favs.some(f => f.spare_part_id === part.id);
                setIsFavorite(isFav);
            });
        }
    }, [user, part]);

    const handleToggleFavorite = async () => {
        if (!user) {
            alert(t('comments.login_prompt'));
            return;
        }
        setIsFavorite(!isFavorite);
        await toggleFavorite(user.id, part!.id, 'part');
    };

    const formatPhone = (num: string | undefined) => {
        if (!num) return "";
        try {
            const p = parsePhoneNumber(num);
            if (p) return p.formatInternational();
            return num;
        } catch (e) {
            return num;
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center py-40">
            <LoadingSpinner className="w-16 h-16" />
        </div>
    );
    if (!part) return <div className="text-center py-20">{t('common.no_results')}</div>;

    const brandName = language === 'ar' ? (part.brands?.name_ar || part.brands?.name) : part.brands?.name;
    const modelName = language === 'ar' ? (part.models?.name_ar || part.models?.name) : part.models?.name;
    const cityName = language === 'ar' ? (part.cities?.name_ar || part.cities?.name) : part.cities?.name;
    const countryName = language === 'ar' ? (part.countries?.name_ar || part.countries?.name) : part.countries?.name;
    const categoryName = language === 'ar' ? (part.spare_part_categories?.name_ar || part.spare_part_categories?.name_en) : part.spare_part_categories?.name_en;

    const imageUrls = part.spare_part_images?.map(img => img.url) || [];
    const displayCurrency = part.countries?.currency_code || currency;
    const mainImage = imageUrls.length > 0 ? getOptimizedImageUrl(imageUrls[0], 800) : undefined;

    const title = `${part.title} - ${cityName} | Mawater974`;
    const desc = part.description ? part.description.substring(0, 160) : `${part.title} for ${brandName || 'cars'} in ${cityName}.`;

    return (
        <div className="pb-12 relative">
            <SEO
                title={title}
                description={desc}
                image={mainImage}
                type="article"
            />

            {/* Status Watermark */}
            {part.status && part.status !== 'approved' && (
                <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center overflow-hidden h-[60vh] mt-20">
                    <div className="transform -rotate-12 border-4 border-dashed border-red-500/50 text-red-500/50 text-4xl sm:text-4xl md:text-8xl font-black uppercase px-12 py-4 tracking-widest bg-white/30 backdrop-blur-sm rounded-xl">
                        {part.status}
                    </div>
                </div>
            )}

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                <Link to={`/${countryCode}`} className="hover:text-primary-600">{t('nav.home')}</Link>
                {dir === 'rtl' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <Link to={`/${countryCode}/parts`} className="hover:text-primary-600">{t('nav.parts')}</Link>
                {dir === 'rtl' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <span className="font-semibold text-gray-900 dark:text-gray-200 truncate max-w-[200px]">{part.title}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Images & Details */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-black rounded-2xl overflow-hidden shadow-sm">
                        <ImageCarousel
                            images={imageUrls}
                            alt={part.title}
                            aspectRatio="aspect-[4/3] md:aspect-[16/9]"
                            showArrows={true}
                            showCounter={true}
                            activeIndex={activeImageIndex}
                            onIndexChange={setActiveImageIndex}
                            className="bg-gray-900"
                        />
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">

                        <h2 className="text-2xl font-bold mb-6 dark:text-white">{t('part.details')}</h2>

                        {/* Key Specs Boxes */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                            <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-100 dark:border-gray-600 flex flex-col items-center justify-center text-center hover:bg-gray-100 dark:hover:bg-gray-700/50 transition">
                                <span className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{t('part.category')}</span>
                                <span className="font-bold text-gray-900 dark:text-white">{categoryName || 'N/A'}</span>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-100 dark:border-gray-600 flex flex-col items-center justify-center text-center hover:bg-gray-100 dark:hover:bg-gray-700/50 transition">
                                <span className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{t('part.type')}</span>
                                <span className={`font-bold ${part.part_type === 'original' ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                    {part.part_type === 'original' ? t('part.original') : t('part.aftermarket')}
                                </span>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-100 dark:border-gray-600 flex flex-col items-center justify-center text-center hover:bg-gray-100 dark:hover:bg-gray-700/50 transition">
                                <span className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{t('car.condition')}</span>
                                <span className={`font-bold ${part.condition === 'new' ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                                    {t(`condition.${part.condition}`)}
                                </span>
                            </div>
                        </div>

                        {/* Other Details (Brand, Model) */}
                        <div className="grid grid-cols-2 gap-6 mb-8 border-t border-gray-100 dark:border-gray-700 pt-6">
                            {brandName && (
                                <div className="flex flex-col gap-1">
                                    <span className="text-gray-500 text-sm font-bold">{t('form.brand')}</span>
                                    <span className="font-medium dark:text-gray-200">{brandName}</span>
                                </div>
                            )}
                            {modelName && (
                                <div className="flex flex-col gap-1">
                                    <span className="text-gray-500 text-sm font-bold">{t('parts.compatible_model')}</span>
                                    <span className="font-medium dark:text-gray-200">{modelName}</span>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                            <h3 className="text-xl font-bold mb-3 dark:text-white">{t('car.description')}</h3>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {part.description || "No description provided."}
                            </p>
                        </div>
                    </div>

                    <CommentSection entityId={part.id} entityType="part" />
                </div>

                {/* Right Column: Key Info & CTA */}
                <div className="lg:col-span-1 lg:row-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 sticky top-24">
                        <div className="mb-2 flex justify-between items-start gap-4">
                            <h1 className="text-2xl font-bold dark:text-white leading-tight">
                                {part.title}
                            </h1>
                            <button
                                onClick={handleToggleFavorite}
                                className={`p-2.5 rounded-full border transition-all flex-shrink-0 ${isFavorite
                                        ? 'bg-red-50 border-red-100 text-red-500'
                                        : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-400 hover:text-red-500 hover:border-red-100'
                                    }`}
                                title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                            >
                                <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
                            </button>
                        </div>
                        <p className="text-gray-500 flex items-center gap-1 mt-2">
                            <MapPin className="w-4 h-4" />
                            {cityName}, {countryName}
                        </p>

                        <div className="my-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                            <p className="text-sm text-gray-500 mb-1">{t('common.price')}</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-primary-600">{part.price.toLocaleString()}</span>
                                <span className="text-lg font-bold text-gray-500">{displayCurrency}</span>
                            </div>
                            {part.is_negotiable && (
                                <span className="inline-block mt-2 text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">{t('parts.negotiable_badge')}</span>
                            )}
                        </div>

                        {part.profiles?.phone_number ? (
                            <>
                                <a
                                    href={`tel:${part.profiles.phone_number}`}
                                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition mb-3"
                                >
                                    <Phone className="w-5 h-5" /> {t('parts.call_seller')}
                                </a>
                                <a
                                    href={`https://wa.me/${part.profiles.phone_number.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition"
                                >
                                    <MessageCircle className="w-5 h-5" /> {t('parts.whatsapp')}
                                </a>
                            </>
                        ) : (
                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-lg text-sm flex items-center gap-2 mb-3">
                                <AlertCircle className="w-5 h-5" />
                                {t('parts.no_phone')}
                            </div>
                        )}

                        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl mt-6 border border-gray-100 dark:border-gray-700">
                            <div className="bg-primary-100 dark:bg-primary-900/30 rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0">
                                {part.profiles?.avatar_url ? (
                                    <img src={part.profiles.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <User className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                                )}
                            </div>
                            <div>
                                <p className="font-bold text-sm dark:text-white">{part.profiles?.full_name || t('car.seller_info')}</p>

                                {/* Dealer Badge */}
                                {part.profiles?.role === 'dealer' ? (
                                    <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mb-1 flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" /> {t('car.verified_seller')}
                                    </p>
                                ) : (
                                    <p className="text-xs text-gray-500 mb-1">Private Seller</p>
                                )}

                                {part.profiles?.phone_number && (
                                    <a href={`tel:${part.profiles.phone_number}`} className="block text-primary-600 font-bold text-lg hover:underline" dir="ltr">
                                        {formatPhone(part.profiles.phone_number)}
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Similar Ads Section */}
            <SimilarAdsCarousel items={similarParts} type="part" title={t('parts.similar')} />
        </div>
    );
};