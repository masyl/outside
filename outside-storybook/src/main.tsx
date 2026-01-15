import React from 'react';
import ReactDOM from 'react-dom/client';
import { SimpleStory } from './components/SimpleStory';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div style={{ padding: '20px' }}>
      <h1>Outside Game Storybook</h1>
      <SimpleStory message="This is a development preview of the Storybook implementation" />
    </div>
  </React.StrictMode>
);
