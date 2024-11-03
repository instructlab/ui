// src/components/Experimental/CloneRepoLocal/CloneRepoLocal.tsx
'use client';

import React, { useState } from 'react';
import { Form } from '@patternfly/react-core/dist/dynamic/components/Form';
import { FormGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { TextInput } from '@patternfly/react-core/dist/dynamic/components/TextInput';
import { ActionGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { FormHelperText } from '@patternfly/react-core/dist/dynamic/components/Form';
import { HelperText } from '@patternfly/react-core/dist/dynamic/components/HelperText';
import { HelperTextItem } from '@patternfly/react-core/dist/dynamic/components/HelperText';
import styles from './CloneRepoLocal.module.css';

// Retrieve the public base directory from environment variables
const BASE_DIRECTORY = process.env.NEXT_PUBLIC_BASE_CLONE_DIRECTORY;

const CloneRepoLocal: React.FC = () => {
  const [repoUrl, setRepoUrl] = useState('');
  const [directory, setDirectory] = useState('');
  const [message, setMessage] = useState('');
  const [fullPath, setFullPath] = useState('');

  const handleRepoUrlChange = (_event: React.FormEvent<HTMLInputElement>, value: string) => {
    setRepoUrl(value);
  };

  const handleDirectoryChange = (_event: React.FormEvent<HTMLInputElement>, value: string) => {
    setDirectory(value);
  };

  const handleCloneRepo = async () => {
    if (!repoUrl || !directory) {
      setMessage('Please provide both repository URL and directory path.');
      return;
    }

    try {
      const response = await fetch('/api/local/clone-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl, directory })
      });

      const result = await response.json();
      if (response.ok) {
        setMessage(result.message);
        setFullPath(result.fullPath); // Store the full path to display to the user
      } else {
        setMessage(`Error: ${result.message}`);
        setFullPath(''); // Clear full path if there's an error
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMessage(`An unexpected error occurred: ${errorMessage}`);
      setFullPath('');
    }
  };

  return (
    <Form className={styles.formContainer}>
      <FormGroup label="Base Directory" fieldId="base-directory" className={styles.formGroup}>
        <FormHelperText>
          <HelperText>
            <HelperTextItem>{`Base Directory: ${BASE_DIRECTORY}`}</HelperTextItem>
          </HelperText>
        </FormHelperText>
      </FormGroup>

      <FormGroup label="Repository URL" isRequired fieldId="repo-url" className={styles.formGroup}>
        <TextInput isRequired type="text" id="repo-url" name="repo-url" value={repoUrl} onChange={handleRepoUrlChange} />
        <FormHelperText>
          <HelperText>
            <HelperTextItem>Enter the repository URL.</HelperTextItem>
            <HelperTextItem>URL should be a valid Git repository.</HelperTextItem>
          </HelperText>
        </FormHelperText>
      </FormGroup>

      <FormGroup label="Name of the folder to clone the repo to" isRequired fieldId="directory-path" className={styles.formGroup}>
        <TextInput isRequired type="text" id="directory-path" name="directory-path" value={directory} onChange={handleDirectoryChange} />
        <FormHelperText>
          <HelperText>
            <HelperTextItem>Enter the directory path.</HelperTextItem>
            <HelperTextItem>The cloned directory will be appended to the base directory path.</HelperTextItem>
          </HelperText>
        </FormHelperText>
      </FormGroup>

      <ActionGroup>
        <Button variant="primary" onClick={handleCloneRepo}>
          Clone Repository
        </Button>
      </ActionGroup>

      {message && (
        <FormHelperText>
          <HelperText>
            <HelperTextItem>{message}</HelperTextItem>
          </HelperText>
        </FormHelperText>
      )}

      {fullPath && (
        <FormHelperText>
          <HelperText>
            <HelperTextItem>Cloned to: {fullPath}</HelperTextItem>
          </HelperText>
        </FormHelperText>
      )}
    </Form>
  );
};

export default CloneRepoLocal;
