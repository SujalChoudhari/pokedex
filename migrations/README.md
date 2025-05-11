# Database Setup Instructions

1. Create the `trainer-avatars` storage bucket in Supabase:
   - Go to Storage in Supabase Dashboard
   - Create a new bucket named `trainer-avatars`
   - Enable public access
   - Add the security policies from `01_create_trainer_profile.sql`

2. Run the SQL migrations:
   - Open the SQL editor in Supabase Dashboard
   - Copy and paste the contents of `01_create_trainer_profile.sql`
   - Run the SQL commands

3. Enable Row Level Security (RLS):
   - Verify RLS is enabled on the `trainers` table
   - Check that the security policies are correctly applied

4. Test the setup:
   - Try creating a new trainer profile
   - Upload an avatar image
   - Verify the stats are automatically updated when catching Pokemon
