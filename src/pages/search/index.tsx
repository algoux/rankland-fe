import React, { useEffect } from 'react';
import { Helmet, Link, useHistory } from 'umi';
import { Input, List, Spin } from 'antd';
import dayjs from 'dayjs';
import Fuse from 'fuse.js';
import { useReq } from '@/utils/request';
import { api } from '@/services/api';
import { EyeOutlined } from '@ant-design/icons';
import { formatTitle } from '@/utils/title-format.util';
import { extractQueryParams, formatUrl } from '@/configs/route.config';

export default function SearchPage({ location }: any) {
  const { kw } = extractQueryParams('Search', location.query);
  const history = useHistory();
  const [isInit, setIsInit] = React.useState(false);

  const onSearch = (value: string) => {
    history.push(formatUrl('Search', { kw: value }));
  };

  const {
    run: runListAll,
    loading,
    data: allData,
    error,
  } = useReq(api.listAllRanklists.bind(api), {
    manual: true,
  });

  useEffect(() => {
    if (allData) {
      setIsInit(true);
    }
  }, [allData]);

  const fuse = React.useMemo(() => {
    if (!allData || !allData.ranks) {
      return null;
    }
    return new Fuse(allData.ranks, {
      keys: ['name', 'uniqueKey'],
      threshold: 0.3,
    });
  }, [allData]);

  const rows = React.useMemo(() => {
    if (!fuse || !kw) {
      return [];
    }
    return fuse.search(kw).map((item) => item.item);
  }, [fuse, kw]);

  const count = React.useMemo(() => {
    if (!rows || !rows.length) {
      return 0;
    }
    return rows.length;
  }, [rows]);

  useEffect(() => {
    if (kw) {
      setIsInit(true);
    }
  }, [kw]);

  useEffect(() => {
    runListAll();
  }, []);

  const renderResult = () => {
    if (!isInit) {
      return null;
    }
    return (
      <div className="mt-10">
        <div className="opacity-70">搜索到 {count} 个结果</div>
        {count > 0 && (
          <div className="mt-2">
            <List
              key="id"
              dataSource={rows}
              size="small"
              renderItem={(item) => (
                <List.Item>
                  <p className="mb-0">
                    <Link to={formatUrl('Ranklist', { id: item.uniqueKey })}>{item.name}</Link>
                    <span className="ml-2 opacity-70">
                      <EyeOutlined /> {item.viewCnt}
                    </span>
                  </p>
                  <p className="mb-0 opacity-50 text-sm">创建于 {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}</p>
                </List.Item>
              )}
            />
          </div>
        )}
      </div>
    );
  };

  const renderRecent = () => {
    if (!isInit) {
      return null;
    }
    return (
      <div className="mt-10">
        <div className="opacity-70">最近更新</div>
        {allData && allData.ranks.length > 0 ? (
          <div className="mt-2">
            <List
              key="id"
              dataSource={allData.ranks.slice(0, 10)}
              size="small"
              renderItem={(item) => (
                <List.Item>
                  <p className="mb-0">
                    <Link to={formatUrl('Ranklist', { id: item.uniqueKey })}>{item.name}</Link>
                    <span className="ml-2 opacity-70">
                      <EyeOutlined /> {item.viewCnt}
                    </span>
                  </p>
                  <p className="mb-0 opacity-50 text-sm">创建于 {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}</p>
                </List.Item>
              )}
            />
          </div>
        ) : (
          <div className="mt-2">暂无最近更新的榜单</div>
        )}
      </div>
    );
  };

  return (
    <div className="normal-content">
      <Helmet>
        <title>{formatTitle('Explore')}</title>
      </Helmet>
      <div>
        <h3 className="mb-6">在榜单数据库中探索</h3>
        <Input.Search defaultValue={kw || ''} placeholder="输入关键词" onSearch={onSearch} enterButton allowClear />
        {loading && <Spin className="mt-10" />}
        {error && (
          <div className="mt-10">
            <div className="text-red-500">初始化榜单数据库失败，请刷新再试。</div>
          </div>
        )}
        {kw ? renderResult() : renderRecent()}
      </div>
    </div>
  );
}
