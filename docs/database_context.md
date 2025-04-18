# Mawater974 Database Context

## Overview

The Mawater974 database is a PostgreSQL database used for a car marketplace platform. It includes tables for users, cars, dealerships, and various supporting entities. The database uses Row Level Security (RLS) to control access to data.

## Enum Types

- **user_role**: 'normal_user', 'admin'
- **user_type**: 'private', 'dealer', 'admin'
- **fuel_type**: 'Petrol', 'Diesel', 'Hybrid', 'Electric'
- **gearbox_type**: 'Manual', 'Automatic'
- **body_type**: 'Sedan', 'SUV', 'Hatchback', 'Coupe', 'Truck', 'Van', 'Wagon', 'Convertible', 'Other'
- **car_condition**: 'New', 'Excellent', 'Good', 'Not Working'
- **car_status**: 'Pending', 'Approved', 'Sold'
- **car_color**: 'White', 'Black', 'Silver', 'Gray', 'Red', 'Blue', 'Green', 'Yellow', 'Brown', 'Gold', 'Orange', 'Purple', 'Beige', 'Bronze', 'Maroon', 'Navy', 'Other'
- **cylinders_type**: '3', '4', '5', '6', '8', '10', '12', '16'

## Main Tables

### profiles
Extends the auth.users table with additional user information.

```sql
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name VARCHAR(255),
    phone_number VARCHAR(20),
    role user_role NOT NULL DEFAULT 'normal_user',
    user_type TEXT, -- Added later, can be 'dealer'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### brands
Car brands available in the marketplace.

```sql
CREATE TABLE public.brands (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### models
Car models associated with brands.

```sql
CREATE TABLE public.models (
    id BIGSERIAL PRIMARY KEY,
    brand_id BIGINT NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(brand_id, name)
);
```

### cars
Main table for car listings.

```sql
CREATE TABLE public.cars (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    brand_id BIGINT NOT NULL REFERENCES public.brands(id),
    model_id BIGINT NOT NULL REFERENCES public.models(id),
    year INTEGER NOT NULL,
    mileage INTEGER NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    color car_color NOT NULL DEFAULT 'Other',
    cylinders cylinders_type,
    description TEXT,
    fuel_type fuel_type NOT NULL,
    gearbox_type gearbox_type NOT NULL,
    body_type body_type NOT NULL,
    condition car_condition NOT NULL,
    status car_status NOT NULL DEFAULT 'Pending',
    images TEXT[] DEFAULT ARRAY[]::TEXT[],
    thumbnail TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### car_images
Images associated with car listings.

```sql
CREATE TABLE public.car_images (
    id BIGSERIAL PRIMARY KEY,
    car_id BIGINT NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Dealership Tables

### dealership_requests
Requests from users to become dealerships.

```sql
CREATE TABLE dealership_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    business_name TEXT NOT NULL,
    business_name_ar TEXT NOT NULL,
    description TEXT NOT NULL,
    description_ar TEXT NOT NULL,
    location TEXT NOT NULL,
    dealership_type TEXT NOT NULL,
    business_type TEXT NOT NULL,
    brands TEXT[] DEFAULT '{}',
    logo_url TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);
```

### dealership_profiles
Profiles for approved dealerships.

```sql
CREATE TABLE dealership_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    business_name TEXT,
    business_name_ar TEXT,
    description TEXT,
    description_ar TEXT,
    logo_url TEXT,
    location TEXT,
    dealership_type TEXT,
    business_type TEXT,
    brands TEXT[] DEFAULT '{}',
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    UNIQUE(user_id)
);
```

### dealership_registrations (Deprecated)
Old table for dealership registrations, being replaced by dealership_requests.

## Key Functions

### handle_new_user()
Creates a profile when a new user is created in auth.users.

### set_user_as_dealer(user_id UUID)
Safely sets a user's type to 'dealer' without modifying the role enum.

### approve_dealership_request(request_id BIGINT, reviewer_id UUID, notes TEXT)
Approves a dealership request and creates a dealership profile.

### reject_dealership_request(request_id BIGINT, reviewer_id UUID, notes TEXT)
Rejects a dealership request.

## Row Level Security (RLS) Policies

### profiles
- Everyone can view profiles
- Users can only update their own profile

### dealership_profiles
- Everyone can view dealership profiles
- Dealers can only update their own dealership profile

### dealership_requests
- Users can view their own requests
- Users can create their own requests
- Admins can view all requests (added in fix)
- Admins can update all requests (added in fix)

### cars
- Everyone can view approved cars
- Users can manage their own cars
- Admins can manage all cars

## Storage Buckets

### logos
For storing dealership logos.

## Recent Migrations

1. **20250225_user_profiles.sql**: Created profiles and dealership_profiles tables
2. **20250226_add_logos_bucket.sql**: Added storage bucket for logos and created dealership_requests table
3. **20250226_dealership_approval_functions.sql**: Added functions to approve/reject dealership requests
4. **20250226_update_dealership_profiles.sql**: Updated dealership_profiles with necessary fields
5. **20250226_fix_user_role_enum.sql**: Fixed issues with the user_role enum
6. **20250226_fix_dealership_requests_rls.sql**: Added RLS policies for admins to view and update all requests

## Known Issues and Fixes

1. **Role Enum Issue**: The user_role enum only accepts 'normal_user' and 'admin', not 'dealer'. The fix uses the user_type field (which is TEXT) to store 'dealer' instead.

2. **RLS Policy Issue**: Initially, admins couldn't see all dealership requests. This was fixed by adding specific policies for admins.

3. **Table Transition**: The system is transitioning from using dealership_registrations to dealership_requests. The old table can be kept for reference but is no longer actively used.
