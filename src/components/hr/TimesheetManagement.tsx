import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalTrigger,
} from '@/components/ui/responsive-modal';
import { Label } from '@/components/ui/label';
import { Plus, Clock, Check, X, Calendar } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

interface Timesheet {
  id: string;
  employee_id: string;
  week_start_date: string; // Real DB schema
  week_end_date: string;
  total_hours: number;
  regular_hours: number;
  overtime_hours: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  notes?: string | null;
  submitted_at?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
}

interface Employee {
  id: string;
  full_name: string;
}

export const TimesheetManagement = () => {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(getWeekString(new Date()));
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const { register, handleSubmit, reset, setValue } = useForm();

  function getWeekString(date: Date): string {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay() + 1); // Start from Monday
    return startOfWeek.toISOString().split('T')[0];
  }

  const fetchData = async () => {
    try {
      setLoading(true);

      const [timesheetsRes, employeesRes] = await Promise.all([
        supabase.from('timesheets').select('*').order('week_start_date', { ascending: false }),
        supabase.from('profiles').select('id, full_name'),
      ]);

      if (timesheetsRes.error) throw timesheetsRes.error;
      if (employeesRes.error) throw employeesRes.error;

      setTimesheets((timesheetsRes.data as unknown as Timesheet[]) || []);
      setEmployees((employeesRes.data as unknown as Employee[]) || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onSubmit = async (data: any) => {
    try {
      const timesheetData = {
        employee_id: data.employee_id,
        week_start_date: data.week_start_date, // Changed from 'date' to 'week_start_date'
        total_hours: parseFloat(data.total_hours), // Changed from 'hours' to 'total_hours'
        regular_hours: parseFloat(data.regular_hours),
        overtime_hours: parseFloat(data.overtime_hours),
        notes: data.notes || null, // Changed from 'description' to 'notes'
        status: 'draft', // Assuming new timesheets start as draft
      };

      // @ts-expect-error - Supabase types are outdated, using real DB schema
      const { error } = await supabase.from('timesheets').insert(timesheetData);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Feuille de temps créée avec succès',
      });

      reset();
      setIsCreateDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error creating timesheet:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la feuille de temps',
        variant: 'destructive',
      });
    }
  };

  const approveTimesheet = async (timesheetId: string) => {
    try {
      // @ts-expect-error - Supabase types are outdated, using real DB schema
      const { error } = await supabase
        .from('timesheets')
        .update({ status: 'approved', approved_at: new Date().toISOString() }) // Changed from 'approved' to 'status'
        .eq('id', timesheetId);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Feuille de temps approuvée',
      });

      fetchData();
    } catch (error: any) {
      console.error('Error approving timesheet:', error);
      toast({
        title: 'Erreur',
        description: "Impossible d'approuver la feuille de temps",
        variant: 'destructive',
      });
    }
  };

  const rejectTimesheet = async (timesheetId: string) => {
    try {
      // @ts-expect-error - Supabase types are outdated, using real DB schema
      const { error } = await supabase
        .from('timesheets')
        .update({ status: 'rejected', rejection_reason: 'Rejected by manager' }) // Changed from 'approved' to 'status'
        .eq('id', timesheetId);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Feuille de temps rejetée',
      });

      fetchData();
    } catch (error: any) {
      console.error('Error rejecting timesheet:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de rejeter la feuille de temps',
        variant: 'destructive',
      });
    }
  };

  const filteredTimesheets = timesheets.filter(timesheet => {
    const timesheetDate = new Date(timesheet.week_start_date);
    const weekStart = new Date(selectedWeek);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    return timesheetDate >= weekStart && timesheetDate <= weekEnd;
  });

  if (loading) {
    return <div className="p-6 text-center">Chargement des feuilles de temps...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="from-primary to-accent bg-gradient-to-r bg-clip-text text-3xl font-bold text-transparent">
          Feuilles de Temps
        </h2>

        <ResponsiveModal open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <ResponsiveModalTrigger asChild>
            <Button className="hover-glow">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle Feuille
            </Button>
          </ResponsiveModalTrigger>
          <ResponsiveModalContent className="max-w-2xl">
            <ResponsiveModalHeader>
              <ResponsiveModalTitle>Créer une feuille de temps</ResponsiveModalTitle>
            </ResponsiveModalHeader>
            {/* Form implementation would go here - currently simplified */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employee_id">Employé</Label>
                  <Select onValueChange={value => setValue('employee_id', value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un employé" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="week_start_date">Début de semaine</Label>
                  <Input
                    id="week_start_date"
                    type="date"
                    {...register('week_start_date', { required: true })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="regular_hours">Heures Normales</Label>
                  <Input
                    id="regular_hours"
                    type="number"
                    step="0.5"
                    {...register('regular_hours', { required: true, min: 0 })}
                    onChange={e => {
                      const regular = parseFloat(e.target.value) || 0;
                      // @ts-ignore
                      const overtime =
                        parseFloat(document.getElementById('overtime_hours')?.value) || 0;
                      setValue('total_hours', regular + overtime);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="overtime_hours">Heures Supp.</Label>
                  <Input
                    id="overtime_hours"
                    type="number"
                    step="0.5"
                    {...register('overtime_hours', { required: true, min: 0 })}
                    onChange={e => {
                      const overtime = parseFloat(e.target.value) || 0;
                      // @ts-ignore
                      const regular =
                        parseFloat(document.getElementById('regular_hours')?.value) || 0;
                      setValue('total_hours', regular + overtime);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="total_hours">Total</Label>
                  <Input
                    id="total_hours"
                    type="number"
                    readOnly
                    className="bg-muted"
                    {...register('total_hours')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" placeholder="Activités réalisées..." {...register('notes')} />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit">Créer la feuille</Button>
              </div>
            </form>
          </ResponsiveModalContent>
        </ResponsiveModal>
      </div>

      {/* Week Selector */}
      <div className="flex items-center gap-4">
        <Label htmlFor="week-select" className="text-sm font-medium">
          Semaine:
        </Label>
        <Input
          id="week-select"
          type="week"
          value={selectedWeek}
          onChange={e => setSelectedWeek(e.target.value)}
          className="w-48"
        />
      </div>

      {/* Statistics */}
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
        <Card className="modern-card hover-glow">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-primary text-2xl font-bold">
                {filteredTimesheets.reduce((sum, ts) => sum + (ts.total_hours || 0), 0).toFixed(1)}h
              </div>
              <div className="text-muted-foreground text-sm">Heures totales</div>
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card hover-glow">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-success text-2xl font-bold">
                {filteredTimesheets
                  .reduce((sum, ts) => sum + (ts.regular_hours || 0), 0)
                  .toFixed(1)}
                h
              </div>
              <div className="text-muted-foreground text-sm">Heures normales</div>
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card hover-glow">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-warning text-2xl font-bold">
                {filteredTimesheets.filter(ts => ts.status !== 'approved').length}
              </div>
              <div className="text-muted-foreground text-sm">En attente</div>
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card hover-glow">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-accent text-2xl font-bold">
                {filteredTimesheets.filter(ts => ts.status === 'approved').length}
              </div>
              <div className="text-muted-foreground text-sm">Approuvées</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timesheets List */}
      <div className="space-y-4">
        {filteredTimesheets.length === 0 ? (
          <Card className="modern-card">
            <CardContent className="p-8 text-center">
              <Clock className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <p className="text-muted-foreground">Aucune feuille de temps pour cette semaine</p>
            </CardContent>
          </Card>
        ) : (
          filteredTimesheets.map(timesheet => {
            const employee = employees.find(emp => emp.id === timesheet.employee_id);

            return (
              <Card key={timesheet.id} className="modern-card hover-glow">
                <CardContent className="p-6">
                  <div
                    className={`${isMobile ? 'space-y-4' : 'flex items-center justify-between'}`}
                  >
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <h3 className="text-lg font-semibold">
                          {employee?.full_name || 'Employé inconnu'}
                        </h3>
                        <Badge variant={timesheet.status === 'approved' ? 'default' : 'secondary'}>
                          {timesheet.status === 'approved'
                            ? 'Approuvée'
                            : timesheet.status === 'submitted'
                              ? 'Soumise'
                              : timesheet.status === 'rejected'
                                ? 'Rejetée'
                                : 'Brouillon'}
                        </Badge>
                      </div>

                      <div className="text-muted-foreground space-y-1 text-sm">
                        <p>
                          <strong>Semaine du:</strong>{' '}
                          {new Date(timesheet.week_start_date).toLocaleDateString()} au{' '}
                          {new Date(timesheet.week_end_date).toLocaleDateString()}
                        </p>
                        <p>
                          <strong>Total:</strong> {timesheet.total_hours}h (Normal:{' '}
                          {timesheet.regular_hours}h, Supp: {timesheet.overtime_hours}h)
                        </p>
                        {timesheet.notes && (
                          <p>
                            <strong>Notes:</strong> {timesheet.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {timesheet.status !== 'approved' && (
                      <div className={`flex gap-2 ${isMobile ? 'w-full' : ''}`}>
                        <Button
                          size="sm"
                          onClick={() => approveTimesheet(timesheet.id)}
                          className="hover-glow"
                        >
                          <Check className="mr-1 h-4 w-4" />
                          Approuver
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rejectTimesheet(timesheet.id)}
                        >
                          <X className="mr-1 h-4 w-4" />
                          Rejeter
                        </Button>
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
