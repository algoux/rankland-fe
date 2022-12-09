import { useEffect, useState } from 'react';
import { useLocation } from 'umi';
import { toUnicode } from 'punycode/';

export function useCurrentUrl() {
  const [currentUrl, setCurrentUrl] = useState('');
  const [currentFullUrl, setCurrentFullUrl] = useState('');
  const location = useLocation();
  useEffect(() => {
    const host = toUnicode(window.location.host);
    let url = location.pathname;
    let search = '';
    // @ts-ignore
    Object.keys(location.query).forEach((key, index) => {
      // @ts-ignore
      search += `${index ? '&' : ''}${key}=${location.query[key]}`;
    });
    url += search ? `?${search}` : '';
    setCurrentUrl(url);
    setCurrentFullUrl(`${window.location.protocol}//${host}${url}`);
  }, [location]);
  return { url: currentUrl, fullUrl: currentFullUrl };
}
