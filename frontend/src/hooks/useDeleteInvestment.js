import { useState } from 'react';
import { toast } from 'sonner';
import { portfolioAPI } from '../utils/api';

export const useDeleteInvestment = (onSuccess) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const handleDeleteRequest = (item) => {
    setItemToDelete(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setItemToDelete(null);
  };

  const confirmDelete = async () => {
    if (!itemToDelete?.id) return;

    const id = itemToDelete.id;
    setIsDeleting(true);
    const loadingToast = toast.loading('Deleting investment...');
    try {
      await portfolioAPI.deleteInvestment(id);
      toast.success('Investment deleted successfully', { id: loadingToast });
      closeModal();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Delete error:', err);
      let errorMessage = 'Failed to delete investment';
      
      if (err.response?.status === 404 || err.response?.status === 405) {
        errorMessage = 'Delete feature not supported by server yet.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      toast.error(errorMessage, { id: loadingToast });
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    isModalOpen,
    isDeleting,
    itemToDelete,
    handleDeleteRequest,
    confirmDelete,
    closeModal
  };
};