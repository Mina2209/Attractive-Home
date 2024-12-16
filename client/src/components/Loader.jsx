import React from 'react';

const Loader = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-900">
      <img 
        src="logov1.png" 
        alt="Loading..." 
        className="animate-pulse h-52 w-auto"
      />
    </div>
  );
};

export default Loader;
