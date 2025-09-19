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
    await renderMyPosts(user.name);
  });

// "Loading" Your profile posts from the API
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

    // Check if the join is successful in the container. If not use forEach!!!
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
              <a href="../posts/single-post.html?id=${post.id}" class="btn btn-sm btn-info text-white">View</a>
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