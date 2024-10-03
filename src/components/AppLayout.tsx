// src/components/AppLayout.tsx
'use client';

import * as React from 'react';

import { Page, PageToggleButton } from '@patternfly/react-core/dist/dynamic/components/Page';
import { Text, TextContent, TextVariants } from '@patternfly/react-core/dist/dynamic/components/Text';
import { usePathname, useRouter } from 'next/navigation';

import { BarsIcon } from '@patternfly/react-icons/dist/dynamic/icons/bars-icon';
import { Brand } from '@patternfly/react-core/dist/dynamic/components/Brand';
import HelpDropdown from './HelpDropdown/HelpDropdown';
import Link from 'next/link';
import { Masthead } from '@patternfly/react-core/dist/dynamic/components/Masthead';
import { MastheadBrand } from '@patternfly/react-core/dist/dynamic/components/Masthead';
import { MastheadContent } from '@patternfly/react-core/dist/dynamic/components/Masthead';
import { MastheadMain } from '@patternfly/react-core/dist/dynamic/components/Masthead';
import { MastheadToggle } from '@patternfly/react-core/dist/dynamic/components/Masthead';
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
import { useTheme } from '../context/ThemeContext';

interface IAppLayout {
  children: React.ReactNode;
}

const AppLayout: React.FunctionComponent<IAppLayout> = ({ children }) => {
  const { theme } = useTheme();
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

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
    }
  ];

  const Header = (
    <Masthead>
      <MastheadToggle>
        <PageToggleButton variant="plain" aria-label="Global navigation">
          <BarsIcon />
        </PageToggleButton>
      </MastheadToggle>
      <MastheadMain style={{ flexShrink: 1, display: 'flex', alignItems: 'center' }}>
        <MastheadBrand>
          <Brand src="/updated-logo.png" alt="InstructLab Logo" heights={{ default: '60px' }} />
        </MastheadBrand>
        <TextContent style={{ padding: 10 }}>
          <Text component={TextVariants.h1}>InstructLab</Text>
        </TextContent>
      </MastheadMain>
      <MastheadContent style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'nowrap' }}>
        <HelpDropdown />
        <UserMenu />
      </MastheadContent>
    </Masthead>
  );

  const renderNavItem = (route: { path: string; label: string }, index: number) => (
    <NavItem key={`${route.label}-${index}`} id={`${route.label}-${index}`} isActive={route.path === pathname}>
      <Link href={route.path}>{route.label}</Link>
    </NavItem>
  );

  const renderNavExpandable = (
    route: {
      path: string;
      label: string;
      children: { path: string; label: string }[];
    },
    index: number
  ) => (
    <NavExpandable
      key={`${route.label}-${index}`}
      title={route.label}
      isActive={route.path === pathname || route.children.some((child) => child.path === pathname)}
      isExpanded
    >
      {route.children.map((child, idx) => renderNavItem(child, idx))}
    </NavExpandable>
  );

  const Navigation = (
    <Nav id="nav-primary-simple" theme={theme}>
      <NavList id="nav-list-simple">
        {routes.map((route, idx) => (route.children ? renderNavExpandable(route, idx) : renderNavItem(route, idx)))}
      </NavList>
    </Nav>
  );

  const Sidebar = (
    <PageSidebar theme={theme}>
      <PageSidebarBody>{Navigation}</PageSidebarBody>
    </PageSidebar>
  );

  const pageId = 'primary-app-container';
  const PageSkipToContent = <SkipToContent href={`#${pageId}`}>Skip to Content</SkipToContent>;

  return (
    <Page mainContainerId={pageId} header={Header} isManagedSidebar sidebar={Sidebar} skipToContent={PageSkipToContent}>
      {children}
    </Page>
  );
};

export { AppLayout };
