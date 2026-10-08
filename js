document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

let currentEntryIndex = null;
let allEntries = [];
let allPhotos = [];
let moodHistory = [];

function initializeApp() {
    loadDataFromLocalStorage();
    ensureSampleData();
    setupEventListeners();
    updateCurrentDate();
    renderEntries();
    renderPhotos();
    updateMoodStats();
    renderCurrentMoodState();
}

function ensureSampleData() {
    if (allEntries.length === 0) {
        allEntries = [
            {
                id: 1,
                title: 'Golden Morning Walk',
                content: 'I woke up before sunrise and took a slow walk while the city was still quiet. The air was cool and the sky looked like watercolor. I felt grateful for the simple luxury of being present.',
                mood: 'grateful',
                tags: ['morning', 'nature', 'gratitude'],
                date: formatDate(new Date()),
                timestamp: Date.now() - 86400000
            },
            {
                id: 2,
                title: 'Creative Spark',
                content: 'Today felt full of possibility. I finally sat down to work on a project I had been postponing, and the ideas started to flow naturally. I want to protect this feeling of momentum.',
                mood: 'excited',
                tags: ['work', 'creativity'],
                date: formatDate(new Date(Date.now() - 2 * 86400000)),
                timestamp: Date.now() - 2 * 86400000
            }
        ];
    }

    if (allPhotos.length === 0) {
        allPhotos = [
            {
                id: 1,
                image: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=900&q=80',
                caption: 'Little moments of calm by the lake',
                date: formatDate(new Date(Date.now() - 3 * 86400000)),
                timestamp: Date.now() - 3 * 86400000
            },
            {
                id: 2,
                image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
                caption: 'A soft sunrise and a fresh start',
                date: formatDate(new Date(Date.now() - 5 * 86400000)),
                timestamp: Date.now() - 5 * 86400000
            }
        ];
    }

    if (moodHistory.length === 0) {
        moodHistory = [
            { mood: 'grateful', date: formatDate(new Date()), timestamp: Date.now() - 86400000 },
            { mood: 'excited', date: formatDate(new Date(Date.now() - 2 * 86400000)), timestamp: Date.now() - 2 * 86400000 },
            { mood: 'happy', date: formatDate(new Date(Date.now() - 3 * 86400000)), timestamp: Date.now() - 3 * 86400000 }
        ];
    }

    saveDataToLocalStorage();
}

function setupEventListeners() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', handleTabSwitch);
    });

    document.getElementById('new-entry-btn').addEventListener('click', openEntryModal);
    document.getElementById('entry-form').addEventListener('submit', handleSaveEntry);
    document.getElementById('cancel-entry-btn').addEventListener('click', closeEntryModal);

    document.getElementById('upload-photo-btn').addEventListener('click', openPhotoModal);
    document.getElementById('photo-form').addEventListener('submit', handleSavePhoto);
    document.querySelector('.close-btn-form')?.addEventListener('click', closePhotoModal);

    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const modal = this.closest('.modal');
            if (modal) modal.classList.remove('active');
        });
    });

    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.addEventListener('click', handleMoodSelect);
    });

    document.getElementById('search-box').addEventListener('input', handleSearch);
    document.getElementById('delete-entry-btn').addEventListener('click', handleDeleteEntry);

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function (e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    });
}

function handleTabSwitch(e) {
    const tabName = e.currentTarget.getAttribute('data-tab');
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    e.currentTarget.classList.add('active');

    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');

    const titles = {
        entries: 'Daily Entries',
        mood: 'Mood Tracker',
        memories: 'Photo Memories',
        about: 'About'
    };
    document.getElementById('page-title').textContent = titles[tabName];

    const searchBox = document.getElementById('search-box');
    searchBox.style.display = tabName === 'entries' ? 'block' : 'none';

    if (tabName === 'mood') {
        updateMoodStats();
    }
}

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
    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(Boolean) : [];

    if (!title || !content) {
        alert('Please add both a title and your journal entry.');
        return;
    }

    const entry = {
        id: Date.now(),
        title,
        content,
        mood,
        tags,
        date: formatDate(new Date()),
        timestamp: Date.now()
    };

    allEntries.unshift(entry);
    saveDataToLocalStorage();
    closeEntryModal();
    renderEntries();
    showNotification('Entry saved successfully!');
}

function renderEntries(entriesToRender = allEntries) {
    const entriesList = document.getElementById('entries-list');

    if (!entriesToRender.length) {
        entriesList.innerHTML = `
            <div class="empty-state">
                <p>No entries yet. Start writing to create your first journal entry.</p>
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
    const entry = allEntries.find(item => item.id === entryId);
    if (!entry) return;

    currentEntryIndex = allEntries.indexOf(entry);

    document.getElementById('view-entry-title').textContent = entry.title;
    document.getElementById('view-entry-date').textContent = `📅 ${entry.date}`;
    document.getElementById('view-entry-mood').textContent = `${getMoodEmoji(entry.mood)} Mood: ${entry.mood}`;
    document.getElementById('view-entry-tags').innerHTML = entry.tags.length
        ? entry.tags.map(tag => `<span class="tag">#${escapeHtml(tag)}</span>`).join('')
        : 'No tags';
    document.getElementById('view-entry-content').textContent = entry.content;

    document.getElementById('view-entry-modal').classList.add('active');
}

function handleDeleteEntry() {
    if (currentEntryIndex === null) return;

    if (confirm('Are you sure you want to delete this journal entry?')) {
        allEntries.splice(currentEntryIndex, 1);
        saveDataToLocalStorage();
        renderEntries();
        document.getElementById('view-entry-modal').classList.remove('active');
        showNotification('Entry deleted.');
    }
}

function handleSearch(e) {
    const query = e.target.value.toLowerCase();

    if (!query) {
        renderEntries(allEntries);
        return;
    }

    const filtered = allEntries.filter(entry =>
        entry.title.toLowerCase().includes(query) ||
        entry.content.toLowerCase().includes(query) ||
        entry.tags.some(tag => tag.toLowerCase().includes(query))
    );

    renderEntries(filtered);
}

function handleMoodSelect(e) {
    const mood = e.currentTarget.getAttribute('data-mood');
    document.querySelectorAll('.mood-btn').forEach(btn => btn.classList.remove('active'));
    e.currentTarget.classList.add('active');

    moodHistory.unshift({
        mood,
        date: formatDate(new Date()),
        timestamp: Date.now()
    });

    saveDataToLocalStorage();
    updateMoodStats();
    showNotification(`Mood saved: ${mood}`);
}

function updateMoodStats() {
    const counts = {};
    moodHistory.forEach(entry => {
        counts[entry.mood] = (counts[entry.mood] || 0) + 1;
    });

    let mostFrequent = '-';
    if (Object.keys(counts).length) {
        mostFrequent = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    }

    document.getElementById('most-frequent-mood').textContent = mostFrequent || '-';
    document.getElementById('total-moods').textContent = String(moodHistory.length);

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const thisWeek = moodHistory.filter(item => item.timestamp >= weekAgo).length;
    document.getElementById('week-moods').textContent = String(thisWeek);

    updateMoodChart(counts);
}

function updateMoodChart(counts) {
    const canvas = document.getElementById('mood-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.clientWidth || 600;
    const height = canvas.height = canvas.clientHeight || 260;

    ctx.clearRect(0, 0, width, height);

    const moodLabels = Object.keys(counts);
    if (!moodLabels.length) {
        ctx.fillStyle = '#7d7d8d';
        ctx.font = '16px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillText('No mood data yet', width / 2, height / 2);
        return;
    }

    const values = moodLabels.map(label => counts[label]);
    const maxValue = Math.max(...values, 1);
    const padding = 35;
    const chartHeight = height - padding * 2;
    const barWidth = (width - padding * 2) / moodLabels.length * 0.6;

    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, '#f8b4d9');
    gradient.addColorStop(0.6, '#c9a8e8');
    gradient.addColorStop(1, '#a8d8ea');

    moodLabels.forEach((label, index) => {
        const x = padding + index * ((width - padding * 2) / moodLabels.length) + 18;
        const valueHeight = (counts[label] / maxValue) * chartHeight;
        const y = height - padding - valueHeight;

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, valueHeight);

        ctx.fillStyle = '#3d3d4d';
        ctx.font = '12px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillText(getMoodEmoji(label), x + barWidth / 2, height - 12);
        ctx.fillText(String(counts[label]), x + barWidth / 2, y - 8);
    });
}

function openPhotoModal() {
    document.getElementById('photo-modal').classList.add('active');
    document.getElementById('photo-date').valueAsDate = new Date();
}

function closePhotoModal() {
    document.getElementById('photo-modal').classList.remove('active');
    document.getElementById('photo-form').reset();
}

function handleSavePhoto(e) {
    e.preventDefault();

    const fileInput = document.getElementById('photo-file');
    const caption = document.getElementById('photo-caption').value.trim();
    const date = document.getElementById('photo-date').value;

    if (!fileInput.files.length) {
        alert('Please choose a photo to upload.');
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function (event) {
        allPhotos.unshift({
            id: Date.now(),
            image: event.target.result,
            caption,
            date,
            timestamp: new Date(date).getTime()
        });

        saveDataToLocalStorage();
        closePhotoModal();
        renderPhotos();
        showNotification('Photo memory uploaded!');
    };

    reader.readAsDataURL(file);
}

function renderPhotos() {
    const gallery = document.getElementById('photos-gallery');

    if (!allPhotos.length) {
        gallery.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <p>No photos yet. Upload your first memory.</p>
            </div>
        `;
        return;
    }

    gallery.innerHTML = allPhotos.map(photo => `
        <div class="photo-card">
            <img class="photo-image" src="${photo.image}" alt="${escapeHtml(photo.caption || 'Memory')}">
            <div class="photo-info">
                <p class="photo-date">📅 ${photo.date}</p>
                <p class="photo-caption">${escapeHtml(photo.caption || 'A lovely memory')}</p>
            </div>
        </div>
    `).join('');
}

function updateCurrentDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date().toLocaleDateString('en-US', options);
    document.getElementById('current-date').textContent = today;
}

function renderCurrentMoodState() {
    const activeMood = moodHistory[0]?.mood || 'happy';
    const moodButton = document.querySelector(`.mood-btn[data-mood="${activeMood}"]`);
    if (moodButton) moodButton.classList.add('active');
}

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

function formatDate(date) {
    return new Date(date).toLocaleDateString();
}

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function showNotification(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.position = 'fixed';
    toast.style.right = '20px';
    toast.style.bottom = '20px';
    toast.style.background = 'linear-gradient(135deg, #f8b4d9, #c9a8e8)';
    toast.style.color = '#fff';
    toast.style.padding = '0.9rem 1.2rem';
    toast.style.borderRadius = '12px';
    toast.style.boxShadow = '0 12px 28px rgba(0,0,0,0.12)';
    toast.style.fontWeight = '700';
    toast.style.zIndex = '2000';
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 2500);
}

function saveDataToLocalStorage() {
    const data = {
        entries: allEntries,
        photos: allPhotos,
        moodHistory: moodHistory
    };
    localStorage.setItem('journalData', JSON.stringify(data));
}

function loadDataFromLocalStorage() {
    const saved = localStorage.getItem('journalData');
    if (!saved) return;

    try {
        const parsed = JSON.parse(saved);
        allEntries = parsed.entries || [];
        allPhotos = parsed.photos || [];
        moodHistory = parsed.moodHistory || [];
    } catch (error) {
        console.error('Could not load saved journal data:', error);
    }
}
