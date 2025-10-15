import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.kasirq.pos',
  appName: 'KasirQ - POS',
  webDir: 'dist',
  // iOS status bar configuration
  ios: {
    contentInset: 'always'
  },
  // Android status bar configuration  
  android: {
    backgroundColor: '#3b82f6',
    allowMixedContent: true
  },
  server: {
    androidScheme: 'https'
  },
  // Note: server.url dihapus agar APK memuat aset lokal (tidak membuka situs Lovable)
  // Untuk live-reload saat development, bisa sementara tambahkan kembali:
  // server: {
  //   url: 'https://2e18c95d-191f-4517-aba9-ef9096017fc0.lovableproject.com?forceHideBadge=true',
  //   cleartext: true
  // },
  plugins: {
    CapacitorHttp: {
      enabled: true
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#3b82f6",
      showSpinner: false,
      androidSpinnerStyle: 'small',
      iosSpinnerStyle: 'small'
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#3b82f6'
    }
  }
};

export default config;