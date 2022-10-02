import React, { useEffect, useRef, useState } from 'react';
import '@algoux/standard-ranklist-renderer-component/dist/style.css';
import 'rc-dialog/assets/index.css';
import type * as srk from '@algoux/standard-ranklist';
import { Helmet, Link, useParams } from 'umi';
import StyledRanklist from '@/components/StyledRanklist';
import { api } from '@/services/api';
import { Button, Spin } from 'antd';
import { LogicException, LogicExceptionKind } from '@/services/api/logic.exception';
import { formatTitle } from '@/utils/title-format.util';
import { useReq } from '@/utils/request';

export default function LiveRanklistPage() {
  const { id } = useParams<{ id: string }>();
  const [ranklist, setRanklist] = useState<srk.Ranklist | null>(null);
  const {
    loading: configLoading,
    data: config,
    error,
  } = useReq(() => api.getLiveConfig({ id }), {
    refreshDeps: [id],
  });

  const { loading: ranklistLoading, runAsync: fetchRanklist } = useReq(
    () => api.getLiveRanklist({ url: config?.srkUrl || '', alignBaseSec: (config?.srkRefreshInterval || 0) / 1000 }),
    {
      manual: true,
    },
  );

  const loading = configLoading || ranklistLoading;

  let pollRanklistTimer = useRef<any>(0);

  useEffect(() => {
    setRanklist(null);
  }, [id]);

  useEffect(() => {
    if (config?.srkUrl) {
      // console.log('fetching ranklist');
      fetchRanklist().then((res) => setRanklist(res));
      if (config.srkRefreshInterval > 0) {
        if (pollRanklistTimer.current) {
          clearInterval(pollRanklistTimer.current);
        }
        pollRanklistTimer.current = setInterval(() => {
          fetchRanklist().then((res) => setRanklist(res));
        }, config.srkRefreshInterval);
      }
    }
    return () => {
      clearInterval(pollRanklistTimer.current);
    };
  }, [config]);

  if (error) {
    if (error instanceof LogicException && error.kind === LogicExceptionKind.NotFound) {
      return (
        <div className="mt-16 text-center">
          <Helmet>
            <title>{formatTitle('Not Found')}</title>
          </Helmet>
          <h3 className="mb-4">Ranklist Not Found</h3>
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
          <title>{formatTitle('Live')}</title>
        </Helmet>
        <p>An error occurred while loading data</p>
        <Button type="primary" size="small" onClick={() => location.reload()}>
          Refresh
        </Button>
      </div>
    );
  }
  if (!ranklist) {
    return (
      <div className="mt-16 text-center">
        <Helmet>
          <title>{formatTitle('Live')}</title>
        </Helmet>
        <Spin />
      </div>
    );
  }
  return (
    <div>
      <Helmet>
        <title>{formatTitle(`Live: ${ranklist.contest.title}`)}</title>
      </Helmet>
      <div className="mt-8 mb-8">
        <StyledRanklist data={ranklist} name={id} showFooter showFilter showProgress isLive />
      </div>
    </div>
  );
}
