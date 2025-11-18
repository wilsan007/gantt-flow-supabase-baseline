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
  pending: { label: 'En cours', color: 'bg-blue-500', icon: PlayCircle },
  completed: { label: 'Terminé', color: 'bg-green-500', icon: CheckCircle2 },
  cancelled: { label: 'Annulé', color: 'bg-gray-500', icon: XCircle },
};

export default function MyTrainingsPage() {
  const { trainings, myEnrollments: enrollments, loading } = useTrainings();
  const navigate = useNavigate();

  const myEnrollments = (enrollments || [])
    .map(enrollment => ({
      ...enrollment,
      training: (trainings || []).find(t => t.id === enrollment.training_id),
    }))
    .filter(e => e.training);

  const enrolled = myEnrollments.filter(e => e.status === 'pending' || e.status === 'approved');
  const completed = myEnrollments.filter(e => e.status === 'completed');
  const cancelled = myEnrollments.filter(e => e.status === 'cancelled');

  return (
    <div className="container mx-auto space-y-4 p-4 sm:space-y-6 sm:p-6">
      {/* Header - Responsive */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl md:text-3xl">
            <BookOpen className="h-6 w-6 shrink-0 sm:h-7 sm:w-7 md:h-8 md:w-8" />
            <span className="truncate">Mes Formations</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm md:text-base">
            <span className="hidden sm:inline">Suivez votre progression et vos certifications</span>
            <span className="sm:hidden">Progression formations</span>
          </p>
        </div>

        <Button
          onClick={() => navigate('/training-catalog')}
          className="h-11 w-full font-semibold sm:h-10 sm:w-auto"
        >
          <span className="hidden sm:inline">Parcourir le catalogue</span>
          <span className="sm:hidden">Catalogue</span>
        </Button>
      </div>

      {/* Statistiques - Grid 2 cols mobile */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-muted-foreground text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{myEnrollments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-muted-foreground text-sm font-medium">En Cours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{enrolled.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-muted-foreground text-sm font-medium">Terminées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{completed.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-muted-foreground text-sm font-medium">
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
                <div className="text-muted-foreground py-8 text-center">
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
                              <BookOpen className="text-primary h-5 w-5" />
                              <h3 className="text-lg font-semibold">
                                {enrollment.training?.title}
                              </h3>
                              <Badge className={statusConfig?.color}>
                                <StatusIcon className="mr-1 h-3 w-3" />
                                {statusConfig?.label}
                              </Badge>
                            </div>

                            {enrollment.training?.description && (
                              <p className="text-muted-foreground mb-3 text-sm">
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
                              {/* Certification - À implémenter si nécessaire */}
                            </div>
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
                <div className="text-muted-foreground py-8 text-center">
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
                              <BookOpen className="text-primary h-5 w-5" />
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
                              {/* Certification - À implémenter si nécessaire */}
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
                <div className="text-muted-foreground py-8 text-center">
                  Aucune formation annulée
                </div>
              ) : (
                cancelled.map(enrollment => (
                  <Card key={enrollment.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <BookOpen className="text-muted-foreground h-5 w-5" />
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
