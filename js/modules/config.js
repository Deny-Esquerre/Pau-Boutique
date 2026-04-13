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
    return false;
  }
}

/**
 * Applies configuration to the DOM (for storefront)
 */
export async function applyConfig() {
  const config = await fetchConfig();
  if (config && config.announcement) {
    const announcementEl = document.getElementById('announcement-text');
    if (announcementEl) {
      announcementEl.textContent = config.announcement;
    }
  }
}
