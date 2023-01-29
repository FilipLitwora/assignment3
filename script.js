const API_URL = "http://localhost:3000";

const form = document.querySelector("form");
const tbody = document.querySelector("tbody");
const reset = document.querySelector("#reset");
const authors = document.querySelector(".Authors");
const searchInput = document.querySelector("#searchInput");

let uniqueNames = [];
const activeAuthorsFilters = {};

// event listeners
form.addEventListener("submit", handleSubmit);
reset.addEventListener("click", handleReset);
searchInput.addEventListener("keyup", handleInputChange);

function handleInputChange(e) {
  // get input value, change to uppercase, remove excess whitespace
  const value = e.target.value.toUpperCase().trim();

  const tr = tbody.getElementsByTagName("tr");

  for (i = 0; i < tr.length; i++) {
    const x = tr[i];

    if (x.children[0].getAttribute("id")) {
      const text = x.innerText.toUpperCase();

      // check if searched text is a substring of any entry
      if (!text.includes(value)) {
        x.classList.add("hidden-search");
      } else {
        x.classList.remove("hidden-search");
      }
    }
  }
}

function generateGalleryRow(data) {
  const id = data.id;
  const author = data.author;

  const tagsArray = data.tags.split(","); // split tags into array

  const html = `
            <td id="${author}">
              <figure>
               <img
                   src="${data.image}"
                   alt="${data.alt}"
                   height="200"
                   width="150"
                >
               <figcaption>${author}</figcaption>
              </figure>
              <button id="edit">Edit</button>
            </td>
            <td>
              <section>
                <h3>${author}</h3>
              </section>
            </td>
               <td>${data.alt}</td>
               <td>
               <ul>
                 ${tagsArray
                   .map((tag) => `<li><pre>${tag}</pre></li>`)
                   .join("")}
               </ul>
            </td>
            <td>
               ${data.description}
            </td>
         `;

  const node = document.createElement("tr");
  node.innerHTML = html;
  node.querySelector("#edit").addEventListener("click", function () {
    handleEdit(node, id);
  });

  return node;
}

function handleAuthorFilterClick(element) {
  const author = element.innerText;

  // toggle filter
  activeAuthorsFilters[author] = !activeAuthorsFilters[author];
  // toggle class indicating if filter is active
  if (activeAuthorsFilters[author]) {
    element.classList.add("active-filter");
  } else {
    element.classList.remove("active-filter");
  }

  // check if any filters are applied
  const anyFilters = Object.values(activeAuthorsFilters).some(
    (s) => s === true
  );

  [...tbody.children].forEach((child) => {
    const td = child.children[0];
    const id = td.getAttribute("id");

    if (id) {
      // if no filters applied, show all
      if (!anyFilters) child.classList.remove("hidden");
      else {
        if (!activeAuthorsFilters[id]) child.classList.add("hidden");
        else child.classList.remove("hidden");
      }
    }
  });
}

function generateAuthorFilters() {
  // remove all filters from dom
  authors.innerHTML = "";

  uniqueNames.forEach((name) => {
    if (activeAuthorsFilters[name] === undefined)
      activeAuthorsFilters[name] = false;
    //  for each unique name, make a new filter in dom
    const element = document.createElement("li");
    if (activeAuthorsFilters[name]) {
      element.classList.add("active-filter");
    } else {
      element.classList.remove("active-filter");
    }

    element.innerHTML = `<a>${name}</a>`;
    authors.appendChild(element);

    // listen for any clicks
    element.addEventListener("click", function () {
      handleAuthorFilterClick(element);
    });
  });
}

async function handleEdit(node, id) {}

async function handleSubmit(event) {
  // prevent reload on submit
  event.preventDefault();

  // gather data from form
  const formData = new FormData(event.target);
  const data = Object.fromEntries(formData); // convert formData into an object

  // upload submission to the server
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw Error("Error while submitting");
    }

    // display submission in gallery
    tbody.appendChild(generateGalleryRow(data));

    // if author is new, add to unique names
    if (uniqueNames.findIndex((n) => n === data.author) === -1) {
      uniqueNames.push(data.author);
    }
    // re-generate filters
    generateAuthorFilters();

    event.target.reset();
  } catch (e) {
    //Handle error
    console.error(e);
  }
}

function renderData(json) {
  uniqueNames = [];

  if (json.length > 0) {
    json.forEach((entry) => {
      // find all unique names
      if (uniqueNames.findIndex((n) => n === entry.author) === -1) {
        uniqueNames.push(entry.author);
      }

      // insert generated HTML to dom before submission form
      tbody.appendChild(generateGalleryRow(entry));
    });
  }

  generateAuthorFilters();
}

async function getData() {
  const response = await fetch(API_URL);
  const json = await response.json();

  renderData(json);
}

async function handleReset() {
  // reset data in database
  try {
    const response = await fetch(API_URL + "/reset");
    if (!response.ok) throw new Error("Error while resetting data");
    const json = await response.json();

    // remove all entries from html
    tbody.innerHTML = "";

    renderData(json);
  } catch (e) {
    // Handle error
    console.error(e);
  }
}

getData();

// Code from micromodal documentation (https://micromodal.vercel.app/)
MicroModal.init({
  openTrigger: "data-custom-open",
  closeTrigger: "data-custom-close",
  openClass: "is-open",
  disableScroll: true,
  disableFocus: false,
  awaitOpenAnimation: false,
  awaitCloseAnimation: false,
});
