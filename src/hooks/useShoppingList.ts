import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ShoppingItem {
  id: string;
  user_id: string;
  name: string;
  quantity?: number;
  unit?: string;
  current_stock?: number;
  notes?: string;
  is_completed: boolean;
  created_at: Date;
  updated_at: Date;
}

export const useShoppingList = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load shopping items
  const loadItems = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('shopping_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedItems: ShoppingItem[] = (data || []).map(item => ({
        ...item,
        created_at: new Date(item.created_at),
        updated_at: new Date(item.updated_at)
      }));

      setItems(formattedItems);
    } catch (error: any) {
      console.error('Error loading shopping items:', error);
      toast.error('Gagal memuat daftar belanja');
    } finally {
      setLoading(false);
    }
  };

  // Real-time subscription
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    loadItems();

    const realtimeChannel = supabase
      .channel(`shopping_list_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'shopping_items',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newItem: ShoppingItem = {
            ...payload.new as any,
            created_at: new Date((payload.new as any).created_at),
            updated_at: new Date((payload.new as any).updated_at)
          };
          setItems((currentItems) => [newItem, ...currentItems]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'shopping_items',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const updatedItem: ShoppingItem = {
            ...payload.new as any,
            created_at: new Date((payload.new as any).created_at),
            updated_at: new Date((payload.new as any).updated_at)
          };
          setItems((currentItems) => 
            currentItems.map((item) => 
              item.id === updatedItem.id ? updatedItem : item
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'shopping_items',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          setItems((currentItems) => 
            currentItems.filter((item) => item.id !== (payload.old as any).id)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(realtimeChannel);
    };
  }, [user]);

  const addItem = async (itemData: Omit<ShoppingItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      toast.error('Anda harus login terlebih dahulu');
      return;
    }

    try {
      const { error } = await supabase
        .from('shopping_items')
        .insert([{
          ...itemData,
          user_id: user.id
        }]);

      if (error) throw error;
      toast.success('Item berhasil ditambahkan ke daftar belanja!');
    } catch (error: any) {
      console.error('Error adding item:', error);
      toast.error('Gagal menambahkan item');
    }
  };

  const updateItem = async (id: string, updates: Partial<Omit<ShoppingItem, 'created_at' | 'updated_at'>>) => {
    try {
      const { error } = await supabase
        .from('shopping_items')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error updating item:', error);
      toast.error('Gagal memperbarui item');
    }
  };

  const removeItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('shopping_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Item dihapus dari daftar belanja');
    } catch (error: any) {
      console.error('Error removing item:', error);
      toast.error('Gagal menghapus item');
    }
  };

  const toggleComplete = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    await updateItem(id, { is_completed: !item.is_completed });
  };

  const clearCompleted = async () => {
    const completedItems = items.filter(item => item.is_completed);
    
    if (completedItems.length === 0) {
      toast.error('Tidak ada item selesai untuk dihapus');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('shopping_items')
        .delete()
        .in('id', completedItems.map(item => item.id));

      if (error) throw error;
      toast.success(`${completedItems.length} item selesai dihapus dari daftar`);
    } catch (error: any) {
      console.error('Error clearing completed items:', error);
      toast.error('Gagal menghapus item selesai');
    }
  };

  return {
    items,
    loading,
    addItem,
    updateItem,
    removeItem,
    toggleComplete,
    clearCompleted
  };
};