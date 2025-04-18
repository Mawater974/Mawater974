'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useSupabase } from './SupabaseContext';
import { useAuth } from './AuthContext';
import { getUserCountry } from '@/utils/geoLocation';
import { Country, City } from '@/types/supabase';
import { useLanguage } from './LanguageContext';

interface CurrencyRate {
  from_currency: string;
  to_currency: string;
  rate: number;
}

interface CountryContextType {
  countries: Country[];
  cities: City[];
  currentCountry: Country | null;
  currentCity: City | null;
  isLoading: boolean;
  setCurrentCountry: (country: Country) => void;
  setCurrentCity: (city: City) => void;
  getCitiesByCountry: (countryId: number) => City[];
  formatPrice: (price: number, language?: string) => string;
  convertPrice: (price: number, fromCurrency: string, toCurrency: string) => number;
  changeCountry: (country: Country) => void;
}

const CountryContext = createContext<CountryContextType>({
  countries: [],
  cities: [],
  currentCountry: null,
  currentCity: null,
  isLoading: true,
  setCurrentCountry: () => {},
  setCurrentCity: () => {},
  getCitiesByCountry: () => [],
  formatPrice: () => '',
  convertPrice: () => 0,
  changeCountry: () => {}
});

// Default countries and cities in case the database tables don't exist yet
const defaultCountries: Country[] = [
  {
    id: 1,
    code: 'QA',
    name: 'Qatar',
    name_ar: 'قطر',
    currency_code: 'QAR',
    currency_symbol: 'ر.ق',
    currency_name: 'Qatari Riyal',
    currency_name_ar: 'ريال قطري',
    phone_code: '+974',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    code: 'SA',
    name: 'Saudi Arabia',
    name_ar: 'السعودية',
    currency_code: 'SAR',
    currency_symbol: 'ر.س',
    currency_name: 'Saudi Riyal',
    currency_name_ar: 'ريال سعودي',
    phone_code: '+966',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    code: 'AE',
    name: 'UAE',
    name_ar: 'الإمارات',
    currency_code: 'AED',
    currency_symbol: 'د.إ',
    currency_name: 'UAE Dirham',
    currency_name_ar: 'درهم إماراتي',
    phone_code: '+971',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 4,
    code: 'KW',
    name: 'Kuwait',
    name_ar: 'الكويت',
    currency_code: 'KWD',
    currency_symbol: 'د.ك',
    currency_name: 'Kuwaiti Dinar',
    currency_name_ar: 'دينار كويتي',
    phone_code: '+965',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 5,
    code: 'SY',
    name: 'Syria',
    name_ar: 'سوريا',
    currency_code: 'SYP',
    currency_symbol: 'ل.س',
    currency_name: 'Syrian Pound',
    currency_name_ar: 'ليرة سورية',
    phone_code: '+963',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 6,
    code: 'EG',
    name: 'Egypt',
    name_ar: 'مصر',
    currency_code: 'EGP',
    currency_symbol: 'ج.م',
    currency_name: 'Egyptian Pound',
    currency_name_ar: 'جنيه مصري',
    phone_code: '+20',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()  
  }
];

const defaultCities: City[] = [
  {
    id: 1,
    country_id: 1,
    name: 'Doha',
    name_ar: 'الدوحة',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    country_id: 1,
    name: 'Al Wakrah',
    name_ar: 'الوكرة',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    country_id: 2,
    name: 'Riyadh',
    name_ar: 'الرياض',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 4,
    country_id: 3,
    name: 'Dubai',
    name_ar: 'دبي',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 5,
    country_id: 4,
    name: 'Kuwait City',
    name_ar: 'مدينة الكويت',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 6,
    country_id: 5,
    name: 'Damascus',
    name_ar: 'دمشق',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export function CountryProvider({ children }: { children: React.ReactNode }) {
  const { supabase } = useSupabase();
  const { user, profile } = useAuth();
  const { t, language } = useLanguage();
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [currentCountry, setCurrentCountry] = useState<Country | null>(null);
  const [currentCity, setCurrentCity] = useState<City | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChangingCountry, setIsChangingCountry] = useState(false);
  const [currencyRates, setCurrencyRates] = useState<CurrencyRate[]>([]);

  // Fetch all countries and cities on initial load
  useEffect(() => {
    const fetchCountriesAndCities = async () => {
      try {
        // Fetch countries
        const { data: countriesData, error: countriesError } = await supabase
          .from('countries')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (countriesError) {
          console.error('Error fetching countries:', countriesError);
          // Use default countries if there's an error
          setCountries(defaultCountries);
        } else {
          setCountries(countriesData || defaultCountries);
        }

        // Fetch cities
        const { data: citiesData, error: citiesError } = await supabase
          .from('cities')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (citiesError) {
          console.error('Error fetching cities:', citiesError);
          // Use default cities if there's an error
          setCities(defaultCities);
        } else {
          setCities(citiesData || defaultCities);
        }

        // Fetch currency rates
        const { data: ratesData, error: ratesError } = await supabase
          .from('currency_rates')
          .select('*');

        if (ratesError) {
          console.error('Error fetching currency rates:', ratesError);
          // Use default rates if there's an error
          setCurrencyRates([
            { from_currency: 'QAR', to_currency: 'SAR', rate: 1.03 },
            { from_currency: 'QAR', to_currency: 'AED', rate: 1.01 },
            { from_currency: 'QAR', to_currency: 'KWD', rate: 0.085 },
            { from_currency: 'QAR', to_currency: 'SYP', rate: 690 },
            { from_currency: 'SAR', to_currency: 'QAR', rate: 0.97 },
            { from_currency: 'AED', to_currency: 'QAR', rate: 0.99 },
            { from_currency: 'KWD', to_currency: 'QAR', rate: 11.76 },
            { from_currency: 'SYP', to_currency: 'QAR', rate: 0.00145 }
          ]);
        } else {
          setCurrencyRates(ratesData || []);
        }

      } catch (error) {
        console.error('Error fetching countries and cities:', error);
        // Use default data if there's an error
        setCountries(defaultCountries);
        setCities(defaultCities);
      }
    };

    fetchCountriesAndCities();
  }, [supabase]);

  // Determine current country and city based on user profile or IP
  useEffect(() => {
    const determineLocation = async () => {
      setIsLoading(true);
      try {
        // Check if we have a saved country in localStorage
        const savedCountryJson = typeof window !== 'undefined' ? localStorage.getItem('selectedCountry') : null;
        if (savedCountryJson) {
          try {
            const savedCountry = JSON.parse(savedCountryJson);
            const country = countries.find(c => c.id === savedCountry.id);
            if (country) {
              setCurrentCountry(country);
              
              // Set first city in this country as default
              const firstCity = cities.find(c => c.country_id === country.id);
              if (firstCity) {
                setCurrentCity(firstCity);
              }
              setIsLoading(false);
              return;
            }
          } catch (e) {
            console.error('Error parsing saved country:', e);
          }
        }

        // If user is logged in and has a country set in profile
        if (profile?.country_id) {
          const country = countries.find(c => c.id === profile.country_id);
          if (country) {
            setCurrentCountry(country);
            
            // If user has a city set
            if (profile.city_id) {
              const city = cities.find(c => c.id === profile.city_id);
              if (city) {
                setCurrentCity(city);
              }
            }
            setIsLoading(false);
            return;
          }
        }

        // If no country in profile or not logged in, use IP geolocation
        const detectedCountry = await getUserCountry(countries);
        
        if (detectedCountry) {
          setCurrentCountry(detectedCountry);
          // Set first city in this country as default
          const firstCity = cities.find(c => c.country_id === detectedCountry.id);
          if (firstCity) {
            setCurrentCity(firstCity);
          }
        } else {
          // Default to Qatar if no country detected
          const defaultCountry = countries.find(c => c.code === 'QA');
          if (defaultCountry) {
            setCurrentCountry(defaultCountry);
            // Set default city (Doha)
            const defaultCity = cities.find(c => c.country_id === defaultCountry.id && c.name === 'Doha');
            if (defaultCity) {
              setCurrentCity(defaultCity);
            }
          }
        }
      } catch (error) {
        console.error('Error determining location:', error);
        // Default to Qatar if error
        const defaultCountry = countries.find(c => c.code === 'QA');
        if (defaultCountry) {
          setCurrentCountry(defaultCountry);
          // Set default city (Doha)
          const defaultCity = cities.find(c => c.country_id === defaultCountry.id && c.name === 'Doha');
          if (defaultCity) {
            setCurrentCity(defaultCity);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Only run this effect if countries and cities are loaded
    if (countries.length > 0 && cities.length > 0) {
      determineLocation();
    }
  }, [countries, cities, profile, user]);

  // Update localStorage when country changes
  useEffect(() => {
    if (currentCountry) {
      localStorage.setItem('selectedCountryId', currentCountry.id.toString());
      localStorage.setItem('selectedCountry', JSON.stringify(currentCountry));
    }
  }, [currentCountry]);

  // Function to handle country change
  const handleCountryChange = (country: Country) => {
    setCurrentCountry(country);
    
    // Update city to first city in the selected country
    const firstCity = cities.find(c => c.country_id === country.id);
    if (firstCity) {
      setCurrentCity(firstCity);
    } else {
      setCurrentCity(null);
    }
    
    // Update user profile if logged in
    if (user && profile) {
      updateUserProfile(country.id, firstCity?.id || null);
    }
  };

  // Function to update user profile with country and city
  const updateUserProfile = async (countryId: number, cityId: number | null) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          country_id: countryId,
          city_id: cityId
        })
        .eq('id', user?.id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating user profile:', error);
    }
  };

  // Function to get cities by country ID
  const getCitiesByCountry = (countryId: number): City[] => {
    return cities.filter(city => city.country_id === countryId);
  };

  // Function to format price based on current country's currency
  const formatPrice = (price: number, language?: string): string => {
    if (!currentCountry) return `${price.toLocaleString()} ${t('currency.qar')}`;
    
    // Format the number according to the language
    const formattedNumber = price.toLocaleString(
      language === 'ar' ? 'ar' : 'en'
    );
    
    // Get translated currency code
    const currencyKey = `currency.${currentCountry.currency_code.toLowerCase()}`;
    const translatedCurrency = t(currencyKey);
    
    // For Arabic, place the currency code after the number
    if (language === 'ar') {
      return `${formattedNumber} ${translatedCurrency}`;
    }
    
    // For English, place the currency code before the number
    return `${translatedCurrency} ${formattedNumber}`;
  };

  // Function to convert price between currencies
  const convertPrice = (price: number, fromCurrency: string, toCurrency: string): number => {
    if (fromCurrency === toCurrency) return price;
    
    // Find direct conversion rate
    const directRate = currencyRates.find(
      rate => rate.from_currency === fromCurrency && rate.to_currency === toCurrency
    );
    
    if (directRate) {
      return price * directRate.rate;
    }
    
    // Try reverse conversion rate
    const reverseRate = currencyRates.find(
      rate => rate.from_currency === toCurrency && rate.to_currency === fromCurrency
    );
    
    if (reverseRate) {
      return price / reverseRate.rate;
    }
    
    // If no direct or reverse rate, try converting through USD
    const fromToUSD = currencyRates.find(
      rate => rate.from_currency === fromCurrency && rate.to_currency === 'USD'
    );
    
    const usdToTarget = currencyRates.find(
      rate => rate.from_currency === 'USD' && rate.to_currency === toCurrency
    );
    
    if (fromToUSD && usdToTarget) {
      const usdAmount = price * fromToUSD.rate;
      return usdAmount * usdToTarget.rate;
    }
    
    // If all else fails, return the original price
    console.warn(`No conversion rate found from ${fromCurrency} to ${toCurrency}`);
    return price;
  };

  // Function to handle country change with redirection
  const changeCountry = (country: Country) => {
    setIsChangingCountry(true);
    setCurrentCountry(country);
    
    // Set first city in this country as default
    const firstCity = cities.find(c => c.country_id === country.id);
    if (firstCity) {
      setCurrentCity(firstCity);
    }
    
    // Save to localStorage
    localStorage.setItem('selectedCountryId', country.id.toString());
    localStorage.setItem('selectedCountry', JSON.stringify(country));
    
    // Redirect to home page after a short delay to ensure country is set
    setTimeout(() => {
      window.location.href = `/${country.code.toLowerCase()}`;
    }, 500);
  };

  return (
    <CountryContext.Provider
      value={{
        countries,
        cities,
        currentCountry,
        currentCity,
        isLoading: isLoading || isChangingCountry,
        setCurrentCountry: handleCountryChange,
        setCurrentCity,
        getCitiesByCountry,
        formatPrice,
        convertPrice,
        changeCountry
      }}
    >
      {children}
    </CountryContext.Provider>
  );
}

export const useCountry = () => {
  const context = useContext(CountryContext);
  if (!context) {
    throw new Error('useCountry must be used within a CountryProvider');
  }
  return context;
};
