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
      return { 
        announcement: "ENVÍO GRATIS EN COMPRAS MAYORES A S/. 200 • NUEVA COLECCIÓN OTOÑO 2026",
        announcementActive: true
      };
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
    throw error;
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
  const heroContainer = document.getElementById('hero-container');

  // Banner Elements
  const bImg = document.getElementById('banner-img');
  const bSubtitle = document.getElementById('banner-subtitle');
  const bTitle = document.getElementById('banner-title');
  const bDesc = document.getElementById('banner-desc');
  const bBtn = document.getElementById('banner-btn');
  const bContainer = document.getElementById('banner-container');

  if (config) {
    // Announcement Bar
    if (announcementBar) {
      announcementBar.style.display = config.announcementActive !== false ? 'block' : 'none';
    }
    if (config.announcement && announcementEl) {
      announcementEl.textContent = config.announcement;
    }

    // Hero Dynamic Content
    if (heroImg && config.heroImage) heroImg.src = config.heroImage;
    if (heroSubtitle && config.heroSubtitle) heroSubtitle.textContent = config.heroSubtitle;
    if (heroTitle && config.heroTitle) heroTitle.innerHTML = config.heroTitle;
    if (heroBtn && config.heroBtnText) heroBtn.textContent = config.heroBtnText;
    if (heroContainer) heroContainer.style.opacity = "1";
    if (heroImg) heroImg.style.opacity = "1";

    // Banner Dynamic Content
    if (bImg && config.bannerImage) {
      bImg.src = config.bannerImage;
      bImg.style.opacity = config.bannerImageActive !== false ? "1" : "0";
    }
    if (bSubtitle && config.bannerSubtitle) bSubtitle.textContent = config.bannerSubtitle;
    if (bTitle && config.bannerTitle) bTitle.textContent = config.bannerTitle;
    if (bDesc && config.bannerDesc) bDesc.textContent = config.bannerDesc;
    if (bBtn && config.bannerBtnText) bBtn.textContent = config.bannerBtnText;
    if (bContainer) bContainer.style.opacity = "1";
    if (bImg && config.bannerImageActive === false) bImg.style.opacity = "0";
    else if (bImg && config.bannerImage) bImg.style.opacity = "1";
  } else {
    // Si falla la carga, mostrar los elementos de todos modos
    if (heroContainer) heroContainer.style.opacity = "1";
    if (heroImg) heroImg.style.opacity = "1";
    if (bContainer) bContainer.style.opacity = "1";
    if (bImg) bImg.style.opacity = "1";
  }
}
