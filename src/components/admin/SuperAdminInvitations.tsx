import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Send, UserPlus, Users, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext'; // Using the real context

// --- Main Component ---
export const SuperAdminInvitations: React.FC = () => {
  const [form, setForm] = useState({ email: '', fullName: '' });
  const [invitations, setInvitations] = useState<any[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0); // To trigger list refresh
  const { toast } = useToast();
  const { session, isSuperAdmin } = useAuth();

  // Fetch pending invitations
  const fetchInvitations = useCallback(async () => {
    setIsLoadingList(true);
    try {
      // RLS policy on the 'invitations' table ensures only a super admin can read all records.
      const { data, error } = await supabase
        .from('invitations')
        .select('id, email, full_name, status, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error: any) {
      toast({
        title: "❌ Error fetching invitations",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoadingList(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchInvitations();
    }
  }, [isSuperAdmin, refreshKey, fetchInvitations]);


  const handleInputChange = (field: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Send invitation function
  const sendInvitation = async () => {
    if (!form.email.trim() || !form.fullName.trim()) {
        toast({ title: "Validation Error", description: "Email and Full Name are required.", variant: "destructive" });
        return;
    }

    setIsSending(true);
    try {
      if (!session?.access_token) {
        throw new Error('Authentication session not found. Please log in again.');
      }

      const { error } = await supabase.functions.invoke('send-tenant-invitation', {
        body: {
          email: form.email.toLowerCase().trim(),
          full_name: form.fullName.trim(),
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "✅ Invitation Sent!",
        description: `Invitation has been successfully sent to ${form.email}.`,
        variant: "default"
      });

      setForm({ email: '', fullName: '' }); // Reset form
      setRefreshKey(prev => prev + 1); // Trigger list refresh

    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast({
        title: "❌ Error",
        description: error.message || 'An unexpected error occurred.',
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  // Render nothing if user is not super admin
  if (!isSuperAdmin) {
      return (
        <Alert variant="destructive">
            <AlertDescription>You do not have permission to view or manage invitations.</AlertDescription>
        </Alert>
      );
  }

  return (
    <div className="space-y-6">
      {/* --- Invitation Form Card --- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" />Invite New Tenant Owner</CardTitle>
          <CardDescription>Send an invitation to create a new tenant account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" placeholder="owner@company.com" value={form.email} onChange={(e) => handleInputChange('email', e.target.value)} disabled={isSending} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input id="fullName" type="text" placeholder="John Doe" value={form.fullName} onChange={(e) => handleInputChange('fullName', e.target.value)} disabled={isSending} />
            </div>
          </div>
          <Button onClick={sendInvitation} disabled={isSending || !form.email || !form.fullName} className="w-full md:w-auto">
            {isSending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : <><Send className="mr-2 h-4 w-4" />Send Invitation</>}
          </Button>
        </CardContent>
      </Card>

      {/* --- Pending Invitations List Card --- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Pending Invitations</CardTitle>
          <CardDescription>List of invitations that have been sent but not yet accepted.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingList ? (
            <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : invitations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center p-4">No pending invitations.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Sent At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.full_name}</TableCell>
                    <TableCell>{inv.email}</TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                           <Clock className="h-4 w-4 text-muted-foreground"/>
                           {new Date(inv.created_at).toLocaleString()}
                        </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};