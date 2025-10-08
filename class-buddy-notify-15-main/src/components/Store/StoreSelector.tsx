import { useState } from 'react';
import { Store, StoreCategory, STORE_CATEGORIES } from '@/types/store';
import { useStore } from '@/contexts/StoreContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Store as StoreIcon } from 'lucide-react';

interface StoreSelectorProps {
  onStoreSelected?: (store: Store) => void;
}

export const StoreSelector = ({ onStoreSelected }: StoreSelectorProps) => {
  const { stores, currentStore, setCurrentStore, createStore, loading } = useStore();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreCategory, setNewStoreCategory] = useState<StoreCategory>('sembako');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateStore = async () => {
    if (!newStoreName.trim()) return;

    setIsCreating(true);
    const store = await createStore(newStoreName.trim(), newStoreCategory);
    if (store) {
      setCurrentStore(store);
      setIsCreateDialogOpen(false);
      setNewStoreName('');
      setNewStoreCategory('sembako');
      onStoreSelected?.(store);
    }
    setIsCreating(false);
  };

  const handleStoreSelect = (store: Store) => {
    setCurrentStore(store);
    onStoreSelected?.(store);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Memuat data toko...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Pilih Toko</h2>
        <p className="text-muted-foreground">Pilih toko yang akan dikelola atau buat toko baru</p>
      </div>

      <div className="grid gap-4 max-w-2xl mx-auto">
        {stores.map((store) => (
          <Card 
            key={store.id} 
            className={`cursor-pointer transition-colors hover:bg-muted/50 ${
              currentStore?.id === store.id ? 'border-primary bg-primary/5' : ''
            }`}
            onClick={() => handleStoreSelect(store)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <StoreIcon className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-lg">{store.name}</CardTitle>
                  <CardDescription>
                    {STORE_CATEGORIES.find(cat => cat.value === store.category)?.label}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            {store.address && (
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">{store.address}</p>
              </CardContent>
            )}
          </Card>
        ))}

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Card className="cursor-pointer border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-colors">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Plus className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Buat Toko Baru</p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Buat Toko Baru</DialogTitle>
              <DialogDescription>
                Buat toko baru untuk memulai mengelola inventory dan penjualan
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="storeName">Nama Toko</Label>
                <Input
                  id="storeName"
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  placeholder="Masukkan nama toko"
                />
              </div>
              <div>
                <Label htmlFor="storeCategory">Kategori Toko</Label>
                <Select 
                  value={newStoreCategory} 
                  onValueChange={(value: StoreCategory) => setNewStoreCategory(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori toko" />
                  </SelectTrigger>
                  <SelectContent>
                    {STORE_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleCreateStore} 
                disabled={!newStoreName.trim() || isCreating}
                className="w-full"
              >
                {isCreating ? 'Membuat...' : 'Buat Toko'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};