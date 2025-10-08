import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Network, Printer, Search, Settings, FileText, Zap, Loader2 } from 'lucide-react';
import { networkPrinter, NetworkPrinter, PrintJob } from '@/lib/network-printer';

interface PrintSettings {
  paperSize: string;
  quality: 'draft' | 'normal' | 'high';
  darkness: number;
  copies: number;
  duplex: boolean;
  collate: boolean;
}

interface WiFiPrinterManagerProps {
  onPrint: (printerId: string, settings: PrintSettings, document: File) => Promise<boolean>;
}

export const WiFiPrinterManager = ({ onPrint }: WiFiPrinterManagerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [discoveredPrinters, setDiscoveredPrinters] = useState<NetworkPrinter[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<NetworkPrinter | null>(null);
  const [document, setDocument] = useState<File | null>(null);
  const [printSettings, setPrintSettings] = useState<PrintSettings>({
    paperSize: 'A4',
    quality: 'normal',
    darkness: 50,
    copies: 1,
    duplex: false,
    collate: false
  });

  // Real network printer discovery
  const scanForPrinters = async () => {
    setIsScanning(true);
    toast({
      title: "Mencari Printer Jaringan",
      description: "Scanning jaringan WiFi/LAN untuk printer yang tersedia...",
    });

    try {
      const printers = await networkPrinter.scanForPrinters();
      setDiscoveredPrinters(printers);
      
      if (printers.length === 0) {
        toast({
          title: "Tidak Ada Printer",
          description: "Tidak ada printer ditemukan di jaringan ini",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Scan Selesai",
          description: `Ditemukan ${printers.length} printer di jaringan`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal scan printer. Pastikan perangkat terhubung ke jaringan yang sama.",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
        setDocument(file);
        toast({
          title: "File Dipilih",
          description: `${file.name} siap untuk dicetak`,
        });
      } else {
        toast({
          title: "Format Tidak Didukung",
          description: "Hanya file PDF dan gambar yang didukung",
          variant: "destructive",
        });
      }
    }
  };

  const handlePrint = async () => {
    if (!selectedPrinter || !document) {
      toast({
        title: "Error",
        description: "Pilih printer dan file terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    try {
      const printJob: PrintJob = {
        printerId: selectedPrinter.id,
        document: document,
        settings: printSettings
      };

      const success = await networkPrinter.printDocument(printJob);
      if (success) {
        toast({
          title: "Print Berhasil",
          description: `Dokumen dikirim ke ${selectedPrinter.name}`,
        });
        
        // Reset form after successful print
        setDocument(null);
        setPrintSettings({
          paperSize: 'A4',
          quality: 'normal',
          darkness: 50,
          copies: 1,
          duplex: false,
          collate: false
        });
      }
    } catch (error: any) {
      toast({
        title: "Print Gagal",
        description: error.message || "Gagal mengirim dokumen ke printer",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    // Auto scan on component mount
    scanForPrinters();
  }, []);

  return (
    <div className="space-y-4">
      {/* Network Printer Discovery */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5 text-primary" />
            Pemindaian Printer Jaringan (WiFi/LAN)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={scanForPrinters} 
            disabled={isScanning}
            className="w-full"
            variant="outline"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Memindai Jaringan...
              </>
            ) : (
              <>
                <Network className="w-4 h-4 mr-2" />
                Cari Printer di Jaringan
              </>
            )}
          </Button>

          {discoveredPrinters.length > 0 && (
            <div className="space-y-2">
              <Label>Printer Ditemukan:</Label>
              {discoveredPrinters.map((printer) => (
                <Card 
                  key={printer.id}
                  className={`cursor-pointer transition-colors ${
                    selectedPrinter?.id === printer.id ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => setSelectedPrinter(printer)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Printer className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{printer.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {printer.model} • {printer.ip}:{printer.port}
                          </div>
                        </div>
                      </div>
                      <Badge 
                        variant={printer.status === 'online' ? 'default' : 
                                printer.status === 'busy' ? 'secondary' : 'destructive'}
                      >
                        {printer.status === 'online' ? 'Siap' : 
                         printer.status === 'busy' ? 'Sibuk' : 'Offline'}
                      </Badge>
                    </div>
                    {printer.supportedFormats.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {printer.supportedFormats.map((format) => (
                          <Badge key={format} variant="outline" className="text-xs">
                            {format}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Pilih Dokumen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              className="block w-full text-sm text-muted-foreground
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-medium
                file:bg-primary/10 file:text-primary
                hover:file:bg-primary/20"
            />
            {document && (
              <div className="flex items-center gap-2 p-2 bg-secondary/20 rounded-md">
                <FileText className="h-4 w-4" />
                <span className="text-sm font-medium">{document.name}</span>
                <Badge variant="outline">{(document.size / 1024).toFixed(1)} KB</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Print Settings */}
      {selectedPrinter && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Pengaturan Cetak
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Paper Size */}
            <div className="space-y-2">
              <Label>Ukuran Kertas</Label>
              <Select value={printSettings.paperSize} onValueChange={(value) => 
                setPrintSettings(prev => ({ ...prev, paperSize: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {selectedPrinter.paperSizes.map((size) => (
                    <SelectItem key={size} value={size}>{size}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Print Quality */}
            <div className="space-y-2">
              <Label>Kualitas Cetak</Label>
              <Select value={printSettings.quality} onValueChange={(value: 'draft' | 'normal' | 'high') => 
                setPrintSettings(prev => ({ ...prev, quality: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft (Cepat)</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High Quality (Lambat)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Darkness/Intensity */}
            <div className="space-y-3">
              <Label>Kehitaman Tulisan: {printSettings.darkness}%</Label>
              <Slider
                value={[printSettings.darkness]}
                onValueChange={(value) => setPrintSettings(prev => ({ ...prev, darkness: value[0] }))}
                max={100}
                min={10}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Tipis</span>
                <span>Tebal</span>
              </div>
            </div>

            {/* Copies */}
            <div className="space-y-2">
              <Label>Jumlah Salinan</Label>
              <Select value={printSettings.copies.toString()} onValueChange={(value) => 
                setPrintSettings(prev => ({ ...prev, copies: parseInt(value) }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5,10,20,50].map((num) => (
                    <SelectItem key={num} value={num.toString()}>{num} Salinan</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Advanced Settings */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="duplex">Cetak Bolak-Balik</Label>
                <Switch
                  id="duplex"
                  checked={printSettings.duplex}
                  onCheckedChange={(checked) => setPrintSettings(prev => ({ ...prev, duplex: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="collate">Susun Berurutan</Label>
                <Switch
                  id="collate"
                  checked={printSettings.collate}
                  onCheckedChange={(checked) => setPrintSettings(prev => ({ ...prev, collate: checked }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Print Button */}
      {selectedPrinter && document && (
        <Button 
          onClick={handlePrint}
          className="w-full"
          size="lg"
        >
          <Zap className="w-4 h-4 mr-2" />
          Cetak ke {selectedPrinter.name}
        </Button>
      )}
    </div>
  );
};