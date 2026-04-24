async function loadVideos() {
    try {
        const response = await fetch('/videos');
        const data = await response.json();

        if (data.error) {
            console.error('Error fetching videos:', data.message);
            return;
        }

        const videosContainer = document.querySelector('.videos-container');
        videosContainer.innerHTML = ''; // Clear existing videos

        if (data.videos.length === 0) {
            videosContainer.innerHTML = '<p>No videos uploaded yet.</p>';
            return;
        }

        data.videos.forEach(video => {
            const videoCard = document.createElement('div');
            videoCard.className = 'video-card';
            videoCard.onclick = () => {
                // Navigate to watch page
                window.location.href = `/watch.html?id=${video.videoID}`;
            };

            videoCard.innerHTML = `
                <img src="${video.thumbnailPath}" alt="${video.title}" class="thumbnail">
                <div class="video-info">
                    <div class="video-title" title="${video.title}">${video.title}</div>
                    <div class="video-author">${video.username}</div>
                </div>
            `;

            videosContainer.appendChild(videoCard);
        });
    } catch (err) {
        console.error('Error loading videos:', err);
    }
}

async function loadUserProfile() {
    try {
        const response = await fetch('/currentUser');
        const data = await response.json();
        
        if (!data.error) {
            // Always set the link to the user's channel
            document.getElementById('profilepicture').parentElement.href = `/channel.html?id=${data.user.userID}`;
            // Set the profile picture if one exists
            if (data.user.profilePicture) {
                document.getElementById('profilepicture').src = data.user.profilePicture;
            }
        }
    } catch (err) {
        console.error('Error loading user profile:', err);
    }
}

// Load videos and user profile when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadVideos();
    loadUserProfile();
});
