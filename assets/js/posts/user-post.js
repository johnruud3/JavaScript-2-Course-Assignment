import { loadComponents, setFavicon } from '../components.js';
import { getPostsByProfile } from './posts.js';
import { getAuthHeaders } from '../auth/auth.js';

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
    initUserPostsPage();
});

function initUserPostsPage() {
    const params = new URLSearchParams(window.location.search);
    const author = params.get('author');

    const titleEl = document.getElementById('authorTitle');
    const gridEl = document.getElementById('userPostsGrid');
    if (!author || !titleEl || !gridEl) return;

    titleEl.textContent = `${author}'s posts`;
    gridEl.innerHTML = '';

    renderUserPosts(author, gridEl);
}

async function renderUserPosts(authorName, gridEl) {
    setupReactions(gridEl);
    const res = await getPostsByProfile(authorName);
    const posts = Array.isArray(res?.data) ? res.data : [];
    gridEl.innerHTML = posts.length
        ? posts.map(createPostCardHtml).join('')
        : '<div class="col-12"><div class="alert alert-info m-0">No posts yet.</div></div>';
}

function sanitizeText(value) {
    if (typeof value !== 'string') return '';
    return value.replace(/[<>]/g, '');
}

function createPostCardHtml(post) {
    const title = sanitizeText(post?.title) || 'Untitled';
    const body = sanitizeText(post?.body) || '';
    const created = formatDate(post?.created);
    const comments = Number(post?._count?.comments || 0);
    const totalReactions = Number(post?._count?.reactions || 0);
    const imageUrl = sanitizeUrl(post?.media?.url);
    const imageAlt = sanitizeText(post?.media?.alt) || title;
    const postId = post?.id;
    const authorName = sanitizeText(post?.author?.name) || 'Unknown';
    const authorAvatar = sanitizeUrl(post?.author?.avatar?.url);
    const authorAlt = sanitizeText(post?.author?.avatar?.alt) || `${authorName} avatar`;
    const profileUrl = `/pages/posts/user-post.html?author=${encodeURIComponent(authorName)}`;
    const postUrl = postId !== undefined ? `/pages/posts/single-post.html?id=${encodeURIComponent(postId)}` : '';
    const isActive = isPostLocallyLiked(postId);

    return `
    <div class="col-12 col-sm-6 col-lg-4">
        <div class="card h-100 shadow-sm">
            ${imageUrl ? (postUrl ? `<a href="${postUrl}" class="text-decoration-none"><img src="${imageUrl}" class="card-img-top" alt="${imageAlt}"></a>` : `<img src="${imageUrl}" class="card-img-top" alt="${imageAlt}">`) : ''}
            <div class="card-body d-flex flex-column">
                <h5 class="card-title">${postUrl ? `<a href="${postUrl}" class="text-decoration-none">${title}</a>` : title}</h5>
                <p class="card-text text-muted mb-2">${truncate(body, 140)}</p>
                <div class="mt-auto d-flex flex-column">
                    <div class="d-flex align-items-center mb-2">
                        <a href="${profileUrl}" class="d-inline-flex align-items-center text-decoration-none">
                            ${authorAvatar ? `<img src="${authorAvatar}" alt="${authorAlt}" class="rounded-circle me-2" width="28" height="28">` : `<span class="rounded-circle bg-secondary d-inline-flex justify-content-center align-items-center me-2" style="width:28px;height:28px;color:white;font-size:.8rem;">${authorName.charAt(0).toUpperCase()}</span>`}
                            <small class="text-body-secondary">${authorName}</small>
                        </a>
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-secondary">${created}</small>
                        <div class="text-nowrap">
                            <span class="me-3"><i class="bi bi-chat"></i> ${comments}</span>
                            ${postId !== undefined ? `<button type="button" class="btn btn-sm ${isActive ? 'btn-primary' : 'btn-outline-primary'} react-btn" data-post-id="${postId}">
                                <i class="bi ${isActive ? 'bi-hand-thumbs-up-fill' : 'bi-hand-thumbs-up'}"></i> <span class="react-count">${totalReactions}</span>
                            </button>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
}

function truncate(text, max) {
    if (!text) return '';
    return text.length > max ? `${text.slice(0, max - 1)}…` : text;
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
