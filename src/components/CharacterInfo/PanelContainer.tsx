// src/components/PanelContainer.tsx
import React from 'react';

// Copia aquí CONTAINER_CLASSES u obténlo de tu tema
const CONTAINER_CLASSES = 'p-4 rounded-lg shadow-lg text-white ring-2 ring-gray-500 ring-inset bg-gray-900';

const PanelContainer: React.FC<React.PropsWithChildren<{}>> = ({ children }) => (
  <div className={CONTAINER_CLASSES}>{children}</div>
);

export default PanelContainer;
