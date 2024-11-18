// src/components/AppLayout.tsx
'use client';

import * as React from 'react';
import { Page, PageToggleButton } from '@patternfly/react-core/dist/dynamic/components/Page';
import { Content, ContentVariants } from '@patternfly/react-core/dist/dynamic/components/Content';
import { usePathname, useRouter } from 'next/navigation';
import { BarsIcon } from '@patternfly/react-icons/dist/dynamic/icons/bars-icon';
import { Brand } from '@patternfly/react-core/dist/dynamic/components/Brand';
import HelpDropdown from './HelpDropdown/HelpDropdown';
import Link from 'next/link';
import { Masthead } from '@patternfly/react-core/dist/dynamic/components/Masthead';
import { MastheadContent } from '@patternfly/react-core/dist/dynamic/components/Masthead';
import { MastheadMain } from '@patternfly/react-core/dist/dynamic/components/Masthead';
import { MastheadToggle, MastheadBrand } from '@patternfly/react-core/dist/dynamic/components/Masthead';
import { Nav } from '@patternfly/react-core/dist/dynamic/components/Nav';
import { NavExpandable } from '@patternfly/react-core/dist/dynamic/components/Nav';
import { NavItem } from '@patternfly/react-core/dist/dynamic/components/Nav';
import { NavList } from '@patternfly/react-core/dist/dynamic/components/Nav';
import { PageSidebar } from '@patternfly/react-core/dist/dynamic/components/Page';
import { PageSidebarBody } from '@patternfly/react-core/dist/dynamic/components/Page';
import { SkipToContent } from '@patternfly/react-core/dist/dynamic/components/SkipToContent';
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import UserMenu from './UserMenu/UserMenu';
import { useSession } from 'next-auth/react';
// import { useTheme } from '../context/ThemeContext';
import { useState } from 'react';

interface IAppLayout {
  children: React.ReactNode;
}

type Route = {
  path: string;
  label: string;
  children?: Route[];
};

const AppLayout: React.FunctionComponent<IAppLayout> = ({ children }) => {
  // TODO: migrate to patternfly tokens
  // const { theme } = useTheme();
  const { data: session, status } = useSession();
  const [isExperimentalEnabled, setExperimental] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    // Fetch the experimental feature flag
    const fetchExperimentalFeature = async () => {
      const res = await fetch('/api/envConfig');
      const envConfig = await res.json();
      setExperimental(envConfig.EXPERIMENTAL_FEATURES === 'true');
    };
    fetchExperimentalFeature();
  }, []);

  React.useEffect(() => {
    if (status === 'loading') return; // Do nothing while loading
    if (!session && pathname !== '/login') {
      router.push('/login'); // Redirect if not authenticated and not already on login page
    }
  }, [session, status, pathname, router]);

  if (status === 'loading') {
    return <Spinner />;
  }

  if (!session) {
    return null; // Return nothing if not authenticated to avoid flicker
  }

  //const isExperimentalEnabled = process.env.NEXT_PUBLIC_EXPERIMENTAL_FEATURES === 'true';

  // Only log if experimental features are enabled
  if (isExperimentalEnabled) {
    console.log('Is Experimental Enabled:', isExperimentalEnabled);
    console.log('Environment Variable:', process.env.NEXT_PUBLIC_EXPERIMENTAL_FEATURES);
  }

  const routes = [
    { path: '/dashboard', label: 'Dashboard' },
    {
      path: '/contribute',
      label: 'Contribute',
      children: [
        { path: '/contribute/skill', label: 'Skill' },
        { path: '/contribute/knowledge', label: 'Knowledge' }
      ]
    },
    {
      path: '/playground',
      label: 'Playground',
      children: [
        { path: '/playground/chat', label: 'Chat' },
        { path: '/playground/endpoints', label: 'Custom Model Endpoints' }
      ]
    },
    isExperimentalEnabled && {
      path: '/experimental',
      label: 'Experimental Features',
      children: [
        { path: '/experimental/dashboard-local/', label: 'Local Dashboard' },
        { path: '/experimental/contribute-local/skill/', label: 'Local Skill' },
        { path: '/experimental/contribute-local/knowledge/', label: 'Local Knowledge' },
        { path: '/experimental/contribute-local/configuration-local/', label: 'Local Configuration' }
      ]
    }
  ].filter(Boolean) as Route[];

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
              <Brand src="/updated-logo.png" alt="InstructLab Logo" heights={{ default: '60px' }} />
              <Content component={ContentVariants.h1} style={{ marginLeft: '10px', textDecoration: 'none', color: 'black', paddingBottom: '25px' }}>
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
        <UserMenu />
      </MastheadContent>
    </Masthead>
  );

  const renderNavItem = (route: Route, index: number) => (
    <NavItem key={`${route.label}-${index}`} id={`${route.label}-${index}`} isActive={route.path === pathname}>
      <Link href={route.path}>{route.label}</Link>
    </NavItem>
  );

  const renderNavExpandable = (route: Route, index: number) => (
    <NavExpandable
      key={`${route.label}-${index}`}
      title={route.label}
      isActive={route.path === pathname || route.children?.some((child) => child.path === pathname)}
      isExpanded
    >
      {route.children?.map((child, idx) => renderNavItem(child, idx))}
    </NavExpandable>
  );

  const Navigation = (
    // TODO: Theme no longer works here, with patternfly v6 it now uses tokens: https://www.patternfly.org/get-started/release-highlights/
    // <Nav id="nav-primary-simple" theme={theme}>
    <Nav id="nav-primary-simple">
      <NavList id="nav-list-simple">
        {routes.map((route, idx) => (route.children ? renderNavExpandable(route, idx) : renderNavItem(route, idx)))}
      </NavList>
    </Nav>
  );

  const Sidebar = (
    <PageSidebar>
      <PageSidebarBody>{Navigation}</PageSidebarBody>
    </PageSidebar>
  );

  const pageId = 'primary-app-container';
  const PageSkipToContent = <SkipToContent href={`#${pageId}`}>Skip to Content</SkipToContent>;

  return (
    <Page mainContainerId={pageId} masthead={Header} isManagedSidebar sidebar={Sidebar} skipToContent={PageSkipToContent}>
      {children}
    </Page>
  );
};

export { AppLayout };
