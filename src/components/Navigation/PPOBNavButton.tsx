import { Button } from '@/components/ui/button';
import { Smartphone, Store } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const PPOBNavButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isOnPOS = location.pathname === '/pos';
  const isOnPPOB = location.pathname === '/ppob';

  if (!isOnPOS && !isOnPPOB) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => navigate(isOnPOS ? '/ppob' : '/pos')}
      className="fixed bottom-4 right-4 z-50 shadow-lg"
    >
      {isOnPOS ? (
        <>
          <Smartphone className="h-4 w-4 mr-2" />
          PPOB
        </>
      ) : (
        <>
          <Store className="h-4 w-4 mr-2" />
          Kasir POS
        </>
      )}
    </Button>
  );
};
