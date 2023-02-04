import React from 'react';
import { Button, Dropdown, Menu } from 'antd';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { ArrowRightOutlined } from '@ant-design/icons';
import { knownUrlKeywordToGeneralReplacementMap, knownUrlKeywordToAliasReplacementMap } from '@/configs/route.config';

export default function RightMenu() {
  const { url } = useCurrentUrl();

  const convertUrl = (url: string, usingReplacementMap: Record<string, string>) => {
    let newUrl = url;
    Object.keys(usingReplacementMap).forEach((key) => {
      newUrl = newUrl.replace(key, usingReplacementMap[key]);
    });
    return newUrl;
  };

  const switchSiteMenu = (
    <Menu
      items={
        process.env.SITE_ALIAS === 'cn'
          ? [
              {
                key: 'global',
                label: (
                  <a
                    href={`//${process.env.HOST_GLOBAL}${convertUrl(url, knownUrlKeywordToGeneralReplacementMap)}`}
                    target="_blank"
                  >
                    全球站点 <ArrowRightOutlined rotate={-45} />
                  </a>
                ),
              },
            ]
          : [
              {
                key: 'cn',
                label: (
                  <a
                    href={`//${process.env.HOST_CN}${convertUrl(url, knownUrlKeywordToAliasReplacementMap.cn)}`}
                    target="_blank"
                    style={{ wordBreak: 'keep-all' }}
                  >
                    <p className="mb-0">中国站点</p>
                    <p className="mb-0"><span className="opacity-60 text-xs">特别速度优化</span> <ArrowRightOutlined rotate={-45} /></p>
                  </a>
                ),
              },
            ]
      }
      // style={{ minWidth: '120px' }}
    />
  );

  return (
    <div>
      <Dropdown overlay={switchSiteMenu}>
        <Button type="text" className="px-2">切换站点</Button>
      </Dropdown>
    </div>
  );
}
