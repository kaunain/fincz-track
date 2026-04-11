import React from 'react';

const SkeletonLoader = ({ className = "", variant = "rectangle" }) => {
  const variantClasses = variant === 'circle' ? 'rounded-full' : 'rounded-lg';
  
  return (
    <div className={`bg-gray-200 dark:bg-gray-700 animate-pulse ${variantClasses} ${className}`} />
  );
};

export default SkeletonLoader;