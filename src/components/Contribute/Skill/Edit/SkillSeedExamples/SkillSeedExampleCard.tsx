// src/components/Contribute/Skill/View/ViewSkillSeedExample.tsx
import React from 'react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  FlexItem,
  Icon,
  MenuToggle,
  MenuToggleElement,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader
} from '@patternfly/react-core';
import { AngleDownIcon, AngleRightIcon, EllipsisVIcon } from '@patternfly/react-icons';
import { t_global_color_status_danger_default as RequiredColor, t_global_font_size_body_sm as RequiredFontSize } from '@patternfly/react-tokens';
import { SkillSeedExample } from '@/types';
import SkillQuestionAnswerPairs from '@/components/Contribute/Skill/Edit/SkillSeedExamples/SkillQuestionAnswerPairs';
import { createEmptySkillSeedExample } from '@/components/Contribute/Utils/seedExampleUtils';

interface Props {
  seedExample: SkillSeedExample;
  onUpdateSeedExample: (seedExampleIndex: number, updated: SkillSeedExample) => void;
  seedExampleIndex: number;
  handleContextInputChange: (seedExampleIndex: number, contextValue: string, validate?: boolean) => void;
  handleQuestionInputChange: (seedExampleIndex: number, questionValue: string) => void;
  handleQuestionBlur: (seedExampleIndex: number) => void;
  handleAnswerInputChange: (seedExampleIndex: number, answerValue: string) => void;
  handleAnswerBlur: (seedExampleIndex: number) => void;
  onDeleteSeedExample: () => void;
}

const SkillSeedExampleCard: React.FC<Props> = ({
  seedExample,
  seedExampleIndex,
  onUpdateSeedExample,
  handleContextInputChange,
  handleQuestionInputChange,
  handleQuestionBlur,
  handleAnswerInputChange,
  handleAnswerBlur,
  onDeleteSeedExample
}) => {
  const [actionsOpen, setActionsOpen] = React.useState<boolean>(false);
  const [showClearConfirmation, setShowClearConfirmation] = React.useState<boolean>(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = React.useState<boolean>(false);

  const isEmpty =
    !seedExample.context?.trim().length &&
    seedExample.questionAndAnswer.question.trim().length === 0 &&
    seedExample.questionAndAnswer.answer.trim().length === 0;

  const toggleSeedExampleExpansion = (): void => {
    onUpdateSeedExample(seedExampleIndex, { ...seedExample, isExpanded: !seedExample.isExpanded });
  };

  const clearSeedExample = () => {
    onUpdateSeedExample(seedExampleIndex, createEmptySkillSeedExample());
    setShowClearConfirmation(false);
  };

  const onClear = () => {
    setActionsOpen(false);
    setShowClearConfirmation(true);
  };

  const onDelete = () => {
    setActionsOpen(false);
    if (isEmpty) {
      onDeleteSeedExample();
      return;
    }
    setShowDeleteConfirmation(true);
  };

  const actions = (
    <Dropdown
      isOpen={actionsOpen}
      onOpenChange={(isOpen: boolean) => setActionsOpen(isOpen)}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          aria-label="more actions"
          variant="plain"
          onClick={() => setActionsOpen((prev) => !prev)}
          isExpanded={actionsOpen}
          icon={<EllipsisVIcon />}
        />
      )}
      popperProps={{ position: 'right' }}
    >
      <DropdownList>
        <DropdownItem className={!isEmpty ? 'destructive-action-item' : undefined} isDisabled={isEmpty} onClick={onClear} aria-disabled={isEmpty}>
          Clear seed example
        </DropdownItem>
        <DropdownItem
          className={!seedExample.questionAndAnswer.immutable ? 'destructive-action-item' : undefined}
          isDisabled={seedExample.questionAndAnswer.immutable}
          onClick={onDelete}
        >
          Remove seed example
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  );

  return (
    <Card>
      <CardHeader actions={{ actions }}>
        <CardTitle>
          <Flex gap={{ default: 'gapMd' }}>
            <FlexItem>
              <Button
                variant="link"
                isInline
                onClick={toggleSeedExampleExpansion}
                aria-label={`Expand seed example ${seedExampleIndex + 1}`}
                icon={<Icon>{seedExample.isExpanded ? <AngleDownIcon /> : <AngleRightIcon />}</Icon>}
              />
            </FlexItem>
            <FlexItem>
              <Flex gap={{ default: 'gapXs' }} alignItems={{ default: 'alignItemsFlexStart' }} flexWrap={{ default: 'nowrap' }}>
                <FlexItem>
                  Seed example {seedExampleIndex + 1}{' '}
                  {seedExample.immutable ? <span style={{ color: RequiredColor.var, fontSize: RequiredFontSize.var }}>*</span> : null}
                </FlexItem>
              </Flex>
            </FlexItem>
          </Flex>
        </CardTitle>
      </CardHeader>
      {seedExample.isExpanded ? (
        <CardBody>
          <SkillQuestionAnswerPairs
            seedExample={seedExample}
            seedExampleIndex={seedExampleIndex}
            handleContextInputChange={handleContextInputChange}
            handleQuestionInputChange={handleQuestionInputChange}
            handleQuestionBlur={handleQuestionBlur}
            handleAnswerInputChange={handleAnswerInputChange}
            handleAnswerBlur={handleAnswerBlur}
          />
        </CardBody>
      ) : null}
      {showClearConfirmation || showDeleteConfirmation ? (
        <Modal
          isOpen
          variant="small"
          aria-labelledby="clear-warning-title"
          aria-describedby="clear-warning-message"
          onClose={() => (showClearConfirmation ? setShowClearConfirmation(false) : setShowDeleteConfirmation(false))}
        >
          <ModalHeader
            title={
              <span>
                {showClearConfirmation ? 'Clear' : 'Remove'} <strong>Seed example {seedExampleIndex + 1}</strong>?
              </span>
            }
            labelId="clear-warning-title"
            titleIconVariant={showClearConfirmation ? 'warning' : 'danger'}
          />
          <ModalBody id="clear-warning-message">The question, answer, and context will be lost</ModalBody>
          <ModalFooter>
            <Button
              variant={showClearConfirmation ? 'primary' : 'danger'}
              onClick={() => (showClearConfirmation ? clearSeedExample() : onDeleteSeedExample())}
            >
              {showClearConfirmation ? 'Clear' : 'Remove'}
            </Button>
            <Button variant="secondary" onClick={() => (showClearConfirmation ? setShowClearConfirmation(false) : setShowDeleteConfirmation(false))}>
              Cancel
            </Button>
          </ModalFooter>
        </Modal>
      ) : null}
    </Card>
  );
};

export default SkillSeedExampleCard;
