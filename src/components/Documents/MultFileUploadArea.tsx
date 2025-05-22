// src/components/Contribute/Knowledge/MultiFileUploadArea.tsx
'use client';
import * as React from 'react';
import { Button, MultipleFileUploadContext } from '@patternfly/react-core';
import styles from '@patternfly/react-styles/css/components/MultipleFileUpload/multiple-file-upload';
import { css } from '@patternfly/react-styles';

interface Props {
  titleIcon: React.ReactNode;
  titleText: React.ReactNode;
  infoText: React.ReactNode;
  uploadText: string;
  manualUploadText: string;
  onManualUpload: () => void;
}

const MultiFileUploadArea: React.FunctionComponent<Props> = ({ titleIcon, titleText, infoText, uploadText, manualUploadText, onManualUpload }) => {
  const { open } = React.useContext(MultipleFileUploadContext);

  return (
    <div
      className={css(styles.multipleFileUploadMain)}
      style={{
        gridTemplateColumns: '1fr auto auto',
        gridTemplateAreas: `'title upload upload2' 'info upload upload2'`,
        flex: 1
      }}
    >
      <div className={css(styles.multipleFileUploadTitle)}>
        <div className={css(styles.multipleFileUploadTitleIcon)}>{titleIcon}</div>
        <div className={css(styles.multipleFileUploadTitleText)}>{titleText}</div>
      </div>
      <div className={css(styles.multipleFileUploadUpload)} style={{ gridRowStart: 1, gridRowEnd: 'span 2', display: 'flex', alignItems: 'center' }}>
        <Button variant="secondary" onClick={onManualUpload}>
          {manualUploadText}
        </Button>
      </div>
      <div
        className={css(styles.multipleFileUploadUpload)}
        style={{ gridArea: 'upload2', gridRowStart: 1, gridRowEnd: 'span 2', display: 'flex', alignItems: 'center' }}
      >
        <Button variant="secondary" onClick={open}>
          {uploadText}
        </Button>
      </div>
      <div className={css(styles.multipleFileUploadInfo)}>{infoText}</div>
    </div>
  );
};

export default MultiFileUploadArea;
