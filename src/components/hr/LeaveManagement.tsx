import { useState } from 'react';
import { useHR } from '@/hooks/useHR';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Calendar, Plus, Check, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useForm } from 'react-hook-form';

export const LeaveManagement = () => {
  const { leaveRequests, absenceTypes, employees, updateLeaveRequestStatus, createLeaveRequest, loading } = useHR();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const { register, handleSubmit, reset, setValue, watch } = useForm();

  const filteredRequests = leaveRequests.filter(request => 
    selectedStatus === 'all' || request.status === selectedStatus
  );

  const onSubmit = async (data: any) => {
    try {
      // Calculate total days (simplified calculation)
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date);
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      await createLeaveRequest({
        employee_id: data.employee_id,
        absence_type_id: data.absence_type_id,
        start_date: data.start_date,
        end_date: data.end_date,
        total_days: totalDays,
        status: 'pending',
        reason: data.reason
      });

      reset();
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Error creating leave request:', error);
    }
  };

  const handleApprove = (requestId: string) => {
    updateLeaveRequestStatus(requestId, 'approved');
  };

  const handleReject = (requestId: string) => {
    if (rejectionReason.trim()) {
      updateLeaveRequestStatus(requestId, 'rejected', rejectionReason);
      setRejectionReason('');
      setSelectedRequestId(null);
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Chargement des demandes de congés...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Gestion des Congés
        </h2>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="hover-glow">
              <Plus className="h-4 w-4 mr-2" />
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
                <Select onValueChange={(value) => setValue('employee_id', value)}>
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
                <Select onValueChange={(value) => setValue('absence_type_id', value)}>
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
                  <Input
                    id="end_date"
                    type="date"
                    {...register('end_date', { required: true })}
                  />
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
                <Button type="submit" className="flex-1">Créer</Button>
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
      <div className="flex gap-4 items-center">
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
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucune demande de congé trouvée</p>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => {
            const employee = employees.find(emp => emp.id === request.employee_id);
            const absenceType = absenceTypes.find(type => type.id === request.absence_type_id);
            
            return (
              <Card key={request.id} className="modern-card hover-glow">
                <CardContent className="p-6">
                  <div className={`${isMobile ? 'space-y-4' : 'flex items-center justify-between'}`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">
                          {employee?.full_name || 'Employé inconnu'}
                        </h3>
                        <Badge
                          variant={
                            request.status === 'approved' ? 'default' :
                            request.status === 'rejected' ? 'destructive' : 'secondary'
                          }
                        >
                          {request.status === 'approved' ? 'Approuvée' :
                           request.status === 'rejected' ? 'Rejetée' : 'En attente'}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p><strong>Type:</strong> {absenceType?.name || 'Type inconnu'}</p>
                        <p><strong>Période:</strong> {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}</p>
                        <p><strong>Durée:</strong> {request.total_days} jour(s)</p>
                        {request.reason && <p><strong>Motif:</strong> {request.reason}</p>}
                        {request.rejection_reason && (
                          <p className="text-destructive"><strong>Motif de rejet:</strong> {request.rejection_reason}</p>
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
                          <Check className="h-4 w-4 mr-1" />
                          Approuver
                        </Button>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedRequestId(request.id)}
                            >
                              <X className="h-4 w-4 mr-1" />
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
                                onChange={(e) => setRejectionReason(e.target.value)}
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