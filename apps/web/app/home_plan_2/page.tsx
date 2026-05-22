"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CubePetsScene from "../components/CubePetsScene";
import "../styles/landing.css";

// Decorative SVGs for GSAP-like Features Section
const SvgGradientU = ({ className = "", style }: { className?: string, style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="gradU" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4facfe" />
        <stop offset="100%" stopColor="#f093fb" />
      </linearGradient>
    </defs>
    <path d="M0 200 V100 C0 44.77 44.77 0 100 0 C155.23 0 200 44.77 200 100 V200 H130 V100 C130 83.43 116.57 70 100 70 C83.43 70 70 83.43 70 100 V200 Z" fill="url(#gradU)"/>
  </svg>
);

const SvgGradientSquare = ({ className = "", style }: { className?: string, style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="gradSquare" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ff4e50" />
        <stop offset="100%" stopColor="#f9d423" />
      </linearGradient>
    </defs>
    <path d="M20 0 H180 C191.04 0 200 8.95 200 20 V180 C200 191.04 191.04 200 180 200 H100 C44.77 200 0 155.23 0 100 V20 C0 8.95 8.95 0 20 0 Z" fill="url(#gradSquare)"/>
  </svg>
);

const SvgGradientStar = ({ className = "", style }: { className?: string, style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="gradStar" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ff0844" />
        <stop offset="100%" stopColor="#ffb199" />
      </linearGradient>
    </defs>
    <path d="M100 0 C100 55.23 55.23 100 0 100 C55.23 100 100 144.77 100 200 C100 144.77 144.77 100 200 100 C144.77 100 100 55.23 100 0 Z" fill="url(#gradStar)"/>
  </svg>
);

const SvgFlower = ({ className = "", style }: { className?: string, style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 0C50 27.6142 27.6142 50 0 50C27.6142 50 50 72.3858 50 100C50 72.3858 72.3858 50 100 50C72.3858 50 50 27.6142 50 0Z" fill="url(#paint0_linear)"/>
    <defs>
      <linearGradient id="paint0_linear" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop stopColor="#fec5fb" />
        <stop offset="1" stopColor="#f100cb" />
      </linearGradient>
    </defs>
  </svg>
);

const SvgRing = ({ className = "", style }: { className?: string, style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="35" stroke="url(#paint1_linear)" strokeWidth="30" />
    <defs>
      <linearGradient id="paint1_linear" x1="15" y1="15" x2="85" y2="85" gradientUnits="userSpaceOnUse">
        <stop stopColor="#00bae2" />
        <stop offset="1" stopColor="#9d95ff" />
      </linearGradient>
    </defs>
  </svg>
);

const SvgDiamond = ({ className = "", style }: { className?: string, style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M25 0L50 25L25 50L0 25L25 0Z" fill="#ff8709"/>
  </svg>
);

// New Abstract Geometric Shapes (shapes.gallery style)
const SvgSparkle = ({ className = "", style }: { className?: string, style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 0 C 50 40 60 50 100 50 C 60 50 50 60 50 100 C 50 60 40 50 0 50 C 40 50 50 40 50 0 Z" fill="url(#spark_grad)"/>
    <defs>
      <linearGradient id="spark_grad" x1="0" y1="0" x2="100" y2="100">
        <stop stopColor="#ff4d00" />
        <stop offset="1" stopColor="#ff9d00" />
      </linearGradient>
    </defs>
  </svg>
);

const SvgSquiggle = ({ className = "", style }: { className?: string, style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 30 Q 80 30 80 50 T 20 70" stroke="url(#squig_grad)" strokeWidth="25" strokeLinecap="round" fill="none" />
    <defs>
      <linearGradient id="squig_grad" x1="0" y1="0" x2="100" y2="100">
        <stop stopColor="#00E676" />
        <stop offset="1" stopColor="#1DE9B6" />
      </linearGradient>
    </defs>
  </svg>
);

const SvgGeoX = ({ className = "", style }: { className?: string, style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 20 L 40 20 L 50 40 L 60 20 L 80 20 L 60 50 L 80 80 L 60 80 L 50 60 L 40 80 L 20 80 L 40 50 Z" fill="url(#geox_grad)"/>
    <defs>
      <linearGradient id="geox_grad" x1="0" y1="0" x2="100" y2="100">
        <stop stopColor="#651FFF" />
        <stop offset="1" stopColor="#D500F9" />
      </linearGradient>
    </defs>
  </svg>
);

export default function HomePlan2() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTrackRef = useRef<HTMLDivElement>(null);

  // Helper component to split text into animated characters
  const SplitChars = ({ text, className = "" }: { text: string, className?: string }) => (
    <span style={{ display: 'inline-block', whiteSpace: 'nowrap' }} className={className}>
      {text.split('').map((char, i) => (
        <span key={i} className="hero-char" style={{ display: 'inline-block', whiteSpace: 'pre' }}>
          {char}
        </span>
      ))}
    </span>
  );

  // Helper component to split text into animated words
  const SplitWords = ({ text, className = "" }: { text: string, className?: string }) => (
    <span className={className}>
      {text.split(' ').map((word, i) => (
        <span key={i} className="scrub-word" style={{ display: 'inline-block', marginRight: '0.25em' }}>
          {word}
        </span>
      ))}
    </span>
  );

  // Helper component to split text into animated words with GSAP Outline-to-Fill effect
  const SplitWordsGSAP = ({ text, className = "", fillColor = "rgba(255,255,255,1)" }: { text: string, className?: string, fillColor?: string }) => (
    <span className={className}>
      {text.split(' ').map((word, i, arr) => (
        <span key={i} style={{ display: 'inline-block', whiteSpace: 'pre' }}>
          <span className="scrub-word-stroke" data-fill={fillColor} style={{ 
            WebkitTextStroke: '2px rgba(255,255,255,0.2)', 
            color: 'transparent',
            display: 'inline-block'
          }}>
            {word}
          </span>
          {i < arr.length - 1 ? ' ' : ''}
        </span>
      ))}
    </span>
  );

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // 1. Cool GSAP Character Animation for Hero
      gsap.from(".hero-char", {
        y: 80,
        rotationZ: 10,
        rotationX: -90,
        opacity: 0,
        duration: 1.2,
        stagger: 0.04,
        ease: "back.out(2)",
      });
      
      gsap.from(".hero-fade", {
        y: 40,
        opacity: 0,
        duration: 1.2,
        delay: 0.8,
        ease: "power3.out",
      });

      // Stable, subtle floating animation for Hero Shapes
      gsap.to(".hero-shape", {
        y: "-=15",
        rotation: "+=10",
        duration: 4,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        stagger: 0.2
      });

      // Intro Section Scrub Animation (Word by Word)
      // First, handle the normal opacity scrub for regular intro text
      gsap.fromTo(".scrub-word", 
        { opacity: 0.2 },
        {
          opacity: 1,
          stagger: 0.05,
          ease: "none",
          scrollTrigger: {
            trigger: ".ll-intro-text",
            start: "top 85%",
            end: "center center",
            scrub: true,
          }
        }
      );

      // Next, handle the massive GSAP-style Stroke-to-Fill effect for the main heading
      gsap.to(".scrub-word-stroke", {
        color: (i, el) => el.dataset.fill,
        WebkitTextStrokeColor: "transparent",
        stagger: 0.1,
        ease: "none",
        scrollTrigger: {
          trigger: ".ll-intro",
          start: "top 80%",
          end: "center center",
          scrub: true,
        }
      });

      // Horizontal Scroll Section
      let scrollTween: gsap.core.Tween | undefined;
      if (scrollTrackRef.current) {
        scrollTween = gsap.to(scrollTrackRef.current, {
          x: () => -(scrollTrackRef.current!.scrollWidth - window.innerWidth + window.innerWidth * 0.1), // Add extra offset to prevent cut-off
          ease: "none",
          scrollTrigger: {
            trigger: ".ll-scroll-section",
            pin: true,
            scrub: 1, // Smooth scrubbing
            start: "center center",
            end: () => `+=${scrollTrackRef.current!.scrollWidth - window.innerWidth + window.innerWidth * 0.1}`,
            invalidateOnRefresh: true, // Recalculate on resize/font load
          },
        });

        // 1. SVG Decorators rotating as we scrub
        gsap.utils.toArray(".ll-scroll-deco-item").forEach((svg: any) => {
          gsap.to(svg, {
            rotation: "+=360",
            scale: 1.2,
            ease: "none",
            scrollTrigger: {
              trigger: svg,
              containerAnimation: scrollTween,
              start: "left right",
              end: "right left",
              scrub: true,
            }
          });
        });

        // 2. Parallax floating for absolute pills (foreign quotes)
        gsap.utils.toArray(".ll-scroll-pill.absolute").forEach((pill: any, i) => {
          gsap.to(pill, {
            x: i % 2 === 0 ? 150 : -150, // Parallax drift
            y: i % 2 === 0 ? -30 : 30,
            rotation: i % 2 === 0 ? "+=5" : "-=5",
            ease: "none",
            scrollTrigger: {
              trigger: pill,
              containerAnimation: scrollTween,
              start: "left right",
              end: "right left",
              scrub: true,
            }
          });
        });

        // 3. Main text spans color tint when they enter
        gsap.utils.toArray(".ll-scroll-text span:not(.ll-scroll-pill)").forEach((text: any) => {
          gsap.from(text, {
            opacity: 0.2,
            scale: 0.9,
            duration: 1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: text,
              containerAnimation: scrollTween,
              start: "left 90%", // When left of text hits 90% of viewport
              end: "left 50%",   // Finish animation when it reaches center
              scrub: true,
            }
          });
        });

        // 4. Inline pills bounce/wobble effect
        gsap.utils.toArray(".ll-scroll-text .ll-scroll-pill:not(.absolute)").forEach((pill: any) => {
          gsap.from(pill, {
            y: 50,
            rotation: "-=15",
            scale: 0.5,
            ease: "back.out(1.7)",
            scrollTrigger: {
              trigger: pill,
              containerAnimation: scrollTween,
              start: "left 85%",
              end: "left 40%",
              scrub: true,
            }
          });
        });
      }

      // GSAP Advanced Button Hover (Magnetic + Directional Fill)
      const hoverBtns = document.querySelectorAll(".ll-btn--gsap-hover");
      hoverBtns.forEach((btn: any) => {
        const fill = btn.querySelector(".btn-fill");
        const text = btn.querySelector(".btn-text");
        const shimmer = btn.querySelector(".btn-shimmer");

        // Set initial transform correctly for GSAP
        if (fill) gsap.set(fill, { xPercent: -50, yPercent: -50, scale: 0 });
        
        // Continuous Shimmer Effect (Works on Mobile without hover)
        if (shimmer) {
          gsap.to(shimmer, {
            left: "200%",
            duration: 1.5,
            ease: "power2.inOut",
            repeat: -1,
            repeatDelay: 3
          });
        }

        btn.addEventListener("mouseenter", (e: any) => {
          const rect = btn.getBoundingClientRect();
          const relX = e.clientX - rect.left;
          const relY = e.clientY - rect.top;
          
          if (fill) {
            gsap.set(fill, { x: relX, y: relY, scale: 0 });
            gsap.to(fill, { scale: 2.5, duration: 0.4, ease: "power2.out" });
          }
          if (text) gsap.to(text, { color: "var(--ll-bg)", duration: 0.3 });
        });

        btn.addEventListener("mousemove", (e: any) => {
          const rect = btn.getBoundingClientRect();
          const x = e.clientX - rect.left - rect.width / 2;
          const y = e.clientY - rect.top - rect.height / 2;
          gsap.to(btn, { x: x * 0.2, y: y * 0.2, duration: 0.3, ease: "power2.out" });
          if (text) gsap.to(text, { x: x * 0.1, y: y * 0.1, duration: 0.3, ease: "power2.out" });
        });

        btn.addEventListener("mouseleave", (e: any) => {
          const rect = btn.getBoundingClientRect();
          const relX = e.clientX - rect.left;
          const relY = e.clientY - rect.top;
          
          if (fill) gsap.to(fill, { x: relX, y: relY, scale: 0, duration: 0.4, ease: "power2.out" });
          if (text) gsap.to(text, { color: "var(--ll-text)", x: 0, y: 0, duration: 0.4, ease: "power2.out" });
          gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
        });
      });

      // Feature Rows Reveal
      gsap.utils.toArray(".ll-feat-row").forEach((row: any, i) => {
        gsap.from(row, {
          y: 50,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: row,
            start: "top 85%",
          },
        });
        
        // Gentle float for the big SVGs
        const icon = row.querySelector(".ll-feat-icon svg");
        if (icon) {
          gsap.to(icon, {
            y: "-=10",
            rotation: i % 2 === 0 ? 5 : -5,
            duration: 3 + i,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1
          });
        }
      });
    }, containerRef);

    // Refresh ScrollTrigger when fonts load
    if (document.fonts) {
      document.fonts.ready.then(() => {
        ScrollTrigger.refresh();
      });
    }

    // Use ResizeObserver for bulletproof scrollWidth updates when fonts/images load
    let ro: ResizeObserver | null = null;
    if (scrollTrackRef.current) {
      ro = new ResizeObserver(() => {
        ScrollTrigger.refresh();
      });
      ro.observe(scrollTrackRef.current);
    }

    // Refresh on window resize just in case
    const handleResize = () => ScrollTrigger.refresh();
    window.addEventListener('resize', handleResize);

    return () => {
      ctx.revert();
      if (ro) ro.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="ll-landing relative overflow-hidden" ref={containerRef} style={{ overflowX: 'hidden' }}>
      {/* 3D Pets Background */}
      <CubePetsScene />

      {/* Header */}
      <header className="ll-header relative z-10">
        <Link href="/home_plan_2" className="ll-brand">
          <div className="ll-brand-logo">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 0C31.0457 0 40 8.9543 40 20C40 31.0457 31.0457 40 20 40C8.9543 40 0 31.0457 0 20C0 8.9543 8.9543 0 20 0Z" fill="#0ae448"/>
              <path d="M14 12V28H28" stroke="#0e100f" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          LumaLang
        </Link>
        <nav className="ll-nav">
          <Link href="#features">Tính năng</Link>
          <Link href="#method">Phương pháp</Link>
          <Link href="#community">Cộng đồng</Link>
        </nav>
        <Link href="/learn" className="ll-header-cta">
          Vào học ngay
        </Link>
      </header>

      {/* Hero Section */}
      <section className="ll-hero relative z-10">
        <div className="ll-hero-content" style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          
          <div className="ll-hero-heading-gsap" role="heading" aria-level={1} style={{ display: 'flex', flexDirection: 'column' }}>
            
            {/* First Line: "Học" */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <div style={{ overflow: 'hidden', paddingBottom: '0.1em', marginBottom: '-0.1em' }}>
                  <SplitChars text="Học" className="hero-line white" />
                </div>
                {/* Sparkle attached specifically to the top right of "Học" */}
                <SvgSparkle className="hero-shape" style={{ position: 'absolute', top: '-15%', right: '-30%', width: 'clamp(50px, 12vw, 150px)', zIndex: -1 }} />
              </div>
            </div>
            
            {/* Second Line: "ngôn ngữ." */}
            <div style={{ display: 'flex', alignItems: 'center', color: 'var(--ll-green)' }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                {/* GeoX attached to the left of "ngôn" */}
                <SvgGeoX className="hero-shape" style={{ position: 'absolute', top: '10%', left: '-15%', width: 'clamp(25px, 6vw, 80px)', zIndex: -1 }} />
                
                <div style={{ overflow: 'hidden', paddingBottom: '0.1em', marginBottom: '-0.1em' }}>
                  <SplitChars text="ngôn ngữ." className="hero-line green" />
                </div>
                
                {/* Squiggle attached specifically to the bottom right of "ngữ." */}
                <SvgSquiggle className="hero-shape" style={{ position: 'absolute', bottom: '5%', right: '-10%', width: 'clamp(35px, 10vw, 120px)', zIndex: -1 }} />
              </div>
            </div>

          </div>
          
          <div className="ll-hero-bottom hero-fade" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'clamp(3vh, 6vh, 4rem)', flexWrap: 'wrap', gap: '2rem' }}>
            <div className="ll-hero-desc" style={{ 
              position: 'relative', 
              padding: '0.5rem 1.5rem', 
              maxWidth: '380px',
              fontSize: '1.1rem',
              lineHeight: 1.5,
              opacity: 0.8,
              fontWeight: 400,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 300, color: 'rgba(255,255,255,0.5)' }}>{'{'}</span>
              <div>
                Lộ trình cá nhân · AI Tutor · Shadowing qua phim.
                <br />
                Học sâu, nhớ lâu, và cực kỳ chill.
              </div>
              <span style={{ fontSize: '2.5rem', fontWeight: 300, color: 'rgba(255,255,255,0.5)' }}>{'}'}</span>
            </div>
            
            <div className="ll-hero-cta">
              <Link href="/learn" className="ll-btn--gsap">
                Học thử miễn phí 
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '0.5rem' }}><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Horizontal Scroll Text Section */}
      <section className="ll-scroll-section relative z-10" style={{ overflow: 'hidden' }}>
        <div className="ll-scroll-wrapper">
          <div className="ll-scroll-track" ref={scrollTrackRef} style={{ display: 'flex', width: 'fit-content', position: 'relative' }}>
            
            {/* Main huge scrolling text */}
            <div className="ll-scroll-text" style={{ padding: '0 10vw' }}>
              <span>Học ngôn ngữ</span>
              
              {/* Floating Foreign Quote 1 */}
              <div className="ll-scroll-pill pink absolute" style={{ position: 'absolute', left: '15%', top: '-5%', fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', padding: '0.8em 1.5em', transform: 'rotate(-4deg)' }}>
                学一门语言，就是多一扇观察世界的窗户。
              </div>

              <span className="ll-scroll-pill orange">không hề</span>
              <span>nhàm chán.</span>
              
              <SvgDiamond className="ll-scroll-deco-item" style={{ transform: 'rotate(15deg) scale(0.8) translateY(-30%)' }} />
              
              {/* Floating Foreign Quote 2 */}
              <div className="ll-scroll-pill lilac absolute" style={{ position: 'absolute', left: '40%', bottom: '-15%', fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', padding: '0.8em 1.5em', transform: 'rotate(3deg)' }}>
                To have another language is to possess a second soul.
              </div>

              <span>Khám phá</span>
              <span className="ll-scroll-pill green">thế giới mới</span>
              <span>qua từng từ vựng.</span>
              
              <SvgRing className="ll-scroll-deco-item" style={{ transform: 'scale(1.2)' }} />
              
              {/* Floating Foreign Quote 3 */}
              <div className="ll-scroll-pill cyan absolute" style={{ position: 'absolute', left: '65%', top: '-10%', fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', padding: '0.8em 1.5em', transform: 'rotate(-2deg)' }}>
                新しい言語は新しい人生の始まりである。
              </div>

              <span>Học bất cứ đâu</span>
              <span className="ll-scroll-pill pink">mọi lúc</span>
              <span className="ll-scroll-pill cyan">mọi nơi.</span>
              
              <SvgFlower className="ll-scroll-deco-item" style={{ transform: 'rotate(-20deg) scale(0.9) translateY(40%)' }} />
              
              {/* Floating Foreign Quote 4 */}
              <div className="ll-scroll-pill green absolute" style={{ position: 'absolute', left: '85%', bottom: '-10%', fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', padding: '0.8em 1.5em', transform: 'rotate(5deg)' }}>
                언어는 문화의 거울이다.
              </div>

              <span>LumaLang is</span>
              <span className="ll-scroll-pill lilac">Super</span>
              <span>easy & chill.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Intro Section */}
      <section className="ll-intro relative z-10" id="method" style={{ padding: '15vh 0' }}>
        <div className="ll-container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 clamp(1.5rem, 6.7vw, 8rem)' }}>
          <div className="ll-intro-inner">
            <h2 className="ll-intro-heading" style={{ maxWidth: '80rem', fontSize: 'clamp(3rem, 6vw, 6rem)', lineHeight: 1.15, letterSpacing: '-0.03em' }}>
              <SplitWordsGSAP text="Ngôn ngữ không phải là môn học" />
              {' '}
              <SplitWordsGSAP text="nó là cánh cửa thế giới." fillColor="var(--ll-green)" />
            </h2>
            <p className="ll-intro-text" style={{ marginTop: '3rem', maxWidth: '50rem', fontSize: 'clamp(1.25rem, 2vw, 2rem)' }}>
              <SplitWords text="LumaLang được tạo ra để bạn đắm chìm vào ngôn ngữ theo cách tự nhiên nhất. Không áp lực, không deadline vô tri, chỉ có sự tò mò dẫn lối và một người bạn đồng hành luôn thấu hiểu nhịp độ của riêng bạn." />
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="ll-features relative z-10" id="features">
        <div className="ll-container">
          <div className="ll-section-label">Công cụ cốt lõi</div>
          
          <div className="ll-feat-row">
            <div className="ll-feat-icon" style={{ width: 'clamp(8rem, 20vw, 20rem)' }}>
              <SvgGradientU />
            </div>
            <div className="ll-feat-info">
              <h4>Lộ trình cá nhân</h4>
              <p>Chọn mục tiêu, thời lượng và phong cách học. Hệ thống tự động thiết kế các bài luyện tập bám sát nhịp độ của riêng bạn.</p>
            </div>
            <div className="ll-feat-action">
              <Link href="/learn" className="ll-btn ll-btn--gsap-hover" style={{ position: 'relative', overflow: 'hidden', padding: '1rem 2.5rem', borderRadius: '100px', display: 'inline-flex', alignItems: 'center', border: '1px solid var(--ll-text)', color: 'var(--ll-text)' }}>
                <div className="btn-fill" style={{ position: 'absolute', top: 0, left: 0, width: '150%', height: '150%', background: 'var(--ll-text)', borderRadius: '50%', zIndex: 0, pointerEvents: 'none' }}></div>
                <div className="btn-shimmer" style={{ position: 'absolute', top: 0, left: '-100%', width: '30%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)', transform: 'skewX(-20deg)', zIndex: 0, pointerEvents: 'none' }}></div>
                <span className="btn-text" style={{ position: 'relative', zIndex: 1, display: 'inline-block' }}>Khám phá Lộ trình</span>
              </Link>
            </div>
          </div>

          <div className="ll-feat-row">
            <div className="ll-feat-icon" style={{ width: 'clamp(8rem, 20vw, 20rem)' }}>
              <SvgGradientSquare />
            </div>
            <div className="ll-feat-info">
              <h4>Shadowing qua phim</h4>
              <p>Thực hành phát âm chuẩn bản xứ qua kho tàng video, podcast và phim ảnh thực tế được đồng bộ phụ đề thông minh.</p>
            </div>
            <div className="ll-feat-action">
              <Link href="/learn" className="ll-btn ll-btn--gsap-hover" style={{ position: 'relative', overflow: 'hidden', padding: '1rem 2.5rem', borderRadius: '100px', display: 'inline-flex', alignItems: 'center', border: '1px solid var(--ll-text)', color: 'var(--ll-text)' }}>
                <div className="btn-fill" style={{ position: 'absolute', top: 0, left: 0, width: '150%', height: '150%', background: 'var(--ll-text)', borderRadius: '50%', zIndex: 0, pointerEvents: 'none' }}></div>
                <div className="btn-shimmer" style={{ position: 'absolute', top: 0, left: '-100%', width: '30%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)', transform: 'skewX(-20deg)', zIndex: 0, pointerEvents: 'none' }}></div>
                <span className="btn-text" style={{ position: 'relative', zIndex: 1, display: 'inline-block' }}>Khám phá Shadowing</span>
              </Link>
            </div>
          </div>

          <div className="ll-feat-row">
            <div className="ll-feat-icon" style={{ width: 'clamp(8rem, 20vw, 20rem)' }}>
              <SvgGradientStar />
            </div>
            <div className="ll-feat-info">
              <h4>AI Tutor Thông Minh</h4>
              <p>Mắc kẹt? AI Tutor luôn sẵn sàng giải thích ngữ pháp, từ vựng và chấm điểm phát âm ngay trong ngữ cảnh bài học.</p>
            </div>
            <div className="ll-feat-action">
              <Link href="/learn" className="ll-btn ll-btn--gsap-hover" style={{ position: 'relative', overflow: 'hidden', padding: '1rem 2.5rem', borderRadius: '100px', display: 'inline-flex', alignItems: 'center', border: '1px solid var(--ll-text)', color: 'var(--ll-text)' }}>
                <div className="btn-fill" style={{ position: 'absolute', top: 0, left: 0, width: '150%', height: '150%', background: 'var(--ll-text)', borderRadius: '50%', zIndex: 0, pointerEvents: 'none' }}></div>
                <div className="btn-shimmer" style={{ position: 'absolute', top: 0, left: '-100%', width: '30%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)', transform: 'skewX(-20deg)', zIndex: 0, pointerEvents: 'none' }}></div>
                <span className="btn-text" style={{ position: 'relative', zIndex: 1, display: 'inline-block' }}>Khám phá AI Tutor</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="ll-cta-final relative z-10" id="community">
        <h2>
          Sẵn sàng <br/>
          <span className="ll-pill ll-pill--green ll-pill--xl" style={{ marginTop: '1rem', display: 'inline-block' }}>bắt đầu</span> chưa?
        </h2>
        <Link href="/learn" className="ll-btn ll-btn--fill ll-btn--lg">
          Vào học ngay
        </Link>
        <p className="ll-sub">Chỉ mất 60 giây, không cần thẻ tín dụng.</p>
      </section>

      {/* Footer */}
      <footer className="ll-footer relative z-10">
        <div className="ll-footer-inner">
          <div>
            <div className="ll-brand">LumaLang</div>
            <p>Học ngôn ngữ theo phong cách chill nhất. Thiết kế bởi trái tim yêu ngôn ngữ.</p>
          </div>
          <nav>
            <Link href="#">Trang chủ</Link>
            <Link href="/learn">Dashboard</Link>
            <Link href="#">Về chúng tôi</Link>
            <Link href="#">Điều khoản</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
