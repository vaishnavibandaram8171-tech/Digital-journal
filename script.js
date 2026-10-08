// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// App State
let currentEntryIndex = null;
let allEntries = [];
let allPhotos = [];
let moodHistory = [];

// Initialize App
function initializeApp() {
    loadDataFromLocalStorage();
    setupEventListeners();
    updateCurrentDate();
    renderEntries();
    initializeMoodChart();
}

// Setup Event Listeners
function setupEventListeners() {
    // Navigation tabs
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', handleTabSwitch);
    });

    // Entry modal
    document.getElementById('new-entry-btn').addEventListener('click', openEntryModal);
    document.getElementById('entry-form').addEventListener('submit', handleSaveEntry);
    document.getElementById('cancel-entry-btn').addEventListener('click', closeEntryModal);

    // Photo modal
    document.getElementById('upload-photo-btn').addEventListener('click', openPhotoModal);
    document.getElementById('photo-form').addEventListener('submit', handleSavePhoto);

    // Close buttons
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').classList.remove('active');
        });
    });

    // Mood buttons
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.addEventListener('click', handleMoodSelect);
    });

    // Search functionality
    document.getElementById('search-box').addEventListener('input', handleSearch);

    // Delete entry button
    document.getElementById('delete-entry-btn').addEventListener('click', handleDeleteEntry);

    // Modal backdrop click to close
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    });
}

// Tab Switching
function handleTabSwitch(e) {
    const tabName = e.currentTarget.getAttribute('data-tab');
    
    // Update active nav button
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    e.currentTarget.classList.add('active');

    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));

    // Show selected tab
    document.getElementById(tabName).classList.add('active');

    // Update header
    const headerTitles = {
        entries: 'Daily Entries',
        mood: 'Mood Tracker',
        memories: 'Photo Memories',
        about: 'About'
    };
    document.getElementById('page-title').textContent = headerTitles[tabName];

    // Hide search for non-entry tabs
    document.querySelector('.search-box').style.display = tabName === 'entries' ? 'block' : 'none';

    // Refresh mood stats when switching to mood tab
    if (tabName === 'mood') {
        updateMoodStats();
    }
}

// Entry Management
function openEntryModal() {
    document.getElementById('entry-modal').classList.add('active');
    currentEntryIndex = null;
    document.getElementById('entry-form').reset();
    document.getElementById('entry-title').focus();
}

function closeEntryModal() {
    document.getElementById('entry-modal').classList.remove('active');
    document.getElementById('entry-form').reset();
    currentEntryIndex = null;
}

function handleSaveEntry(e) {
    e.preventDefault();

    const title = document.getElementById('entry-title').value.trim();
    const content = document.getElementById('entry-content').value.trim();
    const mood = document.getElementById('entry-mood').value;
    const tagsInput = document.getElementById('entry-tags').value.trim();
    const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()) : [];

    if (!title || !content) {
        alert('Please fill in title and content');
        return;
    }

    const entry = {
        id: Date.now(),
        title,
        content,
        mood,
        tags,
        date: new Date().toLocaleDateString(),
        timestamp: new Date().getTime()
    };

    allEntries.unshift(entry);
    saveDataToLocalStorage();
    closeEntryModal();
    renderEntries();
    showNotification('Entry saved successfully!');
}

function renderEntries(entriesToRender = allEntries) {
    const entriesList = document.getElementById('entries-list');

    if (entriesToRender.length === 0) {
        entriesList.innerHTML = `
            <div class="empty-state">
                <p>No entries yet. Start writing to create your first journal entry!</p>
            </div>
        `;
        return;
    }

    entriesList.innerHTML = entriesToRender.map(entry => `
        <div class="entry-card" onclick="openViewEntryModal(${entry.id})">
            <div class="entry-header">
                <h3 class="entry-title">${escapeHtml(entry.title)}</h3>
                <span class="entry-mood-badge">${getMoodEmoji(entry.mood)}</span>
            </div>
            <div class="entry-meta">
                <span class="entry-date">📅 ${entry.date}</span>
            </div>
            <div class="entry-tags">
                ${entry.tags.map(tag => `<span class="tag">#${escapeHtml(tag)}</span>`).join('')}
            </div>
            <p class="entry-preview">${escapeHtml(entry.content)}</p>
        </div>
    `).join('');
}

function openViewEntryModal(entryId) {
    const entry = allEntries.find(e => e.id === entryId);
    if (!entry) return;

    currentEntryIndex = allEntries.indexOf(entry);

    document.getElementById('view-entry-title').textContent = entry.title;
    document.getElementById('view-entry-date').textContent = `📅 ${entry.date}`;
    document.getElementById('view-entry-mood').textContent = `${getMoodEmoji(entry.mood)} Mood: ${entry.mood}`;
    document.getElementById('view-entry-tags').innerHTML = entry.tags.length > 0 
        ? entry.tags.map(tag => `<span class="tag">#${escapeHtml(tag)}</span>`).join('')
        : '';
    document.getElementById('view-entry-content').textContent = entry.content;

    document.getElementById('view-entry-modal').classList.add('active');
}

function handleDeleteEntry() {
    if (currentEntryIndex !== null && confirm('Are you sure you want to delete this entry?')) {
        allEntries.splice(currentEntryIndex, 1);
        saveDataToLocalStorage();
        document.getElementById('view-entry-modal').classList.remove('active');
        renderEntries();
        showNotification('Entry deleted successfully!');
    }
}

// Search functionality
function handleSearch(e) {
    const searchQuery = e.target.value.toLowerCase();
    
    if (!searchQuery) {
        renderEntries(allEntries);
        return;
    }

    const filtered = allEntries.filter(entry => 
        entry.title.toLowerCase().includes(searchQuery) ||
        entry.content.toLowerCase().includes(searchQuery) ||
        entry.tags.some(tag => tag.toLowerCase().includes(searchQuery))
    );

    renderEntries(filtered);
}

// Mood Tracking
function handleMoodSelect(e) {
    const moodBtn = e.currentTarget;
    document.querySelectorAll('.mood-btn').forEach(btn => btn.classList.remove('active'));
    moodBtn.classList.add('active');

    const mood = moodBtn.getAttribute('data-mood');
    const moodEntry = {
        mood,
        date: new Date().toLocaleDateString(),
        timestamp: new Date().getTime()
    };

    moodHistory.unshift(moodEntry);
    saveDataToLocalStorage();
    updateMoodStats();
    showNotification(`Mood recorded: ${mood}`);
}

function updateMoodStats() {
    // Count moods
    const moodCounts = {};
    moodHistory.forEach(entry => {
        moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
    });

    // Find most frequent mood
    let mostFrequent = '-';
    if (Object.keys(moodCounts).length > 0) {
        mostFrequent = Object.keys(moodCounts).reduce((a, b) => 
            moodCounts[a] > moodCounts[b] ? a : b
        );
    }

    document.getElementById('most-frequent-mood').textContent = mostFrequent;
    document.getElementById('total-moods').textContent = moodHistory.length;

    // Count moods from this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekMoods = moodHistory.filter(m => new Date(m.timestamp) > weekAgo).length;
    document.getElementById('week-moods').textContent = weekMoods;

    updateMoodChart(moodCounts);
}

function initializeMoodChart() {
    const canvas = document.getElementById('mood-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    updateMoodChart({});
}

function updateMoodChart(moodCounts) {
    const canvas = document.getElementById('mood-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const moods = Object.keys(moodCounts);
    const counts = Object.values(moodCounts);

    if (moods.length === 0) {
        ctx.fillStyle = '#7d7d8d';
        ctx.font = '16px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillText('No mood data yet', canvas.width / 2, canvas.height / 2);
        return;
    }

    // Simple bar chart
    const maxCount = Math.max(...counts);
    const barWidth = canvas.width / moods.length;
    const padding = 40;

    // Draw axes
    ctx.strokeStyle = '#e8e8f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width, canvas.height - padding);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(padding, 0);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.stroke();

    // Draw bars
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#f8b4d9');
    gradient.addColorStop(1, '#c9a8e8');

    moods.forEach((mood, index) => {
        const barHeight = (counts[index] / maxCount) * (canvas.height - 2 * padding);
        const x = padding + index * barWidth + barWidth / 4;
        const y = canvas.height - padding - barHeight;

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth / 2, barHeight);

        // Label
        ctx.fillStyle = '#3d3d4d';
        ctx.font = 'bold 12px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillText(getMoodEmoji(mood), x + barWidth / 4, canvas.height - padding + 25);

        // Value
        ctx.fillStyle = '#7d7d8d';
        ctx.font = '12px Segoe UI';
        ctx.fillText(counts[index], x + barWidth / 4, y - 10);
    });
}

// Photo Management
function openPhotoModal() {
    document.getElementById('photo-modal').classList.add('active');
    document.getElementById('photo-date').valueAsDate = new Date();
}

function handleSavePhoto(e) {
    e.preventDefault();

    const fileInput = document.getElementById('photo-file');
    const caption = document.getElementById('photo-caption').value.trim();
    const date = document.getElementById('photo-date').value;

    if (!fileInput.files.length) {
        alert('Please select a photo');
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function(event) {
        const photo = {
            id: Date.now(),
            image: event.target.result,
            caption,
            date,
            timestamp: new Date(date).getTime()
        };

        allPhotos.unshift(photo);
        saveDataToLocalStorage();
        document.getElementById('photo-modal').classList.remove('active');
        document.getElementById('photo-form').reset();
        renderPhotos();
        showNotification('Photo uploaded successfully!');
    };

    reader.readAsDataURL(file);
}

function renderPhotos() {
    const gallery = document.getElementById('photos-gallery');

    if (allPhotos.length === 0) {
        gallery.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <p>No photos yet. Upload your first memory!</p>
            </div>
        `;
        return;
    }

    gallery.innerHTML = allPhotos.map(photo => `
        <div class="photo-card">
            <img src="${photo.image}" alt="Memory" class="photo-image">
            <div class="photo-info">
                <p class="photo-date">📅 ${photo.date}</p>
                <p class="photo-caption">${photo.caption || 'No caption'}</p>
            </div>
        </div>
    `).join('');
}

// Utility Functions
function getMoodEmoji(mood) {
    const moodEmojis = {
        happy: '😊',
        sad: '😢',
        neutral: '😐',
        excited: '🤩',
        anxious: '😰',
        grateful: '🙏'
    };
    return moodEmojis[mood] || '😊';
}

function updateCurrentDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date().toLocaleDateString('en-US', options);
    document.getElementById('current-date').textContent = today;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, #f8b4d9, #c9a8e8);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        font-weight: 600;
        z-index: 2000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Local Storage Management
function saveDataToLocalStorage() {
    const data = {
        entries: allEntries,
        photos: allPhotos,
        moodHistory: moodHistory
    };
    localStorage.setItem('journalData', JSON.stringify(data));
}

function loadDataFromLocalStorage() {
    const data = localStorage.getItem('journalData');
    if (data) {
        const parsed = JSON.parse(data);
        allEntries = parsed.entries || [];
        allPhotos = parsed.photos || [];
        moodHistory = parsed.moodHistory || [];
    }
}

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
