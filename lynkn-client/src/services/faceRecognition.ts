import * as faceapi from 'face-api.js';

const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

export const loadModels = async () => {
  if (faceapi.nets.tinyFaceDetector.params) return;

  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    console.log("Motores Biométricos cargados desde CDN Oficial");
  } catch (error) {
    console.error("Error al cargar modelos desde el CDN:", error);
  }
};

/* Compara dos imágenes y calcula la distancia euclidiana */
export const compareFaces = async (image1: string, image2: string): Promise<boolean> => {
  try {
    const img1 = await faceapi.fetchImage(image1);
    const img2 = await faceapi.fetchImage(image2);

    const options = new faceapi.TinyFaceDetectorOptions({ 
      inputSize: 416, 
      scoreThreshold: 0.4 
    });

    const d1 = await faceapi.detectSingleFace(img1, options).withFaceLandmarks().withFaceDescriptor();
    const d2 = await faceapi.detectSingleFace(img2, options).withFaceLandmarks().withFaceDescriptor();

    if (!d1 || !d2) {
      throw new Error("No se detectó un rostro claro en alguna de las imágenes.");
    }

    const distance = faceapi.euclideanDistance(d1.descriptor, d2.descriptor);
    
    if (distance > 10) {
      console.error("Error de precisión en el descriptor.");
      return false;
    }

    console.log(`Distancia facial: ${distance.toFixed(4)}`);

    return distance < 0.6;

  } catch (error) {
    console.error("Error en compareFaces:", error);
    throw error;
  }
};