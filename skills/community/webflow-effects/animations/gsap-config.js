/**
 * GSAP Configuration for Webflow Effects
 * ScrollTrigger animations and page load effects
 */

// Wait for GSAP to be loaded
function initGSAP() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    setTimeout(initGSAP, 100);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // ========================================
  // Fade Up Animation
  // ========================================
  gsap.utils.toArray('.gsap-fade-up').forEach((elem) => {
    gsap.fromTo(elem,
      { y: 50, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: elem,
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      }
    );
  });

  // ========================================
  // Stagger Children
  // ========================================
  gsap.utils.toArray('.gsap-stagger').forEach((container) => {
    const children = container.children;
    gsap.fromTo(children,
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: container,
          start: 'top 80%'
        }
      }
    );
  });

  // ========================================
  // Parallax Effect
  // ========================================
  gsap.utils.toArray('.gsap-parallax').forEach((elem) => {
    gsap.to(elem, {
      yPercent: -20,
      ease: 'none',
      scrollTrigger: {
        trigger: elem,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true
      }
    });
  });

  // ========================================
  // Scale In
  // ========================================
  gsap.utils.toArray('.gsap-scale-in').forEach((elem) => {
    gsap.fromTo(elem,
      { scale: 0.8, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: 0.7,
        ease: 'back.out(1.7)',
        scrollTrigger: {
          trigger: elem,
          start: 'top 85%'
        }
      }
    );
  });

  // ========================================
  // Hero Animation (on page load)
  // ========================================
  const heroTitle = document.querySelector('.hero-title');
  const heroSubtitle = document.querySelector('.hero-subtitle');
  const heroCta = document.querySelector('.hero-cta');

  if (heroTitle) {
    const tl = gsap.timeline();
    tl.fromTo(heroTitle, 
      { y: 60, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }
    );
    
    if (heroSubtitle) {
      tl.fromTo(heroSubtitle,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
        '-=0.6'
      );
    }
    
    if (heroCta) {
      tl.fromTo(heroCta,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' },
        '-=0.4'
      );
    }
  }

  // ========================================
  // Counter Animation for Stats
  // ========================================
  gsap.utils.toArray('.stat-number').forEach((stat) => {
    const target = parseInt(stat.getAttribute('data-value') || stat.textContent);
    
    ScrollTrigger.create({
      trigger: stat,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.fromTo(stat, 
          { textContent: 0 },
          {
            textContent: target,
            duration: 2,
            ease: 'power2.out',
            snap: { textContent: 1 },
            onUpdate: function() {
              stat.textContent = Math.round(this.targets()[0].textContent);
            }
          }
        );
      }
    });
  });

  // ========================================
  // Image Reveal
  // ========================================
  gsap.utils.toArray('.gsap-reveal').forEach((elem) => {
    gsap.fromTo(elem,
      { clipPath: 'inset(100% 0 0 0)' },
      {
        clipPath: 'inset(0% 0 0 0)',
        duration: 1,
        ease: 'power3.inOut',
        scrollTrigger: {
          trigger: elem,
          start: 'top 80%'
        }
      }
    );
  });

  console.log('✅ GSAP animations initialized');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGSAP);
} else {
  initGSAP();
}
