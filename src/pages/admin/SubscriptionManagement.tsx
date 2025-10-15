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
        .select('user_id, email, username, is_approved, created_at')
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
      toast.error('Fitur subscription belum tersedia. Silakan jalankan migration SQL terlebih dahulu.');
      setShowExtendDialog(false);
    } catch (error) {
      console.error('Error extending subscription:', error);
      toast.error('Gagal memperpanjang subscription');
    } finally {
      setExtending(false);
    }
  };

  const getSubscriptionStatus = () => {
    return { status: 'Pending Setup', variant: 'secondary' as const, icon: Clock };
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
              -
            </div>
            <p className="text-xs text-muted-foreground mt-1">Run migration first</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              -
            </div>
            <p className="text-xs text-muted-foreground mt-1">Run migration first</p>
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
            const { status, variant, icon: StatusIcon } = getSubscriptionStatus();
            
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
              <p className="text-xs text-muted-foreground mt-2">
                * Fitur ini membutuhkan migration SQL dijalankan terlebih dahulu
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
