import React, { useRef, useState } from 'react';
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

export interface ISrkPlaygroundProps {
  code?: string;
}

/**
 * Warning: 这个组件必须使用 dynamic 引入，否则会导致 SSR 报错
 */
export default function SrkPlayground(props: ISrkPlaygroundProps) {
  const { theme } = useModel('theme');
  const [code, setCode] = useState(props.code || DEFAULT_DEMO_CODE);
  const [uncommittedCode, setUncommittedCode] = useState(props.code || DEFAULT_DEMO_CODE);
  const [remainingHeight] = useRemainingHeight();
  const [ready, setReady] = useState(false);
  const [messageRead, setMessageRead] = useLocalStorageState<string | undefined>(
    LocalStorageKey.PlaygroundWelcomeMessageRead,
    {
      defaultValue: undefined,
    },
  );

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
        value={uncommittedCode}
        options={options}
        onChange={(newValue) => {
          setUncommittedCode(newValue);
        }}
        editorDidMount={(editor, monaco) => {
          editor.focus();
          const binding = editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            const savedCode = editor.getModel()?.getValue();
            setCode(savedCode || '');
          });
          setReady(true);
          if (messageRead !== 'true') {
            Modal.info({
              title: '欢迎来到游乐场！',
              width: 600,
              content: (
                <div className="mt-6">
                  <p>你可以调试标准榜单格式（srk）数据并实时预览效果。</p>
                  <p>
                    如果你是 OJ 开发者、Ranklist 贡献者或对此感兴趣，游乐场可以帮助你直观地了解 srk 的字段及其作用。
                  </p>
                  <p>
                    推荐使用 PC/Mac 等桌面设备进行调试。要将编辑中的数据提交至预览，请使用{' '}
                    <Tag color="blue" className="mr-0">
                      Ctrl/Cmd + S
                    </Tag>{' '}
                    组合键。
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
