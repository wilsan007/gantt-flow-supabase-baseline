/**
 * 🎓 Mes Formations
 */

import { useTrainings } from '@/hooks/useTrainings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Clock, Award, CheckCircle2, PlayCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const STATUS_CONFIG = {
  enrolled: { label: 'En cours', color: 'bg-blue-500', icon: PlayCircle },
  completed: { label: 'Terminé', color: 'bg-green-500', icon: CheckCircle2 },
  cancelled: { label: 'Annulé', color: 'bg-gray-500', icon: XCircle },
};

export default function MyTrainingsPage() {
  const { trainings, enrollments, loading } = useTrainings();
  const navigate = useNavigate();

  const myEnrollments = enrollments
    .map(enrollment => ({
      ...enrollment,
      training: trainings.find(t => t.id === enrollment.training_id),
    }))
    .filter(e => e.training);

  const enrolled = myEnrollments.filter(e => e.status === 'enrolled');
  const completed = myEnrollments.filter(e => e.status === 'completed');
  const cancelled = myEnrollments.filter(e => e.status === 'cancelled');

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <BookOpen className="h-8 w-8" />
            Mes Formations
          </h1>
          <p className="mt-1 text-muted-foreground">
            Suivez votre progression et vos certifications
          </p>
        </div>

        <Button onClick={() => navigate('/training-catalog')}>Parcourir le catalogue</Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{myEnrollments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">En Cours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{enrolled.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Terminées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{completed.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Heures Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {myEnrollments.reduce((sum, e) => sum + (e.training?.duration_hours || 0), 0)}h
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste */}
      <Card>
        <CardHeader>
          <CardTitle>Mes Inscriptions</CardTitle>
          <CardDescription>Toutes vos formations et leur progression</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="enrolled">
            <TabsList>
              <TabsTrigger value="enrolled">En Cours ({enrolled.length})</TabsTrigger>
              <TabsTrigger value="completed">Terminées ({completed.length})</TabsTrigger>
              <TabsTrigger value="cancelled">Annulées ({cancelled.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="enrolled" className="mt-4 space-y-4">
              {enrolled.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  Aucune formation en cours
                </div>
              ) : (
                enrolled.map(enrollment => {
                  const statusConfig =
                    STATUS_CONFIG[enrollment.status as keyof typeof STATUS_CONFIG];
                  const StatusIcon = statusConfig?.icon || PlayCircle;

                  return (
                    <Card key={enrollment.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="mb-2 flex items-center gap-3">
                              <BookOpen className="h-5 w-5 text-primary" />
                              <h3 className="text-lg font-semibold">
                                {enrollment.training?.title}
                              </h3>
                              <Badge className={statusConfig?.color}>
                                <StatusIcon className="mr-1 h-3 w-3" />
                                {statusConfig?.label}
                              </Badge>
                            </div>

                            {enrollment.training?.description && (
                              <p className="mb-3 text-sm text-muted-foreground">
                                {enrollment.training.description}
                              </p>
                            )}

                            <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                              <div>
                                <p className="text-muted-foreground">Durée</p>
                                <p className="flex items-center gap-1 font-medium">
                                  <Clock className="h-4 w-4" />
                                  {enrollment.training?.duration_hours}h
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Niveau</p>
                                <p className="font-medium capitalize">
                                  {enrollment.training?.level}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Inscription</p>
                                <p className="font-medium">
                                  {format(new Date(enrollment.enrollment_date), 'dd MMM yyyy', {
                                    locale: fr,
                                  })}
                                </p>
                              </div>
                              {enrollment.training?.certifiable && (
                                <div>
                                  <p className="text-muted-foreground">Certification</p>
                                  <p className="flex items-center gap-1 font-medium text-primary">
                                    <Award className="h-4 w-4" />
                                    Disponible
                                  </p>
                                </div>
                              )}
                            </div>

                            {enrollment.training?.external_url && (
                              <div className="mt-3">
                                <a
                                  href={enrollment.training.external_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary hover:underline"
                                >
                                  Accéder à la formation →
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="completed" className="mt-4 space-y-4">
              {completed.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  Aucune formation terminée
                </div>
              ) : (
                completed.map(enrollment => {
                  const statusConfig = STATUS_CONFIG.completed;
                  const StatusIcon = statusConfig.icon;

                  return (
                    <Card key={enrollment.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="mb-2 flex items-center gap-3">
                              <BookOpen className="h-5 w-5 text-primary" />
                              <h3 className="text-lg font-semibold">
                                {enrollment.training?.title}
                              </h3>
                              <Badge className={statusConfig.color}>
                                <StatusIcon className="mr-1 h-3 w-3" />
                                {statusConfig.label}
                              </Badge>
                            </div>

                            <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Terminée le</p>
                                <p className="font-medium">
                                  {enrollment.completion_date
                                    ? format(new Date(enrollment.completion_date), 'dd MMM yyyy', {
                                        locale: fr,
                                      })
                                    : '-'}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Durée</p>
                                <p className="font-medium">
                                  {enrollment.training?.duration_hours}h
                                </p>
                              </div>
                              {enrollment.training?.certifiable && (
                                <div>
                                  <p className="text-muted-foreground">Certification</p>
                                  <Button size="sm" variant="outline">
                                    <Award className="mr-1 h-4 w-4" />
                                    Télécharger
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="cancelled" className="mt-4 space-y-4">
              {cancelled.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  Aucune formation annulée
                </div>
              ) : (
                cancelled.map(enrollment => (
                  <Card key={enrollment.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <BookOpen className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-semibold">{enrollment.training?.title}</h3>
                        <Badge className="bg-gray-500">Annulée</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
