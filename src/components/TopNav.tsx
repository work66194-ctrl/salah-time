'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MapPin, Menu, X } from 'lucide-react';
import styles from './TopNav.module.css';

export default function TopNav() {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navItems = [
        { href: '/mosques', label: 'Mosques' },
        { href: '/register', label: 'Add your mosque' },
        { href: '/admin', label: 'Admin Portal' },
    ];

    return (
        <nav className={styles.navbar}>
            <div className={styles.navContainer}>

                {/* Logo Section */}
                <Link href="/" className={styles.logoLink} onClick={() => setMobileMenuOpen(false)}>
                    <div className={styles.logoIcon}>
                        <MapPin size={22} color="white" />
                    </div>
                    <span className={styles.logoText}>Salah<span style={{ color: 'var(--primary-color)' }}>Time</span></span>
                </Link>

                {/* Desktop Navigation */}
                <div className={styles.desktopLinks}>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </div>

                {/* Mobile Hamburger Button */}
                <button
                    className={styles.mobileMenuBtn}
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className={styles.mobileMenu}>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`${styles.mobileNavLink} ${isActive ? styles.active : ''}`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </div>
            )}
        </nav>
    );
}
