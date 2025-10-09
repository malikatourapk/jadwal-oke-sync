import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Upload, Database, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useStore } from '@/contexts/StoreContext';

export const BackupRestore = () => {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const { currentStore } = useStore();

  const handleBackup = async () => {
    if (!currentStore) {
      toast.error('Tidak ada toko yang dipilih');
      return;
    }

    setIsBackingUp(true);
    try {
      // Fetch all data from current store
      const [productsResult, receiptsResult, storeResult] = await Promise.all([
        supabase.from('products').select('*').eq('store_id', currentStore.id),
        supabase.from('receipts').select('*').eq('store_id', currentStore.id),
        supabase.from('stores').select('*').eq('id', currentStore.id).single()
      ]);

      if (productsResult.error) throw productsResult.error;
      if (receiptsResult.error) throw receiptsResult.error;
      if (storeResult.error) throw storeResult.error;

      // Create backup object
      const backup = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        store: storeResult.data,
        products: productsResult.data || [],
        receipts: receiptsResult.data || [],
      };

      // Convert to JSON and download
      const dataStr = JSON.stringify(backup, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup-${currentStore.name}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Backup berhasil dibuat!', {
        description: `Data toko "${currentStore.name}" telah dibackup`
      });
    } catch (error) {
      console.error('Backup error:', error);
      toast.error('Gagal membuat backup', {
        description: error instanceof Error ? error.message : 'Terjadi kesalahan'
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!currentStore) {
      toast.error('Tidak ada toko yang dipilih');
      return;
    }

    setIsRestoring(true);
    try {
      // Read file
      const text = await file.text();
      const backup = JSON.parse(text);

      // Validate backup structure
      if (!backup.version || !backup.store || !backup.products || !backup.receipts) {
        throw new Error('Format backup tidak valid');
      }

      // Confirm restoration
      const confirmed = window.confirm(
        `⚠️ PERINGATAN!\n\n` +
        `Restore akan MENGHAPUS semua data saat ini dan menggantinya dengan data backup.\n\n` +
        `Data yang akan direstore:\n` +
        `- ${backup.products.length} produk\n` +
        `- ${backup.receipts.length} transaksi\n` +
        `- Tanggal backup: ${new Date(backup.timestamp).toLocaleString('id-ID')}\n\n` +
        `Apakah Anda yakin ingin melanjutkan?`
      );

      if (!confirmed) {
        toast.info('Restore dibatalkan');
        setIsRestoring(false);
        return;
      }

      // Delete existing data
      await Promise.all([
        supabase.from('receipts').delete().eq('store_id', currentStore.id),
        supabase.from('products').delete().eq('store_id', currentStore.id)
      ]);

      // Insert products
      if (backup.products.length > 0) {
        const { error: productsError } = await supabase
          .from('products')
          .insert(backup.products.map((p: any) => ({
            ...p,
            store_id: currentStore.id // Ensure correct store_id
          })));
        
        if (productsError) throw productsError;
      }

      // Insert receipts
      if (backup.receipts.length > 0) {
        const { error: receiptsError } = await supabase
          .from('receipts')
          .insert(backup.receipts.map((r: any) => ({
            ...r,
            store_id: currentStore.id // Ensure correct store_id
          })));
        
        if (receiptsError) throw receiptsError;
      }

      // Update store settings (optional)
      const { error: storeError } = await supabase
        .from('stores')
        .update({
          name: backup.store.name,
          category: backup.store.category,
          phone: backup.store.phone,
          address: backup.store.address,
          // Add other fields you want to restore
        })
        .eq('id', currentStore.id);

      if (storeError) throw storeError;

      toast.success('Restore berhasil!', {
        description: 'Data telah dipulihkan. Halaman akan dimuat ulang...'
      });

      // Reload page after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Restore error:', error);
      toast.error('Gagal restore data', {
        description: error instanceof Error ? error.message : 'Terjadi kesalahan'
      });
    } finally {
      setIsRestoring(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Backup & Restore Data
        </CardTitle>
        <CardDescription>
          Cadangkan dan pulihkan semua data toko termasuk produk, transaksi, dan pengaturan
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Penting:</strong> Backup akan menyimpan semua data toko saat ini ke dalam file JSON. 
            Restore akan mengganti semua data toko dengan data dari file backup.
          </AlertDescription>
        </Alert>

        {/* Backup Section */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Backup Data</h3>
          <p className="text-xs text-muted-foreground">
            Download semua data toko Anda ke file backup (format JSON)
          </p>
          <Button 
            onClick={handleBackup} 
            disabled={isBackingUp || !currentStore}
            className="w-full sm:w-auto"
            variant="secondary"
          >
            <Download className="h-4 w-4 mr-2" />
            {isBackingUp ? 'Membuat Backup...' : 'Buat Backup'}
          </Button>
        </div>

        {/* Warning Alert */}
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Peringatan:</strong> Restore akan menghapus semua data saat ini dan menggantinya dengan data dari backup. 
            Proses ini tidak dapat dibatalkan!
          </AlertDescription>
        </Alert>

        {/* Restore Section */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Restore Data</h3>
          <p className="text-xs text-muted-foreground">
            Pulihkan data toko dari file backup yang sudah ada
          </p>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".json"
              onChange={handleRestore}
              disabled={isRestoring || !currentStore}
              className="hidden"
              id="restore-file-input"
            />
            <label htmlFor="restore-file-input">
              <Button 
                asChild
                variant="outline"
                disabled={isRestoring || !currentStore}
                className="w-full sm:w-auto cursor-pointer"
              >
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  {isRestoring ? 'Memulihkan Data...' : 'Pilih File Backup'}
                </span>
              </Button>
            </label>
          </div>
        </div>

        {/* Tips */}
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Tips:</strong>
            <ul className="mt-2 ml-4 text-xs space-y-1 list-disc">
              <li>Buat backup secara rutin (minimal 1x seminggu)</li>
              <li>Simpan file backup di tempat yang aman</li>
              <li>Beri nama file backup dengan tanggal untuk memudahkan identifikasi</li>
              <li>Test restore di lingkungan test terlebih dahulu jika memungkinkan</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
