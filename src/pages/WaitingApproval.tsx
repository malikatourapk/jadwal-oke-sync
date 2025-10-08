import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, MessageCircle, Instagram, Mail, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const WaitingApproval = () => {
  const { user, isApproved, loading } = useAuth();
  const navigate = useNavigate();
  const [adminContacts, setAdminContacts] = useState<{ whatsapp?: string; instagram?: string }>({});

  useEffect(() => {
    // Fetch admin contact info
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

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    } else if (!loading && user && isApproved) {
      navigate('/');
    }
  }, [user, isApproved, loading, navigate]);

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
            <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <CardTitle className="text-2xl">Menunggu Konfirmasi Admin</CardTitle>
          <CardDescription>
            Akun Anda sedang dalam proses verifikasi oleh administrator
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>Email Anda: <span className="font-semibold text-foreground">{user?.email}</span></p>
          </div>

          {/* Email Confirmation Info */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Email Konfirmasi
                </p>
                <p className="text-blue-800 dark:text-blue-200">
                  Kami telah mengirimkan email konfirmasi ke alamat email Anda. 
                  Silakan cek inbox atau folder spam Anda.
                </p>
              </div>
            </div>
          </div>

          {/* Warning about email delay */}
          <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
                  Tunggu Maksimal 15 Menit
                </p>
                <p className="text-orange-800 dark:text-orange-200">
                  Email konfirmasi akan tiba maksimal 15 menit. Jika setelah 15 menit Anda tidak menerima email, 
                  silakan hubungi admin melalui tombol di bawah ini.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground pt-2">
            <p>
              Atau hubungi kami untuk mencoba trial 1 bulan
            </p>
          </div>

          <div className="space-y-2">
            {adminContacts.whatsapp && (
              <Button
                onClick={handleWhatsAppContact}
                className="w-full"
                variant="default"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Hubungi via WhatsApp
              </Button>
            )}

            {adminContacts.instagram && (
              <Button
                onClick={handleInstagramContact}
                className="w-full"
                variant="outline"
              >
                <Instagram className="h-4 w-4 mr-2" />
                Hubungi via Instagram
              </Button>
            )}
          </div>

          <Button
            onClick={() => navigate('/login')}
            variant="ghost"
            className="w-full"
          >
            Kembali ke Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
