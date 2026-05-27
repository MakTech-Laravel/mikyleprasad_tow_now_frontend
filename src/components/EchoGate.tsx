// src/components/EchoGate.tsx
import { type ReactNode } from 'react';
import { EchoProvider } from '@/contexts/EchoContext';
import { useAuth } from '@/auth/useAuth'; // however you expose the token

interface EchoGateProps {
  children: ReactNode;
}

export function EchoGate({ children }: EchoGateProps) {
  const { accessToken, sessionStatus } = useAuth();
  const echoToken = sessionStatus === 'authenticated' ? accessToken : null;

  return <EchoProvider token={echoToken}>{children}</EchoProvider>;
}