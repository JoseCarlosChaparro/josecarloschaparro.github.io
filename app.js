// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    // Register languagechange listeners before firing the event
    initializeTypingAnimation();
    initializeExperienceCounter();

    const languageManager = new LanguageManager();
    await languageManager.init();

    initializeTheme();
    initializeNavigation();
    initializeScrollAnimations();
    initializeLoadingScreen();
    initializeBackToTop();
});

// ============================================
// EXPERIENCE COUNTER (auto-updating years)
// ============================================

function yearsSince(yyyyMm) {
    const [year, month] = yyyyMm.split('-').map(Number);
    const start = new Date(year, month - 1, 1);
    const diffMs = Date.now() - start.getTime();
    const years = diffMs / (1000 * 60 * 60 * 24 * 365.25);
    return Math.floor(years);
}

function initializeExperienceCounter() {
    // Populate any element with data-experience-since="YYYY-MM"
    document.querySelectorAll('[data-experience-since]').forEach(el => {
        el.textContent = `${yearsSince(el.dataset.experienceSince)}+`;
    });

    // Replace {years} placeholder in localized strings after language load
    document.addEventListener('languagechange', () => {
        const sinceEl = document.querySelector('[data-experience-since]');
        if (!sinceEl) return;
        const years = yearsSince(sinceEl.dataset.experienceSince);

        document.querySelectorAll('[data-i18n-html], [data-i18n]').forEach(el => {
            if (el.innerHTML.includes('{years}')) {
                el.innerHTML = el.innerHTML.replaceAll('{years}', years);
            }
        });
    });
}

// ============================================
// DARK MODE FUNCTIONALITY
// ============================================

function initializeTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;

    // Check for saved theme preference or default to dark
    const currentTheme = localStorage.getItem('theme') || 'dark';
    htmlElement.classList.toggle('dark', currentTheme === 'dark');

    // Update toggle button icon
    updateThemeIcon(currentTheme);

    // Theme toggle click handler
    themeToggle.addEventListener('click', () => {
        const isDark = htmlElement.classList.contains('dark');
        const newTheme = isDark ? 'light' : 'dark';

        htmlElement.classList.toggle('dark');
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);

        // Add transition effect
        htmlElement.style.transition = 'background-color 0.3s ease';
    });
}

function updateThemeIcon(theme) {
    const themeToggle = document.getElementById('theme-toggle');
    const attrs = 'class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
                  'stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" ' +
                  'aria-hidden="true" focusable="false"';

    // El icono muestra la acción disponible, no el estado actual:
    // en oscuro ofrece el sol (cambiar a claro) y viceversa.
    const sunIcon = `
        <svg ${attrs}>
            <circle cx="12" cy="12" r="4"></circle>
            <path d="M12 2v2"></path><path d="M12 20v2"></path>
            <path d="m4.9 4.9 1.4 1.4"></path><path d="m17.7 17.7 1.4 1.4"></path>
            <path d="M2 12h2"></path><path d="M20 12h2"></path>
            <path d="m6.3 17.7-1.4 1.4"></path><path d="m19.1 4.9-1.4 1.4"></path>
        </svg>
    `;
    const moonIcon = `
        <svg ${attrs}>
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"></path>
        </svg>
    `;

    themeToggle.innerHTML = theme === 'dark' ? sunIcon : moonIcon;
}

// ============================================
// NAVIGATION FUNCTIONALITY
// ============================================

function initializeNavigation() {
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    const header = document.querySelector('header');

    // Mobile menu toggle
    if (mobileMenuToggle && mobileMenu) {
        mobileMenuToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');

            // Update ARIA attribute
            const isOpen = !mobileMenu.classList.contains('hidden');
            mobileMenuToggle.setAttribute('aria-expanded', isOpen);
        });
    }

    // Escape cierra el menú y regresa el foco a quien lo abrió
    if (mobileMenuToggle && mobileMenu) {
        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape' || mobileMenu.classList.contains('hidden')) return;
            mobileMenu.classList.add('hidden');
            mobileMenuToggle.setAttribute('aria-expanded', 'false');
            mobileMenuToggle.focus();
        });
    }

    // Close mobile menu when link is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (mobileMenu) {
                mobileMenu.classList.add('hidden');
            }
        });
    });

    // Smooth scroll for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);

            if (targetSection) {
                const headerHeight = header ? header.offsetHeight : 0;
                const targetPosition = targetSection.offsetTop - headerHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // Mover el scroll no mueve el foco: sin esto, quien navega
                // con teclado sigue en el header después de "saltar".
                targetSection.setAttribute('tabindex', '-1');
                targetSection.focus({ preventScroll: true });
                targetSection.addEventListener('blur',
                    () => targetSection.removeAttribute('tabindex'), { once: true });
            }
        });
    });

    // Add shadow to header on scroll
    let lastScroll = 0;
    window.addEventListener('scroll', throttle(() => {
        const currentScroll = window.pageYOffset;

        if (header) {
            if (currentScroll > 50) {
                header.classList.add('shadow-lg');
            } else {
                header.classList.remove('shadow-lg');
            }
        }

        lastScroll = currentScroll;
    }, 100));
}

// ============================================
// TYPING ANIMATION
// ============================================

function initializeTypingAnimation() {
    const typedTextElement = document.getElementById('typed-text');

    if (!typedTextElement) return;

    let roles = [];
    let roleIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 100;
    let timeoutId = null;

    function type() {
        if (roles.length === 0) return;

        const currentRole = roles[roleIndex];

        if (isDeleting) {
            typedTextElement.textContent = currentRole.substring(0, charIndex - 1);
            charIndex--;
            typingSpeed = 50;
        } else {
            typedTextElement.textContent = currentRole.substring(0, charIndex + 1);
            charIndex++;
            typingSpeed = 100;
        }

        if (!isDeleting && charIndex === currentRole.length) {
            typingSpeed = 2000;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            roleIndex = (roleIndex + 1) % roles.length;
            typingSpeed = 500;
        }

        timeoutId = setTimeout(type, typingSpeed);
    }

    // WCAG 2.3.3: sin animación de tecleo si el sistema pide menos movimiento.
    // El rol se muestra completo y estático — la información no se pierde.
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Roles are provided by languagechange event dispatched by LanguageManager
    document.addEventListener('languagechange', ({ detail }) => {
        if (timeoutId) clearTimeout(timeoutId);
        roles = detail.translations.typedRoles ?? [];
        roleIndex = 0;
        charIndex = 0;
        isDeleting = false;

        if (prefersReducedMotion.matches) {
            typedTextElement.textContent = roles[0] ?? '';
            return;
        }

        typedTextElement.textContent = '';
        type();
    });
}

// ============================================
// SCROLL ANIMATIONS
// ============================================

function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.05,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                // Unobserve after revealing for performance
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Add scroll-reveal class to elements that should animate
    const animateElements = document.querySelectorAll('.scroll-reveal');

    animateElements.forEach((el, index) => {
        el.style.transitionDelay = `${index * 0.05}s`;
        observer.observe(el);
    });
}

// ============================================
// LOADING SCREEN
// ============================================

function initializeLoadingScreen() {
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = '<div class="spinner"></div>';
    document.body.prepend(loadingOverlay);

    const hideOverlay = () => {
        setTimeout(() => {
            loadingOverlay.classList.add('fade-out');
            setTimeout(() => loadingOverlay.remove(), 500);
        }, 500);
    };

    // If the window has already fired the load event by the time we run
    // (common when async init like fetching locales finishes after load),
    // hide immediately. Otherwise wait for it.
    if (document.readyState === 'complete') {
        hideOverlay();
    } else {
        window.addEventListener('load', hideOverlay, { once: true });
    }
}

// ============================================
// BACK TO TOP BUTTON
// ============================================

function initializeBackToTop() {
    const backToTopButton = document.getElementById('back-to-top');

    if (!backToTopButton) return;

    backToTopButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Show/hide button based on scroll position
    window.addEventListener('scroll', throttle(() => {
        if (window.pageYOffset > 300) {
            backToTopButton.classList.remove('opacity-0', 'pointer-events-none');
            backToTopButton.classList.add('opacity-100');
        } else {
            backToTopButton.classList.add('opacity-0', 'pointer-events-none');
            backToTopButton.classList.remove('opacity-100');
        }
    }, 100));
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// ============================================
// LANGUAGE MANAGER
// ============================================

class LanguageManager {
    #currentLanguage;
    #cache = {};
    #parser = new DOMParser();

    constructor() {
        this.#currentLanguage = localStorage.getItem('language') || 'en';
    }

    async init() {
        await this.#applyLanguage(this.#currentLanguage);

        const toggleBtn = document.getElementById('language-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.#toggle());
        }
    }

    getCurrentLanguage() {
        return this.#currentLanguage;
    }

    async #toggle() {
        const next = this.#currentLanguage === 'en' ? 'es' : 'en';
        await this.#applyLanguage(next);
    }

    async #applyLanguage(lang) {
        const translations = await this.#loadLocale(lang);

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const value = this.#resolve(translations, el.dataset.i18n);
            if (value) el.textContent = value;
        });

        document.querySelectorAll('[data-i18n-html]').forEach(el => {
            const value = this.#resolve(translations, el.dataset.i18nHtml);
            if (value) this.#setHTML(el, value);
        });

        // Etiquetas accesibles: los botones de idioma, tema y menú no tienen
        // texto visible, así que su nombre accesible también debe traducirse.
        document.querySelectorAll('[data-i18n-aria]').forEach(el => {
            const value = this.#resolve(translations, el.dataset.i18nAria);
            if (value) el.setAttribute('aria-label', value);
        });

        // Solo el codigo visible: el <span class="sr-only"> hermano lleva la
        // descripcion traducida y debe sobrevivir al cambio de idioma.
        const langCode = document.getElementById('language-code');
        if (langCode) langCode.textContent = lang.toUpperCase();

        document.documentElement.lang = lang;
        if (translations.meta?.title) document.title = translations.meta.title;
        localStorage.setItem('language', lang);
        this.#currentLanguage = lang;

        document.dispatchEvent(
            new CustomEvent('languagechange', { detail: { lang, translations } })
        );
    }

    async #loadLocale(lang) {
        if (this.#cache[lang]) return this.#cache[lang];

        try {
            const response = await fetch(`locales/${lang}.json`);
            const data = await response.json();
            this.#cache[lang] = data;
            return data;
        } catch (error) {
            console.error(`Error loading locale: ${lang}`, error);
            return {};
        }
    }

    // Parses developer-authored locale strings via DOMParser (no user input reaches here)
    #setHTML(element, htmlString) {
        const doc = this.#parser.parseFromString(htmlString, 'text/html');
        element.replaceChildren(...Array.from(doc.body.childNodes));
    }

    // O(1) resolution — max 1 level deep: "category.key"
    #resolve(obj, path) {
        const [category, key] = path.split('.');
        return key ? obj[category]?.[key] : obj[category];
    }
}

// Throttle function for scroll events
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
