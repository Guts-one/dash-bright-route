-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('manager', 'driver');

-- Create user roles table for RBAC
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create customers table
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  geofence_radius_m INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create trucks table
CREATE TABLE public.trucks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  driver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_lat DOUBLE PRECISION,
  last_lng DOUBLE PRECISION,
  last_update_ts TIMESTAMPTZ,
  last_speed DOUBLE PRECISION DEFAULT 0,
  odometer_km DOUBLE PRECISION DEFAULT 0,
  fuel_used_l DOUBLE PRECISION DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create routes table
CREATE TABLE public.routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  truck_id UUID REFERENCES public.trucks(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  planned_path JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (truck_id, date)
);

-- Create gps_events table
CREATE TABLE public.gps_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  truck_id UUID REFERENCES public.trucks(id) ON DELETE CASCADE NOT NULL,
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  speed DOUBLE PRECISION DEFAULT 0
);

-- Create deliveries table
CREATE TABLE public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID REFERENCES public.routes(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  truck_id UUID REFERENCES public.trucks(id) ON DELETE CASCADE NOT NULL,
  driver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  stop_order INTEGER NOT NULL DEFAULT 1,
  completed_ts TIMESTAMPTZ,
  signature_url TEXT,
  issue_category TEXT CHECK (issue_category IN ('damage', 'refused', 'missing_items', 'other', NULL)),
  issue_notes TEXT,
  delay_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create maintenance_rules table
CREATE TABLE public.maintenance_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  truck_id UUID REFERENCES public.trucks(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('oil', 'tires', 'inspection', 'brakes', 'filters', 'transmission')),
  interval_km INTEGER NOT NULL,
  interval_days INTEGER NOT NULL,
  last_service_km DOUBLE PRECISION NOT NULL DEFAULT 0,
  last_service_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create maintenance_alerts table
CREATE TABLE public.maintenance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  truck_id UUID REFERENCES public.trucks(id) ON DELETE CASCADE NOT NULL,
  rule_id UUID REFERENCES public.maintenance_rules(id) ON DELETE CASCADE NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('due_soon', 'overdue')),
  message TEXT NOT NULL,
  created_ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_ts TIMESTAMPTZ
);

-- Create route_deviation_events table
CREATE TABLE public.route_deviation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  truck_id UUID REFERENCES public.trucks(id) ON DELETE CASCADE NOT NULL,
  route_id UUID REFERENCES public.routes(id) ON DELETE CASCADE NOT NULL,
  start_ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_ts TIMESTAMPTZ,
  max_distance_m DOUBLE PRECISION NOT NULL DEFAULT 0,
  notes TEXT
);

-- Enable Row Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trucks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gps_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_deviation_events ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Managers can view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'manager'));

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Managers can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for customers (all authenticated can view)
CREATE POLICY "Authenticated users can view customers" ON public.customers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers can manage customers" ON public.customers
  FOR ALL USING (public.has_role(auth.uid(), 'manager'));

-- RLS Policies for trucks
CREATE POLICY "Managers can view all trucks" ON public.trucks
  FOR SELECT USING (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Drivers can view assigned truck" ON public.trucks
  FOR SELECT USING (driver_id = auth.uid());

CREATE POLICY "Managers can manage trucks" ON public.trucks
  FOR ALL USING (public.has_role(auth.uid(), 'manager'));

-- RLS Policies for routes
CREATE POLICY "Managers can view all routes" ON public.routes
  FOR SELECT USING (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Drivers can view own routes" ON public.routes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trucks 
      WHERE trucks.id = routes.truck_id 
      AND trucks.driver_id = auth.uid()
    )
  );

CREATE POLICY "Managers can manage routes" ON public.routes
  FOR ALL USING (public.has_role(auth.uid(), 'manager'));

-- RLS Policies for gps_events
CREATE POLICY "Managers can view all gps_events" ON public.gps_events
  FOR SELECT USING (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Drivers can view own truck gps_events" ON public.gps_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trucks 
      WHERE trucks.id = gps_events.truck_id 
      AND trucks.driver_id = auth.uid()
    )
  );

CREATE POLICY "System can insert gps_events" ON public.gps_events
  FOR INSERT TO authenticated WITH CHECK (true);

-- RLS Policies for deliveries
CREATE POLICY "Managers can view all deliveries" ON public.deliveries
  FOR SELECT USING (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Drivers can view own deliveries" ON public.deliveries
  FOR SELECT USING (driver_id = auth.uid());

CREATE POLICY "Drivers can update own deliveries" ON public.deliveries
  FOR UPDATE USING (driver_id = auth.uid());

CREATE POLICY "Managers can manage deliveries" ON public.deliveries
  FOR ALL USING (public.has_role(auth.uid(), 'manager'));

-- RLS Policies for maintenance_rules
CREATE POLICY "Managers can view all maintenance_rules" ON public.maintenance_rules
  FOR SELECT USING (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Managers can manage maintenance_rules" ON public.maintenance_rules
  FOR ALL USING (public.has_role(auth.uid(), 'manager'));

-- RLS Policies for maintenance_alerts
CREATE POLICY "Managers can view all maintenance_alerts" ON public.maintenance_alerts
  FOR SELECT USING (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Managers can manage maintenance_alerts" ON public.maintenance_alerts
  FOR ALL USING (public.has_role(auth.uid(), 'manager'));

-- RLS Policies for route_deviation_events
CREATE POLICY "Managers can view all deviations" ON public.route_deviation_events
  FOR SELECT USING (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Managers can manage deviations" ON public.route_deviation_events
  FOR ALL USING (public.has_role(auth.uid(), 'manager'));

-- Create storage bucket for signatures
INSERT INTO storage.buckets (id, name, public) VALUES ('signatures', 'signatures', true);

-- Storage policies for signatures
CREATE POLICY "Anyone can view signatures" ON storage.objects
  FOR SELECT USING (bucket_id = 'signatures');

CREATE POLICY "Authenticated users can upload signatures" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'signatures');

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.trucks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deliveries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.maintenance_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gps_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.route_deviation_events;

-- Create trigger for updated_at on profiles
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();