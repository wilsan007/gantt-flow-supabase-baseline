import { useState } from 'react';
import { useHRMinimal } from '@/hooks/useHRMinimal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { Clock, Plus, Calendar } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useForm } from 'react-hook-form';

export const AttendanceManagement = () => {
  const { attendances, employees, createAttendance, loading } = useHRMinimal();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const isMobile = useIsMobile();

  const { register, handleSubmit, reset, setValue } = useForm();

  const filteredAttendances = attendances.filter(attendance => attendance.date === selectedDate);

  const onSubmit = async (data: any) => {
    try {
      // Calculate total hours if check_in and check_out are provided
      let totalHours = 0;
      if (data.check_in && data.check_out) {
        const checkIn = new Date(`1970-01-01T${data.check_in}`);
        const checkOut = new Date(`1970-01-01T${data.check_out}`);
        const breakDuration = parseInt(data.break_duration) || 0;
        const workMinutes = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60) - breakDuration;
        totalHours = Math.max(0, workMinutes / 60);
      }

      await createAttendance({
        employee_id: data.employee_id,
        date: data.date,
        check_in: data.check_in || null,
        check_out: data.check_out || null,
        break_duration: parseInt(data.break_duration) || 0,
        total_hours: totalHours,
        status: data.status,
        notes: data.notes || null,
      });

      reset();
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Error creating attendance:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'default';
      case 'absent':
        return 'destructive';
      case 'late':
        return 'secondary';
      case 'partial':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'present':
        return 'Présent';
      case 'absent':
        return 'Absent';
      case 'late':
        return 'En retard';
      case 'partial':
        return 'Partiel';
      default:
        return status;
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Chargement des présences...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="from-primary to-accent bg-gradient-to-r bg-clip-text text-3xl font-bold text-transparent">
          Gestion des Présences
        </h2>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="hover-glow">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle présence
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Enregistrer une présence</DialogTitle>
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
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  {...register('date', { required: true })}
                />
              </div>

              <div>
                <Label htmlFor="status">Statut</Label>
                <Select onValueChange={value => setValue('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Présent</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="late">En retard</SelectItem>
                    <SelectItem value="partial">Partiel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="check_in">Arrivée</Label>
                  <Input id="check_in" type="time" {...register('check_in')} />
                </div>
                <div>
                  <Label htmlFor="check_out">Départ</Label>
                  <Input id="check_out" type="time" {...register('check_out')} />
                </div>
              </div>

              <div>
                <Label htmlFor="break_duration">Pause (minutes)</Label>
                <Input
                  id="break_duration"
                  type="number"
                  placeholder="0"
                  {...register('break_duration')}
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes (optionnel)</Label>
                <Input id="notes" placeholder="Notes..." {...register('notes')} />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Enregistrer
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

      {/* Date Filter */}
      <div className="flex items-center gap-4">
        <Label htmlFor="date-filter">Date :</Label>
        <Input
          id="date-filter"
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="w-48"
        />
      </div>

      {/* Attendance List */}
      <div className="space-y-4">
        {filteredAttendances.length === 0 ? (
          <Card className="modern-card">
            <CardContent className="p-8 text-center">
              <Clock className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <p className="text-muted-foreground">
                Aucune présence enregistrée pour le {new Date(selectedDate).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAttendances.map(attendance => {
            const employee = employees.find(emp => emp.user_id === attendance.employee_id);

            return (
              <Card key={attendance.id} className="modern-card hover-glow">
                <CardContent className="p-6">
                  <div
                    className={`${isMobile ? 'space-y-4' : 'flex items-center justify-between'}`}
                  >
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <h3 className="text-lg font-semibold">
                          {employee?.full_name || 'Employé inconnu'}
                        </h3>
                        <Badge variant={getStatusColor(attendance.status)}>
                          {getStatusLabel(attendance.status)}
                        </Badge>
                      </div>

                      <div className="text-muted-foreground space-y-1 text-sm">
                        <p>
                          <strong>Date:</strong> {new Date(attendance.date).toLocaleDateString()}
                        </p>
                        {attendance.check_in && (
                          <p>
                            <strong>Arrivée:</strong> {attendance.check_in}
                          </p>
                        )}
                        {attendance.check_out && (
                          <p>
                            <strong>Départ:</strong> {attendance.check_out}
                          </p>
                        )}
                        {attendance.total_hours && (
                          <p>
                            <strong>Heures travaillées:</strong> {attendance.total_hours.toFixed(2)}
                            h
                          </p>
                        )}
                        {attendance.break_duration && attendance.break_duration > 0 && (
                          <p>
                            <strong>Pause:</strong> {attendance.break_duration} min
                          </p>
                        )}
                        {attendance.notes && (
                          <p>
                            <strong>Notes:</strong> {attendance.notes}
                          </p>
                        )}
                      </div>
                    </div>
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
