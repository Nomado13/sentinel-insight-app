import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';
import { 
  User, 
  Phone, 
  CreditCard, 
  Calendar, 
  MapPin, 
  FileText, 
  Download,
  QrCode,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
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

interface Props {
  tourist: Tourist;
  isOpen: boolean;
  onClose: () => void;
}

export const TouristInfoModal: React.FC<Props> = ({ tourist, isOpen, onClose }) => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loadingFIR, setLoadingFIR] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (tourist) {
      fetchTouristAlerts();
    }
  }, [tourist]);

  const fetchTouristAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('tourist_id', tourist.tourist_id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAlerts((data || []) as AlertItem[]);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const generateFIR = async () => {
    setLoadingFIR(true);
    
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('FIRST INFORMATION REPORT (FIR)', 105, 30, { align: 'center' });
      
      // Subheader
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('Tourist Safety Authority Dashboard', 105, 40, { align: 'center' });
      
      // Line separator
      doc.setLineWidth(0.5);
      doc.line(20, 50, 190, 50);
      
      // FIR Details
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('FIR DETAILS', 20, 65);
      
      doc.setFont('helvetica', 'normal');
      let yPos = 80;
      
      const addField = (label: string, value: string) => {
        doc.setFont('helvetica', 'bold');
        doc.text(`${label}:`, 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(value, 80, yPos);
        yPos += 10;
      };
      
      addField('Report Date', format(new Date(), 'dd/MM/yyyy HH:mm'));
      addField('Tourist Name', tourist.name);
      addField('Tourist ID', tourist.tourist_id);
      addField('Passport/Aadhaar', tourist.passport_number);
      addField('Emergency Contact', tourist.emergency_contact);
      addField('Trip Duration', `${format(new Date(tourist.trip_start), 'dd/MM/yyyy')} - ${format(new Date(tourist.trip_end), 'dd/MM/yyyy')}`);
      addField('Current Status', tourist.status.toUpperCase());
      addField('Last Known Location', tourist.location_name || 'Unknown');
      addField('Coordinates', `${tourist.latitude}, ${tourist.longitude}`);
      
      yPos += 10;
      
      // Alert Information
      if (alerts.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('ALERT INFORMATION', 20, yPos);
        yPos += 15;
        
        alerts.forEach((alert, index) => {
          doc.setFont('helvetica', 'bold');
          doc.text(`Alert ${index + 1}:`, 25, yPos);
          yPos += 8;
          
          doc.setFont('helvetica', 'normal');
          doc.text(`Type: ${alert.type.charAt(0).toUpperCase() + alert.type.slice(1)} Alert`, 30, yPos);
          yPos += 6;
          doc.text(`Severity: ${alert.severity.toUpperCase()}`, 30, yPos);
          yPos += 6;
          doc.text(`Time: ${format(new Date(alert.created_at), 'dd/MM/yyyy HH:mm')}`, 30, yPos);
          yPos += 6;
          doc.text(`Message: ${alert.message}`, 30, yPos);
          yPos += 6;
          doc.text(`Location: ${alert.location_name || 'Unknown'}`, 30, yPos);
          yPos += 15;
        });
      } else {
        doc.setFont('helvetica', 'bold');
        doc.text('ALERT INFORMATION', 20, yPos);
        yPos += 15;
        doc.setFont('helvetica', 'normal');
        doc.text('No active alerts recorded for this tourist.', 25, yPos);
        yPos += 20;
      }
      
      // Recommendations
      doc.setFont('helvetica', 'bold');
      doc.text('RECOMMENDATIONS', 20, yPos);
      yPos += 15;
      
      doc.setFont('helvetica', 'normal');
      const recommendations = [
        '1. Immediate contact with tourist via registered emergency contact number',
        '2. Coordinate with local authorities at last known location',
        '3. Review tourist\'s planned itinerary and accommodation details',
        '4. Monitor for any further alerts or location updates',
        '5. Escalate to search and rescue if no contact within 24 hours'
      ];
      
      recommendations.forEach(rec => {
        doc.text(rec, 25, yPos);
        yPos += 8;
      });
      
      // Footer
      yPos += 20;
      doc.setLineWidth(0.5);
      doc.line(20, yPos, 190, yPos);
      yPos += 15;
      
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.text('This report was auto-generated by the Tourist Safety Authority Dashboard', 105, yPos, { align: 'center' });
      doc.text(`Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`, 105, yPos + 10, { align: 'center' });
      
      // Save the PDF
      doc.save(`FIR_${tourist.tourist_id}_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`);
      
      toast({
        title: 'Success',
        description: 'FIR report generated and downloaded successfully',
      });
      
    } catch (error) {
      console.error('Error generating FIR:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate FIR report',
        variant: 'destructive',
      });
    } finally {
      setLoadingFIR(false);
    }
  };

  const downloadQRCode = () => {
    const svg = document.getElementById('tourist-qr-modal');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = function() {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `tourist-qr-${tourist.tourist_id}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  const touristQRData = {
    touristId: tourist.tourist_id,
    name: tourist.name,
    passport: tourist.passport_number,
    emergencyContact: tourist.emergency_contact,
    tripStart: tourist.trip_start,
    tripEnd: tourist.trip_end,
    status: tourist.status
  };

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'high');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <User className="h-6 w-6 text-authority" />
            <div>
              <span>Tourist Information</span>
              <p className="text-sm font-normal text-muted-foreground">
                ID: {tourist.tourist_id}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-4">
            {/* Status Alert */}
            {activeAlerts.length > 0 && (
              <Card className="border-l-4 border-l-alert-critical bg-alert-critical-bg/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-alert-critical" />
                    <span>Active Alerts ({activeAlerts.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {criticalAlerts.length > 0 && (
                      <Badge variant="destructive" className="bg-alert-critical">
                        {criticalAlerts.length} Critical Alert{criticalAlerts.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                    {activeAlerts.slice(0, 2).map((alert) => (
                      <div key={alert.id} className="text-sm">
                        <div className="flex items-center space-x-2">
                          {alert.type === 'panic' ? (
                            <AlertTriangle className="h-3 w-3 text-alert-critical" />
                          ) : (
                            <Clock className="h-3 w-3 text-alert-warning" />
                          )}
                          <span className="font-medium">
                            {alert.type === 'panic' ? 'Panic Alert' : 'Inactivity Alert'}
                          </span>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              alert.severity === 'high' 
                                ? 'border-alert-critical text-alert-critical' 
                                : 'border-alert-warning text-alert-warning'
                            }`}
                          >
                            {alert.severity}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mt-1">{alert.message}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Personal Information */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Full Name</span>
                    </div>
                    <p className="text-sm text-foreground font-medium">{tourist.name}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Passport/Aadhaar</span>
                    </div>
                    <p className="text-sm text-foreground font-mono">{tourist.passport_number}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Emergency Contact</span>
                    </div>
                    <p className="text-sm text-foreground font-mono">{tourist.emergency_contact}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Trip Duration</span>
                    </div>
                    <p className="text-sm text-foreground">
                      {format(new Date(tourist.trip_start), 'MMM dd')} - {format(new Date(tourist.trip_end), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Current Location</span>
                    </div>
                    <p className="text-sm text-foreground">{tourist.location_name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {tourist.latitude}, {tourist.longitude}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Status</span>
                    </div>
                    <Badge 
                      className={
                        tourist.status === 'active' 
                          ? 'bg-alert-success text-white' 
                          : 'bg-alert-warning text-white'
                      }
                    >
                      {tourist.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button 
                onClick={generateFIR}
                disabled={loadingFIR}
                className="flex-1 bg-gradient-alert hover:opacity-90"
              >
                {loadingFIR ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating FIR...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate FIR Report
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={downloadQRCode}
                className="flex-1 border-authority text-authority hover:bg-authority hover:text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Download QR Code
              </Button>
            </div>
          </div>

          {/* QR Code & Quick Info */}
          <div className="space-y-4">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-sm flex items-center space-x-2">
                  <QrCode className="h-4 w-4" />
                  <span>Tourist QR Code</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="bg-muted p-4 rounded-lg mb-4">
                  <QRCodeSVG
                    id="tourist-qr-modal"
                    value={JSON.stringify(touristQRData)}
                    size={160}
                    level="M"
                    includeMargin={true}
                    className="mx-auto border-2 border-border rounded-lg bg-white"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Scan for instant tourist verification
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-sm">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Alerts</span>
                  <Badge variant="secondary">{alerts.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Alerts</span>
                  <Badge className={activeAlerts.length > 0 ? 'bg-alert-warning text-white' : 'bg-alert-success text-white'}>
                    {activeAlerts.length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Critical Alerts</span>
                  <Badge className={criticalAlerts.length > 0 ? 'bg-alert-critical text-white' : 'bg-alert-success text-white'}>
                    {criticalAlerts.length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Days in Trip</span>
                  <Badge variant="outline">
                    {Math.ceil((new Date(tourist.trip_end).getTime() - new Date(tourist.trip_start).getTime()) / (1000 * 3600 * 24))}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};