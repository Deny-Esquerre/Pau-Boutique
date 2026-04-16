/* ===================================================
   ADMIN CONFIGURATION MODULE
   =================================================== */

import { db, CLOUDINARY_CONFIG } from '../../firebase-config.js';
import { showToast } from '../utils.js';
import { fetchConfig, updateConfig } from '../config.js';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

export function initConfig() {
  initConfigNavigation();
  loadConfigData();
  
  // Announcement
  const configForm = document.getElementById('config-form');
  const configAnnouncementInput = document.getElementById('config-announcement');
  if (configForm) configForm.onsubmit = handleConfigSubmit;
  if (configAnnouncementInput) configAnnouncementInput.oninput = (e) => {
    const prev = document.getElementById('announcement-preview');
    if (prev) prev.textContent = e.target.value;
  };

  // Hero
  const heroForm = document.getElementById('hero-config-form');
  const heroImageInput = document.getElementById('hero-image-input');
  if (heroForm) heroForm.onsubmit = handleHeroSubmit;
  if (heroImageInput) heroImageInput.onchange = handleHeroImageUpload;
  ['config-hero-image', 'config-hero-subtitle', 'config-hero-title', 'config-hero-btn-text'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.oninput = updateHeroPreview;
  });

  // Banner
  const bannerForm = document.getElementById('banner-config-form');
  const bannerImageInput = document.getElementById('banner-image-input');
  if (bannerForm) bannerForm.onsubmit = handleBannerSubmit;
  if (bannerImageInput) bannerImageInput.onchange = handleBannerImageUpload;
  ['config-banner-image', 'config-banner-image-active', 'config-banner-subtitle', 'config-banner-title', 'config-banner-desc', 'config-banner-btn-text'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.oninput = updateBannerPreview;
      if (el.type === 'checkbox') el.onchange = updateBannerPreview;
    }
  });

  // Instagram
  const instagramForm = document.getElementById('instagram-config-form');
  if (instagramForm) instagramForm.onsubmit = handleInstagramSubmit;
  for (let i = 1; i <= 5; i++) {
    const file = document.getElementById(`insta-file-${i}`);
    if (file) file.onchange = (e) => handleInstaUpload(e, i - 1);
  }

  // Testimonials & Collections
  const testimonialForm = document.getElementById('testimonial-form');
  if (testimonialForm) testimonialForm.onsubmit = handleTestimonialSubmit;
  const newColForm = document.getElementById('new-collection-form');
  if (newColForm) newColForm.onsubmit = handleNewCollectionSubmit;
  const colFileInput = document.getElementById('col-file-input');
  if (colFileInput) colFileInput.onchange = handleColFileUpload;
}

async function loadConfigData() {
  const config = await fetchConfig();
  if (!config) return;

  const mapping = {
    'config-announcement': config.announcement,
    'announcement-preview': config.announcement,
    'config-announcement-active': config.announcementActive !== false,
    'config-hero-image': config.heroImage,
    'config-hero-subtitle': config.heroSubtitle,
    'config-hero-title': config.heroTitle,
    'config-hero-btn-text': config.heroBtnText,
    'config-banner-image': config.bannerImage,
    'config-banner-image-active': config.bannerImageActive !== false,
    'config-banner-subtitle': config.bannerSubtitle,
    'config-banner-title': config.bannerTitle,
    'config-banner-desc': config.bannerDesc,
    'config-banner-btn-text': config.bannerBtnText,
    'config-insta-handle': config.instaHandle || '@pauboutique.p'
  };

  Object.entries(mapping).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) {
      if (el.type === 'checkbox') el.checked = val;
      else if (el.tagName === 'SPAN') el.textContent = val;
      else el.value = val;
    }
  });

  for (let i = 1; i <= 5; i++) {
    const url = config[`instaImage${i}`];
    const input = document.getElementById(`config-insta-img-${i}`);
    const prev = document.getElementById(`insta-prev-${i}`);
    const icon = document.getElementById(`insta-icon-${i}`);
    if (url) {
      if (input) input.value = url;
      if (prev) { prev.src = url; prev.style.display = 'block'; }
      if (icon) icon.style.display = 'none';
    }
  }

  updateHeroPreview(); updateBannerPreview();
  loadCollectionsAdmin(); loadTestimonialsAdmin();
}

// Logic for Hero, Banner, Instagram Feed... (similar to previous version but modularized)
async function handleConfigSubmit(e) {
  e.preventDefault();
  const success = await updateConfig({
    announcement: document.getElementById('config-announcement').value.trim(),
    announcementActive: document.getElementById('config-announcement-active').checked,
    updatedAt: new Date()
  });
  if (success) showToast("¡Barra de anuncios actualizada!");
}

async function handleHeroSubmit(e) {
  e.preventDefault();
  const success = await updateConfig({
    heroImage: document.getElementById('config-hero-image').value.trim(),
    heroSubtitle: document.getElementById('config-hero-subtitle').value.trim(),
    heroTitle: document.getElementById('config-hero-title').value.trim(),
    heroBtnText: document.getElementById('config-hero-btn-text').value.trim(),
    updatedAt: new Date()
  });
  if (success) showToast("¡Hero Principal actualizado!");
}

async function handleHeroImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('file', file); formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`, { method: 'POST', body: formData });
    const result = await response.json();
    if (result.secure_url) {
      document.getElementById('config-hero-image').value = result.secure_url;
      updateHeroPreview();
      showToast("Imagen del Hero actualizada");
    }
  } catch (error) { showToast("Error al subir", "error"); }
}

function updateHeroPreview() {
  const preview = document.getElementById('hero-admin-preview');
  if (!preview) return;
  const img = document.getElementById('config-hero-image')?.value;
  preview.style.backgroundImage = img ? `url(${img})` : 'none';
  const subtitle = document.getElementById('hero-preview-subtitle');
  if (subtitle) subtitle.textContent = document.getElementById('config-hero-subtitle')?.value || '';
  const title = document.getElementById('hero-preview-title');
  if (title) title.innerHTML = document.getElementById('config-hero-title')?.value || '';
  const btn = document.getElementById('hero-preview-btn');
  if (btn) btn.textContent = document.getElementById('config-hero-btn-text')?.value || '';
}

function updateBannerPreview() {
  const preview = document.getElementById('banner-admin-preview');
  if (!preview) return;
  const active = document.getElementById('config-banner-image-active')?.checked;
  const img = document.getElementById('config-banner-image')?.value;
  preview.style.backgroundImage = (active && img) ? `url(${img})` : 'none';
  const subtitle = document.getElementById('banner-preview-subtitle');
  if (subtitle) subtitle.textContent = document.getElementById('config-banner-subtitle')?.value || '';
  const title = document.getElementById('banner-preview-title');
  if (title) title.textContent = document.getElementById('config-banner-title')?.value || '';
  const desc = document.getElementById('banner-preview-desc');
  if (desc) desc.textContent = document.getElementById('config-banner-desc')?.value || '';
  const btn = document.getElementById('banner-preview-btn');
  if (btn) btn.textContent = document.getElementById('config-banner-btn-text')?.value || '';
}

async function handleBannerSubmit(e) {
  e.preventDefault();
  const success = await updateConfig({
    bannerImage: document.getElementById('config-banner-image').value.trim(),
    bannerImageActive: document.getElementById('config-banner-image-active').checked,
    bannerSubtitle: document.getElementById('config-banner-subtitle').value.trim(),
    bannerTitle: document.getElementById('config-banner-title').value.trim(),
    bannerDesc: document.getElementById('config-banner-desc').value.trim(),
    bannerBtnText: document.getElementById('config-banner-btn-text').value.trim(),
    updatedAt: new Date()
  });
  if (success) showToast("¡Banner Principal actualizado!");
}

async function handleBannerImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('file', file); formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`, { method: 'POST', body: formData });
    const result = await response.json();
    if (result.secure_url) {
      document.getElementById('config-banner-image').value = result.secure_url;
      updateBannerPreview();
      showToast("Imagen del banner cargada");
    }
  } catch (error) { showToast("Error al subir", "error"); }
}

async function handleInstagramSubmit(e) {
  e.preventDefault();
  const updateData = { instaHandle: document.getElementById('config-insta-handle').value.trim(), updatedAt: new Date() };
  for (let i = 1; i <= 5; i++) {
    updateData[`instaImage${i}`] = document.getElementById(`config-insta-img-${i}`).value;
  }
  const success = await updateConfig(updateData);
  if (success) showToast("¡Instagram actualizado!");
}

async function handleInstaUpload(e, index) {
  const file = e.target.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('file', file); formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`, { method: 'POST', body: formData });
    const result = await response.json();
    if (result.secure_url) {
      document.getElementById(`config-insta-img-${index + 1}`).value = result.secure_url;
      const prev = document.getElementById(`insta-prev-${index + 1}`);
      if (prev) { prev.src = result.secure_url; prev.style.display = 'block'; }
      const icon = document.getElementById(`insta-icon-${index + 1}`);
      if (icon) icon.style.display = 'none';
      showToast(`¡Imagen ${index + 1} cargada!`);
    }
  } catch (error) { showToast("Error al subir", "error"); }
}

async function handleTestimonialSubmit(e) {
  e.preventDefault();
  try {
    await addDoc(collection(db, "testimonials"), {
      author: document.getElementById('t-author').value.trim(),
      quote: document.getElementById('t-quote').value.trim(),
      createdAt: new Date()
    });
    showToast("¡Testimonio publicado!");
    e.target.reset();
    loadTestimonialsAdmin();
  } catch (error) { showToast("Error: " + error.message, "error"); }
}

async function handleNewCollectionSubmit(e) {
  e.preventDefault();
  const img = document.getElementById('col-image').value;
  if (!img) { showToast("Sube una imagen primero", "error"); return; }
  try {
    await addDoc(collection(db, "categories_landing"), {
      name: document.getElementById('col-name').value.trim(),
      image: img,
      createdAt: new Date()
    });
    showToast("¡Colección añadida!");
    e.target.reset();
    loadCollectionsAdmin();
  } catch (error) { showToast("Error: " + error.message, "error"); }
}

async function handleColFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('file', file); formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`, { method: 'POST', body: formData });
    const result = await response.json();
    if (result.secure_url) {
      document.getElementById('col-image').value = result.secure_url;
      showToast("Imagen cargada");
    }
  } catch (error) { showToast("Error al subir", "error"); }
}

async function loadTestimonialsAdmin() {
  const list = document.getElementById('testimonials-admin-list');
  if (!list) return;
  try {
    const q = query(collection(db, "testimonials"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    list.innerHTML = '';
    snap.forEach((docSnap) => {
      const t = docSnap.data();
      const item = document.createElement('div');
      item.style.padding = "10px"; item.style.border = "1px solid #eee"; item.style.marginBottom = "10px";
      item.innerHTML = `<p>"${t.quote}"</p> <span>— ${t.author}</span> <button class="btn-delete-t" data-id="${docSnap.id}">&times;</button>`;
      list.appendChild(item);
    });
    document.querySelectorAll('.btn-delete-t').forEach(btn => {
      btn.onclick = async () => {
        if (confirm("¿Eliminar testimonio?")) {
          try { await deleteDoc(doc(db, "testimonials", btn.dataset.id)); loadTestimonialsAdmin(); } catch (e) { showToast(e.message, "error"); }
        }
      };
    });
  } catch (e) { console.error(e); }
}

async function loadCollectionsAdmin() {
  const list = document.getElementById('collections-admin-list');
  if (!list) return;
  try {
    const snap = await getDocs(collection(db, "categories_landing"));
    list.innerHTML = '';
    snap.forEach((docSnap) => {
      const col = docSnap.data();
      const card = document.createElement('div');
      card.style.padding = "10px"; card.style.border = "1px solid #eee";
      card.innerHTML = `<img src="${col.image}" style="width: 100px;"> <h4>${col.name}</h4> <button class="btn-delete-col" data-id="${docSnap.id}">Eliminar</button>`;
      list.appendChild(card);
    });
    document.querySelectorAll('.btn-delete-col').forEach(btn => {
      btn.onclick = async () => {
        if (confirm("¿Eliminar colección?")) {
          try { await deleteDoc(doc(db, "categories_landing", btn.dataset.id)); loadCollectionsAdmin(); } catch (e) { showToast(e.message, "error"); }
        }
      };
    });
  } catch (e) { console.error(e); }
}

function initConfigNavigation() {
  const btns = document.querySelectorAll('.config-nav-btn');
  const subs = document.querySelectorAll('.sub-module');
  btns.forEach(btn => {
    btn.onclick = () => {
      const subId = btn.getAttribute('data-sub');
      btns.forEach(b => b.classList.remove('active'));
      subs.forEach(m => { m.classList.remove('active'); m.style.display = 'none'; });
      btn.classList.add('active');
      const target = document.getElementById(`sub-mod-${subId}`);
      if (target) { target.classList.add('active'); target.style.display = 'block'; }
      if (typeof lucide !== 'undefined') lucide.createIcons();
    };
  });
}
