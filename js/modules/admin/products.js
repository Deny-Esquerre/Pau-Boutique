/* ===================================================
   ADMIN PRODUCTS MODULE
   =================================================== */

import { db, CLOUDINARY_CONFIG } from '../../firebase-config.js';
import { showToast } from '../utils.js';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

let uploadedImages = [];

export function initProducts() {
  const productForm = document.getElementById('product-form');
  const manageCatsBtn = document.getElementById('manage-cats-btn');
  const closeCatManager = document.getElementById('close-cat-manager');
  const catManagerPanel = document.getElementById('cat-manager-panel');
  const saveCatBtn = document.getElementById('save-new-cat');
  const imagesInput = document.getElementById('p-images-input');
  const dropzone = document.getElementById('dropzone');

  if (productForm) productForm.onsubmit = handleProductSubmit;
  if (manageCatsBtn) manageCatsBtn.onclick = () => catManagerPanel.style.display = 'block';
  if (closeCatManager) closeCatManager.onclick = () => catManagerPanel.style.display = 'none';
  if (saveCatBtn) saveCatBtn.onclick = handleSaveCat;
  if (imagesInput) imagesInput.onchange = (e) => handleFiles(e.target.files);
  if (dropzone) initDropzone(dropzone);

  loadCategories();
}

async function handleSaveCat() {
  const newCatInput = document.getElementById('new-cat-name');
  const name = newCatInput.value.trim();
  if (!name) return;
  try {
    await addDoc(collection(db, "categories"), { name: name });
    newCatInput.value = '';
    showToast("¡Categoría añadida!");
    loadCategories();
  } catch (error) { showToast("Error: " + error.message, "error"); }
}

async function handleProductSubmit(e) {
  e.preventDefault();
  const productForm = e.target;
  if (uploadedImages.length === 0) {
    if (!confirm("No has subido ninguna imagen. ¿Deseas crear el producto con una imagen por defecto?")) return;
  }
  
  const productData = {
    name: document.getElementById('p-name').value.trim(),
    price: parseFloat(document.getElementById('p-price').value),
    description: document.getElementById('p-desc').value.trim(),
    category: document.getElementById('p-category').value,
    badge: document.getElementById('p-badge').value.trim(),
    images: uploadedImages.length > 0 ? uploadedImages : ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80'],
    createdAt: new Date()
  };
  
  try {
    await addDoc(collection(db, "products"), productData);
    showToast("¡Pieza añadida!");
    productForm.reset();
    uploadedImages = [];
    renderPreviews();
  } catch (error) { showToast("Error: " + error.message, 'error'); }
}

export async function loadCategories() {
  const pCategorySelect = document.getElementById('p-category');
  const catListAdmin = document.getElementById('cat-list-admin');
  if (!pCategorySelect || !catListAdmin) return;

  try {
    const q = query(collection(db, "categories"), orderBy("name", "asc"));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      const defaults = ["Vestidos", "Abrigos", "Accesorios"];
      for (const cat of defaults) await addDoc(collection(db, "categories"), { name: cat });
      return loadCategories();
    }
    pCategorySelect.innerHTML = ''; catListAdmin.innerHTML = '';
    querySnapshot.forEach((docSnap) => {
      const cat = docSnap.data();
      const option = document.createElement('option');
      option.value = cat.name.toLowerCase(); option.textContent = cat.name;
      pCategorySelect.appendChild(option);
      const chip = document.createElement('div');
      chip.className = "cat-chip";
      chip.innerHTML = `<span>${cat.name}</span><button type="button" class="del-cat" data-id="${docSnap.id}">&times;</button>`;
      catListAdmin.appendChild(chip);
    });
    document.querySelectorAll('.del-cat').forEach(btn => {
      btn.onclick = async () => {
        if (confirm("¿Eliminar categoría?")) {
          try { await deleteDoc(doc(db, "categories", btn.dataset.id)); loadCategories(); }
          catch (e) { showToast("Error: " + e.message, "error"); }
        }
      };
    });
  } catch (e) { console.error(e); }
}

async function handleFiles(files) {
  if (uploadedImages.length + files.length > 3) { showToast("Máximo 3 imágenes", "error"); return; }
  for (const file of files) {
    const formData = new FormData();
    formData.append('file', file); formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`, { method: 'POST', body: formData });
      const result = await response.json();
      if (result.secure_url) { uploadedImages.push(result.secure_url); renderPreviews(); }
    } catch (e) { showToast("Error subida", "error"); }
  }
}

function renderPreviews() {
  const imagePreview = document.getElementById('image-preview');
  if (!imagePreview) return;
  imagePreview.innerHTML = "";
  uploadedImages.forEach((url, index) => {
    const item = document.createElement('div');
    item.className = "preview-item";
    item.innerHTML = `<img src="${url}"><button type="button" class="remove-img" data-index="${index}">&times;</button>`;
    item.querySelector('.remove-img').onclick = () => { uploadedImages.splice(index, 1); renderPreviews(); };
    imagePreview.appendChild(item);
  });
}

function initDropzone(dropzone) {
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(e => dropzone.addEventListener(e, (evt) => { evt.preventDefault(); evt.stopPropagation(); }));
  dropzone.addEventListener('drop', (e) => handleFiles(e.dataTransfer.files));
}
