import React, { useState, useEffect } from 'react';

export default function ClientOnly(props: { children: () => React.ReactNode }): JSX.Element {
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    // @ts-ignore
    return null;
  }

  // @ts-ignore
  return props.children?.() ?? null;
}
