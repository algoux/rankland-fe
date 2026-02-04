import React, { useEffect, useMemo, useState } from 'react';
import { Ranklist, ProgressBar, convertToStaticRanklist } from '@algoux/standard-ranklist-renderer-component';
import '@algoux/standard-ranklist-renderer-component/dist/style.css';
import {
  resolveText,
  resolveContributor,
  filterSolutionsUntil,
  regenerateRanklistBySolutions,
  getSortedCalculatedRawSolutions,
  resolveUserMarkers,
  calculateProblemStatistics,
} from '@algoux/standard-ranklist-utils';
import type { EnumTheme } from '@algoux/standard-ranklist-utils';
import type * as srk from '@algoux/standard-ranklist';
import 'rc-dialog/assets/index.css';
import { Alert, Dropdown, Menu, notification, Radio, Select, Switch } from 'antd';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { Helmet, useModel } from 'umi';
import dayjs from 'dayjs';
import FileSaver from 'file-saver';
import { CaretDownOutlined, DownloadOutlined, EyeOutlined, ShareAltOutlined } from '@ant-design/icons';
import { uniq, omit } from 'lodash-es';
import copy from 'copy-to-clipboard';
import {
  CodeforcesGymGhostDATConverter,
  VJudgeReplayConverter,
  GeneralExcelConverter,
} from '@algoux/standard-ranklist-convert-to';
import useDeepCompareEffect from 'use-deep-compare-effect';
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
import { findUserMatchedMainICPCSeries } from '@/utils/ranklist.util';
import { formatSrkAssetUrl } from '@/utils/srk-asset.util';
import SrkAssetImage from './SrkAssetImage';

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
    userRankTimePointsList: new Map(),
    userRankTimeSolvedEventPointsList: new Map(),
    seriesSegmentsList: [],
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
  const [filter, setFilter] = useState<{ organizations: string[]; officialOnly: boolean; marker: string }>({
    organizations: [],
    officialOnly: false,
    marker: '',
  });
  const [timeTravelTime, setTimeTravelTime] = useState<number | null>(null);
  const [rankTimeDataInitialized, setRankTimeDataInitialized] = useState(false);
  const [rankTimeDataSet, setRankTimeDataSet] = useState<IRankTimeDataSet>(getInitialRankTimeDataSet());
  const [rankTimeData, setRankTimeData] = useState<IRankTimeData>(getInitialRankTimeData());
  const [currentShownUserId, setCurrentShownUserId] = useState<string>('');

  const comparingData = omit(data, ['_now']);
  const [memorizedData, setMemorizedData] = useState<srk.Ranklist>(data);
  useDeepCompareEffect(() => {
    setMemorizedData(comparingData);
    console.log('[StyledRanklistRenderer] data updated');
  }, [comparingData]);

  const download = () => {
    const blob = new Blob([JSON.stringify(memorizedData)], { type: 'application/json;charset=utf-8' });
    FileSaver.saveAs(blob, `${name}.srk.json`);
  };

  const exportAsGymGhost = () => {
    const converter = new CodeforcesGymGhostDATConverter();
    const file = converter.convert(memorizedData);
    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    FileSaver.saveAs(blob, `${name}_gymghost.${file.ext}`);
  };

  const exportAsVJReplay = () => {
    const converter = new VJudgeReplayConverter();
    converter.convertAndWrite(memorizedData, `${name}_vjreplay.xlsx`);
  };

  const exportAsGeneralExcel = () => {
    const converter = new GeneralExcelConverter();
    converter.convertAndWrite(memorizedData, `${name}.xlsx`);
  };

  const solutions = useMemo(() => {
    return getSortedCalculatedRawSolutions(memorizedData.rows);
  }, [memorizedData]);

  const genData = useMemo(() => {
    if (timeTravelTime === null) {
      return memorizedData;
    }
    const filteredSolutions = filterSolutionsUntil(solutions, [timeTravelTime, 'ms']);
    const newData = regenerateRanklistBySolutions(data, filteredSolutions);
    return newData;
  }, [memorizedData, solutions, timeTravelTime]);

  const staticData = useMemo(() => {
    const staticRanklist = convertToStaticRanklist(genData);
    console.log('[StyledRanklistRenderer] static ranklist:', staticRanklist);
    return staticRanklist;
  }, [genData]);

  useEffect(() => {
    console.log('[StyledRanklistRenderer] id:', id);
    setCurrentShownUserId('');
    setRankTimeDataSet(getInitialRankTimeDataSet());
    setRankTimeData(getInitialRankTimeData());
    setRankTimeDataInitialized(false);
    setFilter({
      organizations: [],
      officialOnly: false,
      marker: '',
    });
  }, [id]);

  const organizations = useMemo(
    () =>
      uniq(staticData.rows.map((row) => resolveText(row.user?.organization)).filter(Boolean)).sort((a, b) =>
        a.localeCompare(b),
      ),
    [staticData.rows],
  );
  const markers = useMemo(() => {
    return staticData.markers || [];
  }, [staticData.rows]);
  const filteredSeriesIndexes = useMemo(() => {
    const seriesIndexes = new Array(staticData.series.length).fill(0).map((_, i) => i);
    if (!filter.marker) {
      return seriesIndexes;
    }
    return seriesIndexes.filter((sIndex) => {
      const s = staticData.series[sIndex];
      if (s.rule?.preset === 'ICPC') {
        return !s.rule.options?.filter?.byMarker || s.rule.options?.filter?.byMarker === filter.marker;
      }
      return true;
    });
  }, [filter.marker, staticData.series, staticData.markers, staticData.rows]);
  const filteredSeries = useMemo(() => {
    return staticData.series.filter((_, i) => filteredSeriesIndexes.includes(i));
  }, [filteredSeriesIndexes, staticData.series]);
  const filteredRows = useMemo(() => {
    const rows = staticData.rows.filter((row) => {
      let ok = true;
      ok &&
        filter.organizations.length > 0 &&
        (ok = filter.organizations.includes(resolveText(row.user?.organization)));
      ok && filter.officialOnly && (ok = row.user?.official === true);
      ok &&
        filter.marker &&
        (ok = resolveUserMarkers(row.user, staticData.markers).some((m) => m.id === filter.marker));
      return ok;
    });
    if (filteredSeriesIndexes.length === staticData.series.length) {
      return rows;
    }
    return rows.map((row) => {
      const newRow = { ...row };
      newRow.rankValues = [];
      filteredSeriesIndexes.forEach((sIndex) => {
        newRow.rankValues.push(row.rankValues[sIndex]);
      });
      return newRow;
    });
  }, [filter, staticData.rows, filteredSeriesIndexes, staticData.markers]);
  const problemStatistics = useMemo(() => {
    return calculateProblemStatistics({
      ...staticData,
      rows: filteredRows,
    });
  }, [staticData, filteredRows]);
  const usingData = {
    ...staticData,
    problems: staticData.problems?.map((p, index) => ({
      ...p,
      statistics: problemStatistics[index] || p.statistics || undefined,
    })),
    series: filteredSeries,
    rows: filteredRows,
  };

  const { fullUrl } = useCurrentUrl();

  const handleOrgFilterChange = (value: string[]) => {
    setFilter((prev) => ({ ...prev, organizations: value }));
  };

  const handleIncludeOfficialFillterChange = (checked: boolean) => {
    setFilter((prev) => ({ ...prev, officialOnly: checked }));
  };

  const handleMarkerFilterChange = (e: any) => {
    setFilter((prev) => ({ ...prev, marker: e.target.value }));
  };

  const handleTimeTravel = (time: number | null) => {
    setTimeTravelTime(time);
  };

  const calcUserRankTimeData = async (userId: string) => {
    setRankTimeData(getInitialRankTimeData());
    let rankTimeDataSetValue = rankTimeDataSet;
    if (!rankTimeDataInitialized) {
      rankTimeDataSetValue = getAllRankTimeData(
        memorizedData,
        solutions,
        getProperRankTimeChunkUnit(memorizedData.contest),
      );
      setRankTimeDataSet(rankTimeDataSetValue);
      setRankTimeDataInitialized(true);
    }
    // 根据用户选择合适的 series
    const user = staticData.rows.find((row) => row.user?.id === userId)?.user;
    if (!user) {
      console.warn(`[RankTimeData] user ${userId} not found in ranklist`);
      return;
    }
    const icpcSeries = staticData.series.filter((s) => s.rule?.preset === 'ICPC');
    const userMarkers = resolveUserMarkers(user, staticData.markers);
    const matchedMainICPCSeries = findUserMatchedMainICPCSeries(icpcSeries, userMarkers, filter.marker);
    if (!matchedMainICPCSeries) {
      console.log(`[RankTimeData] user ${userId} has no matched ICPC series`);
      return;
    }
    const matchedMainICPCSeriesIndex = icpcSeries.findIndex((s) => s === matchedMainICPCSeries); // 需要获取 icpcSeries 过滤结果的下标，而非全部 series
    console.log(
      `[RankTimeData] user ${userId} matched ICPC series: ${matchedMainICPCSeriesIndex}`,
      matchedMainICPCSeries,
    );

    const rankTimeData = {
      key: `${userId}_${Date.now()}`,
      initialized: true,
      unit: rankTimeDataSetValue.unit,
      points: (rankTimeDataSetValue.userRankTimePointsList.get(userId) || [])[matchedMainICPCSeriesIndex] || [],
      solvedEventPoints:
        (rankTimeDataSetValue.userRankTimeSolvedEventPointsList.get(userId) || [])[matchedMainICPCSeriesIndex] || [],
      seriesSegments: rankTimeDataSetValue.seriesSegmentsList[matchedMainICPCSeriesIndex] || [],
      totalUsers: rankTimeDataSetValue.totalUsers,
    };
    if (rankTimeData.points.length === 0) {
      console.log(`[RankTimeData] user ${userId} has no rank time data`);
      return;
    }
    setRankTimeData(rankTimeData);
    console.log(`[RankTimeData] updated user ${userId}:`, rankTimeData);
  };

  const handleUserModalOpen = async (user: srk.User, row: srk.RanklistRow, index: number, ranklist: srk.Ranklist) => {
    setCurrentShownUserId(`${user.id}`);
  };

  useDeepCompareEffect(() => {
    if (currentShownUserId) {
      calcUserRankTimeData(currentShownUserId);
    } else {
      setRankTimeDataSet(getInitialRankTimeDataSet());
      setRankTimeData(getInitialRankTimeData());
      setRankTimeDataInitialized(false);
    }
  }, [staticData, currentShownUserId]);

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
    const metaBlock = (
      <div className="text-center mt-1">
        {meta && (
          <span className="mr-2">
            <EyeOutlined /> {meta.viewCnt || '-'}
          </span>
        )}
        <ClientOnly>
          {() => (
            <>
              <a className={`border-0 border-solid border-gray-400 mr-2 ${meta ? 'pl-2 border-l' : ''}`}>
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
        {staticData.contest.banner && (
          <div className="flex items-center justify-center">
            <SrkAssetImage
              image={
                typeof staticData.contest.banner === 'object'
                  ? staticData.contest.banner.link
                  : staticData.contest.banner
              }
              assetScope={id}
              alt="Contest Banner"
              className="mb-2"
              style={{ maxWidth: '1820px', maxHeight: '40vh' }}
            />
          </div>
        )}
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
          data={memorizedData}
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
            <span className="ml-5 inline-flex items-center">
              <span className="mr-1">仅正式参赛</span>
              <Switch checked={filter.officialOnly} size="small" onChange={handleIncludeOfficialFillterChange} />
            </span>
            {markers.length > 0 && (
              <>
                {/* <span className="ml-5 inline-flex items-center">分组</span> */}
                <Radio.Group
                  className="ml-5 inline-flex items-center"
                  onChange={handleMarkerFilterChange}
                  value={filter.marker}
                >
                  <Radio.Button value="">全部</Radio.Button>
                  {markers.map((marker) => (
                    <Radio.Button key={marker.id} value={marker.id}>
                      {resolveText(marker.label)}
                    </Radio.Button>
                  ))}
                </Radio.Group>
              </>
            )}
          </div>
        )}
        <div>{renderExtraActionArea ? renderExtraActionArea(memorizedData) : null}</div>
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
            formatSrkAssetUrl={(url: string) => formatSrkAssetUrl(url, id)}
            onUserModalOpen={handleUserModalOpen}
            renderUserModal={(user: srk.User, row: srk.RanklistRow, index: number, ranklist: srk.Ranklist) => {
              return {
                title: resolveText(user.name),
                width: clientWidth >= 980 ? 960 : clientWidth - 20,
                content: (
                  <UserInfoModal
                    user={user}
                    row={row}
                    index={index}
                    ranklist={ranklist}
                    assetsScope={id!}
                    filterMarker={filter.marker}
                  />
                ),
              };
            }}
          />
        </RankTimeDataContext.Provider>
      </div>
      {showFooter && (
        <div className="text-center mt-8">
          <p className="mb-0">© 2022-present algoUX. All Rights Reserved.</p>
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
            欢迎补充榜单数据至{' '}
            <a href="https://github.com/algoux/srk-collection" target="_blank">
              榜单合集
            </a>
          </p>
          <p className="mt-1 mb-0">
            需要专业的赛事外榜托管？
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
