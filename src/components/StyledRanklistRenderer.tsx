import React, { useEffect, useMemo, useState } from 'react';
import { Ranklist, ProgressBar, convertToStaticRanklist } from '@algoux/standard-ranklist-renderer-component';
import '@algoux/standard-ranklist-renderer-component/dist/style.css';
import {
  resolveText,
  resolveContributor,
  filterSolutionsUntil,
  regenerateRanklistBySolutions,
  getSortedCalculatedRawSolutions,
} from '@algoux/standard-ranklist-utils';
import type { EnumTheme } from '@algoux/standard-ranklist-utils';
import type * as srk from '@algoux/standard-ranklist';
import 'rc-dialog/assets/index.css';
import { Alert, Dropdown, Menu, notification, Select, Switch } from 'antd';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { useModel } from 'umi';
import dayjs from 'dayjs';
import FileSaver from 'file-saver';
import { CaretDownOutlined, DownloadOutlined, EyeOutlined, ShareAltOutlined } from '@ant-design/icons';
import { uniq } from 'lodash-es';
import copy from 'copy-to-clipboard';
import {
  CodeforcesGymGhostDATConverter,
  VJudgeReplayConverter,
  GeneralExcelConverter,
} from '@algoux/standard-ranklist-convert-to';
import { formatSrkTimeDuration } from '@/utils/time-format.util';
import ContactUs from './ContactUs';
import BeianLink from './BeianLink';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { formatUrl } from '@/configs/route.config';
import type { ItemType } from 'antd/lib/menu/hooks/useItems';
import ClientOnly from './ClientOnly';
import './StyledRanklistRenderer.less';
import UserInfoModal from '@/components/UserInfoModal';
import { useClientWidthHeight } from '@/hooks/use-client-wh';
import { RankTimeDataContext } from './RankTimeDataContext';
import type { IRankTimeData } from './RankTimeDataContext';
import { getAllRankTimeData, getProperRankTimeChunkUnit } from '@/utils/rank-time-data.util';
import type { IRankTimeDataSet } from '@/utils/rank-time-data.util';

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
  tableClass?: string;
  tableStyle?: React.CSSProperties;
  renderExtraActionArea?: (ranklist: srk.Ranklist) => React.ReactNode;
}

function getInitialRankTimeDataSet(): IRankTimeDataSet {
  return {
    unit: 'min',
    userRankTimePoints: new Map(),
    userRankTimeSolvedEventPoints: new Map(),
    seriesSegments: [],
    totalUsers: 0,
  };
}

function getInitialRankTimeData(): IRankTimeData {
  return {
    key: '',
    initialized: false,
    unit: 'min',
    points: [],
    solvedEventPoints: [],
    seriesSegments: [],
    totalUsers: 0,
  };
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
  tableClass,
  tableStyle,
  renderExtraActionArea,
}: IStyledRanklistRendererProps) {
  const [{ width: clientWidth }] = useClientWidthHeight();
  const { theme } = useModel('theme');
  const [filter, setFilter] = useState<{ organizations: string[]; officialOnly: boolean }>({
    organizations: [],
    officialOnly: false,
  });
  const [timeTravelTime, setTimeTravelTime] = useState<number | null>(null);
  const [rankTimeDataInitialized, setRankTimeDataInitialized] = useState(false);
  const [rankTimeDataSet, setRankTimeDataSet] = useState<IRankTimeDataSet>(getInitialRankTimeDataSet());
  const [rankTimeData, setRankTimeData] = useState<IRankTimeData>(getInitialRankTimeData());

  const download = () => {
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json;charset=utf-8' });
    FileSaver.saveAs(blob, `${name}.srk.json`);
  };

  const exportAsGymGhost = () => {
    const converter = new CodeforcesGymGhostDATConverter();
    const file = converter.convert(data);
    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    FileSaver.saveAs(blob, `${name}_gymghost.${file.ext}`);
  };

  const exportAsVJReplay = () => {
    const converter = new VJudgeReplayConverter();
    converter.convertAndWrite(data, `${name}_vjreplay.xlsx`);
  };

  const exportAsGeneralExcel = () => {
    const converter = new GeneralExcelConverter();
    converter.convertAndWrite(data, `${name}.xlsx`);
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

  useEffect(() => {
    setRankTimeDataSet(getInitialRankTimeDataSet());
    setRankTimeData(getInitialRankTimeData());
    setRankTimeDataInitialized(false);
  }, [staticData]);

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

  const handleUserModalOpen = async (user: srk.User, row: srk.RanklistRow, index: number, ranklist: srk.Ranklist) => {
    setRankTimeData(getInitialRankTimeData());
    setTimeout(() => {
      let rankTimeDataSetValue = rankTimeDataSet;
      if (!rankTimeDataInitialized) {
        rankTimeDataSetValue = getAllRankTimeData(data, solutions, getProperRankTimeChunkUnit(data.contest));
        setRankTimeDataSet(rankTimeDataSetValue);
        setRankTimeDataInitialized(true);
      }
      setRankTimeData({
        key: `${user.id}_${Date.now()}`,
        initialized: true,
        unit: rankTimeDataSetValue.unit,
        points: rankTimeDataSetValue.userRankTimePoints.get(user.id) || [],
        solvedEventPoints: rankTimeDataSetValue.userRankTimeSolvedEventPoints.get(user.id) || [],
        seriesSegments: rankTimeDataSetValue.seriesSegments,
        totalUsers: rankTimeDataSetValue.totalUsers,
      });
      console.log(`[RankTimeData] updated user ${user.id}`);
    }, 300);
  };

  const renderContributor = (contributor: srk.Contributor) => {
    const contributorObj = resolveContributor(contributor);
    if (!contributorObj) {
      return null;
    }
    const { name, url } = contributorObj;
    if (url) {
      return (
        <a href={url} target="_blank" rel="noopener">
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

  const renderContestRefLink = (refLink: srk.LinkWithTitle) => {
    const title = resolveText(refLink.title);
    const link = refLink.link;
    return (
      <a href={link} target="_blank" rel="noopener">
        {title}
      </a>
    );
  };

  const renderContestRefLinks = (refLinks: srk.Contest['refLinks']) => {
    if (!refLinks || refLinks.length === 0) {
      return null;
    }
    const mainLinks = refLinks.slice(0, 3);
    const hiddenLinks = refLinks.slice(3);
    const mainLinksPart = mainLinks.map((refLink, i) => (
      <span key={`${i}-${refLink.link}`}>
        {i > 0 && ', '}
        {renderContestRefLink(refLink)}
      </span>
    ));
    const hiddenLinksPart =
      hiddenLinks.length > 0 ? (
        <Dropdown
          overlay={
            <Menu
              items={hiddenLinks.map((refLink, i) => ({
                key: `${i}-${refLink.link}`,
                label: renderContestRefLink(refLink),
              }))}
            />
          }
        >
          <span style={{ cursor: 'pointer' }}>
            and {hiddenLinks.length} more <CaretDownOutlined />
          </span>
        </Dropdown>
      ) : null;
    return (
      <span>
        相关链接：{mainLinksPart} {hiddenLinksPart}
      </span>
    );
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
              <a className="pl-2 border-0 border-l border-solid border-gray-400 mr-2">
                <Dropdown
                  overlay={
                    <Menu
                      items={[
                        {
                          key: 'export-srk',
                          label: '导出为',
                          type: 'group',
                          children: [
                            {
                              key: 'export-srk',
                              label: '标准榜单格式 (srk)',
                              onClick: download,
                            },
                            {
                              key: 'export-gym-ghost',
                              label: 'Codeforces Gym Ghost (dat)',
                              onClick: exportAsGymGhost,
                            },
                            {
                              key: 'export-vjudge-replay',
                              label: 'Virtual Judge Replay (xlsx)',
                              onClick: exportAsVJReplay,
                            },
                            {
                              key: 'export-xlsx',
                              label: 'Excel 表格 (xlsx)',
                              onClick: exportAsGeneralExcel,
                            },
                          ],
                        },
                      ]}
                    />
                  }
                >
                  <DownloadOutlined />
                </Dropdown>
              </a>
              <a className="pl-2 border-0 border-l border-solid border-gray-400">
                <Dropdown
                  overlay={
                    <Menu
                      items={
                        [
                          {
                            key: 'copy-url',
                            label: '复制本页链接',
                            onClick: () => {
                              if (copy(fullUrl, { format: 'text/plain' })) {
                                notification.success({
                                  message: '链接已复制',
                                  duration: 2,
                                  style: {
                                    width: 280,
                                  },
                                });
                              }
                            },
                          },
                          id
                            ? {
                                key: 'copy-embedded',
                                label: '复制嵌入代码',
                                onClick: () => {
                                  const content = `<iframe src="${window.location.origin}${formatUrl(
                                    isLive ? 'Live' : 'Ranklist',
                                    {
                                      id,
                                      focus: process.env.SITE_ALIAS === 'cn' ? '是' : 'yes',
                                    },
                                  )}" border="0" frameborder="no" framespacing="0" allowfullscreen="true" style="width: 100%; height: 600px"></iframe>`;
                                  if (copy(content, { format: 'text/plain' })) {
                                    notification.success({
                                      message: '嵌入代码已复制',
                                      duration: 2,
                                      style: {
                                        width: 280,
                                      },
                                    });
                                  }
                                },
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
        {renderContestRefLinks(staticData.contest.refLinks)}
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
        <ProgressBar
          data={data}
          enableTimeTravel
          onTimeTravel={handleTimeTravel}
          live={isLive}
          // td={data._now ? Date.now() - new Date(data._now).getTime() : 0}
        />
      </div>
      <div className="mt-3 mx-4 flex justify-between items-center">
        {showFilter && (
          <div>
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
        <div>{renderExtraActionArea ? renderExtraActionArea(data) : null}</div>
      </div>

      <div className="mt-6" />
      <div className={tableClass} style={tableStyle}>
        {staticData.remarks && (
          <div className="mb-4 text-center">
            <span className="srk-remarks">备注：{resolveText(staticData.remarks)}</span>
          </div>
        )}
        <RankTimeDataContext.Provider value={rankTimeData}>
          <Ranklist
            data={usingData as any}
            theme={theme as EnumTheme}
            onUserModalOpen={handleUserModalOpen}
            renderUserModal={(user: srk.User, row: srk.RanklistRow, index: number, ranklist: srk.Ranklist) => {
              return {
                title: user.name,
                width: clientWidth >= 980 ? 960 : clientWidth - 20,
                content: <UserInfoModal user={user} row={row} index={index} ranklist={ranklist} />,
              };
            }}
          />
        </RankTimeDataContext.Provider>
      </div>
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
          {(process.env.SITE_ALIAS === 'cn' || process.env.SITE_ALIAS === 'cnn') && (
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
