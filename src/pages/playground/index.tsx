import React from 'react';
import type SrkPlaygroundType from '@/components/SrkPlayground';
import { Helmet, isBrowser, dynamic } from 'umi';
import { formatTitle } from '@/utils/title-format.util';
import Loading from '@/components/Loading';

const SrkPlayground: typeof SrkPlaygroundType = dynamic({
  loader: async () => {
    const { default: SrkPlayground } = await import(
      /* webpackChunkName: "components-SrkPlayground" */ '@/components/SrkPlayground'
    );
    return SrkPlayground;
  },
  loading: Loading,
});

export default function Playground() {
  return (
    <div>
      <Helmet>
        <title>{formatTitle('Playground')}</title>
      </Helmet>
      <div>{isBrowser() ? <SrkPlayground /> : <Loading />}</div>
    </div>
  );
}
