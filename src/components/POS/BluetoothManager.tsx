import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Bluetooth, 
  BluetoothConnected, 
  X, 
  Smartphone,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { useBluetoothContext } from '@/contexts/BluetoothContext';

export const BluetoothManager = () => {
  const { isConnected, isConnecting, connect, disconnect } = useBluetoothContext();

  const handleConnect = async () => {
    try {
      const success = await connect();
      
      if (success) {
        toast.success('Berhasil terhubung ke Thermal Printer');
      } else {
        toast.error('Koneksi dibatalkan atau printer tidak ditemukan');
      }
    } catch (error: any) {
      console.error('Connection error:', error);
      
      // More specific error messages for mobile users
      if (error.message?.includes('User cancelled') || 
          error.name === 'NotFoundError') {
        toast.info('Koneksi dibatalkan oleh pengguna');
      } else if (error.message?.includes('timeout')) {
        toast.error('Koneksi timeout. Pastikan printer dalam jangkauan dan mode pairing aktif.');
      } else if (error.message?.includes('GATT_ERROR')) {
        toast.error('Gagal terhubung ke printer. Coba restart printer dan ulangi koneksi.');
      } else if (error.message?.includes('Device not found')) {
        toast.error('Printer tidak ditemukan. Pastikan printer menyala dan dapat ditemukan.');
      } else if (error.message?.includes('Web Bluetooth tidak didukung')) {
        toast.error('Web Bluetooth tidak didukung. Gunakan Chrome versi 56+ di Android dan aktifkan flag experimental jika perlu.');
      } else if (error.message?.includes('characteristic')) {
        toast.error('Printer tidak kompatibel. Coba printer lain atau restart printer dan HP.');
      } else {
        toast.error(`Gagal terhubung: ${error.message}. Coba restart Chrome dan printer.`);
      }
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      toast.success('Berhasil memutuskan koneksi');
    } catch (error) {
      console.error('Disconnect error:', error);
      toast.error('Gagal memutuskan koneksi');
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Connection Status Badge */}
      <Badge 
        variant={isConnected ? "default" : "secondary"}
        className="flex items-center gap-1"
      >
        {isConnected ? (
          <>
            <BluetoothConnected className="h-3 w-3" />
            <span className="text-xs">Terhubung</span>
          </>
        ) : (
          <>
            <Bluetooth className="h-3 w-3" />
            <span className="text-xs">Terputus</span>
          </>
        )}
      </Badge>

      {/* Connect/Disconnect Button */}
      {!isConnected ? (
        <Button
          size="sm"
          variant="outline"
          onClick={handleConnect}
          disabled={isConnecting}
          className="flex items-center gap-1"
        >
          {isConnecting ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
              <span className="text-xs hidden sm:inline">Menghubungkan...</span>
            </>
          ) : (
            <>
              <Bluetooth className="h-3 w-3" />
              <span className="text-xs hidden sm:inline">Hubungkan</span>
            </>
          )}
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={handleDisconnect}
          className="flex items-center gap-1"
        >
          <X className="h-3 w-3" />
          <span className="text-xs hidden sm:inline">Putus</span>
        </Button>
      )}
    </div>
  );
};

export const BluetoothInstructions = () => {
  const isAndroid = /Android/.test(navigator.userAgent);
  const isChrome = /Chrome/.test(navigator.userAgent);
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const androidVersion = navigator.userAgent.match(/Android (\d+(?:\.\d+)?)/);
  const isOlderAndroid = androidVersion && parseFloat(androidVersion[1]) < 9.0;
  
  if (!isAndroid || !isChrome) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-medium text-amber-900">Persyaratan Bluetooth Web</h3>
              <div className="text-sm text-amber-800 space-y-1">
                <p>• Gunakan <strong>Google Chrome versi 56+</strong> di perangkat <strong>Android</strong></p>
                <p>• Pastikan situs diakses via <strong>HTTPS</strong></p>
                <p>• Aktifkan Bluetooth di perangkat Android</p>
                <p>• Berikan izin lokasi jika diminta browser</p>
                {!isMobile && <p>• Desktop: Web Bluetooth terbatas, gunakan aplikasi mobile</p>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${isOlderAndroid ? 'border-orange-200 bg-orange-50' : 'border-blue-200 bg-blue-50'}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Bluetooth className={`h-5 w-5 ${isOlderAndroid ? 'text-orange-600' : 'text-blue-600'} mt-0.5`} />
          <div className="space-y-2">
            <h3 className={`font-medium ${isOlderAndroid ? 'text-orange-900' : 'text-blue-900'}`}>
              {isOlderAndroid ? 'Panduan Khusus Android Oreo (8.0/8.1)' : 'Panduan Koneksi Bluetooth'}
            </h3>
            <div className={`text-sm ${isOlderAndroid ? 'text-orange-800' : 'text-blue-800'} space-y-1`}>
              {isOlderAndroid ? (
                <>
                  <p>• Pastikan Chrome diperbarui ke versi terbaru</p>
                  <p>• Aktifkan "Experimental Web Platform Features" di chrome://flags</p>
                  <p>• Berikan izin lokasi saat diminta browser</p>
                  <p>• Pilih "Accept All Devices" saat mencari printer</p>
                  <p>• Jika gagal berulang kali, restart Chrome dan coba lagi</p>
                  <p>• Pastikan printer mendukung Bluetooth Low Energy (BLE)</p>
                </>
              ) : (
                <>
                  <p>• Pastikan Bluetooth aktif di perangkat Android</p>
                  <p>• Nyalakan thermal printer dan aktifkan mode pairing</p>
                  <p>• Klik "Hubungkan" dan pilih printer dari daftar</p>
                  <p>• Jika gagal, refresh halaman dan coba lagi</p>
                  <p>• Pastikan printer mendukung Bluetooth LE (Low Energy)</p>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const DeviceConnectionStatus = () => {
  const { isConnected } = useBluetoothContext();

  if (!isConnected) return null;

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Bluetooth Aktif</span>
          </div>
          <Badge variant="outline" className="text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            Siap Print
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};