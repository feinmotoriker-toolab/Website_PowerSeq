document.addEventListener('DOMContentLoaded', () => {
    // PowerSeq_501 Neon Ring Animation
    const ANIMATION_INTERVAL = 1000; // 1 Sekunde
    const slots = ['slot1', 'slot2', 'slot3', 'slot4', 'slot5'];

    let animationTimeouts = [];

    function startAnimation() {
        // Reset state before starting
        stopAnimation();

        // Activate slots sequentially (Start with 1s delay for "All Off" state)
        slots.forEach((slotId, index) => {
            const timeout = setTimeout(() => {
                const slot = document.getElementById(slotId);
                if (slot) slot.classList.add('active');
            }, (index + 1) * ANIMATION_INTERVAL);
            animationTimeouts.push(timeout);
        });

        // Turn off all rings after the last one has been shown for 1s
        const cleanupTime = (slots.length + 1) * ANIMATION_INTERVAL;
        const cleanupTimeout = setTimeout(() => {
            slots.forEach(slotId => {
                const slot = document.getElementById(slotId);
                if (slot) slot.classList.remove('active');
            });
        }, cleanupTime);
        animationTimeouts.push(cleanupTimeout);

        // Loop animation: cleanup acts as end of cycle.
        // Restart immediately, as the new cycle starts with 1s delay (dark phase).
        const totalDuration = cleanupTime;
        const loopTimeout = setTimeout(startAnimation, totalDuration);
        animationTimeouts.push(loopTimeout);
    }

    function stopAnimation() {
        animationTimeouts.forEach(timeout => clearTimeout(timeout));
        animationTimeouts = [];
        slots.forEach(slotId => {
            const slot = document.getElementById(slotId);
            if (slot) slot.classList.remove('active');
        });
    }

    // Start animation loop
    startAnimation();

    // Smooth Scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Simple fade-in on scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    });

    // --- Generic Modal Logic ---
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('visible');
            document.body.style.overflow = 'hidden';
        }, 10);
    }

    function closeModal(modal) {
        if (!modal) return;
        modal.classList.remove('visible');
        setTimeout(() => {
            modal.style.display = 'none';
            // Only restore scroll if no other visible modal exists
            if (!document.querySelector('.modal.visible')) {
                document.body.style.overflow = '';
            }
        }, 300);
    }

    // Attach open events
    document.querySelectorAll('.open-form').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal('contact-modal');
        });
    });

    document.querySelectorAll('.open-impressum').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal('impressum-modal');
        });
    });

    document.querySelectorAll('.open-privacy').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal('privacy-modal');
        });
    });

    // Attach close events to all modals
    document.querySelectorAll('.modal').forEach(modal => {
        // Close on X button
        const closeBtn = modal.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => closeModal(modal));
        }

        // Close on click outside content
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal);
            }
        });
    });

    // Form Submission Handling
    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');
    if (contactForm) {
        contactForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const data = new FormData(e.target);
            const submitBtn = contactForm.querySelector('button[type="submit"]');

            submitBtn.disabled = true;
            submitBtn.textContent = 'Wird gesendet...';

            try {
                const response = await fetch(e.target.action, {
                    method: 'POST',
                    body: data,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                 if (response.ok) {
                    formStatus.textContent = 'Vielen Dank! Ihre Nachricht wurde erfolgreich versendet.';
                    formStatus.className = 'success';
                    formStatus.setAttribute('aria-live', 'polite');
                    contactForm.reset();
                    
                    // Reset accessibility attributes on reset
                    contactForm.querySelectorAll('input, textarea').forEach(el => {
                        el.removeAttribute('aria-invalid');
                        const existingDesc = el.getAttribute('aria-describedby');
                        if (existingDesc) {
                            const cleaned = existingDesc.replace('form-status', '').trim();
                            if (cleaned) {
                                el.setAttribute('aria-describedby', cleaned);
                            } else {
                                el.removeAttribute('aria-describedby');
                            }
                        }
                    });
                    // Re-set initial description for privacy checkbox
                    const privacyCheckbox = document.getElementById('privacy');
                    if (privacyCheckbox) {
                        privacyCheckbox.setAttribute('aria-describedby', 'privacy-desc');
                    }
                    setTimeout(() => closeModal(document.getElementById('contact-modal')), 3000);
                } else {
                    const result = await response.json();
                    let errMsg = '';
                    if (result.errors) {
                        errMsg = result.errors.map(error => error.message).join(", ");
                    } else {
                        errMsg = 'Hoppla! Da ist etwas schiefgelaufen.';
                    }
                    formStatus.textContent = errMsg;
                    formStatus.className = 'error';
                    formStatus.setAttribute('aria-live', 'assertive');
                    
                    // Set accessibility error state on required controls
                    contactForm.querySelectorAll('input[required], textarea[required], input[type="checkbox"]').forEach(el => {
                        el.setAttribute('aria-invalid', 'true');
                        const existingDesc = el.getAttribute('aria-describedby');
                        if (existingDesc) {
                            if (!existingDesc.includes('form-status')) {
                                el.setAttribute('aria-describedby', `${existingDesc} form-status`);
                            }
                        } else {
                            el.setAttribute('aria-describedby', 'form-status');
                        }
                    });
                }
            } catch (error) {
                formStatus.textContent = 'Hoppla! Da ist ein Netzwerkfehler aufgetreten.';
                formStatus.className = 'error';
                formStatus.setAttribute('aria-live', 'assertive');
                
                contactForm.querySelectorAll('input[required], textarea[required], input[type="checkbox"]').forEach(el => {
                    el.setAttribute('aria-invalid', 'true');
                    const existingDesc = el.getAttribute('aria-describedby');
                    if (existingDesc) {
                        if (!existingDesc.includes('form-status')) {
                            el.setAttribute('aria-describedby', `${existingDesc} form-status`);
                        }
                    } else {
                        el.setAttribute('aria-describedby', 'form-status');
                    }
                });
            } finally {
                formStatus.style.display = 'block';
                submitBtn.disabled = false;
                submitBtn.textContent = 'Jetzt senden';
            }
        });
    }

    // --- Image Lightbox Logic ---
    const lightbox = document.getElementById('image-lightbox');
    const lightboxImg = lightbox.querySelector('.lightbox-content');
    const zoomableTiers = document.querySelectorAll('.price-tier.zoomable');

    zoomableTiers.forEach(tier => {
        tier.addEventListener('click', () => {
            const img = tier.querySelector('img');
            if (img) {
                lightboxImg.src = img.src;
                lightbox.style.display = 'flex';
                setTimeout(() => {
                    lightbox.classList.add('visible');
                    document.body.style.overflow = 'hidden';
                }, 10);
            }
        });
    });

    lightbox.addEventListener('click', () => {
        lightbox.classList.remove('visible');
        setTimeout(() => {
            lightbox.style.display = 'none';
            document.body.style.overflow = '';
            lightboxImg.src = ''; // Clear src after closing
        }, 300);
    });
});
