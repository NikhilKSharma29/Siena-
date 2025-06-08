import React, { useRef, useEffect, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import "../App.css";

gsap.registerPlugin(ScrollTrigger);

const CardCarousel = ({ item, index }) => {
  const cardRef = useRef();
  const imgRef = useRef();
  const titleRef = useRef();
  const descRef = useRef();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      {
        threshold: 0.5
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);

  // Handle krega animations and effects with ScrollSmoother
  useEffect(() => {
    const el = cardRef.current;
    const img = imgRef.current;
    const title = titleRef.current;
    const desc = descRef.current;
    
    if (!el || !img) return;

   
    gsap.set(el, {
      '--x': 0,
      '--y': 0,
      '--rotateX': 0,
      '--rotateY': 0,
      '--scale': 1,
      '--imgY': 0,
      opacity: 0,
      y: 50
    });

    // Fade in animation with ScrollTrigger hoga 
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power2.out',
      delay: (index % 3) * 0.1,
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none none',
        once: true
      }
    });

    // Parallax scroll effect with ScrollSmoother krne k liye
    const parallaxTl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: 'top bottom-=100',
        end: 'bottom top+=100',
        scrub: 1,
        
        onUpdate: (self) => {
          
          const progress = self.progress;
          
          
          const bounds = el.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          const cardMiddle = bounds.top + bounds.height / 2;
          const distanceFromCenter = (cardMiddle - viewportHeight / 2) / viewportHeight;
          
          // Apply parallax effect 
          const parallaxAmount = 0.15; 
          const yPos = distanceFromCenter * (bounds.height * parallaxAmount);
          
          // Smoothly move the image
          gsap.to(img, {
            y: -yPos * 0.5, 
            duration: 0.8,
            ease: 'power1.out',
            overwrite: 'auto'
          });
        }
      }
    });

    // Hover effect
    const handleMouseMove = (e) => {
      if (!el) return;
      
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      
      gsap.to(el, {
        '--x': x * 20,
        '--y': y * 20,
        '--rotateX': y * 5,
        '--rotateY': -x * 5,
        '--scale': 1.02,
        duration: 1,
        ease: 'power2.out'
      });
    };

    const handleMouseLeave = () => {
      gsap.to(el, {
        '--x': 0,
        '--y': 0,
        '--rotateX': 0,
        '--rotateY': 0,
        '--scale': 1,
        duration: 1,
        ease: 'elastic.out(1, 0.5)'
      });
    };

    // Add event listeners
    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);

    // Cleanup
    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
      
      // Kill the parallax timeline
      if (parallaxTl && parallaxTl.scrollTrigger) {
        parallaxTl.scrollTrigger.kill();
      }
      
      // Kill any other ScrollTrigger instances for this component
      ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.trigger === el) {
          trigger.kill();
        }
      });
    };
  }, [item, index]);

  return (
    <div 
      ref={cardRef} 
      className="card"
      style={{
        '--x': 0,
        '--y': 0,
        '--rotateX': 0,
        '--rotateY': 0,
        '--scale': 1,
        transform: 'translate3d(0, 0, 0) scale(var(--scale)) rotateX(calc(var(--rotateX) * 1deg)) rotateY(calc(var(--rotateY) * 1deg))',
        willChange: 'transform, opacity',
        transformStyle: 'preserve-3d',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        WebkitTransformStyle: 'preserve-3d',
        WebkitBackfaceVisibility: 'hidden'
      }}
    >
      <div className="type-indicator">{item.type}</div>
      <h2 ref={titleRef} className="title">
        {item.title.split(' ').map((word, i) => (
          <motion.span 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: i * 0.05 }}
          >
            {word}{' '}
          </motion.span>
        ))}
      </h2>
      <motion.p 
        ref={descRef} 
        className="description"
        initial={{ opacity: 0, y: 20 }}
        animate={isVisible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {item.desc}
      </motion.p>
      <img 
        ref={imgRef} 
        src={item.image} 
        alt={item.title} 
        loading={index < 3 ? 'eager' : 'lazy'}
        style={{
          transform: 'translate3d(0, 0, 0)',
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden'
        }}
      />
    </div>
  );
};

export default React.memo(CardCarousel);
