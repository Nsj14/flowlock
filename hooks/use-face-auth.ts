"use client"

import { useState, useCallback, useRef } from "react"
import * as faceapi from "@vladmandic/face-api"
import { supabase } from "@/utils/supabase/client"

export function useFaceAuth() {
    const [isModelsLoaded, setIsModelsLoaded] = useState(false)
    const [isEnrolled, setIsEnrolled] = useState<boolean | null>(null)
    const storedDescriptorRef = useRef<Float32Array | null>(null)

    // Load face-api models from the public/models directory
    const loadModels = useCallback(async () => {
        if (isModelsLoaded) return
        try {
            await Promise.all([
                faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
                faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                faceapi.nets.faceRecognitionNet.loadFromUri('/models')
            ])
            setIsModelsLoaded(true)
        } catch (error) {
            console.error("Failed to load face-api models:", error)
        }
    }, [isModelsLoaded])

    // Check if the user has enrolled their face (first checks local cache, then Supabase)
    const checkEnrollmentStatus = useCallback(async () => {
        let descriptorArray: number[] | null = null

        // 1. Try fetching from Supabase (assuming single user profile with id=1)
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('face_descriptor')
                .eq('id', 1)
                .single()

            if (!error && data?.face_descriptor) {
                descriptorArray = data.face_descriptor
            }
        } catch (e) {
            console.warn("Supabase fetch failed, falling back to localStorage", e)
        }

        // 2. Fallback to localStorage
        if (!descriptorArray) {
            const localStored = localStorage.getItem("flowlock_face_descriptor")
            if (localStored) {
                descriptorArray = JSON.parse(localStored)
            }
        }

        if (descriptorArray) {
            storedDescriptorRef.current = new Float32Array(descriptorArray)
            setIsEnrolled(true)
            return true
        }

        setIsEnrolled(false)
        return false
    }, [])

    // Capture face from video element, extract descriptor, and save it
    const enrollFace = useCallback(async (videoElement: HTMLVideoElement) => {
        if (!isModelsLoaded) throw new Error("Models not loaded yet")

        const detection = await faceapi.detectSingleFace(videoElement)
            .withFaceLandmarks()
            .withFaceDescriptor()

        if (!detection) {
            return { success: false, message: "No face detected in the image." }
        }

        const descriptor = detection.descriptor
        const descriptorArray = Array.from(descriptor)

        // Save to LocalStorage layer
        localStorage.setItem("flowlock_face_descriptor", JSON.stringify(descriptorArray))
        storedDescriptorRef.current = descriptor

        // Attempt to save to Supabase
        try {
            const { error: upsertError } = await supabase
                .from('user_profiles')
                .upsert({ id: 1, face_descriptor: descriptorArray })

            if (upsertError) {
                console.warn("Could not save to Supabase. Make sure your environment variables and table are set up. Saved locally.", upsertError)
            }
        } catch (e) {
            console.warn("Supabase upsert failed.", e)
        }

        setIsEnrolled(true)
        return { success: true, message: "Face registered successfully." }
    }, [isModelsLoaded])

    // Authenticate a live video frame against the stored descriptor
    const authenticateFace = useCallback(async (videoElement: HTMLVideoElement) => {
        if (!isModelsLoaded) return { authenticated: false, message: "Models not loaded" }
        if (!storedDescriptorRef.current) return { authenticated: false, message: "No enrolled face found" }

        const detection = await faceapi.detectSingleFace(videoElement)
            .withFaceLandmarks()
            .withFaceDescriptor()

        if (!detection) {
            return { authenticated: false, message: "No face detected" }
        }

        // Calculate Euclidean distance (Face-api threshold usually 0.6; lower is better match)
        const distance = faceapi.euclideanDistance(storedDescriptorRef.current, detection.descriptor)
        const isMatch = distance < 0.6

        return {
            authenticated: isMatch,
            similarity: 1 - distance, // Just a rough conversion to a similarity score 
            message: isMatch ? "Unlocked" : "Access Denied"
        }
    }, [isModelsLoaded])

    // Clear Face Data from both Supabase and local storage
    const resetFaceData = useCallback(async () => {
        localStorage.removeItem("flowlock_face_descriptor")
        storedDescriptorRef.current = null
        setIsEnrolled(false)

        try {
            await supabase.from('user_profiles').update({ face_descriptor: null }).eq('id', 1)
        } catch (e) {
            console.warn("Failed to reset Supabase face data", e)
        }
    }, [])

    return {
        isModelsLoaded,
        isEnrolled,
        loadModels,
        checkEnrollmentStatus,
        enrollFace,
        authenticateFace,
        resetFaceData
    }
}
