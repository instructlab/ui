// src/components/CopyToClipboardButton.tsx
'use client';

import React from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import CopyIcon from '@patternfly/react-icons/dist/dynamic/icons/copy-icon';

interface CopyToClipboardButtonProps {
  text: string;
}

export const CopyToClipboardButton: React.FC<CopyToClipboardButtonProps> = ({ text }) => {
  const handleCopy = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          console.log('Text copied to clipboard');
        })
        .catch((err) => {
          console.error('Could not copy text: ', err);
        });
    } else {
      // Fallback method for copying text if the browser doesn't support navigator.clipboard
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        console.log('Text copied to clipboard');
      } catch (err) {
        console.error('Could not copy text: ', err);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <Button variant="plain" onClick={handleCopy} aria-label="Copy to clipboard">
      <CopyIcon />
    </Button>
  );
};

export default CopyToClipboardButton;
