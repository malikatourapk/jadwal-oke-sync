import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Store, Users, LogOut } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { signOut, isAdmin, loading, user } = useAuth();
  const { currentStore } = useStore();

  // Redirect non-admin users directly to POS after login
  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/pos', { replace: true });
    }
  }, [isAdmin, loading, navigate]);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Show loading while checking admin status
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Only admins see this page
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Selamat Datang</h1>
          <p className="text-muted-foreground">
            {currentStore?.name || 'Sistem Kasir'}
          </p>
        </div>

        {/* Menu Cards */}
        <div className="space-y-4">
          {/* POS Menu */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/pos')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Store className="h-8 w-8 text-primary" />
                </div>
                <span>Kasir POS</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Akses sistem Point of Sale untuk transaksi dan manajemen produk
              </p>
            </CardContent>
          </Card>

          {/* Admin Menu - Only show if user is admin */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/admin/users')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <span>Admin Panel</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Kelola user, approval pendaftaran, dan administrasi sistem
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Logout Button */}
        <Button 
          variant="outline" 
          className="w-full"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Keluar
        </Button>
      </div>
    </div>
  );
};
