/**
 * Dr. Saurabh Chipde - Urology & Robotic Surgery Clinical Web App
 * Interactive Engine: Booking Wizard, Symptom Triage, Reels Preview & GA4 Tracking
 */

const VALID_PINS = ['501402'];

document.addEventListener('DOMContentLoaded', () => {
  initPasscodeGate();
  initBookingModal();
  initSymptomFilter();
  initFaqAccordion();
  initMobileMenu();
  initEnquiryForm();
  initReelsViewer();
  initGA4Tracking();
});

/* ---------------- 0. Private Preview Passcode Gate ---------------- */
function initPasscodeGate() {
  const isUnlocked = sessionStorage.getItem('chipde_preview_unlocked') === 'true';
  if (isUnlocked) return;

  const overlay = document.createElement('div');
  overlay.id = 'previewLockOverlay';
  overlay.innerHTML = `
    <div class="lock-card">
      <div class="lock-icon-badge"><i class="fa fa-lock"></i></div>
      <h2 class="lock-title">Dr. Saurabh Chipde Practice Portal</h2>
      <p class="lock-subtitle">Private Review Draft • Please enter your 6-digit access code to view.</p>
      
      <form id="lockForm" onsubmit="return false;">
        <div class="lock-input-group">
          <input type="password" id="lockInputPin" class="lock-input" placeholder="••••••" maxlength="10" autofocus autocomplete="off">
        </div>
        <button type="submit" id="lockSubmitBtn" class="lock-btn">Unlock Preview</button>
        <div id="lockErrorMsg" class="lock-error">Incorrect passcode. Please try again.</div>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  const pinInput = document.getElementById('lockInputPin');
  const errorMsg = document.getElementById('lockErrorMsg');
  const lockForm = document.getElementById('lockForm');

  function checkPin() {
    const val = pinInput.value.trim().toLowerCase();
    if (VALID_PINS.includes(val)) {
      sessionStorage.setItem('chipde_preview_unlocked', 'true');
      overlay.classList.add('unlocked');
      document.body.style.overflow = '';
      setTimeout(() => overlay.remove(), 400);
    } else {
      errorMsg.style.display = 'block';
      pinInput.value = '';
      pinInput.focus();
      pinInput.style.borderColor = '#f87171';
    }
  }

  lockForm.addEventListener('submit', (e) => {
    e.preventDefault();
    checkPin();
  });
}

/* ---------------- 1. Multi-Step Consultation Booking Wizard ---------------- */
function initBookingModal() {
  const modalBackdrop = document.getElementById('bookingModal');
  const openButtons = document.querySelectorAll('.js-open-booking');
  const closeButton = document.querySelector('.modal-close');
  const nextBtn = document.getElementById('btnStepNext');
  const prevBtn = document.getElementById('btnStepPrev');
  const submitBtn = document.getElementById('btnStepSubmit');

  let currentStep = 1;
  const totalSteps = 3;

  const bookingData = {
    concern: 'Prostate / Rezum Water Vapor Therapy',
    mode: 'In-Clinic (Rajshree Apollo Hospitals Indore)',
    date: '',
    timeSlot: 'Morning (10:00 AM - 02:00 PM)',
    fullName: '',
    phone: '',
    notes: ''
  };

  // Open / Close triggers
  openButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const presetConcern = btn.getAttribute('data-concern');
      if (presetConcern) {
        bookingData.concern = presetConcern;
        highlightSelectedCard('concernCards', presetConcern);
      }
      openModal();
    });
  });

  if (closeButton) {
    closeButton.addEventListener('click', closeModal);
  }

  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) closeModal();
    });
  }

  function openModal() {
    currentStep = 1;
    updateStepUI();
    modalBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
    trackGAEvent('booking_modal_opened', { step: 1 });
  }

  function closeModal() {
    modalBackdrop.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Card Selection Handlers
  setupCardSelector('concernCards', (val) => { bookingData.concern = val; });
  setupCardSelector('modeCards', (val) => { bookingData.mode = val; });
  setupCardSelector('slotCards', (val) => { bookingData.timeSlot = val; });

  function setupCardSelector(containerId, callback) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const cards = container.querySelectorAll('.radio-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        cards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        callback(card.getAttribute('data-value'));
      });
    });
  }

  function highlightSelectedCard(containerId, value) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const cards = container.querySelectorAll('.radio-card');
    cards.forEach(card => {
      if (card.getAttribute('data-value') === value) {
        card.classList.add('selected');
      } else {
        card.classList.remove('selected');
      }
    });
  }

  // Wizard Step Navigation
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (validateStep(currentStep)) {
        if (currentStep < totalSteps) {
          currentStep++;
          updateStepUI();
          trackGAEvent('booking_step_progress', { step: currentStep });
        }
      }
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentStep > 1) {
        currentStep--;
        updateStepUI();
      }
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      if (validateStep(3)) {
        handleBookingSubmission();
      }
    });
  }

  function validateStep(step) {
    if (step === 2) {
      const dateInput = document.getElementById('bookDate');
      if (dateInput && !dateInput.value) {
        alert('Please select a preferred consultation date.');
        dateInput.focus();
        return false;
      }
      bookingData.date = dateInput.value;
    }
    if (step === 3) {
      const nameInput = document.getElementById('patientName');
      const phoneInput = document.getElementById('patientPhone');
      if (!nameInput.value.trim()) {
        alert('Please enter your full name.');
        nameInput.focus();
        return false;
      }
      const phoneClean = phoneInput.value.replace(/\D/g, '');
      if (phoneClean.length < 10) {
        alert('Please enter a valid 10-digit mobile number.');
        phoneInput.focus();
        return false;
      }
      bookingData.fullName = nameInput.value.trim();
      bookingData.phone = phoneClean;
      bookingData.notes = document.getElementById('patientNotes') ? document.getElementById('patientNotes').value : '';
    }
    return true;
  }

  function updateStepUI() {
    for (let i = 1; i <= totalSteps; i++) {
      const stepContent = document.getElementById(`stepContent${i}`);
      const stepDot = document.getElementById(`stepDot${i}`);
      if (stepContent) {
        stepContent.style.display = (i === currentStep) ? 'block' : 'none';
      }
      if (stepDot) {
        if (i < currentStep) {
          stepDot.className = 'step-dot completed';
          stepDot.innerHTML = '✓';
        } else if (i === currentStep) {
          stepDot.className = 'step-dot active';
          stepDot.innerHTML = i;
        } else {
          stepDot.className = 'step-dot';
          stepDot.innerHTML = i;
        }
      }
    }

    // Navigation Buttons visibility
    if (prevBtn) prevBtn.style.display = currentStep > 1 ? 'inline-flex' : 'none';
    if (nextBtn) nextBtn.style.display = currentStep < totalSteps ? 'inline-flex' : 'none';
    if (submitBtn) submitBtn.style.display = currentStep === totalSteps ? 'inline-flex' : 'none';
  }

  function handleBookingSubmission() {
    // Generate pre-filled WhatsApp message for patient
    const msg = `Hello Dr. Chipde's Clinic,
I would like to confirm my consultation:
• Patient: ${bookingData.fullName}
• Phone: ${bookingData.phone}
• Concern: ${bookingData.concern}
• Mode: ${bookingData.mode}
• Date: ${bookingData.date}
• Preferred Slot: ${bookingData.timeSlot}
${bookingData.notes ? `• Additional Notes: ${bookingData.notes}` : ''}`;

    const waUrl = `https://wa.me/917869392498?text=${encodeURIComponent(msg)}`;

    trackGAEvent('booking_completed', {
      concern: bookingData.concern,
      mode: bookingData.mode
    });

    // Show instant confirmation inside modal
    const modalBody = document.querySelector('.modal-body');
    const modalFooter = document.querySelector('.modal-footer');
    if (modalFooter) modalFooter.style.display = 'none';

    modalBody.innerHTML = `
      <div style="text-align: center; padding: 20px 10px;">
        <div style="width: 64px; height: 64px; background: #dcfce7; color: #166534; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin: 0 auto 20px;">✓</div>
        <h3 style="color: #0b223d; font-size: 1.5rem; margin-bottom: 10px;">Appointment Request Received!</h3>
        <p style="color: #475569; font-size: 0.95rem; margin-bottom: 24px;">
          Thank you, <strong>${bookingData.fullName}</strong>. Your consultation details have been registered for <strong>${bookingData.mode}</strong> on <strong>${bookingData.date}</strong> (${bookingData.timeSlot}).
        </p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 24px; text-align: left; font-size: 0.9rem;">
          <div style="margin-bottom: 6px;"><strong>Hospital:</strong> Rajshree Apollo Hospitals, Vijay Nagar, Indore</div>
          <div style="margin-bottom: 6px;"><strong>Consultant:</strong> Dr. Saurabh Chipde (Senior Urologist)</div>
          <div><strong>Clinic Hotline:</strong> +91 78693 92498</div>
        </div>

        <a href="${waUrl}" target="_blank" class="btn btn-whatsapp btn-lg" style="width: 100%; margin-bottom: 12px;">
          <i class="fa fa-whatsapp"></i> Send Details on WhatsApp for Instant Confirmation
        </a>
        <button type="button" class="btn btn-secondary" onclick="location.reload();" style="width: 100%;">
          Close Window
        </button>
      </div>
    `;
  }
}

/* ---------------- 2. Interactive Symptom & Condition Filter ---------------- */
function initSymptomFilter() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.symptom-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterCategory = btn.getAttribute('data-filter');

      cards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        if (filterCategory === 'all' || cardCategory === filterCategory) {
          card.style.display = 'flex';
          card.style.animation = 'fadeIn 0.3s ease forwards';
        } else {
          card.style.display = 'none';
        }
      });

      trackGAEvent('symptom_filter_click', { category: filterCategory });
    });
  });
}

/* ---------------- 3. Interactive FAQ Accordion ---------------- */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    questionBtn.addEventListener('click', () => {
      const isOpen = item.classList.contains('active');
      // Close all others
      faqItems.forEach(i => i.classList.remove('active'));
      if (!isOpen) {
        item.classList.add('active');
      }
    });
  });
}

/* ---------------- 4. Mobile Menu & Navigation Dropdowns ---------------- */
function initMobileMenu() {
  const toggleBtn = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (toggleBtn && navLinks) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navLinks.classList.toggle('open');
    });

    // Handle mobile dropdown toggling
    const dropdownToggles = document.querySelectorAll('.nav-dropdown-toggle');
    dropdownToggles.forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        if (window.innerWidth <= 900) {
          e.preventDefault();
          e.stopPropagation();
          const parentItem = toggle.closest('.nav-item-dropdown');
          if (parentItem) {
            parentItem.classList.toggle('open');
          }
        }
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.nav-container')) {
        navLinks.classList.remove('open');
        document.querySelectorAll('.nav-item-dropdown').forEach(d => d.classList.remove('open'));
      }
    });

    // Close menu when regular links are clicked
    navLinks.querySelectorAll('a:not(.nav-dropdown-toggle)').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 900) {
          navLinks.classList.remove('open');
        }
      });
    });
  }
}

/* ---------------- 5. Short Appointment Enquiry Form ---------------- */
function initEnquiryForm() {
  const form = document.getElementById('enquiryForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Honeypot spam protection
    const honeypot = document.getElementById('formWebsite');
    if (honeypot && honeypot.value.trim() !== '') {
      console.warn('Spam detected via honeypot field.');
      return;
    }

    const name = (document.getElementById('enquiryName')?.value || '').trim();
    const phone = (document.getElementById('enquiryPhone')?.value || '').replace(/\D/g, '');
    const date = document.getElementById('enquiryDate')?.value || 'Earliest available';
    const concern = document.getElementById('enquiryConcern')?.value || 'General Urology Consultation';
    const message = (document.getElementById('enquiryMessage')?.value || '').trim();

    if (!name || phone.length < 10) {
      alert('Please enter your full name and a valid 10-digit mobile number.');
      return;
    }

    // Hide form elements and display success message with explicit non-instant confirmation notice
    const formFields = document.getElementById('enquiryFormFields');
    const successBox = document.getElementById('enquirySuccessMessage');
    const waDirectBtn = document.getElementById('enquiryWaDirectBtn');

    const waMsg = `Hello Dr. Chipde's team, I would like to book a consultation. Please share the available appointment slots.
Name: ${name}
Phone: ${phone}
Preferred Date: ${date}
Concern: ${concern}${message ? `\nDetails: ${message}` : ''}`;

    const waUrl = `https://wa.me/917869392498?text=${encodeURIComponent(waMsg)}`;

    if (formFields) formFields.style.display = 'none';
    if (successBox) {
      successBox.style.display = 'block';
      if (waDirectBtn) waDirectBtn.href = waUrl;
    }

    trackGAEvent('short_enquiry_submitted', { concern: concern });
  });
}

/* ---------------- 5. Instagram Reels Modal Preview ---------------- */
function initReelsViewer() {
  const reelCards = document.querySelectorAll('.reel-card');
  const reelModal = document.getElementById('reelModal');

  if (!reelModal) return;

  const modalTitle = document.getElementById('reelModalTitle');
  const modalDesc = document.getElementById('reelModalDesc');
  const modalLink = document.getElementById('reelModalLink');
  const closeBtn = document.getElementById('closeReelModal');

  reelCards.forEach(card => {
    card.addEventListener('click', (e) => {
      // Don't override direct link if clicked specifically
      if (e.target.closest('a')) return;

      const title = card.getAttribute('data-reel-title');
      const desc = card.getAttribute('data-reel-desc');
      const link = card.getAttribute('data-reel-link');

      modalTitle.textContent = title;
      modalDesc.textContent = desc;
      modalLink.href = link;

      reelModal.classList.add('active');
      document.body.style.overflow = 'hidden';

      trackGAEvent('reel_preview_click', { title: title });
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      reelModal.classList.remove('active');
      document.body.style.overflow = '';
    });
  }

  reelModal.addEventListener('click', (e) => {
    if (e.target === reelModal) {
      reelModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
}

/* ---------------- 6. Clean GA4 Analytics Safe Tracker ---------------- */
function initGA4Tracking() {
  document.querySelectorAll('[data-track]').forEach(el => {
    el.addEventListener('click', () => {
      const eventName = el.getAttribute('data-track');
      const eventCategory = el.getAttribute('data-category') || 'general';
      trackGAEvent(eventName, { category: eventCategory });
    });
  });
}

function trackGAEvent(eventName, params = {}) {
  if (typeof gtag === 'function') {
    gtag('event', eventName, params);
  } else {
    console.log(`[GA4 Track Event]: ${eventName}`, params);
  }
}
