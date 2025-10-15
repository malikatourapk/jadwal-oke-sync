import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, MessageCircle, Instagram, Mail, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import kasirqLogo from '@/assets/kasirq-logo.png';

export const WaitingApproval = () => {
  const { user, isApproved, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [adminContacts, setAdminContacts] = useState<{ whatsapp: string; instagram: string }>({
    whatsapp: '',
    instagram: ''
  });

  useEffect(() => {
    const loadAdminContacts = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('admin_whatsapp, admin_instagram')
          .eq('email', 'tokoanjar09@gmail.com')
          .single();
        
        if (error) {
          console.error('Failed to load admin contacts:', error);
          return;
        }
        
        if (data) {
          const contactData = data as any;
          setAdminContacts({
            whatsapp: contactData.admin_whatsapp || '',
            instagram: contactData.admin_instagram || ''
          });
        }
      } catch (error) {
        console.error('Error loading admin contacts:', error);
      }
    };

    loadAdminContacts();

    const contactsChannel = supabase
      .channel('admin_contact_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: 'email=eq.tokoanjar09@gmail.com'
        },
        (payload) => {
          console.log('Admin contacts updated:', payload);
          loadAdminContacts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(contactsChannel);
    };
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

  const handleLogoutClick = async () => {
    await signOut();
    navigate('/login');
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
          <div className="flex items-center justify-center gap-3 mb-6">
            <img src={kasirqLogo} alt="KasirQ Logo" className="w-16 h-16" />
            <h1 className="text-3xl font-bold text-primary">KasirQ</h1>
          </div>
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
            <p className="mt-4">
              Akun Anda sedang menunggu konfirmasi dari admin. Silakan hubungi admin untuk mengaktifkan akun atau mencoba trial 1 bulan.
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
            onClick={handleLogoutClick}
            variant="ghost"
            className="w-full"
          >
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
