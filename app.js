// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    initializeNavigation();
    initializeTypingAnimation();
    initializeScrollAnimations();
    initializeLoadingScreen();
    initializeBackToTop();
});

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
    const sunIcon = `
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/>
        </svg>
    `;
    const moonIcon = `
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/>
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

    const roles = [
        'AI Engineer',
        'Computer Vision Specialist',
        'Full-Stack Developer',
        'Software Engineer'
    ];

    let roleIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 100;

    function type() {
        const currentRole = roles[roleIndex];

        if (isDeleting) {
            // Remove characters
            typedTextElement.textContent = currentRole.substring(0, charIndex - 1);
            charIndex--;
            typingSpeed = 50;
        } else {
            // Add characters
            typedTextElement.textContent = currentRole.substring(0, charIndex + 1);
            charIndex++;
            typingSpeed = 100;
        }

        // Check if word is complete
        if (!isDeleting && charIndex === currentRole.length) {
            // Pause before deleting
            typingSpeed = 2000;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            // Move to next role
            isDeleting = false;
            roleIndex = (roleIndex + 1) % roles.length;
            typingSpeed = 500;
        }

        setTimeout(type, typingSpeed);
    }

    // Start typing animation
    type();
}

// ============================================
// SCROLL ANIMATIONS
// ============================================

function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
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
        el.style.transitionDelay = `${index * 0.1}s`;
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

    // Hide loading screen when page is fully loaded
    window.addEventListener('load', () => {
        setTimeout(() => {
            loadingOverlay.classList.add('fade-out');
            setTimeout(() => {
                loadingOverlay.remove();
            }, 500);
        }, 500);
    });
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
