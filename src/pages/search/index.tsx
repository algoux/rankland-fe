import React, { useEffect } from 'react';
import { Helmet, Link, useHistory } from 'umi';
import { Input, List, Spin } from 'antd';
import { useReq } from '@/utils/request';
import { api } from '@/services/api';
import urlcat from 'urlcat';
import dayjs from 'dayjs';
import { EyeOutlined } from '@ant-design/icons';
import { formatTitle } from '@/utils/title-format.util';

export default function SearchPage({ location }: any) {
  const kw = location.query.kw;
  const history = useHistory();
  const [isInit, setIsInit] = React.useState(false);

  const onSearch = (value: string) => {
    history.push({ search: `kw=${encodeURIComponent(value)}` });
  };

  const {
    run: runSearch,
    loading,
    data,
  } = useReq(api.searchRanklist.bind(api), {
    manual: true,
  });

  const count = data?.ranks.length || 0;
  const rows = data?.ranks || [];

  useEffect(() => {
    if (kw) {
      setIsInit(true);
      runSearch({ kw });
    }
  }, [kw]);

  const renderResult = () => {
    if (loading) {
      return <Spin className="mt-10" />;
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
                    <Link to={urlcat('/ranklist/:uniqueKey', { uniqueKey: item.uniqueKey })}>{item.name}</Link>
                    <span className="ml-2 opacity-70"><EyeOutlined /> {item.viewCnt}</span>
                  </p>
                  <p className="mb-0 opacity-50 text-sm">
                    创建于 {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}
                  </p>
                </List.Item>
              )}
            />
          </div>
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
        <Input.Search defaultValue={kw || ''} placeholder="输入关键词" onSearch={onSearch} enterButton />
        {isInit && renderResult()}
      </div>
    </div>
  );
}
