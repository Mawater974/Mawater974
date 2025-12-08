export type FuelType = 'Gasoline' | 'Diesel' | 'Electric' | 'Hybrid' | 'PlugInHybrid' | 'LPG' | 'CNG';
export type GearboxType = 'Automatic' | 'Manual' | 'SemiAutomatic' | 'CVT';
export type BodyType = 'Sedan' | 'SUV' | 'Hatchback' | 'Coupe' | 'Convertible' | 'Wagon' | 'Van' | 'Pickup' | 'Truck' | 'Bus' | 'Other';
export type ConditionType = 'New' | 'Used' | 'Certified';
export type CarColor = 'Black' | 'White' | 'Silver' | 'Gray' | 'Red' | 'Blue' | 'Brown' | 'Green' | 'Yellow' | 'Orange' | 'Purple' | 'Gold' | 'Other';
export type CylinderType = '3' | '4' | '5' | '6' | '8' | '10' | '12' | 'Other';
export type DriveType = 'FWD' | 'RWD' | 'AWD' | '4WD';

export interface CarImage {
  id: string;
  car_id: number;
  url?: string; // Legacy field, will be deprecated
  image_url: string; // High resolution image URL
  thumbnail_url: string | null; // Thumbnail URL, can be null for backward compatibility
  is_main: boolean;
  display_order: number;
  created_at: string;
  updated_at?: string;
}

export interface Car {
  id: number;
  user_id: string;
  brand_id: number;
  model_id: number;
  year: number;
  mileage: number;
  price: number;
  description: string | null;
  fuel_type: FuelType;
  gearbox_type: GearboxType;
  body_type: BodyType;
  condition: ConditionType;
  color: CarColor;
  exact_model: string | null;
  cylinders: CylinderType | null;
  drive_type: DriveType | null;
  doors: number | null;
  warranty_months_remaining: number | null;
  is_featured: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'sold' | 'expired' | 'hidden' | 'archived';
  dealership_id: number | null;
  country_id: number | null;
  city_id: number | null;
  rejection_reason: any;
  expiration_date: string | null;
  created_at: string;
  updated_at: string;
  images?: CarImage[];
  brand?: {
    name: string;
  };
  model?: {
    name: string;
  };
  user?: {
    full_name: string;
    email: string;
  };
  dealership?: {
    business_name: string;
  };
}
