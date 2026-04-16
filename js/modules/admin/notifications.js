/* ===================================================
   ADMIN NOTIFICATIONS MODULE
   =================================================== */

import { db } from '../../firebase-config.js';
import { showToast } from '../utils.js';
import { collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

export async function initNotifications() {
  const notificationForm = document.getElementById('notification-form');
  if (notificationForm) notificationForm.onsubmit = handleNotificationSubmit;
  
  loadSubscribersCount();
  loadNotificationsHistory();
}

async function handleNotificationSubmit(e) {
  e.preventDefault();
  const title = document.getElementById('notif-title').value.trim();
  const body = document.getElementById('notif-body').value.trim();
  const image = document.getElementById('notif-image').value.trim();
  
  try {
    const notifData = { title, body, image, sentAt: new Date(), status: 'sent' };
    await addDoc(collection(db, "notifications_history"), notifData);
    showToast("¡Notificación enviada!");
    e.target.reset();
    loadNotificationsHistory();
  } catch (error) { showToast(`Error: ${error.message}`, "error"); }
}

async function loadSubscribersCount() {
  const statSubscribers = document.getElementById('stat-subscribers');
  if (!statSubscribers) return;
  try {
    const snap = await getDocs(collection(db, "fcm_tokens"));
    statSubscribers.textContent = snap.size;
  } catch (e) { console.error(e); }
}

async function loadNotificationsHistory() {
  const notifHistoryList = document.getElementById('notifications-history-list');
  const statTotalNotifications = document.getElementById('stat-total-notifications');
  if (!notifHistoryList) return;

  try {
    const q = query(collection(db, "notifications_history"), orderBy("sentAt", "desc"));
    const snap = await getDocs(q);
    notifHistoryList.innerHTML = '';
    if (statTotalNotifications) statTotalNotifications.textContent = snap.size;
    snap.forEach(d => {
      const n = d.data();
      const div = document.createElement('div');
      div.style.padding = "10px"; div.style.borderBottom = "1px solid #eee";
      div.innerHTML = `<p>${n.title}</p> <small>${n.body}</small>`;
      notifHistoryList.appendChild(div);
    });
  } catch (e) { console.error(e); }
}
