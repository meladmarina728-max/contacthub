
const STORAGE_KEY = "contacthub_contacts";

const modalOverlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const openModalBtn = document.getElementById("openModalBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelBtn = document.getElementById("cancelBtn");
const submitBtn = document.getElementById("submitBtn");
const contactForm = document.getElementById("contactForm");
const photoInput = document.getElementById("photoInput");
const photoPreview = document.getElementById("photoPreview");
const nameInput = document.getElementById("nameInput");
const phoneInput = document.getElementById("phoneInput");
const emailInput = document.getElementById("emailInput");
const addressInput = document.getElementById("addressInput");
const groupInput = document.getElementById("groupInput");
const favInput = document.getElementById("favInput");
const emgInput = document.getElementById("emgInput");
const searchInput = document.getElementById("searchInput");
const contactsList = document.getElementById("contactsList");
const favList = document.getElementById("favList");
const emgList = document.getElementById("emgList");
const totalCount = document.getElementById("totalCount");
const favCount = document.getElementById("favCount");
const emgCount = document.getElementById("emgCount");
const subCount = document.getElementById("subCount");

const colors = ["#3b82f6", "#8b5cf6", "#ec4899", "#f97316", "#10b981", "#06b6d4", "#ef4444", "#6366f1"];

let contacts = loadContacts();
let editingId = null;
let photoData = "";

function loadContacts() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return [];
  }
}

function saveContacts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function escapeHTML(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

function getInitials(name) {
  const words = name.trim().split(/\s+/);
  const first = words[0] ? words[0][0] : "";
  const second = words[1] ? words[1][0] : "";
  return (first + second).toUpperCase();
}

function getColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function avatarHTML(contact, small) {
  const size = small ? " small" : "";
  if (contact.photo) {
    return `<div class="avatar${size}" style="background-image:url('${contact.photo}')"></div>`;
  }
  return `<div class="avatar${size}" style="background:${getColor(contact.name)}">${escapeHTML(getInitials(contact.name))}</div>`;
}

function emptyHTML() {
  return `
    <div class="empty">
      <div class="empty-icon"><i class="fa-solid fa-address-book"></i></div>
      <h4>No contacts found</h4>
      <p>Click "Add Contact" to get started</p>
    </div>`;
}

function contactCardHTML(contact) {
  const emailRow = contact.email
    ? `<p><i class="fa-solid fa-envelope"></i>${escapeHTML(contact.email)}</p>`
    : "";
  const addressRow = contact.address
    ? `<p><i class="fa-solid fa-location-dot"></i>${escapeHTML(contact.address)}</p>`
    : "";
  const mailHref = contact.email ? `mailto:${escapeHTML(contact.email)}` : "#";
  const mailClass = contact.email ? "" : " disabled";

  return `
    <article class="contact-card" data-id="${contact.id}">
      ${avatarHTML(contact, false)}
      <div class="contact-info">
        <h3>${escapeHTML(contact.name)}</h3>
        <p><i class="fa-solid fa-phone"></i>${escapeHTML(contact.phone)}</p>
        ${emailRow}
        ${addressRow}
        <span class="badge">${escapeHTML(contact.group)}</span>
      </div>
      <div class="contact-actions">
        <a class="act call" href="tel:${escapeHTML(contact.phone)}" title="Call"><i class="fa-solid fa-phone"></i></a>
        <a class="act mail${mailClass}" href="${mailHref}" title="Email"><i class="fa-solid fa-envelope"></i></a>
        <button class="act fav${contact.favorite ? " on" : ""}" data-action="fav" title="Favorite"><i class="fa-solid fa-star"></i></button>
        <button class="act emg${contact.emergency ? " on" : ""}" data-action="emg" title="Emergency"><i class="fa-solid fa-heart-pulse"></i></button>
        <button class="act edit" data-action="edit" title="Edit"><i class="fa-solid fa-pen"></i></button>
        <button class="act del" data-action="delete" title="Delete"><i class="fa-solid fa-trash"></i></button>
      </div>
    </article>`;
}

function miniHTML(contact) {
  return `
    <div class="mini">
      ${avatarHTML(contact, true)}
      <div class="mini-info">
        <h4>${escapeHTML(contact.name)}</h4>
        <p>${escapeHTML(contact.phone)}</p>
      </div>
      <a class="act call" href="tel:${escapeHTML(contact.phone)}" title="Call"><i class="fa-solid fa-phone"></i></a>
    </div>`;
}

function render() {
  const query = searchInput.value.trim().toLowerCase();

  const filtered = contacts.filter(function (contact) {
    return (
      contact.name.toLowerCase().includes(query) ||
      contact.phone.toLowerCase().includes(query) ||
      contact.email.toLowerCase().includes(query)
    );
  });

  contactsList.innerHTML = filtered.length ? filtered.map(contactCardHTML).join("") : emptyHTML();

  const favorites = contacts.filter(function (contact) {
    return contact.favorite;
  });
  const emergencies = contacts.filter(function (contact) {
    return contact.emergency;
  });

  favList.innerHTML = favorites.length
    ? favorites.map(miniHTML).join("")
    : `<div class="side-empty">No favorites yet</div>`;

  emgList.innerHTML = emergencies.length
    ? emergencies.map(miniHTML).join("")
    : `<div class="side-empty">No emergency contacts</div>`;

  totalCount.textContent = contacts.length;
  favCount.textContent = favorites.length;
  emgCount.textContent = emergencies.length;
  subCount.textContent = contacts.length;
}

function setPhotoPreview(photo) {
  if (photo) {
    photoPreview.style.backgroundImage = `url('${photo}')`;
    photoPreview.innerHTML = "";
  } else {
    photoPreview.style.backgroundImage = "";
    photoPreview.innerHTML = `<i class="fa-solid fa-user"></i>`;
  }
}

function clearErrors() {
  ["name", "phone", "email"].forEach(function (key) {
    document.getElementById(key + "Error").textContent = "";
    document.getElementById(key + "Input").classList.remove("invalid");
  });
}

function showError(key, message) {
  document.getElementById(key + "Error").textContent = message;
  document.getElementById(key + "Input").classList.add("invalid");
}

function validateForm() {
  clearErrors();
  let valid = true;

  const name = nameInput.value.trim();
  const phone = phoneInput.value.replace(/\s+/g, "");
  const email = emailInput.value.trim();

  if (!name) {
    showError("name", "Full name is required");
    valid = false;
  } else if (name.length < 3) {
    showError("name", "Name must be at least 3 characters");
    valid = false;
  } else if (!/^[\p{L}\s.'-]+$/u.test(name)) {
    showError("name", "Name can only contain letters and spaces");
    valid = false;
  }

  if (!phone) {
    showError("phone", "Phone number is required");
    valid = false;
  } else if (!/^(\+20|0)1[0125]\d{8}$/.test(phone)) {
    showError("phone", "Enter a valid Egyptian number, e.g., 01012345678");
    valid = false;
  } else {
    const duplicate = contacts.some(function (contact) {
      return contact.phone === phone && contact.id !== editingId;
    });
    if (duplicate) {
      showError("phone", "This phone number already exists");
      valid = false;
    }
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    showError("email", "Enter a valid email, e.g., name@example.com");
    valid = false;
  }

  return valid;
}

function openModal(contact) {
  clearErrors();
  contactForm.reset();
  photoInput.value = "";

  if (contact) {
    editingId = contact.id;
    modalTitle.textContent = "Edit Contact";
    submitBtn.textContent = "Update Contact";
    nameInput.value = contact.name;
    phoneInput.value = contact.phone;
    emailInput.value = contact.email;
    addressInput.value = contact.address;
    groupInput.value = contact.group;
    favInput.checked = contact.favorite;
    emgInput.checked = contact.emergency;
    photoData = contact.photo || "";
  } else {
    editingId = null;
    modalTitle.textContent = "Add New Contact";
    submitBtn.textContent = "Save Contact";
    photoData = "";
  }

  setPhotoPreview(photoData);
  modalOverlay.classList.add("open");
  nameInput.focus();
}

function closeModal() {
  modalOverlay.classList.remove("open");
  editingId = null;
  photoData = "";
}

function resizeImage(file, callback) {
  const reader = new FileReader();
  reader.onload = function (event) {
    const img = new Image();
    img.onload = function () {
      const max = 200;
      const ratio = Math.min(max / img.width, max / img.height, 1);
      const canvas = document.createElement("canvas");
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      callback(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

function toggleFlag(id, flag) {
  const contact = contacts.find(function (item) {
    return item.id === id;
  });
  if (!contact) return;
  contact[flag] = !contact[flag];
  saveContacts();
  render();
}

function deleteContact(id) {
  const contact = contacts.find(function (item) {
    return item.id === id;
  });
  if (!contact) return;

  Swal.fire({
    title: "Delete contact?",
    text: `${contact.name} will be removed permanently.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#64748b",
    confirmButtonText: "Yes, delete it",
    cancelButtonText: "Cancel"
  }).then(function (result) {
    if (result.isConfirmed) {
      contacts = contacts.filter(function (item) {
        return item.id !== id;
      });
      saveContacts();
      render();
      Swal.fire({
        title: "Deleted!",
        text: "The contact has been deleted.",
        icon: "success",
        confirmButtonColor: "#4f46e5",
        timer: 1800
      });
    }
  });
}

contactForm.addEventListener("submit", function (event) {
  event.preventDefault();
  if (!validateForm()) return;

  const data = {
    name: nameInput.value.trim(),
    phone: phoneInput.value.replace(/\s+/g, ""),
    email: emailInput.value.trim(),
    address: addressInput.value.trim(),
    group: groupInput.value,
    favorite: favInput.checked,
    emergency: emgInput.checked,
    photo: photoData
  };

  if (editingId) {
    const index = contacts.findIndex(function (item) {
      return item.id === editingId;
    });
    contacts[index] = Object.assign({}, contacts[index], data);
    saveContacts();
    render();
    closeModal();
    Swal.fire({
      title: "Updated!",
      text: "Contact updated successfully.",
      icon: "success",
      confirmButtonColor: "#4f46e5",
      timer: 1800
    });
  } else {
    contacts.unshift(Object.assign({ id: generateId() }, data));
    saveContacts();
    render();
    closeModal();
    Swal.fire({
      title: "Good job!",
      text: "Contact added successfully.",
      icon: "success",
      confirmButtonColor: "#4f46e5",
      timer: 1800
    });
  }
});

photoInput.addEventListener("change", function () {
  const file = photoInput.files[0];
  if (!file) return;
  resizeImage(file, function (result) {
    photoData = result;
    setPhotoPreview(photoData);
  });
});

contactsList.addEventListener("click", function (event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const id = button.closest(".contact-card").dataset.id;
  const action = button.dataset.action;

  if (action === "fav") toggleFlag(id, "favorite");
  if (action === "emg") toggleFlag(id, "emergency");
  if (action === "delete") deleteContact(id);
  if (action === "edit") {
    const contact = contacts.find(function (item) {
      return item.id === id;
    });
    openModal(contact);
  }
});

[nameInput, phoneInput, emailInput].forEach(function (input) {
  input.addEventListener("input", function () {
    input.classList.remove("invalid");
    const key = input.id.replace("Input", "");
    document.getElementById(key + "Error").textContent = "";
  });
});

searchInput.addEventListener("input", render);
openModalBtn.addEventListener("click", function () {
  openModal(null);
});
closeModalBtn.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);

modalOverlay.addEventListener("click", function (event) {
  if (event.target === modalOverlay) closeModal();
});

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape" && modalOverlay.classList.contains("open")) closeModal();
});

render();