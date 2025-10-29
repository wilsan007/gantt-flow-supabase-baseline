import { useState, useEffect } from "react";
import { MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface Task {
  id: string;
  title: string;
}

interface CommentsColumnProps {
  task: Task;
}

interface TaskComment {
  id: string;
  content: string;
  created_at: string;
  author_id: string | null;
  comment_type: string | null;
}

export const CommentsColumn = ({ task }: CommentsColumnProps) => {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const { toast } = useToast();

  const loadComments = async () => {
    if (loading) return;
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from("task_comments")
        .select("*")
        .eq("task_id", task.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error("Error loading comments:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les commentaires",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;

    setPosting(true);
    try {
      const { error } = await supabase
        .from("task_comments")
        .insert({
          task_id: task.id,
          content: newComment.trim(),
          comment_type: "general",
        });

      if (error) throw error;

      setNewComment("");
      loadComments();
      
      toast({
        title: "Succès",
        description: "Commentaire ajouté",
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Erreur",
        description: "Échec de l'ajout du commentaire",
        variant: "destructive",
      });
    } finally {
      setPosting(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [task.id]);

  return (
    <div className="w-80 p-3 border-l flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="h-4 w-4" />
        <span className="text-sm font-medium">Commentaires</span>
        <span className="text-xs text-muted-foreground">({comments.length})</span>
      </div>
      
      <ScrollArea className="flex-1 mb-3">
        <div className="space-y-3 pr-2">
          {loading ? (
            <div className="text-center text-sm text-muted-foreground">
              Chargement...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground">
              Aucun commentaire
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="bg-muted/30 p-2 rounded-md">
                <div className="text-xs text-muted-foreground mb-1">
                  {formatDistanceToNow(new Date(comment.created_at), { 
                    addSuffix: true, 
                    locale: fr 
                  })}
                  {comment.comment_type && (
                    <span className="ml-2 px-1 bg-primary/10 rounded text-primary">
                      {comment.comment_type}
                    </span>
                  )}
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
          onChange={(e) => setNewComment(e.target.value)}
          className="mb-2 min-h-[60px] resize-none"
          disabled={posting}
        />
        <Button
          onClick={addComment}
          disabled={!newComment.trim() || posting}
          size="sm"
          className="w-full"
        >
          <Send className="h-3 w-3 mr-1" />
          {posting ? "Envoi..." : "Envoyer"}
        </Button>
      </div>
    </div>
  );
};