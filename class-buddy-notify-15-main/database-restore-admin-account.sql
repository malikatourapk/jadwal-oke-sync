-- ========================================
-- RESTORE ADMIN ACCOUNT
-- Script ini akan confirm email dan approve akun admin
-- ========================================

DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Cari user_id dari email tokoanjar09@gmail.com
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'tokoanjar09@gmail.com';

  IF admin_user_id IS NOT NULL THEN
    -- 1. Confirm email (bypass verification)
    UPDATE auth.users
    SET email_confirmed_at = NOW()
    WHERE id = admin_user_id;

    -- 2. Create atau update profile dengan is_approved = TRUE
    INSERT INTO public.profiles (user_id, email, username, is_approved, approved_at)
    VALUES (
      admin_user_id,
      'tokoanjar09@gmail.com',
      'tokoanjar09',
      TRUE,
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE
    SET 
      is_approved = TRUE,
      approved_at = COALESCE(public.profiles.approved_at, NOW());

    -- 3. Assign admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    RAISE NOTICE '✅ SUCCESS: tokoanjar09@gmail.com sudah diaktifkan dan bisa login!';
  ELSE
    RAISE NOTICE '❌ ERROR: User tokoanjar09@gmail.com tidak ditemukan. Silakan sign up terlebih dahulu.';
  END IF;
END $$;

-- Verifikasi hasil
SELECT 
  u.email,
  u.email_confirmed_at,
  p.username,
  p.is_approved,
  ur.role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'tokoanjar09@gmail.com';
