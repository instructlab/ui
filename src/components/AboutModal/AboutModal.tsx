import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { AboutModal, Content, Button, ContentVariants, Flex, FlexItem } from '@patternfly/react-core';
import { GithubIcon } from '@patternfly/react-icons';
import { t_global_font_size_lg as FontSizeLg } from '@patternfly/react-tokens';
import InstructLabLogo from '../../../public/InstructLab-About-Modal-Background.svg';
import InstructLabAboutUsBg from '../../../public/InstructLab-About-Modal-Background.svg';
import { linksData } from './data/linksData';

import './AboutModal.css';

const AboutInstructLab = ({ isOpen, setIsOpen }: AboutModalProps) => {
  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  return (
    <AboutModal
      className="il-modal"
      isOpen={isOpen}
      onClose={handleClose}
      backgroundImageSrc={InstructLabAboutUsBg.src}
      brandImageSrc={InstructLabLogo.src}
      brandImageAlt="logo"
      aria-label="About modal describing the InstructLab project."
    >
      <Flex className="il-modal--content" direction={{ default: 'column' }} gap={{ default: 'gap2xl' }}>
        <FlexItem>
          <Content component="h1" className="il-modal--text">
            About InstructLab
          </Content>
          <Content component="p" className="il-modal--text" style={{ fontSize: FontSizeLg.var }}>
            InstructLab is an open source AI project that allows <br /> you to shape the future of Large Language Models.
            <br /> Join the community to start contributing today.
          </Content>
          <Button
            className="il-modal--joinCommunityButton"
            variant="primary"
            icon={<GithubIcon />}
            iconPosition="left"
            size="lg"
            onClick={() => window.open('https://github.com/instructlab', '_blank', 'noopener,noreferrer')}
          >
            Join the community
          </Button>
        </FlexItem>
        <FlexItem>
          <Flex
            className="il-modal--content"
            direction={{ default: 'column' }}
            alignItems={{ default: 'alignItemsCenter' }}
            gap={{ default: 'gapMd' }}
          >
            <FlexItem>
              {linksData.map((link) => (
                <Button key={link.name} className="il-modal--link" component="a" href={link.href} target="_blank" isInline variant="link">
                  {link.name}
                </Button>
              ))}
            </FlexItem>
            <FlexItem>
              <Button
                className="il-modal--link"
                component="a"
                href="https://www.redhat.com/en/about/terms-use"
                target="_blank"
                isInline
                variant="link"
              >
                Terms of use
              </Button>
              <Button
                className="il-modal--link"
                component="a"
                href="https://www.redhat.com/en/about/privacy-policy"
                target="_blank"
                isInline
                variant="link"
              >
                Privacy Policy
              </Button>
            </FlexItem>
            <FlexItem>
              <Content className="il-modal--text" component={ContentVariants.small}>
                © InstructLab | Version 1.0.0 Beta
              </Content>
            </FlexItem>
          </Flex>
        </FlexItem>
      </Flex>
    </AboutModal>
  );
};

type AboutModalProps = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
};

export default AboutInstructLab;
