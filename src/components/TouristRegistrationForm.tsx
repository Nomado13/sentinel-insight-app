import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { QRCodeSVG } from 'qrcode.react';
import { CalendarIcon, Download, QrCode, User, Phone, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface TouristData {
  touristId: string;
  name: string;
  passport: string;
  emergencyContact: string;
  tripStart: string;
  tripEnd: string;
  status: string;
}

interface Props {
  onSuccess: () => void;
}

export const TouristRegistrationForm: React.FC<Props> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    passport: '',
    emergencyContact: '',
    tripStart: '',
    tripEnd: ''
  });
  const [qrData, setQrData] = useState<TouristData | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateTouristId = () => {
    const prefix = 'TID';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.passport || !formData.emergencyContact || 
        !formData.tripStart || !formData.tripEnd) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    
    try {
      const touristId = generateTouristId();
      
      // Create tourist data for QR code
      const touristData: TouristData = {
        touristId,
        name: formData.name,
        passport: formData.passport,
        emergencyContact: formData.emergencyContact,
        tripStart: formData.tripStart,
        tripEnd: formData.tripEnd,
        status: 'active'
      };

      // Insert into database with sample coordinates (India Gate, New Delhi)
      const { error } = await supabase
        .from('tourists')
        .insert([{
          tourist_id: touristId,
          name: formData.name,
          passport_number: formData.passport,
          emergency_contact: formData.emergencyContact,
          trip_start: formData.tripStart,
          trip_end: formData.tripEnd,
          status: 'active',
          latitude: 28.6129 + (Math.random() - 0.5) * 0.01, // Random nearby coordinates
          longitude: 77.2295 + (Math.random() - 0.5) * 0.01,
          location_name: 'New Delhi Area'
        }]);

      if (error) throw error;

      setQrData(touristData);
      
      toast({
        title: 'Success',
        description: `Tourist registered successfully with ID: ${touristId}`,
      });
    } catch (error) {
      console.error('Error registering tourist:', error);
      toast({
        title: 'Error',
        description: 'Failed to register tourist. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    const svg = document.getElementById('qr-code');
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
        downloadLink.download = `tourist-qr-${qrData?.touristId}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      passport: '',
      emergencyContact: '',
      tripStart: '',
      tripEnd: ''
    });
    setQrData(null);
  };

  if (qrData) {
    return (
      <Card className="shadow-elevated">
        <CardContent className="p-6">
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <QrCode className="h-12 w-12 text-authority mx-auto" />
              <h3 className="text-xl font-semibold text-foreground">Tourist ID Generated</h3>
              <p className="text-muted-foreground">
                Registration successful for <strong>{qrData.name}</strong>
              </p>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <QRCodeSVG
                id="qr-code"
                value={JSON.stringify(qrData)}
                size={200}
                level="M"
                includeMargin={true}
                className="mx-auto border-2 border-border rounded-lg"
              />
            </div>

            <div className="bg-card border border-border rounded-lg p-4 text-left space-y-2">
              <h4 className="font-semibold text-foreground">Tourist Details:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">ID:</span>
                <span className="font-mono text-authority">{qrData.touristId}</span>
                <span className="text-muted-foreground">Name:</span>
                <span>{qrData.name}</span>
                <span className="text-muted-foreground">Contact:</span>
                <span>{qrData.emergencyContact}</span>
                <span className="text-muted-foreground">Duration:</span>
                <span>{format(new Date(qrData.tripStart), 'MMM dd')} - {format(new Date(qrData.tripEnd), 'MMM dd, yyyy')}</span>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button 
                onClick={downloadQRCode}
                className="flex-1 bg-gradient-authority hover:opacity-90"
              >
                <Download className="h-4 w-4 mr-2" />
                Download QR Code
              </Button>
              <Button 
                variant="outline" 
                onClick={handleReset}
                className="flex-1 border-authority text-authority hover:bg-authority hover:text-white"
              >
                Register Another
              </Button>
            </div>

            <Button 
              onClick={onSuccess}
              variant="secondary"
              className="w-full"
            >
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Full Name *</span>
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="focus:ring-authority focus:border-authority"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="passport" className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4" />
                <span>Passport/Aadhaar Number *</span>
              </Label>
              <Input
                id="passport"
                type="text"
                placeholder="Enter passport or Aadhaar number"
                value={formData.passport}
                onChange={(e) => setFormData({ ...formData, passport: e.target.value })}
                className="focus:ring-authority focus:border-authority"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact" className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>Emergency Contact *</span>
              </Label>
              <Input
                id="contact"
                type="tel"
                placeholder="+91 9876543210"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                className="focus:ring-authority focus:border-authority"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tripStart" className="flex items-center space-x-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span>Trip Start *</span>
                </Label>
                <Input
                  id="tripStart"
                  type="date"
                  value={formData.tripStart}
                  onChange={(e) => setFormData({ ...formData, tripStart: e.target.value })}
                  className="focus:ring-authority focus:border-authority"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tripEnd" className="flex items-center space-x-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span>Trip End *</span>
                </Label>
                <Input
                  id="tripEnd"
                  type="date"
                  value={formData.tripEnd}
                  onChange={(e) => setFormData({ ...formData, tripEnd: e.target.value })}
                  className="focus:ring-authority focus:border-authority"
                  min={formData.tripStart}
                  required
                />
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-authority hover:opacity-90 shadow-authority"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating ID...
              </>
            ) : (
              <>
                <QrCode className="h-4 w-4 mr-2" />
                Generate Tourist ID
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};