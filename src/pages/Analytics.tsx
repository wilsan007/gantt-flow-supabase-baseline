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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto space-y-4 p-4 sm:space-y-6 sm:p-6">
        {/* Header - Ultra responsive avec gradient */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/')}
              className="hover-glow h-9 w-9 shrink-0 p-0 sm:h-10 sm:w-auto sm:px-4"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only sm:ml-2">Retour</span>
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="flex items-center gap-2 truncate text-xl font-bold sm:text-2xl md:text-3xl">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 sm:h-10 sm:w-10">
                  <TrendingUp className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                </div>
                <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
                  <span className="hidden sm:inline">Mes Statistiques</span>
                  <span className="sm:hidden">Stats</span>
                </span>
              </h1>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                <span className="hidden sm:inline">Votre performance et vos réalisations</span>
                <span className="sm:hidden">Performance</span>
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid - Modern glassmorphism cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => {
            const gradients = [
              'from-green-500/20 via-emerald-500/20 to-teal-500/20',
              'from-blue-500/20 via-cyan-500/20 to-sky-500/20',
              'from-purple-500/20 via-violet-500/20 to-fuchsia-500/20',
              'from-orange-500/20 via-amber-500/20 to-yellow-500/20',
            ];
            return (
              <Card
                key={stat.title}
                className={`group relative overflow-hidden border-2 bg-gradient-to-br ${gradients[index]} backdrop-blur-sm transition-all hover:scale-105 hover:shadow-2xl active:scale-100`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2 sm:p-6 sm:pb-2">
                  <CardTitle className="text-xs font-medium sm:text-sm">
                    <span className="hidden sm:inline">{stat.title}</span>
                    <span className="sm:hidden">{stat.title.split(' ')[0]}</span>
                  </CardTitle>
                  <div className={`rounded-lg bg-background/50 p-1.5 sm:p-2`}>
                    <stat.icon className={`h-3.5 w-3.5 ${stat.color} sm:h-4 sm:w-4`} />
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                  <div className="text-xl font-bold sm:text-2xl">{stat.value}</div>
                  <p
                    className={`mt-1 flex items-center gap-1 text-xs ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}
                  >
                    <TrendingUp className="h-3 w-3" />
                    <span className="hidden sm:inline">{stat.change} vs mois dernier</span>
                    <span className="sm:hidden">{stat.change}</span>
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
          {/* Activité récente - Gradient bars */}
          <Card className="border-2 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-sm transition-shadow hover:shadow-xl">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Activité récente</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Vos 7 derniers jours</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              <div className="space-y-3 sm:space-y-4">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, i) => {
                  const hours = Math.floor(Math.random() * 10);
                  const percentage = (hours / 10) * 100;
                  return (
                    <div key={day} className="flex items-center justify-between gap-2">
                      <span className="w-8 shrink-0 text-xs font-medium sm:w-auto sm:text-sm">
                        {day}
                      </span>
                      <div className="flex flex-1 items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted sm:h-2.5">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="w-6 shrink-0 text-xs text-muted-foreground sm:w-8 sm:text-sm">
                          {hours}h
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Réalisations - Animated badges */}
          <Card className="border-2 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-pink-500/10 backdrop-blur-sm transition-shadow hover:shadow-xl">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <div className="rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 p-1.5">
                  <Award className="h-4 w-4 text-white sm:h-5 sm:w-5" />
                </div>
                Réalisations
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Débloquez des badges en travaillant
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              <div className="space-y-2.5 sm:space-y-3">
                {achievements.map((achievement, i) => (
                  <div
                    key={i}
                    className={`group flex items-start gap-2 rounded-lg border p-2.5 transition-all sm:gap-3 sm:p-3 ${
                      achievement.unlocked
                        ? 'border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:scale-[1.02] hover:shadow-lg'
                        : 'border-muted bg-muted/30 opacity-50'
                    }`}
                  >
                    <div className="shrink-0 text-xl sm:text-2xl">
                      {achievement.title.split(' ')[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium sm:text-sm">
                        {achievement.title.split(' ').slice(1).join(' ')}
                      </p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {achievement.desc}
                      </p>
                    </div>
                    {achievement.unlocked && (
                      <Badge
                        variant="secondary"
                        className="shrink-0 bg-gradient-to-r from-amber-500 to-orange-500 text-xs text-white"
                      >
                        <span className="hidden sm:inline">Débloqué</span>
                        <span className="sm:hidden">✓</span>
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Note - Gradient card */}
        <Card className="border-2 bg-gradient-to-r from-primary/10 via-accent/10 to-purple-500/10 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-6">
            <p className="text-center text-xs text-muted-foreground sm:text-sm">
              <span className="hidden sm:inline">
                💡 Ces statistiques sont basées sur votre activité. Connectez-vous quotidiennement
                pour suivre votre progression !
              </span>
              <span className="sm:hidden">💡 Connectez-vous quotidiennement !</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
