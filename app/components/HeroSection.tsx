'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function HeroSection() {
  const [typewriterText, setTypewriterText] = useState('');
  const [showSlowText, setShowSlowText] = useState(false);

  useEffect(() => {
    const text = 'Meet your next';
    const speed = 135;
    let i = 0;
    const timeouts: number[] = [];

    const typeWriter = () => {
      if (i < text.length) {
        setTypewriterText(text.substring(0, i + 1));
        i++;
        const timeout = window.setTimeout(typeWriter, speed);
        timeouts.push(timeout);
      } else {
        const timeout = window.setTimeout(() => setShowSlowText(true), 500);
        timeouts.push(timeout);
      }
    };

    typeWriter();

    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
    };
  }, []);

  return (
    <div className="hero-section">
      <img src="/images/cover.jpg" alt="Books Background" />

      <Link href="/" className="overlay-text">
        ReadHaven
      </Link>

      <div className="hero-content">
        <h1 className="hero-title">
          <span>{typewriterText}</span>
          <br />
          <span className={`hero-fade-text ${showSlowText ? 'hero-fade-text-visible' : ''}`}>
            favorite book
          </span>
        </h1>
      </div>
    </div>
  );
}
