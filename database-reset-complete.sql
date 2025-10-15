-- ========================================
-- COMPLETE DATABASE RESET
-- Reset semua table dan buat ulang dengan struktur lengkap
-- ========================================

-- 1. DROP EVERYTHING
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_by_username_or_email(text) CASCADE;
DROP FUNCTION IF EXISTS public.extend_subscription(uuid, integer) CASCADE;

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;

-- 2. CREATE ENUM
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 3. CREATE TABLES
CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  username text UNIQUE NOT NULL,
  is_approved boolean DEFAULT TRUE,
  approved_at timestamptz DEFAULT NOW(),
  approved_by uuid,
  subscription_expired_at timestamptz,
  admin_whatsapp text,
  admin_instagram text,
  created_at timestamptz DEFAULT NOW()
);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- 4. CREATE FUNCTIONS
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
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

CREATE OR REPLACE FUNCTION public.get_user_by_username_or_email(identifier text)
RETURNS TABLE(email text, username text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.email, p.username
  FROM public.profiles p
  WHERE p.username = identifier OR p.email = identifier
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.extend_subscription(p_user_id uuid, p_duration_months integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_expired_at timestamptz;
  new_expired_at timestamptz;
BEGIN
  -- Get current expiration date
  SELECT subscription_expired_at INTO current_expired_at
  FROM public.profiles
  WHERE user_id = p_user_id;
  
  -- Calculate new expiration date
  IF current_expired_at IS NULL OR current_expired_at < NOW() THEN
    -- If no expiration or already expired, start from now
    new_expired_at := NOW() + (p_duration_months || ' months')::interval;
  ELSE
    -- If still active, extend from current expiration
    new_expired_at := current_expired_at + (p_duration_months || ' months')::interval;
  END IF;
  
  -- Update the profile
  UPDATE public.profiles
  SET subscription_expired_at = new_expired_at
  WHERE user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, username, is_approved, approved_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    TRUE,
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    INSERT INTO public.profiles (user_id, email, username, is_approved, approved_at)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)) || '_' || substr(NEW.id::text, 1, 4),
      TRUE,
      NOW()
    );
    RETURN NEW;
END;
$$;

-- 5. CREATE TRIGGER
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. ENABLE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 7. CREATE RLS POLICIES FOR PROFILES
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can read all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 8. CREATE RLS POLICIES FOR USER_ROLES
CREATE POLICY "Users can read own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 9. INSERT ADMIN ROLES
-- Untuk tokoanjar09@gmail.com
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin'::public.app_role
FROM public.profiles
WHERE email = 'tokoanjar09@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Untuk anjarbdn@gmail.com  
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin'::public.app_role
FROM public.profiles
WHERE email = 'anjarbdn@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 10. VERIFY
SELECT 
  p.email,
  p.username,
  p.is_approved,
  ur.role,
  p.created_at
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
WHERE p.email IN ('tokoanjar09@gmail.com', 'anjarbdn@gmail.com')
ORDER BY p.email;
