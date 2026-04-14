/* --- Configuration & Global Settings Module --- */
import { db } from '../firebase-config.js';
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

const CONFIG_PATH = doc(db, 'settings', 'general');

/**
 * Fetches global configuration from Firestore
 * Returns default values if document doesn't exist
 */
export async function fetchConfig() {
  try {
    const docSnap = await getDoc(CONFIG_PATH);
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      console.log("Config document not found, using defaults.");
      return { announcement: "ENVÍO GRATIS EN COMPRAS MAYORES A S/. 200 • NUEVA COLECCIÓN OTOÑO 2026" };
    }
  } catch (error) {
    console.error("Error fetching config:", error);
    return null;
  }
}

/**
 * Updates global configuration in Firestore
 */
export async function updateConfig(data) {
  try {
    await setDoc(CONFIG_PATH, data, { merge: true });
    return true;
  } catch (error) {
    console.error("Error updating config:", error);
    throw error; // Lanzar el error para que admin.js lo capture y muestre
  }
}

/**
 * Applies configuration to the DOM (for storefront)
 */
export async function applyConfig() {
  const config = await fetchConfig();
  const announcementBar = document.querySelector('.announcement-bar');
  const announcementEl = document.getElementById('announcement-text');
  
  // Hero Elements
  const heroImg = document.getElementById('hero-img');
  const heroSubtitle = document.getElementById('hero-subtitle');
  const heroTitle = document.getElementById('hero-title');
  const heroBtn = document.getElementById('hero-btn');

  if (config) {
    // Show/Hide bar based on active status
    if (announcementBar) {
      announcementBar.style.display = config.announcementActive !== false ? 'block' : 'none';
    }
    
    // Set text
    if (config.announcement && announcementEl) {
      announcementEl.textContent = config.announcement;
    }

    // Apply Hero Dynamic Content
    if (heroImg && config.heroImage) {
      heroImg.src = config.heroImage;
      heroImg.onload = () => heroImg.style.opacity = "1";
    }
    if (heroSubtitle && config.heroSubtitle) {
      heroSubtitle.textContent = config.heroSubtitle;
    }
    if (heroTitle && config.heroTitle) {
      heroTitle.innerHTML = config.heroTitle;
    }
    if (heroBtn && config.heroBtnText) {
      heroBtn.textContent = config.heroBtnText;
    }

    // Show Hero Content Container
    const heroContainer = document.getElementById('hero-container');
    if (heroContainer) heroContainer.style.opacity = "1";
  }
}
