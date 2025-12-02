# Mawater974 Core Features Documentation

## 1. Home Page

### Components
1. **Hero Section**
   - Dynamic title
   - Search bar
   - Featured cars carousel
   - Statistics display

2. **Why Choose Us**
   - Verified sellers badge
   - Wide selection badge
   - Easy process badge
   - RTL support

3. **Featured Cars**
   - Grid layout
   - Quick actions
   - Currency conversion

### Contexts Used
1. **LanguageContext**
   - Translation management
   - RTL support

2. **CountryContext**
   - Currency conversion
   - Location filtering

## 2. Cars Page

### Components
1. **Search Bar**
   - Brand filter
   - Price range
   - Year range
   - Condition filter

2. **Car Grid**
   - Responsive layout
   - Quick actions
   - Currency display

3. **Pagination**
   - Page numbers
   - Total results

### Database Tables
1. **cars**
   - id
   - brand_id
   - model_id
   - year
   - price
   - condition
   - location_id
   - seller_id
   - created_at

2. **car_images**
   - id
   - car_id
   - url
   - is_main

## 3. Car Details Page

### Components
1. **Car Images**
   - Main image slider
   - Thumbnail navigation
   - Image zoom

2. **Car Information**
   - Specifications
   - Price (converted)
   - Location
   - Seller info

3. **Actions**
   - Contact seller
   - WhatsApp
   - Report
   - Favorite

### Database Tables
1. **car_specifications**
   - id
   - car_id
   - specification
   - value

2. **car_inquiries**
   - id
   - car_id
   - user_id
   - message
   - created_at

## 4. My Ads Page

### Components
1. **Ads List**
   - Grid/list view
   - Status badges
   - Quick actions

2. **Ad Management**
   - Edit listing
   - Delete listing
   - Mark as sold

### Database Tables
1. **seller_listings**
   - id
   - user_id
   - car_id
   - status
   - created_at

2. **listing_views**
   - id
   - listing_id
   - user_id
   - created_at

## 5. Profile Page

### Components
1. **Profile Information**
   - Basic info
   - Contact info
   - Location

2. **Statistics**
   - Listings
   - Views
   - Favorites
   - Messages

### Database Tables
1. **user_profiles**
   - id
   - user_id
   - full_name
   - phone_number
   - country_id
   - city_id

2. **user_statistics**
   - id
   - user_id
   - views
   - listings
   - favorites

## 6. Favorites Page

### Components
1. **Favorites List**
   - Grid/list view
   - Quick actions
   - Compare

2. **Comparison Tool**
   - Side-by-side
   - Specifications
   - Price comparison

### Database Tables
1. **car_favorites**
   - id
   - user_id
   - car_id
   - created_at

## 7. Admin Dashboard

### Components
1. **Main Dashboard**
   - Key metrics
   - Quick actions
   - Recent activities

2. **User Management**
   - User listing
   - Role management
   - Activity logs

### Database Tables
1. **admin_logs**
   - id
   - admin_id
   - action
   - created_at

2. **user_roles**
   - id
   - user_id
   - role_id

## 8. Showroom Pages

### Components
1. **Showroom List**
   - Grid layout
   - Filters
   - Search

2. **Showroom Details**
   - Business info
   - Car listings
   - Contact info

### Database Tables
1. **showrooms**
   - id
   - name
   - location_id
   - description
   - created_at

2. **showroom_cars**
   - id
   - showroom_id
   - car_id
   - featured

## 9. Authentication Pages

### Components
1. **Login**
   - Email/Phone
   - Password
   - Remember me
   - Social login

2. **Signup**
   - Basic info
   - Password
   - Terms
   - Social signup

3. **Password Recovery**
   - Email input
   - OTP verification
   - New password

### Database Tables
1. **users**
   - id
   - email
   - phone
   - password
   - created_at

2. **password_resets**
   - id
   - user_id
   - token
   - created_at

## 10. API Endpoints

### 1. Cars Endpoints
1. **GET /api/cars**
   - Get car list
   - Apply filters
   - Get stats

2. **GET /api/cars/[id]**
   - Get car details
   - Get specifications
   - Get images

### 2. Profile Endpoints
1. **GET /api/profile**
   - Get profile
   - Get statistics
   - Get settings

2. **PUT /api/profile**
   - Update profile
   - Update settings
   - Update preferences

### 3. Authentication Endpoints
1. **POST /api/auth/login**
   - Login user
   - Get token
   - Get session

2. **POST /api/auth/signup**
   - Create account
   - Send verification
   - Create profile

## 11. Contexts

### 1. LanguageContext
1. **State Management**
   - Current language
   - Translation keys
   - RTL settings

2. **Features**
   - Language switching
   - RTL support
   - Translation management

### 2. CountryContext
1. **State Management**
   - Current country
   - Currency
   - Location

2. **Features**
   - Currency conversion
   - Location filtering
   - Country-specific features

## 12. Security Features

### 1. Authentication
1. **Login Protection**
   - Rate limiting
   - IP blocking
   - Account lockout

2. **Password Security**
   - Password requirements
   - Password history
   - Password strength

### 2. Data Protection
1. **Encryption**
   - Data encryption
   - Communication encryption
   - Storage encryption

2. **Access Control**
   - Role-based access
   - Permission management
   - Activity tracking

## 13. Performance Optimization

### 1. Frontend
1. **Optimization**
   - Code splitting
   - Lazy loading
   - Image optimization

2. **Loading**
   - Skeleton screens
   - Loading states
   - Error handling

### 2. Backend
1. **Database**
   - Query optimization
   - Indexing
   - Caching

2. **API**
   - Rate limiting
   - Caching
   - Compression

## 14. Future Enhancements

### 1. Core Features
1. **Advanced Search**
   - AI-powered suggestions
   - Smart filters
   - Advanced sorting

2. **AI Integration**
   - Smart recommendations
   - Automated analytics
   - Smart notifications

### 2. Performance**
1. **Optimization**
   - Advanced caching
   - Resource optimization
   - Performance monitoring

2. **Scalability**
   - Load balancing
   - Resource management
   - Backup management

## 15. Database Structure

### Core Tables
1. **users**
   - id (uuid)
   - email (text, unique)
   - phone (text, unique)
   - password_hash (text)
   - password_plain (text)
   - role_id (uuid, foreign key)
   - status (enum: active, pending, blocked)
   - created_at (timestamp)
   - updated_at (timestamp)

2. **roles**
   - id (uuid)
   - name (text, unique)
   - permissions (jsonb)
   - created_at (timestamp)

### Cars Tables
1. **cars**
   - id (uuid)
   - seller_id (uuid, foreign key)
   - brand_id (uuid, foreign key)
   - model_id (uuid, foreign key)
   - year (integer)
   - price (decimal)
   - currency_id (uuid, foreign key)
   - condition (enum: new, used, certified)
   - mileage (integer)
   - gearbox_type (enum: manual, automatic, cvt)
   - body_type (enum: sedan, suv, hatchback, etc.)
   - fuel_type (enum: petrol, diesel, electric, hybrid)
   - color (text)
   - cylinders (integer)
   - doors (integer)
   - seats (integer)
   - status (enum: active, pending, sold, deleted)
   - created_at (timestamp)
   - updated_at (timestamp)

2. **car_images**
   - id (uuid)
   - car_id (uuid, foreign key)
   - url (text)
   - is_main (boolean)
   - position (integer)
   - created_at (timestamp)

3. **car_specifications**
   - id (uuid)
   - car_id (uuid, foreign key)
   - specification (text)
   - value (text)
   - created_at (timestamp)

### Brands and Models
1. **brands**
   - id (uuid)
   - name (text, unique)
   - logo_url (text)
   - country_id (uuid, foreign key)
   - created_at (timestamp)

2. **models**
   - id (uuid)
   - brand_id (uuid, foreign key)
   - name (text)
   - year_start (integer)
   - year_end (integer)
   - created_at (timestamp)

### Locations
1. **countries**
   - id (uuid)
   - name (text)
   - code (text, unique)
   - currency_id (uuid, foreign key)
   - created_at (timestamp)

2. **cities**
   - id (uuid)
   - country_id (uuid, foreign key)
   - name (text)
   - created_at (timestamp)

### Currencies
1. **currencies**
   - id (uuid)
   - code (text, unique)
   - name (text)
   - symbol (text)
   - rate (decimal)
   - created_at (timestamp)

### User-Related Tables
1. **user_profiles**
   - id (uuid)
   - user_id (uuid, foreign key)
   - full_name (text)
   - phone_number (text)
   - country_id (uuid, foreign key)
   - city_id (uuid, foreign key)
   - language_preference (enum: en, ar)
   - theme_preference (enum: light, dark)
   - created_at (timestamp)
   - updated_at (timestamp)

2. **user_statistics**
   - id (uuid)
   - user_id (uuid, foreign key)
   - views (integer)
   - listings (integer)
   - favorites (integer)
   - messages (integer)
   - created_at (timestamp)
   - updated_at (timestamp)

### Favorites
1. **car_favorites**
   - id (uuid)
   - user_id (uuid, foreign key)
   - car_id (uuid, foreign key)
   - created_at (timestamp)
   - last_viewed (timestamp)

### Admin Tables
1. **admin_logs**
   - id (uuid)
   - admin_id (uuid, foreign key)
   - action (text)
   - details (jsonb)
   - created_at (timestamp)

2. **user_roles**
   - id (uuid)
   - user_id (uuid, foreign key)
   - role_id (uuid, foreign key)
   - created_at (timestamp)

### Showroom Tables
1. **showrooms**
   - id (uuid)
   - name (text)
   - description (text)
   - location_id (uuid, foreign key)
   - website (text)
   - phone (text)
   - email (text)
   - status (enum: active, pending, blocked)
   - created_at (timestamp)
   - updated_at (timestamp)

2. **showroom_cars**
   - id (uuid)
   - showroom_id (uuid, foreign key)
   - car_id (uuid, foreign key)
   - featured (boolean)
   - position (integer)
   - created_at (timestamp)

### Authentication Tables
1. **password_resets**
   - id (uuid)
   - user_id (uuid, foreign key)
   - token (text)
   - expires_at (timestamp)
   - created_at (timestamp)

2. **sessions**
   - id (uuid)
   - user_id (uuid, foreign key)
   - token (text)
   - expires_at (timestamp)
   - created_at (timestamp)
   - last_activity (timestamp)

### Enum Types
1. **car_condition**
   - new
   - used - excellent
   - used - good
   - used - poor
   - not working

2. **gearbox_type**
   - manual
   - automatic
   - cvt

3. **body_type**
   - sedan
   - suv
   - hatchback
   - coupe
   - convertible
   - wagon
   - van
   - pickup
   - other

4. **fuel_type**
   - petrol
   - diesel
   - electric
   - hybrid
   - hydrogen

5. **user_status**
   - active
   - pending
   - blocked

6. **car_status**
   - active
   - pending
   - sold
   - deleted

7. **language_preference**
   - en
   - ar

8. **theme_preference**
   - light
   - dark

9. **showroom_status**
   - active
   - pending
   - blocked

### Constraints and Triggers
1. **Foreign Key Constraints**
   - All foreign keys with ON DELETE CASCADE
   - Unique constraints on email and phone
   - Check constraints for numeric values

2. **Triggers**
   - Update timestamps on update
   - Maintain statistics counters
   - Handle soft deletes
   - Maintain search indexes

### Indexes
1. **Primary Keys**
   - All tables have uuid primary keys

2. **Foreign Keys**
   - All foreign key columns indexed

3. **Search Indexes**
   - Full-text search indexes
   - GIN indexes for jsonb fields
   - B-tree indexes for numeric ranges

### Views
1. **car_search_view**
   - Optimized search view
   - Includes all necessary fields
   - Pre-calculated values

2. **user_statistics_view**
   - Aggregated statistics
   - Real-time updates
   - Performance optimized

### Functions
1. **currency_conversion**
   - Converts prices between currencies
   - Uses latest exchange rates
   - Handles rounding

2. **search_cars**
   - Full-text search
   - Filter application
   - Sorting and pagination

3. **update_statistics**
   - Maintains counters
   - Handles batch updates
   - Performance optimized

## 16. Country Management

### Components
1. **Country Selector**
   - Dropdown menu
   - Flag display
   - Country name
   - Currency symbol

2. **Country Settings**
   - Country list
   - Default country
   - Currency settings
   - Location settings

### Contexts
1. **CountryContext**
   - Current country
   - Currency conversion
   - Location filtering
   - Country-specific features

### Database Tables
1. **country_settings**
   - id (uuid)
   - country_id (uuid, foreign key)
   - default_currency_id (uuid, foreign key)
   - default_language (enum: en, ar)
   - timezone (text)
   - created_at (timestamp)
   - updated_at (timestamp)

2. **user_country_preferences**
   - id (uuid)
   - user_id (uuid, foreign key)
   - country_id (uuid, foreign key)
   - currency_id (uuid, foreign key)
   - language_preference (enum: en, ar)
   - created_at (timestamp)
   - updated_at (timestamp)

### API Endpoints
1. **GET /api/countries**
   - Get all countries
   - Include flags
   - Include currencies

2. **GET /api/countries/[id]**
   - Get country details
   - Get currency details
   - Get timezone

3. **POST /api/country/switch**
   - Switch country
   - Update preferences
   - Update currency

### Functions
1. **get_country_settings**
   - Get current country settings
   - Handle defaults
   - Return complete settings

2. **update_country_preferences**
   - Update user preferences
   - Update session
   - Update currency

### Security Features
1. **Country Protection**
   - Country access control
   - Country-specific features
   - Country-specific permissions

2. **Currency Security**
   - Currency validation
   - Rate protection
   - Conversion security

### Performance Optimization
1. **Country Caching**
   - Country data caching
   - Currency rate caching
   - Settings caching

2. **Country Loading**
   - Lazy loading
   - Progressive enhancement
   - Performance monitoring

## 17. Currency Management

### Components
1. **Currency Selector**
   - Dropdown menu
   - Currency symbol
   - Currency name
   - Conversion rate

2. **Currency Display**
   - Price display
   - Conversion display
   - Symbol display

### Contexts
1. **CurrencyContext**
   - Current currency
   - Conversion rates
   - Price formatting
   - Currency symbols

### Database Tables
1. **currency_rates**
   - id (uuid)
   - from_currency_id (uuid, foreign key)
   - to_currency_id (uuid, foreign key)
   - rate (decimal)
   - last_updated (timestamp)
   - created_at (timestamp)

2. **currency_history**
   - id (uuid)
   - currency_id (uuid, foreign key)
   - rate (decimal)
   - date (date)
   - created_at (timestamp)

### API Endpoints
1. **GET /api/currencies**
   - Get all currencies
   - Get conversion rates
   - Get currency symbols

2. **GET /api/currencies/convert**
   - Convert currency
   - Get conversion rate
   - Get formatted price

### Functions
1. **convert_currency**
   - Convert between currencies
   - Handle rounding
   - Format price

2. **update_currency_rates**
   - Update rates
   - Handle history
   - Update cache

### Security Features
1. **Currency Protection**
   - Rate validation
   - Conversion security
   - Rate protection

2. **Price Security**
   - Price validation
   - Rounding protection
   - Format security

### Performance Optimization
1. **Currency Caching**
   - Rate caching
   - Conversion caching
   - Symbol caching

2. **Currency Loading**
   - Lazy loading
   - Progressive enhancement
   - Performance monitoring

This documentation provides a comprehensive overview of the country and currency management features in the Mawater974 website, including all necessary components, contexts, database structure, API endpoints, and optimization features.
