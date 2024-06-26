// src/components/Contribute/KnowledgeFiles.tsx
import React, { useEffect, useState } from 'react';
import {
  PageSection,
  Title,
  Card,
  CardHeader,
  CardTitle,
  Spinner,
  Alert,
  AlertActionCloseButton,
  DataList,
  DataListItem,
  DataListItemRow,
  DataListCell,
  Button,
  Flex,
  FlexItem,
  Chip
} from '@patternfly/react-core';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';
import { fetchGitHubRepoFiles } from '@/utils/fileManagerGithub';
import { useSession } from 'next-auth/react';
import { getGitHubUsername } from '@/utils/github';

interface KnowledgeFilesProps {
  repoName: string;
}

const BASE_BRANCH = 'main';

export const KnowledgeFiles: React.FC<KnowledgeFilesProps> = ({ repoName }) => {
  const { data: session } = useSession();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
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

  const handleCloseError = () => {
    setError(null);
  };

  const handleConvertToMarkdown = (filePath: string) => {
    // Add your convert to markdown logic here
    console.log(`Convert to Markdown: ${filePath}`);
  };

  return (
    <PageSection>
      <Title headingLevel="h1">Knowledge Files</Title>
      {loading && <Spinner size="lg" />}
      {error && (
        <Alert variant="danger" title="Error loading files" actionClose={<AlertActionCloseButton onClose={handleCloseError} />}>
          {error}
        </Alert>
      )}
      {!loading && !error && githubUsername && (
        <DataList aria-label="File List" style={{ borderBottom: 'none' }}>
          {files.map((file, index) => (
            <DataListItem key={index} aria-labelledby={`file-item-${index}`} style={{ borderBottom: 'none' }}>
              <DataListItemRow>
                <DataListCell>
                  <Card>
                    <CardHeader>
                      <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
                        <Flex>
                          <FlexItem>
                            <CardTitle>
                              <a
                                href={`https://github.com/${githubUsername}/${repoName}/blob/${BASE_BRANCH}/${file.path}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {file.path} <ExternalLinkAltIcon />
                              </a>
                            </CardTitle>
                          </FlexItem>
                          <FlexItem>
                            <Chip isReadOnly>{file.path.endsWith('.pdf') ? 'PDF' : 'Markdown'}</Chip>
                          </FlexItem>
                        </Flex>
                        {file.path.endsWith('.pdf') && (
                          <FlexItem>
                            <Button variant="primary" onClick={() => handleConvertToMarkdown(file.path)}>
                              Convert to Markdown
                            </Button>
                          </FlexItem>
                        )}
                      </Flex>
                    </CardHeader>
                  </Card>
                </DataListCell>
              </DataListItemRow>
            </DataListItem>
          ))}
        </DataList>
      )}
    </PageSection>
  );
};

export default KnowledgeFiles;
