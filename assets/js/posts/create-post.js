import { loadComponents, setFavicon } from '../components.js';
import { isLoggedIn } from '../auth/auth.js';
import { createPost } from './posts.js';

document.addEventListener('DOMContentLoaded', () => {
    if (!isLoggedIn()) {
        alert('You need to be logged in to create a post');
        window.location.href = '../auth/login.html';
        return;
    }

    setFavicon();
    loadComponents();
    
    const form = document.getElementById('createPostForm');
    form.addEventListener('submit', handleCreatePost);
});

async function handleCreatePost(e) {
    e.preventDefault();
    
    const titleInput = document.getElementById('title');
    const contentInput = document.getElementById('content');
    const mediaUrlInput = document.getElementById('mediaUrl');
    const mediaAltInput = document.getElementById('mediaAlt');
    
    const postData = {
        title: titleInput.value.trim(),
        body: contentInput.value.trim(),
      };

      const url = (mediaUrlInput.value || '').trim();
      const alt = (mediaAltInput.value || '').trim();
      if (url) {
        postData.media = {
          url: url,
          alt: alt
        };
      }
    
    try {
        const result = await createPost(postData);
        if (result.success) {
          alert('Post created successfully!');
          window.location.href = '../../index.html';
        } else {
          alert(result.message || 'Failed to create post');
        }
      } catch (error) {
        alert('Network error - please try again');
      }
}