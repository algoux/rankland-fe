import React, { useState } from 'react';
import { Ranklist } from '@algoux/standard-ranklist-renderer-component';
import type { EnumTheme } from '@algoux/standard-ranklist-renderer-component/dist/lib/Ranklist';
import '@algoux/standard-ranklist-renderer-component/dist/style.css';
import type * as srk from '@algoux/standard-ranklist';
import 'rc-dialog/assets/index.css';
import { Alert, Badge, Select } from 'antd';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { useModel } from 'umi';
import dayjs from 'dayjs';
import FileSaver from 'file-saver';
import { createCheckers } from 'ts-interface-checker';
import srkChecker from '@/lib/srk-checker/index.d.ti';
import { EyeOutlined } from '@ant-design/icons';
import { uniq } from 'lodash-es';
import { formatSrkTimeDuration } from '@/utils/time-format.util';
import CompetitionProgressBar from './CompetitionProgressBar';

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
  showFilter?: boolean;
  showProgress?: boolean;
  isLive?: boolean;
}

export default function StyledRanklist({
  data,
  name,
  meta,
  showFooter = false,
  showFilter = false,
  showProgress = true,
  isLive = false,
}: IStyledRanklistProps) {
  const { theme } = useModel('theme');
  const [filter, setFilter] = useState<{ organizations: string[] }>({ organizations: [] });
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

  const needShowProgress = showProgress && !!data._now;
  const td = data._now ? Date.now() - new Date(data._now).getTime() : 0;

  const download = () => {
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json;charset=utf-8' });
    FileSaver.saveAs(blob, `${name}.srk.json`);
  };

  const organizations = uniq(data.rows.map((row) => row.user?.organization as string).filter(Boolean)).sort((a, b) =>
    a.localeCompare(b),
  );
  const filteredRows = data.rows.filter((row) =>
    filter.organizations.length ? filter.organizations.includes(row.user?.organization as string) : true,
  );
  const usingData = {
    ...data,
    rows: filteredRows,
  };

  const handleOrgFilterChange = (value: string[]) => {
    setFilter({ organizations: value });
  };

  const renderHeader = () => {
    const startAt = new Date(data.contest.startAt).getTime();
    const endAt = startAt + formatSrkTimeDuration(data.contest.duration, 'ms');
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
        <h1 className="text-center mb-1">
          {isLive ? (
            <span className="inline-block mr-1">
              Live <Badge status="processing" style={{ fontSize: 'inherit' }} />
            </span>
          ) : null}
          {data.contest.title}
        </h1>
        <p className="text-center mb-0">
          {dayjs(startAt).format('YYYY-MM-DD HH:mm:ss')} ~ {dayjs(endAt).format('YYYY-MM-DD HH:mm:ss Z')}
        </p>
        {metaBlock}
        {needShowProgress && (
          <div className="mx-4">
            <CompetitionProgressBar
              startAt={startAt}
              endAt={endAt}
              frozenLength={
                data.contest.frozenDuration ? formatSrkTimeDuration(data.contest.frozenDuration, 'ms') : undefined
              }
              td={td}
            />
          </div>
        )}
      </>
    );
  };

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      {renderHeader()}
      {showFilter && (
        <div className="mt-4 mx-4">
          <span>Filter</span>
          <Select
            mode="multiple"
            allowClear
            placeholder="Select Organizations"
            onChange={handleOrgFilterChange}
            className="ml-2"
            style={{ width: '160px' }}
            maxTagCount={0}
            maxTagPlaceholder={(omittedValues) => `${omittedValues.length} selected`}
          >
            {organizations.map((item) => (
              <Select.Option key={item} value={item}>
                {item}
              </Select.Option>
            ))}
          </Select>
        </div>
      )}
      <div className="mt-6" />
      <Ranklist data={usingData as any} theme={theme as EnumTheme} />
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
            Powered by{' '}
            <a href="https://github.com/algoux/standard-ranklist" target="_blank">
              Standard Ranklist
            </a>
          </p>
        </div>
      )}
    </ErrorBoundary>
  );
}
