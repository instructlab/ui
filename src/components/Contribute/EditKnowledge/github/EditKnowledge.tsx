// src/app/components/contribute/EditKnowledge/github/EditKnowledge.tsx
'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { AttributionData, PullRequestFile, KnowledgeYamlData, KnowledgeSeedExample } from '@/types';
import { KnowledgeSchemaVersion } from '@/types/const';
import { fetchPullRequest, fetchFileContent, fetchPullRequestFiles } from '@/utils/github';
import yaml from 'js-yaml';
import axios from 'axios';
import { KnowledgeEditFormData, KnowledgeFormData, QuestionAndAnswerPair } from '@/types';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import KnowledgeFormGithub from '../../Knowledge/Github';
import { ValidatedOptions, Modal, ModalVariant, ModalBody } from '@patternfly/react-core';
import { fetchExistingKnowledgeDocuments } from '@/components/Contribute/Utils/documentUtils';
import { fetchDraftKnowledgeChanges } from '@/components/Contribute/Utils/autoSaveUtils';

interface EditKnowledgeClientComponentProps {
  prNumber: string;
  isDraft: boolean;
}

const EditKnowledge: React.FC<EditKnowledgeClientComponentProps> = ({ prNumber, isDraft }) => {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingMsg, setLoadingMsg] = useState<string>('');
  const [knowledgeEditFormData, setKnowledgeEditFormData] = useState<KnowledgeEditFormData>();
  const router = useRouter();

  useEffect(() => {
    if (isDraft) {
      fetchDraftKnowledgeChanges({ branchName: prNumber, setIsLoading, setLoadingMsg, setKnowledgeEditFormData });
      return;
    }

    setLoadingMsg('Fetching knowledge data from PR : ' + prNumber);
    const fetchPRData = async () => {
      if (session?.accessToken) {
        try {
          const prNum = parseInt(prNumber, 10);
          const prData = await fetchPullRequest(session.accessToken, prNum);

          // Create KnowledgeFormData from existing form.
          const knowledgeExistingFormData: KnowledgeFormData = {
            branchName: '',
            email: '',
            name: '',
            submissionSummary: '',
            filePath: '',
            seedExamples: [],
            knowledgeDocumentRepositoryUrl: '',
            knowledgeDocumentCommit: '',
            documentName: '',
            titleWork: '',
            linkWork: '',
            revision: '',
            licenseWork: '',
            creators: '',
            filesToUpload: [],
            uploadedFiles: []
          };

          const knowledgeEditFormData: KnowledgeEditFormData = {
            isEditForm: true,
            isSubmitted: true,
            version: KnowledgeSchemaVersion,
            formData: knowledgeExistingFormData,
            pullRequestNumber: prNum,
            oldFilesPath: ''
          };

          knowledgeExistingFormData.submissionSummary = prData.title;
          knowledgeExistingFormData.branchName = prData.head.ref; // Store the branch name from the pull request

          const prFiles: PullRequestFile[] = await fetchPullRequestFiles(session.accessToken, prNum);

          const foundYamlFile = prFiles.find((file: PullRequestFile) => file.filename.endsWith('.yaml'));
          if (!foundYamlFile) {
            throw new Error('No YAML file found in the pull request.');
          }
          const existingFilesPath = foundYamlFile.filename.split('/').slice(1, -1).join('/');

          // Set the current Yaml file path as a old files path
          knowledgeEditFormData.oldFilesPath = existingFilesPath + '/';

          const yamlContent = await fetchFileContent(session.accessToken, foundYamlFile.filename, prData.head.sha);
          const yamlData: KnowledgeYamlData = yaml.load(yamlContent) as KnowledgeYamlData;
          console.log('Parsed Knowledge YAML data:', yamlData);

          // Populate the form fields with YAML data
          knowledgeExistingFormData.knowledgeDocumentRepositoryUrl = yamlData.document.repo;
          knowledgeExistingFormData.knowledgeDocumentCommit = yamlData.document.commit;
          knowledgeExistingFormData.documentName = yamlData.document.patterns.join(', ');

          const seedExamples: KnowledgeSeedExample[] = [];
          yamlData.seed_examples.forEach((seed, index) => {
            // iterate through KnowledgeSeedExample and create a new object for each
            const example: KnowledgeSeedExample = {
              immutable: index < 5 ? true : false,
              isExpanded: true,
              context: seed.context,
              isContextValid: ValidatedOptions.success,
              questionAndAnswers: []
            };

            const qnaExamples: QuestionAndAnswerPair[] = seed.questions_and_answers.map((qa, index) => {
              const qna: QuestionAndAnswerPair = {
                question: qa.question,
                answer: qa.answer,
                immutable: index < 3 ? true : false,
                isQuestionValid: ValidatedOptions.success,
                isAnswerValid: ValidatedOptions.success
              };
              return qna;
            });
            example.questionAndAnswers = qnaExamples;
            seedExamples.push(example);
          });
          knowledgeExistingFormData.seedExamples = seedExamples;

          // Set the file path from the current YAML file (remove the root folder name from the path)
          const currentFilePath = foundYamlFile.filename.split('/').slice(1, -1).join('/');
          knowledgeEditFormData.formData.filePath = currentFilePath + '/';

          // Fetch and parse attribution file if it exists
          const foundAttributionFile = prFiles.find((file: PullRequestFile) => file.filename.includes('attribution'));
          if (foundAttributionFile) {
            const attributionContent = await fetchFileContent(session.accessToken, foundAttributionFile.filename, prData.head.sha);
            const attributionData = parseAttributionContent(attributionContent);
            console.log('Parsed knowledge attribution data:', attributionData);

            // Populate the form fields with attribution data
            knowledgeExistingFormData.titleWork = attributionData.title_of_work;
            knowledgeExistingFormData.linkWork = attributionData.link_to_work ? attributionData.link_to_work : '';
            knowledgeExistingFormData.revision = attributionData.revision ? attributionData.revision : '';
            knowledgeExistingFormData.licenseWork = attributionData.license_of_the_work;
            knowledgeExistingFormData.creators = attributionData.creator_names;
          }
          setKnowledgeEditFormData(knowledgeEditFormData);
          const existingFiles = await fetchExistingKnowledgeDocuments(true, knowledgeEditFormData.formData.knowledgeDocumentCommit);
          if (existingFiles.length != 0) {
            console.log(`Contribution has ${existingFiles.length} existing knowledge documents`);
            knowledgeExistingFormData.uploadedFiles.push(...existingFiles);
          }
          setIsLoading(false);
        } catch (error) {
          if (axios.isAxiosError(error)) {
            console.error('Error fetching pull request data:', error.response ? error.response.data : error.message);
            setLoadingMsg('Error fetching knowledge data from PR : ' + prNumber + '. Please try again.');
          } else if (error instanceof Error) {
            console.error('Error fetching pull request data:', error.message);
            setLoadingMsg('Error fetching knowledge data from PR : ' + prNumber + ' [' + error.message + ']' + '. Please try again.');
          }
        }
      }
    };
    fetchPRData();
  }, [session?.accessToken, prNumber]);

  const parseAttributionContent = (content: string): AttributionData => {
    const lines = content.split('\n');
    const attributionData: { [key: string]: string } = {};
    lines.forEach((line) => {
      const [key, ...value] = line.split(':');
      if (key && value) {
        // Remove spaces in the attribution field for parsing
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
      <Modal variant={ModalVariant.small} title="Loading Knowledge Data" isOpen={isLoading} onClose={() => handleOnClose()}>
        <ModalBody>
          <div>{loadingMsg}</div>
        </ModalBody>
      </Modal>
    );
  }

  return <KnowledgeFormGithub knowledgeEditFormData={knowledgeEditFormData} />;
};

export default EditKnowledge;
