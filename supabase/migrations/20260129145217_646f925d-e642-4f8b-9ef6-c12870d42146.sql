-- Fix the overly permissive gps_events INSERT policy
DROP POLICY IF EXISTS "System can insert gps_events" ON public.gps_events;

-- More restrictive: only allow inserting for trucks assigned to the driver OR managers
CREATE POLICY "Drivers can insert gps_events for assigned truck" ON public.gps_events
  FOR INSERT TO authenticated 
  WITH CHECK (
    public.has_role(auth.uid(), 'manager') OR
    EXISTS (
      SELECT 1 FROM public.trucks 
      WHERE trucks.id = gps_events.truck_id 
      AND trucks.driver_id = auth.uid()
    )
  );