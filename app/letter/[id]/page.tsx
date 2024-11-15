'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '../../firebase/config';
import { doc, getDoc, updateDoc, increment, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Letter } from '../../types/Letter';
import SpotifyPlayer from '../../components/SpotifyPlayer';
import html2canvas from 'html2canvas';

export default function LetterPage() {
  const params = useParams();
  const router = useRouter();
  const [letter, setLetter] = useState<Letter | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    async function fetchLetter() {
      try {
        const letterId = params.id as string;
        const letterDoc = await getDoc(doc(db, 'letters', letterId));
        
        if (letterDoc.exists()) {
          setLetter({
            id: letterDoc.id,
            ...letterDoc.data()
          } as Letter);
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error('Error fetching letter:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    }

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
    const text = `Read this heartfelt letter to ${letter.member} from a fellow ARMY! 💜`;
    
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
          alert('Link copied! Share it with your fellow ARMYs! 💜');
          return;
        } catch (err) {
          console.error('Failed to copy:', err);
          alert('Failed to copy link');
        }
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
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
    const shareContainer = cardElement.querySelector('.share-buttons-container')?.parentElement;
    const shareText = cardElement.querySelector('p.text-center.italic.text-sm.text-black\\/70');
    const listenText = cardElement.querySelector('p.text-center.text-sm.text-white\\/80.mt-6.mb-3');
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

      // Capture the image
      const canvas = await html2canvas(cardElement, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        height: cardElement.offsetHeight // Set explicit height
      });
      
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `letter-to-${letter.member.toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error downloading letter:', error);
      alert('Failed to download letter. Please try again.');
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

  const handleShareImage = async (platform: string) => {
    if (!letter) return;
    
    const cardElement = document.querySelector('.detail-card') as HTMLElement;
    if (!cardElement) return;

    // Store elements to be modified
    const headerSection = document.querySelector('.text-center.max-w-4xl') as HTMLElement;
    const writeButton = cardElement.querySelector('.mt-4.text-center > button') as HTMLElement;
    const shareContainer = cardElement.querySelector('.share-buttons-container')?.parentElement;
    const shareText = cardElement.querySelector('p.text-center.italic.text-sm.text-black\\/70');
    const listenText = cardElement.querySelector('p.text-center.text-sm.text-white\\/80.mt-6.mb-3');
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

      const canvas = await html2canvas(cardElement, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        height: cardElement.offsetHeight // Set explicit height
      });
      
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png');
      });

      if (navigator.share && platform === 'native') {
        try {
          const file = new File([blob], `letter-to-${letter.member.toLowerCase()}.png`, { type: 'image/png' });
          await navigator.share({
            title: `Letter to ${letter.member}`,
            text: `Read this heartfelt letter to ${letter.member} from a fellow ARMY! 💜`,
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#4C0083] border-t-transparent"></div>
      </div>
    );
  }

  if (!letter) {
    return null;
  }

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col bg-white relative">
      <div className="gradient-bg" />
      <div className="bg-pattern" />
      <div className="floating-stickers" />
      
      <div className="text-center max-w-4xl mx-auto mb-6">
        <button 
          onClick={() => router.push('/')} 
          className="font-reenie font-bold text-6xl mb-4 animate-fade-in text-gray-800 hover:text-[#9333EA] transition-colors duration-300"
          data-write-button
        >
          Love for BTS
        </button>
        <p className="text-gray-600 italic text-base">
          Pour your love for BTS into words that inspire and unite ARMYs worldwide
        </p>
      </div>
      
      <div className="w-full max-w-2xl mx-auto relative z-10">
        <div className={`detail-card detail-${letter.member.toLowerCase() === 'j-hope' ? 'jhope' : letter.member.toLowerCase()}`}>
          <div className="text-center mb-6 relative">
            <span className="absolute top-2 right-2 text-4xl transform transition-transform duration-300 hover:scale-125 cursor-default">💌</span>
            <h3 className="text-2xl font-bold text-white/90">
              To: {letter.member}
            </h3>
            <div className="w-16 h-1 bg-white/30 mx-auto mt-3 rounded-full" />
          </div>

          <div className="text-white mb-6 relative">
            <svg className="absolute top-0 left-0 w-8 h-8 text-white/20 transform -translate-x-4 -translate-y-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
            </svg>
            <div className="pl-6 pr-4">
              <p className="text-lg leading-relaxed whitespace-pre-wrap break-words italic">
                {letter.message}
              </p>
            </div>
            <svg className="absolute bottom-0 right-0 w-8 h-8 text-white/20 transform translate-x-4 translate-y-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9.983 3v7.391c0 5.704-3.731 9.57-8.983 10.609l-.995-2.151c2.432-.917 3.995-3.638 3.995-5.849h-4v-10h9.983zm14.017 0v7.391c0 5.704-3.748 9.57-9 10.609l-.996-2.151c2.433-.917 3.996-3.638 3.996-5.849h-3.983v-10h9.983z"/>
            </svg>
          </div>

          <div className="flex flex-col pt-4 border-t border-black/20">
            <div className="flex justify-between items-center mb-4">
              <span className="font-style: italic text-sm text-black/50">
                {new Date(letter.timestamp.toDate()).toLocaleDateString()}
              </span>
              <p className="text-base font-semibold text-white">
                By: {letter.name}
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
              <div className="flex items-center justify-center gap-4">
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

          <div className="mt-8 pt-4 border-t border-black/20">
            <p className="text-center italic text-sm text-black/70 mb-4">
              Share this letter with ARMYs 💜
            </p>
            <div className="flex flex-col gap-4">
              <div className="flex justify-center gap-3">
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-[#4C0083] text-white rounded-full hover:bg-[#6F00BC] transition-colors duration-300 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </button>
                {navigator.share && (
                  <button
                    onClick={() => handleShareImage('native')}
                    className="px-4 py-2 bg-[#4C0083] text-white rounded-full hover:bg-[#6F00BC] transition-colors duration-300 flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                    </svg>
                    Share Image
                  </button>
                )}
              </div>
              <div className="share-buttons-container">
                <button
                  onClick={() => handleShare('whatsapp')}
                  className="share-button-small bg-[#25D366]/90 hover:bg-[#25D366]"
                  aria-label="Share on WhatsApp"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
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

                <button
                  onClick={() => handleShare('copy')}
                  className="share-button-small bg-[#9333EA]/80 hover:bg-[#9333EA]"
                  aria-label="Copy Link"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={() => router.push('/')}
              className="bg-[#C688F8] hover:bg-[#B674E7] text-white px-8 py-3 rounded-full 
                font-medium transition-all duration-300 transform hover:scale-105 
                shadow-lg hover:shadow-xl flex items-center justify-center mx-auto gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Write Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}