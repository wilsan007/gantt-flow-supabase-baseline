import { useState, useEffect } from 'react';
import { useHR } from '@/hooks/useHR';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Plus, Calendar, Wallet } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const LeaveBalanceManagement = () => {
  const { leaveBalances, absenceTypes, employees, loading, refetch } = useHR();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const { register, handleSubmit, reset, setValue } = useForm();

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  const filteredBalances = leaveBalances.filter(balance => 
    balance.year === selectedYear
  );

  const onSubmit = async (data: any) => {
    try {
      const balanceData = {
        employee_id: data.employee_id,
        absence_type_id: data.absence_type_id,
        year: parseInt(data.year),
        total_days: parseFloat(data.total_days),
        used_days: 0,
        remaining_days: parseFloat(data.total_days)
      };

      const { error } = await supabase
        .from('leave_balances')
        .insert(balanceData);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Solde de congés créé avec succès"
      });

      reset();
      setIsCreateDialogOpen(false);
      refetch();
    } catch (error: any) {
      console.error('Error creating leave balance:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le solde de congés",
        variant: "destructive"
      });
    }
  };

  const updateBalance = async (balanceId: string, newTotalDays: number) => {
    try {
      const balance = leaveBalances.find(b => b.id === balanceId);
      if (!balance) return;

      const remaining = Math.max(0, newTotalDays - balance.used_days);

      const { error } = await supabase
        .from('leave_balances')
        .update({ 
          total_days: newTotalDays,
          remaining_days: remaining 
        })
        .eq('id', balanceId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Solde mis à jour avec succès"
      });

      refetch();
    } catch (error: any) {
      console.error('Error updating balance:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le solde",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Chargement des soldes de congés...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Soldes de Congés
        </h2>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="hover-glow">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau solde
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Créer un solde de congés</DialogTitle>
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

              <div>
                <Label htmlFor="year">Année</Label>
                <Select onValueChange={(value) => setValue('year', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une année" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="total_days">Nombre de jours total</Label>
                <Input
                  id="total_days"
                  type="number"
                  step="0.5"
                  placeholder="25"
                  {...register('total_days', { required: true })}
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

      {/* Year Filter */}
      <div className="flex gap-4 items-center">
        <Label>Année :</Label>
        <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map(year => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Balances Grid */}
      <div className="space-y-4">
        {filteredBalances.length === 0 ? (
          <Card className="modern-card">
            <CardContent className="p-8 text-center">
              <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Aucun solde de congés configuré pour {selectedYear}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'}`}>
            {filteredBalances.map((balance) => {
              const employee = employees.find(emp => emp.id === balance.employee_id);
              const absenceType = absenceTypes.find(type => type.id === balance.absence_type_id);
              const usagePercentage = balance.total_days > 0 ? (balance.used_days / balance.total_days) * 100 : 0;
              
              return (
                <Card key={balance.id} className="modern-card hover-glow">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {employee?.full_name || 'Employé inconnu'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {absenceType?.name || 'Type inconnu'} - {balance.year}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Utilisé</span>
                          <span>{balance.used_days} / {balance.total_days} jours</span>
                        </div>
                        <Progress value={usagePercentage} className="h-2" />
                        <div className="text-sm text-muted-foreground">
                          Restant: {balance.remaining_days} jour(s)
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Label htmlFor={`total-${balance.id}`} className="text-xs">
                          Total:
                        </Label>
                        <Input
                          id={`total-${balance.id}`}
                          type="number"
                          step="0.5"
                          defaultValue={balance.total_days}
                          className="h-8 text-sm"
                          onBlur={(e) => {
                            const newValue = parseFloat(e.target.value);
                            if (newValue !== balance.total_days && newValue > 0) {
                              updateBalance(balance.id, newValue);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};