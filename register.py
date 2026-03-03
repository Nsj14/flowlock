import cv2
import numpy as np
from insightface.app import FaceAnalysis

print("Initializing model...")

app = FaceAnalysis(name="buffalo_l")
app.prepare(ctx_id=0, det_size=(640, 640))

cap = cv2.VideoCapture(0)

print("Look at the camera. Capturing in 3 seconds...")
cv2.waitKey(3000)

ret, frame = cap.read()

if not ret:
    print("Failed to access camera")
    cap.release()
    exit()

faces = app.get(frame)

if len(faces) == 0:
    print("No face detected")
else:
    embedding = faces[0].embedding
    np.save("database/user.npy", embedding)
    print("Face registered successfully ✅")

cap.release()
cv2.destroyAllWindows()
