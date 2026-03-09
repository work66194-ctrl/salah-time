import Link from 'next/link';
import { Heart } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="footer-container">
            <div className="footer-content">
                <div className="footer-info">
                    <h3>Allahabad Salah Time</h3>
                    <p>Providing accurate prayer timings and mosque locations for the community.</p>
                </div>

                <div className="footer-links">
                    <h4>Quick Links</h4>
                    <ul>
                        <li><Link href="/">Home</Link></li>
                        <li><Link href="/mosques">Mosques</Link></li>
                        <li><Link href="/register">Add Mosque</Link></li>
                        <li><Link href="/admin/login">Admin Portal</Link></li>
                    </ul>
                </div>
            </div>

            <div className="footer-bottom">
                <p>Built by <a href="https://mine-vrpo.onrender.com/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>abdarrehmaan</a></p>
                <p className="copyright">© {new Date().getFullYear()} Salah Time. All rights reserved.</p>
            </div>
        </footer>
    );
}
