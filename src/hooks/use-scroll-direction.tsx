import { useState, useEffect, useRef, RefObject } from 'react';

/**
 * Hook pour détecter la direction du scroll et l'état de scrolling
 * Supporte le scroll sur window ET sur des conteneurs spécifiques
 *
 * @param scrollContainerRef - Optionnel: ref vers l'élément scrollable
 */
export function useScrollDirection(scrollContainerRef?: RefObject<HTMLElement>) {
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      // Obtenir la position de scroll depuis le conteneur ou window
      const currentScrollY = scrollContainerRef?.current
        ? scrollContainerRef.current.scrollTop
        : window.scrollY;

      // Détecter si on a scrollé (au moins 10px depuis le haut)
      setIsScrolled(currentScrollY > 10);

      // Détecter la direction du scroll
      // Scroll down si currentScrollY > lastScrollY ET qu'on a scrollé au moins 50px
      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setIsScrollingDown(true);
      } else if (currentScrollY < lastScrollY.current) {
        // Scroll up - réafficher les éléments
        setIsScrollingDown(false);
      }

      lastScrollY.current = currentScrollY;
    };

    // Écouter le scroll sur le conteneur ou window
    const scrollElement = scrollContainerRef?.current || window;

    // Utiliser passive: true pour de meilleures performances
    scrollElement.addEventListener('scroll', handleScroll, { passive: true } as any);

    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, [scrollContainerRef]);

  return { isScrollingDown, isScrolled };
}
