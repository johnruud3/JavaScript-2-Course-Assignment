import { loadComponents, setFavicon } from '../components.js';
import { getAuthHeaders } from '../auth/auth.js';
import { getCurrentUser } from '../auth/auth.js';
import { getPost, getPostsByProfile } from './posts.js';

document.addEventListener('DOMContentLoaded', () => {
    setFavicon();
    loadComponents();
    const back = document.getElementById('backLink');
    if (back) {
        back.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.location.href = '/';
            }
        });
    }
    initSinglePostPage();
});

/**
 * Initialize the single post page by extracting the post ID from the URL
 * and rendering the post.
 */
function initSinglePostPage() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    const loadingEl = document.getElementById('singlePostLoading');
    const errorEl = document.getElementById('singlePostError');
    const containerEl = document.getElementById('singlePostContainer');

    if (!id) {
        errorEl.textContent = 'Missing post id';
        errorEl.classList.remove('d-none');
        return;
    }

    errorEl.classList.add('d-none');
    loadingEl.classList.remove('d-none');
    containerEl.innerHTML = '';

    renderSinglePost(id, loadingEl, errorEl, containerEl);
}

/**
 * Fetch and render a single post by ID.
 *
 * @param {string} id - The post ID.
 * @param {HTMLElement} loadingEl - Loading indicator element.
 * @param {HTMLElement} errorEl - Error message element.
 * @param {HTMLElement} containerEl - Container to render post.
 * @returns {Promise<void>}
 */
async function renderSinglePost(id, loadingEl, errorEl, containerEl) {
    try {
        const res = await getPost(id);
        if (!res.success) throw new Error(res.message || 'Failed to load post');
        const post = res.data;

        containerEl.innerHTML = createSinglePostHtml(post);
        setupReactions(containerEl);

        const authorName = post?.author?.name;
        if (authorName) {
            renderAuthorPosts(authorName, post.id);
        }

        setupFollowButton(authorName);
    } catch (err) {
        errorEl.textContent = err.message || 'Something went wrong';
        errorEl.classList.remove('d-none');
    } finally {
        loadingEl.classList.add('d-none');
    }
}

/**
 * Render other posts by the same author.
 *
 * @param {string} authorName - The author’s name.
 * @param {string|number} excludePostId - Post ID to exclude from the list.
 * @returns {Promise<void>}
 */
async function renderAuthorPosts(authorName, excludePostId) {
    const loading = document.getElementById('authorPostsLoading');
    const error = document.getElementById('authorPostsError');
    const grid = document.getElementById('authorPostsGrid');
    if (!loading || !error || !grid) return;

    error.classList.add('d-none');
    loading.classList.remove('d-none');
    grid.innerHTML = '';

    try {
        const res = await getPostsByProfile(authorName);
        if (!res.success) throw new Error(res.message || 'Failed to load author posts');
        const posts = (res.data || []).filter(p => p.id !== excludePostId);
        grid.innerHTML = posts.length ? posts.map(createMiniCardHtml).join('') : `<div class="col-12"><div class="alert alert-info m-0">No more posts from ${sanitizeText(authorName)}.</div></div>`;
    } catch (err) {
        error.textContent = err.message || 'Something went wrong';
        error.classList.remove('d-none');
    } finally {
        loading.classList.add('d-none');
    }
}

/**
 * Generate HTML for a single post view.
 *
 * @param {Object} post - Post object from the API.
 * @returns {string} HTML string.
 */
function createSinglePostHtml(post) {
    const title = sanitizeText(post?.title) || 'Untitled';
    const body = sanitizeText(post?.body) || '';
    const created = formatDate(post?.created);
    const comments = Number(post?._count?.comments || 0);
    const totalReactions = Number(post?._count?.reactions || 0);
    const imageUrl = sanitizeUrl(post?.media?.url);
    const imageAlt = sanitizeText(post?.media?.alt) || title;
    const authorName = sanitizeText(post?.author?.name) || 'Unknown';
    const authorAvatar = sanitizeUrl(post?.author?.avatar?.url);
    const authorAlt = sanitizeText(post?.author?.avatar?.alt) || `${authorName} avatar`;
    const postId = post?.id;
    const hasToken = !!localStorage.getItem('accessToken');
    const isActive = hasToken && isPostLocallyLiked(postId);
    const profileUrl = `/pages/posts/user-post.html?author=${encodeURIComponent(authorName)}`;

    return `
    <article class="card shadow-sm">
        ${imageUrl ? `<img src="${imageUrl}" class="card-img-top" alt="${imageAlt}">` : ''}
        <div class="card-body">
            <h1 class="h3">${title}</h1>
            <div class="d-flex align-items-center mb-3">
                <a href="${profileUrl}" class="d-inline-flex align-items-center text-decoration-none">
                    ${authorAvatar ? `<img src="${authorAvatar}" alt="${authorAlt}" class="rounded-circle me-2" width="32" height="32">` : `<span class="rounded-circle bg-secondary d-inline-flex justify-content-center align-items-center me-2" style="width:32px;height:32px;color:white;">${authorName.charAt(0).toUpperCase()}</span>`}
                    <small class="text-body-secondary">${authorName}</small>
                </a>
                <div class="ms-auto d-flex align-items-center gap-2">
                    <button id="followBtn" type="button" class="btn btn-outline-info btn-sm py-0 px-1 py-sm-1 px-sm-2" data-author="${authorName}" data-following="false">
                        <i class="bi bi-person-plus"></i> Follow
                    </button>
                    <small class="text-secondary">${created}</small>
                </div>
            </div>
             <div class="d-flex justify-content-end text-nowrap">
                <span class="me-3"><i class="bi bi-chat"></i> ${comments}</span>
                ${postId !== undefined ? `<button type="button" class="btn btn-sm ${isActive ? 'btn-primary' : 'btn-outline-primary'} react-btn" data-post-id="${postId}" ${hasToken ? '' : 'disabled title="Login to react"'}>
                    <i class="bi ${isActive ? 'bi-hand-thumbs-up-fill' : 'bi-hand-thumbs-up'}"></i> <span class="react-count">${totalReactions}</span>
                </button>` : ''}
             </div>
            <p class="mb-0">${body.replace(/\n/g, '<br>')}</p>
        </div>
    </article>`;
}

/**
 * Generate a mini card HTML for posts listing.
 *
 * @param {Object} post - Post object.
 * @returns {string} HTML string.
 */
function createMiniCardHtml(post) {
    const title = sanitizeText(post?.title) || 'Untitled';
    const body = sanitizeText(post?.body) || '';
    const imageUrl = sanitizeUrl(post?.media?.url);
    const imageAlt = sanitizeText(post?.media?.alt) || title;
    const postId = post?.id;

    return `
    <div class="col-12 col-sm-6 col-lg-4">
        <div class="card h-100 shadow-sm">
            ${imageUrl ? `<img src="${imageUrl}" class="card-img-top" alt="${imageAlt}">` : ''}
            <div class="card-body">
                <h3 class="h6 mb-1">${title}</h3>
                <p class="text-muted mb-0">${truncate(body, 100)}</p>
                ${postId !== undefined ? `<a href="/pages/posts/single-post.html?id=${encodeURIComponent(postId)}" class="stretched-link"></a>` : ''}
            </div>
        </div>
    </div>`;
}

/**
 * Set up follow/unfollow button logic for an author.
 *
 * @param {string} authorName - Author to follow/unfollow.
 * @returns {Promise<void>}
 */
async function setupFollowButton(authorName) {
    const btn = document.getElementById('followBtn');
    if (!btn || !authorName) return;

    
    const hasToken = !!localStorage.getItem('accessToken');
    if (hasToken) {
        try {
            const current = getCurrentUser();
            if (current?.name) {
                const res = await fetch(`https://v2.api.noroff.dev/social/profiles/${encodeURIComponent(current.name)}?_following=true`, {
                    headers: getAuthHeaders(),
                });
                const result = await res.json();
                if (res.ok) {
                    const following = result?.data?.following || [];
                    const isFollowing = following.some(f => (f?.name || '').toLowerCase() === authorName.toLowerCase());
                    setFollowButtonState(btn, isFollowing);
                }
            }
        } catch (_) {
            // ignore these errors
        }
    }

    btn.addEventListener('click', async () => {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const token = localStorage.getItem('accessToken');
        if (!isLoggedIn || !token) {
            alert('You must be logged in to follow!');
            return;
        }

        const isFollowing = btn.getAttribute('data-following') === 'true';
        btn.disabled = true;
        try {
            const res = isFollowing ? await unfollowProfile(authorName) : await followProfile(authorName);
            if (res.success) {
                setFollowButtonState(btn, !isFollowing);
            } else {
                alert(res.message || (isFollowing ? 'Failed to unfollow' : 'Failed to follow'));
            }
        } finally {
            btn.disabled = false;
        }
    });
}

/**
 * Update the follow button UI state.
 *
 * @param {HTMLElement} btn - Button element.
 * @param {boolean} isFollowing - Whether currently following.
 */
function setFollowButtonState(btn, isFollowing) {
    btn.setAttribute('data-following', isFollowing ? 'true' : 'false');
    if (isFollowing) {
        btn.classList.remove('btn-outline-info');
        btn.classList.add('btn-info');
        btn.innerHTML = '<i class="bi bi-person-check"></i> Following';
    } else {
        btn.classList.remove('btn-info');
        btn.classList.add('btn-outline-info');
        btn.innerHTML = '<i class="bi bi-person-plus"></i> Follow';
    }
}

/**
 * Follow a profile by name.
 *
 * @param {string} profileName - The profile name to follow.
 * @returns {Promise<Object>} Result object with success flag and message.
 */
async function followProfile(profileName) {
    try {
        const response = await fetch(`https://v2.api.noroff.dev/social/profiles/${encodeURIComponent(profileName)}/follow`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            const result = await response.json().catch(() => ({}));
            const message = result?.errors?.[0]?.message || `HTTP ${response.status}`;
            return { success: false, message };
        }
        return { success: true };
    } catch (error) {
        return { success: false, message: error.message || 'Network error' };
    }
}

/**
 * Unfollow a profile by name.
 *
 * @param {string} profileName
 * @returns {Promise<Object>} Result object with success flag and message.
 */
async function unfollowProfile(profileName) {
    try {
        const response = await fetch(`https://v2.api.noroff.dev/social/profiles/${encodeURIComponent(profileName)}/unfollow`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            const result = await response.json().catch(() => ({}));
            const message = result?.errors?.[0]?.message || `HTTP ${response.status}`;
            return { success: false, message };
        }
        return { success: true };
    } catch (error) {
        return { success: false, message: error.message || 'Network error' };
    }
}

/**
 * Truncate text to a max length.
 *
 * @param {string} text
 * @param {number} max
 * @returns {string}
 */
function truncate(text, max) {
    if (!text) return '';
    return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/**
 * Sanitize text for safe HTML output.
 *
 * @param {string} value
 * @returns {string}
 */
function sanitizeText(value) {
    if (typeof value !== 'string') return '';
    return value.replace(/[<>]/g, '');
}

/**
 * Sanitize a URL string.
 *
 * @param {string} url
 * @returns {string}
 */
function sanitizeUrl(url) {
    if (typeof url !== 'string') return '';
    try {
        const parsed = new URL(url, window.location.origin);
        return parsed.href;
    } catch {
        return '';
    }
}

/**
 * Format a date string for display.
 *
 * @param {string} dateString
 * @returns {string}
 */
function formatDate(dateString) {
    if (!dateString) return '';
    try {
        const d = new Date(dateString);
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return '';
    }
}

/**
 * Get local storage key for post likes.
 *
 * @returns {string}
 */
function getLikesKey() {
    const username = localStorage.getItem('userName');
    return `localLikedPosts:${username}`;
}
  
/**
 * Get local likes map from localStorage.
 *
 * @returns {Object}
 */
function getLocalLikesMap() {
    try {
        const raw = localStorage.getItem(getLikesKey());
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}
  
/**
 * Set a post as liked/unliked locally.
 *
 * @param {string|number} postId
 * @param {boolean} isLiked
 */
function setLocalPostLike(postId, isLiked) {
    const map = getLocalLikesMap();
    if (isLiked) {
        map[String(postId)] = true;
    } else {
        delete map[String(postId)];
    }
    localStorage.setItem(getLikesKey(), JSON.stringify(map));
}
  
/**
 * Check if a post is locally liked.
 *
 * @param {string|number} postId
 * @returns {boolean}
 */
function isPostLocallyLiked(postId) {
    return !!getLocalLikesMap()
    [String(postId)];
}

/**
 * Set up reactions for a posts container.
 *
 * @param {HTMLElement} postsContainer - Posts container element.
 * @returns {Promise<void>}
 */
function setupReactions(postsContainer) {
    if (!postsContainer) return;
    postsContainer.addEventListener('click', async (event) => {
        const button = event.target.closest('.react-btn');
        if (!button || !postsContainer.contains(button)) return;
        event.preventDefault();

        const postId = button.getAttribute('data-post-id');
        const symbol = button.getAttribute('data-symbol') || '👍';
        if (!postId) return;

        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const token = localStorage.getItem('accessToken');
        if (!isLoggedIn || !token) {
            alert('You must be logged in to react.');
            return;
        }

        const countEl = button.querySelector('.react-count');
        const icon = button.querySelector('i');
        const wasActive = button.classList.contains('btn-primary');
        button.disabled = true;
        try {
            const headers = getAuthHeaders();
            if (headers && headers['Content-Type']) delete headers['Content-Type'];
            const response = await fetch(`https://v2.api.noroff.dev/social/posts/${encodeURIComponent(postId)}/react/${encodeURIComponent(symbol)}`, {
                method: 'PUT',
                headers,
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) {
                const message = result?.errors?.[0]?.message || `HTTP ${response.status}`;
                alert(message);
                return;
            }
            const reactions = Array.isArray(result?.data?.reactions) ? result.data.reactions : [];
            const total = reactions.reduce((sum, r) => sum + Number(r?.count || 0), 0);
            if (countEl) countEl.textContent = String(total);
            const isActive = !wasActive;
            setLocalPostLike(postId, isActive);
            button.classList.toggle('btn-primary', isActive);
            button.classList.toggle('btn-outline-primary', !isActive);
            if (icon) {
                icon.classList.toggle('bi-hand-thumbs-up-fill', isActive);
                icon.classList.toggle('bi-hand-thumbs-up', !isActive);
            }
        } catch (err) {
            alert(err?.message || 'Network error');
        } finally {
            button.disabled = false;
        }
    });
}


