import React from 'react';

const Loader = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-900">
      <img 
        src="/Loading-Logo.webp" 
        alt="Loading..." 
        className="animate-pulse h-52 w-auto"
      />
    </div>
  );
};

export default Loader;
