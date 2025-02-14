// src/components/Contribute/Knowledge/ReviewSubmission/ReviewSubmission.tsx
import { KnowledgeFormData } from '@/types';
import { Content, ContentVariants, Form } from '@patternfly/react-core';
import React from 'react';
import '../../Skill/ReviewSubmission/submission.css';
import { Accordion, AccordionContent, AccordionItem, AccordionToggle } from '@patternfly/react-core';

interface ReviewSubmissionProps {
  knowledgeFormData: KnowledgeFormData;
  isGithubMode: boolean;
}

export const ReviewSubmission: React.FC<ReviewSubmissionProps> = ({ knowledgeFormData, isGithubMode }) => {
  const [expanded, setExpanded] = React.useState<{ [key: string]: boolean }>({});

  const onToggle = (id: number) => {
    setExpanded((prevState) => ({
      ...prevState,
      [id]: !prevState[id]
    }));
  };

  return (
    <Form>
      <section className="review-submission-container">
        <Content component={ContentVariants.h2}>Review</Content>
        {/* Author Information */}
        <article>
          <div className="info-wrapper">
            <p className="submission-titles">Author Information</p>
          </div>
        </article>

        <div className="contributors-wrapper">
          <p>
            <i>Name:</i> {knowledgeFormData.name}
          </p>
          <p>
            <i>Email:</i> {knowledgeFormData.email}
          </p>
        </div>

        {/* Knowledge Information */}
        <article>
          <div className="info-wrapper">
            <p className="submission-titles">Knowledge Information</p>
            <p className="submission-subtitles">Brief information about the Knowledge and the directory path for the QnA and Attribution files.</p>
          </div>
          <h5 className="category-titles">Submission summary</h5>
          <p>{knowledgeFormData.submissionSummary}</p>
          <h5 className="category-titles">Domain</h5>
          <p>{knowledgeFormData.domain}</p>
          <h5 className="category-titles">Document Outline</h5>
          <p>{knowledgeFormData.documentOutline}</p>
        </article>

        <article>
          {/* File Path Information */}
          <h5 className="category-titles">File Path Information</h5>

          <p>{knowledgeFormData.filePath}</p>
        </article>

        {/* Seed Examples */}
        <p>
          <strong>Seed Examples</strong>
        </p>

        {knowledgeFormData.seedExamples.map((seedExample, index) => (
          <Accordion asDefinitionList={false} className="accordion-wrapper" key={index}>
            <AccordionItem isExpanded={!!expanded[index]} key={index}>
              <AccordionToggle onClick={() => onToggle(index)} id={`seed-example-toggle-${index}`} className="accordion-toggle-item">
                Seed Example {index + 1}
              </AccordionToggle>
              <AccordionContent id={`seed-example-content-${index}`}>
                <div className="accordion-content">
                  <h5 className="seed-category-titles">Context:</h5> {seedExample.context}
                </div>
                {seedExample.questionAndAnswers.map((qa, qaIndex) => (
                  <>
                    <div className="accordion-content" key={qaIndex}>
                      <h5 className="seed-category-titles">Question:</h5> {qa.question}
                    </div>
                    <div className="accordion-content" key={qaIndex}>
                      <h5 className="seed-category-titles">Answer:</h5> {qa.answer}
                    </div>
                  </>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ))}

        {/* Document Information */}
        <article>
          <h5 className="category-titles">Document Information</h5>
          <h5 className="category-titles">Repository URL</h5>
          <p>{knowledgeFormData.knowledgeDocumentRepositoryUrl}</p>
          <h5 className="category-titles">Commit</h5>
          <p>{knowledgeFormData.knowledgeDocumentCommit}</p>
          <h5 className="category-titles">Commit</h5>
          <p>{knowledgeFormData.documentName}</p>
        </article>

        <article className="info-wrapper">
          {/* Attribution Information */}
          {isGithubMode && (
            <div>
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
          )}
        </article>
      </section>
    </Form>
  );
};

export default ReviewSubmission;
