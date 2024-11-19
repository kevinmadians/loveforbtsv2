'use client';

import { useState, useEffect } from 'react';
import styles from '../styles/WelcomePopup.module.css';

export default function WelcomePopup() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const hasAgreed = localStorage.getItem('userAgreedWelcome');
        if (!hasAgreed) {
            setIsVisible(true);
        }
    }, []);

    const handleClose = () => {
        setIsVisible(false);
    };

    const handleAgree = () => {
        localStorage.setItem('userAgreedWelcome', 'true');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.popup}>
                <button className={styles.closeButton} onClick={handleClose}>×</button>
                <div className={styles.content}>
                    <p><b>Hi ARMY! Welcome to Love for BTS💜</b></p> 
                    <p>Where you can join and write letters to BTS! Whether you want to share your love, appreciation, or just a few heartfelt words, this is right and only place to do it.</p>
                    <p>Not only can you write your own letter, but you'll also be able to read letters from ARMYs all over the world. It's a place for us to connect, so let's show our love and let BTS know how much they mean to us!</p>
                    <p><b>This website is still in development,</b> and we need your support to make it perfect! Also please help us by sharing this website to all ARMYs, so we can build this global community together!</p>
                    <p>Don't forget to support us on <b><a href="https://ko-fi.com/kpopgenerator" target="_blank" rel="noopener noreferrer">Ko-fi</a></b> to keep this website running! Thank you for being a part of our community!</p>
                    <button className={styles.agreeButton} onClick={handleAgree}>
                        Yes I understand 💜
                    </button>
                </div>
            </div>
        </div>
    );
}
