import cv2
import numpy as np
from insightface.app import FaceAnalysis
from numpy.linalg import norm
import time

print("Loading model...")

app = FaceAnalysis(name="buffalo_l")
app.prepare(ctx_id=0, det_size=(640, 640))

stored_embedding = np.load("database/user.npy")

cap = cv2.VideoCapture(0)

print("Authenticating... Look at camera")

start_time = time.time()
authenticated = False

while time.time() - start_time < 3:  # Try for 3 seconds
    ret, frame = cap.read()
    if not ret:
        continue

    faces = app.get(frame)

    if len(faces) > 0:
        new_embedding = faces[0].embedding

        similarity = np.dot(stored_embedding, new_embedding) / (
            norm(stored_embedding) * norm(new_embedding)
        )

        print("Similarity:", similarity)

        if similarity > 0.6:
            print("Unlocked ✅")
            authenticated = True
            break

if not authenticated:
    print("Access Denied ❌")

cap.release()
cv2.destroyAllWindows()
