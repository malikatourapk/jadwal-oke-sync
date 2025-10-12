import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface UserSubscription {
  user_id: string;
  email: string;
  username: string;
  is_approved: boolean;
  subscription_expired_at?: string;
  created_at: string;
}

export const SubscriptionManagement = () => {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserSubscription | null>(null);
  const [duration, setDuration] = useState<string>('1');
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [extending, setExtending] = useState(false);

  useEffect(() => {
    if (isAdmin && user) {
      fetchUsers();
    }
  }, [isAdmin, user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, email, username, is_approved, subscription_expired_at, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Gagal memuat data user');
    } finally {
      setLoading(false);
    }
  };

  const handleExtendSubscription = async () => {
    if (!selectedUser) return;

    setExtending(true);
    try {
      const { data, error } = await supabase.rpc('extend_subscription', {
        p_user_id: selectedUser.user_id,
        p_duration_months: parseInt(duration)
      });

      if (error) throw error;

      toast.success(`Subscription berhasil diperpanjang ${duration} bulan`);
      setShowExtendDialog(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error extending subscription:', error);
      toast.error('Gagal memperpanjang subscription');
    } finally {
      setExtending(false);
    }
  };

  const getSubscriptionStatus = (expiredAt?: string) => {
    if (!expiredAt) {
      return { status: 'Belum ada', variant: 'secondary' as const, icon: Clock };
    }

    const now = new Date();
    const expired = new Date(expiredAt);

    if (expired < now) {
      return { status: 'Expired', variant: 'destructive' as const, icon: AlertCircle };
    }

    const daysLeft = Math.ceil((expired.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 7) {
      return { status: `${daysLeft} hari lagi`, variant: 'default' as const, icon: AlertCircle };
    }

    return { status: 'Aktif', variant: 'default' as const, icon: CheckCircle };
  };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate('/admin/users')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Manajemen Subscription</h1>
          <p className="text-sm text-muted-foreground">Kelola trial dan perpanjangan subscription user</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total User</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Subscription Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {users.filter(u => {
                if (!u.subscription_expired_at) return false;
                return new Date(u.subscription_expired_at) > new Date();
              }).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {users.filter(u => {
                if (!u.subscription_expired_at) return false;
                return new Date(u.subscription_expired_at) <= new Date();
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="space-y-2">
        <Label>Cari User</Label>
        <Input
          placeholder="Email atau username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Users List */}
      <div className="space-y-3">
        {loading ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              Loading...
            </CardContent>
          </Card>
        ) : filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              Tidak ada user ditemukan
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user) => {
            const { status, variant, icon: StatusIcon } = getSubscriptionStatus(user.subscription_expired_at);
            
            return (
              <Card key={user.user_id}>
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{user.username || user.email}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant={variant} className="flex items-center gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {status}
                        </Badge>
                        
                        {user.subscription_expired_at && (
                          <span className="text-xs text-muted-foreground">
                            Expired: {new Date(user.subscription_expired_at).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Select
                        value={duration}
                        onValueChange={setDuration}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Durasi" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Bulan</SelectItem>
                          <SelectItem value="2">2 Bulan</SelectItem>
                          <SelectItem value="3">3 Bulan</SelectItem>
                          <SelectItem value="6">6 Bulan</SelectItem>
                          <SelectItem value="12">1 Tahun</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowExtendDialog(true);
                        }}
                        size="sm"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Perpanjang
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Extend Dialog */}
      <AlertDialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Perpanjangan</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Perpanjang subscription untuk:</p>
              <p className="font-medium text-foreground">{selectedUser?.email}</p>
              <p>Durasi: <span className="font-medium text-foreground">{duration} bulan</span></p>
              {selectedUser?.subscription_expired_at && (
                <p className="text-sm">
                  Expired saat ini: {new Date(selectedUser.subscription_expired_at).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                * Perpanjangan akan ditambahkan dari tanggal expired saat ini (atau hari ini jika sudah expired)
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={extending}>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleExtendSubscription}
              disabled={extending}
            >
              {extending ? 'Memproses...' : 'Perpanjang'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
