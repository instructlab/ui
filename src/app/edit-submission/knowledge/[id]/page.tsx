// src/app/edit-submission/knowledge/[id]/page.tsx
'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { AppLayout } from '../../../../components/AppLayout';
import { AttributionData, PullRequestFile, KnowledgeYamlData } from '@/types';
import { KnowledgeSchemaVersion } from '@/types/const';
import { fetchPullRequest, fetchFileContent, fetchPullRequestFiles } from '../../../../utils/github';
import yaml from 'js-yaml';
import axios from 'axios';
import KnowledgeForm, { KnowledgeEditFormData, KnowledgeFormData, QuestionAndAnswerPair, SeedExample } from '@/components/Contribute/Knowledge';
import { ValidatedOptions } from '@patternfly/react-core/dist/esm/helpers/constants';
import { useEffect, useState } from 'react';
import { Modal, ModalVariant } from '@patternfly/react-core/dist/esm/components/Modal/Modal';
import { useRouter } from 'next/navigation';

const EditKnowledgePage: React.FunctionComponent<{ params: { id: string } }> = ({ params }) => {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingMsg, setLoadingMsg] = useState<string>('');
  const [knowledgeEditFormData, setKnowledgeEditFormData] = useState<KnowledgeEditFormData>();
  const prNumber = parseInt(params.id, 10);
  const router = useRouter();

  useEffect(() => {
    setLoadingMsg('Fetching knowledge data from PR : ' + prNumber);
    const fetchPRData = async () => {
      if (session?.accessToken) {
        try {
          const prData = await fetchPullRequest(session.accessToken, prNumber);

          // Create KnowledgeFormData from existing form.
          const knowledgeExistingFormData: KnowledgeFormData = {
            email: '',
            name: '',
            submissionSummary: '',
            domain: '',
            documentOutline: '',
            filePath: '',
            seedExamples: [],
            knowledgeDocumentRepositoryUrl: '',
            knowledgeDocumentCommit: '',
            documentName: '',
            titleWork: '',
            linkWork: '',
            revision: '',
            licenseWork: '',
            creators: ''
          };

          const knowledgeEditFormData: KnowledgeEditFormData = {
            isEditForm: true,
            knowledgeVersion: KnowledgeSchemaVersion,
            branchName: '',
            knowledgeFormData: knowledgeExistingFormData,
            pullRequestNumber: prNumber,
            yamlFile: { filename: '' },
            attributionFile: { filename: '' }
          };

          knowledgeExistingFormData.submissionSummary = prData.title;
          knowledgeEditFormData.branchName = prData.head.ref; // Store the branch name from the pull request

          const prFiles: PullRequestFile[] = await fetchPullRequestFiles(session.accessToken, prNumber);

          const foundYamlFile = prFiles.find((file: PullRequestFile) => file.filename.endsWith('.yaml'));
          if (!foundYamlFile) {
            throw new Error('No YAML file found in the pull request.');
          }
          knowledgeEditFormData.yamlFile = foundYamlFile;

          const yamlContent = await fetchFileContent(session.accessToken, foundYamlFile.filename, prData.head.sha);
          const yamlData: KnowledgeYamlData = yaml.load(yamlContent) as KnowledgeYamlData;
          console.log('Parsed YAML data:', yamlData);

          // Populate the form fields with YAML data
          knowledgeExistingFormData.documentOutline = yamlData.document_outline;
          knowledgeExistingFormData.domain = yamlData.domain;
          knowledgeExistingFormData.knowledgeDocumentRepositoryUrl = yamlData.document.repo;
          knowledgeExistingFormData.knowledgeDocumentCommit = yamlData.document.commit;
          knowledgeExistingFormData.documentName = yamlData.document.patterns.join(', ');

          const seedExamples: SeedExample[] = [];
          yamlData.seed_examples.forEach((seed, index) => {
            // iterate through questions_and_answers and create a new object for each
            const example: SeedExample = {
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
          knowledgeEditFormData.knowledgeFormData.filePath = currentFilePath + '/';

          // Fetch and parse attribution file if it exists
          const foundAttributionFile = prFiles.find((file: PullRequestFile) => file.filename.includes('attribution'));
          if (foundAttributionFile) {
            const attributionContent = await fetchFileContent(session.accessToken, foundAttributionFile.filename, prData.head.sha);
            const attributionData = parseAttributionContent(attributionContent);
            console.log('Parsed attribution data:', attributionData);

            knowledgeEditFormData.attributionFile = foundAttributionFile;
            // Populate the form fields with attribution data
            knowledgeExistingFormData.titleWork = attributionData.title_of_work;
            knowledgeExistingFormData.linkWork = attributionData.link_to_work ? attributionData.link_to_work : '';
            knowledgeExistingFormData.revision = attributionData.revision ? attributionData.revision : '';
            knowledgeExistingFormData.licenseWork = attributionData.license_of_the_work;
            knowledgeExistingFormData.creators = attributionData.creator_names;
          }
          setKnowledgeEditFormData(knowledgeEditFormData);
          setIsLoading(false);
        } catch (error) {
          if (axios.isAxiosError(error)) {
            console.error('Error fetching pull request data:', error.response ? error.response.data : error.message);
            setLoadingMsg('Error fetching knowledge data from PR : ' + prNumber) + '. Please try again.';
          } else if (error instanceof Error) {
            console.error('Error fetching pull request data:', error.message);
            setLoadingMsg('Error fetching knowledge data from PR : ' + prNumber + ' [' + error.message + ']') + '. Please try again.';
          }
        }
      }
    };
    fetchPRData();
  }, [session, prNumber]);

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
      <AppLayout>
        <Modal variant={ModalVariant.small} title="Loading Knowledge Data" isOpen={isLoading} onClose={() => handleOnClose()}>
          <div>{loadingMsg}</div>
        </Modal>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <KnowledgeForm knowledgeEditFormData={knowledgeEditFormData} />
    </AppLayout>
  );
};

export default EditKnowledgePage;
