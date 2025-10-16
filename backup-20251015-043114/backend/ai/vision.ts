import { ImageAnnotatorClient } from '@google-cloud/vision'
import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

// Check if using API key or service account
const usingApiKey = !!process.env.GOOGLE_VISION_API_KEY && !process.env.GOOGLE_APPLICATION_CREDENTIALS

// Initialize Google Vision client (only if using service account)
export const visionClient = usingApiKey ? null : new ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
})

// Extract text from images using OCR
export async function extractTextFromImage(imageBuffer: Buffer): Promise<{
  text: string
  confidence: number
  boundingBoxes: Array<{
    text: string
    confidence: number
    bounds: {
      x: number
      y: number
      width: number
      height: number
    }
  }>
}> {
  try {
    console.log('👁️ Starting Google Vision OCR...')
    
    // Use REST API if API key is configured
    if (usingApiKey) {
      return await extractTextViaRestAPI(imageBuffer)
    }
    
    // Use client library with service account
    if (!visionClient) {
      throw new Error('Google Vision not configured. Add GOOGLE_VISION_API_KEY or GOOGLE_APPLICATION_CREDENTIALS to .env')
    }
    
    // Perform text detection
    const [result] = await visionClient.textDetection({
      image: { content: imageBuffer }
    })
    
    const detections = result.textAnnotations || []
    const fullText = detections[0]?.description || ''
    const confidence = detections[0]?.score || 0
    
    // Extract individual text blocks with bounding boxes
    const textBlocks = detections.slice(1).map(detection => ({
      text: detection.description || '',
      confidence: detection.score || 0,
      bounds: detection.boundingPoly?.vertices?.[0] ? {
        x: detection.boundingPoly.vertices[0].x || 0,
        y: detection.boundingPoly.vertices[0].y || 0,
        width: (detection.boundingPoly.vertices[1]?.x || 0) - (detection.boundingPoly.vertices[0]?.x || 0),
        height: (detection.boundingPoly.vertices[2]?.y || 0) - (detection.boundingPoly.vertices[0]?.y || 0)
      } : { x: 0, y: 0, width: 0, height: 0 }
    }))
    
    console.log(`✅ OCR completed: ${fullText.length} characters extracted`)
    
    return {
      text: fullText,
      confidence,
      boundingBoxes: textBlocks
    }
  } catch (error) {
    console.error('❌ Google Vision OCR failed:', error)
    throw error
  }
}

// Extract text using REST API (for API key authentication)
async function extractTextViaRestAPI(imageBuffer: Buffer): Promise<{
  text: string
  confidence: number
  boundingBoxes: Array<{
    text: string
    confidence: number
    bounds: { x: number; y: number; width: number; height: number }
  }>
}> {
  const response = await axios.post(
    `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`,
    {
      requests: [{
        image: {
          content: imageBuffer.toString('base64')
        },
        features: [{
          type: 'TEXT_DETECTION'
        }]
      }]
    }
  )
  
  const detections = response.data.responses[0]?.textAnnotations || []
  const fullText = detections[0]?.description || ''
  const confidence = detections[0]?.score || 0
  
  const textBlocks = detections.slice(1).map((detection: any) => ({
    text: detection.description || '',
    confidence: detection.score || 0,
    bounds: detection.boundingPoly?.vertices?.[0] ? {
      x: detection.boundingPoly.vertices[0].x || 0,
      y: detection.boundingPoly.vertices[0].y || 0,
      width: (detection.boundingPoly.vertices[1]?.x || 0) - (detection.boundingPoly.vertices[0]?.x || 0),
      height: (detection.boundingPoly.vertices[2]?.y || 0) - (detection.boundingPoly.vertices[0]?.y || 0)
    } : { x: 0, y: 0, width: 0, height: 0 }
  }))
  
  console.log(`✅ OCR completed (REST API): ${fullText.length} characters extracted`)
  
  return {
    text: fullText,
    confidence,
    boundingBoxes: textBlocks
  }
}

// Detect objects and labels in images
export async function analyzeImage(imageBuffer: Buffer): Promise<{
  labels: Array<{
    description: string
    score: number
  }>
  objects: Array<{
    name: string
    score: number
    bounds: {
      x: number
      y: number
      width: number
      height: number
    }
  }>
  faces: Array<{
    confidence: number
    joy: number
    sorrow: number
    anger: number
    surprise: number
  }>
}> {
  try {
    console.log('🔍 Starting Google Vision image analysis...')
    
    // Perform multiple types of analysis
    if (!visionClient) {
      throw new Error('Vision client not initialized')
    }
    
    const [labelResult] = await visionClient.labelDetection({
      image: { content: imageBuffer }
    })
    
    const [objectResult] = await visionClient.objectLocalization?.({
      image: { content: imageBuffer }
    }) || [null]
    
    const [faceResult] = await visionClient.faceDetection({
      image: { content: imageBuffer }
    })
    
    // Process labels
    const labels = (labelResult.labelAnnotations || []).map(label => ({
      description: label.description || '',
      score: label.score || 0
    }))
    
    // Process objects
    const objects = (objectResult?.localizedObjectAnnotations || []).map(obj => ({
      name: obj.name || '',
      score: obj.score || 0,
      bounds: obj.boundingPoly?.normalizedVertices?.[0] ? {
        x: obj.boundingPoly.normalizedVertices[0].x || 0,
        y: obj.boundingPoly.normalizedVertices[0].y || 0,
        width: (obj.boundingPoly.normalizedVertices[1]?.x || 0) - (obj.boundingPoly.normalizedVertices[0]?.x || 0),
        height: (obj.boundingPoly.normalizedVertices[2]?.y || 0) - (obj.boundingPoly.normalizedVertices[0]?.y || 0)
      } : { x: 0, y: 0, width: 0, height: 0 }
    }))
    
    // Process faces
    const faces = (faceResult.faceAnnotations || []).map(face => ({
      confidence: face.detectionConfidence || 0,
      joy: face.joyLikelihood === 'VERY_LIKELY' ? 1.0 : 
           face.joyLikelihood === 'LIKELY' ? 0.8 :
           face.joyLikelihood === 'POSSIBLE' ? 0.5 :
           face.joyLikelihood === 'UNLIKELY' ? 0.2 : 0.1,
      sorrow: face.sorrowLikelihood === 'VERY_LIKELY' ? 1.0 : 
              face.sorrowLikelihood === 'LIKELY' ? 0.8 :
              face.sorrowLikelihood === 'POSSIBLE' ? 0.5 :
              face.sorrowLikelihood === 'UNLIKELY' ? 0.2 : 0.1,
      anger: face.angerLikelihood === 'VERY_LIKELY' ? 1.0 : 
             face.angerLikelihood === 'LIKELY' ? 0.8 :
             face.angerLikelihood === 'POSSIBLE' ? 0.5 :
             face.angerLikelihood === 'UNLIKELY' ? 0.2 : 0.1,
      surprise: face.surpriseLikelihood === 'VERY_LIKELY' ? 1.0 : 
                face.surpriseLikelihood === 'LIKELY' ? 0.8 :
                face.surpriseLikelihood === 'POSSIBLE' ? 0.5 :
                face.surpriseLikelihood === 'UNLIKELY' ? 0.2 : 0.1
    }))
    
    console.log(`✅ Image analysis completed: ${labels.length} labels, ${objects.length} objects, ${faces.length} faces`)
    
    return {
      labels,
      objects,
      faces
    }
  } catch (error) {
    console.error('❌ Google Vision image analysis failed:', error)
    throw error
  }
}

// Test Google Vision connection
export async function testVisionConnection(): Promise<boolean> {
  try {
    // Test with a simple 1x1 pixel image
    const testImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64')
    
    if (usingApiKey) {
      // Test with REST API
      const response = await axios.post(
        `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`,
        {
          requests: [{
            image: { content: testImage.toString('base64') },
            features: [{ type: 'LABEL_DETECTION', maxResults: 1 }]
          }]
        }
      )
      
      if (response.data.responses) {
        console.log('✅ Google Vision connection successful (API Key)')
        return true
      }
    } else {
      // Test with client library
      if (!visionClient) {
        throw new Error('Google Vision not configured')
      }
      
      await visionClient.labelDetection({
        image: { content: testImage }
      })
      
      console.log('✅ Google Vision connection successful (Service Account)')
      return true
    }
    
    return false
  } catch (error) {
    console.error('❌ Google Vision connection failed:', error)
    return false
  }
}
