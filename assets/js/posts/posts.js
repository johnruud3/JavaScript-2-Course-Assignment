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
        const response = await fetch('https://v2.api.noroff.dev/social/posts', {
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