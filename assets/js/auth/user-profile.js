import { loadComponents, setFavicon } from '../components.js';
import { isLoggedIn, getCurrentUser, getAuthHeaders } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    setFavicon();
    loadComponents();
  
    if (!isLoggedIn()) {
      alert('You must be logged in to view your profile.');
      window.location.href = './login.html';
      return;
    }
  
    const user = getCurrentUser();
    await Promise.all([
        renderMyPosts(user.name),
        renderFollowingPanel(user.name)
    ]);
});

/**
 * "Loading" Your profile posts from the API."
 *
 * @param {string} profileName - The username of the profile.
 * @returns {Promise<void>}
 */
async function renderMyPosts(profileName) {
    const container = document.getElementById('myPosts');
    container.innerHTML = '<p class="text-muted text-center">Loading...</p>';

    try {
        const res = await fetch(`https://v2.api.noroff.dev/social/profiles/${profileName}/posts`, {
            headers: getAuthHeaders(),
        });
        const result = await res.json();

        const posts = result?.data || [];
        if (!posts.length) {
            container.innerHTML = '<p class="text-muted text-center">No posts yet.</p>';
            return;
        }

        container.innerHTML = posts.map(post => {
      const title = ((post.title || 'No title...').trim());
            const titleText = title.length > 20 ? title.slice(0, 20) + '…' : title;
            const img = post.media?.url
                ? `<div class="ratio ratio-16x9">
                     <img src="${post.media.url}" alt="${post.media.alt || ''}" class="w-100 h-100 object-fit-cover">
                   </div>`
                : '';
            const created = new Date(post.created).toLocaleString();
      const preview = ((post.body || 'No text...').trim());
            const previewText = preview.length > 20 ? preview.slice(0, 20) + '…' : preview;
      

            return `
            <div class="col-12 col-md-6 col-lg-4">
              <div class="card h-100">
                ${img}
                <div class="card-body text-center">
                  <h5 class="card-title">${titleText}</h5>
                  <p class="card-text mb-0">${previewText}</p>
                </div>
                <div class="card-footer d-flex justify-content-between align-items-center">
                  <small class="text-muted">${created}</small>
                  <div>
                    <a href="../posts/single-post.html?id=${post.id}" class="btn btn-sm btn-info text-white me-1">View</a>
                    <a href="../posts/edit-post.html?id=${post.id}" class="btn btn-sm btn-warning text-white mt-1">Edit</a>
                  </div>
                </div>
              </div>
            </div>
            `;
        }).join('');
    } catch (error) {
        console.error(error);
        container.innerHTML = '<p class="text-danger text-center">Failed to load posts.</p>';
    }
}

/**
 * Fetch and render the list of users the current user is following.
 *
 * @param {string} profileName - The username of the profile.
 * @returns {Promise<void>}
 */
async function renderFollowingPanel(profileName) {
    const listEl = document.getElementById('followingList');
    const loadEl = document.getElementById('followingLoading');
    const errEl = document.getElementById('followingError');
    const refreshBtn = document.getElementById('refreshFollowing');

    if (!listEl || !loadEl || !errEl || !refreshBtn) return;

    /** Load the following list */
    const load = async () => {
        errEl.classList.add('d-none');
        loadEl.classList.remove('d-none');
        listEl.innerHTML = '';

        const res = await fetch(`https://v2.api.noroff.dev/social/profiles/${encodeURIComponent(profileName)}?_following=true`, {
            headers: getAuthHeaders(),
        });
        const result = await res.json();
        const following = result?.data?.following || [];
        listEl.innerHTML = following.length
            ? following.map(f => {
          const name = (f?.name || 'Unknown');
          const avatar = f?.avatar?.url ? f.avatar.url : '';
                const alt = f?.avatar?.alt || `${name} avatar`;
                return `
                  <li class="list-group-item d-flex align-items-center">
                    ${avatar ? `<img src="${avatar}" alt="${alt}" class="rounded-circle me-2" width="28" height="28">` : `<span class="rounded-circle bg-secondary d-inline-flex justify-content-center align-items-center me-2" style="width:28px;height:28px;color:white;font-size:.8rem;">${name.charAt(0).toUpperCase()}</span>`}
                    <span class="me-auto">${name}</span>
                    <div class="d-flex flex-column flex-sm-row gap-2">
                      <a class="btn btn-sm btn-outline-info w-100 w-sm-auto" href="/pages/posts/user-post.html?author=${encodeURIComponent(name)}">View</a>
                      <button type="button" class="btn btn-sm btn-outline-danger unfollow-btn w-100 w-sm-auto" data-name="${name}">Unfollow</button>
                    </div>
                  </li>`;
              }).join('')
            : '<li class="list-group-item text-muted">You are not following anyone yet.</li>';

        loadEl.classList.add('d-none');

        listEl.addEventListener('click', async (e) => {
            const btn = e.target.closest('.unfollow-btn');
            if (!btn) return;

            const profile = btn.getAttribute('data-name');
            if (!profile) return;

            if (!confirm(`Unfollow ${profile}?`)) return;

            try {
                const res = await fetch(`https://v2.api.noroff.dev/social/profiles/${encodeURIComponent(profile)}/unfollow`, {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                });
                const result = await res.json().catch(() => ({}));
                if (!res.ok) {
                    alert(result?.errors?.[0]?.message || `HTTP ${res.status}`);
                    return;
                }
        // Refresh list
                await load();
            } catch (err) {
                alert(err?.message || 'Network error');
            }
        });
    };

    refreshBtn.addEventListener('click', load);
    await load();
}