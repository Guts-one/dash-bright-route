import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MapPin, Clock, Fuel, Wrench, Package, Shield, Eye, UserCheck, 
  ArrowLeft, CheckCircle, XCircle, Truck 
} from 'lucide-react';

export default function TransparencyPage() {
  const trackedItems = [
    {
      icon: MapPin,
      title: 'Real-Time Location',
      purpose: 'Accurate ETAs & Customer Communication',
      description: 'We track truck locations during work hours to provide customers with accurate delivery windows and to help dispatchers optimize routes.',
      notUsedFor: 'Personal surveillance or off-hours monitoring',
    },
    {
      icon: Clock,
      title: 'Route & Stop Times',
      purpose: 'Operational Efficiency & Safety',
      description: 'Stop durations help identify loading dock delays, traffic issues, and ensure adequate break times for driver safety and compliance.',
      notUsedFor: 'Micromanaging or punitive measures',
    },
    {
      icon: Fuel,
      title: 'Fuel & Mileage',
      purpose: 'Cost Management & Maintenance Planning',
      description: 'Aggregate fuel data helps the company manage costs and plan for vehicle maintenance. Individual driving patterns are not analyzed.',
      notUsedFor: 'Individual driver performance scoring',
    },
    {
      icon: Wrench,
      title: 'Maintenance Alerts',
      purpose: 'Vehicle Safety & Longevity',
      description: 'Automated alerts ensure trucks receive timely service, keeping drivers safe and preventing breakdowns.',
      notUsedFor: 'Driver blame for maintenance issues',
    },
    {
      icon: Package,
      title: 'Proof of Delivery',
      purpose: 'Customer Accountability & Driver Protection',
      description: 'Digital signatures and issue reports protect both drivers and the company in case of disputes.',
      notUsedFor: 'Speed or efficiency quotas',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Truck className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">FleetTrack Pro</span>
          </div>
          <Button variant="ghost" asChild>
            <Link to="/auth">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <Eye className="w-4 h-4" />
            <span className="text-sm font-medium">Transparency First</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">What We Track & Why</h1>
          <p className="text-lg text-muted-foreground">
            FleetTrack Pro is designed for operational excellence, not surveillance. 
            We believe in full transparency about what data is collected and how it's used 
            to support our team's success.
          </p>
        </div>
      </section>

      {/* Data Cards */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {trackedItems.map((item) => (
              <Card key={item.title} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <p className="text-sm text-accent">{item.purpose}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                    <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-destructive">Not used for:</p>
                      <p className="text-xs text-muted-foreground">{item.notUsedFor}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Commitments */}
      <section className="py-12 bg-muted/50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl font-bold text-center mb-8">Our Commitments</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-status-at-customer/30 bg-status-at-customer/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-status-at-customer shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Work Hours Only</h3>
                    <p className="text-sm text-muted-foreground">
                      Tracking is only active during scheduled work hours. 
                      Off-duty time is private and never monitored.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-status-at-customer/30 bg-status-at-customer/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-status-at-customer shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Data Minimization</h3>
                    <p className="text-sm text-muted-foreground">
                      We only collect what's necessary for operations. 
                      No cameras, no audio recording, no personal device tracking.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-status-at-customer/30 bg-status-at-customer/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-status-at-customer shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Aggregate Reporting</h3>
                    <p className="text-sm text-muted-foreground">
                      Reports focus on fleet-wide trends, not individual driver rankings. 
                      Data supports the team, not competition.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-status-at-customer/30 bg-status-at-customer/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-status-at-customer shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Driver Access</h3>
                    <p className="text-sm text-muted-foreground">
                      Drivers can view their own data anytime. 
                      Full transparency means you always know what we know.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Data Retention */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-bold mb-4">Data Retention Policy</h2>
          <p className="text-muted-foreground mb-6">
            GPS and route data is retained for <strong>90 days</strong> for operational purposes, 
            then automatically deleted. Delivery records are kept for 
            <strong> 2 years</strong> for compliance and dispute resolution.
          </p>
          <p className="text-sm text-muted-foreground italic">
            Note: This is a demo application. In production, consult with legal and union 
            representatives to establish appropriate data governance policies.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Questions about our tracking practices?</p>
          <p className="mt-1">
            Contact your fleet manager or HR representative for more information.
          </p>
        </div>
      </footer>
    </div>
  );
}
