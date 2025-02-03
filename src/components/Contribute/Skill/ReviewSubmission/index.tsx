// src/components/Contribute/Skill/ReviewSubmission/ReviewSubmission.tsx
import { SkillFormData } from '@/types';
import { Content, ContentVariants } from '@patternfly/react-core';
import React from 'react';

interface ReviewSubmissionProps {
  skillFormData: SkillFormData;
  isGithubMode: boolean;
}

export const ReviewSubmission: React.FC<ReviewSubmissionProps> = ({ skillFormData, isGithubMode }) => {
  return (
    <div>
      <Content component={ContentVariants.h2}>Review Submission</Content>
      {/* Author Information */}
      <p>
        <strong>Author Information</strong>
      </p>
      <p>
        <i>Name:</i> {skillFormData.name}
      </p>
      <p>
        <i>Email:</i> {skillFormData.email}
      </p>

      {/* Skill Information */}
      <p>
        <strong>Skill Information</strong>
      </p>
      <p>
        <i>Submission Summary:</i> {skillFormData.submissionSummary}
      </p>
      <p>
        <i>Document Outline:</i> {skillFormData.documentOutline}
      </p>

      {/* File Path Information */}
      <p>
        <strong>File Path Information</strong>
      </p>
      <p>
        <i>File Path:</i> {skillFormData.filePath}
      </p>

      {/* Seed Examples */}
      <p>
        <strong>Seed Examples</strong>
      </p>
      {skillFormData.seedExamples.map((seedExample, index) => (
        <div key={index}>
          <p>
            <strong>Seed Examples {index + 1}</strong>
          </p>
          <p>
            <i>Context:</i> {seedExample.context}
          </p>
          <p>
            <i>Question {index + 1}:</i> {seedExample.question}
          </p>
          <p>
            <i>Answer {index + 1}:</i> {seedExample.answer}
          </p>
        </div>
      ))}

      {/* Attribution Information */}
      {isGithubMode && (
        <div>
          <p>
            <strong>Attribution Information</strong>
          </p>
          <p>
            <i>Title of Work:</i> {skillFormData.titleWork}
          </p>
          <p>
            <i>License of Work:</i> {skillFormData.licenseWork}
          </p>
          <p>
            <i>Creators:</i> {skillFormData.creators}
          </p>
        </div>
      )}
    </div>
  );
};

export default ReviewSubmission;
