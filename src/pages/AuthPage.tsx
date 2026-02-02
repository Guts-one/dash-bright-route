import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Truck, Shield, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

const signupSchema = loginSchema.extend({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
  role: z.enum(['manager', 'driver']),
});

export default function AuthPage() {
  const navigate = useNavigate();
  const { signIn, signUp, role } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup form
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState<'manager' | 'driver'>('driver');

  // Demo accounts info
  const demoAccounts = [
    { email: 'manager@demo.com', password: 'demo1234', role: 'Gerente' },
    { email: 'driver1@demo.com', password: 'demo1234', role: 'Motorista' },
    { email: 'driver2@demo.com', password: 'demo1234', role: 'Motorista' },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = loginSchema.safeParse({ email: loginEmail, password: loginPassword });
    if (!validation.success) {
      toast.error('Erro de validacao', { description: validation.error.errors[0].message });
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setIsLoading(false);

    if (error) {
      toast.error('Falha no login', { description: error.message });
      return;
    }

    toast.success('Bem-vindo de volta!');
    // Navigation will happen via useEffect in App.tsx based on role
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = signupSchema.safeParse({
      email: signupEmail,
      password: signupPassword,
      name: signupName,
      role: signupRole,
    });
    
    if (!validation.success) {
      toast.error('Erro de validacao', { description: validation.error.errors[0].message });
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(signupEmail, signupPassword, signupName, signupRole);
    setIsLoading(false);

    if (error) {
      if (error.message.includes('already registered')) {
        toast.error('Conta existente', { description: 'Este email ja esta cadastrado. Faca login.' });
      } else {
        toast.error('Falha no cadastro', { description: error.message });
      }
      return;
    }

    toast.success('Conta criada!', { description: 'Voce ja esta conectado.' });
  };

  const fillDemoCredentials = (email: string, password: string) => {
    setLoginEmail(email);
    setLoginPassword(password);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 text-primary-foreground">
            <div className="w-10 h-10 bg-primary-foreground/20 rounded-lg flex items-center justify-center">
              <Truck className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold">FleetTrack Pro</span>
          </div>
        </div>
        
        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-primary-foreground leading-tight">
            Gestao inteligente de frotas<br />para logistica moderna
          </h1>
          <p className="text-primary-foreground/80 text-lg max-w-md">
            Rastreamento em tempo real, otimizacao de rotas e gestao de entregas -
            tudo em uma plataforma poderosa criada para o sucesso da sua equipe.
          </p>
          
          <div className="flex items-center gap-6 pt-4">
            <div className="flex items-center gap-2 text-primary-foreground/80">
              <Shield className="w-5 h-5" />
              <span className="text-sm">Privacidade em primeiro lugar</span>
            </div>
            <div className="flex items-center gap-2 text-primary-foreground/80">
              <Eye className="w-5 h-5" />
              <span className="text-sm">Rastreamento transparente</span>
            </div>
          </div>
        </div>
        
        <p className="text-primary-foreground/60 text-sm">
          (c) 2024 FleetTrack Pro. Feito para excelencia operacional.
        </p>
      </div>

      {/* Right side - Auth forms */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Truck className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">FleetTrack Pro</span>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Bem-vindo de volta</CardTitle>
                  <CardDescription>
                    Digite suas credenciais para acessar seu painel
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@company.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Senha</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Entrando...' : 'Entrar'}
                    </Button>
                  </form>

                  {/* Demo accounts */}
                  <div className="mt-6 pt-6 border-t">
                    <p className="text-sm text-muted-foreground mb-3">Contas demo:</p>
                    <div className="space-y-2">
                      {demoAccounts.map((acc) => (
                        <button
                          key={acc.email}
                          type="button"
                          onClick={() => fillDemoCredentials(acc.email, acc.password)}
                          className="w-full text-left px-3 py-2 rounded-md bg-muted hover:bg-muted/80 transition-colors text-sm"
                        >
                          <span className="font-medium">{acc.role}</span>
                          <span className="text-muted-foreground ml-2">{acc.email}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signup">
              <Card>
                <CardHeader>
                  <CardTitle>Criar uma conta</CardTitle>
                  <CardDescription>
                    Comece a usar o FleetTrack Pro
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Nome completo</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="John Smith"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@company.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Senha</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-role">Funcao</Label>
                      <Select value={signupRole} onValueChange={(v) => setSignupRole(v as 'manager' | 'driver')}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="driver">Motorista</SelectItem>
                          <SelectItem value="manager">Gerente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Criando conta...' : 'Criar conta'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <p className="text-center text-sm text-muted-foreground mt-6">
            <Link to="/transparency" className="hover:underline">
              O que monitoramos e por que -{'>'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
