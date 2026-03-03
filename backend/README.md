# Face Authentication Backend
This is the FastAPI backend that handles Face Authentication since React/Next.js runs in the browser. 

The python scripts `register.py` and `authenticate.py` were integrated into the `auth_server.py` to allow the Focus Tracker to use them simultaneously via HTTP requests without webcam "Resource Busy" errors.

## Installation
1. Ensure you have Python 3.9+ 
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running
Start the API locally on port 8000:
```bash
python auth_server.py
```

The FlowLock Focus Tracker will ping `http://127.0.0.1:8000` to register the face and authenticate it periodically during study sessions.
