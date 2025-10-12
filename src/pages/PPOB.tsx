import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Smartphone, 
  Zap, 
  Tv, 
  Wifi, 
  Droplets, 
  Car,
  CreditCard,
  Wallet,
  ArrowLeft,
  Store,
  Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const PPOB = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('pulsa');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock categories (nanti connect ke Digiflaz API)
  const categories = [
    { id: 'pulsa', name: 'Pulsa', icon: Smartphone, color: 'bg-blue-500' },
    { id: 'paket-data', name: 'Paket Data', icon: Wifi, color: 'bg-purple-500' },
    { id: 'pln', name: 'Token PLN', icon: Zap, color: 'bg-yellow-500' },
    { id: 'tv', name: 'TV Kabel', icon: Tv, color: 'bg-red-500' },
    { id: 'pdam', name: 'PDAM', icon: Droplets, color: 'bg-cyan-500' },
    { id: 'e-wallet', name: 'E-Wallet', icon: Wallet, color: 'bg-green-500' },
    { id: 'voucher', name: 'Voucher Game', icon: CreditCard, color: 'bg-pink-500' },
    { id: 'bpjs', name: 'BPJS', icon: Car, color: 'bg-orange-500' },
  ];

  const handleTransaction = (productName: string) => {
    toast.info('Fitur PPOB akan segera aktif setelah integrasi dengan Digiflaz');
  };

  return (
    <div className="min-h-screen bg-background p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">PPOB</h1>
            <p className="text-sm text-muted-foreground">Payment Point Online Bank</p>
          </div>
        </div>
        
        <Button
          variant="outline"
          onClick={() => navigate('/pos')}
        >
          <Store className="h-4 w-4 mr-2" />
          Kasir POS
        </Button>
      </div>

      {/* Coming Soon Badge */}
      <Card className="border-2 border-dashed border-primary/50 bg-primary/5">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <Badge variant="secondary" className="text-sm">
              Coming Soon - Integrasi Digiflaz
            </Badge>
            <p className="text-sm text-muted-foreground">
              Fitur PPOB akan segera tersedia setelah pendaftaran ke Digiflaz
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari produk atau layanan..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <Card
              key={category.id}
              className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
              onClick={() => setActiveTab(category.id)}
            >
              <CardContent className="pt-6 pb-4 text-center space-y-3">
                <div className={`w-16 h-16 ${category.color} rounded-2xl flex items-center justify-center mx-auto shadow-lg`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <p className="font-medium text-sm">{category.name}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Product Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 lg:grid-cols-8">
          {categories.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id} className="text-xs">
              {cat.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category.id} value={category.id} className="space-y-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <category.icon className="h-5 w-5" />
                  {category.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Mock products */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-4 pb-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{category.name} {i * 5}.000</p>
                            <p className="text-xs text-muted-foreground">
                              Rp {(i * 5000 + 500).toLocaleString('id-ID')}
                            </p>
                          </div>
                          <Button 
                            size="sm"
                            onClick={() => handleTransaction(`${category.name} ${i * 5}.000`)}
                            disabled
                          >
                            Beli
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <p>Produk akan tersedia setelah integrasi dengan Digiflaz</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
