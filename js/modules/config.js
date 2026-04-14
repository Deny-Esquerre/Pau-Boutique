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

    // Banner Elements
    const bImg = document.getElementById('banner-img');
    const bSubtitle = document.getElementById('banner-subtitle');
    const bTitle = document.getElementById('banner-title');
    const bDesc = document.getElementById('banner-desc');
    const bBtn = document.getElementById('banner-btn');
    const bContainer = document.getElementById('banner-container');

    if (config) {
      // ... (existing code for announcement)

      // Apply Hero Dynamic Content
      // ... (existing code)

      // Apply Banner Dynamic Content
      if (bImg && config.bannerImage) {
        bImg.src = config.bannerImage;
        bImg.onload = () => bImg.style.opacity = "1";
      }
      if (bSubtitle && config.bannerSubtitle) bSubtitle.textContent = config.bannerSubtitle;
      if (bTitle && config.bannerTitle) bTitle.textContent = config.bannerTitle;
      if (bDesc && config.bannerDesc) bDesc.textContent = config.bannerDesc;
      if (bBtn && config.bannerBtnText) bBtn.textContent = config.bannerBtnText;
      if (bContainer) bContainer.style.opacity = "1";
    }
  }
}
