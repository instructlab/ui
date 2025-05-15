import { ActionGroupAlertContent } from '@/components/Contribute/types';
import { KnowledgeFile, KnowledgeFormData } from '@/types';

export const UploadKnowledgeDocuments = async (
  knowledgeFormData: KnowledgeFormData,
  setActionGroupAlertContent: (content: ActionGroupAlertContent) => void
): Promise<boolean> => {
  const filesToUpload = knowledgeFormData.seedExamples.reduce<KnowledgeFile[]>((knowledgeFiles, nextSeedExample) => {
    const nextKnowledgeFile = nextSeedExample.knowledgeFile;
    if (nextKnowledgeFile && !knowledgeFiles.find((knowledgeFile) => knowledgeFile.filename === nextKnowledgeFile.filename)) {
      knowledgeFiles.push(nextKnowledgeFile);
    }
    return knowledgeFiles;
  }, []);

  if (filesToUpload.length > 0 || knowledgeFormData.uploadedFiles.length > 0) {
    const alertInfo: ActionGroupAlertContent = {
      title: 'Document upload(s) in progress!',
      message: 'Document upload(s) is in progress. You will be notified once the upload successfully completes.',
      waitAlert: true,
      success: true,
      timeout: true
    };
    setActionGroupAlertContent(alertInfo);

    const newFiles: { fileName: string; fileContent: string }[] = filesToUpload.map((file) => ({
      fileName: file.filename,
      fileContent: file.content ? file.content : ''
    }));

    const updatedExistingFiles: { fileName: string; fileContent: string }[] = knowledgeFormData.uploadedFiles.map((file) => ({
      fileName: file.filename,
      fileContent: file.content ? file.content : ''
    }));

    try {
      const response = await fetch('/api/knowledge-files', {
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
  return true;
};

export const fetchExistingKnowledgeDocuments = async (knowledgeDocumentCommit: string): Promise<KnowledgeFile[]> => {
  try {
    const response = await fetch(`/api/knowledge-files?commitSHA=${knowledgeDocumentCommit}`, {
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

export const LastUpdatedDateFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  hourCycle: 'h12',
  minute: '2-digit',
  timeZoneName: 'short'
});

export const getFormattedLastUpdatedDate = (date: Date) => LastUpdatedDateFormatter.format(date);

export const getFormattedKnowledgeFileData = (knowledgeFile: KnowledgeFile): string => {
  const date = knowledgeFile.commitDate ? new Date(Date.parse(knowledgeFile.commitDate)) : new Date();
  return getFormattedLastUpdatedDate(date);
};
