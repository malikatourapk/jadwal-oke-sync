import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Store, StoreCategory } from '@/types/store';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface StoreContextType {
  stores: Store[];
  currentStore: Store | null;
  setCurrentStore: (store: Store | null) => void;
  createStore: (name: string, category: StoreCategory) => Promise<Store | null>;
  updateStore: (storeId: string, updates: Partial<Store>) => Promise<boolean>;
  deleteStore: (storeId: string) => Promise<boolean>;
  loading: boolean;
  refreshStores: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stores, setStores] = useState<Store[]>([]);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStores = async () => {
    if (!user) {
      setStores([]);
      setCurrentStore(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setStores(data || []);
      
      // Set first store as current if none selected
      if (!currentStore && data && data.length > 0) {
        setCurrentStore(data[0]);
      }
    } catch (error) {
      console.error('Error loading stores:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data toko',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createStore = async (name: string, category: StoreCategory): Promise<Store | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('stores')
        .insert({
          name,
          category,
          owner_id: user.id,
          cashier_name: user.email?.split('@')[0] || 'Kasir',
        })
        .select()
        .single();

      if (error) throw error;

      setStores(prev => [...prev, data]);
      toast({
        title: 'Sukses',
        description: 'Toko berhasil dibuat',
      });
      
      return data;
    } catch (error) {
      console.error('Error creating store:', error);
      toast({
        title: 'Error',
        description: 'Gagal membuat toko',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateStore = async (storeId: string, updates: Partial<Store>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('stores')
        .update(updates)
        .eq('id', storeId);

      if (error) throw error;

      setStores(prev => prev.map(store => 
        store.id === storeId ? { ...store, ...updates } : store
      ));
      
      if (currentStore?.id === storeId) {
        setCurrentStore(prev => prev ? { ...prev, ...updates } : null);
      }

      toast({
        title: 'Sukses',
        description: 'Data toko berhasil diperbarui',
      });
      
      return true;
    } catch (error) {
      console.error('Error updating store:', error);
      toast({
        title: 'Error',
        description: 'Gagal memperbarui data toko',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteStore = async (storeId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', storeId);

      if (error) throw error;

      setStores(prev => prev.filter(store => store.id !== storeId));
      
      if (currentStore?.id === storeId) {
        const remainingStores = stores.filter(store => store.id !== storeId);
        setCurrentStore(remainingStores.length > 0 ? remainingStores[0] : null);
      }

      toast({
        title: 'Sukses',
        description: 'Toko berhasil dihapus',
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting store:', error);
      toast({
        title: 'Error',
        description: 'Gagal menghapus toko',
        variant: 'destructive',
      });
      return false;
    }
  };

  const refreshStores = async () => {
    await loadStores();
  };

  useEffect(() => {
    loadStores();
  }, [user]);

  const contextValue = {
    stores,
    currentStore,
    setCurrentStore,
    createStore,
    updateStore,
    deleteStore,
    loading,
    refreshStores,
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};