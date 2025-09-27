import Link from 'next/link';
import type { ReactNode } from 'react';

type NavButtonProps = {
  href: string;
  children: ReactNode;
};

export default function NavButton({ href, children }: NavButtonProps) {
  return (
    <Link href={href} style={{
      position: 'absolute',
      top: '1rem',
      right: '1rem',
      zIndex: 20,
      padding: '0.5rem 1rem',
      backgroundColor: 'rgba(0,0,0,0.5)',
      color: 'white',
      borderRadius: '0.5rem',
      textDecoration: 'none'
    }}>
      {children}
    </Link>
  );
}
