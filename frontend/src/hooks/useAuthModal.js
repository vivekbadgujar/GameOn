import { useState } from 'react';

export const useAuthModal = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login');

  const openAuthModal = (tab = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const openLoginModal = () => openAuthModal('login');
  const openRegisterModal = () => openAuthModal('register');

  return {
    isAuthModalOpen,
    authModalTab,
    openAuthModal,
    closeAuthModal,
    openLoginModal,
    openRegisterModal
  };
};