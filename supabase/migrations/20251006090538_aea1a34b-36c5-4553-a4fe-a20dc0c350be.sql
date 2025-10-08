-- ========================================
-- DISABLE ADMIN APPROVAL SYSTEM
-- Semua user yang signup akan langsung approved
-- ========================================

-- 1. Update trigger handle_new_user agar auto-approve semua user baru
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
    TRUE,  -- Auto-approve semua user
    NOW()  -- Set approved_at langsung
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Jika username sudah ada, tambahkan suffix angka
    INSERT INTO public.profiles (user_id, email, username, is_approved, approved_at)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)) || '_' || substr(NEW.id::text, 1, 4),
      TRUE,
      NOW()
    );
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- 2. Approve semua existing users yang belum di-approve
UPDATE public.profiles
SET 
  is_approved = TRUE,
  approved_at = COALESCE(approved_at, NOW())
WHERE is_approved = FALSE;