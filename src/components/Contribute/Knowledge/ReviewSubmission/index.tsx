// src/components/Contribute/Knowledge/ReviewSubmission/ReviewSubmission.tsx
import { KnowledgeFormData } from '@/types';
import { Content, ContentVariants } from '@patternfly/react-core';
import React from 'react';

interface ReviewSubmissionProps {
  knowledgeFormData: KnowledgeFormData;
}

export const ReviewSubmission: React.FC<ReviewSubmissionProps> = ({ knowledgeFormData }) => {
  return (
    <div>
      <Content component={ContentVariants.h2}>Review Submission</Content>
      {/* Author Information */}
      <p>
        <strong>Author Information</strong>
      </p>
      <p>
        <i>Name:</i> {knowledgeFormData.name}
      </p>
      <p>
        <i>Email:</i> {knowledgeFormData.email}
      </p>

      {/* Knowledge Information */}
      <h3>Knowledge Information</h3>
      <p>
        <strong>Knowledge Information</strong>
      </p>
      <p>
        <i>Submission Summary:</i> {knowledgeFormData.submissionSummary}
      </p>
      <p>
        <i>Domain:</i> {knowledgeFormData.domain}
      </p>
      <p>
        <i>Document Outline:</i> {knowledgeFormData.documentOutline}
      </p>

      {/* File Path Information */}
      <p>
        <strong>File Path Information</strong>
      </p>

      <p>
        <i>File Path:</i> {knowledgeFormData.filePath}
      </p>

      {/* Seed Examples */}
      <p>
        <strong>Seed Examples</strong>
      </p>

      {knowledgeFormData.seedExamples.map((seedExample, index) => (
        <div key={index}>
          <strong>Seed Example {index + 1}</strong>
          <p>
            <i>Context:</i> {seedExample.context}
          </p>
          {seedExample.questionAndAnswers.map((qa, qaIndex) => (
            <div key={qaIndex}>
              <p>
                <i>Question {qaIndex + 1}:</i> {qa.question}
              </p>
              <p>
                <i>Answer {qaIndex + 1}:</i> {qa.answer}
              </p>
            </div>
          ))}
        </div>
      ))}

      {/* Document Information */}
      <p>
        <strong>Document Information</strong>
      </p>

      <p>
        <i>Repository URL:</i> {knowledgeFormData.knowledgeDocumentRepositoryUrl}
      </p>
      <p>
        <i>Commit:</i> {knowledgeFormData.knowledgeDocumentCommit}
      </p>
      <p>
        <i>Document Name:</i> {knowledgeFormData.documentName}
      </p>

      {/* Attribution Information */}
      <p>
        <strong>Attribution Information</strong>
      </p>

      <p>
        <i>Title of Work:</i> {knowledgeFormData.titleWork}
      </p>
      <p>
        <i>Link to Work:</i> {knowledgeFormData.linkWork}
      </p>
      <p>
        <i>Revision:</i> {knowledgeFormData.revision}
      </p>
      <p>
        <i>License of Work:</i> {knowledgeFormData.licenseWork}
      </p>
      <p>
        <i>Creators:</i> {knowledgeFormData.creators}
      </p>
    </div>
  );
};

export default ReviewSubmission;
