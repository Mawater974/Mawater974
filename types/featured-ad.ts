export interface FeaturedAdPricing {
    id: string;
    country_id: number;
    price: number;
    currency_code: string;
    created_at?: string;
    updated_at?: string;
    country?: {
        id: number;
        name: string;
        code: string;
    };
}
