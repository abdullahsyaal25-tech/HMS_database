/**
 * Accessibility utilities for healthcare management system
 */

// ARIA live regions for dynamic content updates
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.position = 'absolute';
    liveRegion.style.left = '-10000px';
    liveRegion.style.width = '1px';
    liveRegion.style.height = '1px';
    liveRegion.style.overflow = 'hidden';
    
    liveRegion.textContent = message;
    document.body.appendChild(liveRegion);
    
    // Remove after announcement
    setTimeout(() => {
        document.body.removeChild(liveRegion);
    }, 1000);
};

// Focus management utilities
export const focusElement = (selector: string | HTMLElement) => {
    const element = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (element && element instanceof HTMLElement) {
        element.focus();
        return true;
    }
    return false;
};

export const trapFocus = (container: HTMLElement, firstElement?: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;
    
    const firstFocusableElement = firstElement || (focusableElements[0] as HTMLElement);
    const lastFocusableElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
        const isTabPressed = e.key === 'Tab' || e.keyCode === 9;

        if (!isTabPressed) {
            return;
        }

        if (e.shiftKey) {
            if (document.activeElement === firstFocusableElement) {
                lastFocusableElement.focus();
                e.preventDefault();
            }
        } else {
            if (document.activeElement === lastFocusableElement) {
                firstFocusableElement.focus();
                e.preventDefault();
            }
        }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
        container.removeEventListener('keydown', handleKeyDown);
    };
};

// Keyboard navigation utilities
export const createKeyboardNavigation = (
    container: HTMLElement,
    options: {
        direction?: 'vertical' | 'horizontal' | 'grid';
        onNavigate?: (element: HTMLElement, direction: string) => void;
    } = {}
) => {
    const { direction = 'vertical', onNavigate } = options;

    const handleKeyDown = (e: KeyboardEvent) => {
        const currentElement = document.activeElement as HTMLElement;
        
        if (!currentElement || !container.contains(currentElement)) {
            return;
        }

        let nextElement: HTMLElement | null = null;
        let directionStr = '';

        switch (e.key) {
            case 'ArrowDown':
                if (direction === 'vertical' || direction === 'grid') {
                    nextElement = getNextFocusableElement(currentElement, 'down');
                    directionStr = 'down';
                }
                break;
            case 'ArrowUp':
                if (direction === 'vertical' || direction === 'grid') {
                    nextElement = getNextFocusableElement(currentElement, 'up');
                    directionStr = 'up';
                }
                break;
            case 'ArrowRight':
                if (direction === 'horizontal' || direction === 'grid') {
                    nextElement = getNextFocusableElement(currentElement, 'right');
                    directionStr = 'right';
                }
                break;
            case 'ArrowLeft':
                if (direction === 'horizontal' || direction === 'grid') {
                    nextElement = getNextFocusableElement(currentElement, 'left');
                    directionStr = 'left';
                }
                break;
            case 'Home':
                nextElement = getFirstFocusableElement(container);
                directionStr = 'home';
                break;
            case 'End':
                nextElement = getLastFocusableElement(container);
                directionStr = 'end';
                break;
            default:
                return;
        }

        if (nextElement) {
            e.preventDefault();
            nextElement.focus();
            
            if (onNavigate) {
                onNavigate(nextElement, directionStr);
            }
        }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
        container.removeEventListener('keydown', handleKeyDown);
    };
};

// Helper functions for keyboard navigation
const getNextFocusableElement = (current: HTMLElement, direction: string): HTMLElement | null => {
    const allFocusable = Array.from(document.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )) as HTMLElement[];

    const currentIndex = allFocusable.indexOf(current);
    
    if (currentIndex === -1) return null;

    let nextIndex = currentIndex;

    switch (direction) {
        case 'down':
        case 'right':
            nextIndex = currentIndex + 1;
            break;
        case 'up':
        case 'left':
            nextIndex = currentIndex - 1;
            break;
    }

    if (nextIndex >= 0 && nextIndex < allFocusable.length) {
        return allFocusable[nextIndex];
    }

    return null;
};

const getFirstFocusableElement = (container: HTMLElement): HTMLElement | null => {
    const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;
    
    return focusableElements[0] || null;
};

const getLastFocusableElement = (container: HTMLElement): HTMLElement | null => {
    const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;
    
    return focusableElements[focusableElements.length - 1] || null;
};

// Skip link functionality
export const createSkipLink = (targetId: string, text: string = 'Skip to main content') => {
    const skipLink = document.createElement('a');
    skipLink.href = `#${targetId}`;
    skipLink.textContent = text;
    skipLink.className = 'skip-link';
    skipLink.style.position = 'absolute';
    skipLink.style.left = '-9999px';
    skipLink.style.top = 'auto';
    skipLink.style.width = '1px';
    skipLink.style.height = '1px';
    skipLink.style.overflow = 'hidden';
    skipLink.style.zIndex = '99999';
    
    // Show skip link on focus
    skipLink.addEventListener('focus', () => {
        skipLink.style.left = '10px';
        skipLink.style.width = 'auto';
        skipLink.style.height = 'auto';
        skipLink.style.overflow = 'visible';
    });

    skipLink.addEventListener('blur', () => {
        skipLink.style.left = '-9999px';
        skipLink.style.width = '1px';
        skipLink.style.height = '1px';
        skipLink.style.overflow = 'hidden';
    });

    document.body.insertBefore(skipLink, document.body.firstChild);
    
    return skipLink;
};

// High contrast mode detection
export const detectHighContrast = (): boolean => {
    const testElement = document.createElement('div');
    testElement.style.borderTop = '1px solid transparent';
    testElement.style.borderBottom = '1px solid black';
    document.body.appendChild(testElement);
    
    const rect = testElement.getBoundingClientRect();
    const isHighContrast = rect.top === rect.bottom;
    
    document.body.removeChild(testElement);
    return isHighContrast;
};

// Screen reader only utility class
export const createScreenReaderOnlyStyle = () => {
    return {
        position: 'absolute' as const,
        left: '-10000px',
        top: 'auto',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
    };
};

// Color contrast checker (simplified)
export const checkColorContrast = (foregroundColor: string, backgroundColor: string): boolean => {
    // This is a simplified version - in production, you'd want a more comprehensive checker
    const getLuminance = (color: string): number => {
        // Convert hex to RGB
        let r: number, g: number, b: number;
        
        if (color.startsWith('#')) {
            const hex = color.replace('#', '');
            r = parseInt(hex.substr(0, 2), 16);
            g = parseInt(hex.substr(2, 2), 16);
            b = parseInt(hex.substr(4, 2), 16);
        } else {
            // Handle rgb() format
            const rgb = color.match(/\d+/g);
            if (!rgb || rgb.length < 3) return 0;
            r = parseInt(rgb[0]);
            g = parseInt(rgb[1]);
            b = parseInt(rgb[2]);
        }

        const [rs, gs, bs] = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });

        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const lum1 = getLuminance(foregroundColor);
    const lum2 = getLuminance(backgroundColor);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    const contrastRatio = (brightest + 0.05) / (darkest + 0.05);

    return contrastRatio >= 4.5; // WCAG AA standard for normal text
};

// ARIA attributes helper
export const setAriaAttributes = (element: HTMLElement, attributes: Record<string, string>) => {
    Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(`aria-${key}`, value);
    });
};

export const removeAriaAttributes = (element: HTMLElement, attributeKeys: string[]) => {
    attributeKeys.forEach(key => {
        element.removeAttribute(`aria-${key}`);
    });
};