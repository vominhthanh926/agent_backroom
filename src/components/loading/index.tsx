import React from "react";

const LoadingSpinner = ({}) => {

  return (
      <div className="spinner">
        <svg width="100" height="100">
          <path d="M50 5 A 45 45 0 0 1 95 50" fill="none" stroke-width="10" stroke="#e4381e"></path>
          <circle cx="50" cy="50" r="45" stroke-width="10" stroke="#4d5c32" fill="none"></circle>
          <path d="M50 5 A 45 45 0 0 1 95 50" fill="none" stroke-width="10" stroke="#e4381e"></path>
        </svg>
      </div>
  );
};

export default LoadingSpinner;
