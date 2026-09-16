'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/src/client/presentation/stores/authStore';
import { useUIStore } from '@/src/client/presentation/stores/uiStore';
import { getErrorMessage } from '@/src/core/utils/error';
import { ACCOUNT_SETTINGS_TEXT } from '../constant';

export interface UserAccountData {
  id: string;
  username: string;
  name: string;
  role: string;
  googleId: string | null;
  requiresCurrentPassword?: boolean;
}

export function useAccountSettings() {
  const { session, updateSession } = useAuthStore();
  const { addToast } = useUIStore();

  const [accountData, setAccountData] = useState<UserAccountData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);

  // Name Update Form State
  const [nameInput, setNameInput] = useState<string>('');
  const [isUpdatingName, setIsUpdatingName] = useState<boolean>(false);

  // Password Update Form State
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState<boolean>(false);

  // Fetch full user profile
  const fetchProfile = useCallback(async () => {
    setIsLoadingProfile(true);
    try {
      const res = await fetch('/api/account/profile', { credentials: 'include' });
      const json = await res.json();
      if (res.ok && json.success && json.account) {
        setAccountData(json.account);
        setNameInput(json.account.name || '');
      } else {
        throw new Error(json.error || ACCOUNT_SETTINGS_TEXT.FETCH_ERROR_TITLE);
      }
    } catch (err) {
      // Fallback to session if API fails
      if (session) {
        setAccountData({
          id: session.username,
          username: session.username,
          name: session.name,
          role: session.role,
          googleId: session.googleId || null,
        });
        setNameInput(session.name || '');
      }
      addToast({
        type: 'error',
        title: ACCOUNT_SETTINGS_TEXT.FETCH_ERROR_TITLE,
        description: getErrorMessage(err, 'Could not fetch latest profile information.'),
      });
    } finally {
      setIsLoadingProfile(false);
    }
  }, [session, addToast]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  // Handle Name Update
  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = nameInput.trim();
    if (!cleanName) {
      addToast({
        type: 'error',
        title: ACCOUNT_SETTINGS_TEXT.UPDATE_ERROR_TITLE,
        description: 'Display name cannot be empty.',
      });
      return;
    }

    setIsUpdatingName(true);
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanName }),
        credentials: 'include',
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update name');
      }

      setAccountData((prev) => (prev ? { ...prev, name: cleanName } : null));
      updateSession({ name: cleanName });

      addToast({
        type: 'success',
        title: ACCOUNT_SETTINGS_TEXT.NAME_UPDATE_SUCCESS_TITLE,
        description: ACCOUNT_SETTINGS_TEXT.NAME_UPDATE_SUCCESS_DESC,
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: ACCOUNT_SETTINGS_TEXT.UPDATE_ERROR_TITLE,
        description: getErrorMessage(err, 'Failed to update display name.'),
      });
    } finally {
      setIsUpdatingName(false);
    }
  };

  // Handle Password Update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword) {
      addToast({
        type: 'error',
        title: ACCOUNT_SETTINGS_TEXT.UPDATE_ERROR_TITLE,
        description: 'Please enter a new password.',
      });
      return;
    }

    if (newPassword.length < 6) {
      addToast({
        type: 'error',
        title: ACCOUNT_SETTINGS_TEXT.UPDATE_ERROR_TITLE,
        description: 'New password must be at least 6 characters long.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      addToast({
        type: 'error',
        title: ACCOUNT_SETTINGS_TEXT.UPDATE_ERROR_TITLE,
        description: 'New password and confirmation password do not match.',
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
        credentials: 'include',
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to change password');
      }

      setAccountData((prev) =>
        prev
          ? {
              ...prev,
              hasCustomPassword: true,
              requiresCurrentPassword: true,
            }
          : null
      );

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      addToast({
        type: 'success',
        title: ACCOUNT_SETTINGS_TEXT.PASSWORD_UPDATE_SUCCESS_TITLE,
        description: ACCOUNT_SETTINGS_TEXT.PASSWORD_UPDATE_SUCCESS_DESC,
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: ACCOUNT_SETTINGS_TEXT.UPDATE_ERROR_TITLE,
        description: getErrorMessage(err, 'Failed to update password.'),
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return {
    accountData,
    isLoadingProfile,

    // Name Update
    nameInput,
    setNameInput,
    isUpdatingName,
    handleUpdateName,

    // Password Update
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    isUpdatingPassword,
    handleUpdatePassword,
  };
}
