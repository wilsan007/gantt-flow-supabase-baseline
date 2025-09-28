import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, UserPlus, Building, Mail, User, Lock, Eye, EyeOff, ShieldX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// --- Main Page Component ---
const TenantOwnerSignup: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // State for the form
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  
  // State for invitation data
  const [invitationEmail, setInvitationEmail] = useState('');
  const [invitationFullName, setInvitationFullName] = useState('');

  // UI/Flow state
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  // On component mount, validate the token from the URL
  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (!tokenFromUrl) {
      setError('Invitation token is missing from the URL.');
      setIsValidatingToken(false);
      return;
    }
    setToken(tokenFromUrl);

    const validateToken = async () => {
      try {
        const { data, error: rpcError } = await supabase.rpc('get_invitation_details', {
          p_invitation_token: tokenFromUrl,
        });

        if (rpcError) throw new Error(rpcError.message);
        if (data.error) {
            if(data.error === 'INVITATION_EXPIRED') throw new Error('This invitation link has expired.');
            if(data.error === 'INVITATION_ALREADY_USED') throw new Error('This invitation has already been used.');
            throw new Error('This invitation link is invalid.');
        }

        setInvitationEmail(data.email);
        setInvitationFullName(data.full_name);
      } catch (err: any) {
        setError(err.message);
        toast({ title: "Error", description: err.message, variant: "destructive" });
      } finally {
        setIsValidatingToken(false);
      }
    };

    validateToken();
  }, [searchParams, toast]);


  // Handle the form submission
  const handleSignup = async () => {
    if (password.length < 8) {
      return toast({ title: "Password Too Short", description: "Your password must be at least 8 characters long.", variant: "destructive" });
    }
    if (password !== confirmPassword) {
      return toast({ title: "Passwords Do Not Match", description: "The passwords you entered do not match.", variant: "destructive" });
    }
    if (!companyName.trim()) {
      return toast({ title: "Company Name Required", description: "Please enter the name of your company.", variant: "destructive" });
    }

    setIsLoading(true);
    try {
      // Call the single, secure edge function to handle everything
      const { error: functionError } = await supabase.functions.invoke('signup-from-invitation', {
        body: {
          invitation_token: token,
          company_name: companyName,
          password: password,
        },
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      toast({
        title: "✅ Success!",
        description: "Your account and company have been created. Please log in to continue.",
        variant: "default",
      });

      // Redirect to the login page on success
      navigate('/login');

    } catch (err: any) {
        // The edge function provides clear error messages
        const errorMessage = err.message.includes("already registered")
            ? "A user with this email is already registered."
            : err.message;

        toast({ title: "❌ Signup Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Render Logic ---

  if (isValidatingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <ShieldX className="h-12 w-12 text-destructive mx-auto" />
                <CardTitle className="mt-4">Invalid Invitation</CardTitle>
            </CardHeader>
            <CardContent>
                <Alert variant="destructive">
                    <AlertDescription className="text-center">{error}</AlertDescription>
                </Alert>
                <Button onClick={() => navigate('/login')} className="w-full mt-4">Go to Login</Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to the Platform!</CardTitle>
          <CardDescription>Create your company account to get started.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="email" type="email" value={invitationEmail} disabled className="pl-10 bg-muted" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="fullName" type="text" value={invitationFullName} disabled className="pl-10 bg-muted" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name *</Label>
            <div className="relative">
              <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="companyName" type="text" placeholder="Your Company Inc." value={companyName} onChange={(e) => setCompanyName(e.target.value)} disabled={isLoading} className="pl-10" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="password" type={showPassword ? "text" : "password"} placeholder="8+ characters" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} className="pl-10 pr-10" />
              <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="confirmPassword" type={showPassword ? "text" : "password"} placeholder="Repeat your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isLoading} className="pl-10 pr-10" />
            </div>
          </div>

          <Button onClick={handleSignup} disabled={isLoading} className="w-full">
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating Account...</> : <><UserPlus className="mr-2 h-4 w-4" />Complete Signup</>}
          </Button>

        </CardContent>
      </Card>
    </div>
  );
};

export default TenantOwnerSignup;