// SpeakLife AI — Gaze Vector & Posture Tracking Math
// Operates on MediaPipe FaceMesh (468 landmarks) & BlazePose (33 landmarks)

export interface Point3D {
  x: number; // 0.0 to 1.0 (normalized screen coords)
  y: number; // 0.0 to 1.0
  z: number; // relative depth
}

export interface GazeFrameResult {
  hasFace: boolean;
  isMaintainingEyeContact: boolean;
  gazeYawDegrees: number;   // Horizontal gaze angle
  gazePitchDegrees: number; // Vertical gaze angle
  headYawDegrees: number;
  headPitchDegrees: number;
  headRollDegrees: number;
  postureStable: boolean;
  shoulderTiltDegrees: number;
}

// MediaPipe Landmark Index Constants
export const MESH_INDEX = {
  NOSE_TIP: 1,
  CHIN: 152,
  LEFT_EYE_OUTER: 33,
  LEFT_EYE_INNER: 133,
  RIGHT_EYE_INNER: 362,
  RIGHT_EYE_OUTER: 263,
  LEFT_IRIS_CENTER: 468,
  RIGHT_IRIS_CENTER: 473
};

export const POSE_INDEX = {
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12
};

export function computeGazeAngle(
  faceLandmarks?: Point3D[] | null,
  poseLandmarks?: Point3D[] | null
): GazeFrameResult {
  if (!faceLandmarks || faceLandmarks.length < 468) {
    return {
      hasFace: false,
      isMaintainingEyeContact: false,
      gazeYawDegrees: 0,
      gazePitchDegrees: 0,
      headYawDegrees: 0,
      headPitchDegrees: 0,
      headRollDegrees: 0,
      postureStable: false,
      shoulderTiltDegrees: 0
    };
  }

  // 1. Head Pose Estimation
  const nose = faceLandmarks[MESH_INDEX.NOSE_TIP];
  const chin = faceLandmarks[MESH_INDEX.CHIN];
  const leftEyeOuter = faceLandmarks[MESH_INDEX.LEFT_EYE_OUTER];
  const rightEyeOuter = faceLandmarks[MESH_INDEX.RIGHT_EYE_OUTER];

  // Eye midpoint
  const eyeMidX = (leftEyeOuter.x + rightEyeOuter.x) / 2;
  const eyeMidY = (leftEyeOuter.y + rightEyeOuter.y) / 2;

  // Yaw: horizontal displacement of nose relative to eye center
  const headYaw = (nose.x - eyeMidX) * 120; // approximate degrees
  // Pitch: vertical displacement of nose relative to midpoint between eyes and chin
  const faceHeight = Math.abs(chin.y - eyeMidY);
  const headPitch = ((nose.y - eyeMidY) / Math.max(0.01, faceHeight) - 0.45) * 90;
  // Roll: tilt between two eyes
  const headRoll = Math.atan2(rightEyeOuter.y - leftEyeOuter.y, rightEyeOuter.x - leftEyeOuter.x) * (180 / Math.PI);

  // 2. Iris Displacement (Gaze Offset)
  let gazeYaw = headYaw;
  let gazePitch = headPitch;

  if (faceLandmarks.length >= 478) {
    const leftIris = faceLandmarks[MESH_INDEX.LEFT_IRIS_CENTER];
    const rightIris = faceLandmarks[MESH_INDEX.RIGHT_IRIS_CENTER];
    const leftInner = faceLandmarks[MESH_INDEX.LEFT_EYE_INNER];
    const rightInner = faceLandmarks[MESH_INDEX.RIGHT_EYE_INNER];

    const leftIrisRatio = (leftIris.x - leftEyeOuter.x) / Math.max(0.001, leftInner.x - leftEyeOuter.x);
    const rightIrisRatio = (rightIris.x - rightInner.x) / Math.max(0.001, rightEyeOuter.x - rightInner.x);
    const avgIrisRatio = (leftIrisRatio + rightIrisRatio) / 2;

    // Center is approximately 0.5
    const irisYawOffset = (avgIrisRatio - 0.5) * 45;
    gazeYaw += irisYawOffset;
  }

  // Acceptance cone for Eye Contact: |yaw| <= 16 degrees, |pitch| <= 18 degrees
  const isEyeContact = Math.abs(gazeYaw) <= 16 && Math.abs(gazePitch) <= 18;

  // 3. Posture / Shoulder Tilt
  let shoulderTilt = 0;
  let postureStable = true;

  if (poseLandmarks && poseLandmarks.length > 12) {
    const leftShoulder = poseLandmarks[POSE_INDEX.LEFT_SHOULDER];
    const rightShoulder = poseLandmarks[POSE_INDEX.RIGHT_SHOULDER];
    shoulderTilt = Math.abs(
      Math.atan2(rightShoulder.y - leftShoulder.y, rightShoulder.x - leftShoulder.x) * (180 / Math.PI)
    );
    postureStable = shoulderTilt <= 10;
  }

  return {
    hasFace: true,
    isMaintainingEyeContact: isEyeContact,
    gazeYawDegrees: Math.round(gazeYaw * 10) / 10,
    gazePitchDegrees: Math.round(gazePitch * 10) / 10,
    headYawDegrees: Math.round(headYaw * 10) / 10,
    headPitchDegrees: Math.round(headPitch * 10) / 10,
    headRollDegrees: Math.round(headRoll * 10) / 10,
    postureStable,
    shoulderTiltDegrees: Math.round(shoulderTilt * 10) / 10
  };
}
