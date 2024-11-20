'use client';

import { useState, useEffect } from 'react';
import styles from '../styles/WelcomePopup.module.css';

export default function WelcomePopup() {
    const [isVisible, setIsVisible] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        const hasAgreed = localStorage.getItem('userAgreedWelcome');
        setIsInitialized(true);
        if (!hasAgreed) {
            setTimeout(() => {
                setIsVisible(true);
            }, 100);
        }
    }, []);

    const handleClose = () => {
        setIsVisible(false);
    };

    const handleAgree = () => {
        localStorage.setItem('userAgreedWelcome', 'true');
        setIsVisible(false);
    };

    if (!isInitialized) return null;
    if (!isVisible) return null;

    return (
        <div className={`${styles.overlay} ${isVisible ? styles.visible : ''}`}>
            <div className={`${styles.popup} ${isVisible ? styles.visible : ''}`}>
                <button className={styles.closeButton} onClick={handleClose}>×</button>
                <div className={styles.content}>
                    <p className="font-fredoka text-3xl mb-4"><b>Hi ARMY, Welcome to Love for BTS💜</b></p> 
                    <p className="font-fredoka mb-3">Where you can join and write letters to BTS! Whether you want to share love, appreciation, or just a few words, this is right place for you.</p>
                    <p className="font-fredoka mb-3"><b>This website is still in development,</b> and we need your full support to make it perfect! Also please help us by share this website to all ARMYs and BTS as well (nothing impossible!), so let's build this to become the biggest & best global community!</p>
                    <p className="font-fredoka mb-4">Don't forget to support us on <b><a href="https://ko-fi.com/kpopgenerator" target="_blank" rel="noopener noreferrer">Ko-fi</a></b> to keep this website running. Thanks for being a part of our community!</p>
                    <button className={`${styles.agreeButton} font-fredoka`} onClick={handleAgree}>
                        Yes I understand 💜
                    </button>
                </div>
            </div>
        </div>
    );
}
