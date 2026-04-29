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
        document.getElementById('videoTimestamp').textContent = new Date(video.time*1000).toLocaleString();
        document.getElementById('videoDescription').textContent = video.description || 'No description provided.';
        document.getElementById('authorName').textContent = video.username;
        document.getElementById('authorProfilePic').src = video.profilePicture;
        document.getElementById('authorProfilePic').parentElement.href = `/channel.html?id=${video.userID}`;

        const likesResponse = await fetch(`/likesamount/${videoID}`);
        const likesData = await likesResponse.json();
        const likesSpan = document.createElement('span');
        likesSpan.id = 'likesCount';
        likesSpan.textContent = likesData.likes || 0;

        const likeButton = document.createElement('button');
        likeButton.id = 'likeButton';
        likeButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000000"><path d="M720-120H280v-520l280-280 50 50q7 7 11.5 19t4.5 23v14l-44 174h258q32 0 56 24t24 56v80q0 7-2 15t-4 15L794-168q-9 20-30 34t-44 14Zm-360-80h360l120-280v-80H480l54-220-174 174v406Zm0-406v406-406Zm-80-34v80H160v360h120v80H80v-520h200Z"/></svg>';
        
        const userLikedResponse = await fetch(`/userlikedvideo/${videoID}`);
        const userLikedData = await userLikedResponse.json();
        const currentUserResponse = await fetch(`/currentUser`);
        const currentUserData = await currentUserResponse.json();

        if (userLikedData.liked) {
            likeButton.classList.add('liked');
            likeButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000000"><path d="M720-120H320v-520l280-280 50 50q7 7 11.5 19t4.5 23v14l-44 174h218q32 0 56 24t24 56v80q0 7-1.5 15t-4.5 15L794-168q-9 20-30 34t-44 14ZM240-640v520H80v-520h160Z"/></svg>';
        } else {
            likeButton.classList.remove('liked');
        }
        // Add event listener to like button with toggle logic
        likeButton.addEventListener('click', async () => {
            if (likeButton.classList.contains('liked')) {
                await unlikeVideo();
            } else {
                await likeVideo();
            }
        });

        document.getElementById('videoLikesContainer').appendChild(likeButton);
        document.getElementById('videoLikesContainer').appendChild(likesSpan);



        const videodetails = document.getElementById('videoDetails');
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

async function updateLikeCount() {
    try {
        const params = new URLSearchParams(window.location.search);
        const videoID = params.get('id');
        const response = await fetch(`/likesamount/${videoID}`);
        const data = await response.json();
        const likesSpan = document.getElementById('likesCount');
        if (likesSpan) {
            likesSpan.textContent = data.likes || 0;
        }
    } catch (err) {
        console.error('Error updating like count:', err);
    }
}

async function likeVideo() {
    try {
        const params = new URLSearchParams(window.location.search);
        const videoID = params.get('id');
        const response = await fetch('/like', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ videoID })
        });
        const data = await response.json();

        if (data.error) {
            console.error('Error liking video:', data.message);
            alert('Error: ' + data.message);
            return;
        }

        // Update UI
        document.getElementById('likeButton').classList.add('liked');
        likeButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000000"><path d="M720-120H320v-520l280-280 50 50q7 7 11.5 19t4.5 23v14l-44 174h218q32 0 56 24t24 56v80q0 7-1.5 15t-4.5 15L794-168q-9 20-30 34t-44 14ZM240-640v520H80v-520h160Z"/></svg>';
        await updateLikeCount();
    } catch (err) {
        console.error('Error liking video:', err);
        alert('Error liking video');
    }
}

async function unlikeVideo() {
    try {
        const params = new URLSearchParams(window.location.search);
        const videoID = params.get('id');
        const response = await fetch('/unlike', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ videoID })
        });
        const data = await response.json();
        if (data.error) {
            console.error('Error unliking video:', data.message);
            alert('Error: ' + data.message);
            return;
        }

        // Update UI
        document.getElementById('likeButton').classList.remove('liked');
        likeButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000000"><path d="M720-120H280v-520l280-280 50 50q7 7 11.5 19t4.5 23v14l-44 174h258q32 0 56 24t24 56v80q0 7-2 15t-4 15L794-168q-9 20-30 34t-44 14Zm-360-80h360l120-280v-80H480l54-220-174 174v406Zm0-406v406-406Zm-80-34v80H160v360h120v80H80v-520h200Z"/></svg>';
        await updateLikeCount();
        
    } catch (err) {
        console.error('Error unliking video:', err);
        alert('Error unliking video');
    }
}


// Load video when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadVideo();
    loadComments();
    loadUserProfile();
});