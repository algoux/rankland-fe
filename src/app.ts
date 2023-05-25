import Long from 'long';
import { isBrowser } from 'umi';

if (isBrowser()) {
  // @ts-ignore
  window.Long = Long;
}
