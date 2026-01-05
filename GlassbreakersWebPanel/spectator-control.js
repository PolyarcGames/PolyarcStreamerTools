async function fetchSpectatorCameraEnabledFlag() {
  try {
    const res = await fetch('/spectator/get_enabled');
    const text = await res.text();
    const enabled = text.trim().toLowerCase() === "true";
    document.getElementById('cameraEnabledCheckbox').checked = enabled;
  } catch (err) {
    console.error(err);
  }
}

async function toggleSpectatorCameraEnabledFlag() {
  const checkbox = document.getElementById('cameraEnabledCheckbox');
  const value = checkbox.checked ? "true" : "false";

  try {
    const res = await fetch('/spectator/set_enabled', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: value
    });

    if (!res.ok) throw new Error('Failed to set state');
    setSpectatorCameraStatus(`Spectator camera ${value === "true" ? "enabled" : "disabled"}`);
  } catch (err) {
    console.error(err);
    setSpectatorCameraStatus("Failed to update camera state", true);
  }
}

function setSpectatorCameraStatus(msg, isError = false) {
  const status = document.getElementById('status');
  status.textContent = msg;
  status.style.color = isError ? "red" : "green";
}

// Update range input display value
function updateRangeDisplay(rangeElementId, value) {
  const displayElement = document.getElementById(`${rangeElementId}Value`);
  if (displayElement) {
    displayElement.textContent = value;
  }
}

// Convenience function for personal bubble radius
function updatePersonalBubbleRadiusDisplay(value) {
  updateRangeDisplay('personalBubbleRadius', value);
}

// Load all spectator settings
async function loadSpectatorSettings() {
  const settings = {
    'auto_focus': 'autoFocusCheckbox',
    'right_thumbstick_cycle': 'rightThumbstickCycleCheckbox',
    'camera_mounts_hidden': 'hideCameraMountsCheckbox',
    'spectator_hud_hidden': 'hideSpectatorHUDCheckbox',
    'velocity_smoothing': 'velocitySmoothing',
    'rotation_smoothing': 'rotationSmoothing',
    'max_lag_distance': 'maxLagDistance',
    'fov': 'fov',
    'pixel_density': 'pixelDensity',
    'gamma': 'gamma',
    'personal_bubble_radius': 'personalBubbleRadius',
    'overlay_ui_scale': 'overlayUIScale',
    'resolution': 'resolution',
    'roll_enabled': 'rollEnabledCheckbox'
  };

  for (const [endpoint, elementId] of Object.entries(settings)) {
    try {
      const response = await fetch(`/spectator/get_${endpoint}`);
      if (!response.ok) continue;

      const value = await response.text();
      const element = document.getElementById(elementId);

      if (!element) continue;

      if (element.type === 'checkbox') {
        element.checked = value.trim().toLowerCase() === 'true';
        // Update Add Camera button state when camera_mounts_hidden is loaded
        if (endpoint === 'camera_mounts_hidden') {
          updateAddCameraButtonState(element.checked);
        }
      } else {
        element.value = value.trim();
        // Update display for range inputs
        if (element.type === 'range') {
          const displayElement = document.getElementById(`${elementId}Value`);
          if (displayElement) {
            displayElement.textContent = value.trim();
          }
        }
      }
    } catch (e) {
      console.error(`Error loading ${endpoint}:`, e);
    }
  }

  // Load overlay settings
  await loadOverlaySettings();
}

// Update a spectator setting
async function updateSpectatorSetting(setting, value) {
  try {
    let bodyValue = typeof value === 'boolean' ? (value ? 'true' : 'false') : value.toString();

    const response = await fetch(`/spectator/set_${setting}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: bodyValue
    });

    if (!response.ok) throw new Error(`Failed to update ${setting}`);

    setSpectatorCameraStatus(`Updated ${setting}`);
  } catch (e) {
    console.error(`Error updating ${setting}:`, e);
    setSpectatorCameraStatus(`Failed to update ${setting}`, true);
  }
}

// Update the Add Camera button state based on Hide Camera Mounts checkbox
function updateAddCameraButtonState(hideCameraMounts) {
  const addCameraBtn = document.getElementById('addCameraMountBtn');
  if (addCameraBtn) {
    addCameraBtn.disabled = hideCameraMounts;
  }
}

// Load overlay settings
async function loadOverlaySettings() {
  try {
    const response = await fetch('/overlay/get_enabled');
    if (!response.ok) return;

    const value = await response.text();
    const element = document.getElementById('overlayEnabledCheckbox');

    if (element) {
      element.checked = value.trim().toLowerCase() === 'true';
    }
  } catch (e) {
    console.error('Error loading overlay settings:', e);
  }
}

// Update an overlay setting
async function updateOverlaySetting(setting, value) {
  try {
    let bodyValue = typeof value === 'boolean' ? (value ? 'true' : 'false') : value.toString();

    const response = await fetch(`/overlay/set_${setting}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: bodyValue
    });

    if (!response.ok) throw new Error(`Failed to update overlay ${setting}`);

    setSpectatorCameraStatus(`Updated overlay ${setting}`);
  } catch (e) {
    console.error(`Error updating overlay ${setting}:`, e);
    setSpectatorCameraStatus(`Failed to update overlay ${setting}`, true);
  }
}