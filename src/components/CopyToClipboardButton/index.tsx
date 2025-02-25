// src/components/CopyToClipboardButton.tsx
'use client';

import { ClipboardCopyButton } from '@patternfly/react-core';
import React from 'react';

interface CopyToClipboardButtonProps {
  text: string;
}

export const CopyToClipboardButton: React.FC<CopyToClipboardButtonProps> = ({ text }) => {
  const [copied, setCopied] = React.useState(false);

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

  const onClick = () => {
    handleCopy();
    setCopied(true);
  };

  return (
    <ClipboardCopyButton
      id="basic-copy-button"
      textId="code-content"
      aria-label="Copy to clipboard"
      onClick={onClick}
      exitDelay={copied ? 1500 : 600}
      maxWidth="110px"
      variant="plain"
      onTooltipHidden={() => setCopied(false)}
    >
      {copied ? 'Successfully copied to clipboard!' : 'Copy to clipboard'}
    </ClipboardCopyButton>
  );
};

export default CopyToClipboardButton;
