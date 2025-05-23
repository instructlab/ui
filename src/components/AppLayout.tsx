// src/components/AppLayout.tsx
'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  AlertGroup,
  Alert,
  AlertVariant,
  AlertActionCloseButton,
  Bullseye,
  Drawer,
  DrawerContent,
  DrawerContentBody,
  Spinner,
  Masthead,
  MastheadMain,
  MastheadToggle,
  PageToggleButton,
  MastheadBrand,
  Brand,
  Content,
  ContentVariants,
  MastheadContent,
  NavItem,
  NavExpandable,
  Nav,
  NavList,
  PageSidebar,
  PageSidebarBody,
  SkipToContent,
  Page
} from '@patternfly/react-core';
import { BarsIcon } from '@patternfly/react-icons';
import { useFeatureFlags } from '@/context/FeatureFlagsContext';
import { useAlerts } from '@/context/AlertContext';
import { useSideDrawer } from '@/context/SideDrawerContext';
import ThemePreference from '@/components/ThemePreference/ThemePreference';
import DevFlagsBanner from '@/components/Banner/DevFlagsBanner';
import HelpDropdown from './HelpDropdown/HelpDropdown';
import UserMenu from './UserMenu/UserMenu';

import '../styles/globals.scss';

export enum FeaturePages {
  Skill = 'Skill',
  Playground = 'Playground',
  Experimental = 'Experimental'
}

interface IAppLayout {
  children: React.ReactNode;
  className?: string;
  requiredFeature?: FeaturePages;
}

type Route = {
  path: string;
  altPaths?: string[];
  label: string;
  children?: Route[];
};

const isRouteActive = (pathname: string, route: Route) => {
  return pathname.startsWith(route.path) || route.altPaths?.some((altPath) => pathname.startsWith(altPath));
};

const AppLayout: React.FunctionComponent<IAppLayout> = ({ children, className, requiredFeature }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const {
    loaded,
    featureFlags: { playgroundFeaturesEnabled, experimentalFeaturesEnabled, skillFeaturesEnabled }
  } = useFeatureFlags();
  const { alerts, removeAlert } = useAlerts();
  const sideDrawerContext = useSideDrawer();

  React.useEffect(() => {
    if (status === 'loading') return; // Do nothing while loading
    if (!session && pathname !== '/login') {
      router.push('/login'); // Redirect if not authenticated and not already on login page
    }
  }, [session, status, pathname, router]);

  const routes = React.useMemo(
    () =>
      [
        { path: '/dashboard', altPaths: ['/contribute'], label: 'My contributions' },
        { path: '/documents', label: 'Documents' },
        ...(playgroundFeaturesEnabled
          ? [
              {
                path: '/playground',
                label: 'Playground',
                children: [
                  { path: '/playground/chat', label: 'Chat with a model' },
                  { path: '/playground/endpoints', label: 'Custom model endpoints' }
                ]
              }
            ]
          : []),
        ...(experimentalFeaturesEnabled
          ? [
              {
                path: '/experimental',
                label: 'Experimental features',
                children: [
                  { path: '/experimental/fine-tune', label: 'Fine-tuning' },
                  { path: '/experimental/chat-eval', label: 'Model chat eval' }
                ]
              }
            ]
          : [])
      ].filter(Boolean) as Route[],
    [experimentalFeaturesEnabled, playgroundFeaturesEnabled]
  );

  if (!loaded || status === 'loading') {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  if (!session) {
    return null; // Return nothing if not authenticated to avoid flicker
  }

  if (requiredFeature) {
    const featureEnabled =
      (requiredFeature === FeaturePages.Playground && playgroundFeaturesEnabled) ||
      (requiredFeature === FeaturePages.Experimental && experimentalFeaturesEnabled) ||
      (requiredFeature === FeaturePages.Skill && skillFeaturesEnabled);

    if (!featureEnabled) {
      router.push('/404');
      return null;
    }
  }

  const Header = (
    <Masthead>
      <MastheadMain style={{ flexShrink: 1, display: 'flex', alignItems: 'center' }}>
        <MastheadToggle>
          <PageToggleButton variant="plain" aria-label="Global navigation">
            <BarsIcon />
          </PageToggleButton>
        </MastheadToggle>
        <MastheadBrand data-codemods>
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Brand src="/header-logo-light.png" alt="InstructLab Logo" heights={{ default: '60px' }} />
              <Content component={ContentVariants.h1} style={{ marginLeft: '10px', textDecoration: 'none', paddingBottom: '25px' }}>
                InstructLab
              </Content>
            </div>
          </Link>
        </MastheadBrand>
      </MastheadMain>
      <MastheadContent
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          flexWrap: 'nowrap'
        }}
      >
        <HelpDropdown />
        <ThemePreference />
        <UserMenu />
      </MastheadContent>
    </Masthead>
  );

  const renderNavItem = (route: Route, index: number) => (
    <NavItem key={`${route.label}-${index}`} id={`${route.label}-${index}`} isActive={isRouteActive(pathname, route)}>
      <Link href={route.path}>{route.label}</Link>
    </NavItem>
  );

  const renderNavExpandable = (route: Route, index: number) => (
    <NavExpandable
      key={`${route.label}-${index}`}
      title={route.label}
      isActive={isRouteActive(pathname, route) || route.children?.some((child) => isRouteActive(pathname, child))}
      isExpanded
    >
      {route.children?.map((child, idx) => renderNavItem(child, idx))}
    </NavExpandable>
  );

  const Navigation = (
    <Nav id="nav-primary-simple">
      <NavList id="nav-list-simple">
        {routes.map((route, idx) => (route.children ? renderNavExpandable(route, idx) : renderNavItem(route, idx)))}
      </NavList>
    </Nav>
  );

  const Sidebar = (
    <PageSidebar aria-label="Primary Navigation">
      <PageSidebarBody>{Navigation}</PageSidebarBody>
    </PageSidebar>
  );

  const pageId = 'primary-app-container';
  const PageSkipToContent = <SkipToContent href={`#${pageId}`}>Skip to Content</SkipToContent>;

  return (
    <Drawer isExpanded={!!sideDrawerContext.setSideDrawerContent} isInline>
      <DrawerContent panelContent={sideDrawerContext.sideDrawerContent}>
        <DrawerContentBody>
          <Page
            className={className}
            mainContainerId={pageId}
            masthead={Header}
            isManagedSidebar
            sidebar={Sidebar}
            skipToContent={PageSkipToContent}
            isContentFilled
          >
            <DevFlagsBanner />
            {children}
            <AlertGroup isToast isLiveRegion>
              {alerts.map((alert) => (
                <Alert
                  variant={alert.variant ? AlertVariant[alert.variant] : undefined}
                  title={alert.title}
                  timeout={true}
                  actionClose={<AlertActionCloseButton title={alert.title} onClose={() => removeAlert(alert.key)} />}
                  key={alert.key}
                />
              ))}
            </AlertGroup>
          </Page>
        </DrawerContentBody>
      </DrawerContent>
    </Drawer>
  );
};

export { AppLayout };
