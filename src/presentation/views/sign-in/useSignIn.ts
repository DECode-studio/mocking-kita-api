'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/src/presentation/stores/authStore';
import { getErrorMessage } from '@/src/core/utils/error';
import { ROUTES } from '@/src/core/constants/routes';

const signInSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

type SignInFormValues = z.infer<typeof signInSchema>;

export function useSignIn() {
  const { isAuthenticated, login } = useAuthStore();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      username: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: SignInFormValues) => {
    setAuthError(null);
    try {
      const res = await login(data.username, data.password, data.rememberMe);
      if (res.success) {
        router.replace(ROUTES.DASHBOARD);
      } else {
        setAuthError('error' in res ? res.error : 'Invalid username or password.');
      }
    } catch (error: unknown) {
      setAuthError(getErrorMessage(error, 'Authentication failed'));
    }
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
  };
}
