import React, { useState } from 'react';
import { Button, notification, Tooltip } from 'antd';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { CopyToClipboard } from 'react-copy-to-clipboard';

export default function RightMenu() {
  const url = useCurrentUrl();

  return (
    <div>
      <Tooltip placement="bottom" title="复制本页链接">
        <CopyToClipboard
          text={url}
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
    </div>
  );
}
