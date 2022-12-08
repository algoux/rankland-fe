import React, { useState } from 'react';
import { Tooltip } from 'antd';
import { CopyToClipboard } from 'react-copy-to-clipboard';

export interface CopyToClipboardButtonProps {
  text: string; // text to copy
  copiedText: string; // tooltip text to show when copied
  children: React.ReactNode;
}

export function CopyToClipboardButton(props: CopyToClipboardButtonProps) {
  const [copied, setCopied] = useState(false);
  return (
    <Tooltip title={props.copiedText} visible={copied} onVisibleChange={(visible) => { !visible && setCopied(true) }}>
      <CopyToClipboard
        text={props.text}
        onCopy={(text: string, result: boolean) => {
          if (result) {
            setCopied(true);
          }
        }}
      >
        {props.children}
      </CopyToClipboard>
    </Tooltip>
  );
}
