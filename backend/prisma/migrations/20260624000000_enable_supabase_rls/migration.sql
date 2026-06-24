-- Enable Row Level Security for tables exposed through Supabase's public schema.
-- The app accesses data through the backend Prisma connection, so no anon/authenticated
-- PostgREST policies are created here. With RLS enabled and no policies, Supabase API
-- clients are denied by default while privileged server-side database roles can still run.

ALTER TABLE IF EXISTS "public"."_prisma_migrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."wedding_projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."budget_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."project_vendors" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."master_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."vendor_type_masters" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."vendors" ENABLE ROW LEVEL SECURITY;
