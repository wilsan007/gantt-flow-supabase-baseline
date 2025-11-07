/**
 * 🎓 Page Catalogue de Formations
 */

import { useState } from 'react';
import { useTrainings } from '@/hooks/useTrainings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Clock, Users, Search, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TrainingCatalogPage() {
  const { trainings, enrollments, createEnrollment, loading } = useTrainings();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filtered = trainings.filter((training) => {
    const matchesSearch = training.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BookOpen className="h-8 w-8" />
          Catalogue de Formations
        </h1>
        <p className="text-muted-foreground mt-1">
          Développez vos compétences avec notre catalogue de formations
        </p>
      </div>

      {/* Filtres */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une formation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            {categories.filter(c => c !== 'all').map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Liste des formations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-8">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            Aucune formation trouvée
          </div>
        ) : (
          filtered.map((training) => (
            <Card key={training.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <BookOpen className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <Badge variant="secondary">{training.category}</Badge>
                </div>
                <CardTitle className="mt-2">{training.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {training.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <div className="space-y-3 mb-4">
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
                  <Badge className="w-full justify-center py-2 bg-green-500">
                    ✓ Inscrit
                  </Badge>
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
