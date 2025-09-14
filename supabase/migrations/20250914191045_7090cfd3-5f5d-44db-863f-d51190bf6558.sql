-- Create tourists table
CREATE TABLE public.tourists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tourist_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  passport_number TEXT NOT NULL,
  emergency_contact TEXT NOT NULL,
  trip_start DATE NOT NULL,
  trip_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create alerts table
CREATE TABLE public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tourist_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'panic' or 'inactivity'
  message TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_name TEXT,
  severity TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high'
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'resolved'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (tourist_id) REFERENCES public.tourists(tourist_id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.tourists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (authority dashboard)
CREATE POLICY "Allow all operations on tourists" 
ON public.tourists 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all operations on alerts" 
ON public.alerts 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_tourists_updated_at
    BEFORE UPDATE ON public.tourists
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at
    BEFORE UPDATE ON public.alerts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.tourists (tourist_id, name, passport_number, emergency_contact, trip_start, trip_end, status, latitude, longitude, location_name) VALUES
('TID-001', 'John Smith', 'P1234567', '+91 9876543210', '2025-01-10', '2025-01-20', 'active', 28.6139, 77.2090, 'India Gate, New Delhi'),
('TID-002', 'Sarah Johnson', 'A9876543', '+44 7123456789', '2025-01-12', '2025-01-18', 'active', 27.1751, 78.0421, 'Taj Mahal, Agra');

INSERT INTO public.alerts (tourist_id, type, message, latitude, longitude, location_name, severity) VALUES
('TID-001', 'panic', 'Emergency alert triggered by tourist', 28.6139, 77.2090, 'India Gate, New Delhi', 'high'),
('TID-002', 'inactivity', 'No activity detected for 4 hours', 27.1751, 78.0421, 'Taj Mahal, Agra', 'medium');