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
    <section>
      <Content component={ContentVariants.h3}>Review</Content>
      <p>Review the information below and click finish to submit your knowledge contribution. Use the back button to make changes</p>
      {/* Author Information */}
      <article>
        <p>Contributor Information</p>
        <p>Information required for a Github Developer Certificate of Origin (OC)) sign-off.</p>

        <strong>Contributors</strong>
        <p>{skillFormData.name}</p>
        <p>{skillFormData.email}</p>
      </article>

      {/* Knowledge Information */}
      <article>
        <p>Knowledge Information</p>
        <p>Brief information about the Knowledge and the directory path for the QnA and Attribution files.</p>

        <strong>Submission summary</strong>
        <p>{skillFormData.submissionSummary}</p>

        <strong>Directory path</strong>
        <p>{skillFormData.filePath}</p>
      </article>

      {/* Seed Examples */}
      <article>
        <p>Seed data</p>
        <p>Data that will be used to start teaching your model.</p>
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
      </article>

      <article>
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
      </article>
    </section>
  );
};

export default ReviewSubmission;
