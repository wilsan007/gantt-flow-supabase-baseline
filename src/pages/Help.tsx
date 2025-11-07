/**
 * Help - Documentation et aide
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, HelpCircle, Search, Book, Video, MessageCircle, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function Help() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const categories = [
    {
      title: 'Démarrage',
      icon: Book,
      articles: [
        { title: 'Comment créer mon premier projet ?', views: 1250 },
        { title: 'Inviter des membres à mon équipe', views: 890 },
        { title: 'Configurer mon profil', views: 650 },
      ],
    },
    {
      title: 'Gestion des tâches',
      icon: Video,
      articles: [
        { title: 'Créer et assigner des tâches', views: 2100 },
        { title: 'Utiliser les vues Kanban et Gantt', views: 1850 },
        { title: 'Définir des priorités et échéances', views: 1420 },
      ],
    },
    {
      title: 'Collaboration',
      icon: MessageCircle,
      articles: [
        { title: 'Mentionner des collègues', views: 980 },
        { title: 'Partager des fichiers', views: 750 },
        { title: 'Gérer les notifications', views: 620 },
      ],
    },
  ];

  const faqs = [
    {
      question: 'Comment modifier mon mot de passe ?',
      answer: 'Allez dans Paramètres > Mot de passe. Entrez votre nouveau mot de passe en respectant les critères de sécurité (8 caractères minimum, majuscules, minuscules, chiffres et caractères spéciaux).',
    },
    {
      question: 'Puis-je inviter des membres externes à mon entreprise ?',
      answer: 'Seuls les administrateurs peuvent inviter de nouveaux membres. Contactez votre administrateur ou allez dans Paramètres > Équipe si vous avez les droits nécessaires.',
    },
    {
      question: 'Comment exporter mes données ?',
      answer: 'Cette fonctionnalité sera bientôt disponible. Vous pourrez exporter vos projets et tâches en CSV, Excel ou PDF depuis le menu d\'export.',
    },
    {
      question: 'Mes données sont-elles sécurisées ?',
      answer: 'Oui, toutes vos données sont chiffrées et stockées de manière sécurisée. Nous utilisons les meilleures pratiques de sécurité pour protéger vos informations.',
    },
    {
      question: 'Comment contacter le support ?',
      answer: 'Vous pouvez nous contacter par email à support@wadashaqeen.com ou utiliser le chat en direct disponible 24/7.',
    },
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
                <HelpCircle className="h-8 w-8" />
                Centre d'aide
              </h1>
              <p className="text-muted-foreground">
                Trouvez des réponses à vos questions
              </p>
            </div>
          </div>
        </div>

        {/* Recherche */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans l'aide..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 text-lg h-12"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Catégories */}
          {categories.map((category) => (
            <Card key={category.title} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <category.icon className="h-5 w-5" />
                  {category.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {category.articles.map((article, i) => (
                    <button
                      key={i}
                      className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors"
                    >
                      <p className="text-sm font-medium mb-1">{article.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {article.views} vues
                      </p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Questions fréquentes</CardTitle>
            <CardDescription>
              Les questions les plus posées par nos utilisateurs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Besoin d'aide supplémentaire ?</CardTitle>
            <CardDescription>
              Notre équipe est là pour vous aider
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="outline" className="justify-start h-auto py-4">
                <Mail className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <p className="font-medium">Email</p>
                  <p className="text-xs text-muted-foreground">
                    Réponse sous 24h
                  </p>
                </div>
              </Button>
              <Button variant="outline" className="justify-start h-auto py-4">
                <MessageCircle className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <p className="font-medium">Chat en direct</p>
                  <p className="text-xs text-muted-foreground">
                    Disponible 24/7
                  </p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
