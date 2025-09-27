
// Simple Face Recognition Service Example
// This is the core implementation without UI

class SimpleFaceRecognition {
    constructor() {
        this.registeredFaces = new Map(); // identifier -> descriptor
        this.faceMatcher = null;
        this.threshold = 0.6;
    }

    // Initialize face-api.js models
    async initialize() {
        const modelUrl = 'https://justadudewhohacks.github.io/face-api.js/models';

        await faceapi.nets.ssdMobilenetv1.loadFromUri(modelUrl);
        await faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl);
        await faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl);

        console.log('Face recognition models loaded');
    }

    // Register a face with a string identifier
    async registerFace(imageElement, identifier) {
        try {
            const detection = await faceapi
                .detectSingleFace(imageElement)
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                throw new Error('No face detected in image');
            }

            // Store the face descriptor
            this.registeredFaces.set(identifier, detection.descriptor);

            // Update face matcher
            this.updateFaceMatcher();

            return {
                success: true,
                message: `Face registered successfully for ${identifier}`
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Recognize a face and return the associated string identifier
    async recognizeFace(imageElement) {
        try {
            if (this.registeredFaces.size === 0) {
                throw new Error('No faces registered');
            }

            const detection = await faceapi
                .detectSingleFace(imageElement)
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                throw new Error('No face detected in image');
            }

            // Find best match
            const bestMatch = this.faceMatcher.findBestMatch(detection.descriptor);

            if (bestMatch.distance < this.threshold) {
                return {
                    success: true,
                    identifier: bestMatch.label,
                    confidence: 1 - bestMatch.distance,
                    message: `Face recognized: ${bestMatch.label}`
                };
            } else {
                return {
                    success: false,
                    message: 'No matching face found',
                    confidence: 1 - bestMatch.distance
                };
            }
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Update the face matcher with current registered faces
    updateFaceMatcher() {
        const labeledDescriptors = [];

        for (const [identifier, descriptor] of this.registeredFaces) {
            labeledDescriptors.push(
                new faceapi.LabeledFaceDescriptors(identifier, [descriptor])
            );
        }

        this.faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, this.threshold);
    }

    // Set matching threshold
    setThreshold(threshold) {
        this.threshold = threshold;
        if (this.registeredFaces.size > 0) {
            this.updateFaceMatcher();
        }
    }

    // Get list of registered identifiers
    getRegisteredFaces() {
        return Array.from(this.registeredFaces.keys());
    }

    // Remove a registered face
    removeFace(identifier) {
        const removed = this.registeredFaces.delete(identifier);
        if (removed && this.registeredFaces.size > 0) {
            this.updateFaceMatcher();
        } else if (this.registeredFaces.size === 0) {
            this.faceMatcher = null;
        }
        return removed;
    }
}

// Usage Example:
/*
const faceRecognition = new SimpleFaceRecognition();

// Initialize the service
await faceRecognition.initialize();

// Register faces
const img1 = document.getElementById('john-image');
await faceRecognition.registerFace(img1, 'John Doe');

const img2 = document.getElementById('jane-image');
await faceRecognition.registerFace(img2, 'Jane Smith');

// Recognize a face
const queryImg = document.getElementById('query-image');
const result = await faceRecognition.recognizeFace(queryImg);

if (result.success) {
    console.log(`Recognized: ${result.identifier} (${result.confidence.toFixed(2)} confidence)`);
} else {
    console.log(`Recognition failed: ${result.message}`);
}
*/
