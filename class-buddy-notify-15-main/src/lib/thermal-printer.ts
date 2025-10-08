import { Capacitor } from '@capacitor/core';
import { BleClient, BleDevice } from '@capacitor-community/bluetooth-le';

class ThermalPrinter {
  private device: any = null;
  private characteristic: any = null;
  private isNative = false;

  async connect(): Promise<boolean> {
    try {
      this.isNative = Capacitor.isNativePlatform();
      
      if (this.isNative) {
        return await this.connectNative();
      } else {
        return await this.connectWeb();
      }
    } catch (error: any) {
      console.error('Connection failed:', error);
      
      // Handle user cancellation gracefully
      if (error.message?.includes('User cancelled') || 
          error.name === 'NotFoundError' ||
          error.message?.includes('cancel')) {
        return false;
      }
      
      throw error;
    }
  }

  private async connectNative(): Promise<boolean> {
    try {
      // Initialize BLE with proper error handling
      await BleClient.initialize();
      
      // Check if Bluetooth is enabled
      const isEnabled = await BleClient.isEnabled();
      if (!isEnabled) {
        await BleClient.enable();
      }
      
      // Request device from user with more flexible options
      const device = await BleClient.requestDevice({
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb', // Generic printer service
          '49535343-fe7d-4ae5-8fa9-9fafd205e455', // HID service
          '0000ff00-0000-1000-8000-00805f9b34fb', // Custom service
          '6e400001-b5a3-f393-e0a9-e50e24dcca9e'  // UART service
        ],
        allowDuplicates: false,
        scanMode: 1
      });

      if (!device) {
        console.log('No device selected');
        return false;
      }

      console.log('Connecting to device:', device.name || device.deviceId);
      this.device = device;
      
      // Connect with timeout
      await Promise.race([
        BleClient.connect(device.deviceId),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 10000))
      ]);
      
      console.log('Connected successfully, discovering services...');
      
      // Find writable characteristic
      const services = await BleClient.getServices(device.deviceId);
      console.log('Found services:', services.length);
      
      for (const service of services) {
        console.log('Checking service:', service.uuid);
        for (const char of service.characteristics) {
          console.log('Characteristic:', char.uuid, 'Properties:', char.properties);
          if (char.properties?.write || char.properties?.writeWithoutResponse) {
            this.characteristic = {
              serviceUuid: service.uuid,
              characteristicUuid: char.uuid
            };
            console.log('Found writable characteristic:', char.uuid);
            return true;
          }
        }
      }
      
      throw new Error('Tidak ditemukan characteristic yang bisa ditulis pada printer');
    } catch (error: any) {
      console.error('Native connection failed:', error);
      
      // Better error messages for common issues
      if (error.message?.includes('timeout')) {
        throw new Error('Koneksi timeout. Pastikan printer dalam jangkauan dan mode pairing aktif.');
      } else if (error.message?.includes('GATT_ERROR')) {
        throw new Error('Gagal terhubung ke printer. Coba restart printer dan ulangi koneksi.');
      } else if (error.message?.includes('Device not found')) {
        throw new Error('Printer tidak ditemukan. Pastikan printer menyala dan dapat ditemukan.');
      }
      
      return false;
    }
  }

  private async connectWeb(): Promise<boolean> {
    try {
      if (!navigator.bluetooth) {
        throw new Error('Web Bluetooth tidak didukung pada browser ini. Gunakan Chrome versi 56+ di Android.');
      }

      console.log('Starting Web Bluetooth connection for Android Oreo...');

      // Simplified device request for better Oreo compatibility
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb', // Generic printer service
          '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Common thermal printer service
          '0000ff00-0000-1000-8000-00805f9b34fb'  // Custom service for some printers
        ]
      });

      if (!device) {
        console.log('No device selected');
        return false;
      }

      console.log('Device selected:', device.name || device.id);
      this.device = device;

      // Add disconnect event listener
      device.addEventListener('gattserverdisconnected', () => {
        console.log('Device disconnected');
        this.device = null;
        this.characteristic = null;
      });

      console.log('Connecting to GATT server...');
      const server = await device.gatt?.connect();
      
      if (!server) {
        throw new Error('Gagal terhubung ke GATT server printer');
      }

      console.log('Connected to GATT server, discovering services...');

      // Simplified service discovery for Oreo compatibility
      let services = [];
      console.log('Discovering services compatible with Android Oreo...');
      
      // Try common thermal printer services one by one (more reliable on Oreo)
      const commonServices = [
        '000018f0-0000-1000-8000-00805f9b34fb', // Most common thermal printer service
        '49535343-fe7d-4ae5-8fa9-9fafd205e455', // HID service for some printers
        '0000ff00-0000-1000-8000-00805f9b34fb'  // Custom service
      ];
      
      for (const uuid of commonServices) {
        try {
          console.log(`Trying service: ${uuid}`);
          const service = await server.getPrimaryService(uuid);
          services.push(service);
          console.log(`Found service: ${uuid}`);
          break; // Use first working service for simplicity on Oreo
        } catch (e) {
          console.log(`Service ${uuid} not available, trying next...`);
        }
      }
      
      // Fallback: try to get all services if specific ones failed
      if (services.length === 0) {
        try {
          services = await server.getPrimaryServices();
          console.log('Using fallback: got all available services');
        } catch (fallbackError) {
          throw new Error('Tidak dapat menemukan layanan printer yang kompatibel. Pastikan printer mendukung Bluetooth LE.');
        }
      }

      console.log(`Found ${services.length} services`);

      // Find writable characteristic (optimized for Oreo)
      for (const service of services) {
        console.log('Checking service:', service.uuid);
        try {
          const characteristics = await service.getCharacteristics();
          console.log(`Service ${service.uuid} has ${characteristics.length} characteristics`);
          
          // Look for common thermal printer characteristics first
          const commonCharUuids = [
            '49535343-8841-43f4-a8d4-ecbe34729bb3', // Common write characteristic
            '0000ff01-0000-1000-8000-00805f9b34fb', // Custom write characteristic
            '6e400002-b5a3-f393-e0a9-e50e24dcca9e'  // UART write characteristic
          ];
          
          // Try common characteristics first
          for (const charUuid of commonCharUuids) {
            try {
              const char = await service.getCharacteristic(charUuid);
              if (char && (char.properties.write || char.properties.writeWithoutResponse)) {
                this.characteristic = char;
                console.log('Found known writable characteristic:', char.uuid);
                return true;
              }
            } catch (e) {
              // Characteristic not available, continue
            }
          }
          
          // Fallback: check all characteristics
          for (const char of characteristics) {
            console.log('Characteristic:', char.uuid, 'Properties:', {
              write: char.properties.write,
              writeWithoutResponse: char.properties.writeWithoutResponse
            });
            
            if (char.properties.write || char.properties.writeWithoutResponse) {
              this.characteristic = char;
              console.log('Found writable characteristic:', char.uuid);
              return true;
            }
          }
        } catch (charError) {
          console.log('Error getting characteristics for service:', service.uuid, charError);
        }
      }
      
      throw new Error('Tidak ditemukan characteristic yang bisa ditulis pada printer. Pastikan printer kompatibel dengan Bluetooth LE.');
    } catch (error: any) {
      console.error('Web connection failed:', error);
      
      // Better error handling for web
      if (error.name === 'NotFoundError') {
        throw new Error('Koneksi dibatalkan oleh pengguna atau printer tidak ditemukan');
      } else if (error.name === 'SecurityError') {
        throw new Error('Akses Bluetooth ditolak. Pastikan situs diakses via HTTPS dan izin Bluetooth diberikan.');
      } else if (error.name === 'NetworkError') {
        throw new Error('Gagal terhubung ke printer. Pastikan printer dalam jangkauan dan menyala.');
      } else if (error.message?.includes('GATT')) {
        throw new Error('Gagal terhubung ke printer. Coba restart printer dan ulangi koneksi.');
      }
      
      throw error;
    }
  }

  async print(text: string): Promise<boolean> {
    if (!this.device || !this.characteristic) {
      const connected = await this.connect();
      if (!connected) return false;
    }

    try {
      // ESC/POS commands
      const ESC = '\x1B';
      const GS = '\x1D';
      
      let commands = ESC + '@'; // Initialize
      commands += ESC + 'a' + '\x01'; // Center align
      commands += text;
      commands += '\n\n\n';
      commands += GS + 'V' + '\x42' + '\x00'; // Partial cut
      
      const encoder = new TextEncoder();
      const data = encoder.encode(commands);
      
      if (this.isNative) {
        return await this.printNative(data);
      } else {
        return await this.printWeb(data);
      }
    } catch (error) {
      console.error('Print failed:', error);
      return false;
    }
  }

  private async printNative(data: Uint8Array): Promise<boolean> {
    try {
      const chunkSize = 180;
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        await BleClient.write(
          this.device.deviceId,
          this.characteristic.serviceUuid,
          this.characteristic.characteristicUuid,
          new DataView(chunk.buffer)
        );
        
        if (i + chunkSize < data.length) {
          await new Promise(r => setTimeout(r, 50));
        }
      }
      return true;
    } catch (error) {
      console.error('Native print failed:', error);
      return false;
    }
  }

  private async printWeb(data: Uint8Array): Promise<boolean> {
    try {
      // Smaller chunk size for better Oreo compatibility
      const chunkSize = 16; // Reduced from 20 for older Android versions
      console.log(`Printing ${data.length} bytes in chunks of ${chunkSize}`);
      
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        
        // Try writeWithoutResponse first (more reliable on Oreo)
        if (this.characteristic.properties.writeWithoutResponse) {
          await this.characteristic.writeValueWithoutResponse(chunk);
        } else {
          await this.characteristic.writeValue(chunk);
        }
        
        // Longer delay for Oreo stability
        if (i + chunkSize < data.length) {
          await new Promise(r => setTimeout(r, 150)); // Increased from 100ms
        }
      }
      
      console.log('Print completed successfully');
      return true;
    } catch (error) {
      console.error('Web print failed:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.isNative && this.device) {
        await BleClient.disconnect(this.device.deviceId);
      } else if (this.device?.gatt?.connected) {
        await this.device.gatt.disconnect();
      }
    } catch (error) {
      console.warn('Disconnect warning:', error);
    }
    
    this.device = null;
    this.characteristic = null;
  }

  isConnected(): boolean {
    if (this.isNative) {
      return !!this.device && !!this.characteristic;
    } else {
      return !!this.device?.gatt?.connected && !!this.characteristic;
    }
  }

  getPlatformInfo(): string {
    return this.isNative ? `Native App (${Capacitor.getPlatform()})` : 'Web Browser';
  }
}

export const thermalPrinter = new ThermalPrinter();