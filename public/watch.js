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

        if (data.error) {
            document.querySelector('main').innerHTML = `<p>Error: ${data.message}</p>`;
            return;
        }

        const video = data.video;

        // Set video source
        document.getElementById('videoSource').src = video.videoPath;
        document.getElementById('videoPlayer').load();

        // Set video details
        document.getElementById('videoTitle').textContent = video.title;
        document.getElementById('videoDescription').textContent = video.description || 'No description provided.';
        document.getElementById('authorName').textContent = video.username;
        document.getElementById('authorProfilePic').src = video.profilePicture || '/Images/default-avatar.png';
        document.getElementById('navbar-profile-pic').src = video.profilePicture || '/Images/default-avatar.png';

        // Load comments
        await loadComments(videoID);

        // Set up comment submission
        document.getElementById('submitCommentBtn').onclick = () => submitComment(videoID);
    } catch (err) {
        console.error('Error loading video:', err);
        document.querySelector('main').innerHTML = '<p>Error loading video.</p>';
    }
}

async function loadComments(videoID) {
    try {
        const response = await fetch(`/api/comments/${videoID}`);
        const data = await response.json();

        if (data.error) {
            console.error('Error loading comments:', data.message);
            return;
        }

        const commentsList = document.getElementById('commentsList');
        commentsList.innerHTML = '';

        if (data.comments.length === 0) {
            commentsList.innerHTML = '<p>No comments yet. Be the first to comment!</p>';
            return;
        }

        data.comments.forEach(comment => {
            const commentDiv = document.createElement('div');
            commentDiv.className = 'comment';
            commentDiv.innerHTML = `
                <div class="comment-author"><strong>${comment.username}</strong></div>
                <div class="comment-content">${comment.content}</div>
            `;
            commentsList.appendChild(commentDiv);
        });
    } catch (err) {
        console.error('Error loading comments:', err);
    }
}

async function submitComment(videoID) {
    const commentInput = document.getElementById('commentInput');
    const content = commentInput.value.trim();

    if (!content) {
        alert('Please enter a comment.');
        return;
    }

    try {
        const response = await fetch('/api/comment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoID, content })
        });

        const data = await response.json();

        if (data.error) {
            alert('Error posting comment: ' + data.message);
            return;
        }

        commentInput.value = '';
        await loadComments(videoID);
    } catch (err) {
        console.error('Error submitting comment:', err);
        alert('Error posting comment.');
    }
}

// Load video when page loads
document.addEventListener('DOMContentLoaded', loadVideo);