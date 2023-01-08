import React, { useMemo, useState } from 'react';
import {
  Ranklist,
  ProgressBar,
  convertToStaticRanklist,
  resolveText,
  resolveContributor,
  filterSolutionsUntil,
  regenerateRanklistBySolutions,
  getSortedCalculatedRawSolutions,
} from '@algoux/standard-ranklist-renderer-component';
import type { EnumTheme } from '@algoux/standard-ranklist-renderer-component';
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
import { DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import { uniq } from 'lodash-es';
import { formatSrkTimeDuration } from '@/utils/time-format.util';
import CompetitionProgressBar from './CompetitionProgressBar';
import ContactUs from './ContactUs';
import BeianLink from './BeianLink';

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
  const [timeTravelTime, setTimeTravelTime] = useState<number | null>(null);
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

  const solutions = useMemo(() => {
    return getSortedCalculatedRawSolutions(data.rows);
  }, [data]);

  const genData = useMemo(() => {
    if (timeTravelTime === null) {
      return data;
    }
    const filteredSolutions = filterSolutionsUntil(solutions, [timeTravelTime, 'ms']);
    const newData = regenerateRanklistBySolutions(data, filteredSolutions);
    return newData;
  }, [data, solutions, timeTravelTime]);

  const staticData = useMemo(() => convertToStaticRanklist(genData), [genData]);

  const organizations = uniq(staticData.rows.map((row) => row.user?.organization as string).filter(Boolean)).sort(
    (a, b) => a.localeCompare(b),
  );
  const filteredRows = staticData.rows.filter((row) =>
    filter.organizations.length ? filter.organizations.includes(row.user?.organization as string) : true,
  );
  const usingData = {
    ...staticData,
    rows: filteredRows,
  };

  const handleOrgFilterChange = (value: string[]) => {
    setFilter({ organizations: value });
  };

  const handleTimeTravel = (time: number | null) => {
    setTimeTravelTime(time);
  };

  const renderContributor = (contributor: srk.Contributor) => {
    const contributorObj = resolveContributor(contributor);
    if (!contributorObj) {
      return null;
    }
    const { name, url } = contributorObj;
    if (url) {
      return (
        <a href={url} target="_blank">
          {name}
        </a>
      );
    }
    return <span>{name}</span>;
  };

  const renderContributors = (contributors: srk.Contributor[]) => {
    return contributors.map((contributor, i) => (
      <span key={contributor}>
        {i > 0 && ', '}
        {renderContributor(contributor)}
      </span>
    ));
  };

  const renderHeader = () => {
    const startAt = new Date(staticData.contest.startAt).getTime();
    const endAt = startAt + formatSrkTimeDuration(staticData.contest.duration, 'ms');
    const metaBlock = !meta ? null : (
      <div className="text-center mt-1">
        <span className="mr-2">
          <EyeOutlined /> {meta.viewCnt || '-'}
        </span>
        <a className="pl-2 border-0 border-l border-solid border-gray-400" onClick={download}>
          <DownloadOutlined /> srk
        </a>
        {Array.isArray(staticData.contributors) && staticData.contributors.length > 0 && (
          <p className="mb-0">贡献者：{renderContributors(staticData.contributors)}</p>
        )}
      </div>
    );
    return (
      <>
        <h1 className="text-center mb-1">{resolveText(staticData.contest.title)}</h1>
        {metaBlock}
        <p className="text-center mb-0">
          {dayjs(startAt).format('YYYY-MM-DD HH:mm:ss')} ~ {dayjs(endAt).format('YYYY-MM-DD HH:mm:ss Z')}
        </p>
      </>
    );
  };

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      {renderHeader()}
      <div className="mx-4">
        <ProgressBar data={data} enableTimeTravel onTimeTravel={handleTimeTravel} />
      </div>
      {showFilter && (
        <div className="mt-3 mx-4">
          <span>筛选</span>
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
          <p className="mb-0">© 2022 algoUX. All Rights Reserved.</p>
          <p className="mt-1 mb-0">
            Find us on{' '}
            <a href="https://github.com/algoux" target="_blank">
              GitHub
            </a>
          </p>
          <p className="mt-1 mb-0">
            Powered by{' '}
            <a href="https://github.com/algoux/standard-ranklist" target="_blank">
              Standard Ranklist
            </a>
          </p>
          <p className="mt-1 mb-0">
            我们同为算法竞赛爱好者，不妨
            <a href="https://github.com/algoux/srk-collection" target="_blank">
              一起维护 👏
            </a>
          </p>
          <p className="mt-1 mb-0">
            需要免费托管比赛外榜？欢迎
            <ContactUs>
              <a>联系我们</a>
            </ContactUs>
          </p>
          {process.env.SITE_ALIAS === 'cn' && (
            <p className="mt-1 mb-0">
              备案号：
              <BeianLink />
            </p>
          )}
        </div>
      )}
    </ErrorBoundary>
  );
}
