import { loadComponents, setFavicon } from './components.js';

console.log('Index.js module loaded successfully');

document.addEventListener('DOMContentLoaded', function() {
    setFavicon();
    loadComponents();
});