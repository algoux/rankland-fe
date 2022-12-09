import React from 'react';
import { Button, Dropdown, Menu, notification, Tooltip } from 'antd';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { ArrowRightOutlined } from '@ant-design/icons';
import { knownUrlKeywordToGeneralReplacementMap, knownUrlKeywordToAliasReplacementMap } from '@/configs/route.config';

export default function RightMenu() {
  const { url, fullUrl } = useCurrentUrl();

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
                  >
                    中国站点 <ArrowRightOutlined rotate={-45} />
                  </a>
                ),
              },
            ]
      }
    />
  );

  return (
    <div>
      <Tooltip placement="bottom" title="复制本页链接">
        <CopyToClipboard
          text={fullUrl}
          onCopy={(text: string, result: boolean) => {
            if (result) {
              notification.success({
                message: '链接已复制',
                duration: 2,
                style: {
                  width: 280,
                },
              });
            }
          }}
        >
          <Button type="text">分享</Button>
        </CopyToClipboard>
      </Tooltip>
      <Dropdown overlay={switchSiteMenu}>
        <Button type="text">切换站点</Button>
      </Dropdown>
    </div>
  );
}
