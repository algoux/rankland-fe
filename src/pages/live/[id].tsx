import React, { useEffect, useMemo, useRef, useState } from 'react';
import { resolveText } from '@algoux/standard-ranklist-renderer-component';
import '@algoux/standard-ranklist-renderer-component/dist/style.css';
import 'rc-dialog/assets/index.css';
import type * as srk from '@algoux/standard-ranklist';
import { Helmet, Link, useParams, useLocation } from 'umi';
import StyledRanklist from '@/components/StyledRanklist';
import { api } from '@/services/api';
import { Button, Spin, Switch } from 'antd';
import { LogicException, LogicExceptionKind } from '@/services/api/logic.exception';
import { formatTitle } from '@/utils/title-format.util';
import { useReq } from '@/utils/request';
import { parseRealtimeSolutionBuffer } from '@/utils/realtime-solutions.utils';
import ScrollSolution from '@/components/plugins/ScrollSolution/ScrollSolution';
import { useRemainingHeight } from '@/hooks/use-remaining-height';
import { useClientWidthHeight } from '@/hooks/use-client-wh';
import UserInfoModal from '@/components/UserInfoModal';

const POLL_RANKLIST_INTERVAL = Number(process.env.LIVE_POLLING_INTERVAL);

export default function LiveRanklistPage() {
  const { id: key } = useParams<{ id: string }>();
  const [ranklist, setRanklist] = useState<srk.Ranklist | null>(null);
  const [wsError, setWsError] = useState(false);
  const [remainingHeight] = useRemainingHeight();
  const [{ width: clientWidth }] = useClientWidthHeight();
  const {
    loading: infoLoading,
    data: info,
    error,
  } = useReq(() => api.getLiveRanklistInfo({ uniqueKey: key }), {
    refreshDeps: [key],
  });
  const wsRef = useRef<WebSocket | null>(null);
  const id = useMemo(() => info?.id, [info]);
  // @ts-ignore
  const { query } = useLocation();
  const token = useMemo(() => query.token, [query.token]);
  const enabledScrollSolution = useMemo(() => query.scrollSolution === '1', [query.scrollSolution]);

  const { loading: ranklistLoading, runAsync: fetchRanklist } = useReq(
    () => api.getLiveRanklist({ id: id || '', token }),
    {
      manual: true,
    },
  );

  const loading = infoLoading || ranklistLoading;

  let pollRanklistTimer = useRef<any>(0);

  const scrollSolutionRef = useRef<ScrollSolution>(null);

  useEffect(() => {
    setRanklist(null);
  }, [key]);

  useEffect(() => {
    // if (info?.ranklistUniqueKey) {
    //   Modal.confirm({
    //     title: '比赛已结束，跳转到终榜？',
    //     onOk() {
    //       history.push(formatUrl('Ranklist', { id: info.ranklistUniqueKey }));
    //     },
    //   });
    // }
    if (info) {
      fetchRanklist().then((res) => setRanklist(res));
      if (pollRanklistTimer.current) {
        clearInterval(pollRanklistTimer.current);
      }
      pollRanklistTimer.current = setInterval(() => {
        fetchRanklist().then((res) => setRanklist(res));
      }, POLL_RANKLIST_INTERVAL);
    }
    return () => {
      clearInterval(pollRanklistTimer.current);
    };
  }, [info]);

  useEffect(() => {
    setWsError(false);
    wsRef.current?.close();
    if (!id || !enabledScrollSolution) {
      return;
    }
    let ws: WebSocket;
    try {
      console.log('[ScrollSolution] connecting ws');
      ws = new WebSocket(`${process.env.WS_BASE}/ranking/record/${id}${token ? `?token=${token}` : ''}`);
      ws.binaryType = 'arraybuffer';

      ws.addEventListener('open', (event) => {
        console.log('[ScrollSolution] connection opened');
      });

      ws.addEventListener('message', (event) => {
        let receivedArrayBuffer = event.data;
        if (event.data instanceof ArrayBuffer) {
          const solution = parseRealtimeSolutionBuffer(receivedArrayBuffer);
          console.log('[ScrollSolution] received solution:', { ...solution, id: solution.id.toString() });
          const user = (info?.members || []).find((u) => u.id === solution.userId);
          if (user) {
            scrollSolutionRef.current?.pushSolutions([
              {
                problem: {
                  alias: solution.problemAlias,
                },
                score: {
                  value: solution.solved,
                },
                result: solution.result,
                user: {
                  name: user.name,
                  organization: user.organization,
                },
              },
            ]);
          } else {
            console.warn('[ScrollSolution] skipped scroll solution cuz user not found', solution);
          }
        }
      });

      ws.addEventListener('close', (event) => {
        console.log('[ScrollSolution] connection closed');
        setWsError(true);
      });

      ws.addEventListener('error', (event) => {
        console.error('[ScrollSolution] ws error:', event);
        setWsError(true);
      });

      wsRef.current = ws;
    } catch (exception) {
      console.error('[ScrollSolution] ws exception:', exception);
      setWsError(true);
    }

    return () => {
      console.log('[ScrollSolution] live scroll solutions ws closed', id);
      ws?.close();
    };
  }, [id, token, enabledScrollSolution]);

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

  const handleSwitchScrollSolution = (checked: boolean) => {
    setTimeout(() => {
      const searchParams = new URLSearchParams(window.location.search);
      if (checked) {
        searchParams.append('scrollSolution', '1');
        window.location.search = searchParams.toString();
      } else {
        searchParams.delete('scrollSolution');
        window.location.search = searchParams.toString();
      }
    }, 250);
  };

  return (
    <div>
      <Helmet>
        <title>{formatTitle(`Live: ${resolveText(ranklist.contest.title)}`)}</title>
      </Helmet>
      <div className="mt-8 mb-8" style={{ marginLeft: enabledScrollSolution ? '250px' : undefined }}>
        <StyledRanklist
          data={ranklist}
          name={key}
          id={key}
          showFilter
          showProgress
          showFooter
          isLive
          tableClass="ml-4"
          renderUserModal={(user: srk.User, row: srk.RanklistRow, index: number, ranklist: srk.Ranklist) => {
            return {
              title: user.name,
              width: clientWidth >= 980 ? 960 : clientWidth - 20,
              content: <UserInfoModal user={user} row={row} index={index} ranklist={ranklist} />,
            };
          }}
          renderExtraActionArea={() => (
            <span className="inline-flex items-center">
              <span className="mr-1">实时滚动提交状态</span>
              <Switch defaultChecked={enabledScrollSolution} size="small" onChange={handleSwitchScrollSolution} />
            </span>
          )}
        />
        <ScrollSolution ref={scrollSolutionRef} containerMaxHeight={remainingHeight} />
      </div>
    </div>
  );
}
