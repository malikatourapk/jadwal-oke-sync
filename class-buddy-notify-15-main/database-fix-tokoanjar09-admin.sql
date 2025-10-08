-- ========================================
-- FIX ADMIN ACCOUNT: tokoanjar09@gmail.com
-- Script ini akan:
-- 1. Confirm email (bypass email verification)
-- 2. Set profile as approved
-- 3. Assign admin role
-- ========================================

DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- 1. Cari user_id dari email tokoanjar09@gmail.com
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'tokoanjar09@gmail.com';

  IF admin_user_id IS NOT NULL THEN
    -- 2. Confirm email (bypass verification)
    -- Note: confirmed_at is a GENERATED column, only update email_confirmed_at
    UPDATE auth.users
    SET email_confirmed_at = NOW()
    WHERE id = admin_user_id
      AND email_confirmed_at IS NULL;

    -- 3. CRITICAL: Update profile dengan is_approved = TRUE
    -- Ini yang bikin gagal login!
    UPDATE public.profiles
    SET 
      is_approved = TRUE,
      approved_at = NOW()
    WHERE user_id = admin_user_id;

    -- Jika profile belum ada, create
    INSERT INTO public.profiles (user_id, email, username, is_approved, approved_at)
    VALUES (
      admin_user_id,
      'tokoanjar09@gmail.com',
      'tokoanjar09',
      TRUE,
      NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;

    -- 4. Assign admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    RAISE NOTICE '✅ SUCCESS: tokoanjar09@gmail.com is now admin and can login!';
  ELSE
    RAISE NOTICE '❌ ERROR: User tokoanjar09@gmail.com not found in auth.users. Please sign up first.';
  END IF;
END $$;

-- 5. Verify hasil
SELECT 
  u.id as user_id,
  u.email,
  u.email_confirmed_at,
  p.username,
  p.is_approved,
  p.approved_at,
  ur.role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'tokoanjar09@gmail.com';
