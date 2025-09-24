import { loadComponents, setFavicon } from './components.js';
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
    const reactions = Number(post?._count?.reactions || 0);
    const imageUrl = sanitizeUrl(post?.media?.url);
    const imageAlt = sanitizeText(post?.media?.alt) || title;
    const postId = post?.id;
    const authorName = sanitizeText(post?.author?.name) || 'Unknown';
    const authorAvatar = sanitizeUrl(post?.author?.avatar?.url);
    const authorAlt = sanitizeText(post?.author?.avatar?.alt) || `${authorName} avatar`;

    return `
    <div class="col-12 col-sm-6 col-lg-4">
        <div class="card h-100 shadow-sm">
            ${imageUrl ? `<img src="${imageUrl}" class="card-img-top" alt="${imageAlt}">` : ''}
            <div class="card-body d-flex flex-column">
                <h5 class="card-title">${title}</h5>
                <p class="card-text text-muted mb-2">${truncate(body, 140)}</p>
                <div class="mt-auto d-flex flex-column">
                    <div class="d-flex align-items-center mb-2">
                        ${authorAvatar ? `<img src="${authorAvatar}" class="rounded-circle me-2" width="28" height="28">` : `<span class="rounded-circle bg-secondary d-inline-flex justify-content-center align-items-center me-2" style="width:28px;height:28px;color:white;font-size:.8rem;">${authorName.charAt(0).toUpperCase()}</span>`}
                        <small class="text-body-secondary">${authorName}</small>
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-secondary">${created}</small>
                         <div class="text-nowrap">
                            <span class="me-3"><i class="bi bi-chat"></i> ${comments}</span>
                            <button><i class="bi bi-hand-thumbs-up"></i> ${reactions}</button>
                        </div>
                    </div>
                </div>
                ${postId !== undefined ? `<a href="/pages/posts/single-post.html?id=${encodeURIComponent(postId)}" class="stretched-link"></a>` : ''}
            </div>
        </div>
    </div>`;
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