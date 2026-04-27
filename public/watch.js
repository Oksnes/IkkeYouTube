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
        const response = await fetch(`/video/${videoID}`);
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
        document.getElementById('authorProfilePic').src = video.profilePicture;
        document.getElementById('authorProfilePic').parentElement.href = `/channel.html?id=${video.userID}`;

        const videodetails = document.getElementById('videoDetails');
        const currentUser = await fetch(`/currentUser`);
        const currentUserData = await currentUser.json();
        if (!currentUserData.error && currentUserData.user.userID === video.userID) {
            const deleteVideoButton = document.createElement('button');
            deleteVideoButton.textContent = 'Delete Video';
            deleteVideoButton.id = 'deleteVideoButton';
            deleteVideoButton.addEventListener('click', deleteVideo);
            videodetails.appendChild(deleteVideoButton);
        }
    } catch (err) {
        console.error('Error loading video:', err);
        document.querySelector('main').innerHTML = '<p>Error loading video.</p>';
    }
}

async function loadComments() {
    const commentContainer = document.getElementById('commentsList');
    commentContainer.innerHTML = ''; // Clear existing comments
    try {
        const params = new URLSearchParams(window.location.search);
        const videoID = params.get('id');

        const response = await fetch(`/comments/${videoID}`);
        const data = await response.json();

        if (data.error) {
            console.error('Error fetching comments:', data.message);
            return;
        }

        data.comments.forEach(comment => {
            const commentDiv = document.createElement('div');
            commentDiv.classList.add('comment');
            
            const profilePictureInteractive = document.createElement('a');
            profilePictureInteractive.href = `/channel.html?id=${comment.userID}`;

            const profilePicture = document.createElement('img');
            profilePicture.src = comment.profilePicture;
            profilePicture.alt = `${comment.username}'s Profile Picture`;
            
            const commentBody = document.createElement('div');
            commentBody.classList.add('comment-body');
            
            const commentAuthor = document.createElement('span');
            commentAuthor.classList.add('comment-author');
            commentAuthor.textContent = comment.username;
            
            const commentContent = document.createElement('span');
            commentContent.classList.add('comment-content');
            commentContent.textContent = comment.content;

            commentBody.append(commentAuthor, commentContent);
            profilePictureInteractive.appendChild(profilePicture);
            commentDiv.append(profilePictureInteractive, commentBody);

            commentContainer.append(commentDiv);
        });
    } catch (err) {
        console.error('Error loading comments:', err);
    }
}


const submitCommentButton = document.getElementById('submitCommentBtn');
submitCommentButton.addEventListener('click', submitComment);

async function submitComment(event) {
    event.preventDefault();
    const commentInput = document.getElementById('commentInput');
    const content = commentInput.value.trim();

    if (!content) {
        return;
    }

    try {
        const params = new URLSearchParams(window.location.search);
        const videoID = params.get('id');

        const response = await fetch('/comment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content, videoID })
        });

        const data = await response.json();

        if (data.error) {
            console.error('Error submitting comment:', data.message);
            return;
        }

        // Clear the comment input
        commentInput.value = '';

        // Reload comments
        loadComments();
    } catch (err) {
        console.error('Error submitting comment:', err);
    }

}

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

async function deleteVideo() {
    try {
        const params = new URLSearchParams(window.location.search);
        const videoID = params.get('id');

        if (!videoID) {
            console.error('No video ID found');
            return;
        }

        if (!confirm('Are you sure you want to delete this video?')) {
            return;
        }

        const response = await fetch(`/deletevideo/${videoID}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.error) {
            console.error('Error deleting video:', data.message);
            alert('Error: ' + data.message);
            return;
        }

        alert('Video deleted successfully');
        window.location.href = '/home';
    } catch (err) {
        console.error('Error deleting video:', err);
        alert('Error deleting video');
    }
}



// Load video when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadVideo();
    loadComments();
    loadUserProfile();
});