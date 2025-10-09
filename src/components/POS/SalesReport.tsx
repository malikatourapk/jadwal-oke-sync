import { useState } from 'react';
import { Receipt } from '@/types/pos';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FileText, TrendingUp, DollarSign, Package, MessageCircle } from 'lucide-react';
import { format, subDays, subWeeks, subMonths, subYears, startOfDay, endOfDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { printA4Report, generateA4PrintContent } from './SalesReportPrint';
import { useStore } from '@/contexts/StoreContext';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface SalesReportProps {
  receipts: Receipt[];
  formatPrice: (price: number) => string;
}

type ReportPeriod = '1d' | '7d' | '30d' | '60d' | '365d';

export const SalesReport = ({ receipts, formatPrice }: SalesReportProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('1d');
  const { currentStore } = useStore();

  const getDateRange = (period: ReportPeriod) => {
    const now = new Date();
    const today = startOfDay(now);
    
    switch (period) {
      case '1d':
        return { start: today, end: endOfDay(now) };
      case '7d':
        return { start: subDays(today, 6), end: endOfDay(now) };
      case '30d':
        return { start: subDays(today, 29), end: endOfDay(now) };
      case '60d':
        return { start: subDays(today, 59), end: endOfDay(now) };
      case '365d':
        return { start: subDays(today, 364), end: endOfDay(now) };
      default:
        return { start: today, end: endOfDay(now) };
    }
  };

  const getPeriodLabel = (period: ReportPeriod) => {
    switch (period) {
      case '1d': return 'Hari Ini';
      case '7d': return '7 Hari Terakhir';
      case '30d': return '30 Hari Terakhir';
      case '60d': return '60 Hari Terakhir';
      case '365d': return '1 Tahun Terakhir';
      default: return 'Hari Ini';
    }
  };

  const { start, end } = getDateRange(selectedPeriod);
  
  const filteredReceipts = receipts.filter(receipt => {
    const receiptDate = new Date(receipt.timestamp);
    return receiptDate >= start && receiptDate <= end;
  });

  const stats = {
    totalSales: filteredReceipts.reduce((sum, receipt) => sum + receipt.total, 0),
    totalProfit: filteredReceipts.reduce((sum, receipt) => sum + receipt.profit, 0),
    totalDiscount: filteredReceipts.reduce((sum, receipt) => sum + receipt.discount, 0),
    totalTransactions: filteredReceipts.length,
    totalItems: filteredReceipts.reduce((sum, receipt) => 
      sum + receipt.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    ),
  };

  const handlePrint = () => {
    printA4Report({
      receipts: filteredReceipts,
      formatPrice,
      periodLabel: getPeriodLabel(selectedPeriod),
      startDate: start,
      endDate: end,
      stats,
      storeName: currentStore?.name || 'Toko',
      storeAddress: currentStore?.address || ''
    });
  };

  const handleWhatsAppPDF = async () => {
    try {
      toast.info('Membuat PDF...');
      
      // Generate HTML content
      const htmlContent = generateA4PrintContent({
        receipts: filteredReceipts,
        formatPrice,
        periodLabel: getPeriodLabel(selectedPeriod),
        startDate: start,
        endDate: end,
        stats,
        storeName: currentStore?.name || 'Toko',
        storeAddress: currentStore?.address || ''
      });
      
      // Create temporary container
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '210mm'; // A4 width
      document.body.appendChild(tempDiv);
      
      // Wait for rendering
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Capture as canvas
      const canvas = await html2canvas(tempDiv.querySelector('.container') || tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        width: 794, // A4 width in pixels at 96 DPI
        windowWidth: 794
      });
      
      // Remove temp div
      document.body.removeChild(tempDiv);
      
      // Create PDF with proper pagination
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pageWidth - (margin * 2);
      const contentHeight = pageHeight - (margin * 2);
      
      // Calculate how many pages we need
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const totalPages = Math.ceil(imgHeight / contentHeight);
      
      // Add pages with proper content slicing
      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          pdf.addPage();
        }
        
        const yOffset = -(page * contentHeight * canvas.width / imgWidth);
        
        pdf.addImage(
          imgData, 
          'PNG', 
          margin, 
          page === 0 ? margin : margin + yOffset, 
          imgWidth, 
          imgHeight
        );
      }
      
      // Generate filename
      const filename = `Laporan-${getPeriodLabel(selectedPeriod)}-${format(new Date(), 'ddMMyyyy')}.pdf`;
      
      // Save PDF
      pdf.save(filename);
      
      // Get WhatsApp number
      const whatsappNumber = (currentStore as any)?.whatsapp_report_number || (currentStore as any)?.whatsapp_number || '';
      
      if (whatsappNumber) {
        // Create message
        const message = `📊 *LAPORAN PENJUALAN*
${currentStore?.name || 'Toko'}

📅 Periode: ${getPeriodLabel(selectedPeriod)}
${format(start, 'dd MMM yyyy', { locale: id })} - ${format(end, 'dd MMM yyyy', { locale: id })}

💰 Total Penjualan: ${formatPrice(stats.totalSales)}
📈 Total Profit: ${formatPrice(stats.totalProfit)}
🧾 Transaksi: ${stats.totalTransactions}
📦 Barang Terjual: ${stats.totalItems}

_File PDF telah didownload. Silakan kirim file tersebut melalui chat ini._`;
        
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodedMessage}`;
        
        window.open(whatsappUrl, '_blank');
        toast.success('PDF telah didownload!', {
          description: 'Kirim file PDF melalui WhatsApp yang sudah terbuka'
        });
      } else {
        toast.success('PDF berhasil didownload!');
        toast.info('Atur nomor WhatsApp di Pengaturan Toko untuk mengirim langsung');
      }
      
    } catch (error) {
      console.error('Error creating PDF:', error);
      toast.error('Gagal membuat PDF');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-bold">Laporan Penjualan</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={handlePrint} variant="outline" className="w-full sm:w-auto">
            <FileText className="w-4 h-4 mr-2" />
            Cetak Laporan
          </Button>
          <Button onClick={handleWhatsAppPDF} variant="default" className="w-full sm:w-auto">
            <MessageCircle className="w-4 h-4 mr-2" />
            Kirim via WhatsApp
          </Button>
          <Select value={selectedPeriod} onValueChange={(value: ReportPeriod) => setSelectedPeriod(value)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Hari Ini</SelectItem>
              <SelectItem value="7d">7 Hari Terakhir</SelectItem>
              <SelectItem value="30d">30 Hari Terakhir</SelectItem>
              <SelectItem value="60d">60 Hari Terakhir</SelectItem>
              <SelectItem value="365d">1 Tahun Terakhir</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Penjualan</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatPrice(stats.totalSales)}</div>
            <p className="text-xs text-muted-foreground">{getPeriodLabel(selectedPeriod)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Keuntungan</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatPrice(stats.totalProfit)}</div>
            <p className="text-xs text-muted-foreground">{getPeriodLabel(selectedPeriod)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">{getPeriodLabel(selectedPeriod)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Item</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
            <p className="text-xs text-muted-foreground">{getPeriodLabel(selectedPeriod)}</p>
          </CardContent>
        </Card>
      </div>

      {stats.totalDiscount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Diskon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-destructive">{formatPrice(stats.totalDiscount)}</div>
            <p className="text-sm text-muted-foreground">Diskon yang diberikan dalam periode ini</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Detail Transaksi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredReceipts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Tidak ada transaksi dalam periode {getPeriodLabel(selectedPeriod).toLowerCase()}
              </p>
            ) : (
              filteredReceipts.map(receipt => (
                <div key={receipt.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{receipt.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(receipt.timestamp), 'dd MMM yyyy, HH:mm', { locale: id })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatPrice(receipt.total)}</p>
                      <p className="text-sm text-success">+{formatPrice(receipt.profit)}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {receipt.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.product.name} x{item.quantity}</span>
                        <span>{formatPrice((item.finalPrice || item.product.sellPrice) * item.quantity)}</span>
                      </div>
                    ))}
                    {receipt.discount > 0 && (
                      <div className="flex justify-between text-sm text-destructive">
                        <span>Diskon</span>
                        <span>-{formatPrice(receipt.discount)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};