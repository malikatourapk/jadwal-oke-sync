-- ========================================
-- FIX PROFILE INSERT POLICY
-- Script ini menambahkan RLS policy untuk INSERT profile
-- yang diperlukan saat user signup
-- ========================================

-- Tambahkan policy INSERT untuk profiles
-- Policy ini memungkinkan service_role (dari trigger) untuk insert
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
CREATE POLICY "Service role can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

-- Pastikan trigger handle_new_user menggunakan SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, username, is_approved)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    FALSE
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Jika username sudah ada, tambahkan suffix angka
    INSERT INTO public.profiles (user_id, email, username, is_approved)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)) || '_' || substr(NEW.id::text, 1, 4),
      FALSE
    );
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error tapi tetap return NEW agar signup tidak gagal
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Pastikan trigger ada
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Verifikasi policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;
