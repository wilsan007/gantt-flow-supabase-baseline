/**
 * Analytics - Dashboard personnel
 * Statistiques et métriques personnelles
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, TrendingUp, CheckCircle, Clock, Target, Calendar, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Analytics() {
  const navigate = useNavigate();

  const stats = [
    {
      title: 'Tâches complétées',
      value: '24',
      change: '+12%',
      trend: 'up',
      icon: CheckCircle,
      color: 'text-green-500',
    },
    {
      title: 'Temps moyen',
      value: '2.5h',
      change: '-8%',
      trend: 'down',
      icon: Clock,
      color: 'text-blue-500',
    },
    {
      title: 'Taux de réussite',
      value: '94%',
      change: '+5%',
      trend: 'up',
      icon: Target,
      color: 'text-purple-500',
    },
    {
      title: 'Jours actifs',
      value: '18',
      change: '+3',
      trend: 'up',
      icon: Calendar,
      color: 'text-orange-500',
    },
  ];

  const achievements = [
    { title: '🏆 Expert Productivité', desc: '50 tâches complétées en un mois', unlocked: true },
    { title: '⚡ Vitesse Éclair', desc: 'Terminer 10 tâches en une journée', unlocked: true },
    { title: '📅 Régularité', desc: 'Actif 30 jours consécutifs', unlocked: false },
    { title: '🎯 Précision', desc: 'Taux de réussite de 100%', unlocked: false },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <TrendingUp className="h-8 w-8" />
                Mes Statistiques
              </h1>
              <p className="text-muted-foreground">
                Votre performance et vos réalisations
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className={`text-xs ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'} flex items-center gap-1 mt-1`}>
                  <TrendingUp className="h-3 w-3" />
                  {stat.change} vs mois dernier
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activité récente */}
          <Card>
            <CardHeader>
              <CardTitle>Activité récente</CardTitle>
              <CardDescription>Vos 7 derniers jours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, i) => (
                  <div key={day} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{day}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-32 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${Math.random() * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-8">
                        {Math.floor(Math.random() * 10)}h
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Réalisations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Réalisations
              </CardTitle>
              <CardDescription>Débloquez des badges en travaillant</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {achievements.map((achievement, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                      achievement.unlocked
                        ? 'bg-primary/5 border-primary/20'
                        : 'bg-muted/50 border-muted opacity-60'
                    }`}
                  >
                    <div className="text-2xl">{achievement.title.split(' ')[0]}</div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {achievement.title.split(' ').slice(1).join(' ')}
                      </p>
                      <p className="text-xs text-muted-foreground">{achievement.desc}</p>
                    </div>
                    {achievement.unlocked && (
                      <Badge variant="secondary" className="shrink-0">
                        Débloqué
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Note */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              💡 Ces statistiques sont basées sur votre activité. Connectez-vous quotidiennement pour suivre votre progression !
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
