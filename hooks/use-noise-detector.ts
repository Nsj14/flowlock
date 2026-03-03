"use client"

import { useRef, useState, useCallback } from "react"

// ── YAMNet 521 class names (from yamnet_class_map.csv) ──
const YAMNET_CLASSES = [
    "Speech", "Child speech, kid speaking", "Conversation", "Narration, monologue", "Babbling",
    "Speech synthesizer", "Shout", "Bellow", "Whoop", "Yell", "Children shouting", "Screaming",
    "Whispering", "Laughter", "Baby laughter", "Giggle", "Snicker", "Belly laugh", "Chuckle, chortle",
    "Crying, sobbing", "Baby cry, infant cry", "Whimper", "Wail, moan", "Sigh", "Singing", "Choir",
    "Yodeling", "Chant", "Mantra", "Child singing", "Synthetic singing", "Rapping", "Humming", "Groan",
    "Grunt", "Whistling", "Breathing", "Wheeze", "Snoring", "Gasp", "Pant", "Snort", "Cough",
    "Throat clearing", "Sneeze", "Sniff", "Run", "Shuffle", "Walk, footsteps", "Chewing, mastication",
    "Biting", "Gargling", "Stomach rumble", "Burping, eructation", "Hiccup", "Fart", "Hands",
    "Finger snapping", "Clapping", "Heart sounds, heartbeat", "Heart murmur", "Cheering", "Applause",
    "Chatter", "Crowd", "Hubbub, speech noise, speech babble", "Children playing", "Animal",
    "Domestic animals, pets", "Dog", "Bark", "Yip", "Howl", "Bow-wow", "Growling", "Whimper (dog)",
    "Cat", "Purr", "Meow", "Hiss", "Caterwaul", "Livestock, farm animals, working animals", "Horse",
    "Clip-clop", "Neigh, whinny", "Cattle, bovinae", "Moo", "Cowbell", "Pig", "Oink", "Goat", "Bleat",
    "Sheep", "Fowl", "Chicken, rooster", "Cluck", "Crowing, cock-a-doodle-doo", "Turkey", "Gobble",
    "Duck", "Quack", "Goose", "Honk", "Wild animals", "Roaring cats (lions, tigers)", "Roar", "Bird",
    "Bird vocalization, bird call, bird song", "Chirp, tweet", "Squawk", "Pigeon, dove", "Coo",
    "Crow", "Caw", "Owl", "Hoot", "Bird flight, flapping wings", "Canidae, dogs, wolves",
    "Rodents, rats, mice", "Mouse", "Patter", "Insect", "Cricket", "Mosquito", "Fly, housefly", "Buzz",
    "Bee, wasp, etc.", "Frog", "Croak", "Snake", "Rattle", "Whale vocalization", "Music",
    "Musical instrument", "Plucked string instrument", "Guitar", "Electric guitar", "Bass guitar",
    "Acoustic guitar", "Steel guitar, slide guitar", "Tapping (guitar technique)", "Strum", "Banjo",
    "Sitar", "Mandolin", "Zither", "Ukulele", "Keyboard (musical)", "Piano", "Electric piano", "Organ",
    "Electronic organ", "Hammond organ", "Synthesizer", "Sampler", "Harpsichord", "Percussion",
    "Drum kit", "Drum machine", "Drum", "Snare drum", "Rimshot", "Drum roll", "Bass drum", "Timpani",
    "Tabla", "Cymbal", "Hi-hat", "Wood block", "Tambourine", "Rattle (instrument)", "Maraca", "Gong",
    "Tubular bells", "Mallet percussion", "Marimba, xylophone", "Glockenspiel", "Vibraphone",
    "Steelpan", "Orchestra", "Brass instrument", "French horn", "Trumpet", "Trombone",
    "Bowed string instrument", "String section", "Violin, fiddle", "Pizzicato", "Cello", "Double bass",
    "Wind instrument, woodwind instrument", "Flute", "Saxophone", "Clarinet", "Harp", "Bell",
    "Church bell", "Jingle bell", "Bicycle bell", "Tuning fork", "Chime", "Wind chime",
    "Change ringing (campanology)", "Harmonica", "Accordion", "Bagpipes", "Didgeridoo", "Shofar",
    "Theremin", "Singing bowl", "Scratching (performance technique)", "Pop music", "Hip hop music",
    "Beatboxing", "Rock music", "Heavy metal", "Punk rock", "Grunge", "Progressive rock",
    "Rock and roll", "Psychedelic rock", "Rhythm and blues", "Soul music", "Reggae", "Country",
    "Swing music", "Bluegrass", "Funk", "Folk music", "Middle Eastern music", "Jazz", "Disco",
    "Classical music", "Opera", "Electronic music", "House music", "Techno", "Dubstep", "Drum and bass",
    "Electronica", "Electronic dance music", "Ambient music", "Trance music", "Music of Latin America",
    "Salsa music", "Flamenco", "Blues", "Music for children", "New-age music", "Vocal music",
    "A capella", "Music of Africa", "Afrobeat", "Christian music", "Gospel music", "Music of Asia",
    "Carnatic music", "Music of Bollywood", "Ska", "Traditional music", "Independent music", "Song",
    "Background music", "Theme music", "Jingle (music)", "Soundtrack music", "Lullaby",
    "Video game music", "Christmas music", "Dance music", "Wedding music", "Happy music", "Sad music",
    "Tender music", "Exciting music", "Angry music", "Scary music", "Wind", "Rustling leaves",
    "Wind noise (microphone)", "Thunderstorm", "Thunder", "Water", "Rain", "Raindrop",
    "Rain on surface", "Stream", "Waterfall", "Ocean", "Waves, surf", "Steam", "Gurgling", "Fire",
    "Crackle", "Vehicle", "Boat, Water vehicle", "Sailboat, sailing ship",
    "Rowboat, canoe, kayak", "Motorboat, speedboat", "Ship", "Motor vehicle (road)", "Car",
    "Vehicle horn, car horn, honking", "Toot", "Car alarm", "Power windows, electric windows",
    "Skidding", "Tire squeal", "Car passing by", "Race car, auto racing", "Truck", "Air brake",
    "Air horn, truck horn", "Reversing beeps", "Ice cream truck, ice cream van", "Bus",
    "Emergency vehicle", "Police car (siren)", "Ambulance (siren)",
    "Fire engine, fire truck (siren)", "Motorcycle", "Traffic noise, roadway noise", "Rail transport",
    "Train", "Train whistle", "Train horn", "Railroad car, train wagon", "Train wheels squealing",
    "Subway, metro, underground", "Aircraft", "Aircraft engine", "Jet engine",
    "Propeller, airscrew", "Helicopter", "Fixed-wing aircraft, airplane", "Bicycle", "Skateboard",
    "Engine", "Light engine (high frequency)", "Dental drill, dentist's drill", "Lawn mower",
    "Chainsaw", "Medium engine (mid frequency)", "Heavy engine (low frequency)", "Engine knocking",
    "Engine starting", "Idling", "Accelerating, revving, vroom", "Door", "Doorbell", "Ding-dong",
    "Sliding door", "Slam", "Knock", "Tap", "Squeak", "Cupboard open or close",
    "Drawer open or close", "Dishes, pots, and pans", "Cutlery, silverware", "Chopping (food)",
    "Frying (food)", "Microwave oven", "Blender", "Water tap, faucet",
    "Sink (filling or washing)", "Bathtub (filling or washing)", "Hair dryer", "Toilet flush",
    "Toothbrush", "Electric toothbrush", "Vacuum cleaner", "Zipper (clothing)", "Keys jangling",
    "Coin (dropping)", "Scissors", "Electric shaver, electric razor", "Shuffling cards", "Typing",
    "Typewriter", "Computer keyboard", "Writing", "Alarm", "Telephone", "Telephone bell ringing",
    "Ringtone", "Telephone dialing, DTMF", "Dial tone", "Busy signal", "Alarm clock", "Siren",
    "Civil defense siren", "Buzzer", "Smoke detector, smoke alarm", "Fire alarm", "Foghorn",
    "Whistle", "Steam whistle", "Mechanisms", "Ratchet, pawl", "Clock", "Tick", "Tick-tock", "Gears",
    "Pulleys", "Sewing machine", "Mechanical fan", "Air conditioning", "Cash register", "Printer",
    "Camera", "Single-lens reflex camera", "Tools", "Hammer", "Jackhammer", "Sawing", "Filing (rasp)",
    "Sanding", "Power tool", "Drill", "Explosion", "Gunshot, gunfire", "Machine gun", "Fusillade",
    "Artillery fire", "Cap gun", "Fireworks", "Firecracker", "Burst, pop", "Eruption", "Boom", "Wood",
    "Chop", "Splinter", "Crack", "Glass", "Chink, clink", "Shatter", "Liquid", "Splash, splatter",
    "Slosh", "Squish", "Drip", "Pour", "Trickle, dribble", "Gush", "Fill (with liquid)", "Spray",
    "Pump (liquid)", "Stir", "Boiling", "Sonar", "Arrow", "Whoosh, swoosh, swish", "Thump, thud",
    "Thunk", "Electronic tuner", "Effects unit", "Chorus effect", "Basketball bounce", "Bang",
    "Slap, smack", "Whack, thwack", "Smash, crash", "Breaking", "Bouncing", "Whip", "Flap", "Scratch",
    "Scrape", "Rub", "Roll", "Crushing", "Crumpling, crinkling", "Tearing", "Beep, bleep", "Ping",
    "Ding", "Clang", "Squeal", "Creak", "Rustle", "Whir", "Clatter", "Sizzle", "Clicking",
    "Clickety-clack", "Rumble", "Plop", "Jingle, tinkle", "Hum", "Zing", "Boing", "Crunch", "Silence",
    "Sine wave", "Harmonic", "Chirp tone", "Sound effect", "Pulse", "Inside, small room",
    "Inside, large room or hall", "Inside, public space", "Outside, urban or manmade",
    "Outside, rural or natural", "Reverberation", "Echo", "Noise", "Environmental noise", "Static",
    "Mains hum", "Distortion", "Sidetone", "Cacophony", "White noise", "Pink noise", "Throbbing",
    "Vibration", "Television", "Radio", "Field recording",
]

// ── Configuration (matching Python script) ──
const DB_THRESHOLD = -42
const MIN_CONFIDENCE = 0.07
const SAMPLE_RATE = 16000
const CHUNK_DURATION = 1.0 // seconds
const BUFFER_SIZE = 4096

export interface NoiseState {
    dbLevel: number
    soundLabel: string
    confidence: number
    noiseStatus: "quiet" | "moderate" | "high"
    highNoiseCount: number
    isLoading: boolean
    micDenied: boolean
    micActive: boolean
}

const initialState: NoiseState = {
    dbLevel: -100,
    soundLabel: "",
    confidence: 0,
    noiseStatus: "quiet",
    highNoiseCount: 0,
    isLoading: false,
    micDenied: false,
    micActive: false,
}

export function useNoiseDetector() {
    const [noiseState, setNoiseState] = useState<NoiseState>(initialState)

    // Refs for mutable state
    const audioContextRef = useRef<AudioContext | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const processorRef = useRef<ScriptProcessorNode | null>(null)
    const modelRef = useRef<any>(null)
    const isRunningRef = useRef(false)
    const audioBufferRef = useRef<Float32Array>(new Float32Array(0))
    const highNoiseCountRef = useRef(0)
    const previousLabelRef = useRef<string>("")
    const alertCallbackRef = useRef<((label: string, confidence: number) => void) | null>(null)

    // Set the alert callback
    const setAlertCallback = useCallback((cb: (label: string, confidence: number) => void) => {
        alertCallbackRef.current = cb
    }, [])

    // Process a 1-second audio chunk through YAMNet
    const processChunk = useCallback(async (audioData: Float32Array) => {
        if (!modelRef.current || !isRunningRef.current) return

        try {
            const tf = await import("@tensorflow/tfjs")

            // Compute RMS → dBFS
            let sumSq = 0
            for (let i = 0; i < audioData.length; i++) {
                sumSq += audioData[i] * audioData[i]
            }
            const rms = Math.sqrt(sumSq / audioData.length)
            const db = 20 * Math.log10(rms + 1e-10)

            // Run YAMNet: input is a 1D float32 tensor of audio samples
            const inputTensor = tf.tensor1d(audioData)
            const output = await modelRef.current.predict(inputTensor)

            // YAMNet TFJS outputs a single tensor of shape [frames, 521]
            let scores: any
            if (Array.isArray(output)) {
                scores = output[0] // first output is scores
            } else {
                scores = output
            }

            const scoresData = await scores.data()
            const numClasses = 521
            const numFrames = scoresData.length / numClasses

            // Average scores across frames
            const meanScores = new Float32Array(numClasses)
            for (let c = 0; c < numClasses; c++) {
                let sum = 0
                for (let f = 0; f < numFrames; f++) {
                    sum += scoresData[f * numClasses + c]
                }
                meanScores[c] = sum / numFrames
            }

            // Find top class
            let topIndex = 0
            let topConf = meanScores[0]
            for (let i = 1; i < numClasses; i++) {
                if (meanScores[i] > topConf) {
                    topConf = meanScores[i]
                    topIndex = i
                }
            }

            const topLabel = YAMNET_CLASSES[topIndex] || "Unknown"
            const classified = topConf > MIN_CONFIDENCE

            // Determine noise status
            let noiseStatus: "quiet" | "moderate" | "high" = "quiet"
            if (db > DB_THRESHOLD) {
                noiseStatus = "high"
            } else if (db > DB_THRESHOLD - 15) {
                noiseStatus = "moderate"
            }

            // Alert logic (mirrors Python script exactly)
            if (db > DB_THRESHOLD) {
                // High noise
                highNoiseCountRef.current++
                if (alertCallbackRef.current) {
                    if (classified) {
                        alertCallbackRef.current(topLabel, topConf)
                    } else {
                        alertCallbackRef.current("Unclassified noise", 0)
                    }
                }
            } else {
                // Low noise — subtle log for new classified sounds
                if (classified && topLabel !== previousLabelRef.current) {
                    previousLabelRef.current = topLabel
                }
            }

            // Update state
            setNoiseState(prev => ({
                ...prev,
                dbLevel: db,
                soundLabel: classified ? topLabel : (db > DB_THRESHOLD ? "Unclassified" : prev.soundLabel),
                confidence: classified ? topConf : 0,
                noiseStatus,
                highNoiseCount: highNoiseCountRef.current,
            }))

            // Cleanup tensors
            inputTensor.dispose()
            if (Array.isArray(output)) {
                output.forEach((t: any) => t.dispose?.())
            } else {
                scores.dispose?.()
            }
        } catch (err) {
            console.error("Noise detection error:", err)
        }
    }, [])

    // Start noise detection
    const startNoise = useCallback(async () => {
        if (isRunningRef.current) return

        setNoiseState(prev => ({ ...prev, isLoading: true, micDenied: false }))

        try {
            // 1. Load TensorFlow.js and YAMNet model
            if (!modelRef.current) {
                const tf = await import("@tensorflow/tfjs")
                await tf.ready()

                // Load YAMNet TFJS model from TFHub
                modelRef.current = await tf.loadGraphModel(
                    "https://tfhub.dev/google/tfjs-model/yamnet/tfjs/1",
                    { fromTFHub: true }
                )
            }

            // 2. Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: SAMPLE_RATE,
                    channelCount: 1,
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                },
            })
            streamRef.current = stream

            // 3. Set up AudioContext + ScriptProcessorNode
            const audioContext = new AudioContext({ sampleRate: SAMPLE_RATE })
            audioContextRef.current = audioContext

            const source = audioContext.createMediaStreamSource(stream)
            const processor = audioContext.createScriptProcessor(BUFFER_SIZE, 1, 1)
            processorRef.current = processor

            const samplesPerChunk = SAMPLE_RATE * CHUNK_DURATION
            let collectedSamples = new Float32Array(0)

            processor.onaudioprocess = (event) => {
                if (!isRunningRef.current) return

                const inputData = event.inputBuffer.getChannelData(0)

                // Accumulate samples
                const newCollected = new Float32Array(collectedSamples.length + inputData.length)
                newCollected.set(collectedSamples)
                newCollected.set(inputData, collectedSamples.length)
                collectedSamples = newCollected

                // Process when we have enough for 1 second
                if (collectedSamples.length >= samplesPerChunk) {
                    const chunk = collectedSamples.slice(0, samplesPerChunk)
                    collectedSamples = collectedSamples.slice(samplesPerChunk)
                    processChunk(chunk)
                }
            }

            source.connect(processor)
            processor.connect(audioContext.destination)

            isRunningRef.current = true
            highNoiseCountRef.current = 0
            previousLabelRef.current = ""

            setNoiseState(prev => ({
                ...prev,
                isLoading: false,
                micActive: true,
                highNoiseCount: 0,
                dbLevel: -100,
                soundLabel: "",
                confidence: 0,
                noiseStatus: "quiet",
            }))
        } catch (err: any) {
            console.error("Noise detector start error:", err)
            const micDenied = err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
            setNoiseState(prev => ({
                ...prev,
                isLoading: false,
                micDenied,
                micActive: false,
            }))
        }
    }, [processChunk])

    // Stop noise detection
    const stopNoise = useCallback(() => {
        isRunningRef.current = false

        if (processorRef.current) {
            processorRef.current.disconnect()
            processorRef.current = null
        }

        if (audioContextRef.current) {
            audioContextRef.current.close().catch(() => { })
            audioContextRef.current = null
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
        }

        setNoiseState(prev => ({
            ...prev,
            micActive: false,
        }))
    }, [])

    return { noiseState, startNoise, stopNoise, setAlertCallback }
}
