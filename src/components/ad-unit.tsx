import { useEffect, useRef } from 'react';
import { Platform, View } from 'react-native';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function AdUnit() {
  const containerRef = useRef<View>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const node = containerRef.current as unknown as HTMLElement | null;
    if (!node || node.querySelector('ins.adsbygoogle')) return;

    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.setAttribute('data-ad-client', 'ca-pub-6981194323350325');
    ins.setAttribute('data-ad-slot', '7100917314');
    ins.setAttribute('data-ad-format', 'auto');
    ins.setAttribute('data-full-width-responsive', 'true');
    node.appendChild(ins);

    (window.adsbygoogle = window.adsbygoogle || []).push({});
  }, []);

  if (Platform.OS !== 'web') return null;

  return <View ref={containerRef} />;
}
