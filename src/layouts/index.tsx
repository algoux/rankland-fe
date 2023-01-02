import React, { useEffect } from 'react';
import { Link, IRouteComponentProps, useModel, useLocation } from 'umi';
import { Layout, BackTop } from 'antd';
import Bowser from 'bowser';
import '@/styles/antd.scss';
import './index.less';
import logo from '@/assets/logo.png';
import NavMenu from './NavMenu';
import RightMenu from './RightMenu';
import ReactGA from 'react-ga4';

const { Header, Content } = Layout;

export default function RootLayout({ children }: IRouteComponentProps) {
  const location = useLocation();
  const systemThemeListener = (e: MediaQueryListEvent | MediaQueryList) => {
    const theme = e.matches ? 'dark' : 'light';
    document.documentElement.className = theme;
    setTheme(theme);
  };

  useEffect(() => {
    const uaInfo = Bowser.parse(window.navigator.userAgent);
    if (uaInfo.os.name === 'macOS' && uaInfo.engine.name === 'Blink') {
      document.body.classList.add('optimize-decrease-effects');
    }
    const systemThemeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setTheme(systemThemeMediaQuery.matches ? 'dark' : 'light');
    systemThemeMediaQuery.addListener(systemThemeListener);
    // @ts-ignore
    ReactGA.initialize(GTAG);
    return () => {
      systemThemeMediaQuery.removeListener(systemThemeListener);
    };
  }, []);

  useEffect(() => {
    const path = window.location.origin + location.pathname + location.search;
    setTimeout(() => {
      ReactGA.send({ hitType: 'pageview', page: path });
    }, 500);
  }, [location]);

  const { setTheme } = useModel('theme', (model) => ({ setTheme: model.setTheme }));

  return (
    <Layout className="layout">
      <Header>
        <Link to="/">
          <div className="logo">
            <img src={logo} />
          </div>
        </Link>
        <div className="flex justify-between">
          <NavMenu />
          <RightMenu />
        </div>
      </Header>
      <Content>{children}</Content>
      <BackTop />
    </Layout>
  );
}
