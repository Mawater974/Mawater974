# Dealership System Migration Instructions

## Overview

We've updated the dealership system to use the new `dealership_requests` and `dealership_profiles` tables instead of the deprecated `dealership_registrations` table. This document provides instructions for completing the migration.

## Migration Steps

### 1. Run the SQL Migration Script

Run the following SQL migration script in your Supabase SQL Editor:

```sql
-- Migration to safely remove the dealership_registrations table
-- This script will:
-- 1. Remove the foreign key constraint from dealership_profiles
-- 2. Drop the old approval/rejection functions that use dealership_registrations
-- 3. Drop the dealership_registrations table

-- Start a transaction to ensure all changes happen together or not at all
BEGIN;

-- 1. Remove the foreign key constraint from dealership_profiles
DO $$
BEGIN
    -- Check if the constraint exists before trying to drop it
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'dealership_profiles_registration_id_fkey' 
        AND table_name = 'dealership_profiles'
    ) THEN
        ALTER TABLE dealership_profiles DROP CONSTRAINT dealership_profiles_registration_id_fkey;
    END IF;
    
    -- Set registration_id to NULL for all dealership profiles
    UPDATE dealership_profiles SET registration_id = NULL;
    
    -- Drop the column if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'dealership_profiles' 
        AND column_name = 'registration_id'
    ) THEN
        ALTER TABLE dealership_profiles DROP COLUMN registration_id;
    END IF;
END $$;

-- 2. Drop the old approval/rejection functions that use dealership_registrations
-- These are replaced by the new functions in 20250226_dealership_approval_functions.sql
DROP FUNCTION IF EXISTS approve_dealership_registration(BIGINT, UUID, TEXT);
DROP FUNCTION IF EXISTS reject_dealership_registration(BIGINT, UUID, TEXT);

-- 3. Drop the dealership_registrations table if it exists
DROP TABLE IF EXISTS dealership_registrations;

-- Commit the transaction
COMMIT;
```

### 2. Deploy Updated Code

We've updated the following files:

1. **app/showrooms/[id]/page.tsx**
   - Changed to fetch data from `dealership_profiles` instead of `dealership_registrations`

2. **app/admin/dealership-requests/page.tsx**
   - Updated to use the new approval and rejection functions

### 3. Verify the Migration

After running the migration script and deploying the updated code, verify that:

1. The admin dealership requests page shows all pending requests
2. You can approve and reject dealership requests
3. The showroom pages for existing dealerships still work correctly

## New Database Structure

The dealership system now uses two main tables:

1. **dealership_requests**
   - Stores pending requests from users who want to become dealerships
   - Used by the admin page to approve or reject requests

2. **dealership_profiles**
   - Stores information about approved dealerships
   - Created automatically when a request is approved
   - Used by the showroom pages to display dealership information

## Troubleshooting

If you encounter any issues after the migration:

1. Check the browser console for error messages
2. Verify that all the SQL migrations have been applied successfully
3. Make sure the RLS policies are correctly set up for both tables

For any persistent issues, you may need to check the Supabase logs or restore from a backup if necessary.
