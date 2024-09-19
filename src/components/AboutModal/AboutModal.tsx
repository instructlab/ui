import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { AboutModal as PatternflyAboutModal } from '@patternfly/react-core/dist/esm/components/AboutModal';
import { Text, TextContent, TextVariants } from '@patternfly/react-core/dist/dynamic/components/Text';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import GithubIcon from '@patternfly/react-icons/dist/dynamic/icons/github-icon';
import InstructLabLogo from '../../../public/updated-logo.png';
import InstructLabAboutUsBg from '../../../public/InstructLab-About-Modal-Background.svg';
import styles from './about-modal.module.css';
import { linksData } from './data/linksData';

const AboutModal = ({ isOpen, setIsOpen }: AboutModalProps) => {
  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  return (
    <PatternflyAboutModal
      className={styles.modal}
      isOpen={isOpen}
      onClose={handleClose}
      backgroundImageSrc={InstructLabAboutUsBg.src}
      brandImageSrc={InstructLabLogo.src}
      brandImageAlt="logo"
    >
      <div className={styles.modalContent}>
        <div>
          <TextContent>
            <Text component={TextVariants.h1} className={styles.heading}>
              About InstructLab
            </Text>
            <Text className={styles.description}>
              InstructLab is an open source AI project that allows you shape the future of Large Language Models. Join the community to start
              contributing today.
            </Text>
          </TextContent>
        </div>
        <div className={styles.joinCommunityButtonWrapper}>
          <Button variant="primary" icon={<GithubIcon />} iconPosition="left" size="lg" className={styles.joinCommunityButton}>
            Join the community
          </Button>
        </div>
        <div className={styles.links}>
          {linksData.map((link) => (
            <a href={link.href} target="_blank" key={link.name} className={styles.link}>
              {link.name}
            </a>
          ))}
        </div>
        <TextContent>
          <Text className={styles.version} component={TextVariants.p}>
            © InstructLab | Version 1.1
          </Text>
        </TextContent>
      </div>
    </PatternflyAboutModal>
  );
};

type AboutModalProps = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
};

export default AboutModal;
