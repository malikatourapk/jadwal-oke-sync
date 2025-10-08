import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.anjar.tokoanjar',
  appName: 'anjarpos5-22',
  webDir: 'dist',
  // Note: server.url dihapus agar APK memuat aset lokal (tidak membuka situs Lovable)
  // Untuk live-reload saat development, bisa sementara tambahkan kembali:
  // server: {
  //   url: 'https://2e18c95d-191f-4517-aba9-ef9096017fc0.lovableproject.com?forceHideBadge=true',
  //   cleartext: true
  // },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;