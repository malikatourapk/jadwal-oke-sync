import { CapacitorHttp } from '@capacitor/core';
import { Network } from '@capacitor/network';

export interface NetworkPrinter {
  id: string;
  name: string;
  ip: string;
  model: string;
  status: 'online' | 'offline' | 'busy';
  port: number;
  supportedFormats: string[];
  paperSizes: string[];
}

export interface PrintJob {
  printerId: string;
  document: File;
  settings: {
    paperSize: string;
    quality: string;
    darkness: number;
    copies: number;
    duplex: boolean;
    collate: boolean;
  };
}

class NetworkPrinterManager {
  private discoveredPrinters: NetworkPrinter[] = [];
  private scanInProgress = false;

  async getNetworkInfo() {
    try {
      const status = await Network.getStatus();
      return {
        connected: status.connected,
        connectionType: status.connectionType,
        ssid: (status as any).ssid || 'Unknown'
      };
    } catch (error) {
      console.error('Error getting network info:', error);
      return null;
    }
  }

  async scanForPrinters(): Promise<NetworkPrinter[]> {
    if (this.scanInProgress) {
      return this.discoveredPrinters;
    }

    this.scanInProgress = true;
    this.discoveredPrinters = [];

    try {
      const networkInfo = await this.getNetworkInfo();
      if (!networkInfo?.connected) {
        throw new Error('Tidak terhubung ke jaringan');
      }

      console.log('Memindai printer di jaringan...');
      
      // Scan common printer IP ranges and ports
      const baseIPs = this.generateIPRange();
      const commonPorts = [9100, 515, 631, 80, 443]; // IPP, LPR/LPD, HTTP/HTTPS ports
      
      const scanPromises = baseIPs.flatMap(ip => 
        commonPorts.map(port => this.checkPrinterAtAddress(ip, port))
      );

      // Execute scans in batches to avoid overwhelming the network
      const batchSize = 20;
      for (let i = 0; i < scanPromises.length; i += batchSize) {
        const batch = scanPromises.slice(i, i + batchSize);
        await Promise.allSettled(batch);
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`Ditemukan ${this.discoveredPrinters.length} printer`);
      return this.discoveredPrinters;

    } catch (error) {
      console.error('Error scanning for printers:', error);
      throw error;
    } finally {
      this.scanInProgress = false;
    }
  }

  private generateIPRange(): string[] {
    // Generate common local network IP ranges
    const ranges = [
      '192.168.1', '192.168.0', '192.168.100',
      '10.0.0', '10.0.1', '172.16.1'
    ];
    
    const ips: string[] = [];
    ranges.forEach(range => {
      for (let i = 1; i <= 254; i++) {
        ips.push(`${range}.${i}`);
      }
    });
    
    return ips;
  }

  private async checkPrinterAtAddress(ip: string, port: number): Promise<void> {
    try {
      // Try to connect to printer port
      const timeout = 2000; // 2 second timeout
      
      // For HTTP-based printers (IPP, web interface)
      if (port === 631 || port === 80 || port === 443) {
        const protocol = port === 443 ? 'https' : 'http';
        const url = `${protocol}://${ip}:${port}/`;
        
        try {
          const response = await CapacitorHttp.get({
            url,
            connectTimeout: timeout,
            readTimeout: timeout,
            headers: {}
          });

          if (response.status === 200 || response.status === 401) {
            await this.identifyPrinter(ip, port, response.data);
          }
        } catch (error) {
          // Silently fail - not all IPs will have printers
        }
      }
      
      // For raw socket printers (port 9100)
      if (port === 9100) {
        try {
          // Send a basic printer status command
          await this.sendRawPrinterCommand(ip, port, '\x1B@'); // ESC @ (initialize printer)
          await this.identifyPrinter(ip, port, '');
        } catch (error) {
          // Silently fail
        }
      }

    } catch (error) {
      // Silently fail for scanning
    }
  }

  private async sendRawPrinterCommand(ip: string, port: number, command: string): Promise<string> {
    // This is a simplified implementation
    // In a real app, you'd need a native plugin to handle raw socket connections
    try {
      const response = await CapacitorHttp.post({
        url: `http://${ip}:${port}/`,
        headers: {
          'Content-Type': 'application/octet-stream'
        },
        data: command
      });
      return response.data || '';
    } catch (error) {
      throw new Error(`Failed to communicate with printer at ${ip}:${port}`);
    }
  }

  private async identifyPrinter(ip: string, port: number, responseData: string): Promise<void> {
    let printerName = 'Unknown Printer';
    let model = 'Unknown Model';
    
    // Try to extract printer information from response
    if (responseData) {
      const lowercaseData = responseData.toLowerCase();
      
      // Common printer manufacturers
      if (lowercaseData.includes('canon')) {
        printerName = 'Canon Printer';
        model = 'Canon Business';
      } else if (lowercaseData.includes('hp') || lowercaseData.includes('hewlett')) {
        printerName = 'HP Printer';
        model = 'HP LaserJet';
      } else if (lowercaseData.includes('epson')) {
        printerName = 'Epson Printer';
        model = 'Epson WorkForce';
      } else if (lowercaseData.includes('brother')) {
        printerName = 'Brother Printer';
        model = 'Brother HL';
      }
    }

    const printer: NetworkPrinter = {
      id: `${ip}:${port}`,
      name: `${printerName} (${ip})`,
      ip,
      model,
      status: 'online',
      port,
      supportedFormats: ['PDF', 'JPEG', 'PNG'],
      paperSizes: ['A4', 'A3', 'Letter', 'Legal', 'F4']
    };

    // Avoid duplicates
    if (!this.discoveredPrinters.some(p => p.id === printer.id)) {
      this.discoveredPrinters.push(printer);
    }
  }

  async printDocument(job: PrintJob): Promise<boolean> {
    try {
      const printer = this.discoveredPrinters.find(p => p.id === job.printerId);
      if (!printer) {
        throw new Error('Printer tidak ditemukan');
      }

      console.log(`Mengirim dokumen ke ${printer.name}...`);

      // Convert file to appropriate format for printing
      const printData = await this.preparePrintData(job.document, job.settings);
      
      // Send to printer based on port type
      if (printer.port === 9100) {
        // Raw printing
        await this.sendRawPrintJob(printer.ip, printer.port, printData, job.settings);
      } else {
        // IPP or HTTP printing
        await this.sendIPPPrintJob(printer.ip, printer.port, printData, job.settings);
      }

      console.log('Dokumen berhasil dikirim ke printer');
      return true;

    } catch (error) {
      console.error('Error printing document:', error);
      throw error;
    }
  }

  private async preparePrintData(file: File, settings: any): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const result = reader.result as string;
        
        if (file.type === 'application/pdf') {
          // For PDF files, we'd need to convert to PostScript or raw printer commands
          // This is a simplified implementation
          resolve(result);
        } else if (file.type.startsWith('image/')) {
          // For images, convert to ESC/POS commands
          const escPosCommands = this.convertImageToESCPOS(result, settings);
          resolve(escPosCommands);
        } else {
          // For text files
          const textCommands = this.convertTextToESCPOS(result, settings);
          resolve(textCommands);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      
      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });
  }

  private convertImageToESCPOS(imageData: string, settings: any): string {
    // ESC/POS commands for image printing
    let commands = '\x1B@'; // Initialize printer
    commands += '\x1Bt\x10'; // Select character table
    
    // Set paper size based on settings
    if (settings.paperSize === 'A4') {
      commands += '\x1D(C\x02\x00\x30\x00'; // Set page length for A4
    }
    
    // Set print quality/darkness
    const darkness = Math.floor(settings.darkness * 8 / 100);
    commands += `\x1D\x7C${String.fromCharCode(darkness)}`; // Set density
    
    // Image data would be processed here
    // This is a simplified implementation
    commands += '\x1Dv0\x00'; // Print raster bitmap
    
    // Multiple copies
    for (let i = 1; i < settings.copies; i++) {
      commands += '\x0C'; // Form feed for next copy
    }
    
    commands += '\x1D\x56\x00'; // Cut paper
    
    return commands;
  }

  private convertTextToESCPOS(text: string, settings: any): string {
    let commands = '\x1B@'; // Initialize printer
    commands += '\x1Ba\x01'; // Center align
    
    // Set darkness
    const darkness = Math.floor(settings.darkness * 8 / 100);
    commands += `\x1D\x7C${String.fromCharCode(darkness)}`;
    
    commands += text;
    commands += '\x0A\x0A\x0A'; // Line feeds
    
    // Multiple copies
    for (let i = 1; i < settings.copies; i++) {
      commands += text + '\x0A\x0A\x0A';
    }
    
    commands += '\x1D\x56\x00'; // Cut paper
    
    return commands;
  }

  private async sendRawPrintJob(ip: string, port: number, data: string, settings: any): Promise<void> {
    try {
      await CapacitorHttp.post({
        url: `http://${ip}:${port}/`,
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Length': data.length.toString()
        },
        data
      });
    } catch (error) {
      throw new Error(`Failed to send print job to ${ip}:${port}`);
    }
  }

  private async sendIPPPrintJob(ip: string, port: number, data: string, settings: any): Promise<void> {
    // IPP (Internet Printing Protocol) implementation
    const ippUrl = port === 631 ? `http://${ip}:631/printers/` : `http://${ip}/ipp/print`;
    
    try {
      await CapacitorHttp.post({
        url: ippUrl,
        headers: {
          'Content-Type': 'application/ipp',
          'Content-Length': data.length.toString()
        },
        data
      });
    } catch (error) {
      throw new Error(`Failed to send IPP print job to ${ip}`);
    }
  }

  getDiscoveredPrinters(): NetworkPrinter[] {
    return [...this.discoveredPrinters];
  }

  isScanning(): boolean {
    return this.scanInProgress;
  }
}

export const networkPrinter = new NetworkPrinterManager();