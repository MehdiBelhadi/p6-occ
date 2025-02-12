const url = "http://localhost:5678/api";

getWorks();
getCategories();
displayBannerAdmin();
submitPicture();

//Recuperation des works depuis l'API
async function getWorks(filter) {
  document.querySelector(".gallery").innerHTML = "";
  document.querySelector(".modal-gallery").innerHTML = "";
  try {
    const response = await fetch(`${url}/works`);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }
    const json = await response.json();
    if (filter) {
      const filtered = json.filter((data) => data.categoryId === filter);
      for (let i = 0; i < filtered.length; i++) {
        displayWorks(filtered[i]);
        displayWorksModal(json[i]);
      }
    } else {
      for (let i = 0; i < json.length; i++) {
        displayWorks(json[i]);
        displayWorksModal(json[i]);
      }
    }
    const trashCans = document.querySelectorAll(".fa-trash-can");
    trashCans.forEach((e) =>
      e.addEventListener("click", (event) => deleteWork(event))
    );
  } catch (error) {
    console.error(error.message);
  }
}

// Integration des travaux dans la galerie
function displayWorks(data) {
  const figure = document.createElement("figure");
  figure.innerHTML = `<img src=${data.imageUrl} alt=${data.title}>
                        <figcaption>${data.title}</figcaption>`;

  document.querySelector(".gallery").append(figure);
}

// Integration des travaux dans le modal
function displayWorksModal(data) {
  const figure = document.createElement("figure");
  figure.innerHTML = `<div class="image-container">
          <img src="${data.imageUrl}" alt="${data.title}">
          <i id=${data.id} class="fa-solid fa-trash-can overlay-icon"></i>
      </div>
  `;

  document.querySelector(".modal-gallery").append(figure);
}

//Recuperation des categories depuis l'API
async function getCategories() {
  try {
    const response = await fetch(`${url}/categories`);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const json = await response.json();
    for (let i = 0; i < json.length; i++) {
      createFilter(json[i]);
    }
  } catch (error) {
    console.error(error.message);
  }
}

// Création du filtre
function createFilter(data) {
  const div = document.createElement("div");
  div.id = data.id;
  div.addEventListener("click", () => getWorks(data.id));
  div.addEventListener("click", (event) => makeFilterActive(event));
  document
    .querySelector(".all")
    .addEventListener("click", (event) => makeFilterActive(event));
  div.innerHTML = `${data.name}`;
  document.querySelector(".div-container").append(div);
}

// Afficher le filtre actif et ses images affiliées
function makeFilterActive(event) {
  const container = document.querySelector(".div-container");
  Array.from(container.children).forEach((child) =>
    child.classList.remove("active-filter")
  );
  event.target.classList.add("active-filter");
}

document.querySelector(".all").addEventListener("click", () => getWorks());

// Afficher la bannière Admin
function displayBannerAdmin() {
  if (sessionStorage.authToken) {
    document.querySelector(".js-modal-2").style.display = "block";
    document.querySelector(".gallery").style.margin = "30px 0 0 0";
    const editBanner = document.createElement("div");
    editBanner.className = "edit";
    editBanner.innerHTML =
      '<i class="fa-solid fa-pen-to-square"></i><p><a href="#modal1" class="js-modal">Mode édition</p>';
    document.body.prepend(editBanner);
    document.querySelector(".log-button").textContent = "logout";
    document.querySelector(".log-button").addEventListener("click", () => {
      sessionStorage.removeItem("authToken");
    });
  }
}

// Le modal
let modal = null;
const focusableSelector = "button, a, input, textarea";
let focusables = [];

const openModal = function (e) {
  e.preventDefault();

  modal = document.querySelector(e.target.getAttribute("href"));
  focusables = Array.from(modal.querySelectorAll(focusableSelector));
  focusables[0].focus();
  modal.style.display = null;
  modal.removeAttribute("aria-hidden");
  modal.setAttribute("aria-modal", "true");
  modal.addEventListener("click", closeModal);

  modal
    .querySelectorAll(".js-modal-close")
    .forEach((e) => e.addEventListener("click", closeModal));

  modal
    .querySelector(".js-modal-stop")
    .addEventListener("click", stopPropagation);

  // Afficher le modal de galerie par défaut et cacher le formulaire d'ajout
  document.querySelector(".gallery-modal").style.display = "block";
  document.querySelector(".add-modal").style.display = "none";
};


const closeModal = function (e) {
  if (modal === null) return;
  e.preventDefault();
  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");
  modal.removeAttribute("aria-modal");
  modal.removeEventListener("click", closeModal);
  modal
    .querySelector(".js-modal-close")
    .removeEventListener("click", closeModal);
  modal
    .querySelector(".js-modal-stop")
    .removeEventListener("click", stopPropagation);
  modal = null;
};

const stopPropagation = function (e) {
  e.stopPropagation();
};

const focusInModal = function (e) {
  e.preventDefault();
  let index = focusables.findIndex((f) => f === modal.querySelector(":focus"));
  if (e.shiftKey === true) {
    index--;
  } else {
    index++;
  }
  if (index >= focusables.length) {
    index = 0;
  }
  if (index < 0) {
    index = focusables.length - 1;
  }
  focusables[index].focus();
};

window.addEventListener("keydown", function (e) {
  if (e.key === "Escape" || e.key === "Esc") {
    closeModal(e);
  }
  if (e.key === "Tab" && modal !== null) {
    focusInModal(e);
  }
});

document.querySelectorAll(".js-modal").forEach((a) => {
  a.addEventListener("click", openModal);
});

// Suppression de works
async function deleteWork(event) {
  event.stopPropagation();
  const id = event.srcElement.id;
  const token = sessionStorage.authToken;

  try {
    const response = await fetch(`${url}/works/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + token,
      },
    });

    if (response.status == 401 || response.status == 500) {
      const errorBox = document.createElement("div");
      errorBox.className = "error-login";
      errorBox.innerHTML = "Il y a eu une erreur";
      document.querySelector(".modal-button-container").prepend(errorBox);
    } else {
      getWorks();
    }
  } catch (error) {
    console.error("Erreur lors de la suppression:", error);
  }
}

// Basculement du premier modal au second
function toggleModal() {
  const galleryModal = document.querySelector(".gallery-modal");
  const addModal = document.querySelector(".add-modal");

  if (
    galleryModal.style.display === "block" ||
    galleryModal.style.display === ""
  ) {
    galleryModal.style.display = "none";
    addModal.style.display = "block";
  } else {
    galleryModal.style.display = "block";
    addModal.style.display = "none";
  }
}

// Evenements changement de modals
const addPhotoButton = document.querySelector(".add-photo-button");
const backButton = document.querySelector(".js-modal-back");
addPhotoButton.addEventListener("click", toggleModal);
backButton.addEventListener("click", toggleModal);

async function submitPicture() {
  const img = document.createElement("img");
  const fileInput = document.getElementById("file");
  let file;
  const submitButton = document.querySelector("#picture-form input[type='submit']");
  const titleInput = document.getElementById("title");
  const categoryInput = document.getElementById("category");
  let isImageValid = false;

  fileInput.style.display = "none";
  submitButton.disabled = true;

  // Fonction qui vérifie la validité du formulaire
  function checkFormValidity() {
    const titleValue = titleInput.value.trim();
    const selectedValue = categoryInput.value;

    // Vérifier que l'image est valide et que le titre et la catégorie ne sont pas vides
    if (isImageValid && titleValue !== "" && selectedValue !== "") {
      submitButton.disabled = false;
    } else {
      submitButton.disabled = true;
    }
  }


  // Ajouter l'image
  fileInput.addEventListener("change", function (event) {
    file = event.target.files[0];
    const maxFileSize = 4 * 1024 * 1024; // Taille maximale de 4 Mo

    if (file && (file.type === "image/jpeg" || file.type === "image/png")) {
      if (file.size > maxFileSize) {
        alert("La taille de l'image ne doit pas dépasser 4 Mo.");
        return;
      }

      // Créer une nouvelle image
      const img = document.createElement("img");

      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
        img.alt = "Uploaded Photo";

        // Ajouter l'image dans le conteneur photo-container
        const photoContainer = document.getElementById("photo-container");
        photoContainer.innerHTML = "";
        photoContainer.appendChild(img);

        // Mettre à jour la validation du formulaire
        isImageValid = true;
        checkFormValidity();
      };

      reader.readAsDataURL(file);

      // Cacher les éléments 'picture-loaded' une fois l'image ajoutée
      document.querySelectorAll(".picture-loaded").forEach((e) => (e.style.display = "none"));
    } else {
      alert("Veuillez sélectionner une image au format JPG ou PNG.");
      isImageValid = false;
      checkFormValidity();
    }
  });

  // Fonction pour vérifier la validité du formulaire
  function checkFormValidity() {
    const titleValue = titleInput.value.trim();
    const selectedValue = categoryInput.value;

    // Vérifier que l'image est valide, que le titre et la catégorie ne sont pas vides
    if (isImageValid && titleValue !== "" && selectedValue !== "") {
      submitButton.disabled = false;
    } else {
      submitButton.disabled = true;
    }
  }

  titleInput.addEventListener("input", checkFormValidity);
  categoryInput.addEventListener("change", checkFormValidity);


  // Validation du formulaire
  const addPictureForm = document.getElementById("picture-form");

  addPictureForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const titleValue = titleInput.value.trim();
    const selectedValue = categoryInput.value;
    const hasImage = document.querySelector("#photo-container").firstChild;

    if (hasImage && titleValue && selectedValue) {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("title", titleValue);
      formData.append("category", selectedValue);

      const token = sessionStorage.authToken;

      if (!token) {
        console.error("Token d'authentification manquant.");
        return;
      }

      try {
        let response = await fetch(`${url}/works`, {
          method: "POST",
          headers: {
            Authorization: "Bearer " + token,
          },
          body: formData,
        });

        if (response.status === 201) {
          // Rafraîchir la galerie après l'ajout de l'image
          getWorks();

          // Réinitialiser le formulaire
          titleInput.value = "";
          categoryInput.value = "";
          document.getElementById("photo-container").innerHTML = "";
          isImageValid = false;

          // Afficher à nouveau les éléments de la section d'ajout d'image
          document.querySelectorAll('.picture-loaded').forEach((element) => {
            element.style.display = 'block';
          });

          // Fermer le modal d'ajout d'image
          closeModal(event);

          // Ouvrir directement le modal de la galerie après la soumission
          const galleryModalEvent = { target: { getAttribute: () => "#modal2" } };
          openModal(galleryModalEvent);
        } else {
          const errorText = await response.text();
          console.error("Erreur : ", errorText);
          const errorBox = document.createElement("div");
          errorBox.className = "error-login";
          errorBox.innerHTML = `Il y a eu une erreur : ${errorText}`;
          document.querySelector("form").prepend(errorBox);
        }
      } catch (error) {
        console.error("Erreur lors de l'ajout de l'image : ", error);
      }
    } else {
      alert("Veuillez remplir tous les champs.");
    }
  });
}
