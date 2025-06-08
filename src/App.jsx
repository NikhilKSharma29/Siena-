import React, { useEffect, useRef, useState, useCallback } from 'react';
import CardCarousel from './components/CardCarousel';
import Cursor from './components/Cursor';
import ElasticScroll from './components/ElasticScroll';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import './App.css';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, ScrollSmoother);


const link = document.createElement('link');
link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;800&family=Inter:wght@300;400;500;600;700&display=swap';
link.rel = 'stylesheet';
document.head.appendChild(link);

const data = [
  {
    title: "The Batman",
    desc: "An epic noir journey through the lens of cinematic chaos.",
    type:"Superhero",
    image: "/Batman.jpeg"
  },
  {
    title: "John Wick",
    desc: "Psychoanalysis reimagined in the shadow of rebellion.",
    type:"thriller",
    image: "/johnwick.jpg"
  },
  {
    title: "Sherlock Holmes",
    desc: "A poetic space odyssey floating between reality and dream.",
    type:"documentary",
    image: "/sherlock.jpg"
  },
  {
    title: "Peaky Blinders",
    desc: "A poetic space odyssey floating between reality and dream.",
    type  :"documentary",
    image: "/peakyblinder.jpg"
  },
  {
    title: "Game of Thrones",
    desc: "A poetic space odyssey floating between reality and dream.",
    type:"Science Fiction",
    image: "/got.jpg"
  },
];

const App = () => {
  const wrapperRef = useRef(null);
  const contentRef = useRef(null);
  const [items, setItems] = useState([...data]);
  const smoother = useRef(null);
  const startIndex = 2; // Start with the 3rd card (0-based index)
  
  // Refs for drag functionality
  const dragRefs = useRef({
    isDragging: false,
    startY: 0,
    scrollStart: 0,
    velocity: 0,
    lastY: 0,
    lastTime: 0,
    animationFrame: null
  });


  // Initialize ScrollSmoother
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Ensure the DOM elements exist
    const wrapper = document.querySelector('#smooth-wrapper');
    const content = document.querySelector('#smooth-content');
    if (!wrapper || !content) return;
    
    // Kill any existing smoother
    if (smoother.current) {
      smoother.current.kill();
    }
    
    const initSmoother = () => {
      try {
        smoother.current = ScrollSmoother.create({
          wrapper: '#smooth-wrapper',
          content: '#smooth-content',
          smooth: 1.2,
          effects: true,
          smoothTouch: 0.1,
          normalizeScroll: true,
          ignoreMobileResize: true,
        });
        
        if (smoother.current) {
          const cardHeight = window.innerHeight * 0.8;
          const startScroll = cardHeight * startIndex;
          smoother.current.scrollTo(startScroll, true, 'top top');
        }
      } catch (error) {
        console.error('ScrollSmoother initialization error:', error);
      }
    };
    
    // Small delay to ensure DOM is ready
    const timer = setTimeout(initSmoother, 100);

    return () => {
      clearTimeout(timer);
      if (smoother.current) {
        smoother.current.kill();
      }
    };
  }, []);

  // Duplicate items for infinite scroll krne k liye
  useEffect(() => {
    setItems([...data, ...data, ...data]);
  }, []);

  // Handle infinite scroll with ScrollSmoother krne k liye
  const handleScroll = useCallback(() => {
    if (!smoother.current) return;
    
    const scrollY = smoother.current.scrollY();
    const scrollTrigger = ScrollTrigger.getById('infinite-scroll');
    
    if (!scrollTrigger) return;
    
    const cardHeight = window.innerHeight * 0.8; 
    const scrollThreshold = cardHeight * 0.5;
    const totalCards = data.length;
    const totalHeight = cardHeight * totalCards;
    const viewportHeight = window.innerHeight;
    
    // Check if we're near the top or bottom
    if (scrollY < scrollThreshold) {
      // Near the top, jump to the middle section
      smoother.current.scrollTo(scrollY + totalHeight, true);
    } else if (scrollY > (totalHeight * 3 - viewportHeight - scrollThreshold)) {
      // Near the bottom, jump to the middle section
      smoother.current.scrollTo(scrollY - totalHeight, true);
    }
  }, [data.length]);
  
  // Initialize scroll position and set up infinite scroll
  useEffect(() => {
    if (!smoother.current) return;
    
    // Set initial scroll position to the middle section
    const cardHeight = window.innerHeight * 0.8;
    const startScroll = cardHeight * (data.length + 1); // Start in the middle section
    
    // Small delay to ensure ScrollSmoother is fully initialized
    const initTimer = setTimeout(() => {
      smoother.current.scrollTo(startScroll, true);
      
      // scroll listener for infinite effect
      const scrollTrigger = ScrollTrigger.create({
        id: 'infinite-scroll',
        start: 0,
        end: 'max',
        onUpdate: handleScroll,
        
      });
      
      return () => {
        if (scrollTrigger) scrollTrigger.kill();
      };
    }, 100);
    
    return () => {
      clearTimeout(initTimer);
      const trigger = ScrollTrigger.getById('infinite-scroll');
      if (trigger) trigger.kill();
    };
  }, [handleScroll, data.length]);

  // Handle mouse drag scroll
  const handleMouseDown = (e) => {
    const drag = dragRefs.current;
    drag.isDragging = true;
    drag.startY = e.clientY;
    drag.scrollStart = smoother.current ? smoother.current.scrollY() : 0;
    drag.velocity = 0;
    drag.lastY = e.clientY;
    drag.lastTime = performance.now();
    
    // Add dragging class for visual feedback
    const wrapper = document.getElementById('smooth-wrapper');
    if (wrapper) {
      wrapper.classList.add('dragging');
    }
    
    // Disable text selection during drag
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e) => {
    const drag = dragRefs.current;
    if (!drag.isDragging || !smoother.current) return;
    
    const y = e.clientY;
    // Invert the deltaY to make dragging feel more natural
    const deltaY = y - drag.startY;
    const newScroll = drag.scrollStart - deltaY;
    
    // Update velocity for momentum scrolling
    const time = performance.now();
    const deltaTime = time - drag.lastTime;
    if (deltaTime > 0) {
      // Invert velocity to match the new direction
      drag.velocity = -(y - drag.lastY) / (deltaTime * 0.1);
    }
    drag.lastY = y;
    drag.lastTime = time;
    
    // Prevent default to avoid text selection during drag
    e.preventDefault();
    
    // Apply scroll with ScrollSmoother
    smoother.current.scrollTo(newScroll, true);
  };

  const handleMouseUp = () => {
    const drag = dragRefs.current;
    if (!drag.isDragging) return;
    
    drag.isDragging = false;
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    
    // Remove dragging class
    const wrapper = document.getElementById('smooth-wrapper');
    if (wrapper) {
      wrapper.classList.remove('dragging');
    }
    
    // Apply momentum scrolling
    if (smoother.current && Math.abs(drag.velocity) > 1) {
      const momentum = drag.velocity * 30;
      const start = smoother.current.scrollY();
      const target = start + momentum;
      
      gsap.to(smoother.current, {
        scrollTo: target,
        duration: 1.5,
        ease: 'power2.out',
        onUpdate: () => {
          // Update velocity for smooth deceleration
          drag.velocity *= 0.95;
        },
        onComplete: () => {
          drag.velocity = 0;
        }
      });
    }
  };

  // Add event listeners for drag scrolling
  useEffect(() => {
    const wrapper = document.querySelector('#smooth-content');
    if (!wrapper) return;

    const mouseDownHandler = (e) => handleMouseDown(e);
    const mouseMoveHandler = (e) => handleMouseMove(e);
    const mouseUpHandler = () => handleMouseUp();

    wrapper.addEventListener('mousedown', mouseDownHandler);
    window.addEventListener('mousemove', mouseMoveHandler);
    window.addEventListener('mouseup', mouseUpHandler);
    window.addEventListener('mouseleave', mouseUpHandler);

    return () => {
      wrapper.removeEventListener('mousedown', mouseDownHandler);
      window.removeEventListener('mousemove', mouseMoveHandler);
      window.removeEventListener('mouseup', mouseUpHandler);
      window.removeEventListener('mouseleave', mouseUpHandler);
      
      const drag = dragRefs.current;
      if (drag.animationFrame) {
        cancelAnimationFrame(drag.animationFrame);
      }
    };
  }, []);

  // Clean up any existing ScrollTrigger instances on unmount
  useEffect(() => {
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      if (smoother.current) {
        smoother.current.kill();
      }
    };
  }, []);

  return (
    <div className="App">
      <Cursor />
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <ElasticScroll 
            className="main-wrapper"
            wrapperRef={contentRef}
            strength={0.4}
            maxGap={80}
            minGap={40}
          >
            {items.map((item, index) => (
              <CardCarousel key={`${item.title}-${index}`} item={item} index={index} />
            ))}
          </ElasticScroll>
        </div>
      </div>
    </div>
  );
};

export default App;
