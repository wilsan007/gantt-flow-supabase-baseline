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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  date: string;
  hours: number;
  description?: string;
  project_id?: string;
  task_id?: string;
  billable: boolean;
  approved: boolean;
  approved_by?: string;
  created_at: string;
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
        supabase.from('timesheets').select('*').order('date', { ascending: false }),
        supabase.from('profiles').select('id, full_name'),
      ]);

      if (timesheetsRes.error) throw timesheetsRes.error;
      if (employeesRes.error) throw employeesRes.error;

      setTimesheets(timesheetsRes.data || []);
      setEmployees(employeesRes.data || []);
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
        date: data.date,
        hours: parseFloat(data.hours),
        description: data.description || null,
        billable: data.billable || false,
        approved: false,
      };

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
      const { error } = await supabase
        .from('timesheets')
        .update({ approved: true })
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
      const { error } = await supabase
        .from('timesheets')
        .update({ approved: false })
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
    const timesheetDate = new Date(timesheet.date);
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
        <h2 className="bg-gradient-to-r from-primary to-accent bg-clip-text text-3xl font-bold text-transparent">
          Feuilles de Temps
        </h2>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="hover-glow">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle feuille
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Créer une feuille de temps</DialogTitle>
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
                <Label htmlFor="hours">Heures travaillées</Label>
                <Input
                  id="hours"
                  type="number"
                  step="0.25"
                  placeholder="8"
                  {...register('hours', { required: true, min: 0 })}
                />
              </div>

              <div>
                <Label htmlFor="description">Description (optionnel)</Label>
                <Textarea
                  id="description"
                  placeholder="Description du travail effectué..."
                  {...register('description')}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="billable">Facturable</Label>
                <Switch id="billable" onCheckedChange={checked => setValue('billable', checked)} />
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

      {/* Week Filter */}
      <div className="flex items-center gap-4">
        <Label>Semaine du :</Label>
        <Input
          type="date"
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
              <div className="text-2xl font-bold text-primary">
                {filteredTimesheets.reduce((sum, ts) => sum + ts.hours, 0).toFixed(1)}h
              </div>
              <div className="text-sm text-muted-foreground">Heures totales</div>
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card hover-glow">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-success">
                {filteredTimesheets
                  .filter(ts => ts.billable)
                  .reduce((sum, ts) => sum + ts.hours, 0)
                  .toFixed(1)}
                h
              </div>
              <div className="text-sm text-muted-foreground">Facturables</div>
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card hover-glow">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">
                {filteredTimesheets.filter(ts => !ts.approved).length}
              </div>
              <div className="text-sm text-muted-foreground">En attente</div>
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card hover-glow">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">
                {filteredTimesheets.filter(ts => ts.approved).length}
              </div>
              <div className="text-sm text-muted-foreground">Approuvées</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timesheets List */}
      <div className="space-y-4">
        {filteredTimesheets.length === 0 ? (
          <Card className="modern-card">
            <CardContent className="p-8 text-center">
              <Clock className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Aucune feuille de temps pour cette semaine</p>
            </CardContent>
          </Card>
        ) : (
          filteredTimesheets.map(timesheet => {
            const employee = employees.find(emp => emp.user_id === timesheet.employee_id);

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
                        <Badge variant={timesheet.approved ? 'default' : 'secondary'}>
                          {timesheet.approved ? 'Approuvée' : 'En attente'}
                        </Badge>
                        {timesheet.billable && <Badge variant="outline">Facturable</Badge>}
                      </div>

                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>
                          <strong>Date:</strong> {new Date(timesheet.date).toLocaleDateString()}
                        </p>
                        <p>
                          <strong>Heures:</strong> {timesheet.hours}h
                        </p>
                        {timesheet.description && (
                          <p>
                            <strong>Description:</strong> {timesheet.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {!timesheet.approved && (
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
