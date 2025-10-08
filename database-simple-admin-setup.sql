-- ========================================
-- SIMPLE ADMIN SETUP - TANPA INFINITE RECURSION
-- ========================================

-- 1. CREATE ENUM (jika belum ada)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. CREATE user_roles TABLE (jika belum ada)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 3. ENABLE RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. DROP SEMUA POLICY LAMA
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- 5. CREATE SECURITY DEFINER FUNCTION (untuk bypass RLS)
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

-- 6. SIMPLE RLS POLICIES untuk user_roles
-- Policy 1: Semua authenticated user bisa read user_roles (simple, no recursion)
CREATE POLICY "authenticated_read_user_roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Hanya admin yang bisa insert/update/delete (via function)
CREATE POLICY "admin_manage_user_roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 7. SIMPLE RLS POLICIES untuk profiles
-- Policy 1: Users bisa read profile sendiri
CREATE POLICY "users_read_own_profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy 2: Users bisa update profile sendiri
CREATE POLICY "users_update_own_profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy 3: Admin bisa read semua (via function, no recursion!)
CREATE POLICY "admin_read_all_profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Policy 4: Admin bisa update semua
CREATE POLICY "admin_update_all_profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 8. INSERT ADMIN ROLE (ganti email sesuai kebutuhan)
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin'::app_role
FROM public.profiles
WHERE email = 'tokoanjar09@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 9. VERIFY
SELECT 
  p.email,
  p.username,
  ur.role,
  public.has_role(p.user_id, 'admin') as has_admin_role
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
WHERE p.email = 'tokoanjar09@gmail.com';
