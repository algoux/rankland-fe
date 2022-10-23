import React, { useCallback, useRef, useState } from 'react';
import { useModel } from 'umi';
import { Modal, Tag } from 'antd';
import MonacoEditor from 'react-monaco-editor';
import './SrkPlayground.less';
import StyledRanklist from './StyledRanklist';
import { QuestionCircleOutlined } from '@ant-design/icons';
import DEFAULT_DEMO_CODE from '@/assets/srk-playground-demo.srk.json.txt';
import { useLocalStorageState } from 'ahooks';
import { LocalStorageKey } from '@/configs/local-storage-key.config';
import { useRemainingHeight } from '@/hooks/use-remaining-height';
import { throttle } from 'lodash-es';

export interface ISrkPlaygroundProps {}

/**
 * Warning: 这个组件必须使用 dynamic 引入，否则会导致 SSR 报错
 */
export default function SrkPlayground(props: ISrkPlaygroundProps) {
  const { theme } = useModel('theme');
  const [code, setCode] = useState(DEFAULT_DEMO_CODE);
  const [remainingHeight] = useRemainingHeight();
  const [ready, setReady] = useState(false);
  const [messageRead, setMessageRead] = useLocalStorageState<string | undefined>(
    LocalStorageKey.PlaygroundWelcomeMessageRead,
    {
      defaultValue: undefined,
    },
  );

  const _codeChange = (code: string) => {
    setCode(code || '');
  };
  const onCodeChange = useCallback(throttle(_codeChange, 250), []);

  let monacoRef = useRef<MonacoEditor>(null);
  let syntaxValid = false;
  let data: any;

  try {
    data = JSON.parse(code);
    syntaxValid = typeof data === 'object';
  } catch (e) {
    syntaxValid = false;
  }

  const options = {
    selectOnLineNumbers: true,
  };

  const renderPreview = () => {
    if (!ready) {
      return null;
    }
    return (
      <div className="srk-playground-preview">
        <div className="absolute right-4 top-4">
          <a href="https://github.com/algoux/standard-ranklist/blob/master/index.d.ts" target="_blank">
            <QuestionCircleOutlined /> srk specification
          </a>
        </div>
        {!syntaxValid ? (
          <h3 className="text-center mt-16">
            Input valid srk JSON and press{' '}
            <Tag color="blue" className="mr-0">
              Ctrl/Cmd + S
            </Tag>{' '}
            to preview
          </h3>
        ) : (
          <div className="mt-8 mb-8">
            <StyledRanklist data={data} name="playground" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="srk-playground-container" style={{ height: `${remainingHeight}px` }}>
      <MonacoEditor
        ref={monacoRef!}
        width={500}
        height={remainingHeight}
        language="json"
        theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
        value={code}
        options={options}
        onChange={(newValue) => {
          onCodeChange(newValue);
        }}
        editorDidMount={(editor, monaco) => {
          editor.focus();
          setReady(true);
          if (messageRead !== 'true') {
            Modal.info({
              title: '欢迎来到游乐场！',
              width: 600,
              content: (
                <div className="mt-6">
                  <p>你可以调试标准榜单格式（srk）数据并实时预览效果，推荐使用桌面端设备。</p>
                  <p>
                    如果你是 OJ 开发者、Ranklist 贡献者或对此感兴趣，游乐场可以帮助你直观地了解 srk 的字段及其作用。
                  </p>
                  <p>
                    需要参考 srk 规范？请点击右上角的 <QuestionCircleOutlined /> 图标。
                  </p>
                </div>
              ),
              onOk() {
                setMessageRead('true');
              },
            });
          }
        }}
      />
      {renderPreview()}
    </div>
  );
}
