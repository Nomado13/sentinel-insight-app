import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TouristRegistrationForm } from './TouristRegistrationForm';
import { TouristMap } from './TouristMap';
import { AlertFeed } from './AlertFeed';
import { TouristInfoModal } from './TouristInfoModal';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Users, AlertTriangle, Activity, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Tourist {
  id: string;
  tourist_id: string;
  name: string;
  passport_number: string;
  emergency_contact: string;
  trip_start: string;
  trip_end: string;
  status: string;
  latitude: number;
  longitude: number;
  location_name: string;
}

interface AlertItem {
  id: string;
  tourist_id: string;
  type: 'panic' | 'inactivity';
  message: string;
  latitude: number;
  longitude: number;
  location_name: string;
  severity: 'low' | 'medium' | 'high';
  status: string;
  created_at: string;
}

export const AuthorityDashboard = () => {
  const [tourists, setTourists] = useState<Tourist[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [selectedTourist, setSelectedTourist] = useState<Tourist | null>(null);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTourists();
    fetchAlerts();
    
    // Set up real-time subscriptions
    const touristsChannel = supabase
      .channel('tourists-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tourists'
      }, () => {
        fetchTourists();
      })
      .subscribe();

    const alertsChannel = supabase
      .channel('alerts-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'alerts'
      }, (payload) => {
        fetchAlerts();
        if (payload.eventType === 'INSERT') {
          const newAlert = payload.new as AlertItem;
          toast({
            title: `${newAlert.type === 'panic' ? '🚨 Panic Alert' : '⚠️ Inactivity Alert'}`,
            description: newAlert.message,
            variant: newAlert.severity === 'high' ? 'destructive' : 'default',
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(touristsChannel);
      supabase.removeChannel(alertsChannel);
    };
  }, [toast]);

  const fetchTourists = async () => {
    try {
      const { data, error } = await supabase
        .from('tourists')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTourists(data || []);
    } catch (error) {
      console.error('Error fetching tourists:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch tourists data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAlerts((data || []) as AlertItem[]);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const handleTouristRegistered = () => {
    setIsRegistrationOpen(false);
    fetchTourists();
    toast({
      title: 'Success',
      description: 'Tourist registered successfully',
    });
  };

  const activeTourists = tourists.filter(t => t.status === 'active').length;
  const criticalAlerts = alerts.filter(a => a.severity === 'high').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-authority" />
          <p className="text-muted-foreground">Loading Authority Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-header bg-gradient-authority shadow-elevated border-b border-border">
        <div className="h-full px-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Shield className="h-8 w-8 text-white" />
            <div>
              <h1 className="text-2xl font-bold text-white">Authority Dashboard</h1>
              <p className="text-blue-100">Tourist Safety Management Portal</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              <Bell className="h-4 w-4 mr-2" />
              {alerts.length} Active Alerts
            </Badge>
            <Button 
              onClick={() => setIsRegistrationOpen(true)}
              className="bg-white text-authority hover:bg-blue-50 shadow-md"
            >
              <Users className="h-4 w-4 mr-2" />
              Register Tourist
            </Button>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="flex">
        {/* Alert Sidebar */}
        <aside className="w-80 bg-card border-r border-border shadow-card">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-lg text-foreground">Live Alerts</h2>
            <p className="text-sm text-muted-foreground">Real-time notifications</p>
          </div>
          
          {/* Stats Cards */}
          <div className="p-4 space-y-3">
            <Card className="bg-gradient-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Tourists</p>
                    <p className="text-2xl font-bold text-authority">{activeTourists}</p>
                  </div>
                  <Users className="h-8 w-8 text-authority" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Critical Alerts</p>
                    <p className="text-2xl font-bold text-alert-critical">{criticalAlerts}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-alert-critical" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alert Feed */}
          <AlertFeed 
            alerts={alerts} 
            onAlertClick={(alert) => {
              const tourist = tourists.find(t => t.tourist_id === alert.tourist_id);
              if (tourist) setSelectedTourist(tourist);
            }}
          />
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <Card className="shadow-elevated">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>Tourist Locations</span>
                    <Badge variant="secondary">{tourists.length} Total</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <TouristMap 
                    tourists={tourists}
                    alerts={alerts}
                    onTouristClick={setSelectedTourist}
                  />
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-4">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full bg-gradient-authority hover:opacity-90"
                    onClick={() => setIsRegistrationOpen(true)}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Register New Tourist
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full border-authority text-authority hover:bg-authority hover:text-white"
                    onClick={fetchAlerts}
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    Refresh Alerts
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Database</span>
                      <Badge className="bg-alert-success text-white">Online</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Real-time Updates</span>
                      <Badge className="bg-alert-success text-white">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Alert System</span>
                      <Badge className="bg-alert-success text-white">Monitoring</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* Registration Modal */}
      <Dialog open={isRegistrationOpen} onOpenChange={setIsRegistrationOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Register New Tourist</DialogTitle>
          </DialogHeader>
          <TouristRegistrationForm onSuccess={handleTouristRegistered} />
        </DialogContent>
      </Dialog>

      {/* Tourist Info Modal */}
      {selectedTourist && (
        <TouristInfoModal
          tourist={selectedTourist}
          isOpen={!!selectedTourist}
          onClose={() => setSelectedTourist(null)}
        />
      )}
    </div>
  );
};