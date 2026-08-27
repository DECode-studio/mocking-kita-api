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
  username: z.string().min(1, 'Username or Email is required'),
  password: z.string().optional(),
  rememberMe: z.boolean().optional(),
});

type SignInFormValues = z.infer<typeof signInSchema>;

export function useSignIn() {
  const { isAuthenticated, login, checkAuth } = useAuthStore();
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
      const res = await login(data.username, data.password || '', data.rememberMe);
      if (res.success) {
        router.replace(ROUTES.DASHBOARD);
      } else {
        setAuthError('error' in res ? res.error : 'Invalid username or password.');
      }
    } catch (error: unknown) {
      setAuthError(getErrorMessage(error, 'Authentication failed'));
    }
  };

  const handleGoogleSso = () => {
    const width = 500;
    const height = 650;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      '/api/auth/sso',
      'GoogleWorkspaceSSO',
      `width=${width},height=${height},top=${top},left=${left},status=no,menubar=no,toolbar=no`
    );

    // Listen for completion message from popup
    const handleMessage = async (event: MessageEvent) => {
      if (event.data === 'sso-success') {
        window.removeEventListener('message', handleMessage);
        await checkAuth(); // Refetch session status
        router.replace(ROUTES.DASHBOARD);
      }
    };

    window.addEventListener('message', handleMessage);

    // Fallback: poll popup close status in case message is missed
    const interval = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(interval);
        window.removeEventListener('message', handleMessage);
        checkAuth().then(() => {
          if (useAuthStore.getState().isAuthenticated) {
            router.replace(ROUTES.DASHBOARD);
          }
        });
      }
    }, 1000);
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
    handleGoogleSso,
  };
}
