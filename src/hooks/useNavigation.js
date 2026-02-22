import { useEffect, useRef } from 'react';

export const useNavigation = (view, setView, activeDeckId, setActiveDeckId, loading) => {
  const isPopNavigationRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Always start from library on a fresh page load/reload.
    // We use replaceState so it doesn't add an extra history entry.
    const freshState = { __jpFlashcards: true, view: 'library', activeDeckId: null };
    window.history.replaceState(freshState, '', window.location.href);

    const handlePopState = (event) => {
      if (event.state?.__jpFlashcards) {
        isPopNavigationRef.current = true;
        setView(event.state.view || 'library');
        setActiveDeckId(event.state.activeDeckId || null);
      } else {
        // Fallback if state is missing
        isPopNavigationRef.current = true;
        setView('library');
        setActiveDeckId(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setView, setActiveDeckId]);

  useEffect(() => {
    if (typeof window === 'undefined' || loading) return;

    if (isPopNavigationRef.current) {
      isPopNavigationRef.current = false;
      return;
    }

    const currentState = window.history.state;
    if (
      currentState?.__jpFlashcards &&
      currentState.view === view &&
      (currentState.activeDeckId || null) === (activeDeckId || null)
    ) {
      return;
    }

    // If we are going back to library, we might want to replace state instead of push
    // to avoid infinite loops of library states, but pushState is generally fine
    // if we want to keep the history.
    window.history.pushState(
      { __jpFlashcards: true, view, activeDeckId: activeDeckId || null },
      '',
      window.location.href
    );
  }, [view, activeDeckId, loading]);
};
