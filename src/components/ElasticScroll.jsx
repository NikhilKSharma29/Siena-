import React, { useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';

export const useElasticScroll = (wrapperRef, { strength = 0.3, maxGap = 60, minGap = 30 } = {}) => {
  const cardsRef = useRef([]);
  const lastScrollY = useRef(0);
  const velocity = useRef(0);
  const animationFrame = useRef(null);
  const lastTime = useRef(0);

  // Update card gaps based on scroll velocity
  const updateGaps = useCallback(() => {
    if (!wrapperRef.current) return;
    
    const now = performance.now();
    const deltaTime = now - lastTime.current;
    lastTime.current = now;
    
    // Smooth out velocity for more natural feel
    velocity.current = gsap.utils.interpolate(
      velocity.current,
      0,
      deltaTime * 0.001 * 2 // Damping factor
    );
    
    // Apply elastic effect to each card
    cardsRef.current.forEach((card, index) => {
      if (!card) return;
      
      // Only apply to cards that are in viewport
      const rect = card.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      if (rect.bottom < 0 || rect.top > viewportHeight) return;
      
      // Calculate gap based on velocity and card position
      const distanceFromCenter = Math.abs(rect.top + rect.height / 2 - viewportHeight / 2) / viewportHeight;
      const gap = minGap + Math.min(Math.abs(velocity.current) * strength * (1 - distanceFromCenter), maxGap - minGap);
      
      // Apply gap to bottom of card (except last one)
      if (index < cardsRef.current.length - 1) {
        gsap.to(card, {
          marginBottom: `${gap}px`,
          duration: 0.5,
          ease: 'elastic.out(1, 0.5)'
        });
      }
    });
    
    animationFrame.current = requestAnimationFrame(updateGaps);
  }, [maxGap, minGap, strength, wrapperRef]);

  // Handle scroll events to calculate velocity
  const handleScroll = useCallback(() => {
    if (!wrapperRef.current) return;
    
    const currentScrollY = window.scrollY || window.pageYOffset;
    const deltaY = currentScrollY - lastScrollY.current;
    const currentTime = performance.now();
    
    // Calculate velocity (pixels per frame)
    if (currentTime - lastTime.current > 0) {
      velocity.current = deltaY / ((currentTime - lastTime.current) * 0.1);
    }
    
    lastScrollY.current = currentScrollY;
    lastTime.current = currentTime;
  }, []);

  // Set up event listeners and animation loop
  useEffect(() => {
    if (!wrapperRef.current) return;
    
    // Initialize cards
    cardsRef.current = Array.from(wrapperRef.current.querySelectorAll('.card'));
    
    // Start animation loop
    lastTime.current = performance.now();
    animationFrame.current = requestAnimationFrame(updateGaps);
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Clean up
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
      window.removeEventListener('scroll', handleScroll);
      
      // Reset gaps on unmount
      cardsRef.current.forEach(card => {
        if (card) {
          gsap.set(card, { marginBottom: '' });
        }
      });
    };
  }, [handleScroll, updateGaps, wrapperRef]);

  // Function to update card references when items change
  const updateCardRefs = useCallback(() => {
    if (wrapperRef.current) {
      cardsRef.current = Array.from(wrapperRef.current.querySelectorAll('.card'));
    }
  }, [wrapperRef]);

  return { updateCardRefs };
};

const ElasticScroll = ({ children, wrapperRef, className = '', ...props }) => {
  const contentRef = useRef(null);
  const { updateCardRefs } = useElasticScroll(wrapperRef || contentRef, props);
  
  // Update card refs when children change
  useEffect(() => {
    updateCardRefs();
  }, [children, updateCardRefs]);

  return (
    <div ref={wrapperRef || contentRef} className={`elastic-scroll ${className}`}>
      {children}
    </div>
  );
};

export default ElasticScroll;
