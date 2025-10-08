import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';
import { StoreSelector } from '@/components/Store/StoreSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import { Store } from '@/types/store';
import { MessageCircle, Instagram } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const LoginPage = () => {
  const { signIn, signUp, loading, user } = useAuth();
  const { currentStore } = useStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [adminContacts, setAdminContacts] = useState<{ whatsapp?: string; instagram?: string }>({});
  
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  
  const [signUpData, setSignUpData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState<string>('');
  const [showStoreSelector, setShowStoreSelector] = useState(false);

  // Fetch admin contact info - HARUS DI ATAS SEBELUM EARLY RETURN
  useEffect(() => {
    const fetchAdminContacts = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('admin_whatsapp, admin_instagram')
          .eq('email', 'tokoanjar09@gmail.com')
          .maybeSingle();
        
        if (data) {
          setAdminContacts({
            whatsapp: (data as any).admin_whatsapp,
            instagram: (data as any).admin_instagram
          });
        }
      } catch (error) {
        console.error('Error fetching admin contacts:', error);
      }
    };

    fetchAdminContacts();
  }, []);

  // Redirect logic - HARUS DI ATAS SEBELUM EARLY RETURN
  useEffect(() => {
    if (user && !loading && currentStore) {
      // Redirect admin to dashboard, others to POS
      if (user.email === 'tokoanjar09@gmail.com') {
        navigate('/', { replace: true });
      } else {
        navigate('/pos', { replace: true });
      }
    }
  }, [user, loading, currentStore, navigate]);

  const handleWhatsAppContact = () => {
    if (adminContacts.whatsapp) {
      const message = encodeURIComponent('Halo, saya ingin mengajukan pendaftaran atau mencoba trial 1 bulan.');
      window.open(`https://wa.me/${adminContacts.whatsapp}?text=${message}`, '_blank');
    }
  };

  const handleInstagramContact = () => {
    if (adminContacts.instagram) {
      window.open(`https://instagram.com/${adminContacts.instagram}`, '_blank');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors('');
    
    const { error } = await signIn(loginData.email, loginData.password);
    if (error) {
      setErrors(error.message || 'Login gagal');
    } else {
      // Show store selector after successful login
      setShowStoreSelector(true);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors('');

    if (signUpData.password !== signUpData.confirmPassword) {
      setErrors('Password tidak cocok');
      return;
    }

    if (signUpData.password.length < 6) {
      setErrors('Password minimal 6 karakter');
      return;
    }

    const { error } = await signUp(signUpData.email, signUpData.username, signUpData.password);
    if (error) {
      setErrors(error.message || 'Pendaftaran gagal');
    } else {
      sonnerToast.success('Pendaftaran berhasil! Silakan tunggu approval dari admin.');
      setErrors('');
      // Clear form
      setSignUpData({
        email: '',
        username: '',
        password: '',
        confirmPassword: ''
      });
      // Redirect to waiting approval page
      navigate('/waiting-approval');
    }
  };

  const handleStoreSelected = (store: Store) => {
    navigate('/');
  };

  // Show store selector if user is logged in but no store selected yet
  if (user && !currentStore) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-4xl">
          <StoreSelector onStoreSelected={handleStoreSelected} />
        </div>
      </div>
    );
  }

  // If already redirecting, show nothing
  if (user && currentStore) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Kasir Multi Toko</CardTitle>
          <CardDescription>
            Sistem kasir untuk berbagai jenis toko
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Daftar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                    required
                  />
                </div>
                
                {errors && (
                  <Alert variant="destructive">
                    <AlertDescription>{errors}</AlertDescription>
                  </Alert>
                )}
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Masuk...' : 'Masuk'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signUpData.email}
                    onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={signUpData.username}
                    onChange={(e) => setSignUpData(prev => ({ ...prev, username: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signUpData.password}
                    onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-password">Konfirmasi Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={signUpData.confirmPassword}
                    onChange={(e) => setSignUpData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                    minLength={6}
                  />
                </div>
                
                {errors && (
                  <Alert variant="destructive">
                    <AlertDescription>{errors}</AlertDescription>
                  </Alert>
                )}
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Mendaftar...' : 'Daftar'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Floating Contact Buttons */}
      {(adminContacts.whatsapp || adminContacts.instagram) && (
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
          {adminContacts.whatsapp && (
            <Button
              onClick={handleWhatsAppContact}
              size="lg"
              className="rounded-full h-14 w-14 shadow-lg hover:scale-110 transition-transform"
              title="Hubungi via WhatsApp"
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
          )}
          {adminContacts.instagram && (
            <Button
              onClick={handleInstagramContact}
              size="lg"
              variant="outline"
              className="rounded-full h-14 w-14 shadow-lg hover:scale-110 transition-transform"
              title="Hubungi via Instagram"
            >
              <Instagram className="h-6 w-6" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
