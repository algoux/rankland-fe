import React, { useRef, useState, useEffect } from 'react';
import { useModel } from 'umi';
import { Tag } from 'antd';
import MonacoEditor from 'react-monaco-editor';
import './SrkPlayground.less';
import StyledRanklist from './StyledRanklist';
import { throttle } from 'lodash-es';
import { QuestionCircleOutlined } from '@ant-design/icons';
import DEFAULT_DEMO_CODE from '@/assets/srk-playground-demo.srk.json.txt';

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
  const [remainingHeight, setRemainingHeight] = useState(0);
  const [ready, setReady] = useState(false);
  let monacoRef = useRef<MonacoEditor>(null);
  let syntaxValid = false;
  let data: any;

  try {
    data = JSON.parse(code);
    syntaxValid = typeof data === 'object';
  } catch (e) {
    syntaxValid = false;
  }

  const afterResize = () => {
    const remainingHeight =
      document.body.clientHeight - (document.querySelector('.ant-layout-header')?.getBoundingClientRect().height || 0);
    setRemainingHeight(remainingHeight);
  };

  useEffect(() => {
    afterResize();
  });

  const whenWindowResized = throttle(afterResize, 250);

  useEffect(() => {
    window.addEventListener('resize', whenWindowResized);
    return () => window.removeEventListener('resize', whenWindowResized);
  }, []);

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
            <QuestionCircleOutlined />{' '}srk specification
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
    <div className="srk-playground-container">
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
        }}
      />
      {renderPreview()}
    </div>
  );
}
