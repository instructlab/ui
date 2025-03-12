import { KnowledgeFile } from '@/components/Contribute/Knowledge/KnowledgeSeedExamples/KnowledgeSeedExamples';
import { ActionGroupAlertContent } from '@/components/Contribute/types';
import { KnowledgeFormData } from '@/types';
import { devLog } from '@/utils/devlog';

const GITHUB_KNOWLEDGE_FILES_URL = '/api/github/knowledge-files';
const NATIVE_GIT_KNOWLEDGE_FILES_URL = '/api/native/knowledge-files';

export const addDocumentInfoToKnowledgeFormData = (
  knowledgeFormData: KnowledgeFormData,
  repoUrl: string,
  commitShaValue: string,
  docName: string
): KnowledgeFormData => {
  devLog(`addDocumentInfoHandler: repoUrl=${repoUrl}, commitSha=${commitShaValue}, docName=${docName}`);
  if (knowledgeFormData.knowledgeDocumentCommit && commitShaValue !== knowledgeFormData.knowledgeDocumentCommit) {
    console.error('Cannot add documents from different commit SHAs.');
    return knowledgeFormData;
  }

  const baseUrl = repoUrl.replace(/\/[^/]+$/, '');
  if (!knowledgeFormData.knowledgeDocumentCommit) {
    devLog(`Set knowledgeDocumentCommit to: ${commitShaValue}`);
  }
  if (!knowledgeFormData.knowledgeDocumentRepositoryUrl) {
    devLog(`Set knowledgeDocumentRepositoryUrl to: ${baseUrl}`);
  }
  // Add docName if not already present
  // Split current documentName by comma and trim
  let documentName = knowledgeFormData.documentName;
  const currentDocs = knowledgeFormData.documentName
    .split(',')
    .map((d) => d.trim())
    .filter((d) => d.length > 0);

  if (!currentDocs.includes(docName)) {
    documentName = currentDocs.length === 0 ? docName : currentDocs.join(', ') + ', ' + docName;
    devLog(`Updated documentName: ${documentName}`);
  } else {
    devLog(`Document name "${docName}" is already added.`);
  }

  return {
    ...knowledgeFormData,
    knowledgeDocumentCommit: knowledgeFormData.knowledgeDocumentCommit || commitShaValue,
    knowledgeDocumentRepositoryUrl: knowledgeFormData.knowledgeDocumentRepositoryUrl || baseUrl,
    documentName
  };
};

export const UploadKnowledgeDocuments = async (
  isGithubMode: boolean,
  knowledgeFormData: KnowledgeFormData,
  setActionGroupAlertContent: (content: ActionGroupAlertContent) => void
): Promise<boolean> => {
  if (knowledgeFormData.filesToUpload.length > 0 || knowledgeFormData.uploadedFiles.length > 0) {
    const alertInfo: ActionGroupAlertContent = {
      title: 'Document upload(s) in progress!',
      message: 'Document upload(s) is in progress. You will be notified once the upload successfully completes.',
      waitAlert: true,
      success: true,
      timeout: true
    };
    setActionGroupAlertContent(alertInfo);

    const newFiles: { fileName: string; fileContent: string }[] = [];
    const updatedExistingFiles: { fileName: string; fileContent: string }[] = [];

    await Promise.all(
      knowledgeFormData.filesToUpload.map(
        (file) =>
          new Promise<void>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const fileContent = e.target!.result as string;
              newFiles.push({ fileName: file.name, fileContent: fileContent });
              resolve();
            };
            reader.onerror = reject;
            reader.readAsText(file);
          })
      )
    );

    knowledgeFormData.uploadedFiles.map((file: { filename: string; content: string }) => {
      updatedExistingFiles.push({ fileName: file.filename, fileContent: file.content });
    });
    // Trigger the upload only if all the newly uploaded files were read successfully and there are existing uploaded files.
    if (newFiles.length === knowledgeFormData.filesToUpload.length && (newFiles.length !== 0 || updatedExistingFiles.length !== 0)) {
      try {
        console.log('knowledge-files api called.');
        const response = await fetch(isGithubMode ? GITHUB_KNOWLEDGE_FILES_URL : NATIVE_GIT_KNOWLEDGE_FILES_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            branchName: knowledgeFormData.branchName,
            currentCommitSHA: knowledgeFormData.knowledgeDocumentCommit,
            newFiles: newFiles,
            updatedExistingFiles: updatedExistingFiles
          })
        });

        if (response.status === 201 || response.ok) {
          const result = await response.json();
          knowledgeFormData.knowledgeDocumentRepositoryUrl = result.repoUrl;
          knowledgeFormData.knowledgeDocumentCommit = result.commitSha;
          knowledgeFormData.documentName = result.documentNames.join(', ');

          const alertInfo: ActionGroupAlertContent = {
            success: true,
            title: 'Document uploaded successfully!',
            message: 'Documents have been submitted to local taxonomy knowledge docs repo to be referenced in the knowledge submission.',
            url: result.prUrl,
            isUrlExternal: true,
            urlText: 'View it here',
            timeout: true
          };
          setActionGroupAlertContent(alertInfo);
          return true;
        } else {
          console.error('Knowledge document upload failed:', response.statusText);
          const alertInfo: ActionGroupAlertContent = {
            success: false,
            title: 'Failed to upload document!',
            message: `This upload failed. ${response.statusText}`,
            timeout: true
          };
          setActionGroupAlertContent(alertInfo);
          return false;
        }
      } catch (error) {
        console.error('Knowledge document upload encountered an error:', error);
        const alertInfo: ActionGroupAlertContent = {
          success: false,
          title: 'Failed to upload document!',
          message: `This upload failed. ${(error as Error).message}`,
          timeout: true
        };
        setActionGroupAlertContent(alertInfo);
        return false;
      }
    }
  }
  return true;
};

export const fetchExistingKnowledgeDocuments = async (isGithubMode: boolean, knowledgeDocumentCommit: string): Promise<KnowledgeFile[]> => {
  try {
    const url = isGithubMode ? GITHUB_KNOWLEDGE_FILES_URL : `${NATIVE_GIT_KNOWLEDGE_FILES_URL}`;

    const response = await fetch(`${url}?commitSHA=${knowledgeDocumentCommit}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await response.json();
    if (response.ok) {
      return result.files;
    } else {
      console.error('Error fetching knowledge files:', result.error);
    }
  } catch (err) {
    console.error('Error fetching knowledge files:', err);
    return [];
  }
  return [];
};
