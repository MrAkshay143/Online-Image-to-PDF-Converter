const imageContainer = document.getElementById('imageContainer');
const convertButton = document.getElementById('convertButton');
const clearButton = document.getElementById('clearButton');
const pdfDownloadLink = document.getElementById('pdfDownloadLink');
let imageFiles = [];
window.jsPDF = window.jspdf.jsPDF;

// Function to render the images in the UI
const renderImages = () => {
  imageContainer.innerHTML = '';
  imageFiles.forEach((file, index) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const imageBox = document.createElement('div');
      imageBox.classList.add('imageBox');
      imageBox.setAttribute('data-index', index);
      imageBox.innerHTML = `
        <img src="${reader.result}" class="uploadedImage" data-index="${index}">
        <button class="rotateButton" data-index="${index}">Rotate</button>
        <button class="deleteButton" data-index="${index}">&times;</button>
      `;
      imageContainer.appendChild(imageBox);
    };
  });

  // Make the image container sortable
  new Sortable(imageContainer, {
    onEnd: () => {
      // Update the imageFiles array based on the new order
      imageFiles = Array.from(imageContainer.children).map((child, index) => imageFiles[child.dataset.index]);
      renderImages(); // Render the images with the new order
    },
  });
};

// Function to rotate the image
function rotateImage(index) {
  const imgElement = document.querySelector(`.uploadedImage[data-index="${index}"]`);
  const currentRotation = (imgElement.dataset.rotation || 0) % 360;
  const newRotation = currentRotation + 90;
  imgElement.style.transform = `rotate(${newRotation}deg)`;
  imgElement.dataset.rotation = newRotation;
}

// Function to delete an image
function deleteImage(index) {
  imageFiles.splice(index, 1);
  renderImages();
}

// Event listener for clicks on image container
imageContainer.addEventListener('click', (event) => {
  if (event.target.classList.contains('deleteButton')) {
    const index = parseInt(event.target.dataset.index);
    deleteImage(index);
  } else if (event.target.classList.contains('rotateButton')) {
    const index = parseInt(event.target.dataset.index);
    rotateImage(index);
  }
});

// Function to handle the conversion process
const convertToPdf = () => {
  const doc = new jsPDF();
  let imagesProcessed = 0;
  const pageWidth = doc.internal.pageSize.getWidth() - 20;
  const progressBar = document.createElement('progress');
  progressBar.value = 0;
  progressBar.max = imageFiles.length;

  // Append progress bar to the container
  imageContainer.appendChild(progressBar);

  imageFiles.forEach((file, index) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      const img = new Image();
      img.src = reader.result;

      const rotation = (document.querySelector(`.uploadedImage[data-index="${index}"]`).dataset.rotation || 0) % 360;

      img.onload = () => {
        const scaleFactor = pageWidth / img.width;
        const imageHeight = img.height * scaleFactor;

        canvas.width = img.width;
        canvas.height = img.height;

        // Apply rotation transformation
        context.translate(canvas.width / 2, canvas.height / 2);
        context.rotate(rotation * (Math.PI / 180));
        context.drawImage(img, -canvas.width / 2, -canvas.height / 2, img.width, img.height);

        const imageData = canvas.toDataURL('image/jpeg');

        if (index === 0) {
          doc.addImage(imageData, 'JPEG', 10, 10, pageWidth, imageHeight);
        } else {
          doc.addPage();
          doc.addImage(imageData, 'JPEG', 10, 10, pageWidth, imageHeight);
        }

        imagesProcessed++;

        // Update progress bar value
        progressBar.value = imagesProcessed;

        if (imagesProcessed === imageFiles.length) {
          // Remove progress bar when done
          imageContainer.removeChild(progressBar);

          doc.save('converted.pdf');
          pdfDownloadLink.innerHTML = `<a href="${doc.output('bloburl')}">Download PDF</a>`;
        }
      };
    };
  });
};

// Add event listener to the file input element
const fileInput = document.getElementById('fileInput');
fileInput.addEventListener('change', (e) => {
  const selectedFiles = Array.from(e.target.files);
  imageFiles = imageFiles.concat(selectedFiles);
  renderImages();
});

// Add event listener to the convert button
convertButton.addEventListener('click', () => {
  convertButton.innerHTML = 'Converting...';
  convertButton.disabled = true;
  convertToPdf();
  convertButton.innerHTML = 'Convert to PDF';
  convertButton.disabled = false;
});

document.querySelector('#addImageButton').addEventListener('click', () => fileInput.click());

clearButton.addEventListener('click', () => {
  imageFiles = [];
  renderImages();
});
