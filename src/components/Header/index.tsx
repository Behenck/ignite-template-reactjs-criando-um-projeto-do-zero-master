import styles from './header.module.scss';
import Link from 'next/link';

export default function Header() {
  return (
    <header className={styles.headerContainer}>
      <Link href={`/`}>
        <a href="#">
          <img src="/Logo.svg" alt="logo" />
        </a>
      </Link>
    </header>
  )
}
