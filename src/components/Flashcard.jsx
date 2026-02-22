import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CardFace } from './CardFace';
import { playAudio, triggerHaptic } from '../utils';

export const Flashcard = ({ data, prevData, nextData, isFlipped, onFlip, onSwipe, onDrag, hideRomaji, autoPlay, reverse }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  
  const dragXRef = useRef(0);
  const startXRef = useRef(0);
  const isDraggingRef = useRef(false);

  // --- AUTO-PLAY LOGIC ---
  useEffect(() => {
    if (isFlipped && autoPlay && data) {
        // Small delay to ensure smooth flip animation first
        const timer = setTimeout(() => {
            playAudio(data.kana || data.kanji);
        }, 300);
        return () => clearTimeout(timer);
    }
  }, [isFlipped, autoPlay, data]);

  const handleStart = (clientX) => {
    if (isAnimatingOut) return;
    setIsDragging(true);
    isDraggingRef.current = true;
    startXRef.current = clientX;
  };

  const handleMove = useCallback((clientX) => {
    if (!isDraggingRef.current) return;
    let delta = clientX - startXRef.current;
    
    // Boundary constraints
    if (!prevData && delta > 0) delta = 0;
    if (!nextData && delta < 0) delta = 0;

    dragXRef.current = delta;
    setDragX(delta);
    if (onDrag) onDrag(delta); 
  }, [onDrag, prevData, nextData]);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
    isDraggingRef.current = false;
    const currentDrag = dragXRef.current;
    const threshold = 100;
    const exitDistance = 1000;

    if (Math.abs(currentDrag) > threshold) {
      setIsAnimatingOut(true);
      const targetDrag = currentDrag > 0 ? exitDistance : -exitDistance;
      setDragX(targetDrag);
      if (onDrag) onDrag(targetDrag); 
      setTimeout(() => { 
          triggerHaptic(20);
          onSwipe(currentDrag > 0 ? 'right' : 'left'); 
      }, 200);
    } else {
      setDragX(0);
      dragXRef.current = 0;
      if (onDrag) onDrag(0); 
    }
  }, [onSwipe, onDrag]);

  useEffect(() => {
    if (!isDragging) return;
    const onMouseMove = (e) => handleMove(e.clientX);
    const onMouseUp = () => handleEnd();
    const onTouchMove = (e) => handleMove(e.touches[0].clientX);
    const onTouchEnd = () => handleEnd();
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  const onMouseDown = (e) => handleStart(e.clientX);
  const onTouchStart = (e) => handleStart(e.touches[0].clientX);

  const rotate = dragX * 0.05;
  const transition = isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)';
  const progress = Math.min(Math.abs(dragX) / 150, 1);
  const bgOpacity = progress;
  const rightTintOpacity = dragX > 0 ? Math.min(dragX / 300, 0.4) : 0;
  const leftTintOpacity = dragX < 0 ? Math.min(Math.abs(dragX) / 300, 0.4) : 0;

  return (
    <div className="relative w-full max-w-sm h-80 perspective-1000 mx-auto select-none touch-none">
      <div className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none z-0">
         <div className="absolute inset-0 shadow-xl rounded-3xl" style={{ opacity: dragX < 0 ? bgOpacity : 0, transition: isDragging ? 'none' : 'all 0.2s ease-out' }}><CardFace data={nextData} side="front" reverse={reverse} /></div>
         <div className="absolute inset-0 shadow-xl rounded-3xl" style={{ opacity: dragX > 0 ? bgOpacity : 0, transition: isDragging ? 'none' : 'all 0.2s ease-out' }}><CardFace data={prevData} side="front" reverse={reverse} /></div>
      </div>
      <div className="relative w-full h-full shadow-xl rounded-3xl will-change-transform" style={{ transform: `translateX(${dragX}px) rotate(${rotate}deg)`, transition, cursor: isDragging ? 'grabbing' : 'grab', zIndex: 10 }} onMouseDown={onMouseDown} onTouchStart={onTouchStart} onClick={() => { if(Math.abs(dragX) < 5) { triggerHaptic(10); onFlip(); } }}>
        <div className={`relative w-full h-full transform-style-3d transition-transform duration-300 ${isFlipped ? 'rotate-y-180' : ''}`}>
          <div className="absolute w-full h-full backface-hidden" style={{ zIndex: isFlipped ? 0 : 2 }}>
             <CardFace data={data} side="front" reverse={reverse} />
             {dragX > 0 && <div className="absolute top-4 left-4 border-4 border-green-500 text-green-500 rounded-xl px-2 py-1 text-xl font-black uppercase opacity-50 transform -rotate-12">Prev</div>}
             {dragX < 0 && <div className="absolute top-4 right-4 border-4 border-red-500 text-red-500 rounded-xl px-2 py-1 text-xl font-black uppercase opacity-50 transform rotate-12">Next</div>}
             <div className="absolute inset-0 bg-green-500 pointer-events-none" style={{ opacity: rightTintOpacity, mixBlendMode: 'overlay' }}></div>
             <div className="absolute inset-0 bg-red-500 pointer-events-none" style={{ opacity: leftTintOpacity, mixBlendMode: 'overlay' }}></div>
          </div>
          <div className="absolute w-full h-full backface-hidden rotate-y-180" style={{ zIndex: isFlipped ? 2 : 0 }}><CardFace data={data} side="back" hideRomaji={hideRomaji} reverse={reverse} /></div>
        </div>
      </div>
    </div>
  );
};
