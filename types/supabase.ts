export interface ExtendedCar {
  id: number;
  brand_id: number;
  model_id: number;
  year: number;
  mileage: number;
  price: number;
  fuel_type: string;
  gearbox_type: string;
  body_type: string;
  condition: string;
  images?: { url: string; is_main?: boolean }[];
  favorite?: boolean;
  is_featured?: boolean;
  color: string;
  country_id: number;
  user_id: string;
  created_at: string;
  updated_at: string;
  brand?: {
    id: number;
    name: string;
    name_ar?: string;
    logo_url?: string | null;
  };
  model?: {
    id: number;
    name: string;
    name_ar?: string;
  };
  country?: {
    id: number;
    name: string;
    name_ar?: string;
  };
  user?: {
    id: string;
    full_name: string;
    email: string;
    phone_number: string;
    role: string;
  };
}

export interface Country {
  id: number;
  name: string;
  name_ar?: string;
  code: string;
  phone_code: string;
  currency: string;
  currency_symbol: string;
}

export interface City {
  id: number;
  name: string;
  name_ar?: string;
  country_id: number;
  country?: Country;
}

export interface Comment {
  id: number;
  car_id: number;
  user_id: string;
  parent_id: number | null;
  content: string;
  created_at: string;
  user: {
    id: string;
    full_name: string;
    email: string;
    phone_number: string;
  };
}
