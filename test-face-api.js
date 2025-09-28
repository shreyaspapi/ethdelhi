const faceapi = require('face-api.js');
const { Canvas, Image, ImageData } = require('canvas');
const fs = require('fs');
const path = require('path');

// Configure face-api.js to use canvas
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

async function testFaceApi() {
  try {
    console.log('Loading face-api.js models...');
    
    const modelsPath = path.join(__dirname, 'server', 'models');
    
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(modelsPath),
      faceapi.nets.faceLandmark68Net.loadFromUri(modelsPath),
      faceapi.nets.faceRecognitionNet.loadFromUri(modelsPath)
    ]);
    
    console.log('✅ Face-api.js models loaded successfully!');
    console.log('Models loaded:');
    console.log('- TinyFaceDetector');
    console.log('- FaceLandmark68Net');
    console.log('- FaceRecognitionNet');
    
    return true;
  } catch (error) {
    console.error('❌ Error loading face-api.js models:', error.message);
    return false;
  }
}

// Run the test
testFaceApi().then(success => {
  if (success) {
    console.log('\n🎉 Face-api.js is ready to use!');
    console.log('You can now start your server with: npm start');
  } else {
    console.log('\n💥 Face-api.js setup failed. Please check the model files.');
  }
  process.exit(success ? 0 : 1);
});
