import { ContributionFormData, DraftEditFormInfo, KnowledgeFormData, SkillFormData } from '@/types';
import { devLog } from '@/utils/devlog';

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

export const storeDraftData = (branchName: string, taxonomy: string, data: string, oldFilesPath: string) => {
  localStorage.setItem(branchName, data);
  addToDraftList(branchName, oldFilesPath, taxonomy);
};

export const isDraftDataExist = (branchName: string): boolean => {
  return localStorage.getItem(branchName) ? true : false;
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

const addToDraftList = (branchName: string, oldFilesPath: string, taxonomy: string) => {
  const existingDrafts = localStorage.getItem('draftContributions');
  let draftContributions: DraftEditFormInfo[] = [];
  const draft: DraftEditFormInfo = {
    branchName,
    lastUpdated: new Date(Date.now()).toUTCString(),
    isKnowledgeDraft: branchName.includes('knowledge-contribution'),
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
export const formDataChanged = (knowledgeFormData: any, prevFormData: any): boolean => {
  if (!prevFormData) {
    return true;
  }
  for (const [key, value] of Object.entries(knowledgeFormData)) {
    if (value) {
      if (!optionalKeys.includes(key)) {
        if (Array.isArray(value)) {
          if (value.length == 0) {
            return false;
          }
          for (let i = 0; i < value.length; i++) {
            if (formDataChanged(value[i], prevFormData[key][i])) {
              return true;
            }
          }
        } else if (typeof value === 'object') {
          if (formDataChanged(value, prevFormData[key])) {
            return true;
          }
        } else {
          console.log(`${key} changed: `, value !== prevFormData[key]);
          if (value !== prevFormData[key]) {
            return true;
          }
        }
      }
    }
  }
  return false;
};

export const fetchDraftKnowledgeChanges = (branchName: string): KnowledgeFormData | undefined => {
  devLog('Fetching draft data from the local storage for knowledge contribution:', branchName);
  const draftInfo = getDraftInfo(branchName);
  if (!draftInfo) {
    return;
  }

  const contributionData = localStorage.getItem(branchName);
  if (!contributionData) {
    console.warn('Contribution draft data is not present in the local storage.');
    return;
  }

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

  return knowledgeExistingFormData;
};

export const fetchDraftSkillChanges = (branchName: string): SkillFormData | undefined => {
  const draftInfo = getDraftInfo(branchName);
  if (!draftInfo) {
    return;
  }

  const contributionData = localStorage.getItem(branchName);
  if (!contributionData) {
    console.warn('Contribution draft data is not present in the local storage.');
    return;
  }

  const skillExistingFormData: SkillFormData = JSON.parse(contributionData);
  devLog('Draft skill data retrieved from local storage :', skillExistingFormData);

  return skillExistingFormData;
};
