// src/components/Contribute/Knowledge/ReviewSubmission/ReviewSubmission.tsx
import { KnowledgeFormData } from '@/types';
import React from 'react';

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
        <strong>Submission Summary:</strong> {knowledgeFormData.submissionSummary || 'N/A'}
      </p>
      <p>
        <strong>Domain:</strong> {knowledgeFormData.domain || 'N/A'}
      </p>
      <p>
        <strong>Document Outline:</strong> {knowledgeFormData.documentOutline || 'N/A'}
      </p>

      {/* File Path Information */}
      <h3>File Path Information</h3>
      <p>
        <strong>File Path:</strong> {knowledgeFormData.filePath || 'N/A'}
      </p>

      {/* Seed Examples */}
      <h3>Seed Examples</h3>
      {knowledgeFormData.seedExamples.map((seedExample, index) => (
        <div key={index}>
          <h4>Seed Example {index + 1}</h4>
          <p>
            <strong>Context:</strong> {seedExample.context || 'N/A'}
          </p>
          {seedExample.questionAndAnswers.map((qa, qaIndex) => (
            <div key={qaIndex}>
              <p>
                <strong>Question {qaIndex + 1}:</strong> {qa.question || 'N/A'}
              </p>
              <p>
                <strong>Answer {qaIndex + 1}:</strong> {qa.answer || 'N/A'}
              </p>
            </div>
          ))}
        </div>
      ))}

      {/* Document Information */}
      <h3>Document Information</h3>
      {knowledgeFormData.knowledgeDocumentRepositoryUrl && knowledgeFormData.knowledgeDocumentCommit ? (
        <div>
          <p>
            <strong>Repository URL:</strong> {knowledgeFormData.knowledgeDocumentRepositoryUrl}
          </p>
          <p>
            <strong>Commit SHA:</strong> {knowledgeFormData.knowledgeDocumentCommit}
          </p>
          <p>
            <strong>Document Names:</strong> {knowledgeFormData.documentName || 'N/A'}
          </p>
        </div>
      ) : (
        <p>No Document Information Provided.</p>
      )}

      {/* Attribution Information */}
      <h3>Attribution Information</h3>
      <p>
        <strong>Title of Work:</strong> {knowledgeFormData.titleWork || 'N/A'}
      </p>
      <p>
        <strong>Link to Work:</strong> {knowledgeFormData.linkWork || 'N/A'}
      </p>
      <p>
        <strong>Revision:</strong> {knowledgeFormData.revision || 'N/A'}
      </p>
      <p>
        <strong>License of Work:</strong> {knowledgeFormData.licenseWork || 'N/A'}
      </p>
      <p>
        <strong>Creators:</strong> {knowledgeFormData.creators || 'N/A'}
      </p>
    </div>
  );
};

export default ReviewSubmission;
