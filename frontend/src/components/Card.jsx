import React from 'react';
import SkeletonLoader from './SkeletonLoader';

const Card = ({ title, children, className = "", noPadding = false, loading = false }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {title && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          {loading ? (
            <SkeletonLoader className="h-7 w-32" />
          ) : (
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
          )}
        </div>
      )}
      <div className={noPadding ? "" : "p-6"}>
        {loading ? (
          <div className={`space-y-4 ${noPadding ? "p-6" : ""}`}>
            <SkeletonLoader className="h-4 w-3/4" />
            <SkeletonLoader className="h-4 w-full" />
            <SkeletonLoader className="h-4 w-5/6" />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default Card;