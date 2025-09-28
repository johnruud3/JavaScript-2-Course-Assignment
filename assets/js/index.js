import { loadComponents, setFavicon } from './components.js';
import { getAuthHeaders } from './auth/auth.js';
import { getAllPosts } from './posts/posts.js';

console.log('Index.js module loaded successfully');

document.addEventListener('DOMContentLoaded', () => {
    setFavicon();
    loadComponents();
    initializeHomePagePosts();
});

function initializeHomePagePosts() {
    const spinnerContainer = document.getElementById('postsLoading');
    const errorAlert = document.getElementById('postsError');
    const postsContainer = document.getElementById('postsGrid');

    if (!spinnerContainer) {
        console.error('Missing #postsLoading element');
        return;
    }
    if (!errorAlert) {
        console.error('Missing #postsError element');
        return;
    }
    if (!postsContainer) {
        console.error('Missing #postsGrid element');
        return;
    }

    errorAlert.classList.add('d-none');
    spinnerContainer.classList.remove('d-none');
    postsContainer.innerHTML = '';

    setupReactions(postsContainer);

    renderAllPosts(spinnerContainer, errorAlert, postsContainer);
}

async function renderAllPosts(spinnerContainer, errorAlert, postsContainer) {
    try {
        const result = await getAllPosts();
        if (!result.success) {
            throw new Error(result.message || 'Failed to load posts');
        }

        const posts = Array.isArray(result.data) ? result.data : [];
        window.__ALL_POSTS_CACHE__ = posts;
        setupSearch(postsContainer);

        if (posts.length === 0) {
            postsContainer.innerHTML = `<div class="col-12"><div class="alert alert-info m-0">No posts yet. Be the first to post!</div></div>`;
            return;
        }

        const cards = posts.map(createPostCardHtml).join('');
        postsContainer.innerHTML = cards;
    } catch (err) {
        errorAlert.textContent = err.message || 'Something went wrong';
        errorAlert.classList.remove('d-none');
    } finally {
        spinnerContainer.classList.add('d-none');
    }
}

function setupSearch(postsContainer) {
    const searchInput = document.getElementById('postsSearch');
    const clearButton = document.getElementById('clearSearch');
    if (!searchInput || !clearButton) return;

    const performFilter = () => {
        const query = (searchInput.value || '').trim().toLowerCase();
        const allPosts = Array.isArray(window.__ALL_POSTS_CACHE__) ? window.__ALL_POSTS_CACHE__ : [];
        const filtered = query
            ? allPosts.filter(p =>
                (p.title || '').toLowerCase().includes(query) ||
                (p.author?.name || '').toLowerCase().includes(query)
              )
            : allPosts;
        postsContainer.innerHTML = filtered.length
            ? filtered.map(createPostCardHtml).join('')
            : `<div class="col-12"><div class="alert alert-warning m-0">No results for "${sanitizeText(query)}"</div></div>`;
    };

    searchInput.addEventListener('input', performFilter);
    clearButton.addEventListener('click', () => {
        searchInput.value = '';
        performFilter();
        searchInput.focus();
    });
}



function createPostCardHtml(post) {
    const title = sanitizeText(post?.title) || 'Untitled';
    const body = sanitizeText(post?.body) || '';
    const created = formatDate(post?.created);
    const comments = Number(post?._count?.comments || 0);
    const totalReactions = Number(post?._count?.reactions || 0);
    const postId = post?.id;
    const isActive = isPostLocallyLiked(postId);
    const imageUrl = sanitizeUrl(post?.media?.url);
    const imageAlt = sanitizeText(post?.media?.alt) || title;
    const authorName = sanitizeText(post?.author?.name) || 'Unknown';
    const authorAvatar = sanitizeUrl(post?.author?.avatar?.url);
    const authorAlt = sanitizeText(post?.author?.avatar?.alt) || `${authorName} avatar`;
    const profileUrl = `/pages/posts/user-post.html?author=${encodeURIComponent(authorName)}`;
    const postUrl = postId !== undefined ? `/pages/posts/single-post.html?id=${encodeURIComponent(postId)}` : '';

    return `
    <div class="col-12 col-sm-6 col-lg-4">
        <div class="card h-100 shadow-sm">
            ${imageUrl ? (postUrl ? `<a href="${postUrl}" class="text-decoration-none"><img src="${imageUrl}" class="card-img-top" alt="${imageAlt}"></a>` : `<img src="${imageUrl}" class="card-img-top" alt="${imageAlt}">`) : ''}
            <div class="card-body d-flex flex-column">
                <h5 class="card-title">${postUrl ? `<a href="${postUrl}" class="text-info text-decoration-none">${title}</a>` : title}</h5>
                <p class="card-text text-muted mb-2">${truncate(body, 140)}</p>
                <div class="mt-auto d-flex flex-column">
                    <div class="d-flex align-items-center mb-2">
                        <a href="${profileUrl}" class="d-inline-flex align-items-center text-decoration-none">
                            ${authorAvatar ? `<img src="${authorAvatar}" alt="${authorAlt}" class="rounded-circle me-2" width="28" height="28">` 
                                : `<span class="rounded-circle bg-secondary d-inline-flex justify-content-center align-items-center me-2" style="width:28px;height:28px;color:white;font-size:.8rem;">${authorName.charAt(0).toUpperCase()}</span>`}
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
        const symbol = button.getAttribute('data-symbol')|| '👍';
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


// Cutting text to have controll over how much text are beeing used on the cards in homepage.
function truncate(text, max) {
    if (!text) return '';
    return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

// Safety in case text suddenly display HTML code or anything else than normal text.
function sanitizeText(value) {
    if (typeof value !== 'string') return '';
    return value.replace(/[<>]/g, '');
}

// Protection for unsafe/invalid URL´s.
function sanitizeUrl(url) {
    if (typeof url !== 'string') return '';
    try {
        const parsed = new URL(url, window.location.origin);
        return parsed.href;
    } catch {
        return '';
    }
}

// Cleans up the shown date on cards.
function formatDate(iso) {
    if (!iso) return '';
    try {
        const d = new Date(iso);
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return '';
    }
}