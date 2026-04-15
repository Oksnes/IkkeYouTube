async function loadVideo() {
    try {
        // Get videoID from URL parameters
        const params = new URLSearchParams(window.location.search);
        const videoID = params.get('id');

        if (!videoID) {
            document.querySelector('main').innerHTML = '<p>No video specified.</p>';
            return;
        }

        // Fetch video details
        const response = await fetch(`/api/video/${videoID}`);
        const data = await response.json();
        const userResponse = await fetch('/api/currentUser');
        const userData = await userResponse.json();

        if (data.error) {
            document.querySelector('main').innerHTML = `<p>Error: ${data.message}</p>`;
            return;
        }

        const video = data.video;
        const user = userData.user;

        // Set video source
        document.getElementById('videoSource').src = video.videoPath;
        document.getElementById('videoPlayer').load();

        // Set video details
        document.getElementById('videoTitle').textContent = video.title;
        document.getElementById('videoDescription').textContent = video.description || 'No description provided.';
        document.getElementById('authorName').textContent = video.username;
        document.getElementById('authorProfilePic').src = video.profilePicture;
        document.getElementById('navbar-profile-pic').src = user.profilePicture;

        // Set up comment submission
    } catch (err) {
        console.error('Error loading video:', err);
        document.querySelector('main').innerHTML = '<p>Error loading video.</p>';
    }
}
// Load video when page loads
document.addEventListener('DOMContentLoaded', loadVideo);