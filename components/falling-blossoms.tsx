'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Blossom {
  id: number;
  x: number;
  delay: number;
  duration: number;
  rotation: number;
  size: number;
  swayAmplitude: number;
  icon: string;
}

export function FallingBlossoms() {
  const [blossoms, setBlossoms] = useState<Blossom[]>([]);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    // Check if current month is January (0) or February (1)
    const currentMonth = new Date().getMonth();
    // Temporarily show always for testing - change to: currentMonth === 0 || currentMonth === 1
    setShouldShow(true); // Always show for now

    // Tet holiday icons
    const tetIcons = ['🌼', '🌸', '🧧', '🏮', '🧨', '🫔'];

    // Generate random blossoms
    const generatedBlossoms: Blossom[] = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      x: Math.random() * 100, // Random x position (0-100%)
      delay: Math.random() * 5, // Random delay (0-5s)
      duration: 5 + Math.random() * 5, // Random duration (5-10s)
      rotation: Math.random() * 360, // Random initial rotation
      size: 20 + Math.random() * 15, // Random size (20-35px)
      swayAmplitude: 20 + Math.random() * 30, // Random sway (20-50px)
      icon: tetIcons[Math.floor(Math.random() * tetIcons.length)], // Random icon
    }));

    setBlossoms(generatedBlossoms);
  }, []);

  if (!shouldShow) {
    return null;
  }

  return (
    <div className='fixed inset-0 pointer-events-none overflow-hidden z-40'>
      {blossoms.map((blossom) => (
        <motion.div
          key={blossom.id}
          className='absolute'
          initial={{
            x: `${blossom.x}vw`,
            y: '-10%',
            rotate: blossom.rotation,
          }}
          animate={{
            y: '110vh',
            rotate: blossom.rotation + 360 * 2,
            x: [
              `${blossom.x}vw`,
              `${blossom.x + blossom.swayAmplitude / 10}vw`,
              `${blossom.x - blossom.swayAmplitude / 10}vw`,
              `${blossom.x}vw`,
            ],
          }}
          transition={{
            duration: blossom.duration,
            delay: blossom.delay,
            repeat: 2, // Repeat 2 times (total 3 falls: initial + 2 repeats)
            ease: 'linear',
            x: {
              duration: blossom.duration / 2,
              repeat: 2,
              ease: 'easeInOut',
            },
          }}
          style={{
            fontSize: `${blossom.size}px`,
          }}
        >
          {/* Display emoji icon with shadow */}
          <div
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
              fontSize: `${blossom.size}px`,
              lineHeight: 1,
            }}
          >
            {blossom.icon}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
