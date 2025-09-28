import { loadComponents, setFavicon } from '../components.js';
import { isLoggedIn } from '../auth/auth.js';
import { getPost, updatePost, deletePost } from './posts.js';

document.addEventListener('DOMContentLoaded', async () => {
    if (!isLoggedIn()) {
        alert('You need to be logged in to edit a post');
        window.location.href = '../auth/login.html';
        return;
    }

    setFavicon();
    loadComponents();
    
    // Get post ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    
    if (!postId) {
        alert('No post ID provided');
        window.location.href = '../auth/user-profile.html';
        return;
    }
    
    // Load the original post data to edit page
    await loadPostData(postId);
    
    // Handle edit/update post button
    const form = document.getElementById('editPostForm');
    form.addEventListener('submit', (e) => handleEditPost(e, postId));

    // Handle delete button 
    const deleteBtn = document.getElementById('deleteBtn');
    deleteBtn.addEventListener('click', () => handleDeletePost(postId));
});

/**
 * Load post data into the edit form.
 *
 * @param {string} postId - The ID of the post to load.
 * @returns {Promise<void>}
 */
async function loadPostData(postId) {
    try {
        const result = await getPost(postId);
        if (result.success) {
            const post = result.data;
            
            document.getElementById('title').value = post.title || '';
            document.getElementById('content').value = post.body || '';
            document.getElementById('mediaUrl').value = post.media?.url || '';
            document.getElementById('mediaAlt').value = post.media?.alt || '';
        } else {
            alert('Failed to load post: ' + result.message);
            window.location.href = '../auth/user-profile.html';
        }
    } catch (error) {
        alert('Error loading post');
        window.location.href = '../auth/user-profile.html';
    }
}

/**
 * Handle editing/updating a post.
 *
 * @param {Event} e - The form submit event.
 * @param {string} postId - The ID of the post to update.
 * @returns {Promise<void>}
 */
async function handleEditPost(e, postId) {
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
        postData.media = { url, alt };
    }
    
    try {
        const result = await updatePost(postId, postData);
        if (result.success) {
            alert('Post updated successfully!');
            window.location.href = '../auth/user-profile.html';
        } else {
            alert(result.message || 'Failed to update post');
        }
    } catch (error) {
        alert('Network error - please try again');
    }
}

/**
 * Handle deleting a post.
 *
 * @param {string} postId - The ID of the post to delete.
 * @returns {Promise<void>}
 */
async function handleDeletePost(postId) {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
        return;
    }
    
    try {
        const result = await deletePost(postId);
        if (result.success) {
            alert('Post deleted successfully!');
            window.location.href = '../auth/user-profile.html';
        } else {
            alert(result.message || 'Failed to delete post');
        }
    } catch (error) {
        alert('Network error - please try again');
    }
}