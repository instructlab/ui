import * as React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Brand } from '@patternfly/react-core/dist/dynamic/components/Brand'
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button'
import { Masthead } from '@patternfly/react-core/dist/dynamic/components/Masthead'
import { MastheadBrand } from '@patternfly/react-core/dist/dynamic/components/Masthead'
import { MastheadContent } from '@patternfly/react-core/dist/dynamic/components/Masthead'
import { MastheadMain } from '@patternfly/react-core/dist/dynamic/components/Masthead'
import { MastheadToggle } from '@patternfly/react-core/dist/dynamic/components/Masthead'
import { Nav } from '@patternfly/react-core/dist/dynamic/components/Nav'
import { NavExpandable } from '@patternfly/react-core/dist/dynamic/components/Nav'
import { NavItem } from '@patternfly/react-core/dist/dynamic/components/Nav'
import { NavList } from '@patternfly/react-core/dist/dynamic/components/Nav'
import { Page } from '@patternfly/react-core/dist/dynamic/components/Page'
import { PageSidebar } from '@patternfly/react-core/dist/dynamic/components/Page'
import { PageSidebarBody } from '@patternfly/react-core/dist/dynamic/components/Page'
import { SkipToContent } from '@patternfly/react-core/dist/dynamic/components/SkipToContent'
import BarsIcon from '@patternfly/react-icons/dist/dynamic/icons/bars-icon'
import SignOutAltIcon from '@patternfly/react-icons/dist/dynamic/icons/sign-out-alt-icon'
import { IAppRoute, IAppRouteGroup, routes } from '@app/routes';
import { useAuth } from '../common/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import logo from '@app/bgimages/InstructLab-Logo.svg';

interface IAppLayout {
  children: React.ReactNode;
}

const AppLayout: React.FunctionComponent<IAppLayout> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const { isAuthenticated, logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const Header = (
    <Masthead>
      <MastheadToggle>
        <Button variant="plain" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Global navigation">
          <BarsIcon />
        </Button>
      </MastheadToggle>
      <MastheadMain>
        <MastheadBrand>
          <Brand src={logo} alt="InstructLab Logo" heights={{ default: '60px' }} />
        </MastheadBrand>
      </MastheadMain>
      {isAuthenticated && (
        <MastheadContent className="masthead-right-align" style={{ width: '100%' }}>
          <div style={{ paddingLeft: '80%' }}>
            <ThemeToggle />
            <Button variant="plain" onClick={handleLogout} aria-label="Logout">
              <SignOutAltIcon />
            </Button>
          </div>
        </MastheadContent>
      )}
    </Masthead>
  );


  const renderNavItem = (route: IAppRoute, index: number) => (
    <NavItem key={`${route.label}-${index}`} id={`${route.label}-${index}`} isActive={route.path === location.pathname}>
      <NavLink to={route.path} end>
        {route.label}
      </NavLink>
    </NavItem>
  );

  const renderNavGroup = (group: IAppRouteGroup, groupIndex: number) => (
    <NavExpandable
      key={`${group.label}-${groupIndex}`}
      id={`${group.label}-${groupIndex}`}
      title={group.label}
      isActive={group.routes.some(route => location.pathname === route.path)}
    >
      {group.routes.map((route, idx) => route.label && renderNavItem(route, idx))}
    </NavExpandable>
  );

  const Navigation = (
    <Nav id="nav-primary-simple" theme={theme}>
      <NavList id="nav-list-simple">
        {routes.map(
          (route, idx) => route.label && (!route.routes ? renderNavItem(route, idx) : renderNavGroup(route, idx))
        )}
      </NavList>
    </Nav>
  );

  const Sidebar = (
    <PageSidebar theme={theme}>
      <PageSidebarBody>
        {Navigation}
      </PageSidebarBody>
    </PageSidebar>
  );

  const pageId = 'primary-app-container';
  const PageSkipToContent = <SkipToContent href={`#${pageId}`}>Skip to Content</SkipToContent>;

  return (
    <Page
      mainContainerId={pageId}
      header={Header}
      sidebar={sidebarOpen && Sidebar}
      skipToContent={PageSkipToContent}>
      {children}
    </Page>
  );
};

export { AppLayout };
