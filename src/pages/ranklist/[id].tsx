import React from 'react';
import type * as srk from '@algoux/standard-ranklist';
import '@algoux/standard-ranklist-renderer-component/dist/style.css';
import 'rc-dialog/assets/index.css';
import { Helmet, IGetInitialProps, Link, useParams } from 'umi';
import StyledRanklist from '@/components/StyledRanklist';
import { api } from '@/services/api';
import { Button, Spin } from 'antd';
import { LogicException, LogicExceptionKind } from '@/services/api/logic.exception';
import { formatTitle } from '@/utils/title-format.util';
import UserInfoModal from '@/components/UserInfoModal';
import { useClientWidthHeight } from '@/hooks/use-client-wh';

export default function RanklistPage(props: IRanklistPageProps) {
  const { data, error } = props;
  const { id } = useParams<{ id: string }>();
  const [{ width: clientWidth }] = useClientWidthHeight();

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
  return (
    <div>
      <Helmet>
        <title>{formatTitle(data!.info.name)}</title>
      </Helmet>
      <div className="mt-8 mb-8">
        <StyledRanklist
          data={data!.srk}
          name={id}
          id={id}
          meta={data!.info}
          showFooter
          showFilter
          tableClass="ml-4"
        />
      </div>
    </div>
  );
}

interface IPageParams {
  id: string;
}

const asyncData = ({ id }: { id: string }) => {
  return api.getRanklist({ uniqueKey: id });
};

RanklistPage.getInitialProps = (async (ctx) => {
  try {
    const res = await asyncData({ id: ctx.match.params.id });
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

export interface IRanklistPageProps {
  data?: IPageAsyncData;
  error?: Error;
}
