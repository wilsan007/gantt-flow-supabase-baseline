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
  const { trainings, enrollments, createEnrollment, loading } = useTrainings();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filtered = trainings.filter(training => {
    const matchesSearch =
      training.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      training.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || training.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const isEnrolled = (trainingId: string) => {
    return enrollments.some(e => e.training_id === trainingId && e.status !== 'cancelled');
  };

  const handleEnroll = async (trainingId: string) => {
    await createEnrollment({
      training_id: trainingId,
      status: 'enrolled',
    });

    toast({
      title: 'Inscription réussie',
      description: 'Vous êtes maintenant inscrit à cette formation.',
    });
  };

  const categories = ['all', ...Array.from(new Set(trainings.map(t => t.category)))];

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <BookOpen className="h-8 w-8" />
          Catalogue de Formations
        </h1>
        <p className="mt-1 text-muted-foreground">
          Développez vos compétences avec notre catalogue de formations
        </p>
      </div>

      {/* Filtres */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
          <Input
            placeholder="Rechercher une formation..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
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
          <div className="col-span-full py-8 text-center text-muted-foreground">
            Aucune formation trouvée
          </div>
        ) : (
          filtered.map(training => (
            <Card key={training.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <BookOpen className="mt-1 h-6 w-6 flex-shrink-0 text-primary" />
                  <Badge variant="secondary">{training.category}</Badge>
                </div>
                <CardTitle className="mt-2">{training.title}</CardTitle>
                <CardDescription className="line-clamp-2">{training.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between">
                <div className="mb-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{training.duration_hours}h de formation</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Niveau: {training.level}</span>
                  </div>
                  {training.certifiable && (
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <Award className="h-4 w-4" />
                      <span>Certification disponible</span>
                    </div>
                  )}
                  {training.external_url && (
                    <a
                      href={training.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Plus d'informations →
                    </a>
                  )}
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
