import React from 'react';

export interface BeianLinkProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function BeianLink(props: any) {
  return (
    <a href="https://beian.miit.gov.cn/" target="_blank" className={props.className} style={props.style}>
      {process.env.BEIAN || ''}
    </a>
  );
}
