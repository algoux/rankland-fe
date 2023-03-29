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
import { Alert, Dropdown, Menu, notification, Select, Switch } from 'antd';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { useModel } from 'umi';
import dayjs from 'dayjs';
import FileSaver from 'file-saver';
import { DownloadOutlined, EyeOutlined, ShareAltOutlined } from '@ant-design/icons';
import { uniq } from 'lodash-es';
import { formatSrkTimeDuration } from '@/utils/time-format.util';
import ContactUs from './ContactUs';
import BeianLink from './BeianLink';
import CopyToClipboard from 'react-copy-to-clipboard';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { formatUrl } from '@/configs/route.config';
import type { ItemType } from 'antd/lib/menu/hooks/useItems';
import ClientOnly from './ClientOnly';

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div role="alert" style={{ maxWidth: '400px', margin: '100px auto' }}>
      <Alert message="Error occurred when rendering srk" description={error.message} type="error" showIcon />
    </div>
  );
}

export interface IStyledRanklistRendererProps {
  data: srk.Ranklist;
  name: string;
  id?: string;
  meta?: {
    viewCnt?: number;
  };
  showFooter?: boolean;
  showFilter?: boolean;
  showProgress?: boolean;
  isLive?: boolean;
}

export default function StyledRanklistRenderer({
  data,
  name,
  id,
  meta,
  showFooter = false,
  showFilter = false,
  showProgress = true,
  isLive = false,
}: IStyledRanklistRendererProps) {
  const { theme } = useModel('theme');
  const [filter, setFilter] = useState<{ organizations: string[]; officialOnly: boolean }>({
    organizations: [],
    officialOnly: false,
  });
  const [timeTravelTime, setTimeTravelTime] = useState<number | null>(null);

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

  const organizations = useMemo(
    () =>
      uniq(staticData.rows.map((row) => row.user?.organization as string).filter(Boolean)).sort((a, b) =>
        a.localeCompare(b),
      ),
    [staticData.rows],
  );
  const filteredRows = useMemo(() => {
    return staticData.rows.filter((row) => {
      let ok = true;
      ok && filter.organizations.length > 0 && (ok = filter.organizations.includes(row.user?.organization as string));
      ok && filter.officialOnly && (ok = row.user?.official === true);
      return ok;
    });
  }, [filter, staticData.rows]);
  const usingData = {
    ...staticData,
    rows: filteredRows,
  };

  const { fullUrl } = useCurrentUrl();

  const handleOrgFilterChange = (value: string[]) => {
    setFilter((prev) => ({ ...prev, organizations: value }));
  };

  const handleIncludeOfficiaFlilterChange = (checked: boolean) => {
    setFilter((prev) => ({ ...prev, officialOnly: checked }));
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
        <ClientOnly>
          {() => (
            <>
              <a className="pl-2 border-0 border-l border-solid border-gray-400 mr-2" onClick={download}>
                <DownloadOutlined /> srk
              </a>
              <a className="pl-2 border-0 border-l border-solid border-gray-400">
                <Dropdown
                  overlay={
                    <Menu
                      items={
                        [
                          {
                            key: 'copy-url',
                            label: (
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
                                <span>复制本页链接</span>
                              </CopyToClipboard>
                            ),
                          },
                          id
                            ? {
                                key: 'copy-embedded',
                                label: (
                                  <CopyToClipboard
                                    text={`<iframe src="${window.location.origin}${formatUrl(
                                      isLive ? 'Live' : 'Ranklist',
                                      {
                                        id,
                                        focus: process.env.SITE_ALIAS === 'cn' ? '是' : 'yes',
                                      },
                                    )}" border="0" frameborder="no" framespacing="0" allowfullscreen="true" style="width: 100%; height: 600px"></iframe>`}
                                    onCopy={(text: string, result: boolean) => {
                                      if (result) {
                                        notification.success({
                                          message: '嵌入代码已复制',
                                          duration: 2,
                                          style: {
                                            width: 280,
                                          },
                                        });
                                      }
                                    }}
                                  >
                                    <span>复制嵌入代码</span>
                                  </CopyToClipboard>
                                ),
                              }
                            : undefined,
                        ].filter(Boolean) as ItemType[]
                      }
                    />
                  }
                >
                  <ShareAltOutlined />
                </Dropdown>
              </a>
            </>
          )}
        </ClientOnly>
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
            placeholder="选择组织/单位"
            onChange={handleOrgFilterChange}
            className="ml-2"
            style={{ width: '160px' }}
            maxTagCount={0}
            maxTagPlaceholder={(omittedValues) => `已选择 ${omittedValues.length} 个`}
          >
            {organizations.map((item) => (
              <Select.Option key={item} value={item}>
                {item}
              </Select.Option>
            ))}
          </Select>
          <span className="ml-4 inline-flex items-center">
            <span className="mr-1">仅包含正式参加者</span>
            <Switch checked={filter.officialOnly} size="small" onChange={handleIncludeOfficiaFlilterChange} />
          </span>
        </div>
      )}
      <div className="mt-6" />
      <Ranklist data={usingData as any} theme={theme as EnumTheme} />
      {showFooter && (
        <div className="text-center mt-8">
          <p className="mb-0">© 2022-2023 algoUX. All Rights Reserved.</p>
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
            欢迎提交 PR 至
            <a href="https://github.com/algoux/srk-collection" target="_blank">
              榜单合集
            </a>
          </p>
          <p className="mt-1 mb-0">
            需要免费托管赛事外榜？
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
