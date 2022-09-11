import React from 'react';
import { Menu } from 'antd';
import { history, useLocation } from 'umi';

export default function NavMenu() {
  const onClick = (e: any) => {
    history.push(e.key);
  };

  const { pathname } = useLocation();

  return (
    <Menu
      className="nav-menu"
      mode="horizontal"
      items={[
        { key: '/search', label: '探索' },
        { key: '/collection', label: '榜单合集' },
        { key: '/playground', label: '游乐场' },
      ]}
      selectedKeys={[pathname]}
      onClick={onClick}
    />
  );
}
