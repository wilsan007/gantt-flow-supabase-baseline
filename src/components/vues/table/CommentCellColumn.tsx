import { useState, useEffect } from 'react';
import { MessageSquare, Send } from '@/lib/icons';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Task {
  id: string;
  title: string;
}

interface CommentCellProps {
  task: Task;
  isSubtask?: boolean;
}

interface TaskComment {
  id: string;
  content: string;
  created_at: string;
  author_id: string | null;
  comment_type: string | null;
}

export const CommentCellColumn = ({ task, isSubtask }: CommentCellProps) => {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const loadComments = async () => {
    // Ne pas charger pour les tâches de démonstration (UUIDs fictifs)
    if (task.id.startsWith('00000000-0000-0000-0000')) {
      setComments([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('task_comments')
        .select('*')
        .eq('task_id', task.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;

    setPosting(true);
    try {
      const { error } = await supabase.from('task_comments').insert({
        task_id: task.id,
        content: newComment.trim(),
        comment_type: 'general',
        tenant_id: '00000000-0000-0000-0000-000000000001', // Default tenant for now
      });

      if (error) throw error;

      setNewComment('');
      loadComments();

      toast({
        title: 'Succès',
        description: 'Commentaire ajouté',
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Erreur',
        description: "Échec de l'ajout du commentaire",
        variant: 'destructive',
      });
    } finally {
      setPosting(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [task.id]);

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`${isSubtask ? 'h-6 px-1 text-xs' : 'h-8 px-2 text-sm'}`}
        >
          <MessageSquare className={`${isSubtask ? 'mr-1 h-3 w-3' : 'mr-1 h-4 w-4'}`} />
          {comments.length}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Commentaires - {task.title}</DialogTitle>
        </DialogHeader>

        <div className="flex h-96 flex-col">
          <ScrollArea className="mb-3 flex-1">
            <div className="space-y-3 pr-2">
              {comments.length === 0 ? (
                <div className="text-muted-foreground text-center text-sm">Aucun commentaire</div>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} className="bg-muted/30 rounded-md p-2">
                    <div className="text-muted-foreground mb-1 text-xs">
                      {formatDistanceToNow(new Date(comment.created_at), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </div>
                    <div className="text-sm">{comment.content}</div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="border-t pt-3">
            <Textarea
              placeholder="Ajouter un commentaire..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              className="mb-2 min-h-[60px] resize-none"
              disabled={posting}
            />
            <Button
              onClick={addComment}
              disabled={!newComment.trim() || posting}
              size="sm"
              className="w-full"
            >
              <Send className="mr-1 h-3 w-3" />
              {posting ? 'Envoi...' : 'Envoyer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
