const input = document.querySelector("#usernameInput");
const button = document.querySelector("#searchBtn");
const result = document.querySelector("#result");

function renderMessage(message) {
  result.innerHTML = `<p>${message}</p>`;
}

function renderUserCard(user) {
  const safeBio = user.bio ? user.bio : "Sem bio informada.";
  const safeLocation = user.location ? user.location : "—";
  const safeCompany = user.company ? user.company : "—";

  result.innerHTML = `
    <article class="user-card" aria-live="polite">
      <div class="user-top">
        <img class="avatar" src="${user.avatar_url}" alt="Avatar de ${user.login}" />
        <div class="user-main">
          <h2>${user.name ? user.name : user.login}</h2>
          <a class="username" href="${user.html_url}" target="_blank" rel="noreferrer">@${user.login}</a>
          <p class="bio">${safeBio}</p>
        </div>
      </div>

      <div class="user-stats">
        <div class="stat">
          <span class="stat-number">${user.public_repos}</span>
          <span class="stat-label">Repos</span>
        </div>
        <div class="stat">
          <span class="stat-number">${user.followers}</span>
          <span class="stat-label">Followers</span>
        </div>
        <div class="stat">
          <span class="stat-number">${user.following}</span>
          <span class="stat-label">Following</span>
        </div>
      </div>

      <div class="user-extra">
        <div class="extra-item"><strong>Local:</strong> ${safeLocation}</div>
        <div class="extra-item"><strong>Empresa:</strong> ${safeCompany}</div>
      </div>
    </article>
  `;
}

async function fetchGitHubUser(username) {
  const url = `https://api.github.com/users/${encodeURIComponent(username)}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
    },
  });

  if (response.status === 404) return { notFound: true };
  if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);

  return response.json();
}

async function handleSearch() {
  const username = input.value.trim();

  if (!username) {
    renderMessage("Digite um username para buscar.");
    return;
  }

  renderMessage("Carregando...");

  try {
    const data = await fetchGitHubUser(username);

    if (data.notFound) {
      renderMessage(
        "Usuário não encontrado. Verifique o username e tente novamente.",
      );
      return;
    }

    renderUserCard(data);
  } catch (err) {
    renderMessage("Erro ao buscar usuário. Tente novamente em instantes.");
    console.error(err);
  }
}

button.addEventListener("click", handleSearch);

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleSearch();
});

// estado inicial
renderMessage("Digite um username acima e clique em Buscar.");
