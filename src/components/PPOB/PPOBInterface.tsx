import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Smartphone, Wifi, Zap, Droplets, Heart, Phone, 
  Tv, Gamepad2, Wallet, ArrowLeft, Search, History 
} from 'lucide-react';
import { PPOBService, PPOBServiceType, PPOBTransaction } from '@/types/ppob';
import { formatPrice } from '@/lib/utils';

const ppobServices: PPOBService[] = [
  { id: '1', type: 'pulsa', name: 'Pulsa', icon: 'smartphone', description: 'Isi pulsa semua operator' },
  { id: '2', type: 'paket-data', name: 'Paket Data', icon: 'wifi', description: 'Paket internet semua operator' },
  { id: '3', type: 'pln-token', name: 'Token Listrik', icon: 'zap', description: 'Token PLN prabayar' },
  { id: '4', type: 'pln-postpaid', name: 'Tagihan Listrik', icon: 'zap', description: 'Bayar tagihan PLN pascabayar' },
  { id: '5', type: 'pdam', name: 'PDAM', icon: 'droplets', description: 'Bayar tagihan air PDAM' },
  { id: '6', type: 'bpjs', name: 'BPJS', icon: 'heart', description: 'Bayar iuran BPJS Kesehatan' },
  { id: '7', type: 'telkom', name: 'Telkom/IndiHome', icon: 'phone', description: 'Bayar tagihan Telkom & IndiHome' },
  { id: '8', type: 'tv-cable', name: 'TV Berlangganan', icon: 'tv', description: 'Bayar TV kabel & streaming' },
  { id: '9', type: 'game-voucher', name: 'Voucher Game', icon: 'gamepad2', description: 'Top up game & voucher' },
  { id: '10', type: 'e-wallet', name: 'E-Wallet', icon: 'wallet', description: 'Top up GoPay, OVO, Dana, dll' },
];

const getServiceIcon = (iconName: string) => {
  const icons: Record<string, any> = {
    smartphone: Smartphone,
    wifi: Wifi,
    zap: Zap,
    droplets: Droplets,
    heart: Heart,
    phone: Phone,
    tv: Tv,
    gamepad2: Gamepad2,
    wallet: Wallet,
  };
  const Icon = icons[iconName] || Smartphone;
  return <Icon className="h-6 w-6" />;
};

interface PPOBInterfaceProps {
  onBack: () => void;
}

export const PPOBInterface = ({ onBack }: PPOBInterfaceProps) => {
  const { toast } = useToast();
  const [selectedService, setSelectedService] = useState<PPOBServiceType | null>(null);
  const [customerNumber, setCustomerNumber] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [transactions, setTransactions] = useState<PPOBTransaction[]>([]);
  const [activeTab, setActiveTab] = useState('services');

  const handleServiceSelect = (serviceType: PPOBServiceType) => {
    setSelectedService(serviceType);
    setCustomerNumber('');
    setSelectedProduct('');
  };

  const handleTransaction = () => {
    // Placeholder untuk koneksi API nanti
    toast({
      title: "Fitur Dalam Pengembangan",
      description: "Koneksi ke provider PPOB (Digiflazz) akan ditambahkan setelah Anda mendaftar dan mendapatkan API key.",
      variant: "default",
    });
  };

  const renderServiceGrid = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {ppobServices.map((service) => (
        <Card 
          key={service.id}
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleServiceSelect(service.type)}
        >
          <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
            <div className="p-3 bg-primary/10 rounded-full">
              {getServiceIcon(service.icon)}
            </div>
            <div>
              <h3 className="font-semibold text-sm">{service.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{service.description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderServiceForm = () => {
    const service = ppobServices.find(s => s.type === selectedService);
    if (!service) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => setSelectedService(null)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{service.name}</h2>
            <p className="text-sm text-muted-foreground">{service.description}</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer-number">
                {selectedService === 'pulsa' || selectedService === 'paket-data' ? 'Nomor HP' :
                 selectedService === 'pln-token' ? 'ID Pelanggan PLN' :
                 selectedService === 'game-voucher' ? 'User ID' :
                 'Nomor Pelanggan'}
              </Label>
              <Input
                id="customer-number"
                placeholder="Masukkan nomor pelanggan"
                value={customerNumber}
                onChange={(e) => setCustomerNumber(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product">Pilih Produk</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger id="product">
                  <SelectValue placeholder="Pilih nominal/produk" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="demo-1">Demo Product 1 - Rp 10.000</SelectItem>
                  <SelectItem value="demo-2">Demo Product 2 - Rp 25.000</SelectItem>
                  <SelectItem value="demo-3">Demo Product 3 - Rp 50.000</SelectItem>
                  <SelectItem value="demo-4">Demo Product 4 - Rp 100.000</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Produk real akan ditampilkan setelah integrasi dengan Digiflazz
              </p>
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between mb-2">
                <span className="text-sm">Harga Produk:</span>
                <span className="text-sm font-semibold">Rp 0</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">Biaya Admin:</span>
                <span className="text-sm font-semibold">Rp 0</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>Rp 0</span>
              </div>
            </div>

            <Button 
              className="w-full" 
              size="lg"
              onClick={handleTransaction}
              disabled={!customerNumber || !selectedProduct}
            >
              Proses Transaksi
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderTransactionHistory = () => (
    <Card>
      <CardHeader>
        <CardTitle>Riwayat Transaksi PPOB</CardTitle>
        <CardDescription>Daftar transaksi PPOB Anda</CardDescription>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Belum ada transaksi PPOB</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div key={tx.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{tx.productName}</p>
                    <p className="text-sm text-muted-foreground">{tx.customerNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {tx.timestamp.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatPrice(tx.total)}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      tx.status === 'success' ? 'bg-green-100 text-green-800' :
                      tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">PPOB</h1>
              <p className="text-muted-foreground">Payment Point Online Bank</p>
            </div>
          </div>
          <TabsList>
            <TabsTrigger value="services">Layanan</TabsTrigger>
            <TabsTrigger value="history">Riwayat</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="services">
          {selectedService ? renderServiceForm() : renderServiceGrid()}
        </TabsContent>

        <TabsContent value="history">
          {renderTransactionHistory()}
        </TabsContent>
      </Tabs>
    </div>
  );
};
