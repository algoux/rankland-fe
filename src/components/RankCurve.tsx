import React, { useEffect, useRef } from 'react';
import { Chart } from '@antv/g2';
import { formatTimeDuration, secToTimeStr } from '@algoux/standard-ranklist-utils';
import { useModel } from 'umi';
import type { IRankTimePoint, IRankTimeSeriesSegment } from '@/utils/rank-time-data.util';
import type { IRankTimeData } from './RankTimeDataContext';

export type IRankCurveProps = Pick<
  IRankTimeData,
  'unit' | 'points' | 'solvedEventPoints' | 'seriesSegments' | 'totalUsers'
>;

/**
 * RankCurve
 * @param props
 * @warn 静态组件，数据变化时请加 key 来触发强制重新渲染
 */
export default function RankCurve(props: IRankCurveProps) {
  const { unit, points, solvedEventPoints, seriesSegments, totalUsers } = props;

  const container = useRef<HTMLDivElement>(null);
  const chart = useRef<Chart | null>(null);
  const { theme } = useModel('theme');

  const primaryColor = '#5b8ff9';
  const solvedColor = '#64de7c';
  const acColor = '#99ff99';
  const fbColor = '#009900';
  const animationDuration = 2000;

  const maxTime = points[points.length - 1].time;
  const maxRank = Math.min(Math.max(50, Math.max(...points.map((item) => item.rank)) + 10), totalUsers);
  const yTicks = [1];
  for (let i = 50; i <= maxRank; i += 50) {
    yTicks.push(i);
  }

  function updateChartDueToThemeChange(chart: Chart, theme: 'light' | 'dark') {
    chart.theme({ type: theme === 'dark' ? 'classicDark' : 'classic' });
    chart.interaction('tooltip', {
      crosshairsStroke: theme === 'dark' ? '#dadada' : '#373737',
      crosshairsLineWidth: 1,
    });
    chart.render();
  }

  useEffect(() => {
    if (chart.current) {
      updateChartDueToThemeChange(chart.current, theme);
    }
  }, [theme]);

  useEffect(() => {
    if (!chart.current) {
      chart.current = renderChart(container.current!);
    }
    return () => {
      chart.current?.destroy();
      chart.current = null;
    };
  }, []);

  function renderChart(container: HTMLDivElement) {
    const chart = new Chart({
      container,
      theme: theme === 'dark' ? 'classicDark' : 'classic',
      autoFit: true,
      paddingLeft: 'auto',
      paddingBottom: 'auto',
    });

    chart
      .line()
      .data(points)
      .encode('x', 'time')
      .encode('y', 'rank')
      .scale('y', { type: 'linear', domain: [1, maxRank], tickMethod: () => yTicks, range: [0, 1] })
      .axis('x', {
        title: `时间（${unit}）`,
      })
      .axis('y', {
        title: '主排名',
      })
      .tooltip({
        title: (d: IRankTimePoint) => `${secToTimeStr(formatTimeDuration([d.time, unit], 's'))}`,
        items: [
          (d: IRankTimePoint, index, _data, column) => ({
            name: '主排名',
            value: column.y.value[index!],
          }),
          (d: IRankTimePoint) => ({
            name: '解题数',
            color: solvedColor,
            value: d.solved,
          }),
        ],
      })
      .animate('enter', { type: 'pathIn', duration: animationDuration });

    for (const s of seriesSegments) {
      chart
        .area()
        .data(s.points)
        .transform({ type: 'groupX', y: 'mean', y1: 'mean' })
        .encode('x', 'time')
        .encode('y', ['start', 'end'])
        .axis('y', {
          labelFilter: (v: number) => v > 0,
        })
        .scale('y', { nice: true })
        .style('fill', s.resolvedColor)
        .style('fillOpacity', 0.3)
        .tooltip({
          title: '',
          items: [
            (d: IRankTimeSeriesSegment, index, _data, column) => ({
              name: s.title,
              value: `${column.y.value[index!]}-${column.y1.value[index!]}`,
            }),
          ],
        });
    }

    for (const p of solvedEventPoints) {
      const startAt = (maxTime ? (p.time / maxTime) * animationDuration : animationDuration) + 200;
      chart
        .text()
        .data([p])
        .encode('x', 'time')
        .encode('y', 'rank')
        .encode('shape', 'badge')
        .style({
          text: `${p.rank}`,
          dy: -1,
          fill: '#fff',
          markerSize: 24,
          markerFill: p.fb ? fbColor : primaryColor,
          markerFillOpacity: 0.65,
        })
        .tooltip({
          title: '',
          items: [
            () => ({
              name: p.fb ? 'FB' : 'AC',
              color: p.fb ? fbColor : acColor,
              value: `${p.problemAlias} (${`${secToTimeStr(formatTimeDuration(p.solvedTime, 's'))}`})`,
            }),
          ],
        })
        .animate('enter', { type: 'zoomIn', duration: 200, delay: startAt });
    }

    chart.interaction('tooltip', {
      crosshairsStroke: theme === 'dark' ? '#dadada' : '#373737',
      crosshairsLineWidth: 1,
    });

    chart.render();

    return chart;
  }

  return (
    <div>
      <div ref={container} style={{ height: '400px' }} />
    </div>
  );
}
