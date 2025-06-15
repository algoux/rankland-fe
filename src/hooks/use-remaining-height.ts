import { useEffect, useState } from 'react';
import { throttle } from 'lodash-es';

export function useRemainingHeight() {
  const [remainingHeight, setRemainingHeight] = useState(0);

  const afterResize = () => {
    const remainingHeight =
      document.body.clientHeight - (document.querySelector('.ant-layout-header')?.getBoundingClientRect().height || 0);
    console.log('Remaining height:', remainingHeight);
    setRemainingHeight(remainingHeight);
  };
  const whenWindowResized = throttle(afterResize, 250);

  useEffect(() => {
    afterResize();
  }, []);

  useEffect(() => {
    window.addEventListener('resize', whenWindowResized);
    return () => window.removeEventListener('resize', whenWindowResized);
  }, []);

  useEffect(() => {
    const observer = new ResizeObserver(whenWindowResized);
    observer.observe(document.body);
    return () => observer.disconnect();
  }, []);

  const refresh = afterResize;

  return [remainingHeight, refresh] as const;
}
