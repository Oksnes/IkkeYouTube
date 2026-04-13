async function Upload(event) {
    event.preventDefault();
    const title = document.getElementById('Title').value;
    const description = document.getElementById('Description').value;
    const videoFile = document.getElementById('Video').files[0];
    const thumbnailFile = document.getElementById('Thumbnail').files[0];

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('video', videoFile);
    formData.append('thumbnail', thumbnailFile);

    const response = await fetch('/uploadVideo', {
        method: 'POST',
        body: formData
    });

    const result = await response.json();
    alert(result.message);
}

const uploadButton = document.getElementById('uploadButton').addEventListener('click', Upload);