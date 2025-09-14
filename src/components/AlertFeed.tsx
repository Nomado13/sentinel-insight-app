import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Clock, MapPin, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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

interface Props {
  alerts: AlertItem[];
  onAlertClick: (alert: AlertItem) => void;
}

export const AlertFeed: React.FC<Props> = ({ alerts, onAlertClick }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-alert-critical-bg text-alert-critical border-alert-critical';
      case 'medium':
        return 'bg-alert-warning-bg text-alert-warning border-alert-warning';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getAlertIcon = (type: string, severity: string) => {
    const iconClass = severity === 'high' ? 'text-alert-critical' : 'text-alert-warning';
    
    if (type === 'panic') {
      return <AlertTriangle className={`h-4 w-4 ${iconClass}`} />;
    }
    return <Clock className={`h-4 w-4 ${iconClass}`} />;
  };

  const getAlertTitle = (type: string) => {
    return type === 'panic' ? 'Panic Alert' : 'Inactivity Alert';
  };

  if (alerts.length === 0) {
    return (
      <div className="p-4">
        <Card className="bg-muted/50">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Active Alerts</h3>
            <p className="text-sm text-muted-foreground">
              All tourists are safe and accounted for.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <ScrollArea className="h-[calc(100vh-300px)]">
        <div className="p-4 space-y-3">
          {alerts.map((alert) => (
            <Card 
              key={alert.id} 
              className={`cursor-pointer transition-all duration-200 hover:shadow-md border-l-4 ${
                alert.severity === 'high' 
                  ? 'border-l-alert-critical bg-alert-critical-bg/10' 
                  : 'border-l-alert-warning bg-alert-warning-bg/10'
              }`}
              onClick={() => onAlertClick(alert)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getAlertIcon(alert.type, alert.severity)}
                    <h4 className="font-semibold text-sm text-foreground">
                      {getAlertTitle(alert.type)}
                    </h4>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getSeverityColor(alert.severity)}`}
                  >
                    {alert.severity.toUpperCase()}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      ID: {alert.tourist_id}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {alert.message}
                  </p>

                  {alert.location_name && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground truncate">
                        {alert.location_name}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                    </span>
                    
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-7 px-2 text-xs border-authority text-authority hover:bg-authority hover:text-white"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};