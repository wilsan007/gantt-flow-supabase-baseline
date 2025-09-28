import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const TenantOwnerLogin: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [form, setForm] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    const type = searchParams.get('type');
    
    if (token && type === 'signup') {
      supabase.auth.verifyOtp({ token_hash: token, type: 'signup' })
        .then(({ data }) => {
          if (data.user?.email) {
            setForm(prev => ({ ...prev, email: data.user.email || '' }));
            toast({ title: "✅ Email confirmé" });
          }
        });
    }
  }, []);

  const triggerEdgeFunction = async (user: any) => {
    try {
      console.log('🚀 Déclenchement Edge Function pour:', user.email);
      
      // D'abord confirmer l'email si pas encore fait
      if (!user.email_confirmed_at) {
        console.log('📧 Confirmation de l\'email...');
        try {
          await supabase.auth.admin.updateUserById(user.id, { email_confirm: true });
          console.log('✅ Email confirmé');
        } catch (confirmError) {
          console.log('⚠️ Erreur confirmation email:', confirmError);
        }
      }
      
      // Utiliser la clé service pour l'Edge Function (plus de permissions)
      const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI";
      
      const response = await fetch('https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/handle-email-confirmation', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_KEY
        },
        body: JSON.stringify({
          type: 'UPDATE',
          table: 'users',
          schema: 'auth',
          record: {
            id: user.id,
            email: user.email,
            email_confirmed_at: new Date().toISOString() // Forcer la confirmation
          },
          old_record: {
            id: user.id,
            email: user.email,
            email_confirmed_at: null
          }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast({ 
          title: "🎉 Configuration automatique réussie", 
          description: `Tenant créé, employé ${result.data?.employee_id} configuré` 
        });
        console.log('✅ Edge Function résultat:', result);
        return true;
      } else {
        console.log('⚠️ Edge Function erreur:', result.error);
        toast({ 
          title: "⚠️ Configuration partielle", 
          description: result.error || "Configuration en cours..." 
        });
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur Edge Function:', error);
      toast({ 
        title: "❌ Erreur configuration", 
        description: "Veuillez réessayer" 
      });
      return false;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // D'abord essayer de se connecter
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password
      });

      if (error) {
        // Si erreur de connexion, vérifier si c'est à cause de l'email non confirmé
        if (error.message.includes('Email not confirmed') || error.message.includes('mail not confirme')) {
          toast({ 
            title: "📧 Email non confirmé", 
            description: "Configuration automatique en cours..." 
          });
          
          // Récupérer l'utilisateur par email pour déclencher l'Edge Function
          const { data: usersData } = await supabase.auth.admin.listUsers();
          const user = usersData?.users?.find((u: any) => u.email === form.email);
          
          if (user) {
            console.log('👤 Utilisateur trouvé, déclenchement Edge Function...');
            
            // Déclencher l'Edge Function pour confirmer l'email et configurer le tenant
            await triggerEdgeFunction(user);
            
            // Attendre un peu puis réessayer la connexion
            setTimeout(async () => {
              try {
                const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
                  email: form.email,
                  password: form.password
                });
                
                if (!retryError && retryData.user) {
                  toast({ title: "✅ Connexion réussie après configuration" });
                  navigate('/');
                } else {
                  toast({ 
                    title: "⚠️ Configuration terminée", 
                    description: "Veuillez réessayer de vous connecter" 
                  });
                }
              } catch (retryErr) {
                console.error('Erreur retry connexion:', retryErr);
              }
              setIsLoading(false);
            }, 3000);
            
            return; // Sortir ici pour éviter le finally
          } else {
            throw new Error('Utilisateur non trouvé');
          }
        } else {
          throw error;
        }
      }
      
      // Connexion réussie directement
      if (data.user) {
        toast({ title: "✅ Connexion réussie", description: "Configuration automatique en cours..." });
        
        // Déclencher l'Edge Function en arrière-plan même si déjà connecté
        setTimeout(() => {
          triggerEdgeFunction(data.user);
        }, 1000);
        
        navigate('/');
      }
      
    } catch (error: any) {
      toast({ title: "❌ Erreur", description: error.message, variant: "destructive" });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Connexion Tenant Owner</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantOwnerLogin;
