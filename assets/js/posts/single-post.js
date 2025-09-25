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
                    <button id="followBtn" type="button" class="btn btn-outline-info btn-sm" data-author="${authorName}" data-following="false">
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

async function setupFollowButton(authorName) {
    const btn = document.getElementById('followBtn');
    if (!btn || !authorName) return;

    const token = localStorage.getItem('accessToken');
    if (!token) {
        btn.disabled = true;
        btn.title = 'Login to follow';
        return;
    }

    // Determine initial state by checking if current user already follows the author
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
        // ignore init errors
    }

    btn.addEventListener('click', async () => {
        const isFollowing = btn.getAttribute('data-following') === 'true';
        btn.disabled = true;
        try {
            if (isFollowing) {
                const res = await unfollowProfile(authorName);
                if (res.success) {
                    setFollowButtonState(btn, false);
                } else {
                    alert(res.message || 'Failed to unfollow');
                }
            } else {
                const res = await followProfile(authorName);
                if (res.success) {
                    setFollowButtonState(btn, true);
                } else {
                    alert(res.message || 'Failed to follow');
                }
            }
        } finally {
            btn.disabled = false;
        }
    });
}

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

function truncate(text, max) {
    if (!text) return '';
    return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function sanitizeText(value) {
    if (typeof value !== 'string') return '';
    return value.replace(/[<>]/g, '');
}

function sanitizeUrl(url) {
    if (typeof url !== 'string') return '';
    try {
        const parsed = new URL(url, window.location.origin);
        return parsed.href;
    } catch {
        return '';
    }
}

function formatDate(dateString) {
    if (!dateString) return '';
    try {
        const d = new Date(dateString);
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return '';
    }
}

function getLikesKey() {
    const username = localStorage.getItem('userName');
    return `localLikedPosts:${username}`;
}
  
 // Translation
function getLocalLikesMap() {
    try {
        const raw = localStorage.getItem(getLikesKey());
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}
  
function setLocalPostLike(postId, isLiked) {
    const map = getLocalLikesMap();
    if (isLiked) {
        map[String(postId)] = true;
    } else {
        delete map[String(postId)];
    }
    localStorage.setItem(getLikesKey(), JSON.stringify(map));
}
  
function isPostLocallyLiked(postId) {
    return !!getLocalLikesMap()
    [String(postId)];
}

// Fetch from the API and get the returned amount of reacts
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
            // Infer toggle from previous visual state; remember locally
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


