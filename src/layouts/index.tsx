import React, { useEffect } from 'react';
import { Link, IRouteComponentProps, useModel } from 'umi';
import { Layout, BackTop } from 'antd';
import Bowser from "bowser";
import '@/styles/antd.scss';
import './index.less';
import logo from '@/assets/logo.png';
import NavMenu from './NavMenu';

const { Header, Content } = Layout;

export default function RootLayout({ children }: IRouteComponentProps) {
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
    return () => {
      systemThemeMediaQuery.removeListener(systemThemeListener);
    };
  }, []);

  const { setTheme } = useModel('theme', (model) => ({ setTheme: model.setTheme }));

  return (
    <Layout className="layout">
      <Header>
        <Link to="/">
          <div className="logo">
            <img src={logo} />
          </div>
        </Link>
        <NavMenu />
      </Header>
      <Content>{children}</Content>
      <BackTop />
    </Layout>
  );
}
