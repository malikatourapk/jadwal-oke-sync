import { useNavigate } from 'react-router-dom';
import { PPOBInterface } from '@/components/PPOB/PPOBInterface';

export const PPOBPage = () => {
  const navigate = useNavigate();

  return <PPOBInterface onBack={() => navigate('/dashboard')} />;
};
