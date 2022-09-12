import { useEffect, useState } from 'react';
import { throttle } from 'lodash-es';

export function useRemainingHeight() {
  const [remainingHeight, setRemainingHeight] = useState(0);

  const afterResize = () => {
    const remainingHeight =
      document.body.clientHeight - (document.querySelector('.ant-layout-header')?.getBoundingClientRect().height || 0);
    setRemainingHeight(remainingHeight);
  };
  const whenWindowResized = throttle(afterResize, 250);

  useEffect(() => {
    afterResize();
  });

  useEffect(() => {
    window.addEventListener('resize', whenWindowResized);
    return () => window.removeEventListener('resize', whenWindowResized);
  }, []);

  return [remainingHeight] as const;
}
