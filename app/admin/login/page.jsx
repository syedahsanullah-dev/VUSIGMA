'use client';
import AuthForm from '@/components/AuthForm';

export default function AdminLoginPage() {
  return <AuthForm mode="login" role="SUPER_ADMIN" />;
}
