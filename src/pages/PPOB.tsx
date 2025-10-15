import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  Plus,
  Smartphone, 
  Wifi, 
  Zap, 
  Wallet,
  CreditCard,
  Phone,
  Lightbulb,
  ShoppingBag,
  Tv,
  DollarSign
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const PPOB = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('beranda');
  const [depositAmount] = useState(0);

  // Kategori Prabayar
  const prabayarCategories = [
    { id: 'pulsa', name: 'Pulsa Seluler', icon: Smartphone },
    { id: 'paket-data', name: 'Paket Data', icon: Wifi },
    { id: 'token-listrik', name: 'Token Listrik', icon: Zap },
    { id: 'e-wallet', name: 'E-Wallet', icon: Wallet },
    { id: 'voucher', name: 'Voucher', icon: CreditCard },
  ];

  // Kategori Pascabayar
  const pascabayarCategories = [
    { id: 'telkom', name: 'Telkom', icon: Phone },
    { id: 'pln', name: 'PLN', icon: Lightbulb },
    { id: 'pulsa-pasca', name: 'Pulsa Pasca', icon: Smartphone },
    { id: 'pgn', name: 'PGN', icon: DollarSign },
    { id: 'pdam', name: 'PDAM', icon: ShoppingBag },
    { id: 'tv-kabel', name: 'TV Kabel', icon: Tv },
  ];

  const handleDeposit = () => {
    toast.info('Fitur deposit akan segera aktif');
  };

  const handleCategoryClick = (categoryId: string) => {
    toast.info(`Kategori ${categoryId} akan segera aktif setelah integrasi Digiflaz`);
  };

  return (
    <div className="min-h-screen bg-gray-50 safe-top safe-bottom">
      {/* Header iOS Style */}
      <div className="bg-white px-4 py-3 shadow-sm sticky top-0 z-10 safe-top border-b border-gray-100">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/pos')}
              className="text-primary hover:bg-gray-100 h-9 w-9 rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">PPOB</h1>
          </div>
          
          <Button
            variant="ghost"
            onClick={() => toast.info('Fitur atur harga akan segera aktif')}
            className="text-primary hover:bg-gray-100 text-sm rounded-full px-4"
          >
            Atur Harga
          </Button>
        </div>
      </div>

      {/* Tabs iOS Style */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="bg-white border-b border-gray-100 sticky top-[56px] z-10">
          <TabsList className="w-full h-12 bg-transparent rounded-none border-0 grid grid-cols-2">
            <TabsTrigger 
              value="beranda" 
              className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none font-semibold text-gray-600"
            >
              Beranda
            </TabsTrigger>
            <TabsTrigger 
              value="riwayat"
              className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none font-semibold text-gray-600"
            >
              Riwayat
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-4 space-y-4 pb-24">
          <TabsContent value="beranda" className="space-y-4 mt-0">
            {/* Deposit Card iOS Style */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-cyan-50 overflow-hidden rounded-2xl">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Saldo Deposit</p>
                    <p className="text-3xl font-bold text-gray-900">Rp {depositAmount.toLocaleString('id-ID')}</p>
                  </div>
                  <Button 
                    onClick={handleDeposit}
                    className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-sm rounded-full px-6 h-11"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Deposit
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Banner Promo iOS Style */}
            <Card className="border-0 shadow-sm overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-400 via-green-400 to-teal-400">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <h3 className="font-bold text-white text-lg">Tri EXTRA BENEFIT</h3>
                    <p className="text-sm text-white/90">Dapatkan Bonus Pulsa Nelpon Hingga</p>
                    <p className="text-lg font-bold text-yellow-300">Rp 10.000,- dan Kuota Youtube Unlimited</p>
                    <p className="text-xs text-white/80">Syarat dan Ketentuan Berlaku</p>
                  </div>
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center ml-4">
                    <Smartphone className="h-10 w-10 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Prabayar Section iOS Style */}
            <div className="space-y-3">
              <h2 className="font-bold text-lg text-gray-900 px-1">Prabayar</h2>
              <div className="grid grid-cols-4 gap-3">
                {prabayarCategories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryClick(category.id)}
                      className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all active:scale-95 border border-gray-100"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center shadow-sm">
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                      <span className="text-xs text-center font-medium text-gray-700">{category.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pascabayar Section iOS Style */}
            <div className="space-y-3">
              <h2 className="font-bold text-lg text-gray-900 px-1">Pascabayar</h2>
              <div className="grid grid-cols-4 gap-3">
                {pascabayarCategories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryClick(category.id)}
                      className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all active:scale-95 border border-gray-100"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center shadow-sm">
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                      <span className="text-xs text-center font-medium text-gray-700">{category.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Coming Soon Notice iOS Style */}
            <Card className="border border-blue-200 bg-blue-50 rounded-2xl">
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-gray-600">
                  💙 Fitur PPOB akan segera tersedia setelah integrasi dengan Digiflaz
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="riwayat" className="space-y-4 mt-0">
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardContent className="pt-16 pb-16 text-center">
                <div className="w-20 h-20 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
                  <CreditCard className="h-10 w-10 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">Belum ada riwayat transaksi</p>
                <p className="text-sm text-gray-400 mt-2">Transaksi Anda akan muncul di sini</p>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      {/* Bottom Button iOS Style */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-gray-100 safe-bottom">
        <div className="max-w-6xl mx-auto">
          <Button 
            className="w-full h-14 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg text-white font-bold text-lg rounded-2xl transition-all active:scale-95"
            onClick={() => toast.info('Fitur akan segera aktif')}
          >
            <span className="mr-2">0 Item</span>
            LANJUTKAN
          </Button>
        </div>
      </div>
    </div>
  );
};
