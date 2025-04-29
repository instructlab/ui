// src/app/components/contribute/EditSkill/github/EditSkill.tsx
'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SkillFormGithub from '@/components/Contribute/Skill/Github';
import { fetchPullRequest, fetchFileContent, fetchPullRequestFiles } from '@/utils/github';
import yaml from 'js-yaml';
import axios from 'axios';
import { SkillYamlData, AttributionData, PullRequestFile, SkillFormData, SkillEditFormData, SkillSeedExample } from '@/types';
import { SkillSchemaVersion } from '@/types/const';
import { ValidatedOptions, Modal, ModalVariant, ModalBody } from '@patternfly/react-core';
import { fetchDraftSkillChanges } from '@/components/Contribute/Utils/autoSaveUtils';

interface EditSkillClientComponentProps {
  prNumber: string;
  isDraft: boolean;
}

const EditSkill: React.FC<EditSkillClientComponentProps> = ({ prNumber, isDraft }) => {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingMsg, setLoadingMsg] = useState<string>('');
  const [skillEditFormData, setSkillEditFormData] = useState<SkillEditFormData>();
  const router = useRouter();

  useEffect(() => {
    if (isDraft) {
      fetchDraftSkillChanges({ branchName: prNumber, setIsLoading, setLoadingMsg, setSkillEditFormData });
      return;
    }

    const fetchPRData = async () => {
      setLoadingMsg('Fetching skill data from PR: ' + prNumber);
      if (session?.accessToken) {
        try {
          const prNum = parseInt(prNumber, 10);
          const prData = await fetchPullRequest(session.accessToken, prNum);

          const skillExistingFormData: SkillFormData = {
            branchName: '',
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
            isSubmitted: true,
            version: SkillSchemaVersion,
            formData: skillExistingFormData,
            pullRequestNumber: prNum,
            oldFilesPath: ''
          };

          skillExistingFormData.branchName = prData.head.ref; // Store the branch name from the pull request

          const prFiles: PullRequestFile[] = await fetchPullRequestFiles(session.accessToken, prNum);

          const foundYamlFile = prFiles.find((file: PullRequestFile) => file.filename.endsWith('.yaml'));
          if (!foundYamlFile) {
            throw new Error('No YAML file found in the pull request.');
          }

          const existingFilesPath = foundYamlFile.filename.split('/').slice(1, -1).join('/');

          // Set the current Yaml file path as a old files path
          skillEditFormData.oldFilesPath = existingFilesPath + '/';

          const yamlContent = await fetchFileContent(session.accessToken, foundYamlFile.filename, prData.head.sha);
          const yamlData: SkillYamlData = yaml.load(yamlContent) as SkillYamlData;
          console.log('Parsed YAML data:', yamlData);

          // Populate the form fields with YAML data
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

          // Set the file path from the current YAML file
          const currentFilePath = foundYamlFile.filename.split('/').slice(1, -1).join('/');
          skillEditFormData.formData.filePath = currentFilePath + '/';

          // Fetch and parse attribution file if it exists
          const foundAttributionFile = prFiles.find((file: PullRequestFile) => file.filename.includes('attribution'));
          if (foundAttributionFile) {
            const attributionContent = await fetchFileContent(session.accessToken, foundAttributionFile.filename, prData.head.sha);
            const attributionData = parseAttributionContent(attributionContent);
            console.log('Parsed attribution data:', attributionData);

            // Populate the form fields with attribution data
            skillExistingFormData.titleWork = attributionData.title_of_work;
            skillExistingFormData.licenseWork = attributionData.license_of_the_work;
            skillExistingFormData.creators = attributionData.creator_names;
          }
          setSkillEditFormData(skillEditFormData);
          setIsLoading(false);
        } catch (error) {
          if (axios.isAxiosError(error)) {
            console.error('Error fetching pull request data:', error.response ? error.response.data : error.message);
            setLoadingMsg('Error fetching skills data from PR: ' + prNumber + '. Please try again.');
          } else if (error instanceof Error) {
            console.error('Error fetching pull request data:', error.message);
            setLoadingMsg('Error fetching skills data from PR: ' + prNumber + ' [' + error.message + ']. Please try again.');
          }
        }
      }
    };
    fetchPRData();
  }, [session?.accessToken, prNumber, isDraft]);

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

  return <SkillFormGithub skillEditFormData={skillEditFormData} />;
};

export default EditSkill;
