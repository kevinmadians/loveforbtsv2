'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '../../firebase/config';
import { doc, getDoc, updateDoc, increment, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Letter } from '../../types/Letter';
import type { Metadata } from "next";
import '../../styles/global.css';
import Swal from 'sweetalert2';
import { HiDownload } from 'react-icons/hi';

const SpotifyPlayer = dynamic(() => import('../../components/SpotifyPlayer'), {
  ssr: false
});

export default function LetterPage() {
  const params = useParams();
  const router = useRouter();
  const [letter, setLetter] = useState<Letter | null>(null);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const fetchLetter = async () => {
      try {
        const letterId = params.id as string;
        const letterRef = doc(db, 'letters', letterId);
        const letterDoc = await getDoc(letterRef);
        
        if (letterDoc.exists()) {
          const data = letterDoc.data();
          setLetter({
            id: letterDoc.id,
            ...data
          } as Letter);
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error('Error fetching letter:', error);
        router.push('/');
      }
    };

    fetchLetter();
  }, [params.id, router]);

  useEffect(() => {
    if (letter) {
      const likedLetters = new Set(JSON.parse(localStorage.getItem('likedLetters') || '[]'));
      setIsLiked(likedLetters.has(letter.id));
    }
  }, [letter]);

  const handleShare = async (platform: string) => {
    if (!letter) return;
    
    const letterUrl = `${window.location.origin}/letter/${letter.id}`;
    const text = `Read this love letter to ${letter.member} from ARMY! 💜`;
    
    if (platform === 'image') {
      try {
        // Dynamically import html2canvas only when sharing as image
        const html2canvas = (await import('html2canvas')).default;
        const cardElement = document.getElementById('letter-card');
        if (!cardElement) return;

        const canvas = await html2canvas(cardElement, {
          backgroundColor: '#C688F8',
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: true,
        });

        // Convert to PNG and download
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.download = `letter-to-${letter.member.toLowerCase()}.png`;
        link.href = dataUrl;
        link.click();

      } catch (error) {
        console.error('Error sharing as image:', error);
      }
    } else {
      let shareUrl = '';
      switch (platform) {
        case 'whatsapp':
          shareUrl = `https://wa.me/?text=${encodeURIComponent(`${text}\n\n${letterUrl}`)}`;
          break;
        case 'telegram':
          shareUrl = `https://t.me/share/url?url=${encodeURIComponent(letterUrl)}&text=${encodeURIComponent(text)}`;
          break;
        case 'facebook':
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(letterUrl)}`;
          break;
        case 'twitter':
          shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${text}\n\n${letterUrl}`)}`;
          break;
        case 'copy':
          try {
            await navigator.clipboard.writeText(letterUrl);
            Swal.fire({
              title: 'Link Copied!',
              text: 'You can now share it with ARMYs! 💜',
              icon: 'success',
              confirmButtonText: 'OK',
              confirmButtonColor: '#9333EA',
            });
            return;
          } catch (err) {
            console.error('Failed to copy:', err);
            Swal.fire({
              title: 'Error',
              text: 'Failed to copy link',
              icon: 'error',
              confirmButtonText: 'OK',
              confirmButtonColor: '#9333EA',
            });
          }
          return;
        case 'native':
          try {
            const file = new File([new Blob([letterUrl], { type: 'text/plain' })], `letter-to-${letter.member.toLowerCase()}.txt`, { type: 'text/plain' });
            await navigator.share({
              title: `Letter to ${letter.member}`,
              text: `Read this love letter to ${letter.member} from ARMY! 💜`,
              files: [file]
            });
            return;
          } catch (err) {
            console.log('Native sharing failed, falling back to default share');
          }
      }
      if (shareUrl) {
        window.open(shareUrl, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const handleLike = async () => {
    if (!letter) return;
    const currentUserId = localStorage.getItem('userId') || crypto.randomUUID();
    
    if (!localStorage.getItem('userId')) {
      localStorage.setItem('userId', currentUserId);
    }

    try {
      const letterRef = doc(db, 'letters', letter.id);
      
      await updateDoc(letterRef, {
        likes: increment(isLiked ? -1 : 1),
        likedBy: isLiked ? arrayRemove(currentUserId) : arrayUnion(currentUserId)
      });

      setLetter(prev => prev ? {
        ...prev,
        likes: (prev.likes || 0) + (isLiked ? -1 : 1)
      } : null);
      setIsLiked(!isLiked);

      const likedLetters = new Set(JSON.parse(localStorage.getItem('likedLetters') || '[]'));
      if (isLiked) {
        likedLetters.delete(letter.id);
      } else {
        likedLetters.add(letter.id);
      }
      localStorage.setItem('likedLetters', JSON.stringify([...likedLetters]));

    } catch (error) {
      console.error('Error updating likes:', error);
    }
  };

  const addWatermark = (element: HTMLElement) => {
    const watermark = document.createElement('div');
    watermark.className = 'watermark-text';
    watermark.textContent = 'LOVEFORBTS.COM';
    watermark.style.cssText = `
      position: absolute;
      bottom: 1rem;
      left: 50%;
      transform: translateX(-50%);
      font-size: 1rem;
      color: rgba(255, 255, 255, 0.7);
      font-weight: 500;
      letter-spacing: 0.1em;
      z-index: 50;
    `;
    element.appendChild(watermark);
    return watermark;
  };

  const handleDownload = async () => {
    if (!letter) return;
    
    const cardElement = document.querySelector('.detail-card') as HTMLElement;
    if (!cardElement) return;

    // Store elements to be modified
    const headerSection = document.querySelector('.text-center.max-w-4xl') as HTMLElement;
    const writeButton = cardElement.querySelector('.mt-4.text-center > button') as HTMLElement;
    const shareContainer = cardElement.querySelector('.share-buttons-container')?.parentElement as HTMLElement;
    const shareText = cardElement.querySelector('p.text-center.italic.text-sm.text-black\\/70') as HTMLElement;
    const listenText = cardElement.querySelector('p.text-center.text-sm.text-white\\/80.mt-6.mb-3') as HTMLElement;
    const loveButton = document.querySelector('div.w-full.max-w-2xl.mx-auto.relative.z-10 > div > div.flex.flex-col.pt-4.border-t.border-black\\/20 > div.flex.justify-center > button') as HTMLElement;
    const loveButtonContainer = loveButton?.closest('.flex.justify-center') as HTMLElement;
    const createButton = document.querySelector('div.w-full.max-w-2xl.mx-auto.relative.z-10 > div > div.mt-4.text-center > button') as HTMLElement;
    const overlayElements = cardElement.querySelectorAll('.gradient-bg, .bg-pattern, .floating-stickers');
    const quoteElements = cardElement.querySelectorAll('.text-white\\/20.transform');
    
    // Store original styles
    const originalStyles = new Map();
    overlayElements.forEach((el) => {
      originalStyles.set(el, (el as HTMLElement).style.cssText);
    });
    quoteElements.forEach((el) => {
      originalStyles.set(el, (el as HTMLElement).style.cssText);
    });
    if (writeButton) {
      originalStyles.set(writeButton, writeButton.style.cssText);
    }
    if (cardElement) {
      originalStyles.set(cardElement, cardElement.style.cssText);
    }
    if (loveButton) {
      originalStyles.set(loveButton, loveButton.style.cssText);
    }
    if (loveButtonContainer) {
      originalStyles.set(loveButtonContainer, loveButtonContainer.style.cssText);
    }
    if (createButton) {
      originalStyles.set(createButton, createButton.style.cssText);
    }
    
    let watermark: HTMLElement | null = null;

    try {
      // Hide non-essential elements
      if (headerSection) headerSection.style.display = 'none';
      if (writeButton) writeButton.style.display = 'none';
      if (shareContainer) shareContainer.style.display = 'none';
      if (shareText) shareText.style.display = 'none';
      if (listenText) listenText.style.display = 'none';
      if (loveButtonContainer) loveButtonContainer.style.display = 'none';
      if (loveButton) loveButton.style.display = 'none';
      if (createButton) createButton.style.display = 'none';

      // Store original styles for restoration
      const originalCardStyles = {
        width: cardElement.style.width,
        transform: cardElement.style.transform,
        position: cardElement.style.position,
        margin: cardElement.style.margin,
        padding: cardElement.style.padding,
        display: cardElement.style.display,
        flexDirection: cardElement.style.flexDirection,
        background: cardElement.style.background,
        backgroundColor: cardElement.style.backgroundColor,
        minHeight: cardElement.style.minHeight
      };

      // Set up card element for capture
      cardElement.style.width = '800px';
      cardElement.style.transform = 'none';
      cardElement.style.position = 'relative';
      cardElement.style.margin = '0 auto';
      cardElement.style.padding = '2rem';
      cardElement.style.display = 'flex';
      cardElement.style.flexDirection = 'column';
      cardElement.style.backgroundColor = '#C688F8';
      cardElement.style.minHeight = '1200px';

      // Create and position gradient background
      const gradientBg = cardElement.querySelector('.gradient-bg') as HTMLElement;
      if (gradientBg) {
        gradientBg.style.position = 'absolute';
        gradientBg.style.top = '0';
        gradientBg.style.left = '0';
        gradientBg.style.width = '100%';
        gradientBg.style.height = '100%';
        gradientBg.style.opacity = '1';
        gradientBg.style.background = 'linear-gradient(135deg, #C688F8 0%, #B674E7 100%)';
        gradientBg.style.zIndex = '0';
      }

      // Position pattern background
      const patternBg = cardElement.querySelector('.bg-pattern') as HTMLElement;
      if (patternBg) {
        patternBg.style.position = 'absolute';
        patternBg.style.top = '0';
        patternBg.style.left = '0';
        patternBg.style.width = '100%';
        patternBg.style.height = '100%';
        patternBg.style.opacity = '0.1';
        patternBg.style.zIndex = '1';
      }

      // Position floating stickers
      const stickers = cardElement.querySelector('.floating-stickers') as HTMLElement;
      if (stickers) {
        stickers.style.position = 'absolute';
        stickers.style.top = '0';
        stickers.style.left = '0';
        stickers.style.width = '100%';
        stickers.style.height = '100%';
        stickers.style.opacity = '0.3';
        stickers.style.zIndex = '2';
      }

      // Make quote elements more visible
      quoteElements.forEach((el) => {
        const element = el as HTMLElement;
        element.style.opacity = '0.4';
        element.style.color = 'rgba(255, 255, 255, 0.4)';
        element.style.position = 'absolute';
        element.style.zIndex = '3';
      });

      // Add watermark
      watermark = addWatermark(cardElement);
      if (watermark) {
        watermark.style.zIndex = '10';
      }

      // Ensure content is visible and properly positioned
      const letterContent = cardElement.querySelector('.letter-content') as HTMLElement;
      if (letterContent) {
        letterContent.style.opacity = '1';
        letterContent.style.visibility = 'visible';
        letterContent.style.position = 'relative';
        letterContent.style.zIndex = '5';
        letterContent.style.padding = '1rem';
      }

      // Capture the image
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardElement, {
        backgroundColor: '#C688F8',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: true,
        width: 800,
        height: 1200,
        onclone: (clonedDoc) => {
          const clonedCard = clonedDoc.querySelector('.detail-card') as HTMLElement;
          if (clonedCard) {
            // Apply the same styles to cloned element
            clonedCard.style.width = '800px';
            clonedCard.style.transform = 'none';
            clonedCard.style.position = 'relative';
            clonedCard.style.margin = '0 auto';
            clonedCard.style.padding = '2rem';
            clonedCard.style.display = 'flex';
            clonedCard.style.flexDirection = 'column';
            clonedCard.style.backgroundColor = '#C688F8';
            clonedCard.style.minHeight = '1200px';

            // Hide create button in cloned element
            const clonedCreateButton = clonedDoc.querySelector('div.w-full.max-w-2xl.mx-auto.relative.z-10 > div > div.mt-4.text-center > button') as HTMLElement;
            if (clonedCreateButton) {
              clonedCreateButton.style.display = 'none';
            }

            // Clone background elements with proper styles
            const clonedGradient = clonedCard.querySelector('.gradient-bg') as HTMLElement;
            if (clonedGradient) {
              clonedGradient.style.position = 'absolute';
              clonedGradient.style.top = '0';
              clonedGradient.style.left = '0';
              clonedGradient.style.width = '100%';
              clonedGradient.style.height = '100%';
              clonedGradient.style.opacity = '1';
              clonedGradient.style.background = 'linear-gradient(135deg, #C688F8 0%, #B674E7 100%)';
              clonedGradient.style.zIndex = '0';
            }

            const clonedPattern = clonedCard.querySelector('.bg-pattern') as HTMLElement;
            if (clonedPattern) {
              clonedPattern.style.position = 'absolute';
              clonedPattern.style.top = '0';
              clonedPattern.style.left = '0';
              clonedPattern.style.width = '100%';
              clonedPattern.style.height = '100%';
              clonedPattern.style.opacity = '0.1';
              clonedPattern.style.zIndex = '1';
            }

            const clonedStickers = clonedCard.querySelector('.floating-stickers') as HTMLElement;
            if (clonedStickers) {
              clonedStickers.style.position = 'absolute';
              clonedStickers.style.top = '0';
              clonedStickers.style.left = '0';
              clonedStickers.style.width = '100%';
              clonedStickers.style.height = '100%';
              clonedStickers.style.opacity = '0.3';
              clonedStickers.style.zIndex = '2';
            }

            // Ensure all content is visible and positioned correctly
            const elements = clonedCard.getElementsByTagName('*');
            Array.from(elements).forEach((el) => {
              const element = el as HTMLElement;
              if (element.style.display !== 'none') {
                element.style.opacity = '1';
                element.style.visibility = 'visible';
              }
            });

            // Position content in cloned element
            const clonedContent = clonedCard.querySelector('.letter-content') as HTMLElement;
            if (clonedContent) {
              clonedContent.style.position = 'relative';
              clonedContent.style.zIndex = '5';
              clonedContent.style.padding = '1rem';
            }

            // Position quotes in cloned element
            const clonedQuotes = clonedCard.querySelectorAll('.text-white\\/20.transform');
            clonedQuotes.forEach((el) => {
              const element = el as HTMLElement;
              element.style.opacity = '0.4';
              element.style.color = 'rgba(255, 255, 255, 0.4)';
              element.style.position = 'absolute';
              element.style.zIndex = '3';
            });
          }
        }
      });

      // Convert to PNG and download
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `letter-to-${letter.member.toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();

      // Restore original card styles
      Object.entries(originalCardStyles).forEach(([property, value]) => {
        cardElement.style[property as any] = value;
      });

    } catch (error) {
      console.error('Error downloading letter:', error);
      alert('Failed to download letter. Please try again.');
    } finally {
      // Restore original styles
      if (headerSection) headerSection.style.display = '';
      if (writeButton) writeButton.style.cssText = originalStyles.get(writeButton) || '';
      if (shareContainer) shareContainer.style.display = '';
      if (shareText) shareText.style.display = '';
      if (listenText) listenText.style.display = '';
      if (loveButton) loveButton.style.cssText = originalStyles.get(loveButton) || '';
      if (loveButtonContainer) loveButtonContainer.style.cssText = originalStyles.get(loveButtonContainer) || '';
      if (cardElement) cardElement.style.cssText = originalStyles.get(cardElement) || '';
      if (createButton) createButton.style.cssText = originalStyles.get(createButton) || '';
      
      overlayElements.forEach((el) => {
        (el as HTMLElement).style.cssText = originalStyles.get(el) || '';
      });
      quoteElements.forEach((el) => {
        (el as HTMLElement).style.cssText = originalStyles.get(el) || '';
      });
      
      if (watermark && watermark.parentElement) {
        watermark.parentElement.removeChild(watermark);
      }
    }
  };

  const handleShareImage = async (platform: string) => {
    if (!letter) return;
    
    const cardElement = document.querySelector('.detail-card') as HTMLElement;
    if (!cardElement) return;

    // Store elements to be modified
    const headerSection = document.querySelector('.text-center.max-w-4xl') as HTMLElement;
    const writeButton = cardElement.querySelector('.mt-4.text-center > button') as HTMLElement;
    const shareContainer = cardElement.querySelector('.share-buttons-container')?.parentElement as HTMLElement;
    const shareText = cardElement.querySelector('p.text-center.italic.text-sm.text-black\\/70') as HTMLElement;
    const listenText = cardElement.querySelector('p.text-center.text-sm.text-white\\/80.mt-6.mb-3') as HTMLElement;
    const loveButton = document.querySelector('div.w-full.max-w-2xl.mx-auto.relative.z-10 > div > div.flex.flex-col.pt-4.border-t.border-black\\/20 > div.flex.justify-center > button') as HTMLElement;
    const loveButtonContainer = loveButton?.closest('.flex.justify-center') as HTMLElement;
    const overlayElements = cardElement.querySelectorAll('.gradient-bg, .bg-pattern, .floating-stickers');
    const quoteElements = cardElement.querySelectorAll('.text-white\\/20.transform');

    // Store original styles
    const originalStyles = new Map();
    overlayElements.forEach((el) => {
      originalStyles.set(el, (el as HTMLElement).style.cssText);
    });
    quoteElements.forEach((el) => {
      originalStyles.set(el, (el as HTMLElement).style.cssText);
    });
    if (writeButton) {
      originalStyles.set(writeButton, writeButton.style.cssText);
    }
    if (cardElement) {
      originalStyles.set(cardElement, cardElement.style.cssText);
    }
    if (loveButton) {
      originalStyles.set(loveButton, loveButton.style.cssText);
    }
    if (loveButtonContainer) {
      originalStyles.set(loveButtonContainer, loveButtonContainer.style.cssText);
    }

    let watermark: HTMLElement | null = null;

    try {
      // Temporarily hide elements and adjust overlay opacity
      if (headerSection) headerSection.style.display = 'none';
      if (writeButton) {
        writeButton.style.opacity = '0';
        writeButton.style.visibility = 'hidden';
      }
      if (shareContainer) shareContainer.style.display = 'none';
      if (shareText) shareText.style.display = 'none';
      if (listenText) listenText.style.display = 'none';
      if (loveButtonContainer) {
        loveButtonContainer.style.display = 'none';
        loveButtonContainer.style.height = '0';
        loveButtonContainer.style.overflow = 'hidden';
        loveButtonContainer.style.opacity = '0';
        loveButtonContainer.style.visibility = 'hidden';
      }
      if (loveButton) {
        loveButton.style.display = 'none';
        loveButton.style.height = '0';
        loveButton.style.overflow = 'hidden';
        loveButton.style.opacity = '0';
        loveButton.style.visibility = 'hidden';
      }
      overlayElements.forEach((el) => {
        (el as HTMLElement).style.opacity = '0.3';
      });

      // Make quote elements more visible in the output
      quoteElements.forEach((el) => {
        (el as HTMLElement).style.opacity = '0.4';
        (el as HTMLElement).style.color = 'rgba(255, 255, 255, 0.4)';
      });

      // Adjust card element height to fit content
      if (cardElement) {
        const computedHeight = Array.from(cardElement.children)
          .filter(child => {
            const style = window.getComputedStyle(child as HTMLElement);
            return style.display !== 'none' && 
                   style.visibility !== 'hidden' && 
                   style.opacity !== '0';
          })
          .reduce((total, child) => {
            const margin = parseInt(window.getComputedStyle(child as HTMLElement).marginBottom || '0');
            const padding = parseInt(window.getComputedStyle(child as HTMLElement).paddingBottom || '0');
            return total + (child as HTMLElement).offsetHeight + margin + padding;
          }, 0);
        
        cardElement.style.height = `${computedHeight}px`;
        cardElement.style.paddingBottom = '2rem'; // Add some padding for the watermark
      }

      // Add watermark
      watermark = addWatermark(cardElement);

      // Set fixed dimensions for the output
      const targetWidth = 800;
      const targetHeight = 1200;

      // Get the actual content size after all transformations
      const contentBox = cardElement.getBoundingClientRect();
      const currentHeight = contentBox.height;
      const currentWidth = contentBox.width;

      // Calculate scale to fit the content properly
      const scaleToFit = Math.min(
        targetWidth / currentWidth,
        targetHeight / currentHeight
      ) * 0.9; // Add 10% padding for better visibility

      // Create a wrapper div for proper scaling and positioning
      const wrapper = document.createElement('div');
      wrapper.style.width = `${targetWidth}px`;
      wrapper.style.height = `${targetHeight}px`;
      wrapper.style.position = 'fixed';
      wrapper.style.left = '-9999px';
      wrapper.style.top = '0';
      wrapper.style.background = 'white';
      wrapper.style.display = 'flex';
      wrapper.style.alignItems = 'center';
      wrapper.style.justifyContent = 'center';
      wrapper.style.overflow = 'visible';
      
      // Clone the card element to avoid modifying the original
      const clonedCard = cardElement.cloneNode(true) as HTMLElement;
      
      // Apply scaling transform
      clonedCard.style.transform = `scale(${scaleToFit})`;
      clonedCard.style.transformOrigin = 'center center';
      clonedCard.style.width = `${currentWidth}px`;
      clonedCard.style.height = `${currentHeight}px`;
      clonedCard.style.position = 'relative';
      clonedCard.style.margin = 'auto';
      clonedCard.style.overflow = 'visible';
      
      // Ensure all child elements maintain their styles and visibility
      const clonedElements = clonedCard.getElementsByTagName('*');
      Array.from(clonedElements).forEach((element) => {
        const originalElement = element as HTMLElement;
        originalElement.style.position = originalElement.style.position || 'relative';
        originalElement.style.overflow = 'visible';
        originalElement.style.opacity = originalElement.style.opacity || '1';
        originalElement.style.visibility = originalElement.style.visibility || 'visible';
      });
      
      wrapper.appendChild(clonedCard);
      document.body.appendChild(wrapper);

      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(wrapper, {
        backgroundColor: 'white',
        scale: 2,
        width: targetWidth,
        height: targetHeight,
        useCORS: true,
        logging: false,
        allowTaint: true,
        foreignObjectRendering: true,
        removeContainer: false,
        onclone: (clonedDoc) => {
          const clonedWrapper = clonedDoc.querySelector(wrapper.tagName) as HTMLElement;
          if (clonedWrapper) {
            clonedWrapper.style.transform = 'none';
            Array.from(clonedWrapper.getElementsByTagName('*')).forEach((el) => {
              (el as HTMLElement).style.transform = 'none';
            });
          }
        }
      });
      
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png');
      });

      if (typeof window !== 'undefined' && 'navigator' in window && 'share' in navigator && platform === 'native') {
        try {
          const file = new File([blob], `letter-to-${letter.member.toLowerCase()}.png`, { type: 'image/png' });
          await navigator.share({
            title: `Letter to ${letter.member}`,
            text: `Read this love letter to ${letter.member} from ARMY! 💜`,
            files: [file]
          });
          return;
        } catch (err) {
          console.log('Native sharing failed, falling back to default share');
        }
      }
      
      handleShare(platform);
    } catch (error) {
      console.error('Error sharing letter:', error);
      alert('Failed to share letter. Please try again.');
    } finally {
      // Restore original styles and remove watermark
      if (headerSection) headerSection.style.display = '';
      if (writeButton) writeButton.style.cssText = originalStyles.get(writeButton);
      if (shareContainer) shareContainer.style.display = '';
      if (shareText) shareText.style.display = '';
      if (listenText) listenText.style.display = '';
      if (loveButton) loveButton.style.cssText = originalStyles.get(loveButton);
      if (loveButtonContainer) loveButtonContainer.style.cssText = originalStyles.get(loveButtonContainer);
      if (cardElement) cardElement.style.cssText = originalStyles.get(cardElement);
      overlayElements.forEach((el) => {
        (el as HTMLElement).style.cssText = originalStyles.get(el);
      });
      quoteElements.forEach((el) => {
        (el as HTMLElement).style.cssText = originalStyles.get(el);
      });
      if (watermark && watermark.parentElement) {
        watermark.parentElement.removeChild(watermark);
      }
    }
  };

  const renderContent = () => {
    if (!letter) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="main-background" />
          <div className="background-pattern" />
          <div className="text-center py-12">Letter not found</div>
        </div>
      );
    }

    return (
      <div className="letter-detail-page">
        <div className="letter-detail-content">
          <div className="relative z-10 p-4 md:p-8">
            <div className="text-center max-w-4xl mx-auto mb-6">
              <button 
                onClick={() => router.push('/')} 
                className="font-reenie font-bold text-6xl mb-4 animate-fade-in text-gray-800 hover:text-[#9333EA] transition-colors duration-300"
                data-write-button
              >
                Love for BTS
              </button>
              <p className="text-gray-600 italic text-base">
                Pour your love into words for BTS that inspire and unite ARMYs worldwide
              </p>
            </div>
            
            <div className="w-full max-w-2xl mx-auto relative z-10">
              <div className={`detail-card detail-${letter.member.toLowerCase() === 'j-hope' ? 'jhope' : letter.member.toLowerCase()}`}>
                <div className="text-center mb-6 relative">
                  <span className="absolute top-2 right-2 text-4xl transform transition-transform duration-300 hover:scale-125 cursor-default">💌</span>
                  <h3 className="text-2xl font-bold text-white/90 mb-2">
                    To: {letter.member}
                  </h3>
                  <div className="w-16 mx-auto h-1 bg-purple-500 border-t-2 border-white" style={{ zIndex: 999 }} />
                </div>

                <div className="text-white mb-6 relative">
                  <svg className="absolute top-0 left-0 w-8 h-8 text-white/20 transform -translate-x-4 -translate-y-4" fill="currentColor" viewBox="0 0 48 48">
                    <path d="M21.66 4.5v11.086c0 8.556-5.597 14.354-13.475 15.914l-1.493-3.227c3.649-1.375 5.993-5.457 5.993-8.773h-6v-15h14.975zm21.66 0v11.086c0 8.556-5.622 14.354-13.5 15.914l-1.494-3.227c3.65-1.375 5.994-5.457 5.994-8.773h-5.975v-15h14.975z"/>
                  </svg>
                  <div className="pl-6 pr-4">
                    <p className="text-lg leading-relaxed whitespace-pre-wrap break-words italic text-white/90 bg-black/20 backdrop-blur-[1px] rounded-2xl p-6">
                      {letter.message}
                    </p>
                  </div>
                  <svg className="absolute bottom-0 right-0 w-8 h-8 text-white/20 transform translate-x-4 translate-y-4" fill="currentColor" viewBox="0 0 48 48">
                    <path d="M21.66 31.5v-11.086c0-8.556 5.597-14.354 13.475-15.914l1.493 3.227c-3.649 1.375-5.993 5.457-5.993 8.773h6v15h-14.975zm-21.66 0v-11.086c0-8.556 5.622-14.354 13.5-15.914l1.494 3.227c-3.65 1.375-5.994 5.457-5.994 8.773h5.975v15h-14.975z"/>
                  </svg>
                </div>

                <div className="flex flex-col pt-4 border-t border-black/20">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-style: italic text-sm text-white/50">
                      {new Date(letter.timestamp.toDate()).toLocaleDateString()}
                    </span>
                    <p className="text-base font-semibold text-white">
                    By: {letter.name}
                      {letter.country && (
                        <span className="text-sm text-white/50 ml-1">
                          from {letter.country}
                        </span>
                      )}
                    </p>
                  </div>
                  
                  <div className="flex justify-center">
                    <button
                      onClick={handleLike}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full 
                        ${isLiked 
                          ? 'bg-[#C688F8] text-white' 
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'} 
                        transition-all duration-300 transform hover:scale-105`}
                    >
                      <svg 
                        className={`w-6 h-6 ${isLiked ? 'text-white' : 'text-[#C688F8]'}`}
                        fill="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                      <span className={`text-lg font-medium ${isLiked ? 'text-white' : 'text-[#C688F8]'}`}>
                        {letter.likes ?? 0}
                      </span>
                    </button>
                  </div>
                </div>

                {letter.spotifyTrack && (
                  <div className="mt-8 pt-4 border-t border-white/20">
                    <p className="text-center text-sm text-white/80 mb-4">Favorite song</p>
                    <div className="flex items-center justify-center gap-4 bg-black/20 backdrop-blur-[1px] rounded-2xl p-3">
                      <img 
                        src={letter.spotifyTrack.albumCover}
                        alt={letter.spotifyTrack.name}
                        className="w-16 h-16 rounded-md"
                      />
                      <div>
                        <p className="font-medium text-white text-lg">{letter.spotifyTrack.name}</p>
                        <p className="text-sm text-white/80">{letter.spotifyTrack.artist}</p>
                      </div>
                    </div>
                    <p className="text-center text-sm text-white/80 mt-6 mb-3">Listen</p>
                    <SpotifyPlayer songId={letter.spotifyTrack.id} />
                  </div>
                )}

                <div className="mt-8 pt-4 border-t border-white/20">
                  <div className="mt-4 text-center flex justify-center">
                    <button
                      onClick={handleDownload}
                      className="bg-[#9333EA] items-center text-white px-6 py-3 rounded-full font-medium 
                        hover:bg-[#7928CA] transition-all duration-300 transform hover:scale-105 
                        shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                    >
                      <HiDownload className="w-5 h-5" />
                      <span>Download</span>
                    </button>
                  </div>

                  <p className="text-center italic text-sm text-black/70 mt-4 mb-8">Share this letter with ARMYs 💜</p>

                  <div className="share-buttons-container flex justify-center gap-2 mt-2 mb-4">
                    <button
                      onClick={() => handleShare('whatsapp')}
                      className="share-button-small bg-[#25D366]/90 hover:bg-[#25D366]"
                      aria-label="Share on WhatsApp"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                  </button>

                  <button
                    onClick={() => handleShare('telegram')}
                    className="share-button-small bg-[#0088cc]/90 hover:bg-[#0088cc]"
                    aria-label="Share on Telegram"
                  >
                    <svg fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                  </button>

                  <button
                    onClick={() => handleShare('facebook')}
                    className="share-button-small bg-[#1877F2]/90 hover:bg-[#1877F2]"
                    aria-label="Share on Facebook"
                  >
                    <svg fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </button>

                  <button
                    onClick={() => handleShare('twitter')}
                    className="share-button-small bg-black/80 hover:bg-black"
                    aria-label="Share on Twitter"
                  >
                    <svg fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </button>

                  
                </div>

                <div className="mt-4 mb-4 px-4">
                  <div className="relative w-full">
                    <input
                      type="text"
                      value={typeof window !== 'undefined' ? window.location.href : ''}
                      readOnly
                      className="w-full px-4 py-3 bg-white/10 rounded-lg text-white/90 text-sm focus:outline-none focus:ring-2 focus:ring-[#9333EA]"
                    />
                    <button
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          navigator.clipboard.writeText(window.location.href);
                          Swal.fire({
                            title: 'Link Copied!',
                            text: 'The letter link has been copied to your clipboard',
                            icon: 'success',
                            timer: 1500,
                            showConfirmButton: false,
                            background: '#1F2937',
                            color: '#fff',
                            iconColor: '#9333EA'
                          });
                        }
                      }}
                      className="absolute right-0 top-1/2 transform -translate-y-1/2 text-white hover:text-white h-full px-3 rounded-r bg-[#9333EA]/80 hover:bg-[#9333EA] transition-all duration-300 flex items-center justify-center"
                      aria-label="Copy Link"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 text-center">
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 text-center text-xs text-gray-600 italic -mt-5">
        <p>This letter is written by a fan and not affiliated with BTS. 
        All content represents personal views and emotions of ARMY.</p>
      </div>

      <div className="mt-8 mb-24 sm:mb-8 text-center">
        <p className="text-black-600 text-bold mb-3">Want to write your own for BTS?</p>
        <button
          onClick={() => router.push('/')}
          className="write-now-button text-white px-8 py-3 rounded-full 
            font-medium transition-all duration-300 transform hover:scale-105 
            shadow-lg hover:shadow-xl flex items-center justify-center mx-auto gap-2"
        >
          Write Now
        </button>
      </div>
    </div>
  );
};

  return renderContent();
}