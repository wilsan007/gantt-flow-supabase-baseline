import { useState } from 'react';
import { useHRMinimal } from '@/hooks/useHRMinimal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Calendar, Plus, Check, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const LeaveManagement = () => {
  const { leaveRequests, absenceTypes, employees, loading, refresh } = useHRMinimal();
  const { toast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const { register, handleSubmit, reset, setValue, watch } = useForm();

  // Fonctions CRUD pour les demandes de congés
  const createLeaveRequest = async (data: any) => {
    const { error } = await supabase.from('leave_requests').insert([data]);

    if (error) throw error;

    toast({
      title: 'Succès',
      description: 'Demande de congé créée avec succès',
    });

    refresh();
  };

  const updateLeaveRequestStatus = async (requestId: string, status: string, reason?: string) => {
    const { error } = await supabase
      .from('leave_requests')
      .update({ status, rejection_reason: reason })
      .eq('id', requestId);

    if (error) throw error;

    toast({
      title: 'Succès',
      description: `Demande ${status === 'approved' ? 'approuvée' : 'rejetée'} avec succès`,
    });

    refresh();
  };

  // Filtres
  const filteredRequests = leaveRequests.filter(
    request => selectedStatus === 'all' || request.status === selectedStatus
  );

  // Handlers
  const onSubmit = async (data: any) => {
    try {
      // Calculate total days (simplified calculation)
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date);
      const totalDays =
        Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      await createLeaveRequest({
        employee_id: data.employee_id,
        absence_type_id: data.absence_type_id,
        start_date: data.start_date,
        end_date: data.end_date,
        total_days: totalDays,
        status: 'pending',
        reason: data.reason,
      });

      reset();
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Error creating leave request:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la demande',
        variant: 'destructive',
      });
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      await updateLeaveRequestStatus(requestId, 'approved');
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleReject = async (requestId: string) => {
    if (rejectionReason.trim()) {
      try {
        await updateLeaveRequestStatus(requestId, 'rejected', rejectionReason);
        setRejectionReason('');
        setSelectedRequestId(null);
      } catch (error) {
        console.error('Error rejecting request:', error);
      }
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Chargement des demandes de congés...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="from-primary to-accent bg-gradient-to-r bg-clip-text text-3xl font-bold text-transparent">
          Gestion des Congés
        </h2>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="hover-glow">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle demande
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Créer une demande de congé</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="employee_id">Employé</Label>
                <Select onValueChange={value => setValue('employee_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un employé" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(employee => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="absence_type_id">Type d'absence</Label>
                <Select onValueChange={value => setValue('absence_type_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {absenceTypes.map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Date de début</Label>
                  <Input
                    id="start_date"
                    type="date"
                    {...register('start_date', { required: true })}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">Date de fin</Label>
                  <Input id="end_date" type="date" {...register('end_date', { required: true })} />
                </div>
              </div>

              <div>
                <Label htmlFor="reason">Motif (optionnel)</Label>
                <Textarea
                  id="reason"
                  placeholder="Motif de la demande..."
                  {...register('reason')}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Créer
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="approved">Approuvées</SelectItem>
            <SelectItem value="rejected">Rejetées</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <Card className="modern-card">
            <CardContent className="p-8 text-center">
              <Calendar className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <p className="text-muted-foreground">Aucune demande de congé trouvée</p>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map(request => {
            const employee = employees.find(emp => emp.user_id === request.employee_id);
            const absenceType = absenceTypes.find(type => type.id === request.absence_type_id);

            return (
              <Card key={request.id} className="modern-card hover-glow">
                <CardContent className="p-6">
                  <div
                    className={`${isMobile ? 'space-y-4' : 'flex items-center justify-between'}`}
                  >
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <h3 className="text-lg font-semibold">
                          {employee?.full_name || 'Employé inconnu'}
                        </h3>
                        <Badge
                          variant={
                            request.status === 'approved'
                              ? 'default'
                              : request.status === 'rejected'
                                ? 'destructive'
                                : 'secondary'
                          }
                        >
                          {request.status === 'approved'
                            ? 'Approuvée'
                            : request.status === 'rejected'
                              ? 'Rejetée'
                              : 'En attente'}
                        </Badge>
                      </div>

                      <div className="text-muted-foreground space-y-1 text-sm">
                        <p>
                          <strong>Type:</strong> {absenceType?.name || 'Type inconnu'}
                        </p>
                        <p>
                          <strong>Période:</strong>{' '}
                          {new Date(request.start_date).toLocaleDateString()} -{' '}
                          {new Date(request.end_date).toLocaleDateString()}
                        </p>
                        <p>
                          <strong>Durée:</strong> {request.total_days} jour(s)
                        </p>
                        {request.reason && (
                          <p>
                            <strong>Motif:</strong> {request.reason}
                          </p>
                        )}
                        {request.rejection_reason && (
                          <p className="text-destructive">
                            <strong>Motif de rejet:</strong> {request.rejection_reason}
                          </p>
                        )}
                      </div>
                    </div>

                    {request.status === 'pending' && (
                      <div className={`flex gap-2 ${isMobile ? 'w-full' : ''}`}>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(request.id)}
                          className="hover-glow"
                        >
                          <Check className="mr-1 h-4 w-4" />
                          Approuver
                        </Button>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedRequestId(request.id)}
                            >
                              <X className="mr-1 h-4 w-4" />
                              Rejeter
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Rejeter la demande</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Textarea
                                placeholder="Motif de rejet..."
                                value={rejectionReason}
                                onChange={e => setRejectionReason(e.target.value)}
                              />
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleReject(request.id)}
                                  disabled={!rejectionReason.trim()}
                                  variant="destructive"
                                >
                                  Confirmer le rejet
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
