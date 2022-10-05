import { useEffect, useState } from 'react';
import { throttle } from 'lodash-es';

export function useClientWidthHeight() {
  const [wh, setWh] = useState({
    width: 0,
    height: 0,
  });

  const afterResize = () => {
    setWh({
      width: document.body.clientWidth,
      height: document.body.clientHeight,
    });
  };
  const whenWindowResized = throttle(afterResize, 250);

  useEffect(() => {
    afterResize();
  }, []);

  useEffect(() => {
    window.addEventListener('resize', whenWindowResized);
    return () => window.removeEventListener('resize', whenWindowResized);
  }, []);

  return [wh] as const;
}
