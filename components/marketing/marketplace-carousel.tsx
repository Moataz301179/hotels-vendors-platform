'use client';

import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import styles from './marketplace-carousel.module.css';

export type CoverSlide = { id: string; title: string; detail: string; image: string };

export function MarketplaceCarousel({ slides, onSelect }: { slides: CoverSlide[]; onSelect: (id: string) => void }) {
  const [index, setIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const count = slides.length;

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReducedMotion(media.matches);
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (reducedMotion || count < 2) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % count), 4500);
    return () => window.clearInterval(timer);
  }, [reducedMotion, count]);

  if (!count) return null;
  const previous = () => setIndex((current) => (current - 1 + count) % count);
  const next = () => setIndex((current) => (current + 1) % count);

  return <section className={styles.carousel} aria-roledescription="carousel" aria-label="Approved category covers">
    <div className={styles.viewport}>
      <div className={styles.track} style={{ transform: `translateX(-${index * 100}%)` }}>
        {slides.map((slide, slideIndex) => <button type="button" className={styles.slide} key={slide.id} onClick={() => onSelect(slide.id)} aria-label={`Show ${slide.title}`} aria-hidden={slideIndex !== index}>
          <Image src={slide.image} alt="" fill sizes="100vw" priority={slideIndex === 0} />
          <span><small>Category cover</small><strong>{slide.title}</strong><em>{slide.detail}</em></span>
        </button>)}
      </div>
    </div>
    <button type="button" className={styles.nav} onClick={previous} aria-label="Previous category cover"><ChevronLeft size={18} /></button>
    <button type="button" className={`${styles.nav} ${styles.next}`} onClick={next} aria-label="Next category cover"><ChevronRight size={18} /></button>
    <div className={styles.dots} role="tablist" aria-label="Category covers">{slides.map((slide, slideIndex) => <button type="button" role="tab" key={slide.id} aria-label={slide.title} aria-selected={slideIndex === index} onClick={() => setIndex(slideIndex)} />)}</div>
  </section>;
}
