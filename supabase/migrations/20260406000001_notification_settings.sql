-- Migration: Add notification settings columns to businesses table
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS tg_notify_new_order boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS tg_notify_job_application boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS tg_notify_event_booking boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS tg_notify_new_review boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS tg_notify_offer_grab boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS tg_notify_new_job boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS tg_notify_new_event boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS tg_notify_new_product boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS tg_notify_new_offer boolean DEFAULT true;

-- Ensure these columns have data for existing businesses
UPDATE public.businesses
SET 
  tg_notify_new_order = COALESCE(tg_notify_new_order, true),
  tg_notify_job_application = COALESCE(tg_notify_job_application, true),
  tg_notify_event_booking = COALESCE(tg_notify_event_booking, true),
  tg_notify_new_review = COALESCE(tg_notify_new_review, true),
  tg_notify_offer_grab = COALESCE(tg_notify_offer_grab, true),
  tg_notify_new_job = COALESCE(tg_notify_new_job, true),
  tg_notify_new_event = COALESCE(tg_notify_new_event, true),
  tg_notify_new_product = COALESCE(tg_notify_new_product, true),
  tg_notify_new_offer = COALESCE(tg_notify_new_offer, true);
