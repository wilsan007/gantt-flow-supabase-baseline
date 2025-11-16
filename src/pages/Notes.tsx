/**
 * Notes - Bloc-notes personnel
 * Pattern: Notion, Evernote
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Plus, Trash2, Calendar, Search, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    // Simulation - À remplacer par vraie table DB
    const mockNotes: Note[] = [
      {
        id: '1',
        title: 'Réunion hebdomadaire',
        content: 'Points à aborder:\n- Budget Q4\n- Objectifs équipe\n- Formation',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    setNotes(mockNotes);
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: 'Titre requis',
        description: 'Veuillez saisir un titre pour la note',
        variant: 'destructive',
      });
      return;
    }

    const newNote: Note = {
      id: Date.now().toString(),
      title,
      content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setNotes([newNote, ...notes]);
    setTitle('');
    setContent('');
    setSelectedNote(null);

    toast({
      title: 'Note enregistrée',
      description: 'Votre note a été sauvegardée',
    });
  };

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note);
    setTitle(note.title);
    setContent(note.content);
  };

  const handleDelete = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
    if (selectedNote?.id === id) {
      setSelectedNote(null);
      setTitle('');
      setContent('');
    }
    toast({
      title: 'Note supprimée',
      description: 'La note a été supprimée',
    });
  };

  const filteredNotes = notes.filter(
    note =>
      note.title.toLowerCase().includes(search.toLowerCase()) ||
      note.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
            <div>
              <h1 className="flex items-center gap-2 text-3xl font-bold">
                <FileText className="h-8 w-8" />
                Bloc-notes
              </h1>
              <p className="text-muted-foreground">Vos notes personnelles</p>
            </div>
          </div>
          <Button
            onClick={() => {
              setSelectedNote(null);
              setTitle('');
              setContent('');
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle note
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Liste des notes */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="border-0 focus-visible:ring-0"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {filteredNotes.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <FileText className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">Aucune note</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredNotes.map(note => (
                      <div
                        key={note.id}
                        className={`cursor-pointer p-4 transition-colors hover:bg-accent ${
                          selectedNote?.id === note.id ? 'bg-accent' : ''
                        }`}
                        onClick={() => handleSelectNote(note)}
                      >
                        <div className="mb-2 flex items-start justify-between">
                          <h3 className="line-clamp-1 font-medium">{note.title}</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={e => {
                              e.stopPropagation();
                              handleDelete(note.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">
                          {note.content}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(note.updated_at), 'dd MMM yyyy', { locale: fr })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Éditeur */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{selectedNote ? 'Modifier la note' : 'Nouvelle note'}</CardTitle>
                <CardDescription>
                  {selectedNote ? 'Modifiez votre note existante' : 'Créez une nouvelle note'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Input
                    placeholder="Titre de la note"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="text-lg font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <Textarea
                    placeholder="Contenu de la note..."
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    className="min-h-[400px] resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={loading}>
                    <FileText className="mr-2 h-4 w-4" />
                    Enregistrer
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTitle('');
                      setContent('');
                      setSelectedNote(null);
                    }}
                  >
                    Annuler
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  💡 Astuce : Utilisez Markdown pour formater vos notes (fonctionnalité à venir)
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
