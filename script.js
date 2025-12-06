const video = document.getElementById("video");
const blinkMsg = document.getElementById("blink");

// Debug: live EAR display
let earDisplay = document.createElement("div");
earDisplay.style.position = "fixed";
earDisplay.style.top = "10px";
earDisplay.style.right = "10px";
earDisplay.style.fontSize = "24px";
earDisplay.style.color = "white";
earDisplay.style.background = "rgba(0,0,0,0.4)";
earDisplay.style.padding = "6px 10px";
earDisplay.style.borderRadius = "6px";
earDisplay.style.zIndex = "9999";
document.body.appendChild(earDisplay);

// Start with a high threshold until we know your EAR range
let BLINK_THRESHOLD = 0.35;

let blinkCooldown = false;

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function getEAR(upper, lower, left, right) {
  const vertical = dist(upper, lower);
  const horizontal = dist(left, right);
  return vertical / horizontal;
}

function showBlink() {
  blinkMsg.classList.add("show");
  setTimeout(() => blinkMsg.classList.remove("show"), 3000);
}

async function setupCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
  return new Promise((resolve) => {
    video.onloadedmetadata = resolve;
  });
}

async function main() {
  await setupCamera();

  const faceMesh = new FaceMesh.FaceMesh({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
  });

  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  faceMesh.onResults((results) => {
    if (!results.multiFaceLandmarks?.length) return;

    const lm = results.multiFaceLandmarks[0];

    const EAR_left = getEAR(lm[159], lm[145], lm[33], lm[133]);
    const EAR_right = getEAR(lm[386], lm[374], lm[362], lm[263]);
    const EAR = (EAR_left + EAR_right) / 2;

    // 🔍 Show EAR on screen
    earDisplay.innerText = `EAR: ${EAR.toFixed(3)}  (TH: ${BLINK_THRESHOLD})`;

    // 🔥 Detect blink
    if (EAR < BLINK_THRESHOLD && !blinkCooldown) {
      blinkCooldown = true;
      showBlink();
      setTimeout(() => (blinkCooldown = false), 400);
    }
  });

  const camera = new Camera(video, {
    onFrame: async () => {
      await faceMesh.send({ image: video });
    },
    width: 640,
    height: 480,
  });

  camera.start();
}

main();
