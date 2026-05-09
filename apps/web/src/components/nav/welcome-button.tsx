'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';

interface WelcomeButtonProps {
  firstName: string;
}

export function WelcomeButton({ firstName }: WelcomeButtonProps) {
  const [phase, setPhase] = useState<'welcome' | 'fading' | 'name'>('welcome');
  const welcomeRef = useRef<HTMLSpanElement>(null);
  const nameRef = useRef<HTMLSpanElement>(null);
  const [welcomeWidth, setWelcomeWidth] = useState(0);
  const [nameWidth, setNameWidth] = useState(0);

  useEffect(() => {
    if (welcomeRef.current) setWelcomeWidth(welcomeRef.current.offsetWidth);
    if (nameRef.current) setNameWidth(nameRef.current.offsetWidth);
  }, [firstName]);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setPhase('fading'), 2200);
    const nameTimer = setTimeout(() => setPhase('name'), 2600);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(nameTimer);
    };
  }, []);

  const currentWidth = phase === 'name' ? nameWidth : welcomeWidth;

  return (
    <Link
      href="/dashboard"
      className="inline-flex h-9 w-9 items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary-hover md:h-auto md:w-auto md:px-4 md:py-2 md:text-[15px] md:font-semibold"
      aria-label={`Open ${firstName}'s dashboard`}
    >
      <User className="h-4 w-4 shrink-0" />

      {/* Measure spans (hidden) */}
      <span ref={welcomeRef} className="absolute invisible whitespace-nowrap text-[15px] font-semibold">
        Welcome! {firstName}
      </span>
      <span ref={nameRef} className="absolute invisible whitespace-nowrap text-[15px] font-semibold">
        {firstName}
      </span>

      {/* Animated container */}
      <motion.span
        className="relative hidden h-5 items-center overflow-hidden whitespace-nowrap md:inline-flex"
        animate={{ width: currentWidth }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] as const }}
      >
        {/* Welcome text */}
        <motion.span
          className="absolute left-0"
          animate={{
            opacity: phase === 'welcome' ? 1 : 0,
            y: phase === 'welcome' ? 0 : -6,
          }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
        >
          Welcome! {firstName}
        </motion.span>

        {/* Name text */}
        <motion.span
          className="absolute left-0"
          animate={{
            opacity: phase === 'name' ? 1 : 0,
            y: phase === 'name' ? 0 : 6,
          }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
        >
          {firstName}
        </motion.span>
      </motion.span>
    </Link>
  );
}
