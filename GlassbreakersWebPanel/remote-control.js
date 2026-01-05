async function fetchAutoLaunchEnabled() {
  try {
    const res = await fetch('/streamer_tools/get_auto_launch_enabled');
    const text = await res.text();
    const enabled = text.trim().toLowerCase() === "true";
    document.getElementById('autoLaunchCheckbox').checked = enabled;
  } catch (err) {
    console.error(err);
  }
}

async function toggleAutoLaunchEnabled() {
  const checkbox = document.getElementById('autoLaunchCheckbox');
  const value = checkbox.checked ? "true" : "false";

  try {
    const res = await fetch('/streamer_tools/set_auto_launch_enabled', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: value
    });

    if (!res.ok) throw new Error('Failed to set auto launch state');
    console.log(`Auto launch ${value === "true" ? "enabled" : "disabled"}`);
  } catch (err) {
    console.error(err);
  }
}

async function resetToDefaults() {
  // Get localized confirmation message
  const confirmMessage = getLocalizedText('reset_confirm');

  if (!confirm(confirmMessage)) {
    return;
  }

  try {
    const res = await fetch('/streamer_tools/reset_to_defaults', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: '{}'
    });

    if (!res.ok) {
      throw new Error('Failed to reset to defaults');
    }

    const result = await res.json();
    console.log('Settings reset to defaults:', result);

    // Refresh the entire UI
    location.reload();
  } catch (err) {
    console.error('Error resetting to defaults:', err);
    alert('Failed to reset settings to defaults. Please try again.');
  }
}
