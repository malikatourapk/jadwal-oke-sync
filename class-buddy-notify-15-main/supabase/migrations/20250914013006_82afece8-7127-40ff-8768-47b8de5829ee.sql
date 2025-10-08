-- Fix search_path for existing functions to address security warnings
CREATE OR REPLACE FUNCTION public.get_user_by_username_or_email(identifier text)
 RETURNS TABLE(email text, username text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT p.email, p.username
  FROM public.profiles p
  WHERE p.username = identifier OR p.email = identifier
  LIMIT 1;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, username)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$function$;