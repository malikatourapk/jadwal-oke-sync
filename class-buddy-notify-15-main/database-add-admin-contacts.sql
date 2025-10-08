-- Add admin contact fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS admin_whatsapp TEXT,
ADD COLUMN IF NOT EXISTS admin_instagram TEXT;

-- Add comment to describe the columns
COMMENT ON COLUMN public.profiles.admin_whatsapp IS 'Admin WhatsApp number for user contact';
COMMENT ON COLUMN public.profiles.admin_instagram IS 'Admin Instagram username for user contact';
