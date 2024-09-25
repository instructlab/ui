import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { Text, TextContent, TextVariants } from '@patternfly/react-core/dist/dynamic/components/Text';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import GithubIcon from '@patternfly/react-icons/dist/dynamic/icons/github-icon';
import InstructLabLogo from '../../../public/updated-logo.png';
import InstructLabAboutUsBg from '../../../public/InstructLab-About-Modal-Background.svg';
import styles from './about-modal.module.css';
import { linksData } from './data/linksData';
import { AboutModal } from '@patternfly/react-core/dist/esm/components/AboutModal';

const AboutInstructLab = ({ isOpen, setIsOpen }: AboutModalProps) => {
  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  return (
    <AboutModal
      className={styles.modal}
      isOpen={isOpen}
      onClose={handleClose}
      backgroundImageSrc={InstructLabAboutUsBg.src}
      brandImageSrc={InstructLabLogo.src}
      brandImageAlt="logo"
      aria-label="About modal describing the InstructLab project."
    >
      <div className={styles.modalContent}>
        <div>
          <TextContent>
            <Text className={styles.aboutInstructlab}>About InstructLab</Text>
          </TextContent>
          <TextContent>
            <Text className={styles.description}>
              InstructLab is an open source AI project that allows <br /> you to shape the future of Large Language Models.
              <br /> Join the community to start contributing today.
            </Text>
          </TextContent>
        </div>
        <a className={styles.joinCommunityButtonWrapper} href="https://github.com/instructlab" target="_blank">
          <Button variant="primary" icon={<GithubIcon />} iconPosition="left" size="lg" className={styles.joinCommunityButton}>
            Join the community
          </Button>
        </a>
        <div className={styles.links}>
          {linksData.map((link) => (
            <a href={link.href} target="_blank" key={link.name} className={styles.link}>
              {link.name}
            </a>
          ))}
        </div>
        <TextContent>
          <Text className={styles.version} component={TextVariants.p}>
            © InstructLab | Version 1.0.0 Beta
          </Text>
        </TextContent>
      </div>
    </AboutModal>
  );
};

type AboutModalProps = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
};

export default AboutInstructLab;
