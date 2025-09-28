import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, UserPlus, Building, Mail, User, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SignupForm {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  companyName: string;
}

const TenantOwnerSignup: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [form, setForm] = useState<SignupForm>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    companyName: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [invitationData, setInvitationData] = useState<any>(null);
  const [validatingToken, setValidatingToken] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
      validateInvitationToken(tokenParam);
    } else {
      setError("Token d'invitation manquant dans l'URL.");
      setValidatingToken(false);
    }
  }, [searchParams]);

  const validateInvitationToken = async (token: string) => {
    setValidatingToken(true);
    setError(null);
    const { data, error: rpcError } = await supabase
      .from('invitations')
      .select('email, full_name')
      .eq('token', token)
      .eq('status', 'pending')
      .single();

    if (rpcError || !data) {
      console.error("Validation Error:", rpcError);
      setError("Lien d'invitation invalide, expiré, ou déjà utilisé. Veuillez contacter le support.");
      setValidatingToken(false);
      return;
    }

    setInvitationData(data);
    setForm(prev => ({
      ...prev,
      email: data.email,
      fullName: data.full_name,
    }));
    setValidatingToken(false);
  };

  const handleInputChange = (field: keyof SignupForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!form.email || !form.fullName || !form.companyName || !form.password) {
      toast({ title: "Erreur", description: "Tous les champs marqués * sont requis.", variant: "destructive" });
      return false;
    }
    if (form.password.length < 8) {
      toast({ title: "Erreur", description: "Le mot de passe doit contenir au moins 8 caractères.", variant: "destructive" });
      return false;
    }
    if (form.password !== form.confirmPassword) {
      toast({ title: "Erreur", description: "Les mots de passe ne correspondent pas.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleSignup = async () => {
    if (!validateForm() || !token) return;

    setIsLoading(true);
    try {
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName.trim(),
          }
        }
      });

      if (signUpError) throw signUpError;
      if (!user) throw new Error("L'utilisateur n'a pas pu être créé.");

      const { data: creationData, error: rpcError } = await supabase.rpc('create_tenant_owner_from_invitation', {
        p_invitation_token: token,
        p_user_id: user.id,
        p_company_name: form.companyName.trim()
      });

      if (rpcError) throw rpcError;
      if (!creationData.success) throw new Error(creationData.error || 'Une erreur est survenue lors de la création du tenant.');

      toast({
        title: "🎉 Compte créé avec succès !",
        description: `Bienvenue chez Wadashaqeen, ${form.fullName} !`,
      });

      navigate('/dashboard');

    } catch (error: any) {
      console.error('Erreur d\'inscription:', error);
      toast({
        title: "❌ Erreur d'inscription",
        description: error.message || 'Une erreur est survenue.',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (validatingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-4">Validation de l'invitation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <CardTitle>Erreur d'invitation</CardTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <Building className="h-6 w-6" />
            Créer votre entreprise
          </CardTitle>
          <CardDescription>
            Finalisez votre inscription sur Wadashaqeen
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert>
            <UserPlus className="h-4 w-4" />
            <AlertDescription>
              <strong>Invitation pour :</strong> {invitationData?.full_name}<br />
              <strong>Email :</strong> {invitationData?.email}
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="email" type="email" value={form.email} disabled className="pl-10 bg-muted" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Nom complet *</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="fullName" type="text" value={form.fullName} onChange={(e) => handleInputChange('fullName', e.target.value)} disabled={isLoading} className="pl-10" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyName">Nom de l'entreprise *</Label>
            <div className="relative">
              <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="companyName" type="text" placeholder="Mon Entreprise SARL" value={form.companyName} onChange={(e) => handleInputChange('companyName', e.target.value)} disabled={isLoading} className="pl-10" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="password" type={showPassword ? "text" : "password"} placeholder="Minimum 8 caractères" value={form.password} onChange={(e) => handleInputChange('password', e.target.value)} disabled={isLoading} className="pl-10 pr-10" />
              <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Répétez votre mot de passe" value={form.confirmPassword} onChange={(e) => handleInputChange('confirmPassword', e.target.value)} disabled={isLoading} className="pl-10 pr-10" />
              <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Button onClick={handleSignup} disabled={isLoading} className="w-full">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
            Enregistrer mon entreprise
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantOwnerSignup;