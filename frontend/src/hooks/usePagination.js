import { useState, useMemo, useEffect } from 'react';

/**
 * Custom hook for handling local pagination logic.
 * 
 * @param {Object} options - Configuration options for pagination.
 * @param {Array} options.data - The array of items (full array for client-side, page items for server-side).
 * @param {number} options.itemsPerPage - Number of items to show per page.
 * @param {Array} options.dependencies - Dependencies that reset pagination to page 1.
 * @param {boolean} options.isServerSide - Whether to handle pagination logic on the server.
 * @param {number} options.totalItems - The total count of items (required for server-side).
 * @param {Function} options.onPageChange - Callback triggered when the page changes (for server-side).
 */
export const usePagination = ({
  data = [],
  itemsPerPage = 10,
  dependencies = [],
  isServerSide = false,
  totalItems: manualTotalItems,
  onPageChange
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalCount = isServerSide ? (manualTotalItems || 0) : data.length;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Reset to first page when search or sort dependencies change
  useEffect(() => {
    setCurrentPage(1);
  }, dependencies);

  const paginatedData = useMemo(() => {
    if (isServerSide) return data;
    const start = (currentPage - 1) * itemsPerPage;
    return data.slice(start, start + itemsPerPage);
  }, [data, currentPage, itemsPerPage, isServerSide]);

  const goToPage = (page) => {
    const pageNumber = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(pageNumber);
    
    if (isServerSide && onPageChange && pageNumber !== currentPage) {
      onPageChange(pageNumber);
    }
  };

  return {
    currentPage,
    totalPages,
    paginatedData,
    goToPage,
    nextPage: () => goToPage(currentPage + 1),
    prevPage: () => goToPage(currentPage - 1),
    startIndex: (currentPage - 1) * itemsPerPage + 1,
    endIndex: Math.min(currentPage * itemsPerPage, totalCount),
    totalItems: totalCount
  };
};