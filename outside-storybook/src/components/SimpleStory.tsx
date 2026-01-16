import React from 'react';

export const SimpleStory: React.FC<{ message?: string }> = ({ message = 'Hello Storybook!' }) => (
  <div
    style={{
      padding: '20px',
      border: '2px solid #ccc',
      borderRadius: '8px',
      fontFamily: 'Arial, sans-serif',
    }}
  >
    <h3>{message}</h3>
    <p>This is a simple React component story.</p>
  </div>
);
