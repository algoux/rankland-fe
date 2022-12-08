import { useEffect, useState } from 'react';
import { useLocation } from 'umi';
import { toUnicode } from 'punycode/';

export function useCurrentUrl() {
  const [currentFullUrl, setCurrentFullUrl] = useState('');
  const location = useLocation();
  useEffect(() => {
    const host = toUnicode(window.location.host);
    let url = `${window.location.protocol}//${host}${location.pathname}`;
    let search = '';
    // @ts-ignore
    Object.keys(location.query).forEach((key, index) => {
      // @ts-ignore
      search += `${index ? '&' : ''}${key}=${location.query[key]}`;
    });
    url += search ? `?${search}` : '';
    setCurrentFullUrl(url);
  }, [location]);
  return currentFullUrl;
}
