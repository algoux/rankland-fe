import { useEffect } from 'react';
import { Link, IRouteComponentProps, history, useModel } from 'umi';
import { Layout, Menu, BackTop } from 'antd';
import '@/styles/antd.scss';
import './index.less';
import logo from '@/assets/logo.png';

const { Header, Content } = Layout;

export default function RootLayout({ children }: IRouteComponentProps) {
  const onClick = (e: any) => {
    history.push(e.key);
  };

  const systemThemeListener = (e: MediaQueryListEvent | MediaQueryList) => {
    const theme = e.matches ? 'dark' : 'light';
    document.documentElement.className = theme;
    setTheme(theme);
  };

  useEffect(() => {
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
        <Menu
          className="nav-menu"
          mode="horizontal"
          items={[
            { key: '/search', label: '探索' },
            { key: '/collection', label: '榜单合集' },
            { key: '/playground', label: '游乐场' },
          ]}
          onClick={onClick}
        />
      </Header>
      <Content>{children}</Content>
      <BackTop />
    </Layout>
  );
}
