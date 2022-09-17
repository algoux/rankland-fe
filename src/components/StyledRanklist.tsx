import React from 'react';
import { Ranklist } from '@algoux/standard-ranklist-renderer-component';
import type { EnumTheme } from '@algoux/standard-ranklist-renderer-component/dist/lib/Ranklist';
import '@algoux/standard-ranklist-renderer-component/dist/style.css';
import type * as srk from '@algoux/standard-ranklist';
import 'rc-dialog/assets/index.css';
import { Alert } from 'antd';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { useModel } from 'umi';
import dayjs from 'dayjs';
import FileSaver from 'file-saver';
import { createCheckers } from 'ts-interface-checker';
import srkChecker from '@/lib/srk-checker/index.d.ti';
import { EyeOutlined } from '@ant-design/icons';

const { Ranklist: ranklistChecker } = createCheckers(srkChecker);

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div role="alert" style={{ maxWidth: '400px', margin: '100px auto' }}>
      <Alert message="Error occurred when rendering srk" description={error.message} type="error" showIcon />
    </div>
  );
}

export interface IStyledRanklistProps {
  data: srk.Ranklist;
  name: string;
  meta?: {
    viewCnt?: number;
  };
  showFooter?: boolean;
}

export default function StyledRanklist({ data, name, meta, showFooter = false }: IStyledRanklistProps) {
  const { theme } = useModel('theme');
  let srkCheckError: string | null = null;

  try {
    ranklistChecker.check(data);
    srkCheckError = null;
  } catch (e) {
    srkCheckError = e.message;
  }

  if (srkCheckError) {
    return (
      <div className="ml-8">
        <h3>Error occurred while checking srk:</h3>
        <pre>{srkCheckError}</pre>
      </div>
    );
  }

  const formatTimeDuration = (
    time: srk.TimeDuration,
    targetUnit: srk.TimeUnit = 'ms',
    fmt: (num: number) => number = (num) => num,
  ) => {
    let ms = -1;
    switch (time[1]) {
      case 'ms':
        ms = time[0];
        break;
      case 's':
        ms = time[0] * 1000;
        break;
      case 'min':
        ms = time[0] * 1000 * 60;
        break;
      case 'h':
        ms = time[0] * 1000 * 60 * 60;
        break;
      case 'd':
        ms = time[0] * 1000 * 60 * 60 * 24;
        break;
    }
    switch (targetUnit) {
      case 'ms':
        return ms;
      case 's':
        return fmt(ms / 1000);
      case 'min':
        return fmt(ms / 1000 / 60);
      case 'h':
        return fmt(ms / 1000 / 60 / 60);
      case 'd':
        return fmt(ms / 1000 / 60 / 60 / 24);
    }
    return -1;
  };

  const download = () => {
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json;charset=utf-8' });
    FileSaver.saveAs(blob, `${name}.srk.json`);
  };

  const renderHeader = () => {
    const startAt = new Date(data.contest.startAt).getTime();
    const endAt = startAt + formatTimeDuration(data.contest.duration, 'ms');
    const metaBlock = !meta ? null : (
      <div className="text-center mt-1">
        <span className="mr-2">
          <EyeOutlined /> {meta.viewCnt || '-'}
        </span>
        <a className="pl-2 border-0 border-l border-solid border-gray-400" onClick={download}>
          Download srk
        </a>
      </div>
    );
    return (
      <>
        <h1 className="text-center mb-1">{data.contest.title}</h1>
        <p className="text-center mb-0">
          {dayjs(startAt).format('YYYY-MM-DD HH:mm:ss')} ~ {dayjs(endAt).format('YYYY-MM-DD HH:mm:ss Z')}
        </p>
        {metaBlock}
      </>
    );
  };

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      {renderHeader()}
      <div className="mt-6" />
      <Ranklist data={data as any} theme={theme as EnumTheme} />
      {showFooter && (
        <div className="text-center mt-8">
          <p className="mb-1">© 2022 algoUX. All Rights Reserved.</p>
          <p className="mb-1">
            Find us on{' '}
            <a href="https://github.com/algoux" target="_blank">
              GitHub
            </a>
          </p>
          <p className="mb-1">
            Powered by {' '}
            <a href="https://github.com/algoux/standard-ranklist" target="_blank">
              Standard Ranklist
            </a>
          </p>
        </div>
      )}
    </ErrorBoundary>
  );
}
