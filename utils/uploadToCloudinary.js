/**
 * Uploads an image to Cloudinary directly from the frontend
 * @param {string} imageUri - The local URI of the image to upload
 * @param {string} cloudName - Your Cloudinary cloud name (get from env/config)
 * @param {string} uploadPreset - Your Cloudinary upload preset (get from env/config)
 * @returns {Promise<string>} - The secure_url of the uploaded image
 */
export const uploadToCloudinary = async (imageUri, cloudName, uploadPreset) => {
    if (!imageUri) {
        throw new Error("No image URI provided");
    }

    if (!cloudName || !uploadPreset) {
        throw new Error("Cloud Name or Upload Preset is missing");
    }

    const formData = new FormData();

    // Cloudinary expects 'file' to be an object with uri, type, name for React Native
    const filename = imageUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image`;

    formData.append('file', {
        uri: imageUri,
        type: type,
        name: filename || 'upload.jpg'
    });

    formData.append('upload_preset', uploadPreset);
    formData.append('cloud_name', cloudName);

    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'multipart/form-data',
            }
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        return data.secure_url;
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        throw error;
    }
};
