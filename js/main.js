// ===== Elements =====
var addContactBtn = document.getElementById("addContactBtn");
var saveContactBtn = document.getElementById("saveContactBtn");
var searchInput = document.getElementById("searchInput");

var nameInput = document.getElementById("nameInput");
var phoneInput = document.getElementById("phoneInput");
var emailInput = document.getElementById("emailInput");
var addressInput = document.getElementById("addressInput");
var groupInput = document.getElementById("groupInput");
var notesInput = document.getElementById("notesInput");
var favoriteInput = document.getElementById("favoriteInput");
var emergencyInput = document.getElementById("emergencyInput");
var photoInput = document.getElementById("photoInput");
var photoPreview = document.getElementById("photoPreview");
var modalTitle = document.getElementById("modalTitle");

var contactsContainer = document.getElementById("contactsContainer");
var favoritesList = document.getElementById("favoritesList");
var emergencyList = document.getElementById("emergencyList");

var contactModal = new bootstrap.Modal(document.getElementById("contactModal"));

// ===== Data =====
var contactList = JSON.parse(localStorage.getItem("contacts")) || [];
var editingIndex = -1; // -1 means add mode
var currentPhoto = "";
var defaultPhotoIcon = '<i class="fa-solid fa-user"></i>';

// ===== Events =====
addContactBtn.addEventListener("click", openAddModal);
saveContactBtn.addEventListener("click", saveContact);
searchInput.addEventListener("input", searchContacts);
photoInput.addEventListener("change", previewPhoto);

// ===== Local Storage =====
function saveToLocalStorage() {
  localStorage.setItem("contacts", JSON.stringify(contactList));
}

// ===== Modal =====
function openAddModal() {
  editingIndex = -1;
  modalTitle.innerText = "Add New Contact";
  clearForm();
  contactModal.show();
}

function clearForm() {
  nameInput.value = "";
  phoneInput.value = "";
  emailInput.value = "";
  addressInput.value = "";
  groupInput.value = "";
  notesInput.value = "";
  favoriteInput.checked = false;
  emergencyInput.checked = false;
  photoInput.value = "";
  currentPhoto = "";
  photoPreview.innerHTML = defaultPhotoIcon;
}

function previewPhoto() {
  var file = photoInput.files[0];
  if (!file) return;

  var reader = new FileReader();
  reader.onload = function () {
    currentPhoto = reader.result;
    photoPreview.innerHTML = '<img src="' + currentPhoto + '" alt="photo" />';
  };
  reader.readAsDataURL(file);
}

// ===== Validation =====
function validateForm() {
  var name = nameInput.value.trim();
  var phone = phoneInput.value.trim();
  var email = emailInput.value.trim();

  var nameRegex = /^[A-Za-z\u0600-\u06FF ]{2,50}$/;
  var phoneRegex = /^01[0125][0-9]{8}$/;
  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (name === "") return showError("Full name is required");
  if (!nameRegex.test(name)) return showError("Name must contain only letters (2 - 50 characters)");

  if (phone === "") return showError("Phone number is required");
  if (!phoneRegex.test(phone)) return showError("Phone must be a valid Egyptian number (e.g., 01012345678)");

  if (email !== "" && !emailRegex.test(email)) return showError("Please enter a valid email address");

  for (var i = 0; i < contactList.length; i++) {
    if (contactList[i].phone === phone && i !== editingIndex) {
      return showError("This phone number already exists");
    }
  }

  return true;
}

function showError(message) {
  Swal.fire({ icon: "error", title: "Invalid Data", text: message, confirmButtonColor: "#7c3aed" });
  return false;
}

// ===== Add / Update =====
function saveContact() {
  if (!validateForm()) return;

  var contact = {
    name: nameInput.value.trim(),
    phone: phoneInput.value.trim(),
    email: emailInput.value.trim(),
    address: addressInput.value.trim(),
    group: groupInput.value,
    notes: notesInput.value.trim(),
    isFavorite: favoriteInput.checked,
    isEmergency: emergencyInput.checked,
    photo: currentPhoto,
  };

  var isEditing = editingIndex !== -1;

  if (isEditing) {
    contactList[editingIndex] = contact;
  } else {
    contactList.push(contact);
  }

  saveToLocalStorage();
  displayAll();
  contactModal.hide();

  Swal.fire({
    icon: "success",
    title: isEditing ? "Updated!" : "Added!",
    text: isEditing ? "Contact has been updated successfully" : "Contact has been added successfully",
    timer: 1600,
    showConfirmButton: false,
  });
}

function editContact(index) {
  var contact = contactList[index];
  editingIndex = index;
  modalTitle.innerText = "Edit Contact";

  nameInput.value = contact.name;
  phoneInput.value = contact.phone;
  emailInput.value = contact.email;
  addressInput.value = contact.address;
  groupInput.value = contact.group;
  notesInput.value = contact.notes;
  favoriteInput.checked = contact.isFavorite;
  emergencyInput.checked = contact.isEmergency;
  currentPhoto = contact.photo;
  photoPreview.innerHTML = contact.photo ? '<img src="' + contact.photo + '" alt="photo" />' : defaultPhotoIcon;

  contactModal.show();
}

// ===== Delete =====
function deleteContact(index) {
  var contactName = contactList[index].name;

  // if SweetAlert didn't load for any reason
  if (typeof Swal === "undefined") {
    if (confirm("Do you really want to delete " + contactName + "?")) {
      removeContact(index);
    }
    return;
  }

  Swal.fire({
    title: "Are you sure?",
    text: "Do you really want to delete " + contactName + "?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc3545",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Yes, delete it",
  }).then(function (result) {
    if (result.isConfirmed || result.value === true) {
      removeContact(index);
    }
  });
}

function removeContact(index) {
  contactList.splice(index, 1);
  saveToLocalStorage();
  displayAll();
}

// ===== Favorite / Emergency =====
function toggleFavorite(index) {
  contactList[index].isFavorite = !contactList[index].isFavorite;
  saveToLocalStorage();
  displayAll();
}

function toggleEmergency(index) {
  contactList[index].isEmergency = !contactList[index].isEmergency;
  saveToLocalStorage();
  displayAll();
}

// ===== Search =====
function searchContacts() {
  var term = searchInput.value.trim().toLowerCase();
  var matchedIndexes = [];

  for (var i = 0; i < contactList.length; i++) {
    var contact = contactList[i];
    if (
      contact.name.toLowerCase().includes(term) ||
      contact.phone.includes(term) ||
      contact.email.toLowerCase().includes(term)
    ) {
      matchedIndexes.push(i); // keep the real index so the buttons work
    }
  }

  displayContacts(matchedIndexes);
}

// ===== Display =====
function getInitials(name) {
  var words = name.trim().split(" ");
  var initials = words[0][0];
  if (words.length > 1) initials += words[words.length - 1][0];
  return initials.toUpperCase();
}

function getAvatar(contact, sizeClass) {
  var content = contact.photo ? '<img src="' + contact.photo + '" alt="photo" />' : getInitials(contact.name);
  return '<div class="avatar ' + sizeClass + '">' + content + "</div>";
}

function getInfoRow(iconClass, softClass, text) {
  return (
    '<div class="info-row">' +
    '<span class="icon-box info-icon ' + softClass + '"><i class="fa-solid ' + iconClass + '"></i></span>' +
    "<span>" + text + "</span></div>"
  );
}

function getActionButton(softClass, iconClass, action, isActive) {
  var colorClass = isActive ? softClass : "soft-off";
  return '<button type="button" class="action-btn ' + colorClass + '" onclick="' + action + '"><i class="fa-solid ' + iconClass + '"></i></button>';
}

function displayContacts(indexes) {
  var html = "";

  if (indexes.length === 0) {
    html =
      '<div class="col-12"><div class="empty-state">' +
      '<div class="icon-box empty-icon"><i class="fa-solid fa-address-book"></i></div>' +
      '<h5 class="empty-title">No contacts found</h5>' +
      '<p class="empty-text">Click "Add Contact" to get started</p></div></div>';
    contactsContainer.innerHTML = html;
    return;
  }

  for (var i = 0; i < indexes.length; i++) {
    var index = indexes[i];
    var contact = contactList[index];

    var starBadge = contact.isFavorite
      ? '<span class="avatar-badge badge-top"><i class="fa-solid fa-star"></i></span>'
      : "";
    var heartBadge = contact.isEmergency
      ? '<span class="avatar-badge badge-bottom"><i class="fa-solid fa-heart-pulse"></i></span>'
      : "";

    var emailRow = contact.email ? getInfoRow("fa-envelope", "soft-purple", contact.email) : "";
    var addressRow = contact.address ? getInfoRow("fa-location-dot", "soft-green", contact.address) : "";

    var groupTag = contact.group ? '<span class="badge tag tag-group">' + contact.group + "</span>" : "";
    var emergencyTag = contact.isEmergency
      ? '<span class="badge tag tag-emergency"><i class="fa-solid fa-heart-pulse me-1"></i>Emergency</span>'
      : "";

    var mailButton = contact.email
      ? '<a href="mailto:' + contact.email + '" class="action-btn soft-purple"><i class="fa-solid fa-envelope"></i></a>'
      : "";

    html +=
      '<div class="col-md-6"><div class="card app-card contact-card h-100">' +
      '<div class="card-body">' +
      '<div class="d-flex align-items-center gap-3">' +
      '<div class="position-relative">' + getAvatar(contact, "") + starBadge + heartBadge + "</div>" +
      "<div>" +
      '<h5 class="contact-name">' + contact.name + "</h5>" +
      '<div class="d-flex align-items-center gap-2"><span class="icon-box info-icon small soft-blue"><i class="fa-solid fa-phone"></i></span>' + contact.phone + "</div>" +
      "</div></div>" +
      emailRow +
      addressRow +
      '<div class="d-flex gap-2 mt-3">' + groupTag + emergencyTag + "</div>" +
      "</div>" +
      '<div class="card-footer">' +
      '<div class="d-flex gap-2">' +
      '<a href="tel:' + contact.phone + '" class="action-btn soft-green"><i class="fa-solid fa-phone"></i></a>' +
      mailButton +
      "</div>" +
      '<div class="d-flex gap-2">' +
      getActionButton("soft-yellow", "fa-star", "toggleFavorite(" + index + ")", contact.isFavorite) +
      getActionButton("soft-red", "fa-heart-pulse", "toggleEmergency(" + index + ")", contact.isEmergency) +
      getActionButton("soft-gray", "fa-pen", "editContact(" + index + ")", true) +
      getActionButton("soft-gray", "fa-trash", "deleteContact(" + index + ")", true) +
      "</div></div></div></div>";
  }

  contactsContainer.innerHTML = html;
}

function displaySideList(container, listType, emptyMessage, callClass) {
  var html = "";

  for (var i = 0; i < contactList.length; i++) {
    var contact = contactList[i];
    var isInList = listType === "favorites" ? contact.isFavorite : contact.isEmergency;

    if (isInList) {
      html +=
        '<div class="side-item">' +
        getAvatar(contact, "avatar-small") +
        '<div><h6 class="side-name">' + contact.name + '</h6><p class="side-phone">' + contact.phone + "</p></div>" +
        '<a href="tel:' + contact.phone + '" class="side-call ' + callClass + '"><i class="fa-solid fa-phone"></i></a>' +
        "</div>";
    }
  }

  container.innerHTML = html || '<p class="side-empty">' + emptyMessage + "</p>";
}

function updateCounters() {
  var favoritesCount = 0;
  var emergencyCount = 0;

  for (var i = 0; i < contactList.length; i++) {
    if (contactList[i].isFavorite) favoritesCount++;
    if (contactList[i].isEmergency) emergencyCount++;
  }

  document.getElementById("totalCount").innerText = contactList.length;
  document.getElementById("favoritesCount").innerText = favoritesCount;
  document.getElementById("emergencyCount").innerText = emergencyCount;
  document.getElementById("contactsText").innerText = contactList.length;
}

function displayAll() {
  searchInput.value = "";

  var allIndexes = [];
  for (var i = 0; i < contactList.length; i++) allIndexes.push(i);

  displayContacts(allIndexes);
  displaySideList(favoritesList, "favorites", "No favorites yet", "soft-green");
  displaySideList(emergencyList, "emergency", "No emergency contacts", "soft-red");
  updateCounters();
}

// ===== Start =====
displayAll();