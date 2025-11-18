/**
 * 👤 Mon Profil de Compétences - Vue Employé
 * Pattern: LinkedIn Skills, Workday Skills Cloud
 */

import { useState } from 'react';
import { useSkills, type EmployeeSkill } from '@/hooks/useSkills';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Award, CheckCircle2, Plus, TrendingUp, Search, Filter } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const SKILL_LEVELS = {
  beginner: { label: 'Débutant', value: 25, color: 'bg-yellow-500' },
  intermediate: { label: 'Intermédiaire', value: 50, color: 'bg-blue-500' },
  advanced: { label: 'Avancé', value: 75, color: 'bg-green-500' },
  expert: { label: 'Expert', value: 100, color: 'bg-purple-500' },
};

export function MySkillsProfile() {
  const {
    skills,
    employeeSkills,
    loading,
    addSkillToProfile,
    updateSkillLevel,
    requestCertification,
    removeSkillFromProfile,
  } = useSkills();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedSkillId, setSelectedSkillId] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('beginner');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Filtrer compétences disponibles (pas encore dans le profil)
  const availableSkills = skills.filter(
    skill => !employeeSkills.some(es => es.skill_id === skill.id)
  );

  // Filtrer compétences du profil
  const filteredEmployeeSkills = employeeSkills.filter(es => {
    const matchesSearch = es.skill?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || es.skill?.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Catégories uniques
  const categories = Array.from(new Set(skills.map(s => s.category)));

  // Statistiques
  const totalSkills = employeeSkills.length;
  const certifiedSkills = employeeSkills.filter(es => es.is_certified).length;
  const certificationRate = totalSkills > 0 ? Math.round((certifiedSkills / totalSkills) * 100) : 0;

  const handleAddSkill = async () => {
    if (!selectedSkillId) return;

    await addSkillToProfile(selectedSkillId, selectedLevel);
    setIsAddDialogOpen(false);
    setSelectedSkillId('');
    setSelectedLevel('beginner');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">Chargement de vos compétences...</div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header & Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <Award className="text-primary h-8 w-8" />
            Mes Compétences
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez votre profil de compétences et développez votre carrière
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une compétence
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter une compétence</DialogTitle>
              <DialogDescription>
                Sélectionnez une compétence et indiquez votre niveau actuel
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Compétence</Label>
                <Select value={selectedSkillId} onValueChange={setSelectedSkillId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une compétence" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSkills.map(skill => (
                      <SelectItem key={skill.id} value={skill.id}>
                        {skill.name} {skill.is_critical && '⭐'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Niveau actuel</Label>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SKILL_LEVELS).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleAddSkill} disabled={!selectedSkillId}>
                Ajouter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Total Compétences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalSkills}</div>
            <p className="text-muted-foreground mt-1 text-xs">{certifiedSkills} certifiées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Taux de Certification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{certificationRate}%</div>
            <Progress value={certificationRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Compétences Critiques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {employeeSkills.filter(es => es.skill?.is_critical).length}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Sur {skills.filter(s => s.is_critical).length} totales
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
              <Input
                placeholder="Rechercher une compétence..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste compétences */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filteredEmployeeSkills.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="text-muted-foreground pt-6 text-center">
              {searchTerm || categoryFilter !== 'all'
                ? 'Aucune compétence ne correspond à vos filtres'
                : 'Vous n\'avez pas encore ajouté de compétences. Cliquez sur "Ajouter une compétence" pour commencer !'}
            </CardContent>
          </Card>
        ) : (
          filteredEmployeeSkills.map(employeeSkill => {
            const skill = employeeSkill.skill;
            if (!skill) return null;

            const levelInfo = SKILL_LEVELS[employeeSkill.level as keyof typeof SKILL_LEVELS];

            return (
              <Card
                key={employeeSkill.id}
                className={`relative ${employeeSkill.is_certified ? 'border-2 border-green-500' : ''}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {skill.name}
                        {skill.is_critical && <span className="text-yellow-500">⭐</span>}
                        {employeeSkill.is_certified && (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">{skill.category}</CardDescription>
                    </div>

                    <Badge variant="outline" className={levelInfo.color}>
                      {levelInfo.label}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Barre de progression */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Niveau de maîtrise</span>
                      <span className="font-medium">{levelInfo.value}%</span>
                    </div>
                    <Progress value={levelInfo.value} className={levelInfo.color} />
                  </div>

                  {/* Informations supplémentaires */}
                  {employeeSkill.years_experience > 0 && (
                    <div className="text-muted-foreground flex items-center gap-2 text-sm">
                      <TrendingUp className="h-4 w-4" />
                      {employeeSkill.years_experience} an
                      {employeeSkill.years_experience > 1 ? 's' : ''} d'expérience
                    </div>
                  )}

                  {employeeSkill.is_certified && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Certifié par manager
                    </Badge>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {!employeeSkill.is_certified && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => requestCertification(employeeSkill.id)}
                      >
                        Demander certification
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeSkillFromProfile(employeeSkill.id)}
                    >
                      Retirer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
