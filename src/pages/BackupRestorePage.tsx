import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BackupRestore } from '@/components/Settings/BackupRestore';

export const BackupRestorePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="w-full px-4 py-6 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* Header with back button */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Kembali</span>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Database className="h-6 w-6 sm:h-8 sm:w-8" />
              Backup & Restore Data
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Kelola cadangan data toko Anda
            </p>
          </div>
        </div>

        {/* Backup Restore Component */}
        <BackupRestore />
      </div>
    </div>
  );
};
