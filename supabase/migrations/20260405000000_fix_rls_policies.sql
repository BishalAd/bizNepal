-- Ensure RLS policies are correct for dashboard data visibility

-- OFFERS: Owner can view/manage their own business offers
DROP POLICY IF EXISTS "Owners can view their own business offers" ON public.offers;
CREATE POLICY "Owners can view their own business offers" ON public.offers
FOR SELECT
TO authenticated
USING (
  business_id IN (
    SELECT id FROM public.businesses WHERE owner_id = auth.uid()
  )
);

-- ORDERS: Owner can view/manage their own business orders
DROP POLICY IF EXISTS "Owners can view their own business orders" ON public.orders;
CREATE POLICY "Owners can view their own business orders" ON public.orders
FOR SELECT
TO authenticated
USING (
  business_id IN (
    SELECT id FROM public.businesses WHERE owner_id = auth.uid()
  )
);

-- JOBS: Owner can view/manage their own business jobs
DROP POLICY IF EXISTS "Owners can view their own business jobs" ON public.jobs;
CREATE POLICY "Owners can view their own business jobs" ON public.jobs
FOR SELECT
TO authenticated
USING (
  business_id IN (
    SELECT id FROM public.businesses WHERE owner_id = auth.uid()
  )
);

-- JOB APPLICATIONS: Owner can view applications for their own jobs
DROP POLICY IF EXISTS "Owners can view applications for their jobs" ON public.job_applications;
CREATE POLICY "Owners can view applications for their jobs" ON public.job_applications
FOR SELECT
TO authenticated
USING (
  job_id IN (
    SELECT id FROM public.jobs WHERE business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  )
);

-- EVENT BOOKINGS: Owner can view bookings for their own events
DROP POLICY IF EXISTS "Owners can view bookings for their events" ON public.event_bookings;
CREATE POLICY "Owners can view bookings for their events" ON public.event_bookings
FOR SELECT
TO authenticated
USING (
  event_id IN (
    SELECT id FROM public.events WHERE business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  )
);
