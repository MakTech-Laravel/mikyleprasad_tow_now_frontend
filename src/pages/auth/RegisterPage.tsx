import { Navigate, useSearchParams } from 'react-router-dom';

import DriverRegisterPage from '@/pages/auth/DriverRegisterPage';

import UserRegisterPage from './UserRegisterPage';

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role');

  if (role === 'driver') {
    return <DriverRegisterPage />;
  }

  if (role === 'user') {
    return <UserRegisterPage />;
  }

  return <Navigate to="/select-operator" replace />;
}
