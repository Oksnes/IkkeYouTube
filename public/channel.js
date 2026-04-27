async function loadUserProfile() {
    try {
        const response = await fetch('/currentUser');
        const data = await response.json();
        
        if (!data.error && data.user.profilePicture) {
            document.getElementById('profilepicture').src = data.user.profilePicture;
            document.getElementById('profilepicture').parentElement.href = `/channel.html?id=${data.user.userID}`;
        }
        // Store the current user's ID globally
        window.currentUserID = data.user.userID;
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
        document.getElementById('channelDescription').innerText = data.user.description || 'No description.';
        
        // Only show edit button if this is the current user's channel
        if (window.currentUserID === data.user.userID) {
            const changeDescriptionButton = document.createElement('button');
            changeDescriptionButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="16px" fill="#000000"><path d="M200-200h560v-367L567-760H200v560Zm0 80q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h400l240 240v400q0 33-23.5 56.5T760-120H200Zm80-160h400v-80H280v80Zm0-160h400v-80H280v80Zm0-160h280v-80H280v80Zm-80 400v-560 560Z"/></svg>';
            changeDescriptionButton.addEventListener('click', async () => {
                const newDescription = prompt('Enter new channel description:');
                if (newDescription !== null) {
                    await updateChannelDescription(newDescription);
                }
            });
            document.getElementById('channelDescription').appendChild(changeDescriptionButton);
        }
    
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

async function updateChannelDescription(newDescription) {
    try {
        const response = await fetch('/updateUserDescription', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ description:newDescription })
        });
        const data = await response.json();
        if (data.error) {
            console.error('Error updating description:', data.message);
        } else {
            document.getElementById('channelDescription').innerText = newDescription;
        }
    } catch (err) {
        console.error('Error updating description:', err);
    }
    loadChannel(); // Refresh channel info after update
}

document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();
    loadChannel();
});
