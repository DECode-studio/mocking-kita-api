'use client';

import React from 'react';
import { useAccountSettings } from './hook/useAccountSettings';
import { ACCOUNT_SETTINGS_TEXT, ACCOUNT_SETTINGS_SEMANTIC_ID } from './constant';
import { UserProfileCard, UpdateNameCard, UpdatePasswordCard } from './components';

export const AccountSettingsView: React.FC = () => {
  const {
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
  } = useAccountSettings();

  return (
    <div
      id={ACCOUNT_SETTINGS_SEMANTIC_ID.CONTAINER}
      className="w-full space-y-8 pb-10"
    >
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {ACCOUNT_SETTINGS_TEXT.TITLE}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {ACCOUNT_SETTINGS_TEXT.SUBTITLE}
        </p>
      </div>

      {/* User Information Profile Card */}
      <UserProfileCard account={accountData} isLoading={isLoadingProfile} />

      {/* Update Display Name Card */}
      <UpdateNameCard
        account={accountData}
        nameInput={nameInput}
        onNameChange={setNameInput}
        isSubmitting={isUpdatingName}
        onSubmit={handleUpdateName}
      />

      {/* Change Password Card */}
      <UpdatePasswordCard
        currentPasswordInput={currentPassword}
        onCurrentPasswordChange={setCurrentPassword}
        newPasswordInput={newPassword}
        onNewPasswordChange={setNewPassword}
        confirmPasswordInput={confirmPassword}
        onConfirmPasswordChange={setConfirmPassword}
        isSubmitting={isUpdatingPassword}
        onSubmit={handleUpdatePassword}
      />
    </div>
  );
};

export default AccountSettingsView;
