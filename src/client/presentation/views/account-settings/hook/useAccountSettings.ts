'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthStore } from '@/src/client/presentation/stores/authStore';
import { useUIStore } from '@/src/client/presentation/stores/uiStore';
import { getErrorMessage } from '@/src/core/utils/error';
import { getService, CLIENT_DI_TOKENS } from '@/src/core/di';
import { AccountProfile } from '@/src/client/domain/account/entity/account';
import { AccountUseCase } from '@/src/client/domain/account/usecase/account_usecase';
import { ACCOUNT_SETTINGS_TEXT } from '../constant';




export type UserAccountData = AccountProfile;

export function useAccountSettings(customAccountUseCase?: AccountUseCase) {
  const { session, updateSession } = useAuthStore();
  const { addToast } = useUIStore();

  const accountUseCase = useMemo(
    () => customAccountUseCase || getService(CLIENT_DI_TOKENS.accountUseCase),
    [customAccountUseCase]
  );

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
      const profile = await accountUseCase.getProfile();
      setAccountData(profile);
      setNameInput(profile.name || '');
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
  }, [accountUseCase, session, addToast]);

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
      const { account } = await accountUseCase.updateProfile({ name: cleanName });

      setAccountData((prev) => (prev ? { ...prev, name: cleanName } : account));
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
      await accountUseCase.updateProfile({
        currentPassword,
        newPassword,
      });

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

