import { useEffect, useRef } from 'react';

export const useNavigation = (view, setView, activeDeckId, setActiveDeckId, loading) => {
  const isPopNavigationRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initialState = window.history.state?.__jpFlashcards
      ? window.history.state
      : { __jpFlashcards: true, view: 'library', activeDeckId: null };

    window.history.replaceState(initialState, '', window.location.href);

    if (initialState.view) {
      isPopNavigationRef.current = true;
      setView(initialState.view);
      setActiveDeckId(initialState.activeDeckId || null);
    }

    const handlePopState = (event) => {
      if (event.state?.__jpFlashcards) {
        isPopNavigationRef.current = true;
        setView(event.state.view || 'library');
        setActiveDeckId(event.state.activeDeckId || null);
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

    window.history.pushState(
      { __jpFlashcards: true, view, activeDeckId: activeDeckId || null },
      '',
      window.location.href
    );
  }, [view, activeDeckId, loading]);
};
