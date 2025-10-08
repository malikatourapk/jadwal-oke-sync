-- ========================================
-- FIX ADMIN USER MANAGEMENT SYSTEM
-- Script ini memperbaiki RLS policies dan setup admin
-- TIDAK AKAN MENGHAPUS DATA YANG SUDAH ADA
-- ========================================
-- 
-- CARA MENGGUNAKAN:
-- 1. Buka Supabase Dashboard
-- 2. Pilih project Anda
-- 3. Klik "SQL Editor" di sidebar kiri
-- 4. Copy-paste seluruh isi file ini
-- 5. Klik "Run" atau tekan Ctrl+Enter
-- ========================================

-- 1. CREATE ENUM untuk roles (jika belum ada)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. CREATE user_roles TABLE (jika belum ada)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 3. ENABLE RLS pada user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. ADD kolom admin_whatsapp dan admin_instagram ke profiles (jika belum ada)
DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_whatsapp text;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_instagram text;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- 5. CREATE SECURITY DEFINER FUNCTION untuk check role (avoid RLS recursion)
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

-- 6. DROP SEMUA RLS POLICIES LAMA
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "authenticated_read_user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "admin_manage_user_roles" ON public.user_roles;

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_read_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "admin_read_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "admin_update_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "service_role_insert_profiles" ON public.profiles;

-- 7. CREATE NEW RLS POLICIES untuk user_roles
-- Policy: Semua authenticated user bisa read user_roles
CREATE POLICY "authenticated_read_user_roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);

-- Policy: Hanya admin yang bisa insert/update/delete user_roles
CREATE POLICY "admin_manage_user_roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 8. CREATE NEW RLS POLICIES untuk profiles
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

-- Policy: Admin bisa read semua profiles
CREATE POLICY "admin_read_all_profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Admin bisa update semua profiles
CREATE POLICY "admin_update_all_profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policy: Allow insert from trigger (SECURITY DEFINER)
CREATE POLICY "service_role_insert_profiles"
ON public.profiles
FOR INSERT
WITH CHECK (true);

-- 9. SET ADMIN ROLE untuk tokoanjar09@gmail.com
-- Cari user_id dari tokoanjar09@gmail.com dan set sebagai admin
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Cari user_id dari profiles
  SELECT user_id INTO admin_user_id
  FROM public.profiles
  WHERE email = 'tokoanjar09@gmail.com'
  LIMIT 1;
  
  -- Jika ditemukan, set sebagai admin
  IF admin_user_id IS NOT NULL THEN
    -- Pastikan profile sudah approved
    UPDATE public.profiles
    SET is_approved = TRUE, approved_at = COALESCE(approved_at, NOW())
    WHERE user_id = admin_user_id;
    
    -- Insert admin role (ON CONFLICT DO NOTHING jika sudah ada)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE '✅ Admin role berhasil di-set untuk tokoanjar09@gmail.com';
  ELSE
    RAISE NOTICE '⚠️ User tokoanjar09@gmail.com belum terdaftar. Silakan signup terlebih dahulu.';
  END IF;
END $$;

-- 10. VERIFY SETUP (hasil akan muncul di bawah setelah Run)
SELECT 
  '=== ADMIN ACCOUNT STATUS ===' as status,
  p.email,
  p.username,
  p.is_approved,
  ur.role,
  public.has_role(p.user_id, 'admin') as has_admin_role
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
WHERE p.email = 'tokoanjar09@gmail.com';

-- Tampilkan semua users untuk verifikasi
SELECT 
  '=== ALL USERS ===' as status,
  p.email,
  p.username,
  p.is_approved,
  ur.role
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
ORDER BY p.created_at DESC;
