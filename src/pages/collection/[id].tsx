import React, { createRef, useEffect, useState } from 'react';
import '@algoux/standard-ranklist-renderer-component/dist/style.css';
import 'rc-dialog/assets/index.css';
import { Helmet, IGetInitialProps, Link, useHistory, useParams } from 'umi';
import StyledRanklist from '@/components/StyledRanklist';
import { api } from '@/services/api';
import { Button, Menu, MenuProps, Spin } from 'antd';
import { LogicException, LogicExceptionKind } from '@/services/api/logic.exception';
import { formatTitle } from '@/utils/title-format.util';
import { useRemainingHeight } from '@/hooks/use-remaining-height';
import { CollectionItemType, IApiCollection, IApiCollectionItem, IApiRanklist } from '@/services/api/interface';
import { MiniCache } from '@/utils/mini-cache.util';
import './collection-page.less';
import urlcat from 'urlcat';

type MenuItem = Required<MenuProps>['items'][number];

const apiCache = new MiniCache();

function getItem(label: React.ReactNode, key: React.Key, children?: MenuItem[], type?: 'group'): MenuItem {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return {
    key,
    children,
    label,
    type,
  } as MenuItem;
}

function convertCollectionToMenuItems(collection: IApiCollection, childUrlFormatter: (uniqueKey: string) => string): MenuItem[] {
  const convert = (item: IApiCollectionItem): MenuItem => {
    if (item.type === CollectionItemType.Directory) {
      const children = (item.children || []).map(convert);
      return getItem(item.name, item.uniqueKey, children);
    } else {
      return getItem(<Link to={childUrlFormatter(item.uniqueKey)}>{item.name}</Link>, item.uniqueKey);
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
    location: { search },
  } = props;
  const [remainingHeight] = useRemainingHeight();
  const { id } = useParams<{ id: string }>();
  const query = new URLSearchParams(search);
  const rankId = query.get('rankId');
  const history = useHistory();
  const [openKeys, setOpenKeys] = useState<string[]>([]);

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

  const onOpenChange: MenuProps['onOpenChange'] = (keys) => {
    setOpenKeys(keys);
  };

  if (error) {
    if (error instanceof LogicException && error.kind === LogicExceptionKind.NotFound) {
      return (
        <div className="mt-16 text-center">
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
      <div className="mt-16 text-center">
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
      <div className="mt-16 text-center">
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
        <div className="text-center mt-16">
          <p>An error occurred while loading data</p>
          <Button type="primary" size="small" onClick={() => location.reload()}>
            Refresh
          </Button>
        </div>
      );
    }
    if (data.ranklist) {
      return (
        <div className="mt-8 mb-8">
          <StyledRanklist data={data.ranklist.srk} name={rankId!} meta={data.ranklist.info} showFooter showFilter />
        </div>
      );
    }
    return (
      <div>
        <h3 className="text-center mt-16">Select a ranklist from left navigation bar to view</h3>
      </div>
    );
  };

  return (
    <div>
      <Helmet>
        <title>{formatTitle('榜单合集')}</title>
      </Helmet>
      <div className="srk-collection-container" style={{ height: `${remainingHeight}px` }}>
        <Menu
          mode="inline"
          openKeys={openKeys}
          onOpenChange={onOpenChange}
          selectedKeys={rankId ? [rankId] : []}
          onSelect={({ key }) => {
            if (key !== rankId) {
              ranklistContainerRef.current?.scrollTo({ left: 0, top: 0 });
            }
          }}
          className="overflow-y-auto"
          style={{ width: 320 }}
          items={convertCollectionToMenuItems(data.collection, (uniqueKey => urlcat('/collection/:id', { id, rankId: uniqueKey })))}
        />
        <div className="srk-collection-ranklist" ref={ranklistContainerRef}>{renderRanklist()}</div>
      </div>
    </div>
  );
}

interface IPageParams {
  id: string;
  rankId?: string;
}

const asyncData = async ({ id, rankId }: { id: string; rankId?: string }) => {
  // console.log('asyncData:', { id, rankId });
  const getCollection = apiCache.getWrappedCacheFuncAsync(`collection_${id}`, 60 * 1000, () =>
    api.getCollection({ uniqueKey: id }),
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
    const query = new URLSearchParams(ctx.history.location.search);
    const res = await asyncData({ id: ctx.match.params.id, rankId: query.get('rankId') ?? undefined });
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
  location: { search: string };
}
