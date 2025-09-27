class FaceRecognitionApp {
    constructor() {
        this.registeredFaces = [];
        this.faceMatcher = null;
        this.matchingThreshold = 0.6;
        this.isModelsLoaded = false;
        this.currentStream = null;
        this.isDetecting = false;
        this.currentRecognizedUser = null;
        this.detectionInterval = null;

        this.init();
    }

    async init() {
        await this.loadModels();
        this.setupEventListeners();
    }

    async loadModels() {
        const modelUrl = 'https://justadudewhohacks.github.io/face-api.js/models';
        const loadingStatus = document.getElementById('loading-status');
        const progressFill = document.getElementById('progress-fill');
        
        try {
            loadingStatus.textContent = 'Loading SSD MobileNet model...';
            progressFill.style.width = '20%';
            await faceapi.nets.ssdMobilenetv1.loadFromUri(modelUrl);
            
            loadingStatus.textContent = 'Loading Face Landmark model...';
            progressFill.style.width = '50%';
            await faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl);
            
            loadingStatus.textContent = 'Loading Face Recognition model...';
            progressFill.style.width = '80%';
            await faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl);
            
            loadingStatus.textContent = 'Models loaded successfully!';
            progressFill.style.width = '100%';
            
            this.isModelsLoaded = true;
            
            // Show main app after a brief delay
            setTimeout(() => {
                this.showMainApp();
            }, 1000);
            
        } catch (error) {
            loadingStatus.textContent = 'Error loading models. Please refresh the page.';
            console.error('Error loading face-api models:', error);
        }
    }

    showMainApp() {
        const loadingScreen = document.getElementById('loading-screen');
        const mainApp = document.getElementById('main-app');
        
        if (loadingScreen && mainApp) {
            loadingScreen.style.display = 'none';
            mainApp.classList.remove('hidden');
            mainApp.style.display = 'block';
        }
    }

    setupEventListeners() {
        // Threshold slider
        const thresholdSlider = document.getElementById('threshold');
        const thresholdValue = document.getElementById('threshold-value');
        
        thresholdSlider.addEventListener('input', (e) => {
            this.matchingThreshold = parseFloat(e.target.value);
            thresholdValue.textContent = this.matchingThreshold.toFixed(2);
            this.updateFaceMatcher();
        });

        // Register section
        this.setupUploadArea('register');
        document.getElementById('register-btn').addEventListener('click', () => this.registerFace());

        // Recognize section (removed UI) - guard to avoid errors if elements are missing
        const recognizeUpload = document.getElementById('recognize-upload');
        const recognizeBtn = document.getElementById('recognize-btn');
        if (recognizeUpload && recognizeBtn) {
            this.setupUploadArea('recognize');
            recognizeBtn.addEventListener('click', () => this.recognizeFace());
        }

        // Guard section
        document.getElementById('start-camera-btn').addEventListener('click', () => this.startCamera());
        document.getElementById('stop-camera-btn').addEventListener('click', () => this.stopCamera());
    }

    setupUploadArea(type) {
        const uploadArea = document.getElementById(`${type}-upload`);
        const fileInput = document.getElementById(`${type}-file`);
        
        // Ensure file input exists and is properly configured
        if (!fileInput) {
            console.error(`File input not found: ${type}-file`);
            return;
        }
        
        // Click to upload - use event delegation to ensure proper targeting
        uploadArea.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            fileInput.click();
        });
        
        // File selection
        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                this.handleImageUpload(e.target.files[0], type);
            }
        });
        
        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files && files[0] && files[0].type.startsWith('image/')) {
                this.handleImageUpload(files[0], type);
            } else {
                this.showResult(type, 'error', 'Please drop a valid image file.');
            }
        });
    }

    async handleImageUpload(file, type) {
        console.log(`Handling image upload for ${type}:`, file.name, file.type, file.size);
        
        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            this.showResult(type, 'error', 'File too large. Please use images under 5MB.');
            return;
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            this.showResult(type, 'error', 'Unsupported file type. Please use JPEG, PNG, GIF, or WebP.');
            return;
        }

        const img = document.getElementById(`${type}-img`);
        const canvas = document.getElementById(`${type}-canvas`);
        const preview = document.getElementById(`${type}-preview`);
        
        if (!img || !canvas || !preview) {
            console.error('Required elements not found:', `${type}-img`, `${type}-canvas`, `${type}-preview`);
            return;
        }
        
        // Show preview
        img.src = URL.createObjectURL(file);
        preview.classList.remove('hidden');
        
        // Clear previous results
        this.clearResult(type);
        
        // Reset file input
        const fileInput = document.getElementById(`${type}-file`);
        if (fileInput) {
            fileInput.value = '';
        }
        
        img.onload = async () => {
            await this.detectFaces(img, canvas, type);
        };
        
        img.onerror = () => {
            this.showResult(type, 'error', 'Error loading image. Please try a different file.');
        };
    }

    async detectFaces(img, canvas, type) {
        if (!this.isModelsLoaded) {
            this.showResult(type, 'error', 'Models are still loading. Please wait.');
            return;
        }

        try {
            this.showProcessing(type, 'Detecting faces...');
            
            // Detect faces with landmarks and descriptors
            const detections = await faceapi
                .detectAllFaces(img)
                .withFaceLandmarks()
                .withFaceDescriptors();
            
            this.hideProcessing();
            
            if (detections.length === 0) {
                this.showResult(type, 'error', 'No faces detected in the image. Please try with a clearer image.');
                return;
            }
            
            if (detections.length > 1) {
                this.showResult(type, 'error', 'Multiple faces detected. Please use an image with exactly one face.');
                return;
            }
            
            // Draw face detection
            this.drawFaceDetection(img, canvas, detections);
            
            if (type === 'register') {
                document.getElementById('register-form').classList.remove('hidden');
                // Store the face descriptor for registration
                this.currentFaceDescriptor = detections[0].descriptor;
                this.showResult(type, 'success', 'Face detected successfully! Enter an identifier and click Register.');
            } else {
                document.getElementById('recognize-btn').classList.remove('hidden');
                // Store the face descriptor for recognition
                this.currentRecognitionDescriptor = detections[0].descriptor;
                this.showResult(type, 'info', 'Face detected! Click Recognize to find matches.');
            }
            
        } catch (error) {
            this.hideProcessing();
            console.error('Error detecting faces:', error);
            this.showResult(type, 'error', 'Error processing image. Please try again.');
        }
    }

    drawFaceDetection(img, canvas, detections) {
        const displaySize = { width: img.offsetWidth, height: img.offsetHeight };
        faceapi.matchDimensions(canvas, displaySize);
        
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw face boxes and landmarks
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    }

    async registerFace() {
        const identifier = document.getElementById('face-identifier').value.trim();
        
        if (!identifier) {
            this.showResult('register', 'error', 'Please enter an identifier for this face.');
            return;
        }
        
        if (!this.currentFaceDescriptor) {
            this.showResult('register', 'error', 'No face detected. Please upload an image first.');
            return;
        }
        
        // Check if identifier already exists
        if (this.registeredFaces.find(face => face.identifier === identifier)) {
            this.showResult('register', 'error', 'This identifier already exists. Please use a different one.');
            return;
        }
        
        try {
            this.showButtonLoading('register-btn', true);
            
            // Create thumbnail from current image
            const img = document.getElementById('register-img');
            const thumbnail = await this.createThumbnail(img);
            
            // Register the face
            const faceData = {
                identifier: identifier,
                descriptor: this.currentFaceDescriptor,
                thumbnail: thumbnail,
                registeredAt: new Date().toISOString()
            };
            
            this.registeredFaces.push(faceData);
            this.updateFaceMatcher();
            this.updateFacesList();
            
            this.showResult('register', 'success', `Face registered successfully as "${identifier}"!`);
            
            // Reset form
            document.getElementById('face-identifier').value = '';
            document.getElementById('register-form').classList.add('hidden');
            document.getElementById('register-preview').classList.add('hidden');
            this.currentFaceDescriptor = null;
            
        } catch (error) {
            console.error('Error registering face:', error);
            this.showResult('register', 'error', 'Error registering face. Please try again.');
        } finally {
            this.showButtonLoading('register-btn', false);
        }
    }

    async recognizeFace() {
        if (!this.currentRecognitionDescriptor) {
            this.showResult('recognize', 'error', 'No face detected. Please upload an image first.');
            return;
        }
        
        if (this.registeredFaces.length === 0) {
            this.showResult('recognize', 'error', 'No faces registered yet. Please register some faces first.');
            return;
        }
        
        try {
            this.showButtonLoading('recognize-btn', true);
            this.showProcessing('recognize', 'Comparing with registered faces...');
            
            // Use face matcher for recognition
            if (!this.faceMatcher) {
                this.updateFaceMatcher();
            }
            
            const match = this.faceMatcher.findBestMatch(this.currentRecognitionDescriptor);
            
            this.hideProcessing('recognize');
            
            if (match.label === 'unknown') {
                this.showResult('recognize', 'info', 'No matching face found in the database.');
            } else {
                const confidence = (1 - match.distance) * 100;
                this.showResult('recognize', 'success', 
                    `<h4>Match Found!</h4>
                     <p><strong>Identifier:</strong> ${match.label}</p>
                     <p><strong>Confidence:</strong> <span class="confidence-score">${confidence.toFixed(1)}%</span></p>`
                );
            }
            
        } catch (error) {
            this.hideProcessing('recognize');
            console.error('Error recognizing face:', error);
            this.showResult('recognize', 'error', 'Error recognizing face. Please try again.');
        } finally {
            this.showButtonLoading('recognize-btn', false);
        }
    }

    updateFaceMatcher() {
        if (this.registeredFaces.length === 0) {
            this.faceMatcher = null;
            return;
        }
        
        const labeledDescriptors = this.registeredFaces.map(face => 
            new faceapi.LabeledFaceDescriptors(face.identifier, [face.descriptor])
        );
        
        this.faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, this.matchingThreshold);
    }

    async createThumbnail(img) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const size = 80;
            
            canvas.width = size;
            canvas.height = size;
            
            ctx.drawImage(img, 0, 0, size, size);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
        });
    }

    updateFacesList() {
        const facesList = document.getElementById('faces-list');
        const faceCount = document.getElementById('face-count');
        
        faceCount.textContent = this.registeredFaces.length;
        
        if (this.registeredFaces.length === 0) {
            facesList.innerHTML = `
                <div class="empty-state">
                    <p>No faces registered yet. Register a face to get started.</p>
                </div>
            `;
            return;
        }
        
        facesList.innerHTML = this.registeredFaces.map((face, index) => `
            <div class="face-item">
                <img src="${face.thumbnail}" alt="${face.identifier}">
                <h4>${face.identifier}</h4>
                <small>Registered: ${new Date(face.registeredAt).toLocaleDateString()}</small>
                <button class="btn btn--sm" onclick="app.deleteFace(${index})">Delete</button>
            </div>
        `).join('');
    }

    deleteFace(index) {
        if (confirm('Are you sure you want to delete this registered face?')) {
            this.registeredFaces.splice(index, 1);
            this.updateFaceMatcher();
            this.updateFacesList();
        }
    }

    async startCamera() {
        try {
            const constraints = {
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                }
            };

            this.currentStream = await navigator.mediaDevices.getUserMedia(constraints);
            const video = document.getElementById('guard-video');
            video.srcObject = this.currentStream;

            document.getElementById('start-camera-btn').disabled = true;
            document.getElementById('stop-camera-btn').disabled = false;

            this.showGuardResult('info', 'Camera started! Automatic face detection is now active.');

            // Wait for video to be ready then start continuous detection
            video.onloadedmetadata = () => {
                this.startContinuousDetection();
            };

        } catch (error) {
            console.error('Error accessing camera:', error);
            this.showGuardResult('error', 'Unable to access camera. Please check permissions and try again.');
        }
    }

    startContinuousDetection() {
        if (!this.isModelsLoaded) {
            this.showGuardResult('error', 'Models are still loading. Please wait.');
            return;
        }

        // Start detection every 1 second
        this.detectionInterval = setInterval(() => {
            this.detectContinuously();
        }, 1000);
    }

    async detectContinuously() {
        if (this.isDetecting || !this.currentStream) {
            return;
        }

        this.isDetecting = true;

        try {
            const video = document.getElementById('guard-video');
            const canvas = document.getElementById('guard-canvas');

            const detections = await faceapi
                .detectAllFaces(video)
                .withFaceLandmarks()
                .withFaceDescriptors();

            // Clear previous canvas
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (detections.length === 0) {
                this.showGuardResult('info', 'Looking for faces... Position yourself in front of the camera.');
                this.currentRecognizedUser = null;
                return;
            }

            if (detections.length > 1) {
                this.showGuardResult('warning', 'Multiple faces detected. Please ensure only one person is in the frame.');
                this.currentRecognizedUser = null;
                return;
            }

            // Draw face detection
            this.drawFaceDetection(video, canvas, detections);

            if (this.registeredFaces.length === 0) {
                this.showGuardResult('error', 'No registered faces in the database. Please register faces first.');
                return;
            }

            if (!this.faceMatcher) {
                this.updateFaceMatcher();
            }

            const match = this.faceMatcher.findBestMatch(detections[0].descriptor);

            if (match.label === 'unknown') {
                this.showGuardResult('error', 'Unknown person detected. Access denied.');
                this.currentRecognizedUser = null;
            } else {
                const confidence = (1 - match.distance) * 100;
                const recognizedFace = this.registeredFaces.find(face => face.identifier === match.label);

                // Only show recognition result if it's a different user or confidence is high enough
                if (!this.currentRecognizedUser || this.currentRecognizedUser.identifier !== recognizedFace.identifier) {
                    this.currentRecognizedUser = recognizedFace;
                    this.showRecognitionResult(recognizedFace, confidence);
                }
            }

        } catch (error) {
            console.error('Error in continuous detection:', error);
        } finally {
            this.isDetecting = false;
        }
    }

    stopCamera() {
        // Stop continuous detection
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
            this.detectionInterval = null;
        }

        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
        }

        const video = document.getElementById('guard-video');
        video.srcObject = null;

        const canvas = document.getElementById('guard-canvas');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        document.getElementById('start-camera-btn').disabled = false;
        document.getElementById('stop-camera-btn').disabled = true;

        this.clearGuardResult();
        this.currentRecognizedUser = null;
        this.isDetecting = false;
    }

    showRecognitionResult(recognizedFace, confidence) {
        const resultHtml = `
            <div class="recognition-result">
                <h4>✅ Person Recognized</h4>
                <div class="user-info">
                    <img src="${recognizedFace.thumbnail}" alt="${recognizedFace.identifier}" class="user-thumbnail">
                    <div class="user-details">
                        <h5>${recognizedFace.identifier}</h5>
                        <p>Registered: ${new Date(recognizedFace.registeredAt).toLocaleDateString()}</p>
                        <span class="confidence-badge">${confidence.toFixed(1)}% confidence</span>
                    </div>
                </div>
                <button id="send-request-btn" class="btn btn--primary send-request-btn">
                    📱 Send Transaction Request
                </button>
            </div>
        `;

        const guardResult = document.getElementById('guard-result');
        guardResult.innerHTML = resultHtml;

        document.getElementById('send-request-btn').addEventListener('click', () => {
            this.sendTransactionRequest(recognizedFace);
        });
    }

    sendTransactionRequest(user) {
        this.showTransactionPopup(user);
    }

    showTransactionPopup(user) {
        const popupHtml = `
            <div class="transaction-popup" id="transaction-popup">
                <div class="transaction-content">
                    <div class="transaction-header">
                        <h3>📲 Transaction Request</h3>
                        <p>Sending entry request to ${user.identifier}</p>
                    </div>
                    <div class="transaction-details">
                        <div class="user-info">
                            <img src="${user.thumbnail}" alt="${user.identifier}" class="user-thumbnail">
                            <div class="user-details">
                                <h5>${user.identifier}</h5>
                                <p>Entry request at ${new Date().toLocaleString()}</p>
                            </div>
                        </div>
                        <p><strong>Location:</strong> Main Gateway</p>
                        <p><strong>Guard:</strong> Security Personnel</p>
                        <p><strong>Status:</strong> <span class="confidence-badge">Pending Approval</span></p>
                    </div>
                    <div class="transaction-actions">
                        <button class="btn btn--outline" onclick="app.closeTransactionPopup()">Cancel</button>
                        <button class="btn btn--primary" onclick="app.simulateTransaction('${user.identifier}')">Send Request</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', popupHtml);
    }

    simulateTransaction(userIdentifier) {
        this.showGuardResult('success', `📲 Transaction request sent to ${userIdentifier}! The user will receive a notification on their mobile device to approve entry.`);
        this.closeTransactionPopup();

        setTimeout(() => {
            this.simulateUserResponse(userIdentifier);
        }, 3000);
    }

    simulateUserResponse(userIdentifier) {
        const responses = ['approved', 'approved', 'approved', 'denied'];
        const response = responses[Math.floor(Math.random() * responses.length)];

        if (response === 'approved') {
            this.showGuardResult('success', `✅ Entry APPROVED by ${userIdentifier}! Transaction completed. Access granted.`);
        } else {
            this.showGuardResult('error', `❌ Entry DENIED by ${userIdentifier}. Access not granted.`);
        }
    }

    closeTransactionPopup() {
        const popup = document.getElementById('transaction-popup');
        if (popup) {
            popup.remove();
        }
    }

    showGuardResult(status, message) {
        const resultArea = document.getElementById('guard-result');
        if (resultArea) {
            resultArea.innerHTML = `<div class="result result--${status}">${message}</div>`;
        }
    }

    clearGuardResult() {
        const resultArea = document.getElementById('guard-result');
        if (resultArea) {
            resultArea.innerHTML = '';
        }
    }

    showResult(type, status, message) {
        const resultArea = document.getElementById(`${type}-result`);
        if (resultArea) {
            resultArea.innerHTML = `<div class="result result--${status}">${message}</div>`;
        }
    }

    clearResult(type) {
        const resultArea = document.getElementById(`${type}-result`);
        if (resultArea) {
            resultArea.innerHTML = '';
        }
    }

    showProcessing(type, message) {
        const resultArea = document.getElementById(`${type}-result`);
        if (resultArea) {
            resultArea.innerHTML = `<div class="processing">${message}</div>`;
        }
    }

    hideProcessing() {
        // Processing will be replaced by result, so no need to explicitly hide
    }

    showButtonLoading(buttonId, loading) {
        const button = document.getElementById(buttonId);
        if (button) {
            if (loading) {
                button.classList.add('btn--loading');
                button.disabled = true;
            } else {
                button.classList.remove('btn--loading');
                button.disabled = false;
            }
        }
    }
}

// Initialize the app when the DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new FaceRecognitionApp();
});