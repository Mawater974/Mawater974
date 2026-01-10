
import React, { useState, useEffect } from 'react';
import { getBrands, getModels, getCountries, getCities, getSparePartCategories, createSparePart, updateSparePart, getOptimizedImageUrl, setPrimarySparePartImage } from '../services/dataService';
import { Brand, Model, Country, City, Profile, SparePart, SparePartCategory, SparePartImage } from '../types';
import { compressImage } from '../utils/imageOptimizer';
import { Upload, Loader2, CheckCircle, ArrowLeft, ArrowRight, Image as ImageIcon, Trash2, Info, Star } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

// Unified Image Type
type VisualImage =
    | { type: 'existing'; id: string; url: string; isPrimary: boolean; originalData: SparePartImage }
    | { type: 'new'; id: string; file: File; url: string; isPrimary: boolean };

interface SparePartFormProps {
    isAdmin?: boolean;
    onSuccess: () => void;
    currentUser: Profile | null;
    initialData?: SparePart;
}

export const SparePartForm: React.FC<SparePartFormProps> = ({ isAdmin = false, onSuccess, currentUser, initialData }) => {
    const { selectedCountryId, t, language } = useAppContext();

    // Data Lists
    const [brands, setBrands] = useState<Brand[]>([]);
    const [models, setModels] = useState<Model[]>([]);
    const [countries, setCountries] = useState<Country[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [categories, setCategories] = useState<SparePartCategory[]>([]);

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState<number | ''>('');

    const [selectedBrand, setSelectedBrand] = useState<number | ''>('');
    const [selectedModel, setSelectedModel] = useState<number | ''>('');
    const [selectedCategory, setSelectedCategory] = useState<number | ''>('');

    const [selectedCountry, setSelectedCountry] = useState<number | ''>('');
    const [selectedCity, setSelectedCity] = useState<number | ''>('');

    const [condition, setCondition] = useState<string>('new');
    const [partType, setPartType] = useState<string>('original');
    const [isNegotiable, setIsNegotiable] = useState(false);

    const [isFeatured, setIsFeatured] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);

    // Unified Image State
    const [visualImages, setVisualImages] = useState<VisualImage[]>([]);
    const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);

    const [processingImages, setProcessingImages] = useState(false);
    const [uploading, setUploading] = useState(false);

    const maxImages = isFeatured || isAdmin ? 10 : 5;

    useEffect(() => {
        getBrands().then(setBrands);
        getCountries().then(setCountries);
        getSparePartCategories().then(setCategories);

        if (!selectedCountry && selectedCountryId && !initialData) {
            setSelectedCountry(selectedCountryId);
        }
    }, [selectedCountryId]);

    // Populate for Edit Mode
    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title);
            setDescription(initialData.description || '');
            setPrice(initialData.price);

            setSelectedBrand(initialData.brand_id || '');
            setSelectedModel(initialData.model_id || '');
            setSelectedCategory(initialData.category_id || '');

            setSelectedCountry(initialData.country_id || '');
            setSelectedCity(initialData.city_id || '');

            setCondition(initialData.condition);
            setPartType(initialData.part_type);
            setIsNegotiable(initialData.is_negotiable);
            setIsFeatured(initialData.is_featured);
            setTermsAccepted(true);

            if (initialData.spare_part_images) {
                const mappedImages: VisualImage[] = initialData.spare_part_images
                    .sort((a, b) => (a.is_primary === b.is_primary ? 0 : a.is_primary ? -1 : 1))
                    .map(img => ({
                        type: 'existing',
                        id: img.id,
                        url: img.url,
                        isPrimary: img.is_primary,
                        originalData: img
                    }));
                setVisualImages(mappedImages);
            }
        }
    }, [initialData, countries]);

    useEffect(() => {
        if (selectedBrand) {
            getModels(Number(selectedBrand)).then(setModels);
        } else {
            setModels([]);
        }
    }, [selectedBrand]);

    useEffect(() => {
        if (selectedCountry) {
            getCities(Number(selectedCountry)).then(setCities);
        } else {
            setCities([]);
        }
    }, [selectedCountry]);

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setProcessingImages(true);
            const newFiles = Array.from(e.target.files) as File[];
            const newVisuals: VisualImage[] = [];

            if (visualImages.length + newFiles.length > maxImages) {
                alert(`Maximum ${maxImages} images allowed.`);
                setProcessingImages(false);
                return;
            }

            for (const file of newFiles) {
                try {
                    const compressed = await compressImage(file, false);
                    newVisuals.push({
                        type: 'new',
                        id: Math.random().toString(36).substr(2, 9),
                        file: compressed,
                        url: URL.createObjectURL(compressed),
                        isPrimary: false
                    });
                } catch (err) {
                    console.error("Compression failed", err);
                }
            }

            setVisualImages([...visualImages, ...newVisuals]);
            setProcessingImages(false);
        }
    };

    const removeImage = (index: number) => {
        const imageToRemove = visualImages[index];
        if (imageToRemove.type === 'existing') {
            setDeletedImageIds([...deletedImageIds, imageToRemove.id]);
        } else {
            URL.revokeObjectURL(imageToRemove.url);
        }
        const newImages = [...visualImages];
        newImages.splice(index, 1);
        setVisualImages(newImages);
    };

    const moveImage = (index: number, direction: 'left' | 'right') => {
        if (direction === 'left' && index === 0) return;
        if (direction === 'right' && index === visualImages.length - 1) return;

        const newImages = [...visualImages];
        const targetIndex = direction === 'left' ? index - 1 : index + 1;
        [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
        setVisualImages(newImages);
    };

    const setAsMain = (index: number) => {
        if (index === 0) return;
        const newImages = [...visualImages];
        const [selectedImage] = newImages.splice(index, 1);
        newImages.unshift(selectedImage);
        setVisualImages(newImages);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return alert('User is required');
        if (!title || !price || !selectedCategory) return alert('Required fields missing');
        if (!termsAccepted) return alert('Please accept terms.');
        if (visualImages.length === 0) return alert('Please upload at least one image.');

        setUploading(true);

        const countryObj = countries.find(c => c.id === Number(selectedCountry));

        const partData: Partial<SparePart> = {
            title,
            description,
            price: Number(price),
            currency: countryObj?.currency_code || 'QAR',
            brand_id: selectedBrand ? Number(selectedBrand) : undefined,
            model_id: selectedModel ? Number(selectedModel) : undefined,
            category_id: Number(selectedCategory),
            country_id: Number(selectedCountry),
            city_id: Number(selectedCity) || undefined,
            condition: condition as any,
            part_type: partType as any,
            is_negotiable: isNegotiable,
            is_featured: isAdmin ? isFeatured : false,
            status: isAdmin ? 'approved' : 'pending'
        };

        let success;
        if (initialData) {
            const newFiles = (visualImages.filter(img => img.type === 'new') as Extract<VisualImage, { type: 'new' }>[]).map(img => img.file);
            success = await updateSparePart(
                initialData.id,
                partData,
                newFiles,
                deletedImageIds,
                isAdmin
            );

            if (success) {
                const firstImage = visualImages[0];
                if (firstImage) {
                    if (firstImage.type === 'existing') {
                        await setPrimarySparePartImage(initialData.id, firstImage.id);
                    } else {
                        await setPrimarySparePartImage(initialData.id, null);
                    }
                }
            }
        } else {
            const filesToUpload = (visualImages.filter(img => img.type === 'new') as Extract<VisualImage, { type: 'new' }>[]).map(img => img.file);
            success = await createSparePart(partData, filesToUpload, currentUser.id);
        }

        setUploading(false);
        if (success) {
            alert(initialData ? t('form.success_update') : t('form.success_post'));
            onSuccess();
        } else {
            alert('Failed to save.');
        }
    };

    const inputClass = "w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none";

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Main Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label className="block text-sm font-bold mb-1 dark:text-gray-300">{t('part.title')}</label>
                    <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className={inputClass} placeholder={t('part.title_placeholder')} />
                </div>

                <div>
                    <label className="block text-sm font-bold mb-1 dark:text-gray-300">{t('part.category')}</label>
                    <select required value={selectedCategory} onChange={e => setSelectedCategory(Number(e.target.value))} className={inputClass}>
                        <option value="">{t('form.select')} {t('part.category')}</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{language === 'ar' ? c.name_ar : c.name_en}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-bold mb-1 dark:text-gray-300">{t('common.price')}</label>
                    <input type="number" required value={price} onChange={e => setPrice(Number(e.target.value))} className={inputClass} placeholder="0.00" />
                </div>

                <div>
                    <label className="block text-sm font-bold mb-1 dark:text-gray-300">{t('form.brand')} <span className="text-gray-400 font-normal text-xs">{t('common.optional')}</span></label>
                    <select value={selectedBrand} onChange={e => setSelectedBrand(Number(e.target.value))} className={inputClass}>
                        <option value="">{t('form.select')} {t('form.brand')}</option>
                        {brands.map(b => (
                            <option key={b.id} value={b.id}>
                                {language === 'ar' ? (b.name_ar || b.name) : b.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-bold mb-1 dark:text-gray-300">{t('form.model')} <span className="text-gray-400 font-normal text-xs">{t('common.optional')}</span></label>
                    <select value={selectedModel} onChange={e => setSelectedModel(Number(e.target.value))} className={inputClass} disabled={!selectedBrand}>
                        <option value="">{t('form.select')} {t('form.model')}</option>
                        {models.map(m => (
                            <option key={m.id} value={m.id}>
                                {language === 'ar' ? (m.name_ar || m.name) : m.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Specs */}
            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">{t('car.condition')}</label>
                    <select value={condition} onChange={e => setCondition(e.target.value)} className={inputClass}>
                        <option value="new">{t('condition.new')}</option>
                        <option value="used">{t('condition.used')}</option>
                        <option value="refurbished">{t('condition.refurbished')}</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">{t('part.type')}</label>
                    <div className="flex gap-4 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="partType" value="original" checked={partType === 'original'} onChange={() => setPartType('original')} className="text-primary-600 focus:ring-primary-500" />
                            <span className="text-sm dark:text-gray-300">{t('part.original')}</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="partType" value="aftermarket" checked={partType === 'aftermarket'} onChange={() => setPartType('aftermarket')} className="text-primary-600 focus:ring-primary-500" />
                            <span className="text-sm dark:text-gray-300">{t('part.aftermarket')}</span>
                        </label>
                    </div>
                </div>
                <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={isNegotiable} onChange={e => setIsNegotiable(e.target.checked)} className="w-5 h-5 text-primary-600 rounded" />
                        <span className="text-sm font-bold dark:text-gray-300">{t('part.negotiable')}</span>
                    </label>
                </div>
            </div>

            {/* Location & Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold mb-1 dark:text-gray-300">{t('form.country')}</label>
                    <select required value={selectedCountry} onChange={e => setSelectedCountry(Number(e.target.value))} className={inputClass}>
                        <option value="">{t('form.select')} {t('form.country')}</option>
                        {countries.map(c => <option key={c.id} value={c.id}>{language === 'ar' ? c.name_ar : c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-bold mb-1 dark:text-gray-300">{t('form.city')}</label>
                    <select value={selectedCity} onChange={e => setSelectedCity(Number(e.target.value))} className={inputClass} disabled={!selectedCountry}>
                        <option value="">{selectedCountry ? `${t('form.select')} ${t('form.city')}` : 'Select Country First'}</option>
                        {cities.map(c => <option key={c.id} value={c.id}>{language === 'ar' ? c.name_ar : c.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Contact Info Notice */}
            <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg flex items-center gap-3 border border-primary-100 dark:border-primary-800">
                <Info className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                <p className="text-sm text-primary-800 dark:text-primary-300">
                    {t('part.contact_notice')}
                </p>
            </div>

            <div>
                <label className="block text-sm font-bold mb-1 dark:text-gray-300">{t('form.description')}</label>
                <textarea rows={4} value={description} onChange={e => setDescription(e.target.value)} className={inputClass} placeholder={t('part.desc_placeholder')} />
            </div>

            {/* Image Upload */}
            <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <label className="block text-base font-bold dark:text-gray-300 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-primary-600" />
                    {t('form.upload_photos')} ({visualImages.length}/{maxImages})
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {visualImages.map((img, idx) => (
                        <div key={img.id} className="relative aspect-video rounded-2xl overflow-hidden border-2 border-gray-100 dark:border-gray-700 group bg-gray-100 dark:bg-gray-800 shadow-md transition-all hover:border-primary-500 hover:shadow-xl">
                            <img
                                src={img.type === 'existing' ? getOptimizedImageUrl(img.url, 800) : img.url}
                                alt="preview"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />

                            {/* Enhanced Overlay with Arrows and Bottom Bar */}
                            <div className="absolute inset-0 transition-all duration-300">
                                <div className="absolute inset-0 bg-black/20 pointer-events-none" />

                                {/* Reorder Arrows */}
                                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2 pointer-events-none">
                                    {idx > 0 ? (
                                        <button
                                            type="button"
                                            onClick={() => moveImage(idx, 'left')}
                                            className="p-3 bg-black/60 hover:bg-black text-white rounded-full transition shadow-xl pointer-events-auto backdrop-blur-sm"
                                            title="Move Left"
                                        >
                                            <ArrowLeft className="w-3 h-3" />
                                        </button>
                                    ) : <div />}

                                    {idx < visualImages.length - 1 && (
                                        <button
                                            type="button"
                                            onClick={() => moveImage(idx, 'right')}
                                            className="p-3 bg-black/60 hover:bg-black text-white rounded-full transition shadow-xl pointer-events-auto backdrop-blur-sm"
                                            title="Move Right"
                                        >
                                            <ArrowRight className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>

                                {/* Main Photo Badge (Top Left) */}
                                {idx === 0 && (
                                    <div className="absolute top-2 left-2 bg-primary-600 text-white text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md shadow-lg flex items-center gap-1 z-10">
                                        <Star className="w-3 h-3 fill-current" />
                                        {t('form.main_photo')}
                                    </div>
                                )}

                                {/* Bottom Action Bar */}
                                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex items-center justify-between gap-3">
                                    {idx > 0 ? (
                                        <button
                                            type="button"
                                            onClick={() => setAsMain(idx)}
                                            className="flex items-center gap-2 px-2 py-1 bg-[#8b1538] hover:bg-[#a01840] text-white rounded-md text-sm font-black transition-all shadow-lg active:scale-95"
                                        >
                                            <Star className="w-3 h-3" />
                                            {t('form.set_main')}
                                        </button>
                                    ) : (
                                        <div className="flex-1" /> // Spacer for the first image
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => removeImage(idx)}
                                        className="flex items-center gap-2 px-3 py-1 bg-[#2d3748] hover:bg-[#1a202c] text-white rounded-md text-sm font-black transition-all shadow-lg active:scale-95 ml-auto"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                        {t('form.remove')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {visualImages.length < maxImages && (
                        <label className="flex flex-col items-center justify-center aspect-video rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition shadow-inner">
                            {processingImages ? <Loader2 className="w-6 h-6 animate-spin text-primary-500" /> : <Upload className="w-6 h-6 text-gray-400" />}
                            <span className="text-xs text-gray-500 mt-1 font-medium">{t('form.add_more_photos')}</span>
                            <input type="file" multiple accept="image/*" onChange={handleImageSelect} className="hidden" disabled={processingImages} />
                        </label>
                    )}
                </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3">
                <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} className="mt-1 w-5 h-5 text-primary-600 rounded" />
                <label className="text-sm text-gray-600 dark:text-gray-300">
                    {t('form.terms_agree')} <a href="#" className="text-primary-600 font-bold hover:underline">{t('footer.terms')}</a> & <a href="#" className="text-primary-600 font-bold hover:underline">{t('footer.privacy')}</a>.
                </label>
            </div>

            <button type="submit" disabled={uploading || !termsAccepted} className="w-full bg-primary-600 text-white font-bold py-3.5 rounded-xl hover:bg-primary-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                {uploading ? t('form.processing') : initialData ? t('part.update_btn') : t('part.list_btn')}
            </button>
        </form>
    );
};
