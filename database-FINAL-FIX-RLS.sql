-- ========================================
-- FINAL FIX untuk Infinite Recursion di RLS
-- Jalankan script ini di Supabase SQL Editor
-- ========================================

-- 1. CREATE ENUM (jika belum ada)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. PASTIKAN table user_roles ada
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 3. ENABLE RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. DROP SEMUA POLICY LAMA yang mungkin menyebabkan recursion
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "authenticated_read_user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "admin_manage_user_roles" ON public.user_roles;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_read_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "admin_read_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "admin_update_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "service_role_insert_profiles" ON public.profiles;

-- 5. CREATE SECURITY DEFINER FUNCTION (PENTING: ini bypass RLS!)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- 6. CREATE SIMPLE & CORRECT RLS POLICIES untuk user_roles
-- Policy: Semua authenticated user bisa READ user_roles (simple, no recursion)
CREATE POLICY "allow_read_user_roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);

-- Policy: Hanya admin yang bisa INSERT/UPDATE/DELETE (via SECURITY DEFINER function)
CREATE POLICY "admin_full_access_user_roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 7. CREATE CORRECT RLS POLICIES untuk profiles
-- Policy: Users bisa read profile sendiri
CREATE POLICY "users_read_own_profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy: Users bisa update profile sendiri
CREATE POLICY "users_update_own_profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy: Admin bisa read SEMUA profiles (via SECURITY DEFINER function)
CREATE POLICY "admin_read_all_profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Admin bisa update SEMUA profiles
CREATE POLICY "admin_update_all_profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policy: Admin bisa delete profiles
CREATE POLICY "admin_delete_profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Allow service role to insert profiles (dari trigger signup)
CREATE POLICY "service_role_insert_profiles"
ON public.profiles
FOR INSERT
WITH CHECK (true);

-- 8. SET ADMIN ROLE untuk tokoanjar09@gmail.com
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin'::app_role
FROM public.profiles
WHERE email = 'tokoanjar09@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 9. VERIFY SETUP
SELECT 
  '✅ SETUP COMPLETE' as status,
  p.email,
  p.username,
  ur.role,
  public.has_role(p.user_id, 'admin') as is_admin
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
WHERE p.email = 'tokoanjar09@gmail.com';
