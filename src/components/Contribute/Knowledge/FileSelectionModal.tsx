// src/components/Contribute/Knowledge/FileSelectionModal.tsx
import React, { useEffect, useState } from 'react';
import { Modal, Button, DataList, DataListItem, DataListItemRow, DataListCell, DataListCheck, Spinner, Alert } from '@patternfly/react-core';
import { fetchGitHubRepoFiles } from '@/utils/fileManagerGithub';
import { useSession } from 'next-auth/react';
import { getGitHubUsername } from '@/utils/github';

interface FileSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFiles: (files: string[]) => void;
  repoName: string;
}

export const FileSelectionModal: React.FC<FileSelectionModalProps> = ({ isOpen, onClose, onSelectFiles, repoName }) => {
  const { data: session } = useSession(); // Get the session data from NextAuth
  const [files, setFiles] = useState<any[]>([]); // State for storing the list of files from the repository
  const [loading, setLoading] = useState<boolean>(true); // State for managing the loading state
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]); // State for storing selected files
  const [githubUsername, setGithubUsername] = useState<string | null>(null);

  useEffect(() => {
    const loadFiles = async () => {
      if (!session || !session.accessToken) {
        setError('Unauthorized: Missing or invalid access token');
        setLoading(false);
        return;
      }

      try {
        const username = await getGitHubUsername(session.accessToken as string);
        setGithubUsername(username);
        const repoFiles = await fetchGitHubRepoFiles(session.accessToken as string);
        setFiles(repoFiles);
      } catch (err) {
        setError('Failed to load files');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadFiles();
  }, [session]);

  const handleSelectFile = (filePath: string, isSelected: boolean) => {
    setSelectedFiles((prevSelectedFiles) => (isSelected ? [...prevSelectedFiles, filePath] : prevSelectedFiles.filter((file) => file !== filePath)));
  };

  // Function to confirm the selection of files and close the modal
  const handleConfirmSelection = () => {
    // Pass selected files to the parent component
    onSelectFiles(selectedFiles);
    onClose();
  };

  return (
    <Modal
      title="Select PDF or Markdown files from your knowledge files repository on GitHub"
      isOpen={isOpen}
      onClose={onClose}
      actions={[
        <Button key="confirm" variant="primary" onClick={handleConfirmSelection}>
          Confirm
        </Button>,
        <Button key="cancel" variant="link" onClick={onClose}>
          Cancel
        </Button>
      ]}
    >
      {loading && <Spinner size="lg" />}
      {error && (
        <Alert variant="danger" title="Error loading files">
          {error}
        </Alert>
      )}
      {!loading && !error && (
        <DataList aria-label="File List">
          {files.map((file, index) => (
            <DataListItem key={index} aria-labelledby={`file-item-${index}`}>
              <DataListItemRow>
                <DataListCheck
                  aria-labelledby={`file-item-${index}`}
                  checked={selectedFiles.includes(file.path)}
                  onChange={(checked) => handleSelectFile(file.path, checked)}
                />
                <DataListCell>
                  <span id={`file-item-${index}`}>{file.path}</span>
                </DataListCell>
              </DataListItemRow>
            </DataListItem>
          ))}
        </DataList>
      )}
    </Modal>
  );
};

export default FileSelectionModal;
