import React, { useEffect, useMemo, useState } from 'react';
import type * as srk from '@algoux/standard-ranklist';
import { formatSrkAssetUrl } from '@/utils/srk-asset.util';

type SrkAssetImageProps = {
  image: srk.Image;
  assetScope?: string;
} & Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'>;

export default function SrkAssetImage({
  image,
  assetScope,
  onError,
  style,
  className,
  alt,
  title,
  width,
  height,
  ...rest
}: SrkAssetImageProps) {
  const [hidden, setHidden] = useState(false);

  const src = useMemo(() => {
    return formatSrkAssetUrl(image as unknown as string, assetScope);
  }, [image, assetScope]);

  useEffect(() => {
    setHidden(false);
  }, [image, assetScope]);

  const handleError: React.ReactEventHandler<HTMLImageElement> = (event) => {
    setHidden(true);
    onError?.(event);
  };

  const mergedStyle = hidden ? { ...style, display: 'none' } : style;

  return (
    <img
      {...rest}
      src={src}
      className={className}
      alt={alt}
      title={title}
      width={width}
      height={height}
      style={mergedStyle}
      onError={handleError}
    />
  );
}
