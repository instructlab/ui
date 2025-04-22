import { ContributionFormData, DraftInfo } from '@/types';
import { devLog } from '@/utils/devlog';
import path from 'path';

export const addDraft = (branchName: string, data: string) => {
  localStorage.setItem(branchName, data);
  addToDraftList(branchName);
};

export const isDraftExist = (branchName: string): boolean => {
  return localStorage.getItem(branchName) ? true : false;
};

export const getDraft = (branchName: string): string | null => {
  return localStorage.getItem(branchName);
};

export const deleteDraft = (branchName: string) => {
  localStorage.removeItem(branchName);
  deleteFromDraftList(branchName);
};

const addToDraftList = (branchName: string) => {
  const existingDrafts = localStorage.getItem('draftContributions');
  let draftContributions: DraftInfo[] = [];
  const draft: DraftInfo = {
    branchName: branchName,
    lastUpdated: new Date(Date.now()).toUTCString(),
    isKnowledgeDraft: branchName.includes('knowledge-contribution')
  };
  if (existingDrafts == null || existingDrafts.length === 0) {
    draftContributions.push(draft);
  } else {
    const existingDraftsArr: DraftInfo[] = JSON.parse(existingDrafts);
    existingDraftsArr.forEach((element: DraftInfo) => {
      draftContributions.push(element);
    });
    // Check if the knowledge contribution already exist
    const isExist = draftContributions.find((item) => item.branchName == branchName);
    if (!isExist) {
      draftContributions.push(draft);
    } else {
      draftContributions = draftContributions.map((item) =>
        item.branchName === branchName ? { ...draft, title: item.title, author: item.author } : item
      );
    }
  }
  localStorage.setItem('draftContributions', JSON.stringify(draftContributions));
  devLog(`Added draft ${branchName} to the contribution list: ${JSON.stringify(draftContributions)}`);
};

const deleteFromDraftList = (branchName: string) => {
  const existingDrafts = localStorage.getItem('draftContributions');
  if (existingDrafts == null || existingDrafts.length === 0) {
    return;
  } else {
    const existingDraftsArr: DraftInfo[] = JSON.parse(existingDrafts);
    const updatedDrafts = existingDraftsArr.filter((draft) => draft.branchName != branchName);
    localStorage.setItem('draftContributions', JSON.stringify(updatedDrafts));
    devLog(`Removed draft ${branchName} from the contribution list: ${JSON.stringify(updatedDrafts)}`);
  }
};

export const fetchDraftContribution = (): DraftInfo[] => {
  const draftContributions = localStorage.getItem('draftContributions');
  const drafts: DraftInfo[] = [];
  if (draftContributions == null || draftContributions.length === 0) return drafts;
  const draftContributionsArr: DraftInfo[] = JSON.parse(draftContributions);
  devLog('Existing Draft Contributions : ', draftContributionsArr);
  draftContributionsArr.forEach((item) => {
    const draft = localStorage.getItem(item.branchName);
    if (draft != null) {
      const draftObj: ContributionFormData = JSON.parse(draft);
      item.author = draftObj.email;
      item.title = draftObj.submissionSummary;
      drafts.push(item);
    }
  });
  return drafts;
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const storeDraftKnowledgeFile = async (knowledgeContributionName: string, file: File): Promise<void> => {
  const base64 = await fileToBase64(file);
  const fileData = {
    name: file.name,
    type: file.type,
    data: base64
  };
  devLog('Saving file of draft contribution : ', fileData);
  localStorage.setItem(path.join(knowledgeContributionName, file.name), JSON.stringify(fileData));
};

function base64ToFile(base64: string, name: string, type: string): File {
  const arr = base64.split(',');
  const mime = type;
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], name, { type: mime });
}

export const retrieveDraftKnowledgeFile = (knowledgeContributionName: string, fileName: string): File | null => {
  const item = localStorage.getItem(path.join(knowledgeContributionName, fileName));
  if (!item) return null;

  const { name, type, data } = JSON.parse(item);
  devLog('Retrieving file for draft contribution : ', name);

  return base64ToFile(data, name, type);
};

const optionalKeys = [
  'email',
  'name',
  'branchName',
  'knowledgeDocumentRepositoryUrl',
  'knowledgeDocumentCommit',
  'immutable',
  'isQuestionValid',
  'questionValidationError',
  'isAnswerValid',
  'answerValidationError',
  'isExpanded',
  'isContextValid',
  'validationError'
];

/* eslint-disable @typescript-eslint/no-explicit-any */
export const doSaveDraft = (knowledgeFormData: any): boolean => {
  for (const [key, value] of Object.entries(knowledgeFormData)) {
    if (value) {
      if (optionalKeys.includes(key)) {
        continue;
      } else {
        if (Array.isArray(value) && value.length == 0) {
          return false;
        } else if (Array.isArray(value)) {
          for (let i = 0; i < value.length; i++) {
            if (doSaveDraft(value[i])) {
              return true;
            } else {
              continue;
            }
          }
        } else if (value !== null && typeof value === 'object') {
          if (doSaveDraft(value)) {
            return true;
          } else {
            continue;
          }
        } else {
          return true;
        }
      }
    }
  }
  return false;
};
