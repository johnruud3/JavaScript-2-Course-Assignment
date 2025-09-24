import { getAuthHeaders } from '../auth/auth.js';

export async function createPost(postData) {
    try {
        const response = await fetch('https://v2.api.noroff.dev/social/posts', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                title: postData.title,
                body: postData.body,
                tags: postData.tags,
                media: postData.media
            })
        });
        
    const result = await response.json();

    if (!response.ok) {
      const message = result?.errors?.[0]?.message || `HTTP ${response.status}`;
      console.error('Create post failed:', { status: response.status, result });
      return { success: false, message };
    }

    return { success: true, data: result.data, message: 'OK' };
  } catch (error) {
    console.error('Create post network error:', error);
    return { success: false, message: error.message || 'Network error' };
  }
}

// Get all posts from the API
export async function getAllPosts() {
    try {
        const response = await fetch('https://v2.api.noroff.dev/social/posts?_author=true', {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            const message = result?.errors?.[0]?.message || `HTTP ${response.status}`;
            console.error('Get posts failed:', { status: response.status, result });
            return { success: false, message };
        }
        
        return { success: true, data: result.data, meta: result.meta };
    } catch (error) {
        console.error('Get posts network error:', error);
        return { success: false, message: error.message || 'Network error' };
    }
}

// Get all posts by a specific profile, with URL safety for username.
export async function getPostsByProfile(profileName) {
    if (!profileName) {
        return { success: false, message: 'Profile name is required' };
    }
    try {
        const response = await fetch(`https://v2.api.noroff.dev/social/profiles/${encodeURIComponent(profileName)}/posts?_author=true`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        const result = await response.json();

        if (!response.ok) {
            const message = result?.errors?.[0]?.message || `HTTP ${response.status}`;
            console.error('Get posts by profile failed:', { status: response.status, result });
            return { success: false, message };
        }

        return { success: true, data: result.data, meta: result.meta };
    } catch (error) {
        console.error('Get posts by profile network error:', error);
        return { success: false, message: error.message || 'Network error' };
    }
}

export async function getPost(id) {
    try {
        const response = await fetch(`https://v2.api.noroff.dev/social/posts/${id}?_author=true`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            const message = result?.errors?.[0]?.message || `HTTP ${response.status}`;
            console.error('Get post failed:', { status: response.status, result });
            return { success: false, message };
        }
        
        return { success: true, data: result.data };
    } catch (error) {
        console.error('Get post network error:', error);
        return { success: false, message: error.message || 'Network error' };
    }
}

// Update a post
export async function updatePost(id, postData) {
    try {
        const response = await fetch(`https://v2.api.noroff.dev/social/posts/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                title: postData.title,
                body: postData.body,
                tags: postData.tags || [],
                media: postData.media || { url: '', alt: '' }
            })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            const message = result?.errors?.[0]?.message || `HTTP ${response.status}`;
            console.error('Update post failed:', { status: response.status, result });
            return { success: false, message };
        }
        
        return { success: true, data: result.data, message: 'Post updated successfully' };
    } catch (error) {
        console.error('Update post network error:', error);
        return { success: false, message: error.message || 'Network error' };
    }
}

export async function deletePost(id) {
    try {
        const response = await fetch(`https://v2.api.noroff.dev/social/posts/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const result = await response.json();
            const message = result?.errors?.[0]?.message || `HTTP ${response.status}`;
            console.error('Delete post failed:', { status: response.status, result });
            return { success: false, message };
        }

        return { success: true, message: 'Post deleted successfully' };
    } catch (error) {
        console.error('Delete post network error:', error);
        return { success: false, message: error.message || 'Network error' };
    }
}