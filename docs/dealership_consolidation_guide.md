# Dealership System Consolidation Guide

## Overview

We've consolidated the dealership management system into a single table called `dealerships`. This simplifies the database structure and makes the approval workflow more straightforward.

## Key Changes

### 1. Single Table Design

Instead of having separate tables for `dealership_requests` and `dealership_profiles`, we now have a single `dealerships` table that handles both pending requests and approved dealerships.

### 2. Enum Types for Fixed Values

We've created enum types for fixed values:

- **dealership_type_enum**: 'private', 'official'
- **business_type_enum**: 'showroom', 'service_center', 'spare_parts_dealer'
- **dealership_status_enum**: 'pending', 'approved', 'rejected'

### 3. Removed Brands Array

As requested, we've removed the brands array from the schema.

### 4. Simplified Approval Process

The approval process now simply updates the status field.

## Implementation Steps

### 1. Run the Migration Script

Run the [20250226_consolidate_dealership_tables.sql](cci:7://file:///d:/Duda%20Files/Mawater974.com/Codes/Mawater974%20%283%29/supabase/migrations/20250226_consolidate_dealership_tables.sql:0:0-0:0) script in your Supabase SQL Editor. This script:

- Creates the necessary enum types
- Creates the new `dealerships` table
- Migrates data from the old tables
- Creates new approval and rejection functions
- Sets up RLS policies
- Creates views for backward compatibility

### 2. Updated Frontend Code

We've updated the following files to use the new table structure:

1. **app/admin/dealership-requests/page.tsx**
   - Now fetches from the `dealerships` table
   - Uses the new `approve_dealership` and `reject_dealership` functions

2. **app/showrooms/[id]/page.tsx**
   - Now fetches from the `dealerships` table with status='approved'

## New Table Structure

```sql
CREATE TABLE dealerships (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    business_name TEXT NOT NULL,
    business_name_ar TEXT NOT NULL,
    description TEXT NOT NULL,
    description_ar TEXT NOT NULL,
    location TEXT NOT NULL,
    dealership_type dealership_type_enum NOT NULL,
    business_type business_type_enum NOT NULL,
    logo_url TEXT,
    status dealership_status_enum NOT NULL DEFAULT 'pending',
    reviewer_id UUID REFERENCES auth.users(id),
    review_notes TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    CONSTRAINT dealerships_user_id_key UNIQUE (user_id)
);
```

## New Functions

### approve_dealership

```sql
approve_dealership(dealership_id BIGINT, reviewer_id UUID, notes TEXT)
```

This function:
- Updates the dealership status to 'approved'
- Updates the user's profile to have user_type='dealer'

### reject_dealership

```sql
reject_dealership(dealership_id BIGINT, reviewer_id UUID, notes TEXT)
```

This function:
- Updates the dealership status to 'rejected'
- Records the reviewer and review notes

## Backward Compatibility

For backward compatibility, we've created two views:

1. **dealership_requests_view**: Shows all dealership records
2. **dealership_profiles_view**: Shows only approved dealerships

These views can be used if you have other code that still expects the old table structure.

## Testing

After implementing these changes, test the following:

1. Creating a new dealership request
2. Viewing pending requests in the admin panel
3. Approving a dealership request
4. Viewing the approved dealership in the showroom page
5. Rejecting a dealership request

## Troubleshooting

If you encounter any issues:

1. Check the browser console for error messages
2. Verify that the migration script ran successfully
3. Make sure the RLS policies are correctly set up
4. Check that the enum values match what your application is sending
