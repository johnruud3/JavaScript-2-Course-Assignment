import { loadComponents, setFavicon } from '../components.js';
import { getPostsByProfile } from './posts.js';

document.addEventListener('DOMContentLoaded', () => {
    setFavicon();
    loadComponents();
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
                        ${authorAvatar ? `<img src="${authorAvatar}" alt="${authorAlt}" class="rounded-circle me-2" width="28" height="28">` : `<span class="rounded-circle bg-secondary d-inline-flex justify-content-center align-items-center me-2" style="width:28px;height:28px;color:white;font-size:.8rem;">${authorName.charAt(0).toUpperCase()}</span>`}
                        <small class="text-body-secondary">${authorName}</small>
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-secondary">${created}</small>
                        <div class="text-nowrap">
                            <span class="me-3"><i class="bi bi-chat"></i> ${comments}</span>
                            <span><i class="bi bi-hand-thumbs-up"></i> ${reactions}</span>
                        </div>
                    </div>
                </div>
                ${postId !== undefined ? `<a href="/pages/posts/single-post.html?id=${encodeURIComponent(postId)}" class="stretched-link"></a>` : ''}
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

