-- Fix security warnings by setting search_path for functions

-- Update get_user_by_username_or_email function
CREATE OR REPLACE FUNCTION public.get_user_by_username_or_email(username_or_email TEXT)
RETURNS TABLE (
  id UUID,
  email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.email
  FROM auth.users u
  INNER JOIN public.profiles p ON u.id = p.id
  WHERE p.username = username_or_email OR u.email = username_or_email
  LIMIT 1;
END;
$$;

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;