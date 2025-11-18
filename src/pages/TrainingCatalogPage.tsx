/**
 * 🎓 Page Catalogue de Formations
 */

import { useState } from 'react';
import { useTrainings } from '@/hooks/useTrainings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { BookOpen, Clock, Users, Search, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TrainingCatalogPage() {
  const { trainings, myEnrollments, enrollInTraining, loading } = useTrainings();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filtered = (trainings || []).filter(training => {
    const matchesSearch =
      training.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      training.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || training.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const isEnrolled = (trainingId: string) => {
    return (myEnrollments || []).some(
      e => e.training_id === trainingId && e.status !== 'cancelled'
    );
  };

  const handleEnroll = async (trainingId: string) => {
    await enrollInTraining(trainingId);

    toast({
      title: 'Inscription réussie',
      description: 'Vous êtes maintenant inscrit à cette formation.',
    });
  };

  const categories = ['all', ...Array.from(new Set(trainings.map(t => t.category)))];

  return (
    <div className="container mx-auto space-y-4 p-4 sm:space-y-6 sm:p-6">
      {/* Header - Responsive */}
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl md:text-3xl">
          <BookOpen className="h-6 w-6 shrink-0 sm:h-7 sm:w-7 md:h-8 md:w-8" />
          <span className="truncate">
            <span className="hidden sm:inline">Catalogue de Formations</span>
            <span className="sm:hidden">Formations</span>
          </span>
        </h1>
        <p className="text-muted-foreground mt-1 text-xs sm:text-sm md:text-base">
          <span className="hidden sm:inline">
            Développez vos compétences avec notre catalogue de formations
          </span>
          <span className="sm:hidden">Découvrez nos formations</span>
        </p>
      </div>

      {/* Filtres - Responsive */}
      <div className="flex flex-col gap-3 sm:gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
          <Input
            placeholder="Rechercher une formation..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="h-11 pl-10 text-base sm:h-10 sm:text-sm"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="h-11 w-full text-base sm:h-10 sm:text-sm md:w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            {categories
              .filter(c => c !== 'all')
              .map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Liste des formations */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full py-8 text-center">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="text-muted-foreground col-span-full py-8 text-center">
            Aucune formation trouvée
          </div>
        ) : (
          filtered.map(training => (
            <Card key={training.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <BookOpen className="text-primary mt-1 h-6 w-6 flex-shrink-0" />
                  <Badge variant="secondary">{training.category}</Badge>
                </div>
                <CardTitle className="mt-2">{training.title}</CardTitle>
                <CardDescription className="line-clamp-2">{training.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between">
                <div className="mb-4 space-y-3">
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>{training.duration_hours}h de formation</span>
                  </div>
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4" />
                    <span>Niveau: {training.level}</span>
                  </div>
                  {/* Certification et lien externe - À implémenter si nécessaire */}
                </div>

                {isEnrolled(training.id) ? (
                  <Badge className="w-full justify-center bg-green-500 py-2">✓ Inscrit</Badge>
                ) : (
                  <Button
                    onClick={() => handleEnroll(training.id)}
                    disabled={loading}
                    className="w-full"
                  >
                    S'inscrire
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
