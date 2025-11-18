import { useState } from 'react';
import { useHRMinimal } from '@/hooks/useHRMinimal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Calendar } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const AbsenceTypeManagement = () => {
  const { absenceTypes, loading, refetch } = useHRMinimal();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<any>(null);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const { register, handleSubmit, reset, setValue, watch } = useForm();

  const onSubmit = async (data: any) => {
    try {
      const absenceTypeData = {
        name: data.name,
        code: data.code,
        color: data.color,
        requires_approval: data.requires_approval,
        deducts_from_balance: data.deducts_from_balance,
        max_days_per_year: data.max_days_per_year ? parseInt(data.max_days_per_year) : null,
      };

      let error;
      if (editingType) {
        ({ error } = await supabase
          .from('absence_types')
          .update(absenceTypeData)
          .eq('id', editingType.id));
      } else {
        ({ error } = await supabase.from('absence_types').insert(absenceTypeData));
      }

      if (error) throw error;

      toast({
        title: 'Succès',
        description: `Type d'absence ${editingType ? 'modifié' : 'créé'} avec succès`,
      });

      reset();
      setIsCreateDialogOpen(false);
      setEditingType(null);
      refetch();
    } catch (error: any) {
      console.error('Error managing absence type:', error);
      toast({
        title: 'Erreur',
        description: `Impossible de ${editingType ? 'modifier' : 'créer'} le type d'absence`,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (type: any) => {
    setEditingType(type);
    setValue('name', type.name);
    setValue('code', type.code);
    setValue('color', type.color);
    setValue('requires_approval', type.requires_approval);
    setValue('deducts_from_balance', type.deducts_from_balance);
    setValue('max_days_per_year', type.max_days_per_year);
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (typeId: string) => {
    try {
      const { error } = await supabase.from('absence_types').delete().eq('id', typeId);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: "Type d'absence supprimé avec succès",
      });

      refetch();
    } catch (error: any) {
      console.error('Error deleting absence type:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de supprimer le type d'absence",
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Chargement des types d'absence...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="from-primary to-accent bg-gradient-to-r bg-clip-text text-3xl font-bold text-transparent">
          Types d'Absence
        </h2>

        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={open => {
            setIsCreateDialogOpen(open);
            if (!open) {
              setEditingType(null);
              reset();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="hover-glow">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau type
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingType ? 'Modifier le type' : "Créer un type d'absence"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">Nom</Label>
                <Input
                  id="name"
                  placeholder="Congés payés"
                  {...register('name', { required: true })}
                />
              </div>

              <div>
                <Label htmlFor="code">Code</Label>
                <Input id="code" placeholder="CP" {...register('code', { required: true })} />
              </div>

              <div>
                <Label htmlFor="color">Couleur</Label>
                <Input id="color" type="color" defaultValue="#3B82F6" {...register('color')} />
              </div>

              <div>
                <Label htmlFor="max_days_per_year">Jours maximum par an</Label>
                <Input
                  id="max_days_per_year"
                  type="number"
                  placeholder="25"
                  {...register('max_days_per_year')}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="requires_approval">Nécessite une approbation</Label>
                  <Switch
                    id="requires_approval"
                    defaultChecked={true}
                    onCheckedChange={checked => setValue('requires_approval', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="deducts_from_balance">Déduit du solde</Label>
                  <Switch
                    id="deducts_from_balance"
                    defaultChecked={true}
                    onCheckedChange={checked => setValue('deducts_from_balance', checked)}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingType ? 'Modifier' : 'Créer'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setEditingType(null);
                    reset();
                  }}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Types List */}
      <div className="space-y-4">
        {absenceTypes.length === 0 ? (
          <Card className="modern-card">
            <CardContent className="p-8 text-center">
              <Calendar className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <p className="text-muted-foreground">Aucun type d'absence configuré</p>
            </CardContent>
          </Card>
        ) : (
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'}`}>
            {absenceTypes.map(type => (
              <Card key={type.id} className="modern-card hover-glow">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="border-background h-4 w-4 rounded-full border-2"
                          style={{ backgroundColor: type.color }}
                        />
                        <div>
                          <h3 className="text-lg font-semibold">{type.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {type.code}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(type)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(type.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="text-muted-foreground space-y-2 text-sm">
                      {type.max_days_per_year && (
                        <p>
                          <strong>Max/an:</strong> {type.max_days_per_year} jours
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {type.requires_approval && (
                          <Badge variant="secondary" className="text-xs">
                            Approbation requise
                          </Badge>
                        )}
                        {type.deducts_from_balance && (
                          <Badge variant="secondary" className="text-xs">
                            Déduit du solde
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
