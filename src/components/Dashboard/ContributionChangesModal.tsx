import * as React from 'react';
import { Flex, Modal, ModalBody, ModalHeader, ModalVariant, Spinner } from '@patternfly/react-core';
import { ExpandableSection } from '@patternfly/react-core/dist/esm/components/ExpandableSection/ExpandableSection';
import { t_global_spacer_xl as XlSpacerSize } from '@patternfly/react-tokens/dist/esm/t_global_spacer_xl';
import { ContributionInfo } from '@/types';

interface ChangeData {
  file: string;
  status: string;
  content?: string;
  commitSha?: string;
}

interface Props {
  contribution: ContributionInfo;
  onClose: () => void;
}

const ContributionChangesModel: React.FC<Props> = ({ contribution, onClose }) => {
  const [diffData, setDiffData] = React.useState<ChangeData[] | null>(null);
  const [expandedFiles, setExpandedFiles] = React.useState<Record<string, boolean>>({});
  const [errorMsg, setErrorMsg] = React.useState<string>();

  React.useEffect(() => {
    const fetchChangeData = async () => {
      try {
        const response = await fetch('/api/git/branches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ branchName: contribution.branchName, action: 'diff' })
        });

        const result = await response.json();
        if (response.ok) {
          setDiffData(result.changes);
        } else {
          console.error('Failed to get branch changes:', result.error);
          setErrorMsg(result.error);
        }
      } catch (error) {
        console.error('Error fetching branch changes:', error);
        setErrorMsg((error as Error).message);
      }
    };
    fetchChangeData();
  }, [contribution.branchName]);

  const toggleFileContent = (filename: string) => {
    setExpandedFiles((prev) => ({
      ...prev,
      [filename]: !prev[filename]
    }));
  };

  return (
    <Modal
      variant={ModalVariant.medium}
      title={`Files Contained in Branch: ${contribution.branchName}`}
      isOpen
      onClose={() => onClose()}
      aria-labelledby="changes-contribution-modal-title"
    >
      <ModalHeader title={`Files Contained in Branch: ${contribution.branchName}`} labelId="changes-contribution-modal-title" />
      <ModalBody>
        {errorMsg ? (
          errorMsg
        ) : !diffData ? (
          <Flex
            alignItems={{ default: 'alignItemsCenter' }}
            justifyContent={{ default: 'justifyContentCenter' }}
            style={{ padding: XlSpacerSize.var }}
          >
            <Spinner size="xl" />
          </Flex>
        ) : (
          <>
            {diffData.length ? (
              <ul style={{ listStyle: 'none', paddingLeft: '0' }}>
                {diffData.map((change) => (
                  <li key={`${change.file}-${change.commitSha}`} style={{ marginBottom: '1rem' }}>
                    <div>
                      <strong>{change.file}</strong> - <em>{change.status}</em> - Commit SHA: {change.commitSha}
                    </div>
                    {change.status !== 'deleted' && change.content && (
                      <ExpandableSection
                        toggleText={expandedFiles[change.file] ? 'Hide file contents' : 'Show file contents'}
                        onToggle={() => toggleFileContent(change.file)}
                        isExpanded={expandedFiles[change.file] || false}
                      >
                        <pre
                          style={{
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            backgroundColor: '#f5f5f5',
                            padding: '10px',
                            borderRadius: '4px',
                            maxHeight: '700px',
                            overflowY: 'auto',
                            userSelect: 'text'
                          }}
                        >
                          {change.content}
                        </pre>
                      </ExpandableSection>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No differences found.</p>
            )}
          </>
        )}
      </ModalBody>
    </Modal>
  );
};

export default ContributionChangesModel;
