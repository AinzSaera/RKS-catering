(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const cfg = window.RKS_CONFIG || {};
  const configured = /^https:\/\/[^/]+\.supabase\.co$/.test(cfg.SUPABASE_URL || "") &&
    !!cfg.SUPABASE_PUBLISHABLE_KEY && !String(cfg.SUPABASE_PUBLISHABLE_KEY).includes("YOUR_");
  const messengerReady = cfg.MESSENGER_URL && !String(cfg.MESSENGER_URL).includes("YOUR_");
  let supabase = null;
  let galleryItems = [];
  let editingId = null;

  if (configured && window.supabase?.createClient) {
    supabase = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY);
  }

  $("year").textContent = new Date().getFullYear();

  document.querySelectorAll(".messenger-link").forEach((link) => {
    if (messengerReady) {
      link.href = cfg.MESSENGER_URL;
    } else {
      link.href = "#contact";
      link.addEventListener("click", (event) => {
        event.preventDefault();
        alert("Set the official RKS Catering Messenger link in config.js before publishing.");
      });
    }
  });

  // Messenger-only event inquiry form. It prepares the message locally; it does not store or send it automatically.
  const inquiryForm = $("event-inquiry-form");
  if (inquiryForm) {
    const dateField = $("inquiry-date");
    const today = new Date();
    const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    dateField.min = localToday;
    inquiryForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const status = $("inquiry-status");
      if (!messengerReady) {
        status.textContent = "Please set the official RKS Catering Messenger link in config.js before using the inquiry form.";
        status.classList.add("is-error");
        return;
      }
      const value = (id) => $(id).value.trim();
      const message = [
        "Hello RKS Catering! I would like to inquire about an event.",
        "", `Name: ${value("inquiry-name")}`,
        `Contact number: ${value("inquiry-phone")}`,
        `Event date: ${value("inquiry-date")}`,
        `Celebration: ${value("inquiry-type")}`,
        `Estimated guests: ${value("inquiry-guests")}`,
        `Venue / city: ${value("inquiry-venue")}`,
        `Preferences: ${value("inquiry-preferences") || "None specified yet"}`
      ].join("\n");
      const preview = $("inquiry-message-preview");
      preview.value = message;
      preview.hidden = false;
      status.classList.remove("is-error");
      status.textContent = "Your inquiry message is ready. We’ll copy it if your browser allows it, then open Messenger. Paste the message into the chat and send it.";
      // Open directly in the user gesture to avoid popup blockers.
      window.open(cfg.MESSENGER_URL, "_blank", "noopener,noreferrer");
      try {
        await navigator.clipboard.writeText(message);
        status.textContent = "Inquiry copied! Messenger opened in a new tab. Paste the message into the chat and send it.";
      } catch (_) {
        status.textContent = "Messenger opened in a new tab. Copy the prepared message below, paste it into the chat, then send it.";
      }
      preview.focus();
      preview.select();
    });
  }

  const menuToggle = $("menu-toggle");
  menuToggle.addEventListener("click", () => {
    const opened = $("main-nav").classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(opened));
  });
  document.querySelectorAll("#main-nav a").forEach((link) => link.addEventListener("click", () => {
    $("main-nav").classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
  }));

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((item) => revealObserver.observe(item));

  const dialog = $("admin-dialog");
  async function openAdminDialog() {
    if (!dialog.open) dialog.showModal();
    $("auth-status").textContent = "";
    if (!configured) {
      setStatus("auth-status", "Configure the Supabase URL and publishable key in config.js first.", true);
      return;
    }
    await restoreSession();
  }
  $("admin-open").addEventListener("click", openAdminDialog);
  $("admin-open-header").addEventListener("click", openAdminDialog);
  $("admin-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  function setStatus(id, message, isError = false) {
    const el = $(id);
    if (!el) return;
    el.textContent = message;
    el.classList.toggle("is-error", isError);
  }
  function safe(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[char]));
  }
  function validImagePath(value) {
    return value.startsWith("assets/") || /^https:\/\/\S+$/i.test(value);
  }

  async function restoreSession() {
    if (!supabase) return;
    const { data, error } = await supabase.auth.getSession();
    if (error) return setStatus("auth-status", error.message, true);
    if (data.session) {
      $("auth-panel").hidden = true;
      $("dashboard-panel").hidden = false;
      $("signed-in-label").textContent = `Signed in: ${data.session.user.email}`;
      await loadGallery();
    } else {
      $("auth-panel").hidden = false;
      $("dashboard-panel").hidden = true;
    }
  }

  $("login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!supabase) return setStatus("auth-status", "Supabase is not configured in config.js.", true);
    setStatus("auth-status", "Signing in…");
    const { data, error } = await supabase.auth.signInWithPassword({
      email: $("admin-email").value.trim(),
      password: $("admin-password").value
    });
    if (error) return setStatus("auth-status", error.message, true);
    // RLS is the real authorization boundary. Check membership before showing admin tools.
    const { data: allowed, error: roleError } = await supabase
      .from("admin_users").select("user_id").eq("user_id", data.user.id).maybeSingle();
    if (roleError || !allowed) {
      await supabase.auth.signOut();
      $("auth-panel").hidden = false;
      $("dashboard-panel").hidden = true;
      return setStatus("auth-status", "This account is not authorized for the RKS admin portal. Ask the database owner to approve Sir MJ's account.", true);
    }
    $("auth-panel").hidden = true;
    $("dashboard-panel").hidden = false;
    $("signed-in-label").textContent = `Signed in: ${data.user.email}`;
    setStatus("auth-status", "");
    await loadGallery();
  });

  $("logout-button").addEventListener("click", async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) return setStatus("gallery-status", error.message, true);
    $("auth-panel").hidden = false;
    $("dashboard-panel").hidden = true;
    $("admin-email").value = "";
    $("admin-password").value = "";
    setStatus("auth-status", "You have signed out.");
  });

  function renderAdminGallery() {
    const list = $("admin-gallery-list");
    if (!galleryItems.length) {
      list.innerHTML = '<p class="muted">No gallery items yet. Add an event above.</p>';
      return;
    }
    list.innerHTML = galleryItems.map((item) => `
      <article class="admin-gallery-item">
        <img src="${safe(item.image_path)}" alt="" onerror="this.style.visibility='hidden'">
        <div><strong>${safe(item.title)}</strong><small>${safe(item.category)} · ${item.is_published ? "Published" : "Hidden"}</small></div>
        <div class="admin-gallery-actions"><button type="button" data-edit="${safe(item.id)}">Edit</button><button type="button" data-delete="${safe(item.id)}">Delete</button></div>
      </article>`).join("");
    list.querySelectorAll("[data-edit]").forEach((button) => button.addEventListener("click", () => {
      const item = galleryItems.find((entry) => entry.id === button.dataset.edit);
      if (!item) return;
      editingId = item.id;
      $("gallery-id").value = item.id;
      $("gallery-title").value = item.title;
      $("gallery-category").value = item.category;
      $("gallery-image").value = item.image_path;
      $("gallery-published").checked = item.is_published;
      $("gallery-status").textContent = "Editing selected event.";
      $("gallery-title").focus();
    }));
    list.querySelectorAll("[data-delete]").forEach((button) => button.addEventListener("click", async () => {
      const item = galleryItems.find((entry) => entry.id === button.dataset.delete);
      if (!item || !confirm(`Delete "${item.title}" from the event gallery?`)) return;
      const { error } = await supabase.from("rks_gallery").delete().eq("id", item.id);
      if (error) return setStatus("gallery-status", error.message, true);
      await loadGallery();
      setStatus("gallery-status", "Event deleted.");
    }));
  }

  async function loadGallery() {
    if (!supabase) return;
    setStatus("gallery-status", "Loading gallery…");
    const { data, error } = await supabase.from("rks_gallery")
      .select("id,title,category,image_path,is_published,sort_order")
      .order("sort_order", { ascending: true });
    if (error) return setStatus("gallery-status", `Could not load gallery: ${error.message}`, true);
    galleryItems = data || [];
    renderAdminGallery();
    setStatus("gallery-status", `${galleryItems.length} gallery item(s) loaded.`);
  }

  $("gallery-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!supabase) return setStatus("gallery-status", "Supabase is not configured.", true);
    const title = $("gallery-title").value.trim();
    const category = $("gallery-category").value;
    const image_path = $("gallery-image").value.trim();
    if (!validImagePath(image_path)) return setStatus("gallery-status", "Use a local assets/... path or a full HTTPS image URL.", true);
    const payload = { title, category, image_path, is_published: $("gallery-published").checked };
    setStatus("gallery-status", "Saving event…");
    const query = editingId
      ? supabase.from("rks_gallery").update(payload).eq("id", editingId)
      : supabase.from("rks_gallery").insert(payload);
    const { error } = await query;
    if (error) return setStatus("gallery-status", error.message, true);
    resetGalleryForm();
    await loadGallery();
    setStatus("gallery-status", "Event saved. Published items appear in the public gallery after refresh.");
  });

  function resetGalleryForm() {
    editingId = null;
    $("gallery-form").reset();
    $("gallery-id").value = "";
    $("gallery-published").checked = true;
  }
  $("gallery-reset").addEventListener("click", resetGalleryForm);

  // Load approved gallery items for the public website. Local starter gallery remains visible if
  // Supabase is not configured or if the table has not been set up yet.
  async function loadPublicGallery() {
    if (!supabase) return;
    const { data, error } = await supabase.from("rks_gallery")
      .select("id,title,category,image_path,is_published,sort_order")
      .eq("is_published", true).order("sort_order", { ascending: true });
    if (error || !data || !data.length) return;
    const grid = document.querySelector(".gallery-grid");
    grid.innerHTML = data.map((item, index) => `
      <figure class="gallery-card ${index === 0 ? "gallery-large" : ""} reveal is-visible">
        <img src="${safe(item.image_path)}" alt="${safe(item.title)}" loading="lazy">
        <figcaption><span>${safe(item.category)}</span><strong>${safe(item.title)}</strong></figcaption>
      </figure>`).join("");
  }
  loadPublicGallery();
})();
