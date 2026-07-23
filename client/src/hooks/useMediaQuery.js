import { useEffect, useState } from "react";

/**
 * Custom hook to track the state of a CSS media query.
 * @param {string} query - The CSS media query string (e.g., '(max-width: 768px)')
 * @param {boolean} initialValue - Fallback value before mounting (default: false)
 * @returns {boolean} Whether the media query matches
 */

export const useMediaQuery = (query, initialValue = false) => {
    const [matches, setMatches] = useState(initialValue);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const media = window.matchMedia(query);
        
        setMatches(media.matches);
        
        /** @param {MediaQueryListEvent} event */
        const listener = (event) => setMatches(event.matches);
        media.addEventListener("change", listener);

        return () => media.removeEventListener("change", listener);
    }, [query]); 

    return matches; 
};