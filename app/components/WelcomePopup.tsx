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
                    <p><b>Hi ARMY! Welcome to Love for BTS💜</b></p> 
                    <p>Where you can join and write letters to BTS! Whether you want to share your love, appreciation, or just a few heartfelt words, this is right and only place to do it.</p>
                    <p><b>This website is still in developments,</b> and we need your support to make it perfect! Also please help us by sharing this website to all ARMYs, so we can build this global community together!</p>
                    <p>Don't forget to support us on <b><a href="https://ko-fi.com/kpopgenerator" target="_blank" rel="noopener noreferrer">Ko-fi</a></b> to keep this website running! Thanks for being a part of our community!</p>
                    <button className={styles.agreeButton} onClick={handleAgree}>
                        Yes I understand 💜
                    </button>
                </div>
            </div>
        </div>
    );
}
