# Signup Fix Instructions

This document provides instructions for fixing the signup functionality issues in the Mawater974 application.

## Issue Description

The current signup process has the following issues:
1. Users are created in the authentication table but not in the profiles table
2. The `handle_new_user` trigger function doesn't include country_id when creating profiles
3. The `update_user_profile` function doesn't handle the case where a profile doesn't exist
4. The role value used in the functions ('user') doesn't match the enum type definition ('normal_user')
5. The 'dealer' role is missing from the user_role enum type

## Solution

We've created several SQL migration files to fix these issues:

1. `20250306_update_user_profile_function.sql` - Updates the update_user_profile function to include country_id parameters
2. `20250306_fix_user_trigger.sql` - Updates the handle_new_user function to include country_id
3. `20250306_ensure_profile_exists.sql` - Creates a function to ensure a user profile exists
4. `20250306_add_dealer_role.sql` - Adds 'dealer' to the user_role enum type
5. `20250306_fix_signup_issues.sql` - Combines all fixes into a single migration file

All these files have been updated to use 'normal_user' instead of 'user' for the role field, as the role column is defined as an enum type with values 'normal_user', 'admin', and now 'dealer'.

## Recent Changes

We've removed the city selection from the signup process:
1. Removed city_id parameter from the update_user_profile function
2. Removed city selection UI from the signup page
3. Simplified the profile creation process to focus on country selection only

## Deployment Instructions

### Option 1: Deploy Combined Migration

1. Open the Supabase dashboard for your project
2. Go to the SQL Editor
3. Copy the contents of `20250306_fix_signup_issues.sql`
4. Paste into the SQL Editor and run the query

### Option 2: Deploy Individual Migrations

If you prefer to deploy the migrations individually:

1. Open the Supabase dashboard for your project
2. Go to the SQL Editor
3. Copy the contents of each migration file in the following order:
   - `20250306_add_dealer_role.sql`
   - `20250306_update_user_profile_function.sql`
   - `20250306_fix_user_trigger.sql`
   - `20250306_ensure_profile_exists.sql`
4. Paste each file into the SQL Editor and run the query

## Verification

After deploying the migrations, verify that the fix is working by:

1. Creating a new user through the signup page
2. Checking that the user is created in both the auth.users and public.profiles tables
3. Verifying that the country_id is correctly saved in the profiles table
4. Confirming that the role is set to 'normal_user'
5. Verifying that the user_role enum type now includes 'dealer'

## Frontend Changes

The following frontend changes have been made to support the fix:

1. Updated the signup page to include country selection (via PhoneInput component)
2. Modified the auth.signUp call to include country_id in the metadata
3. Updated the Navbar component to call ensure_user_profile_exists if the profile check fails
4. Removed city selection from the signup form to simplify the user experience

These changes are already deployed in the codebase.

## Troubleshooting

If you encounter any issues after deploying the migrations:

1. Check the Supabase logs for any errors
2. Verify that the trigger and functions are correctly created in the database
3. Test the signup process and check the browser console for any errors

If problems persist, you may need to manually create profiles for existing users by running the following SQL:

```sql
INSERT INTO public.profiles (id, email, full_name, role)
SELECT au.id, au.email, au.raw_user_meta_data->>'full_name', 'normal_user'
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;
```

## Dealer Role Usage

The 'dealer' role has been added to allow for dealership functionality in the application. Users with this role will have access to dealership-specific features, such as:

1. Creating and managing car listings
2. Accessing dealership dashboard
3. Managing dealership profile information

To assign the dealer role to a user, you can use the following SQL:

```sql
UPDATE public.profiles
SET role = 'dealer'
WHERE id = 'user-uuid-here';
