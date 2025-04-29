// src/app/components/contribute/EditKnowledge/native/EditKnowledge.tsx
'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { AttributionData, KnowledgeSeedExample, KnowledgeYamlData } from '@/types';
import { KnowledgeSchemaVersion } from '@/types/const';
import yaml from 'js-yaml';
import { KnowledgeEditFormData, KnowledgeFormData, QuestionAndAnswerPair } from '@/types';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ValidatedOptions, Modal, ModalVariant, ModalBody } from '@patternfly/react-core';
import KnowledgeFormNative from '../../Knowledge/Native';
import { fetchExistingKnowledgeDocuments } from '@/components/Contribute/Utils/documentUtils';
import { fetchDraftKnowledgeChanges } from '@/components/Contribute/Utils/autoSaveUtils';

interface ChangeData {
  file: string;
  status: string;
  content?: string;
  commitSha?: string;
}

interface EditKnowledgeClientComponentProps {
  branchName: string;
  isDraft: boolean;
}

const EditKnowledgeNative: React.FC<EditKnowledgeClientComponentProps> = ({ branchName, isDraft }) => {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingMsg, setLoadingMsg] = useState<string>('');
  const [knowledgeEditFormData, setKnowledgeEditFormData] = useState<KnowledgeEditFormData>();
  const router = useRouter();

  useEffect(() => {
    if (isDraft) {
      fetchDraftKnowledgeChanges({ branchName, setIsLoading, setLoadingMsg, setKnowledgeEditFormData });
      return;
    }

    setLoadingMsg('Fetching knowledge data from branch : ' + branchName);
    const fetchBranchChanges = async () => {
      try {
        const response = await fetch('/api/native/git/branches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ branchName, action: 'diff' })
        });

        const result = await response.json();
        if (response.ok) {
          // Create KnowledgeFormData from existing form.
          const knowledgeExistingFormData: KnowledgeFormData = {
            branchName: branchName,
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
            pullRequestNumber: 0,
            oldFilesPath: ''
          };

          if (session?.user?.name && session?.user?.email) {
            knowledgeExistingFormData.name = session?.user?.name;
            knowledgeExistingFormData.email = session?.user?.email;
          }

          if (result?.commitDetails != null) {
            knowledgeExistingFormData.submissionSummary = result?.commitDetails.message;
            knowledgeExistingFormData.name = result?.commitDetails.name;
            knowledgeExistingFormData.email = result?.commitDetails.email;
          }

          if (result?.changes.length > 0) {
            result.changes.forEach((change: ChangeData) => {
              if (change.status != 'deleted' && change.content) {
                if (change.file.includes('qna.yaml')) {
                  const yamlData: KnowledgeYamlData = yaml.load(change.content) as KnowledgeYamlData;
                  console.log('Parsed Knowledge YAML data:', yamlData);
                  // Populate the form fields with YAML data
                  knowledgeExistingFormData.knowledgeDocumentRepositoryUrl = yamlData.document.repo;
                  knowledgeExistingFormData.knowledgeDocumentCommit = yamlData.document.commit;
                  knowledgeExistingFormData.documentName = yamlData.document.patterns.join(', ');

                  const seedExamples: KnowledgeSeedExample[] = [];
                  yamlData.seed_examples.forEach((seed, index) => {
                    // iterate through questions_and_answers and create a new object for each
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
                  const currentFilePath = change.file.split('/').slice(1, -1).join('/');
                  knowledgeExistingFormData.filePath = currentFilePath + '/';

                  // Set the oldFilesPath to the existing qna.yaml file path.
                  knowledgeEditFormData.oldFilesPath = knowledgeExistingFormData.filePath;
                }
                if (change.file.includes('attribution.txt')) {
                  const attributionData = parseAttributionContent(change.content);
                  console.log('Parsed knowledge attribution data:', attributionData);

                  // Populate the form fields with attribution data
                  knowledgeExistingFormData.titleWork = attributionData.title_of_work;
                  knowledgeExistingFormData.linkWork = attributionData.link_to_work ? attributionData.link_to_work : '';
                  knowledgeExistingFormData.revision = attributionData.revision ? attributionData.revision : '';
                  knowledgeExistingFormData.licenseWork = attributionData.license_of_the_work;
                  knowledgeExistingFormData.creators = attributionData.creator_names;
                }
              }
            });
            setKnowledgeEditFormData(knowledgeEditFormData);
            const existingFiles = await fetchExistingKnowledgeDocuments(false, knowledgeEditFormData.formData.knowledgeDocumentCommit);
            if (existingFiles.length != 0) {
              console.log(`Contribution has ${existingFiles.length} existing knowledge documents`);
              knowledgeExistingFormData.uploadedFiles.push(...existingFiles);
            }
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('Error fetching branch changes:', error);
      }
    };
    fetchBranchChanges();
  }, [branchName, isDraft, session?.user?.email, session?.user?.name]);

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

  return <KnowledgeFormNative knowledgeEditFormData={knowledgeEditFormData} />;
};

export default EditKnowledgeNative;
