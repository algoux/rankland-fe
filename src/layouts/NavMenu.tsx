import React from 'react';
import { Menu } from 'antd';
import { history, useLocation } from 'umi';
import { formatUrl } from '@/configs/route.config';

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
        { key: decodeURIComponent(formatUrl('Search')), label: '探索' },
        {
          key: decodeURIComponent(
            formatUrl('Collection', {
              id: process.env.SITE_ALIAS === 'cn' ? '由官方整理和维护的' : 'official',
            }),
          ),
          label: '榜单合集',
        },
        { key: decodeURIComponent(formatUrl('Playground')), label: '演练场' },
      ]}
      selectedKeys={[decodeURIComponent(pathname)]}
      onClick={onClick}
    />
  );
}
