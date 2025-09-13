import { useState, useCallback } from 'react';

export interface ModalState {
  isOpen: boolean;
  data?: any;
}

export interface UseModalReturn {
  isOpen: boolean;
  data: any;
  openModal: (data?: any) => void;
  closeModal: () => void;
  toggleModal: () => void;
}

export const useModal = (initialState: boolean = false): UseModalReturn => {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: initialState,
    data: undefined
  });

  const openModal = useCallback((data?: any) => {
    setModalState({
      isOpen: true,
      data
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalState({
      isOpen: false,
      data: undefined
    });
  }, []);

  const toggleModal = useCallback(() => {
    setModalState(prev => ({
      isOpen: !prev.isOpen,
      data: prev.isOpen ? undefined : prev.data
    }));
  }, []);

  return {
    isOpen: modalState.isOpen,
    data: modalState.data,
    openModal,
    closeModal,
    toggleModal
  };
};

// Hook for managing multiple modals
export interface UseModalManagerReturn {
  modals: Record<string, ModalState>;
  openModal: (id: string, data?: any) => void;
  closeModal: (id: string) => void;
  toggleModal: (id: string) => void;
  isModalOpen: (id: string) => boolean;
  getModalData: (id: string) => any;
  closeAllModals: () => void;
}

export const useModalManager = (): UseModalManagerReturn => {
  const [modals, setModals] = useState<Record<string, ModalState>>({});

  const openModal = useCallback((id: string, data?: any) => {
    setModals(prev => ({
      ...prev,
      [id]: { isOpen: true, data }
    }));
  }, []);

  const closeModal = useCallback((id: string) => {
    setModals(prev => ({
      ...prev,
      [id]: { isOpen: false, data: undefined }
    }));
  }, []);

  const toggleModal = useCallback((id: string) => {
    setModals(prev => {
      const current = prev[id] || { isOpen: false, data: undefined };
      return {
        ...prev,
        [id]: {
          isOpen: !current.isOpen,
          data: current.isOpen ? undefined : current.data
        }
      };
    });
  }, []);

  const isModalOpen = useCallback((id: string) => {
    return modals[id]?.isOpen || false;
  }, [modals]);

  const getModalData = useCallback((id: string) => {
    return modals[id]?.data;
  }, [modals]);

  const closeAllModals = useCallback(() => {
    setModals({});
  }, []);

  return {
    modals,
    openModal,
    closeModal,
    toggleModal,
    isModalOpen,
    getModalData,
    closeAllModals
  };
};