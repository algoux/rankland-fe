import React from 'react';
import type * as srk from '@algoux/standard-ranklist';
import { createCheckers } from 'ts-interface-checker';
import srkChecker from '@/lib/srk-checker/index.d.ti';
import StyledRanklistRenderer from './StyledRanklistRenderer';
import type { IStyledRanklistRendererProps } from './StyledRanklistRenderer';

const { Ranklist: ranklistChecker } = createCheckers(srkChecker);

export default function StyledRanklist(props: IStyledRanklistRendererProps) {
  let srkCheckError: string | null = null;

  try {
    ranklistChecker.check(props.data);
    srkCheckError = null;
  } catch (e) {
    srkCheckError = e.message;
  }

  return srkCheckError ? (
    <div className="ml-8">
      <h3>Error occurred while checking srk:</h3>
      <pre>{srkCheckError}</pre>
    </div>
  ) : (
    <StyledRanklistRenderer {...props} />
  );
}
