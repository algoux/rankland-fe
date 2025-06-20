import React, { createRef, useEffect, useState } from 'react';
import '@algoux/standard-ranklist-renderer-component/dist/style.css';
import 'rc-dialog/assets/index.css';
import { Helmet, IGetInitialProps, Link, useHistory, useModel, useParams } from 'umi';
import StyledRanklist from '@/components/StyledRanklist';
import { api } from '@/services/api';
import { Button, Menu, MenuProps, Spin } from 'antd';
import { LogicException, LogicExceptionKind } from '@/services/api/logic.exception';
import { formatTitle } from '@/utils/title-format.util';
import { useRemainingHeight } from '@/hooks/use-remaining-height';
import { CollectionItemType, IApiCollection, IApiCollectionItem, IApiRanklist } from '@/services/api/interface';
import { MiniCache } from '@/utils/mini-cache.util';
import './collection-page.less';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import cateIcpcLogoLight from '@/assets/icpc_logo_black.png';
import cateIcpcLogoDark from '@/assets/icpc_logo_white.png';
import cateCcpcLogoLight from '@/assets/ccpc_logo_black.png';
import cateCcpcLogoDark from '@/assets/ccpc_logo_white.png';
import cateProvincialCpcLogoLight from '@/assets/provincial_cpc_logo_black.png';
import cateProvincialCpcLogoDark from '@/assets/provincial_cpc_logo_white.png';
import cateUniversityLevelCpcLogoLight from '@/assets/university-level_cpc_logo_black.png';
import cateUniversityLevelCpcLogoDark from '@/assets/university-level_cpc_logo_white.png';
import { useClientWidthHeight } from '@/hooks/use-client-wh';
import { useLocalStorageState } from 'ahooks';
import { LocalStorageKey } from '@/configs/local-storage-key.config';
import { extractQueryParams, formatUrl } from '@/configs/route.config';
import logo from '@/assets/logo.png';

type MenuItem = Required<MenuProps>['items'][number];

const apiCache = new MiniCache();

const idTranslations: Record<string, string> = {
  official: 'official',
  由官方整理和维护的: 'official',
};

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
  type?: 'group',
): MenuItem {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return {
    key,
    icon,
    children,
    label,
    type,
  } as MenuItem;
}

function convertCollectionToMenuItems(
  collection: IApiCollection,
  childUrlFormatter: (uniqueKey: string) => string,
  theme: 'light' | 'dark',
): MenuItem[] {
  const convert = (item: IApiCollectionItem): MenuItem => {
    if (item.type === CollectionItemType.Directory) {
      let icon = null;
      if (item.uniqueKey === 'dir-icpc') {
        icon = (
          <span className="srk-collection-menu-icon">
            <img src={theme === 'dark' ? cateIcpcLogoDark : cateIcpcLogoLight} alt="ICPC" />
          </span>
        );
      } else if (item.uniqueKey === 'dir-ccpc') {
        icon = (
          <span className="srk-collection-menu-icon">
            <img src={theme === 'dark' ? cateCcpcLogoDark : cateCcpcLogoLight} alt="CCPC" />
          </span>
        );
      } else if (item.uniqueKey === 'dir-provincial') {
        icon = (
          <span className="srk-collection-menu-icon">
            <img src={theme === 'dark' ? cateProvincialCpcLogoDark : cateProvincialCpcLogoLight} alt="Provincial CPC" />
          </span>
        );
      } else if (item.uniqueKey === 'dir-university-level') {
        icon = (
          <span className="srk-collection-menu-icon">
            <img
              src={theme === 'dark' ? cateUniversityLevelCpcLogoDark : cateUniversityLevelCpcLogoLight}
              alt="University Level CPC"
            />
          </span>
        );
      }
      const children = (item.children || []).map(convert);
      return getItem(item.name, item.uniqueKey, icon, children);
    } else {
      return getItem(
        <Link
          to={childUrlFormatter(item.uniqueKey)}
          onClick={(e) => {
            e.preventDefault();
          }}
        >
          {item.name}
        </Link>,
        item.uniqueKey,
      );
    }
  };
  return collection.root.children.map(convert);
}

function getFlatRanklistUniqueKeys(collection: IApiCollection) {
  const findRanklistUniqueKeys = (item: IApiCollectionItem): string[] => {
    if (item.type === CollectionItemType.Directory) {
      return (item.children || []).flatMap(findRanklistUniqueKeys);
    }
    return [item.uniqueKey];
  };
  return collection.root.children.flatMap(findRanklistUniqueKeys);
}

export default function CollectionPage(props: ICollectionPageProps) {
  const {
    data,
    error,
    location: { query: originalQuery },
  } = props;
  const { theme } = useModel('theme');
  const [remainingHeight] = useRemainingHeight();
  const [{ width: clientWidth }] = useClientWidthHeight();
  const { id } = useParams<{ id: string }>();
  const query = extractQueryParams('Collection', originalQuery);
  const rankId = query.rankId;
  const history = useHistory();
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const [renderSwitchLock, setRenderSwitchLock] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [navCollapsed, setNavCollapsed] = useLocalStorageState<string | undefined>(
    LocalStorageKey.CollectionNavCollapsed,
    {
      defaultValue: undefined,
    },
  );
  const [clientReady, setClientReady] = useState(false);
  const usingMobileLayout = clientWidth < 640;

  const ranklistContainerRef = createRef<HTMLDivElement>();

  useEffect(() => {
    if (data?.ranklistIdInvalid) {
      history.replace(`/collection/${id}`);
    }
  }, [data]);

  if (rankId && !openKeys.includes(rankId) && data?.collection && !data?.ranklistIdInvalid) {
    const nextOpenKeys = [...openKeys];
    const findAndCollectKeys = (item: IApiCollectionItem): boolean => {
      let isMarked = false;
      if (item.type === CollectionItemType.Directory) {
        isMarked = (item.children || []).reduce<boolean>((acc, cur) => acc || findAndCollectKeys(cur), false);
      } else if (item.uniqueKey === rankId) {
        isMarked = true;
      }
      if (isMarked) {
        !nextOpenKeys.includes(item.uniqueKey) && nextOpenKeys.unshift(item.uniqueKey);
      }
      return isMarked;
    };
    data.collection.root.children.map(findAndCollectKeys);
    setOpenKeys(nextOpenKeys);
  }

  useEffect(() => {
    if (clientWidth > 0 && data?.collection && !clientReady) {
      setClientReady(true);
      if (navCollapsed === 'true') {
        setCollapsed(true);
      } else if (navCollapsed !== 'false' && rankId && !data.ranklistIdInvalid && usingMobileLayout) {
        setCollapsed(true);
      }
    }
  }, [clientReady, clientWidth, usingMobileLayout, data, rankId]);

  if (error) {
    if (error instanceof LogicException && error.kind === LogicExceptionKind.NotFound) {
      return (
        <div className="pt-16 text-center">
          <Helmet>
            <title>{formatTitle('Not Found')}</title>
          </Helmet>
          <h3 className="mb-4">Collection Not Found</h3>
          <Link to="/">
            <Button type="primary" size="small">
              Back to Home
            </Button>
          </Link>
        </div>
      );
    }
    return (
      <div className="pt-16 text-center">
        <Helmet>
          <title>{formatTitle()}</title>
        </Helmet>
        <p>An error occurred while loading data</p>
        <Button type="primary" size="small" onClick={() => location.reload()}>
          Refresh
        </Button>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="pt-16 text-center">
        <Helmet>
          <title>{formatTitle()}</title>
        </Helmet>
        <Spin />
      </div>
    );
  }

  // console.log('data', data);

  const renderRanklist = () => {
    if (data.ranklistHasError) {
      return (
        <div className="pt-16 text-center">
          <p>An error occurred while loading data</p>
          <Button type="primary" size="small" onClick={() => location.reload()}>
            Refresh
          </Button>
        </div>
      );
    }
    const dataRankId = data.ranklist?.info?.uniqueKey;
    if (dataRankId && rankId && dataRankId !== rankId) {
      return (
        <div className="pt-16 text-center">
          <Spin />
        </div>
      );
    }
    if (data.ranklist) {
      return (
        <div className="pb-8">
          {!renderSwitchLock && (
            <StyledRanklist
              data={data.ranklist.srk}
              name={rankId!}
              id={rankId!}
              meta={data.ranklist.info}
              showFooter
              showFilter
            />
          )}
        </div>
      );
    }
    return (
      <div>
        <h3 className="pt-16 text-center">请展开左侧边栏并选择一个榜单</h3>
      </div>
    );
  };

  const expandedNavWidth = usingMobileLayout ? clientWidth : 300;
  const collapsedNavWidth = 80;
  const navWidth = collapsed ? collapsedNavWidth : expandedNavWidth;

  return (
    <div>
      <Helmet>
        <title>{formatTitle('榜单合集')}</title>
      </Helmet>
      <div className="srk-collection-container">
        <div className="srk-collection-nav" style={{ width: navWidth, height: `${remainingHeight}px` }}>
          <div>
            <Button
              size="large"
              onClick={() => {
                setCollapsed(!collapsed);
                setNavCollapsed(!collapsed ? 'true' : 'false');
              }}
              style={{ width: navWidth, transition: 'width 0.3s cubic-bezier(0.2, 0, 0, 1)' }}
            >
              {collapsed ? (
                <MenuUnfoldOutlined />
              ) : (
                <span>
                  <MenuFoldOutlined /> 折叠
                </span>
              )}
            </Button>
          </div>
          <Menu
            mode="inline"
            defaultOpenKeys={openKeys}
            selectedKeys={rankId ? [rankId] : []}
            className="srk-collection-nav-menu"
            onSelect={({ key }) => {
              if (key !== rankId) {
                // ranklistContainerRef.current?.scrollTo({ left: 0, top: 0 });
                setRenderSwitchLock(true);
                requestAnimationFrame(() => {
                  setRenderSwitchLock(false);
                  history.push(formatUrl('Collection', { id, rankId: key }));
                });
              }
              if (usingMobileLayout) {
                setCollapsed(true);
                setNavCollapsed('true');
              }
            }}
            items={convertCollectionToMenuItems(
              data.collection,
              (uniqueKey) => formatUrl('Collection', { id, rankId: uniqueKey }),
              theme,
            )}
            inlineCollapsed={collapsed}
            style={{ overflowY: 'auto', overflowX: 'clip' }}
          />
        </div>
        <div
          className="srk-collection-hidden-header"
          style={{ width: navWidth, height: '64px', flexDirection: collapsed ? 'column' : 'row' }}
        >
          <img src={logo} style={{ width: collapsed ? '24px' : '32px', height: collapsed ? '24px' : '32px' }} />
          <h3
            className="mb-0"
            style={{ fontSize: collapsed ? '14px' : undefined, marginLeft: collapsed ? '0' : '8px' }}
          >
            榜单合集
          </h3>
        </div>
        <div
          className="srk-collection-ranklist"
          style={{ marginLeft: navWidth, display: usingMobileLayout && !collapsed ? 'none' : undefined }}
          ref={ranklistContainerRef}
        >
          {renderRanklist()}
        </div>
      </div>
    </div>
  );
}

interface IPageParams {
  id: string;
  rankId?: string;
}

const asyncData = async ({ id, rankId }: { id: string; rankId?: string }) => {
  const realId = idTranslations[id] || id;
  const getCollection = apiCache.getWrappedCacheFuncAsync(`collection_${realId}`, 60 * 1000, () =>
    api.getCollection({ uniqueKey: realId }),
  );
  const getRanklist = apiCache.getWrappedCacheFuncAsync(`ranklist_${rankId}`, 60 * 1000, () =>
    api.getRanklist({ uniqueKey: rankId! }),
  );
  const [collection, ranklistRes] = await Promise.all([
    getCollection(),
    rankId
      ? getRanklist()
          .then((res) => ({ data: res }))
          .catch((e: Error) => ({ error: e }))
      : Promise.resolve(undefined),
  ]);
  let ranklist: IApiRanklist | undefined;
  let ranklistHasError = false;
  let ranklistIdInvalid = false;
  if (rankId) {
    const ranklistUniqueKeys = getFlatRanklistUniqueKeys(collection);
    // console.log('ranklistUniqueKeys', ranklistUniqueKeys);
    if (ranklistUniqueKeys.includes(rankId)) {
      if ('error' in ranklistRes!) {
        ranklistHasError = true;
      }
      if ('data' in ranklistRes!) {
        ranklist = ranklistRes.data;
      }
    } else {
      ranklistIdInvalid = true;
    }
  }
  return {
    collection,
    ranklist,
    ranklistHasError,
    ranklistIdInvalid,
  };
};

CollectionPage.getInitialProps = (async (ctx) => {
  try {
    const searchParams = new URLSearchParams(ctx.history.location.search);
    const query = extractQueryParams('Collection', searchParams);
    const res = await asyncData({ id: ctx.match.params.id, rankId: query.rankId ?? undefined });
    return {
      data: res,
    };
  } catch (e) {
    if (ctx.isServer) {
      throw e;
    }
    console.error(e);
    return {
      error: e,
    };
  }
}) as IGetInitialProps<any, IPageParams>;

type IPageAsyncData = Awaited<ReturnType<typeof asyncData>>;

export interface ICollectionPageProps {
  data?: IPageAsyncData;
  error?: Error;
  location: { search: string; query: Record<string, any> };
}
