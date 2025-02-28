import { KnowledgeFormData } from '@/types';
import { devLog } from '@/utils/devlog';

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
