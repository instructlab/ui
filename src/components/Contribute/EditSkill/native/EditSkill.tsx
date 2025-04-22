// src/app/components/contribute/EditSkill/native/EditSkill.tsx
'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import yaml from 'js-yaml';
import { SkillYamlData, AttributionData, SkillFormData, SkillEditFormData, SkillSeedExample } from '@/types';
import { SkillSchemaVersion } from '@/types/const';
import { ValidatedOptions, Modal, ModalVariant, ModalBody } from '@patternfly/react-core';
import SkillFormNative from '../../Skill/Native';
import { useSession } from 'next-auth/react';
import { devLog } from '@/utils/devlog';

interface ChangeData {
  file: string;
  status: string;
  content?: string;
  commitSha?: string;
}

interface EditSkillClientComponentProps {
  branchName: string;
  isDraft: boolean;
}

const EditSkillNative: React.FC<EditSkillClientComponentProps> = ({ branchName, isDraft }) => {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingMsg, setLoadingMsg] = useState<string>('');
  const [skillEditFormData, setSkillEditFormData] = useState<SkillEditFormData>();
  const router = useRouter();

  useEffect(() => {
    if (isDraft) {
      const fetchDraftChanges = () => {
        devLog('Fetching draft data from the local storage for skill contribution:', branchName);
        setLoadingMsg(`Fetching draft skill data for ${branchName}`);
        const contributionData = localStorage.getItem(branchName);
        if (contributionData != null) {
          const skillExistingFormData: SkillFormData = JSON.parse(contributionData);
          devLog('Draft skill data retrieved from local storage :', skillExistingFormData);
          const skillEditFormData: SkillEditFormData = {
            isEditForm: true,
            version: SkillSchemaVersion,
            pullRequestNumber: 0,
            formData: skillExistingFormData,
            oldFilesPath: ''
          };
          setSkillEditFormData(skillEditFormData);
          setIsLoading(false);
        } else {
          console.warn('Contribution draft data is not present in the local storage.');
        }
      };
      fetchDraftChanges();
      return;
    }

    const fetchBranchChanges = async () => {
      setLoadingMsg('Fetching skill data from branch: ' + branchName);
      try {
        const response = await fetch('/api/native/git/branches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ branchName, action: 'diff' })
        });

        const result = await response.json();
        if (response.ok) {
          const skillExistingFormData: SkillFormData = {
            branchName: branchName,
            email: '',
            name: '',
            submissionSummary: '',
            filePath: '',
            seedExamples: [],
            titleWork: '',
            licenseWork: '',
            creators: ''
          };

          const skillEditFormData: SkillEditFormData = {
            isEditForm: true,
            version: SkillSchemaVersion,
            pullRequestNumber: 0,
            formData: skillExistingFormData,
            oldFilesPath: ''
          };

          if (session?.user?.name && session?.user?.email) {
            skillExistingFormData.name = session?.user?.name;
            skillExistingFormData.email = session?.user?.email;
          }

          if (result?.commitDetails != null) {
            skillExistingFormData.submissionSummary = result?.commitDetails.message;
            skillExistingFormData.name = result?.commitDetails.name;
            skillExistingFormData.email = result?.commitDetails.email;
          }

          if (result?.changes.length > 0) {
            result.changes.forEach((change: ChangeData) => {
              if (change.status != 'deleted' && change.content) {
                if (change.file.includes('qna.yaml')) {
                  const yamlData: SkillYamlData = yaml.load(change.content) as SkillYamlData;
                  console.log('Parsed skill YAML data:', yamlData);
                  skillExistingFormData.submissionSummary = yamlData.task_description;
                  const seedExamples: SkillSeedExample[] = [];
                  yamlData.seed_examples.forEach((seed, index) => {
                    const example: SkillSeedExample = {
                      immutable: index < 5 ? true : false,
                      isExpanded: true,
                      context: seed.context,
                      isContextValid: ValidatedOptions.success,
                      questionAndAnswer: {
                        immutable: index < 5 ? true : false,
                        question: seed.question,
                        isQuestionValid: ValidatedOptions.success,
                        answer: seed.answer,
                        isAnswerValid: ValidatedOptions.success
                      }
                    };
                    seedExamples.push(example);
                  });
                  skillExistingFormData.seedExamples = seedExamples;

                  //Extract filePath from the existing qna.yaml file path
                  const currentFilePath = change.file.split('/').slice(1, -1).join('/');
                  skillEditFormData.formData.filePath = currentFilePath + '/';

                  // Set the oldFilesPath to the existing qna.yaml file path.
                  skillEditFormData.oldFilesPath = skillEditFormData.formData.filePath;
                }
                if (change.file.includes('attribution.txt')) {
                  const attributionData = parseAttributionContent(change.content);
                  console.log('Parsed skill attribution data:', attributionData);
                  // Populate the form fields with attribution data
                  skillExistingFormData.titleWork = attributionData.title_of_work;
                  skillExistingFormData.licenseWork = attributionData.license_of_the_work;
                  skillExistingFormData.creators = attributionData.creator_names;
                }
              }
            });
          }
          setSkillEditFormData(skillEditFormData);
        } else {
          console.error('Failed to get branch changes:', result.error);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching branch changes:', error);
      }
    };
    fetchBranchChanges();
  }, [branchName, session?.user?.email, session?.user?.name]);

  const parseAttributionContent = (content: string): AttributionData => {
    const lines = content.split('\n');
    const attributionData: { [key: string]: string } = {};
    lines.forEach((line) => {
      const [key, ...value] = line.split(':');
      if (key && value) {
        const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, '_');
        attributionData[normalizedKey] = value.join(':').trim();
      }
    });
    return attributionData as unknown as AttributionData;
  };

  const handleOnClose = () => {
    router.push('/dashboard');
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <Modal variant={ModalVariant.small} title="Loading Skill Data" isOpen={isLoading} onClose={handleOnClose}>
        <ModalBody>
          <div>{loadingMsg}</div>
        </ModalBody>
      </Modal>
    );
  }

  return <SkillFormNative skillEditFormData={skillEditFormData} />;
};

export default EditSkillNative;
