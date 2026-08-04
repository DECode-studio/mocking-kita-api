'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/src/presentation/stores/authStore';

const signInSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean(),
});

export type SignInFormValues = z.infer<typeof signInSchema>;

export function useSignInViewModel() {
  const { isAuthenticated, login } = useAuthStore();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      username: 'admin',
      password: 'admin123',
      rememberMe: true,
    },
  });

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  const onSubmit = async (data: SignInFormValues) => {
    setAuthError(null);
    const res = await login(data.username, data.password, data.rememberMe);
    if (res.success) {
      router.replace('/dashboard');
      return;
    }

    setAuthError(res.error || 'Authentication failed');
  };

  const handleUseDemoAccount = () => {
    setValue('username', 'admin');
    setValue('password', 'admin123');
    setAuthError(null);
  };

  return {
    isAuthenticated,
    showPassword,
    setShowPassword,
    authError,
    register,
    handleSubmit,
    errors,
    isSubmitting,
    onSubmit,
    handleUseDemoAccount,
  };
}
