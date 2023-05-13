console.log('damn');
const searchBar = document.querySelector('input');
// const downloadBtn = document.querySelector('.downloadBtn');
const searchingLoader = document.querySelector('.searching-loader');
const errorMsg = document.querySelector('.error');
const packageTemplate = document.querySelector('.package-template');
const actionBtns = document.querySelector('.action-btns');

searchBar.focus();

async function searchPackage(event) {
  event.preventDefault();
  try {
    // downloadBtn.style.display = 'none';
    errorMsg.style.display = 'none';
    searchingLoader.style.display = 'block';

    console.log('searchBar.value', searchBar.value);

    if (!searchBar.value) {
      console.log('inside if', searchBar.value);
      searchBar.focus();
      throw new Error('Please provide a package name.');
    }

    const response = await fetch("/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: searchBar.value,
      }),
    });

    const result = await response.json();
    console.log("Success:", result);

    if (result.success) {
      searchingLoader.style.display = 'none';
      addMirrors(result);
    } else {
      errorMsg.style.display = 'block';
      errorMsg.innerText = 'Package Not Found';
      searchingLoader.style.display = 'none';
    }
  } catch (error) {
    console.log("Error:", error.message);
    errorMsg.style.display = 'block';
    searchingLoader.style.display = 'none';
    errorMsg.innerText = `Unresolved Error: ${error.message}`
  }
}

function handleSearchInput() {
  console.log('resseting display');
  // downloadBtn.style.display = 'none';
  actionBtns.style.display = 'none';
  actionBtns.innerHTML = '';
  errorMsg.style.display = 'none';
  searchingLoader.style.display = 'none';
}

function addMirrors(payload) {
  if (payload.ubuntuURL) {
    const ubuntuRepoLink = document.createElement('a');
    ubuntuRepoLink.textContent = 'ubuntu repo debian package';
    ubuntuRepoLink.setAttribute('href', payload.ubuntuURL);
    actionBtns.appendChild(ubuntuRepoLink);
  }

  for (let asset of payload.githubAssets) {
    const link = document.createElement('a');
    link.textContent = asset.name;
    link.setAttribute('href', asset.browser_download_url);
    actionBtns.appendChild(link);
  }

  actionBtns.style.display = 'block';
}