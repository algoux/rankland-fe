import React from 'react';
import type SrkPlaygroundType from '@/components/SrkPlayground';
import { Helmet, isBrowser, dynamic } from 'umi';

const Loading = () => <p>Loading...</p>;

const SrkPlayground: typeof SrkPlaygroundType = dynamic({
  loader: async () => {
    const { default: SrkPlayground } = await import(/* webpackChunkName: "components-SrkPlayground" */ '@/components/SrkPlayground');
    return SrkPlayground;
  },
  loading: () => Loading(),
});

export default function Playground() {
  return (
    <div>
      <Helmet>
        <title>Playground | RankLand</title>
      </Helmet>
      {isBrowser() ? (
        <div>
          <SrkPlayground />
        </div>
      ) : <div />}
    </div>
  );
}
