import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { Content, ContentVariants } from '@patternfly/react-core/dist/dynamic/components/Content';
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
          <Content>
            <Content component="p" className={styles.aboutInstructlab}>
              About InstructLab
            </Content>
          </Content>
          <Content>
            <Content component="p" className={styles.description}>
              InstructLab is an open source AI project that allows <br /> you to shape the future of Large Language Models.
              <br /> Join the community to start contributing today.
            </Content>
          </Content>
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
        <Content>
          <Content className={styles.version} component={ContentVariants.p}>
            © InstructLab | Version 1.0.0 Beta
          </Content>
          <Content component="p" className={styles.links}>
            <a href="https://www.redhat.com/en/about/terms-use" style={{ color: 'white', textDecoration: 'underline' }} target="_blank">
              Terms of use
            </a>{' '}
            |{' '}
            <a href="https://www.redhat.com/en/about/privacy-policy" style={{ color: 'white', textDecoration: 'underline' }} target="_blank">
              Privacy Policy
            </a>
          </Content>
        </Content>
      </div>
    </AboutModal>
  );
};

type AboutModalProps = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
};

export default AboutInstructLab;
