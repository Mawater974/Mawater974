# Migration Plan for Dealership Registrations

## Current Status

The `dealership_registrations` table appears to be a legacy table that is being replaced by the newer `dealership_requests` table. However, there are still references to this table in the codebase:

1. **Database References**:
   - The `dealership_profiles` table has a foreign key reference to `dealership_registrations(id)`
   - The approval and rejection functions in `20250225_user_profiles.sql` still use this table

2. **Code References**:
   - The showroom page (`app/showrooms/[id]/page.tsx`) still fetches data from this table

## Benefits of Keeping the Table

1. **Historical Data**: The table may contain historical registration data that hasn't been migrated to the new system.

2. **Existing Dealerships**: There may be approved dealerships whose profiles were created through the old system and are linked to records in this table.

3. **Compatibility**: Keeping the table ensures that existing code that references it continues to work.

## Migration Strategy

If you decide to fully migrate away from `dealership_registrations`, here's a recommended approach:

### Phase 1: Data Migration

1. **Create a migration script** to:
   - Identify all records in `dealership_registrations` that don't have corresponding entries in `dealership_requests`
   - Create new records in `dealership_requests` for these entries
   - Update any `dealership_profiles` records to remove the `registration_id` reference

2. **Update the showroom page** to fetch data from `dealership_profiles` instead of `dealership_registrations`

### Phase 2: Code Updates

1. **Update the `dealership_profiles` table** to remove the foreign key constraint to `dealership_registrations`

2. **Update any remaining code** that references `dealership_registrations` to use `dealership_requests` or `dealership_profiles` instead

### Phase 3: Deprecation

1. **Create a backup** of the `dealership_registrations` table data

2. **Drop the table** after confirming all functionality works with the new tables

## Recommendation

Based on the analysis, I recommend:

1. **Short-term**: Keep the `dealership_registrations` table to avoid breaking existing functionality

2. **Medium-term**: Implement the migration strategy to gradually move away from this table

3. **Long-term**: Once all data and functionality has been migrated, remove the table to simplify the database schema

Before making any changes, run the `dealership_registrations_analysis.sql` script to get a better understanding of the current state of the table and its dependencies.
