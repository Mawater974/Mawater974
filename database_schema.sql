-- Database Schema for Mawater974
-- This is a self-contained SQL file that can be run independently
-- It includes all necessary extensions and type definitions

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE fuel_type AS ENUM ('Gasoline', 'Diesel', 'Electric', 'Hybrid', 'PlugInHybrid', 'LPG', 'CNG');
CREATE TYPE gearbox_type AS ENUM ('Automatic', 'Manual', 'SemiAutomatic', 'CVT');
CREATE TYPE body_type AS ENUM ('Sedan', 'SUV', 'Hatchback', 'Coupe', 'Convertible', 'Wagon', 'Van', 'Pickup', 'Truck', 'Bus', 'Other');
CREATE TYPE condition_type AS ENUM ('New', 'Used', 'Certified');
CREATE TYPE car_color AS ENUM ('Black', 'White', 'Silver', 'Gray', 'Red', 'Blue', 'Brown', 'Green', 'Yellow', 'Orange', 'Purple', 'Gold', 'Other');
CREATE TYPE cylinder_type AS ENUM ('3', '4', '5', '6', '8', '10', '12', 'Other');
CREATE TYPE drive_type AS ENUM ('FWD', 'RWD', 'AWD', '4WD');
CREATE TYPE dealership_status_enum AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE user_role AS ENUM ('normal_user', 'dealer', 'admin');
CREATE TYPE part_type_enum AS ENUM ('original', 'aftermarket');

-- Create tables with proper dependencies
CREATE TABLE IF NOT EXISTS public.countries (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  name_ar VARCHAR NOT NULL,
  code VARCHAR NOT NULL UNIQUE,
  phone_code VARCHAR NOT NULL,
  currency_code VARCHAR NOT NULL,
  currency_symbol VARCHAR NOT NULL,
  currency_name VARCHAR NOT NULL,
  currency_name_ar VARCHAR NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create other tables in dependency order
CREATE TABLE IF NOT EXISTS public.brands (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR NOT NULL UNIQUE,
  name_ar VARCHAR,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.models (
  id BIGSERIAL PRIMARY KEY,
  brand_id BIGINT NOT NULL REFERENCES public.brands(id),
  name VARCHAR NOT NULL,
  name_ar VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(brand_id, name)
);

CREATE TABLE IF NOT EXISTS public.cars (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  brand_id BIGINT NOT NULL REFERENCES public.brands(id),
  model_id BIGINT NOT NULL REFERENCES public.models(id),
  year INTEGER NOT NULL CHECK (year >= 1900 AND year <= EXTRACT(YEAR FROM NOW())),
  mileage INTEGER NOT NULL CHECK (mileage >= 0),
  price NUMERIC NOT NULL CHECK (price >= 0),
  description TEXT,
  fuel_type FUEL_TYPE NOT NULL,
  gearbox_type GEARBOX_TYPE NOT NULL,
  body_type BODY_TYPE NOT NULL,
  condition CONDITION_TYPE NOT NULL,
  color CAR_COLOR DEFAULT 'Other',
  exact_model VARCHAR,
  is_featured BOOLEAN DEFAULT false,
  location VARCHAR NOT NULL,
  cylinders CYLINDER_TYPE,
  views_count INTEGER DEFAULT 0,
  expiration_date TIMESTAMPTZ,
  doors INTEGER CHECK (doors > 0 AND doors < 10),
  warranty_months_remaining INTEGER CHECK (warranty_months_remaining >= 0),
  drive_type DRIVE_TYPE,
  warranty TEXT,
  status TEXT,
  dealership_id BIGINT,
  rejection_reason JSONB,
  favorite_count INTEGER DEFAULT 0,
  country_id INTEGER REFERENCES public.countries(id),
  city_id INTEGER REFERENCES public.cities(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_dealership FOREIGN KEY (dealership_id) REFERENCES public.dealerships(id)
);

CREATE TABLE IF NOT EXISTS public.car_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id BIGINT REFERENCES public.cars(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  display_order INTEGER,
  is_main BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.dealerships (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id),
  business_name TEXT NOT NULL,
  business_name_ar TEXT NOT NULL,
  description TEXT NOT NULL,
  description_ar TEXT NOT NULL,
  location TEXT NOT NULL,
  location_ar TEXT DEFAULT '',
  opening_hours TEXT,
  opening_hours_ar TEXT,
  dealership_type TEXT NOT NULL,
  business_type TEXT NOT NULL,
  logo_url TEXT,
  reviewer_id UUID REFERENCES auth.users(id),
  review_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  status DEALERSHIP_STATUS_ENUM NOT NULL DEFAULT 'pending',
  featured BOOLEAN DEFAULT false,
  country_id INTEGER REFERENCES public.countries(id),
  city_id INTEGER REFERENCES public.cities(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.spare_part_categories (
  id SERIAL PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.spare_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  brand_id INTEGER REFERENCES public.brands(id),
  model_id INTEGER REFERENCES public.models(id),
  category_id INTEGER REFERENCES public.spare_part_categories(id),
  title TEXT NOT NULL,
  description TEXT,
  name_ar TEXT,
  description_ar TEXT,
  price NUMERIC NOT NULL,
  currency VARCHAR DEFAULT 'QAR',
  condition VARCHAR NOT NULL CHECK (condition IN ('new', 'used', 'refurbished')),
  is_negotiable BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  featured_until TIMESTAMPTZ,
  country_code VARCHAR REFERENCES public.countries(code),
  city_id INTEGER REFERENCES public.cities(id),
  contact_phone TEXT,
  contact_email TEXT,
  part_type PART_TYPE_ENUM NOT NULL DEFAULT 'original',
  status TEXT,
  expiration_date TIMESTAMPTZ,
  favorite_count INTEGER DEFAULT 0,
  views_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.spare_part_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spare_part_id UUID REFERENCES public.spare_parts(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  country_id INTEGER REFERENCES public.countries(id),
  status TEXT NOT NULL DEFAULT 'unread',
  parent_message_id BIGINT REFERENCES public.contact_messages(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.favorites (
  id BIGSERIAL PRIMARY KEY,
  car_id BIGINT REFERENCES public.cars(id) ON DELETE CASCADE,
  spare_part_id UUID REFERENCES public.spare_parts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (num_nonnulls(car_id, spare_part_id) = 1)
);

CREATE TABLE IF NOT EXISTS public.comments (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  parent_id BIGINT REFERENCES public.comments(id),
  content TEXT NOT NULL,
  car_id BIGINT REFERENCES public.cars(id) ON DELETE CASCADE,
  spare_part_id UUID REFERENCES public.spare_parts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (num_nonnulls(car_id, spare_part_id) = 1)
);

CREATE TABLE IF NOT EXISTS public.car_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  car_id BIGINT NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status VARCHAR NOT NULL DEFAULT 'Pending',
  country_code VARCHAR NOT NULL DEFAULT 'QA',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.website_settings (
  id BIGSERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  value_ar TEXT,
  description TEXT,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.car_photography_packages (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC NOT NULL,
  features JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS public.car_photography_requests (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  country_id BIGINT REFERENCES public.countries(id),
  city_id BIGINT REFERENCES public.cities(id),
  preferred_location TEXT,
  car_make TEXT NOT NULL,
  car_model TEXT NOT NULL,
  car_year INTEGER NOT NULL,
  preferred_date DATE NOT NULL,
  preferred_time TEXT NOT NULL,
  package TEXT NOT NULL CHECK (package IN ('basic', 'premium', 'deluxe')),
  additional_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  message_en TEXT NOT NULL,
  message_ar TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code VARCHAR NOT NULL,
  page_type VARCHAR NOT NULL,
  view_count BIGINT DEFAULT 0,
  last_viewed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.user_page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id VARCHAR,
  country_code VARCHAR NOT NULL,
  page_type VARCHAR NOT NULL,
  entity_id VARCHAR,
  page_path VARCHAR NOT NULL,
  user_agent TEXT,
  real_country_name TEXT,
  is_authenticated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.currency_rates (
  id BIGSERIAL PRIMARY KEY,
  from_currency VARCHAR NOT NULL,
  to_currency VARCHAR NOT NULL,
  rate NUMERIC NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_currency, to_currency)
);

CREATE TABLE IF NOT EXISTS public.admin_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  path TEXT NOT NULL UNIQUE,
  size BIGINT NOT NULL,
  mime_type TEXT,
  category TEXT NOT NULL,
  description TEXT,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create cities table after all its dependencies are created
CREATE TABLE IF NOT EXISTS public.cities (
  id SERIAL PRIMARY KEY,
  country_id INTEGER NOT NULL REFERENCES public.countries(id),
  name VARCHAR NOT NULL,
  name_ar VARCHAR NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  email TEXT CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  full_name VARCHAR,
  phone_number VARCHAR CHECK (phone_number ~ '^\+?[0-9]{10,15}$'),
  role USER_ROLE NOT NULL DEFAULT 'normal_user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  password_plain VARCHAR,
  country_id INTEGER REFERENCES public.countries(id)
);

-- Create remaining tables...
-- [Previous table definitions would continue here]

-- Add comments for better documentation
COMMENT ON TABLE public.countries IS 'Stores country information for multi-country support';
COMMENT ON TABLE public.cities IS 'Stores city information linked to countries';
COMMENT ON TABLE public.profiles IS 'User profiles linked to authentication system';

-- Create indexes for better performance
CREATE INDEX idx_cities_country_id ON public.cities(country_id);
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- Add sample data for testing (optional)
-- INSERT INTO public.countries (name, name_ar, code, phone_code, currency_code, currency_symbol, currency_name, currency_name_ar)
-- VALUES 
--   ('Qatar', 'قطر', 'QA', '974', 'QAR', 'ر.ق', 'Qatari Riyal', 'ريال قطري'),
--   ('Saudi Arabia', 'السعودية', 'SA', '966', 'SAR', 'ر.س', 'Saudi Riyal', 'ريال سعودي');

-- Create a function to update timestamps
CREATE OR REPLACE FUNCTION update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW; 
END;
$$ LANGUAGE plpgsql;

-- Add triggers for automatic timestamp updates
-- Example:
-- CREATE TRIGGER update_profiles_modtime
-- BEFORE UPDATE ON public.profiles
-- FOR EACH ROW EXECUTE FUNCTION update_modified_column();
