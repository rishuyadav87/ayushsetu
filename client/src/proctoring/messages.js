// Human-readable messages for every proctoring event type
export const PROCTOR_MESSAGES = {
  // browser / window
  TAB_SWITCH: 'Switched tab or minimised the test window',
  WINDOW_BLUR: 'Focus moved to another app or window',
  FULLSCREEN_EXIT: 'Exited full-screen mode',
  NAVIGATION_BLOCKED: 'Tried to navigate away from the test',
  BLOCKED_SHORTCUT: 'Blocked keyboard shortcut',
  COPY_PASTE: 'Copy / paste attempt blocked',
  RIGHT_CLICK: 'Right-click blocked',
  PRINT_ATTEMPT: 'Tried to print or save the test',
  DEVTOOLS_OPEN: 'Developer tools opened',
  EXTENSION_INJECTION: 'Browser extension modified the test page',
  NETWORK_OFFLINE: 'Internet connection lost',
  // camera AI
  NO_FACE: 'No face visible on camera',
  MULTIPLE_FACES: 'More than one face on camera',
  EXTRA_PERSON: 'Another person detected in the room',
  FACE_MISMATCH: 'A different person appears to be taking the test',
  FACE_SPOOF: 'Photo, video or screen held up to the camera (spoofing)',
  PHONE_DETECTED: 'Mobile phone detected on camera',
  BOOK_DETECTED: 'Book or notes detected on camera',
  SECOND_SCREEN_OBJECT: 'Another screen/laptop visible on camera',
  LOOKING_AWAY: 'Looking away from the screen',
  REPEATED_LOOKING_DOWN: 'Repeatedly looking down (possible phone or notes)',
  CAMERA_OFF: 'Camera turned off or disconnected',
  // microphone
  CANDIDATE_SPEAKING: 'Candidate talking during the test',
  BACKGROUND_VOICE: 'Voice of another person detected',
  MIC_OFF: 'Microphone turned off or disconnected',
  // screen / remote access
  SCREEN_SHARE_STOPPED: 'Entire-screen sharing was stopped',
  SCREEN_SYNC_MISMATCH: 'Shared screen does not match the test screen (remote desktop, extra display or covering window)',
  MULTIPLE_DISPLAYS: 'More than one display connected',
  VIRTUAL_OR_REMOTE_DISPLAY: 'Virtual machine or remote-desktop display detected',
  AUTOMATION_DETECTED: 'Browser automation / bot control detected',
  REMOTE_INPUT_PATTERN: 'Remote-control style mouse movement detected',
  SYNTHETIC_INPUT: 'Script-generated (non-human) input detected',
  INPUT_WITHOUT_PRESENCE: 'Answers entered while no one was in front of the camera',
  INPUT_BY_OTHER_PERSON: 'Answers entered while a different person was on camera',
  TYPING_DETECTED: 'Typing detected during a multiple-choice test',
  ANSWER_BURST: 'Many answers entered within seconds',
  // setup
  ROOM_SCAN_ISSUE: 'Room scan found a phone or another person',
  AI_UNAVAILABLE: 'AI monitoring could not start on this device',
  AI_DEGRADED: 'Device is slow — AI checks ran at a reduced rate',
  MOBILE_DEVICE: 'Test opened on a mobile device',
  RESUMED: 'Test window was closed or reloaded and resumed',
  AI_ASSISTANT_DURING_TEST: 'Tried to use the AI assistant during the test',
  TERMINATED_BY_PROCTOR: 'Attempt terminated by a proctor',
  LATE_SUBMISSION: 'Submitted after the timer ended',
};

export const messageFor = (type) => PROCTOR_MESSAGES[type] || type.replace(/_/g, ' ').toLowerCase();
