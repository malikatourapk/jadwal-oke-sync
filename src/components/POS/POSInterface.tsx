import { useState, useEffect, useMemo, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PhotocopyDialog } from './PhotocopyDialog';
import { PhotocopyService } from './PhotocopyService';
import { AdminProtection } from '@/components/Auth/AdminProtection';
import { 
  LazyProductGrid,
  LazyShoppingCart,
  LazyReceipt,
  LazyAddProductForm,
  LazySalesReport,
  LazyStockManagement,
  LazyReceiptHistory,
  LazyQuickInvoice,
  LazyShoppingList,
  LazyBluetoothManager,
  ComponentLoader
} from '@/components/Performance/LazyComponents';
import { usePOSContext } from '@/contexts/POSContext';
import { useAuth } from '@/contexts/AuthContext';
import { Receipt as ReceiptType, Product } from '@/types/pos';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Store, 
  Package, 
  Receipt as ReceiptIcon, 
  Plus, 
  Search,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  LogOut,
  Settings,
  RefreshCw,
  AlertTriangle,
  Scan
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

export const POSInterface = () => {
  const navigate = useNavigate();
  const {
    products,
    cart,
    receipts,
    addProduct,
    updateProduct,
    deleteProduct,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    processTransaction,
    addManualReceipt,
    formatPrice,
  } = usePOSContext();

  const { signOut } = useAuth();
  const { currentStore } = useStore();
  const [lastReceipt, setLastReceipt] = useState<ReceiptType | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [photocopyProduct, setPhotocopyProduct] = useState<Product | null>(null);
  const [showPhotocopyDialog, setShowPhotocopyDialog] = useState(false);
  const [currentTab, setCurrentTab] = useState('pos');
  const [showAdminProtection, setShowAdminProtection] = useState(false);
  const [pendingAdminAction, setPendingAdminAction] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Handle location state for viewing receipts from navigation
  useEffect(() => {
    try {
      const state = (window.history.state && window.history.state.usr) as any;
      if (state?.viewReceipt) {
        setSelectedReceipt(state.viewReceipt);
      }
    } catch (error) {
      console.log('No receipt from navigation state');
    }
  }, []);

  // Global Enter key support for thermal printing
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        // Only trigger if not in an input/textarea/contenteditable element
        const target = e.target as Element;
        if (target && 
            target.tagName !== 'INPUT' && 
            target.tagName !== 'TEXTAREA' && 
            target.getAttribute('contenteditable') !== 'true') {
          
          if (lastReceipt) {
            e.preventDefault();
            handlePrintThermal(lastReceipt);
          } else if (selectedReceipt) {
            e.preventDefault();
            handlePrintThermal(selectedReceipt);
          }
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [lastReceipt, selectedReceipt]);

  const handleProcessTransaction = async (paymentMethod?: string, discount?: number) => {
    const receipt = await processTransaction(paymentMethod, discount);
    if (receipt) {
      setLastReceipt(receipt);
    }
    return receipt;
  };

  const handlePhotocopyClick = (product: Product) => {
    setPhotocopyProduct(product);
    setShowPhotocopyDialog(true);
  };

  const handleDashboardClick = (section: string) => {
    switch (section) {
      case 'revenue':
      case 'profit':
        setCurrentTab('reports');
        break;
      case 'products':
        setCurrentTab('stock-management');
        break;
      case 'stock':
        setCurrentTab('stock');
        break;
      case 'low-stock':
        setCurrentTab('low-stock');
        break;
    }
  };

  const handleAdminAction = (action: string) => {
    setPendingAdminAction(action);
    setShowAdminProtection(true);
  };

  const handleAdminSuccess = () => {
    if (pendingAdminAction) {
      setCurrentTab(pendingAdminAction);
      setPendingAdminAction(null);
    }
    setShowAdminProtection(false);
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleRefresh = async () => {
    try {
      const { toast } = await import('sonner');
      toast.info('Menyinkronkan data...');
      
      // Trigger vibration on mobile
      if ('vibrate' in navigator) {
        navigator.vibrate(100);
      }
      
      // Force reload of the page to sync with latest data
      window.location.reload();
    } catch (error) {
      console.error('Refresh error:', error);
    }
  };

  const handleViewReceipt = (receipt: ReceiptType) => {
    setSelectedReceipt(receipt);
    setCurrentTab('receipt');
  };

  const handleManualInvoice = (receipt: ReceiptType) => {
    // Add manual invoice to receipts
    addManualReceipt(receipt);
    
    // View the created receipt
    setSelectedReceipt(receipt);
    setCurrentTab('receipt');
  };

  const handlePrintThermal = async (receipt: ReceiptType) => {
    try {
      // Import thermal printer and formatter
      const { thermalPrinter } = await import('@/lib/thermal-printer');
      const { formatThermalReceipt } = await import('@/lib/receipt-formatter');
      const { toast } = await import('sonner');
      
      // Try thermal printing first
      if (thermalPrinter.isConnected()) {
        const receiptText = formatThermalReceipt(receipt, formatPrice, currentStore);
        const printed = await thermalPrinter.print(receiptText);
        
        if (printed) {
          toast.success('Struk berhasil dicetak ke thermal printer!');
          return;
        }
      }
      
      // Fallback to thermal printer connection attempt
      const connected = await thermalPrinter.connect();
      if (connected) {
        const receiptText = formatThermalReceipt(receipt, formatPrice, currentStore);
        const printed = await thermalPrinter.print(receiptText);
        
        if (printed) {
          toast.success('Thermal printer terhubung dan struk berhasil dicetak!');
          return;
        }
      }
      
      // Ultimate fallback to browser printing if thermal printing fails
      toast.info('Thermal printer tidak tersedia, menggunakan printer browser...');
      handleBrowserPrint(receipt);
    } catch (error) {
      console.error('Print error:', error);
      const { toast } = await import('sonner');
      toast.error('Terjadi kesalahan saat mencetak.');
      toast.error('Thermal printer gagal, menggunakan printer browser...');
      handleBrowserPrint(receipt);
    }
  };

  const handleBrowserPrint = (receipt: ReceiptType) => {
    const storeName = currentStore?.name || 'TOKO';
    const storeAddress = currentStore?.address || '';
    const storePhone = currentStore?.phone || '';
    
    const printContent = `
===============================
   ${storeName.toUpperCase()}
===============================
${storeAddress ? storeAddress + '\n' : ''}${storePhone ? 'Telp: ' + storePhone + '\n' : ''}
Invoice: ${receipt.id}
Tanggal: ${new Date(receipt.timestamp).toLocaleDateString('id-ID')}
Waktu: ${new Date(receipt.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
-------------------------------

${receipt.items.map(item => `
${item.product.name}
${item.quantity} x ${formatPrice(item.finalPrice || item.product.sellPrice)}
${' '.repeat(31 - (item.quantity + ' x ' + formatPrice(item.finalPrice || item.product.sellPrice)).length)}${formatPrice((item.finalPrice || item.product.sellPrice) * item.quantity)}
`).join('')}

-------------------------------
Subtotal: ${' '.repeat(20)}${formatPrice(receipt.subtotal)}${receipt.discount > 0 ? `
Diskon: ${' '.repeat(22)}${formatPrice(receipt.discount)}` : ''}
TOTAL: ${' '.repeat(23)}${formatPrice(receipt.total)}

Metode: ${receipt.paymentMethod?.toUpperCase() || 'TUNAI'}
Profit: ${formatPrice(receipt.profit)}

===============================
    TERIMA KASIH ATAS
    KUNJUNGAN ANDA!
===============================
`;

    // Browser print fallback
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Receipt</title>
            <style>
              body {
                font-family: 'Courier New', monospace;
                font-size: 12px;
                line-height: 1.2;
                margin: 0;
                padding: 10px;
                white-space: pre-line;
                width: 280px;
              }
              @media print {
                body { margin: 0; }
                @page { size: 80mm auto; margin: 0; }
              }
            </style>
          </head>
          <body>${printContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  const filteredProducts = products.filter(product => {
    if (!searchTerm.trim()) return true;
    
    const searchWords = searchTerm.toLowerCase().trim().split(/\s+/);
    const productName = product.name.toLowerCase();
    const productCategory = product.category?.toLowerCase() || '';
    const productCode = product.code?.toLowerCase() || '';
    const productBarcode = product.barcode?.toLowerCase() || '';
    
    // Check if all search words are found in product name, code, barcode, or category
    return searchWords.every(word => 
      productName.includes(word) || 
      productCategory.includes(word) ||
      productCode.includes(word) ||
      productBarcode.includes(word)
    );
  });

  // Memoized calculations for dashboard statistics to improve performance and ensure reactivity
  const dashboardStats = useMemo(() => {
    const totalProducts = products.length;
    const lowStockProductsArray = products.filter(product => product.stock <= 24 && !product.isPhotocopy);
    
    const today = new Date();
    const todayString = today.toDateString();
    
    const todayReceipts = receipts.filter(receipt => {
      const receiptDate = new Date(receipt.timestamp);
      return receiptDate.toDateString() === todayString;
    });
    
    const todayRegularReceipts = todayReceipts.filter(receipt => 
      !receipt.isManual && !receipt.id.startsWith('MNL-')
    );
    
    const todayManualReceipts = todayReceipts.filter(receipt => 
      receipt.isManual || receipt.id.startsWith('MNL-')
    );
    
    const todayRevenue = todayRegularReceipts.reduce((sum, receipt) => sum + receipt.total, 0);
    const todayProfit = todayRegularReceipts.reduce((sum, receipt) => sum + receipt.profit, 0);
    const todayManualRevenue = todayManualReceipts.reduce((sum, receipt) => sum + receipt.total, 0);
    
    const todayPhotocopyEarnings = todayManualReceipts.reduce((sum, receipt) => {
      const photocopyItems = receipt.items.filter(item => 
        item.product.isPhotocopy || item.product.category === 'Fotocopy'
      );
      return sum + photocopyItems.reduce((itemSum, item) => 
        itemSum + (item.finalPrice || item.product.sellPrice) * item.quantity, 0
      );
    }, 0);
    
    return {
      totalProducts,
      lowStockProductsArray,
      todayRevenue,
      todayProfit,
      todayManualRevenue,
      todayPhotocopyEarnings
    };
  }, [products, receipts]);

  const { totalProducts, lowStockProductsArray, todayRevenue, todayProfit, todayManualRevenue, todayPhotocopyEarnings } = dashboardStats;
  const lowStockCount = lowStockProductsArray.length;

  // Welcome message based on time
  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 11) return "Selamat Pagi";
    if (hour < 15) return "Selamat Siang"; 
    if (hour < 19) return "Selamat Sore";
    return "Selamat Malam";
  };


  const handleWiFiDirectPrint = async (printerId: string, settings: any, document: File): Promise<boolean> => {
    // This function is now just a passthrough since WiFiPrinterManager handles the real printing
    return true;
  };

  const handleBarcodeScanner = async () => {
    if (!Capacitor.isNativePlatform()) {
      toast.error('Scan barcode hanya tersedia di aplikasi mobile');
      return;
    }

    try {
      setIsScanning(true);
      
      // Check permission
      const status = await BarcodeScanner.checkPermission({ force: true });
      
      if (!status.granted) {
        toast.error('Izin kamera tidak diberikan');
        setIsScanning(false);
        return;
      }

      // Make background transparent and show scanner UI
      document.body.classList.add('scanner-active');
      
      // Add scanner overlay with focus guide
      const scannerOverlay = document.createElement('div');
      scannerOverlay.id = 'scanner-overlay';
      scannerOverlay.innerHTML = `
        <style>
          #scanner-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 9999;
            background: transparent;
          }
          .scanner-controls {
            position: absolute;
            top: 20px;
            left: 0;
            right: 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 20px;
            z-index: 10001;
          }
          .scanner-btn {
            background: rgba(0, 0, 0, 0.6);
            color: white;
            border: 2px solid white;
            border-radius: 8px;
            padding: 10px 20px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            backdrop-filter: blur(10px);
          }
          .scanner-focus {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 250px;
            height: 250px;
            border: 3px solid #ff0000;
            border-radius: 12px;
            box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
            z-index: 10000;
          }
          .scanner-focus::before,
          .scanner-focus::after {
            content: '';
            position: absolute;
            width: 50px;
            height: 50px;
            border: 4px solid #ff0000;
          }
          .scanner-focus::before {
            top: -4px;
            left: -4px;
            border-right: none;
            border-bottom: none;
          }
          .scanner-focus::after {
            top: -4px;
            right: -4px;
            border-left: none;
            border-bottom: none;
          }
          .scanner-focus-bottom::before {
            content: '';
            position: absolute;
            bottom: -4px;
            left: -4px;
            width: 50px;
            height: 50px;
            border: 4px solid #ff0000;
            border-right: none;
            border-top: none;
          }
          .scanner-focus-bottom::after {
            content: '';
            position: absolute;
            bottom: -4px;
            right: -4px;
            width: 50px;
            height: 50px;
            border: 4px solid #ff0000;
            border-left: none;
            border-top: none;
          }
          .scanner-text {
            position: absolute;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            color: white;
            font-size: 18px;
            text-align: center;
            z-index: 10001;
            text-shadow: 0 2px 4px rgba(0,0,0,0.8);
            background: rgba(0, 0, 0, 0.6);
            padding: 12px 24px;
            border-radius: 8px;
            backdrop-filter: blur(10px);
          }
        </style>
        <div class="scanner-controls">
          <button id="scanner-back" class="scanner-btn">← Kembali</button>
          <button id="scanner-flash" class="scanner-btn">💡 Flash</button>
        </div>
        <div class="scanner-focus scanner-focus-bottom"></div>
        <div class="scanner-text">Arahkan kamera ke barcode</div>
      `;
      document.body.appendChild(scannerOverlay);
      
      // Handle back button
      let scanCancelled = false;
      document.getElementById('scanner-back')?.addEventListener('click', async () => {
        scanCancelled = true;
        await BarcodeScanner.stopScan();
        document.body.classList.remove('scanner-active');
        document.getElementById('scanner-overlay')?.remove();
        setIsScanning(false);
      });
      
      // Handle flash toggle
      let flashOn = false;
      document.getElementById('scanner-flash')?.addEventListener('click', async () => {
        flashOn = !flashOn;
        const btn = document.getElementById('scanner-flash');
        if (btn) {
          btn.textContent = flashOn ? '💡 Flash ON' : '💡 Flash';
          btn.style.background = flashOn ? 'rgba(59, 130, 246, 0.8)' : 'rgba(0, 0, 0, 0.6)';
        }
      });
      
      // Start scanning
      const result = await BarcodeScanner.startScan();
      
      // Remove overlay and transparency
      document.body.classList.remove('scanner-active');
      document.getElementById('scanner-overlay')?.remove();
      setIsScanning(false);

      if (!scanCancelled && result.hasContent) {
        // Search for product by barcode or code
        const foundProduct = products.find(p => 
          p.barcode?.toLowerCase() === result.content?.toLowerCase() ||
          p.code?.toLowerCase() === result.content?.toLowerCase() ||
          p.name.toLowerCase().includes(result.content?.toLowerCase() || '')
        );

        if (foundProduct) {
          if (foundProduct.isPhotocopy && currentStore?.category === 'atk') {
            handlePhotocopyClick(foundProduct);
          } else {
            addToCart(foundProduct, 1);
          }
          toast.success(`Produk "${foundProduct.name}" ditambahkan ke keranjang`);
        } else {
          toast.error(`Produk dengan kode "${result.content}" tidak ditemukan`);
        }
      }
    } catch (error) {
      console.error('Barcode scan error:', error);
      document.body.classList.remove('scanner-active');
      document.getElementById('scanner-overlay')?.remove();
      setIsScanning(false);
      toast.error('Terjadi kesalahan saat scanning');
    }
  };

  return (
    <div className="min-h-screen w-full bg-background">
      {/* Header - Fixed with safe area padding for status bar */}
      <header className="fixed top-0 z-50 border-b bg-card shadow-sm w-full">
        {/* White spacer for status bar */}
        <div className="h-12 bg-background"></div>
        <div className="w-full px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            <div 
              onClick={() => navigate('/settings', { replace: true })} 
              className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <Store className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <div>
                <div className="hidden sm:block">
                  <h1 className="text-lg sm:text-2xl font-bold">
                    Kasir POS Multi Toko
                  </h1>
                  {currentStore?.address && (
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {currentStore.address}
                    </p>
                  )}
                  <p className="text-xs sm:text-sm text-primary font-medium">
                    {getWelcomeMessage()}, {currentStore?.cashier_name || 'Admin Kasir'}
                  </p>
                </div>
                {/* Mobile compact header */}
                <div className="sm:hidden">
                  <h1 className="text-sm font-bold">
                    {currentStore?.name || 'Toko'}
                  </h1>
                  <p className="text-xs text-primary">
                    {getWelcomeMessage()}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-4">
              {/* Mobile compact version */}
              <div className="sm:hidden flex items-center gap-1">
                <Suspense fallback={<div className="h-8 w-8"></div>}>
                  <LazyBluetoothManager />
                </Suspense>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  className="h-8 w-8 p-0"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="h-8 w-8 p-0"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Desktop version */}
              <div className="hidden sm:flex items-center gap-4">
                <Suspense fallback={<div className="h-8 w-8"></div>}>
                  <LazyBluetoothManager />
                </Suspense>
                
                {/* Thermal Print Status */}
                {(lastReceipt || selectedReceipt) && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-md border">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-muted-foreground">
                      Tekan <kbd className="px-1 py-0.5 bg-muted rounded text-xs font-mono">Enter</kbd> untuk print thermal
                    </span>
                  </div>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Refresh</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </Button>
                <div className="text-right text-xs sm:text-sm">
                  <div className="font-semibold">Admin Kasir</div>
                  <div className="text-muted-foreground">
                    {new Date().toLocaleDateString('id-ID')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

        {/* Dashboard Stats with top padding for fixed header and status bar */}
      <div className="w-full px-2 sm:px-4 py-2 sm:py-4 mt-28 sm:mt-32">
        <div className="grid grid-cols-1 gap-2 sm:gap-4 mb-4 sm:mb-6">
          {/* Full width card on top */}
          <Card className="pos-card cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleDashboardClick('revenue')}>
            <CardContent className="flex items-center p-4">
              <DollarSign className="h-8 w-8 text-success mr-3" />
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Penjualan Hari Ini</p>
                <p className="text-lg sm:text-2xl font-bold">{formatPrice(todayRevenue)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Two cards side by side */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <Card className="pos-card cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleDashboardClick('profit')}>
              <CardContent className="flex items-center p-4">
                <TrendingUp className="h-8 w-8 text-primary mr-3" />
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Keuntungan Hari Ini</p>
                  <p className="text-lg sm:text-2xl font-bold">{formatPrice(todayProfit)}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="pos-card cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleDashboardClick('low-stock')}>
              <CardContent className="flex items-center p-4">
                <AlertTriangle className="h-8 w-8 text-warning mr-3" />
              <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Stok Menipis</p>
                  <p className="text-lg sm:text-2xl font-bold">{lowStockCount}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs value={currentTab} onValueChange={(value) => {
          if (value === 'admin') {
            handleAdminAction(value);
          } else {
            setCurrentTab(value);
          }
        }} className="w-full">
          <TabsList className="grid grid-cols-4 sm:flex sm:flex-wrap w-full h-auto p-1 gap-1 sm:justify-start">
            <TabsTrigger value="pos" className="text-xs px-2 py-2 sm:text-sm sm:px-3 sm:py-3 rounded-md">
              Kasir
            </TabsTrigger>
            <TabsTrigger value="quick-invoice" className="text-xs px-2 py-2 sm:text-sm sm:px-3 sm:py-3 rounded-md">
              Nota Cepat
            </TabsTrigger>
            <TabsTrigger value="shopping-list" className="text-xs px-2 py-2 sm:text-sm sm:px-3 sm:py-3 rounded-md">
              Daftar Belanja
            </TabsTrigger>
            <TabsTrigger value="stock" className="text-xs px-2 py-2 sm:text-sm sm:px-3 sm:py-3 rounded-md">
              Stok
            </TabsTrigger>
            <TabsTrigger value="low-stock" className="text-xs px-2 py-2 sm:text-sm sm:px-3 sm:py-3 rounded-md">
              Stok Menipis
            </TabsTrigger>
            <TabsTrigger value="receipt" className="text-xs px-2 py-2 sm:text-sm sm:px-3 sm:py-3 rounded-md">
              Nota
            </TabsTrigger>
            <TabsTrigger value="reports" className="text-xs px-2 py-2 sm:text-sm sm:px-3 sm:py-3 rounded-md">
              Laporan
            </TabsTrigger>
            <TabsTrigger value="admin" className="text-xs px-2 py-2 sm:text-sm sm:px-3 sm:py-3 rounded-md">
              Admin
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pos" className="space-y-2 sm:space-y-4 mt-2 sm:mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
              <div className="lg:col-span-2 space-y-2 sm:space-y-4">
                <Card className="pos-card">
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="flex items-center justify-between text-sm sm:text-base">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                        Daftar Produk
                      </div>
                      <Badge variant="secondary" className="text-xs">{filteredProducts.length} produk</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6">
                    <div className="mb-3 sm:mb-4 space-y-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 sm:top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Cari produk..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9 h-8 sm:h-10 text-sm"
                        />
                        
                        {/* Live Search Results Dropdown */}
                        {searchTerm.trim() && (
                          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {filteredProducts.slice(0, 8).map((product) => (
                              <div
                                key={product.id}
                                className="p-2 hover:bg-muted cursor-pointer border-b last:border-b-0"
                                 onClick={() => {
                                   if (product.isPhotocopy && currentStore?.category === 'atk') {
                                     handlePhotocopyClick(product);
                                   } else {
                                     addToCart(product, 1);
                                   }
                                   setSearchTerm('');
                                 }}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">{product.name}</div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                                      <span>{formatPrice(product.sellPrice)}</span>
                                      {product.category && (
                                        <Badge variant="secondary" className="text-xs">
                                          {product.category}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="ml-2">
                                    {product.stock > 0 ? (
                                      <Badge 
                                        variant={product.stock <= 10 ? "destructive" : "outline"}
                                        className="text-xs"
                                      >
                                        {product.stock}
                                      </Badge>
                                    ) : product.isPhotocopy ? (
                                      <Badge variant="secondary" className="text-xs">
                                        Service
                                      </Badge>
                                    ) : (
                                      <Badge variant="destructive" className="text-xs">
                                        Habis
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                            {filteredProducts.length === 0 && (
                              <div className="p-4 text-center text-sm text-muted-foreground">
                                Produk tidak ditemukan
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Barcode Scanner Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBarcodeScanner}
                        disabled={isScanning}
                        className="w-full h-8 sm:h-10"
                      >
                        <Scan className="h-4 w-4 mr-2" />
                        {isScanning ? 'Scanning...' : 'Scan Barcode'}
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {/* Layanan Fotocopy - only for ATK stores */}
                      {currentStore?.category === 'atk' && (
                        <PhotocopyService 
                          onAddToCart={addToCart}
                          formatPrice={formatPrice}
                        />
                      )}
                      
                      <Suspense fallback={<ComponentLoader />}>
                        <LazyProductGrid 
                          products={filteredProducts}
                          onAddToCart={addToCart}
                          onPhotocopyClick={currentStore?.category === 'atk' ? handlePhotocopyClick : undefined}
                        />
                      </Suspense>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-2 sm:space-y-4">
                <Suspense fallback={<ComponentLoader />}>
                  <LazyShoppingCart
                    cart={cart}
                    updateCartQuantity={updateCartQuantity}
                    removeFromCart={removeFromCart}
                    clearCart={clearCart}
                    processTransaction={handleProcessTransaction}
                    formatPrice={formatPrice}
                    onPrintThermal={handlePrintThermal}
                    onViewReceipt={handleViewReceipt}
                    receipts={receipts}
                    products={products}
                    onAddToCart={addToCart}
                  />
                </Suspense>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="stock" className="space-y-4">
            <Suspense fallback={<ComponentLoader />}>
              <LazyStockManagement 
                products={products}
                onUpdateProduct={updateProduct}
                onDeleteProduct={deleteProduct}
                formatPrice={formatPrice}
                showLowStockOnly={false}
                readOnly={true}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="quick-invoice" className="space-y-4">
            <Suspense fallback={<ComponentLoader />}>
              <LazyQuickInvoice 
                onCreateInvoice={handleManualInvoice}
                formatPrice={formatPrice}
                receipts={receipts}
                onPrintReceipt={handlePrintThermal}
                products={products}
                cart={cart}
                updateCartQuantity={updateCartQuantity}
                removeFromCart={removeFromCart}
                clearCart={clearCart}
                processTransaction={handleProcessTransaction}
                addToCart={addToCart}
                onViewReceipt={handleViewReceipt}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="shopping-list" className="space-y-4">
            <Suspense fallback={<ComponentLoader />}>
              <LazyShoppingList />
            </Suspense>
          </TabsContent>

          {/* Low Stock Tab */}
          <TabsContent value="low-stock" className="mt-0 space-y-4">
            <Card className="pos-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  Stok Menipis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lowStockProductsArray.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-2 text-success" />
                    <p>Tidak ada stok yang menipis</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {lowStockProductsArray.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 border rounded-md bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Stok: {product.stock} {product.category ? `• ${product.category}` : ''}
                          </p>
                        </div>
                        <Badge variant="destructive">{product.stock} tersisa</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admin" className="space-y-2 sm:space-y-4">
            <Tabs defaultValue="add-product" className="w-full">
              <TabsList className="flex flex-wrap w-full h-auto gap-1 p-1 sm:grid sm:grid-cols-3">
                <TabsTrigger value="add-product" className="flex-1 text-xs sm:text-sm px-2 py-2 sm:px-3 sm:py-3 rounded-md">
                  Tambah Produk
                </TabsTrigger>
                <TabsTrigger value="stock-management" className="flex-1 text-xs sm:text-sm px-2 py-2 sm:px-3 sm:py-3 rounded-md">
                  Kelola Stok
                </TabsTrigger>
                <TabsTrigger value="advanced-reports" className="flex-1 text-xs sm:text-sm px-2 py-2 sm:px-3 sm:py-3 rounded-md">
                  Laporan
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="add-product" className="space-y-4">
                <Suspense fallback={<ComponentLoader />}>
                  <LazyAddProductForm 
                    onAddProduct={addProduct} 
                    onUpdateProduct={updateProduct}
                    products={products}
                    onClose={() => setCurrentTab('stock-management')} 
                  />
                </Suspense>
              </TabsContent>
              
              <TabsContent value="stock-management" className="space-y-4">
                <Suspense fallback={<ComponentLoader />}>
                  <LazyStockManagement 
                    products={products}
                    onUpdateProduct={updateProduct}
                    onDeleteProduct={deleteProduct}
                    formatPrice={formatPrice}
                    showLowStockOnly={false}
                    readOnly={false}
                  />
                </Suspense>
              </TabsContent>
              
              <TabsContent value="advanced-reports" className="space-y-4">
                <Suspense fallback={<ComponentLoader />}>
                  <LazySalesReport receipts={receipts} formatPrice={formatPrice} />
                </Suspense>
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="receipt" className="space-y-4">
            <Suspense fallback={<ComponentLoader />}>
              {selectedReceipt ? (
                <LazyReceipt 
                  receipt={selectedReceipt} 
                  formatPrice={formatPrice} 
                  onBack={() => setSelectedReceipt(null)}
                />
              ) : (
                <LazyReceiptHistory 
                  receipts={receipts}
                  formatPrice={formatPrice}
                  onViewReceipt={handleViewReceipt}
                  onPrintReceipt={handlePrintThermal}
                  onBackToPOS={() => setSelectedReceipt(null)}
                />
              )}
            </Suspense>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Suspense fallback={<ComponentLoader />}>
              <LazySalesReport 
                receipts={receipts.filter(receipt => !receipt.isManual && !receipt.id.startsWith('MNL-') && !receipt.id.startsWith('QCK-'))} 
                formatPrice={formatPrice}
              />
            </Suspense>
          </TabsContent>
        </Tabs>

        {/* Admin Protection Dialog */}
        <AdminProtection
          isOpen={showAdminProtection}
          onClose={() => setShowAdminProtection(false)}
          onSuccess={handleAdminSuccess}
          title="Akses Admin Diperlukan"
          description="Masukkan kata sandi admin untuk mengakses menu admin"
        />

        {/* Photocopy Dialog - only for ATK stores */}
        {currentStore?.category === 'atk' && photocopyProduct && (
          <PhotocopyDialog
            isOpen={showPhotocopyDialog}
            onClose={() => {
              setShowPhotocopyDialog(false);
              setPhotocopyProduct(null);
            }}
            product={photocopyProduct}
            onAddToCart={addToCart}
          />
        )}
      </div>
    </div>
  );
};
