import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { StatusBadge } from '@/components/StatusBadge';
import { SignatureCanvas, SignatureCanvasRef } from '@/components/SignatureCanvas';
import { useDriverDeliveries, useUpdateDelivery, useTrucks } from '@/hooks/useFleetData';
import { supabase } from '@/integrations/supabase/client';
import { Delivery, DelayReason, IssueCategory } from '@/lib/types';
import { 
  Truck, LogOut, MapPin, Package, Clock, CheckCircle, 
  AlertCircle, Eye, WifiOff, Wifi, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

export default function DriverHome() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  
  const { data: deliveries, isLoading, refetch } = useDriverDeliveries(user?.id || '');
  const { data: trucks } = useTrucks();
  const updateDelivery = useUpdateDelivery();
  
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showDelayDialog, setShowDelayDialog] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [pendingSync, setPendingSync] = useState<string[]>([]);
  
  // Complete delivery form state
  const [hasIssue, setHasIssue] = useState(false);
  const [issueCategory, setIssueCategory] = useState<IssueCategory | ''>('');
  const [issueNotes, setIssueNotes] = useState('');
  const signatureRef = useRef<SignatureCanvasRef>(null);
  
  // Delay form state
  const [delayReason, setDelayReason] = useState<DelayReason | ''>('');

  // Get driver's truck
  const myTruck = trucks?.find(t => t.driver_id === user?.id);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleArrived = async (delivery: Delivery) => {
    try {
      await updateDelivery.mutateAsync({
        id: delivery.id,
        updates: { status: 'in_progress' }
      });
      toast.success('Marked as arrived');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const openCompleteDialog = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setHasIssue(false);
    setIssueCategory('');
    setIssueNotes('');
    setShowCompleteDialog(true);
  };

  const openDelayDialog = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setDelayReason('');
    setShowDelayDialog(true);
  };

  const handleCompleteDelivery = async () => {
    if (!selectedDelivery) return;

    // Validate
    if (!hasIssue && signatureRef.current?.isEmpty()) {
      toast.error('Please capture a signature');
      return;
    }

    if (hasIssue && !issueCategory) {
      toast.error('Please select an issue category');
      return;
    }

    try {
      let signatureUrl: string | undefined;

      // Upload signature if not an issue
      if (!hasIssue && signatureRef.current) {
        const signatureData = signatureRef.current.toDataURL();
        const base64Data = signatureData.split(',')[1];
        const fileName = `signature_${selectedDelivery.id}_${Date.now()}.png`;
        
        // Convert base64 to blob
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/png' });

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('signatures')
          .upload(fileName, blob);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('signatures')
          .getPublicUrl(fileName);
        
        signatureUrl = urlData.publicUrl;
      }

      // Handle offline mode
      if (isOffline) {
        setPendingSync(prev => [...prev, selectedDelivery.id]);
        toast.info('Saved offline', { description: 'Will sync when back online' });
        setShowCompleteDialog(false);
        return;
      }

      await updateDelivery.mutateAsync({
        id: selectedDelivery.id,
        updates: {
          status: hasIssue ? 'failed' : 'completed',
          completed_ts: new Date().toISOString(),
          signature_url: signatureUrl,
          issue_category: hasIssue ? (issueCategory as IssueCategory) : null,
          issue_notes: hasIssue ? issueNotes : null,
        }
      });

      toast.success(hasIssue ? 'Issue reported' : 'Delivery completed!');
      setShowCompleteDialog(false);
      refetch();
    } catch (error) {
      console.error('Error completing delivery:', error);
      toast.error('Failed to complete delivery');
    }
  };

  const handleAddDelay = async () => {
    if (!selectedDelivery || !delayReason) return;

    try {
      await updateDelivery.mutateAsync({
        id: selectedDelivery.id,
        updates: { delay_reason: delayReason }
      });
      toast.success('Delay reason added');
      setShowDelayDialog(false);
    } catch (error) {
      toast.error('Failed to add delay reason');
    }
  };

  // Sync pending when back online
  const handleToggleOffline = (offline: boolean) => {
    setIsOffline(offline);
    if (!offline && pendingSync.length > 0) {
      toast.info(`Syncing ${pendingSync.length} pending deliveries...`);
      // In a real app, we'd sync the pending items here
      setTimeout(() => {
        setPendingSync([]);
        toast.success('All items synced!');
        refetch();
      }, 2000);
    }
  };

  const completedCount = deliveries?.filter(d => d.status === 'completed').length || 0;
  const totalCount = deliveries?.length || 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <Truck className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-sm">FleetTrack Pro</h1>
              <p className="text-xs text-muted-foreground">Driver View</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Offline toggle */}
            <div className="flex items-center gap-2 mr-2">
              {isOffline ? (
                <WifiOff className="w-4 h-4 text-alert-warning" />
              ) : (
                <Wifi className="w-4 h-4 text-status-at-customer" />
              )}
              <Switch
                checked={isOffline}
                onCheckedChange={handleToggleOffline}
                aria-label="Toggle offline mode"
              />
            </div>

            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 space-y-4">
        {/* Welcome + Truck Info */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Hello, {profile?.name?.split(' ')[0]}!</h2>
            {myTruck && (
              <p className="text-sm text-muted-foreground">
                {myTruck.name} • {myTruck.plate}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{completedCount}/{totalCount}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
        </div>

        {/* Pending sync badge */}
        {pendingSync.length > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-alert-warning/10 border border-alert-warning/30 text-sm">
            <WifiOff className="w-4 h-4 text-alert-warning" />
            <span>{pendingSync.length} delivery(ies) pending sync</span>
          </div>
        )}

        {/* Today's Route */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              Today's Route
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">Loading...</p>
            ) : deliveries && deliveries.length > 0 ? (
              deliveries.map((delivery) => (
                <div
                  key={delivery.id}
                  className={`driver-stop-card ${
                    delivery.status === 'completed'
                      ? 'border-status-at-customer/30 bg-status-at-customer/5'
                      : delivery.status === 'failed'
                      ? 'border-destructive/30 bg-destructive/5'
                      : delivery.status === 'in_progress'
                      ? 'border-accent/30 bg-accent/5'
                      : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                    {delivery.stop_order}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{delivery.customer?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {delivery.customer?.address || 'Address not available'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status={delivery.status} type="delivery" size="sm" showIcon={false} />
                    
                    {delivery.status === 'pending' && (
                      <Button size="sm" onClick={() => handleArrived(delivery)}>
                        Arrived
                      </Button>
                    )}
                    
                    {delivery.status === 'in_progress' && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => openDelayDialog(delivery)}>
                          <Clock className="w-3 h-3" />
                        </Button>
                        <Button size="sm" onClick={() => openCompleteDialog(delivery)}>
                          Complete
                        </Button>
                      </div>
                    )}
                    
                    {(delivery.status === 'completed' || delivery.status === 'failed') && (
                      <CheckCircle className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No deliveries scheduled for today</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transparency link */}
        <Link
          to="/transparency"
          className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-primary" />
            <span className="font-medium">What We Track & Why</span>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </Link>
      </main>

      {/* Complete Delivery Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Delivery</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="has-issue">Report an issue?</Label>
              <Switch
                id="has-issue"
                checked={hasIssue}
                onCheckedChange={setHasIssue}
              />
            </div>

            {hasIssue ? (
              <>
                <div className="space-y-2">
                  <Label>Issue Category</Label>
                  <Select value={issueCategory} onValueChange={(v) => setIssueCategory(v as IssueCategory)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select issue type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="damage">Damage</SelectItem>
                      <SelectItem value="refused">Customer Refused</SelectItem>
                      <SelectItem value="missing_items">Missing Items</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={issueNotes}
                    onChange={(e) => setIssueNotes(e.target.value)}
                    placeholder="Describe the issue..."
                    rows={3}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label>Customer Signature</Label>
                <SignatureCanvas ref={signatureRef} />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCompleteDelivery} disabled={updateDelivery.isPending}>
              {hasIssue ? 'Report Issue' : 'Complete Delivery'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delay Reason Dialog */}
      <Dialog open={showDelayDialog} onOpenChange={setShowDelayDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Delay Reason</DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            <Label>Reason</Label>
            <Select value={delayReason} onValueChange={(v) => setDelayReason(v as DelayReason)}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="traffic">Traffic</SelectItem>
                <SelectItem value="queue">Queue at Customer</SelectItem>
                <SelectItem value="loading">Loading/Unloading</SelectItem>
                <SelectItem value="roadwork">Roadwork</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelayDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddDelay} disabled={!delayReason || updateDelivery.isPending}>
              Add Delay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
