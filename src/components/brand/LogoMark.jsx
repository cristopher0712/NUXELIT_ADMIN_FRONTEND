import React from 'react';

export default function LogoMark({ size = 36, className = '' }) {
  return (
    <img
      src="/images/logos/logo-dark.png"
      alt="Nuxelit Logo"
      width={size}
      height={size}
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', objectFit: 'contain' }}
    />
  );
}
