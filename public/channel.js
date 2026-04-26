async function loadUserProfile() {
    try {
        const response = await fetch('/currentUser');
        const data = await response.json();
        
        if (!data.error && data.user.profilePicture) {
            document.getElementById('profilepicture').src = data.user.profilePicture;
            document.getElementById('profilepicture').parentElement.href = `/channel.html?id=${data.user.userID}`;
        }
    } catch (err) {
        console.error('Error loading user profile:', err);
    }
}

async function loadChannel() {
    try {
        const params = new URLSearchParams(window.location.search);
        const channelID = params.get('id');

        const response = await fetch(`/channel/${channelID}`);
        const data = await response.json();

        if (data.error) {
            const videosContainer = document.getElementById('channelVideosList');
            videosContainer.innerHTML = '<p>Channel not found.</p>';
            return;
        }

        // Display user info
        document.getElementById('channelProfilePic').src = data.user.profilePicture;
        document.getElementById('channelName').innerText = data.user.username;

        const videosContainer = document.getElementById('channelVideosList');
        videosContainer.innerHTML = '';

        // Display videos or "no videos" message
        if (data.videos.length === 0) {
            videosContainer.innerHTML = '<h3>No videos uploaded yet.</h3>';
        }

        data.videos.forEach(video => {
            const videoCard = document.createElement('div');
            videoCard.className = 'video-card';
            videoCard.onclick = () => {
                window.location.href = `/watch.html?id=${video.videoID}`;
            };

            videoCard.innerHTML = `
                <img src="${video.thumbnailPath}" alt="${video.title}" class="thumbnail">
                <div class="video-info">
                    <h3 class="video-title">${video.title}</h3>
                </div>
            `;
            videosContainer.append(videoCard);
        });

    } catch (err) {
        console.error('Error loading channel:', err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();
    loadChannel();
});
