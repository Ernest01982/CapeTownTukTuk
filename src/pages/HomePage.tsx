import React from 'react';
import { Hero } from '../components/Home/Hero';
import { Features } from '../components/Home/Features';
import { CallToAction } from '../components/Home/CallToAction';

export function HomePage() {
  return (
    <div className="min-h-screen">
      <Hero />
      <Features />
      <CallToAction />
    </div>
  );
}