import { ContributionFormData, DraftEditFormInfo, KnowledgeEditFormData, KnowledgeFormData, SkillEditFormData, SkillFormData } from '@/types';
import { KnowledgeSchemaVersion, SkillSchemaVersion } from '@/types/const';
import { devLog } from '@/utils/devlog';
import path from 'path';

export const TOOLTIP_FOR_DISABLE_COMPONENT = 'This action can be performed once the draft changes are either submitted or discarded.';
export const TOOLTIP_FOR_DISABLE_NEW_COMPONENT = 'This action can be performed once the draft changes are submitted.';

export const clearAllDraftData = () => {
  const existingDrafts = localStorage.getItem('draftContributions');
  if (existingDrafts !== null && existingDrafts.length !== 0) {
    const existingDraftsArr: DraftEditFormInfo[] = JSON.parse(existingDrafts);
    existingDraftsArr.forEach((item) => {
      if (localStorage.getItem(item.branchName)) {
        localStorage.removeItem(item.branchName);
      }
    });
    localStorage.removeItem('draftContributions');
  }
};

export const storeDraftData = (branchName: string, taxonomy: string, data: string, isSubmitted: boolean, oldFilesPath: string) => {
  localStorage.setItem(branchName, data);
  addToDraftList(branchName, isSubmitted, oldFilesPath, taxonomy);
};

export const isDraftDataExist = (branchName: string): boolean => {
  return localStorage.getItem(branchName) ? true : false;
};

export const getDraftData = (branchName: string): string | null => {
  return localStorage.getItem(branchName);
};

export const deleteDraftData = (branchName: string) => {
  localStorage.removeItem(branchName);
  deleteFromDraftList(branchName);
};

const getDraftInfo = (branchName: string): DraftEditFormInfo | undefined => {
  const existingDrafts = localStorage.getItem('draftContributions');
  if (existingDrafts !== null && existingDrafts.length !== 0) {
    const existingDraftsArr: DraftEditFormInfo[] = JSON.parse(existingDrafts);
    return existingDraftsArr.find((draft) => draft.branchName === branchName);
  }
  return undefined;
};

const addToDraftList = (branchName: string, isSubmitted: boolean, oldFilesPath: string, taxonomy: string) => {
  const existingDrafts = localStorage.getItem('draftContributions');
  let draftContributions: DraftEditFormInfo[] = [];
  const draft: DraftEditFormInfo = {
    branchName,
    lastUpdated: new Date(Date.now()).toUTCString(),
    isKnowledgeDraft: branchName.includes('knowledge-contribution'),
    isSubmitted,
    oldFilesPath,
    taxonomy
  };
  if (existingDrafts == null || existingDrafts.length === 0) {
    draftContributions.push(draft);
  } else {
    const existingDraftsArr: DraftEditFormInfo[] = JSON.parse(existingDrafts);
    existingDraftsArr.forEach((element: DraftEditFormInfo) => {
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
    const existingDraftsArr: DraftEditFormInfo[] = JSON.parse(existingDrafts);
    const updatedDrafts = existingDraftsArr.filter((draft) => draft.branchName != branchName);
    localStorage.setItem('draftContributions', JSON.stringify(updatedDrafts));
    devLog(`Removed draft ${branchName} from the contribution list: ${JSON.stringify(updatedDrafts)}`);
  }
};

export const fetchDraftContributions = (): DraftEditFormInfo[] => {
  const draftContributions = localStorage.getItem('draftContributions');
  const drafts: DraftEditFormInfo[] = [];
  if (draftContributions == null || draftContributions.length === 0) return drafts;
  const draftContributionsArr: DraftEditFormInfo[] = JSON.parse(draftContributions);
  devLog('Existing Draft Contributions : ', draftContributionsArr);
  draftContributionsArr.forEach((item) => {
    const draft = localStorage.getItem(item.branchName);
    if (draft != null) {
      const draftObj: ContributionFormData = JSON.parse(draft);
      item.author = draftObj.email;
      item.title = draftObj.submissionSummary;
      item.taxonomy = draftObj.filePath;
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

interface DraftChangePros {
  branchName: string;
  setIsLoading: (loading: boolean) => void;
  setLoadingMsg: (msg: string) => void;
  setKnowledgeEditFormData?: (data: KnowledgeEditFormData) => void;
  setSkillEditFormData?: (data: SkillEditFormData) => void;
}
export function fetchDraftKnowledgeChanges({ branchName, setIsLoading, setLoadingMsg, setKnowledgeEditFormData }: DraftChangePros) {
  devLog('Fetching draft data from the local storage for knowledge contribution:', branchName);
  setLoadingMsg(`Fetching draft knowledge data for ${branchName}`);
  const draftInfo = getDraftInfo(branchName);
  const contributionData = localStorage.getItem(branchName);
  if (contributionData != null) {
    const knowledgeExistingFormData: KnowledgeFormData = JSON.parse(contributionData, (key, value) => {
      if (key === 'filesToUpload' && Array.isArray(value)) {
        return value.map((meta: File) => {
          return new File([''], meta.name, {
            type: 'text/markdown',
            lastModified: Date.now()
          });
        });
      }
      return value;
    });
    devLog('Draft data retrieved from local storage :', knowledgeExistingFormData);
    const storedDraftFiles: File[] = [];
    knowledgeExistingFormData.filesToUpload.forEach((file) => {
      const readFile = retrieveDraftKnowledgeFile(knowledgeExistingFormData.branchName, file.name);
      if (readFile) {
        storedDraftFiles.push(readFile);
      } else {
        console.error('Not able to retrieve file :', path.join(knowledgeExistingFormData.branchName, file.name));
      }
    });
    knowledgeExistingFormData.filesToUpload = storedDraftFiles;
    const knowledgeEditFormData: KnowledgeEditFormData = {
      isEditForm: true,
      isSubmitted: !!draftInfo?.isSubmitted,
      isDraft: true,
      version: KnowledgeSchemaVersion,
      formData: knowledgeExistingFormData,
      pullRequestNumber: 0,
      oldFilesPath: draftInfo?.oldFilesPath ? draftInfo.oldFilesPath : ''
    };
    if (setKnowledgeEditFormData) {
      setKnowledgeEditFormData(knowledgeEditFormData);
    }
    setIsLoading(false);
  } else {
    console.warn('Contribution draft data is not present in the local storage.');
  }
}

export function fetchDraftSkillChanges({ branchName, setIsLoading, setLoadingMsg, setSkillEditFormData }: DraftChangePros) {
  devLog('Fetching draft data from the local storage for skill contribution:', branchName);
  setLoadingMsg(`Fetching draft skill data for ${branchName}`);
  const draftInfo = getDraftInfo(branchName);
  const contributionData = localStorage.getItem(branchName);
  if (contributionData != null) {
    const skillExistingFormData: SkillFormData = JSON.parse(contributionData);
    devLog('Draft skill data retrieved from local storage :', skillExistingFormData);
    const skillEditFormData: SkillEditFormData = {
      isEditForm: true,
      isSubmitted: draftInfo ? draftInfo.isSubmitted : false,
      isDraft: true,
      version: SkillSchemaVersion,
      pullRequestNumber: 0,
      formData: skillExistingFormData,
      oldFilesPath: draftInfo?.oldFilesPath ? draftInfo.oldFilesPath : ''
    };
    if (setSkillEditFormData) {
      setSkillEditFormData(skillEditFormData);
    }
    setIsLoading(false);
  } else {
    console.warn('Contribution draft data is not present in the local storage.');
  }
}
