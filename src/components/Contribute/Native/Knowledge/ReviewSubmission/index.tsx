// src/components/Contribute/Knowledge/ReviewSubmission/ReviewSubmission.tsx
import React from 'react';
import { KnowledgeFormData } from '@/components/Contribute/Native/Knowledge';

interface ReviewSubmissionProps {
  knowledgeFormData: KnowledgeFormData;
}

export const ReviewSubmission: React.FC<ReviewSubmissionProps> = ({ knowledgeFormData }) => {
  return (
    <div>
      <h2>Review Submission</h2>

      {/* Author Information */}
      <h3>Author Information</h3>
      <p>
        <strong>Name:</strong> {knowledgeFormData.name}
      </p>
      <p>
        <strong>Email:</strong> {knowledgeFormData.email}
      </p>

      {/* Knowledge Information */}
      <h3>Knowledge Information</h3>
      <p>
        <strong>Submission Summary:</strong> {knowledgeFormData.submissionSummary}
      </p>
      <p>
        <strong>Domain:</strong> {knowledgeFormData.domain}
      </p>
      <p>
        <strong>Document Outline:</strong> {knowledgeFormData.documentOutline}
      </p>

      {/* File Path Information */}
      <h3>File Path Information</h3>
      <p>
        <strong>File Path:</strong> {knowledgeFormData.filePath}
      </p>

      {/* Seed Examples */}
      <h3>Seed Examples</h3>
      {knowledgeFormData.seedExamples.map((seedExample, index) => (
        <div key={index}>
          <h4>Seed Example {index + 1}</h4>
          <p>
            <strong>Context:</strong> {seedExample.context}
          </p>
          {seedExample.questionAndAnswers.map((qa, qaIndex) => (
            <div key={qaIndex}>
              <p>
                <strong>Question {qaIndex + 1}:</strong> {qa.question}
              </p>
              <p>
                <strong>Answer {qaIndex + 1}:</strong> {qa.answer}
              </p>
            </div>
          ))}
        </div>
      ))}

      {/* Document Information */}
      <h3>Document Information</h3>
      <p>
        <strong>Repository URL:</strong> {knowledgeFormData.knowledgeDocumentRepositoryUrl}
      </p>
      <p>
        <strong>Commit:</strong> {knowledgeFormData.knowledgeDocumentCommit}
      </p>
      <p>
        <strong>Document Name:</strong> {knowledgeFormData.documentName}
      </p>

      {/* Attribution Information */}
      <h3>Attribution Information</h3>
      <p>
        <strong>Title of Work:</strong> {knowledgeFormData.titleWork}
      </p>
      <p>
        <strong>Link to Work:</strong> {knowledgeFormData.linkWork}
      </p>
      <p>
        <strong>Revision:</strong> {knowledgeFormData.revision}
      </p>
      <p>
        <strong>License of Work:</strong> {knowledgeFormData.licenseWork}
      </p>
      <p>
        <strong>Creators:</strong> {knowledgeFormData.creators}
      </p>
    </div>
  );
};

export default ReviewSubmission;
