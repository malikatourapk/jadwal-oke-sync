import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { thermalPrinter } from '@/lib/thermal-printer';

interface BluetoothContextType {
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<boolean>;
  disconnect: () => Promise<void>;
}

const BluetoothContext = createContext<BluetoothContextType | undefined>(undefined);

export const useBluetoothContext = () => {
  const context = useContext(BluetoothContext);
  if (!context) {
    throw new Error('useBluetoothContext must be used within a BluetoothProvider');
  }
  return context;
};

interface BluetoothProviderProps {
  children: ReactNode;
}

export const BluetoothProvider = ({ children }: BluetoothProviderProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(thermalPrinter.isConnected());
    };

    checkConnection();
    const interval = setInterval(checkConnection, 2000);
    return () => clearInterval(interval);
  }, []);

  const connect = async (): Promise<boolean> => {
    if (isConnected) return true;
    
    setIsConnecting(true);
    try {
      const success = await thermalPrinter.connect();
      setIsConnected(success);
      return success;
    } catch (error) {
      console.error('Bluetooth connection error:', error);
      setIsConnected(false);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async (): Promise<void> => {
    try {
      await thermalPrinter.disconnect();
      setIsConnected(false);
    } catch (error) {
      console.error('Bluetooth disconnect error:', error);
      throw error;
    }
  };

  return (
    <BluetoothContext.Provider value={{
      isConnected,
      isConnecting,
      connect,
      disconnect,
    }}>
      {children}
    </BluetoothContext.Provider>
  );
};