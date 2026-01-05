async function fetchCurrentCameraMountName() {
  try {
    const res = await fetch('/camera_mount/get_current_name');
    const cameraName = await res.text();
    document.getElementById('activeCameraMount').textContent = cameraName;
  } catch (err) {
    console.error(err);
    document.getElementById('activeCameraMount').textContent = 'Error';
  }
}

async function cyclePreviousCameraMount() {
  try {
    const res = await fetch('/camera_mount/cycle_previous');
    if (!res.ok) throw new Error('Failed to cycle previous camera');
    await fetchCurrentCameraMountName();
    setSpectatorCameraStatus("Camera mode cycled");
  } catch (err) {
    setSpectatorCameraStatus("Failed to activate previous camera", true);
  }
}

async function cycleNextCameraMount() {
  try {
    const res = await fetch('/camera_mount/cycle_next');
    if (!res.ok) throw new Error('Failed to cycle next camera');
    await fetchCurrentCameraMountName();
    setSpectatorCameraStatus("Camera mode cycled");
  } catch (err) {
    setSpectatorCameraStatus("Failed to activate next camera", true);
  }
}

async function fetchCameraMountIDs() {
  try {
    const response = await fetch('/camera_mount/fetch_ids');
    if (!response.ok) throw new Error('Failed to fetch camera mount IDs');
    const data = await response.json();
    return data.camera_ids || [];
  } catch (e) {
    console.error('Error fetching camera mount IDs:', e);
    return [];
  }
}

async function fetchCameraMountInfo(id) {
  try {
    const response = await fetch(`/camera_mount/get_info?id=${encodeURIComponent(id)}`);
    if (!response.ok) throw new Error(`Failed to fetch info for camera ${id}`);
    const data = await response.json();
    return data;
  } catch (e) {
    console.error('Error fetching camera info:', e);
    return null;
  }
}

async function modifyCameraMountInfo(id, info) {
  try {
    const response = await fetch('/camera_mount/modify', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, info })
    });
    if (!response.ok) throw new Error(`Failed to modify info for camera ${id}`);
  } catch (e) {
    console.error('Error modifying camera info:', e);
  }
}

async function selectCameraMountByName(name) {
  try {
    const response = await fetch('/camera_mount/set_current_by_name', {
      method: 'POST',
      body: name
    });
    if (!response.ok) throw new Error(`Failed to select camera mount ${name}`);
    await fetchCurrentCameraMountName();
  } catch (e) {
    console.error('Error selecting camera mount:', e);
  }
}

async function selectCameraMount(id) {
  try {
    const response = await fetch('/camera_mount/set_current_by_id', {
      method: 'POST',
      body: id.toString()
    });
    if (!response.ok) throw new Error(`Failed to select camera mount ${id}`);
    await fetchCurrentCameraMountName();
  } catch (e) {
    console.error('Error selecting camera mount:', e);
  }
}

async function deleteCameraMount(id) {
  try {
    const response = await fetch(`/camera_mount/delete?id=${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error(`Failed to delete camera mount ${id}`);
    await loadCameraMounts();
  } catch (e) {
    console.error('Error deleting camera:', e);
  }
}

async function createNewCameraMount() {
  console.log('createNewCameraMount() called - starting request');
  try {
    console.log('Making POST request to /camera_mount/create');
    const response = await fetch('/camera_mount/create', {
      method: 'POST'
    });
    console.log('Response received:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server error response:', errorText);
      throw new Error(`Failed to create new camera mount: ${response.status} ${errorText}`);
    }

    const responseText = await response.text();
    console.log('Success response:', responseText);

    console.log('Reloading camera mounts...');
    await loadCameraMounts();
    console.log('Cameras reloaded successfully');
  } catch (e) {
    console.error('Error creating new camera mount:', e);
    alert('Error creating new camera mount: ' + e.message);
  }
}

let isLoadingCameraMounts = false;

async function loadCameraMounts() {
  if (isLoadingCameraMounts) {
    console.log('loadCameraMounts already in progress, skipping...');
    return;
  }

  isLoadingCameraMounts = true;

  try {
    const container = document.getElementById('camerasMountList');
    container.innerHTML = `<p data-i18n="loading_camera_mounts">${getLocalizedText('loading_camera_mounts')}</p>`;
    const ids = await fetchCameraMountIDs();

    if (ids.length === 0) {
      container.innerHTML = `<p data-i18n="no_camera_mounts_found">${getLocalizedText('no_camera_mounts_found')}</p>`;
      return;
    }

    container.innerHTML = '';

    // Fetch all camera info first
    const cameras = [];
    for (const id of ids) {
      const info = await fetchCameraMountInfo(id);
      if (info) {
        cameras.push({ id, info });
      }
    }

    // Group cameras by map
    const camerasByMap = {};
    for (const { id, info } of cameras) {
      const mapName = info.map || 'Unknown Map';
      if (!camerasByMap[mapName]) {
        camerasByMap[mapName] = [];
      }
      camerasByMap[mapName].push({ id, info });
    }

    // Sort map names alphabetically
    const sortedMapNames = Object.keys(camerasByMap).sort();

    // Create grouped display
    for (const mapName of sortedMapNames) {
      // Create map header
      const mapHeader = document.createElement('div');
      mapHeader.className = 'map-group-header';
      mapHeader.textContent = mapName;
      container.appendChild(mapHeader);

      // Create grid container for cameras
      const gridContainer = document.createElement('div');
      gridContainer.className = 'camera-grid';

      // Add Player PoV entry at the start of the first map group
      if (mapName === sortedMapNames[0]) {
        const playerPovDiv = document.createElement('div');
        playerPovDiv.className = 'camera-mount-entry player-pov-entry';

        const playerPovLabel = document.createElement('div');
        playerPovLabel.className = 'camera-name-label';
        playerPovLabel.textContent = 'Player PoV';

        const playerPovSelectButton = document.createElement('button');
        playerPovSelectButton.className = 'select-btn';
        playerPovSelectButton.setAttribute('data-i18n', 'select_mount');
        playerPovSelectButton.textContent = getLocalizedText('select_mount');
        playerPovSelectButton.onclick = () => {
          selectCameraMountByName('Player PoV');
        };

        playerPovDiv.appendChild(playerPovLabel);
        playerPovDiv.appendChild(playerPovSelectButton);
        gridContainer.appendChild(playerPovDiv);
      }

      // Create cameras under this map
      for (const { id, info } of camerasByMap[mapName]) {
        const cameraDiv = document.createElement('div');
        cameraDiv.className = 'camera-mount-entry';

        // Name input row with delete X button
        const nameRow = document.createElement('div');
        nameRow.className = 'camera-name-row';

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'camera-name-input';
        nameInput.value = info.name || '';
        nameInput.placeholder = `Camera ${id}`;
        nameInput.onchange = () => {
          info.name = nameInput.value;
          modifyCameraMountInfo(id, info);
        };

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-btn-x';
        deleteButton.innerHTML = '&times;';
        deleteButton.setAttribute('aria-label', 'Delete');
        deleteButton.onclick = () => {
          if (confirm(`${getLocalizedText('delete_camera_confirm')} '${info.name || id}'?`)) {
            deleteCameraMount(id);
          }
        };

        nameRow.appendChild(nameInput);
        nameRow.appendChild(deleteButton);

        const selectButton = document.createElement('button');
        selectButton.className = 'select-btn';
        selectButton.setAttribute('data-i18n', 'select_mount');
        selectButton.textContent = getLocalizedText('select_mount');
        selectButton.onclick = () => {
          selectCameraMount(id);
        };

        cameraDiv.appendChild(nameRow);
        cameraDiv.appendChild(selectButton);

        gridContainer.appendChild(cameraDiv);
      }

      container.appendChild(gridContainer);
    }
  } finally {
    isLoadingCameraMounts = false;
  }
}

// Map change detection
let currentMapName = null;
let isCheckingMapChange = false;

async function checkForMapChange() {
  if (isCheckingMapChange) {
    return; // Skip if a check is already in progress
  }

  isCheckingMapChange = true;
  try {
    const response = await fetch('/spectator/get_current_map_name');
    if (!response.ok) return;
    const mapName = await response.text();

    if (currentMapName === null) {
      // First time initialization
      currentMapName = mapName;
    } else if (currentMapName !== mapName) {
      // Map has changed, reload camera list and switch to Player PoV
      console.log(`Map changed from '${currentMapName}' to '${mapName}', reloading cameras...`);
      currentMapName = mapName;
      await loadCameraMounts();
      await selectCameraMountByName('Player PoV');
    }
  } catch (e) {
    console.error('Error checking for map change:', e);
  } finally {
    isCheckingMapChange = false;
  }
}

// Poll for map changes every 3 seconds
setInterval(checkForMapChange, 3000);
