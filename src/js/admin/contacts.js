// =============================================================
// admin/contacts.js — Contacts admin: local / cloud / mission alerts
// =============================================================
import { lsGet } from '../utils/helpers.js';
import { db } from '../supabase/client.js';
import { formatSupabaseError } from '../utils/helpers.js';
import { showToast } from '../components/ui.js';

// Render the contacts admin section (three tabs)
export function renderAdminContacts() {
  return `
  <div class="adm-toolbar">
    <div style="display:flex;gap:8px;align-items:center">
      <button class="adm-btn" onclick="adminShowContactsTab('local')">Local Contacts</button>
      <button class="adm-btn" onclick="adminShowContactsTab('cloud')">Cloud Contacts</button>
      <button class="adm-btn" onclick="adminShowContactsTab('alerts')">Mission Alerts</button>
    </div>
  </div>
  <div class="adm-section-box" style="padding:12px;overflow:auto">
    <div id="contactsLocal" style="display:block">
      <h3>Local Contacts</h3>
      <div id="contactsLocalList"></div>
    </div>
    <div id="contactsCloud" style="display:none">
      <h3>Cloud Contacts</h3>
      <div id="contactsCloudControls" style="margin-bottom:8px">
        <button class="adm-btn" onclick="adminReloadCloudContacts()">Refresh</button>
        <span id="contactsCloudStatus" style="margin-left:12px;color:var(--adm-text3)"></span>
      </div>
      <div id="contactsCloudList"></div>
    </div>
    <div id="contactsAlerts" style="display:none">
      <h3>Mission Alerts</h3>
      <div id="contactsAlertsList">No alerts configured.</div>
    </div>
  </div>`;
}

// Tab switching (exposed globally)
export function mountAdminContacts() {
  // populate local
  const locals = lsGet('mkt_local_contacts') || [];
  const localList = document.getElementById('contactsLocalList');
  if (localList) {
    if (locals.length === 0) localList.innerHTML = '<div style="color:var(--adm-text3)">No local contacts</div>';
    else localList.innerHTML = locals.map(c => `
      <div class="adm-row" style="padding:8px;margin-bottom:8px;border-bottom:1px solid var(--adm-border)">
        <strong>${c.name}</strong> — <small>${c.email}</small>
        <div style="margin-top:6px">${c.message}</div>
      </div>
    `).join('');
  }
}

// Fetch cloud contacts from Supabase
export async function fetchContactRequestsRemote() {
  const statusEl = document.getElementById('contactsCloudStatus');
  if (statusEl) statusEl.textContent = 'Loading…';
  try {
    const { data, error } = await db.from('contact_requests').select('*').order('created_at', { ascending: false });
    if (error) {
      const msg = formatSupabaseError(error);
      if (statusEl) statusEl.textContent = 'Error';
      throw new Error(msg);
    }
    if (statusEl) statusEl.textContent = `Loaded ${data.length} records`;
    // normalize: ensure fields exist
    return data.map(r => ({ id: r.id, name: r.name || '', email: r.email || '', message: r.message || '', status: r.status || 'pending', created_at: r.created_at }));
  } catch (err) {
    if (statusEl) statusEl.textContent = '';
    showToast('Cloud contacts error', err.message || err, 'error');
    return [];
  }
}

// Update status remote
export async function updateContactRequestStatusRemote(id, status) {
  const el = document.getElementById(`contact_row_${id}`);
  if (el) el.classList.add('loading');
  try {
    const { data, error } = await db.from('contact_requests').update({ status }).eq('id', id);
    if (error) {
      const msg = formatSupabaseError(error);
      showToast('Update failed', msg, 'error');
      throw new Error(msg);
    }
    // Success
    if (el) {
      el.querySelector('.contact-status') && (el.querySelector('.contact-status').textContent = status);
      el.classList.remove('loading');
    }
    showToast('Оновлено', `Request ${id} marked ${status}`, 'info');
    return { data };
  } catch (err) {
    if (el) el.classList.remove('loading');
    return { error: err };
  }
}

// Render cloud list and attach handlers
export async function adminReloadCloudContacts() {
  const listEl = document.getElementById('contactsCloudList');
  if (!listEl) return;
  listEl.innerHTML = '<div style="color:var(--adm-text3)">Loading…</div>';
  const rows = await fetchContactRequestsRemote();
  if (rows.length === 0) { listEl.innerHTML = '<div style="color:var(--adm-text3)">No cloud contacts</div>'; return; }
  listEl.innerHTML = rows.map(r => `
    <div id="contact_row_${r.id}" class="adm-row" style="padding:8px;margin-bottom:8px;border-bottom:1px solid var(--adm-border)">
      <div><strong>${r.name}</strong> — <small>${r.email}</small></div>
      <div style="margin-top:6px">${r.message}</div>
      <div style="margin-top:8px;display:flex;gap:8px;align-items:center">
        <div class="contact-status" style="min-width:90px">${r.status}</div>
        <button class="adm-btn" data-id="${r.id}" data-status="replied" onclick="adminChangeContactStatus(${r.id}, 'replied')">Mark replied</button>
        <button class="adm-btn" data-id="${r.id}" data-status="closed" onclick="adminChangeContactStatus(${r.id}, 'closed')">Close</button>
      </div>
      <div style="font-size:12px;color:var(--adm-text3);margin-top:6px">${r.created_at || ''}</div>
    </div>
  `).join('');
}

// Global handlers
window.adminShowContactsTab = function (tab) {
  document.getElementById('contactsLocal')?.style && (document.getElementById('contactsLocal').style.display = tab === 'local' ? 'block' : 'none');
  document.getElementById('contactsCloud')?.style && (document.getElementById('contactsCloud').style.display = tab === 'cloud' ? 'block' : 'none');
  document.getElementById('contactsAlerts')?.style && (document.getElementById('contactsAlerts').style.display = tab === 'alerts' ? 'block' : 'none');
  if (tab === 'cloud') adminReloadCloudContacts();
};

window.adminReloadCloudContacts = adminReloadCloudContacts;
window.adminChangeContactStatus = function (id, status) {
  const btns = Array.from(document.querySelectorAll(`#contact_row_${id} button`));
  btns.forEach(b => b.disabled = true);
  updateContactRequestStatusRemote(id, status).then(res => { btns.forEach(b => b.disabled = false); if (res.error) console.error(res.error); else adminReloadCloudContacts(); });
};

// Auto-mount when the section is shown (renderAdminSection calls innerHTML then this should be invoked)
window.mountAdminContacts = mountAdminContacts;
