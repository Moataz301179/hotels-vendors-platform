"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";

import styles from "./hero-carousel.module.css";

const slides = [
  {
    eyebrow: "Restaurants & bars",
    title: "Browse and source for service that never pauses.",
    description: "Start with visual product references for food, beverage, table service and commercial kitchen operations.",
    href: "/marketplace?category=Restaurants%20%26%20bars",
    action: "Explore the sourcing area",
    image: "/category-food-beverage.png",
    alt: "Hotel food and beverage operating area",
  },
  {
    eyebrow: "Housekeeping & guest rooms",
    title: "Make daily turnover easier to control.",
    description: "Find reference products for linen, cleaning consumables, guest amenities and room readiness.",
    href: "/marketplace?category=Housekeeping%20%26%20laundry",
    action: "Explore housekeeping",
    image: "/category-housekeeping.png",
    alt: "Hotel housekeeping room with linen and cleaning supplies",
  },
  {
    eyebrow: "Engineering & furniture",
    title: "Keep property systems and spaces ready.",
    description: "Move technical requirements into a controlled sourcing request without turning discovery into a public offer.",
    href: "/marketplace?category=Engineering%20%26%20maintenance",
    action: "Explore engineering",
    image: "/category-engineering-ffe.png",
    alt: "Hotel engineering components on a workbench",
  },
  {
    eyebrow: "HOVIN receiving",
    title: "Receive, confirm and keep the evidence attached.",
    description: "HOVIN supports assigned receiving handoffs; people still confirm quantities and condition before a record moves on.",
    href: "/hovin",
    action: "Explore HOVIN",
    image: "/hovin-delivery-verification.png",
    alt: "Hotel receiving handoff verification on HOVIN",
  },
] as const;

export function HeroCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const slide = slides[active];

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 6500);
    return () => window.clearInterval(timer);
  }, [paused]);

  const previous = () => setActive((current) => (current + slides.length - 1) % slides.length);
  const next = () => setActive((current) => (current + 1) % slides.length);

  return (
    <section className={styles.carousel} aria-roledescription="carousel" aria-label="HotelsVendors sourcing journeys">
      <div className={styles.imageFrame}>
        <Image key={slide.image} src={slide.image} alt={slide.alt} fill priority={active === 0} sizes="(max-width: 950px) calc(100vw - 48px), 58vw" />
        <div className={styles.imageWash} />
        <Image className={styles.logo} src="/assets/logo.svg" alt="HotelsVendors" width={178} height={42} />
        <p className={styles.counter} aria-live="polite">{String(active + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</p>
      </div>
      <div className={styles.content}>
        <p className={styles.eyebrow}>{slide.eyebrow}</p>
        <h2>{slide.title}</h2>
        <p>{slide.description}</p>
        <Link href={slide.href} className={styles.action}>{slide.action} <ArrowRight size={17} aria-hidden="true" /></Link>
      </div>
      <div className={styles.controls}>
        <button type="button" onClick={previous} aria-label="Previous journey"><ArrowLeft size={18} /></button>
        <div className={styles.dots} aria-label="Choose a journey">
          {slides.map((item, index) => <button key={item.eyebrow} type="button" onClick={() => setActive(index)} aria-label={`Show ${item.eyebrow}`} aria-current={index === active ? "true" : undefined} />)}
        </div>
        <button type="button" onClick={next} aria-label="Next journey"><ArrowRight size={18} /></button>
        <button type="button" onClick={() => setPaused((value) => !value)} aria-label={paused ? "Resume carousel" : "Pause carousel"}>{paused ? <Play size={17} /> : <Pause size={17} />}</button>
      </div>
    </section>
  );
}
