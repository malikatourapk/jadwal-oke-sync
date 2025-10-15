import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Receipt as ReceiptIcon, Search, Scan } from 'lucide-react';
import { Product } from '@/types/pos';
import { useState, useRef, useEffect } from 'react';
import { ShoppingCart } from './ShoppingCart';
import { CartItem, Receipt } from '@/types/pos';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface QuickInvoiceProps {
  onCreateInvoice: (receipt: Receipt) => void;
  formatPrice: (price: number) => string;
  receipts: Receipt[];
  onPrintReceipt?: (receipt: Receipt) => void;
  products: Product[];
  cart: CartItem[];
  updateCartQuantity: (productId: string, quantity: number, finalPrice?: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  processTransaction: (paymentMethod?: string, discount?: number) => Promise<Receipt | null>;
  addToCart: (product: Product, quantity?: number, customPrice?: number) => void;
  onViewReceipt: (receipt: Receipt) => void;
}

export const QuickInvoice = ({ 
  formatPrice,
  products,
  cart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  processTransaction,
  addToCart,
  receipts,
  onPrintReceipt,
  onViewReceipt
}: QuickInvoiceProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [showQuantityDialog, setShowQuantityDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantityInput, setQuantityInput] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);

  // Filter products based on search
  const filteredProducts = products.filter(p => {
    const search = searchTerm.toLowerCase();
    return p.name.toLowerCase().includes(search) || 
           p.code?.toLowerCase().includes(search) ||
           p.barcode?.toLowerCase().includes(search);
  });

  useEffect(() => {
    // Auto-focus search input with safety check
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const handleProductSelect = (product: Product) => {
    // Check if product has stock (except for photocopy services)
    if (!product.isPhotocopy && product.stock <= 0) {
      toast.error(`Produk "${product.name}" tidak tersedia (stok habis)`);
      return;
    }
    
    setSelectedProduct(product);
    setQuantityInput('');
    setShowQuantityDialog(true);
  };

  const handleQuantityConfirm = () => {
    if (selectedProduct) {
      const qty = parseInt(quantityInput) || 1;
      
      // Validate stock (except for photocopy services)
      if (!selectedProduct.isPhotocopy && qty > selectedProduct.stock) {
        toast.error(`Stok tidak mencukupi! Tersedia: ${selectedProduct.stock}, Diminta: ${qty}`);
        return;
      }
      
      if (qty <= 0) {
        toast.error('Jumlah harus lebih dari 0');
        return;
      }
      
      addToCart(selectedProduct, qty);
      setShowQuantityDialog(false);
      setSelectedProduct(null);
      setQuantityInput('');
      setSearchTerm('');
      searchInputRef.current?.focus();
    }
  };

  useEffect(() => {
    if (showQuantityDialog && quantityInputRef.current) {
      setTimeout(() => {
        quantityInputRef.current?.focus();
        quantityInputRef.current?.select();
      }, 100);
    }
  }, [showQuantityDialog]);

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

      // Make background transparent
      document.body.classList.add('scanner-active');
      
      // Add scanner overlay with back button, flash toggle, and focus line
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
          <button id="scanner-back-btn" class="scanner-btn">← Kembali</button>
          <button id="scanner-flash-btn" class="scanner-btn">💡 Flash</button>
        </div>
        <div class="scanner-focus scanner-focus-bottom"></div>
        <div class="scanner-text">Arahkan kamera ke barcode</div>
      `;
      document.body.appendChild(scannerOverlay);

      let scanCancelled = false;
      let flashEnabled = false;

      // Back button handler
      document.getElementById('scanner-back-btn')?.addEventListener('click', async () => {
        scanCancelled = true;
        await BarcodeScanner.stopScan();
        document.body.classList.remove('scanner-active');
        document.getElementById('scanner-overlay')?.remove();
        setIsScanning(false);
      });

      // Flash button handler
      document.getElementById('scanner-flash-btn')?.addEventListener('click', async () => {
        flashEnabled = !flashEnabled;
        const flashBtn = document.getElementById('scanner-flash-btn');
        if (flashBtn) {
          flashBtn.textContent = flashEnabled ? '💡 Flash ON' : '💡 Flash';
          flashBtn.style.background = flashEnabled ? 'rgba(59, 130, 246, 0.8)' : 'rgba(0, 0, 0, 0.6)';
        }
      });
      
      // Start scanning
      const result = await BarcodeScanner.startScan();
      
      // Remove transparency
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
          addToCart(foundProduct, 1);
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
    <>
      <Dialog open={showQuantityDialog} onOpenChange={setShowQuantityDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Masukkan Jumlah</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Produk</Label>
              <p className="text-sm text-muted-foreground mt-1">{selectedProduct?.name}</p>
            </div>
            <div>
              <Label htmlFor="quantity-input" className="text-sm font-medium">
                Jumlah
              </Label>
              <Input
                ref={quantityInputRef}
                id="quantity-input"
                type="number"
                value={quantityInput}
                onChange={(e) => setQuantityInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleQuantityConfirm();
                  }
                }}
                placeholder="0"
                className="mt-1"
                min="1"
                inputMode="numeric"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuantityDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleQuantityConfirm}>
              Tambahkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Search - Simplified for quick entry */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <ReceiptIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              Nota Cepat - Cari Produk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="search" className="text-xs sm:text-sm">Cari Produk (Nama/Kode/Barcode)</Label>
                <Button
                  variant="outline"
                  onClick={handleBarcodeScanner}
                  disabled={isScanning}
                  className="w-full h-10 mb-2"
                >
                  <Scan className="h-4 w-4 mr-2" />
                  {isScanning ? 'Sedang Scanning...' : 'Scan Barcode'}
                </Button>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Ketik nama, kode, atau barcode produk..."
                    className="pl-9 h-10 text-sm"
                  />
                </div>
              </div>

              {/* Live Search Results */}
              {searchTerm && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredProducts.slice(0, 10).map(product => (
                    <div
                      key={product.id}
                      className="p-3 border rounded-md cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => handleProductSelect(product)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{product.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {product.code && `Kode: ${product.code} | `}
                            Harga: {formatPrice(product.sellPrice)} | Stok: {product.stock}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredProducts.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Produk tidak ditemukan
                    </div>
                  )}
                </div>
              )}

              {!searchTerm && (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p>Ketik untuk mencari produk dan mulai membuat nota cepat</p>
                  <p className="text-xs mt-2">Sistem sama dengan Kasir, tapi tanpa tampilan produk</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shopping Cart - Reuse the same cart component */}
      <div>
        <ShoppingCart
          cart={cart}
          updateCartQuantity={updateCartQuantity}
          removeFromCart={removeFromCart}
          clearCart={clearCart}
          processTransaction={processTransaction}
          formatPrice={formatPrice}
          onPrintThermal={onPrintReceipt}
          onViewReceipt={onViewReceipt}
          receipts={receipts}
          products={products}
          onAddToCart={addToCart}
        />
      </div>
    </div>
    </>
  );
};
