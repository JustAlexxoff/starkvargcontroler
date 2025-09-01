document.addEventListener('DOMContentLoaded', () => {
    const splashScreen = document.getElementById('splash-screen');
    const mainScreen = document.getElementById('main-screen');
    const powerModeElement = document.getElementById('power-mode-value');
    const mileageValueHeaderElement = document.getElementById('mileage-value-header'); // ID for mileage
    const batteryPercentageHeaderElement = document.getElementById('battery-percentage-header'); // ID for battery
    const batteryDisplayElement = document.querySelector('.battery-display'); // New: for changing background color
    const batteryIconElement = document.querySelector('.battery-icon'); // New: for changing battery icon
    const ridingTimeValueBottomElement = document.getElementById('riding-time-value-bottom'); // Re-introduced
    const speedArcFillElement = document.querySelector('.speed-arc-fill'); // New: for speed arc

    const flashingBlueImageElement = document.getElementById('flashing-blue-image'); // New: For flashing blue image

    const baterryIconContainer = document.getElementById('baterry-icon-container'); // New: For battery icon
    const engineIconContainer = document.getElementById('engine-icon-container');   // New: For engine icon

    let batteryLevel = parseFloat(localStorage.getItem('batteryLevel')) || 47;
    let powerMode = parseInt(localStorage.getItem('powerMode')) || 4;
    let ridingTimeSeconds = 0; // Reset riding time on each load
    let totalDistance = parseFloat(localStorage.getItem('totalDistance')) || 0; // Keeping totalDistance for calculations, not display
    let currentSpeedKmH = parseInt(localStorage.getItem('currentSpeedKmH')) || 0;
    const MAX_DISTANCE_FOR_100_PERCENT = 35; // km
    const MAX_SPEED_FOR_ARC = 55; // km/h
    const SPEED_ARC_CIRCUMFERENCE = 3675.8; // Circumference for an oval arc (approx. pi * (rx + ry) * 2)

    const themeToggleButton = document.getElementById('theme-toggle'); // New: Theme toggle button

    // --- Splash Screen Logic ---
    const debugInfoElement = document.getElementById('debug-info'); // New: For debugging output

    function updateDebugInfo(message) {
        if (debugInfoElement) {
            debugInfoElement.textContent = message;
        }
    }

    setTimeout(() => {
        splashScreen.style.opacity = '0';
        splashScreen.addEventListener('transitionend', () => {
            splashScreen.classList.add('hidden');
            mainScreen.classList.add('visible');
            mainScreen.style.opacity = '1';
            setupBatteryIndicator(); // Call setup when main screen is visible

            // New: Start flashing the blue image
            if (flashingBlueImageElement) {
                flashingBlueImageElement.classList.remove('hidden');
                flashingBlueImageElement.classList.add('flashing');
                setTimeout(() => {
                    flashingBlueImageElement.classList.add('move-left-fade-out'); // Trigger animation
                    flashingBlueImageElement.addEventListener('animationend', () => {
                        flashingBlueImageElement.classList.remove('move-left-fade-out');
                        flashingBlueImageElement.classList.add('hidden'); // Fully hide after animation

                        // Start flashing battery and engine
                        if (baterryIconContainer) {
                            baterryIconContainer.classList.remove('hidden');
                            baterryIconContainer.classList.add('flashing');
                        }
                        if (engineIconContainer) {
                            engineIconContainer.classList.remove('hidden');
                            engineIconContainer.classList.add('flashing');
                        }

                        // Stop flashing and hide battery and engine after 2 seconds
                        setTimeout(() => {
                            if (baterryIconContainer) {
                                baterryIconContainer.classList.remove('flashing');
                                baterryIconContainer.classList.add('hidden');
                            }
                            if (engineIconContainer) {
                                engineIconContainer.classList.remove('flashing');
                                engineIconContainer.classList.add('hidden');
                            }
                        }, 2000); // Flash for 2 seconds
                    }, { once: true }); // Ensure animationend listener runs once
                }, 2000); // Stay visible for 2 seconds
            }

        }, { once: true });
    }, 3000);

    // --- Update UI Functions ---
    function updateBatteryDisplay() {
        batteryPercentageHeaderElement.textContent = `${batteryLevel.toFixed(0)}%`;

        // Update battery icon
        if (batteryIconElement) {
            batteryIconElement.classList.remove('fa-battery-full', 'fa-battery-half', 'fa-battery-quarter', 'fa-battery-empty');
            if (batteryLevel > 75) {
                batteryIconElement.classList.add('fa-battery-full');
            } else if (batteryLevel > 50) {
                batteryIconElement.classList.add('fa-battery-half');
            } else if (batteryLevel > 20) {
                batteryIconElement.classList.add('fa-battery-quarter');
            } else {
                batteryIconElement.classList.add('fa-battery-empty');
            }
        }

        // Update battery background color
        if (batteryDisplayElement) {
            batteryDisplayElement.classList.remove('level-green', 'level-orange', 'level-red');
            if (batteryLevel > 50) {
                batteryDisplayElement.classList.add('level-green');
            } else if (batteryLevel > 20) {
                batteryDisplayElement.classList.add('level-orange');
            } else {
                batteryDisplayElement.classList.add('level-red');
            }
        }

        // New: Mileage flashing logic when battery is 0%
        if (mileageValueHeaderElement) {
            if (batteryLevel <= 0) {
                mileageValueHeaderElement.classList.add('flash-red-white');
            } else {
                mileageValueHeaderElement.classList.remove('flash-red-white');
            }
        }
    }

    function updatePowerModeDisplay() {
        powerModeElement.textContent = powerMode;
    }

    function updateRidingTimeDisplay() {
        const hours = Math.floor(ridingTimeSeconds / 3600);
        const minutes = Math.floor((ridingTimeSeconds % 3600) / 60);
        ridingTimeValueBottomElement.textContent = `${hours}h ${minutes.toString().padStart(2, '0')}m`;
    }

    function updateMileageDisplay() {
        mileageValueHeaderElement.textContent = Math.floor(currentSpeedKmH); // Display current speed as integer
        updateSpeedArcDisplay(); // Update speed arc whenever mileage changes
    }

    function updateSpeedArcDisplay() {
        if (speedArcFillElement) {
            const maxSpeedForArc = MAX_SPEED_FOR_ARC;

            // Calculate fill based on speed up to MAX_SPEED_FOR_ARC (50 km/h)
            const fillPercentage = Math.min(currentSpeedKmH / maxSpeedForArc, 1);
            const filledLength = SPEED_ARC_CIRCUMFERENCE * fillPercentage;

            if (currentSpeedKmH === 0) {
                // Stationary: Small dot at the far left
                const leftDotLength = 60; // Increased length for visibility
                speedArcFillElement.setAttribute('stroke-dasharray', `${leftDotLength} ${SPEED_ARC_CIRCUMFERENCE - leftDotLength}`);
                speedArcFillElement.setAttribute('stroke-dashoffset', '0'); // Start at the beginning of the path
            } else {
                // Accelerating: Fill from left to right
                speedArcFillElement.setAttribute('stroke-dasharray', `${filledLength} ${SPEED_ARC_CIRCUMFERENCE - filledLength}`);
                speedArcFillElement.setAttribute('stroke-dashoffset', '0'); // Start at the beginning of the path
            }
        }
    }

    // --- Initial setup for Battery Indicator --- (Now empty as per requirements)
    function setupBatteryIndicator() {
        // No setup needed as there are no marks or arcs to generate dynamically
        // All info is in header-info blocks
    }

    // Call setup for battery indicator after main screen is visible
    mainScreen.addEventListener('transitionend', () => {
        if (mainScreen.classList.contains('visible')) {
            setupBatteryIndicator(); // This will effectively do nothing now, but keeps the flow
            updateBatteryDisplay();
            updatePowerModeDisplay();
            updateRidingTimeDisplay(); // Re-enabled call
            updateMileageDisplay();
        }
    }, { once: true });


    // --- Battery Logic (Click to reset) ---
    const batteryDisplayArea = document.getElementById('battery-percentage-header').parentNode;
    batteryDisplayArea.addEventListener('click', () => {
        if (confirm('Dorești să resetezi nivelul bateriei?')) {
            batteryLevel = 100;
            ridingTimeSeconds = 0; // Reset riding time as well
            localStorage.setItem('batteryLevel', batteryLevel);
            localStorage.setItem('ridingTimeSeconds', ridingTimeSeconds);
            updateBatteryDisplay();
            updateRidingTimeDisplay(); // Update riding time display after reset
        }
    });

    // --- Power Mode Logic ---
    powerModeElement.parentNode.addEventListener('click', () => {
        powerMode = (powerMode % 5) + 1; // Cycles from 1 to 5
        localStorage.setItem('powerMode', powerMode);
        updatePowerModeDisplay();

        // Add and remove active-flash class for visual feedback
        const powerModeContainer = powerModeElement.closest('.power-mode');
        if (powerModeContainer) {
            powerModeContainer.classList.add('active-flash');
            setTimeout(() => {
                powerModeContainer.classList.remove('active-flash');
            }, 1000); // Remove after 1 second
        }
    });

    // --- GPS / Mileage / Battery Consumption Logic --- (Simplified)
    setInterval(() => {
        ridingTimeSeconds++;
        localStorage.setItem('ridingTimeSeconds', ridingTimeSeconds);
        updateRidingTimeDisplay(); // Re-enabled call

        // Calculate battery drain based on distance covered and max range (still using currentSpeedKmH)
        const batteryDrainPerKm = 100 / MAX_DISTANCE_FOR_100_PERCENT; // Define batteryDrainPerKm here
        const timeElapsedHours = 1 / 3600; // 1 second
        const distanceCovered = (currentSpeedKmH / 3600); // Convert km/h to km/s then multiply by 1 second

        batteryLevel -= (distanceCovered * batteryDrainPerKm);
        if (batteryLevel < 0) batteryLevel = 0;
        localStorage.setItem('batteryLevel', batteryLevel);
        updateBatteryDisplay();

    }, 1000); // Update every second

    // Initial display updates
    updateBatteryDisplay();
    updatePowerModeDisplay();
    updateRidingTimeDisplay(); // Re-enabled call
    updateMileageDisplay();

    // --- Theme Toggle Logic ---
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'light-mode') {
        document.body.classList.add('light-mode');
    }

    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', () => {
            document.body.classList.toggle('light-mode');
            const newTheme = document.body.classList.contains('light-mode') ? 'light-mode' : 'dark-mode';
            localStorage.setItem('theme', newTheme);
        });
    }

    // --- GPS Access --- (Simplified)
    if (navigator.geolocation) {
        updateDebugInfo('GPS: Trying to get position...');
        navigator.geolocation.watchPosition(
            (position) => {
                const speed = position.coords.speed; // Speed in meters per second
                const accuracy = position.coords.accuracy;
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;

                if (speed !== null && speed >= 0) {
                    currentSpeedKmH = speed * 3.6; // Convert m/s to km/h
                    localStorage.setItem('currentSpeedKmH', currentSpeedKmH);
                    updateMileageDisplay(); // Update mileage display from GPS
                    updateDebugInfo(`GPS: Speed ${currentSpeedKmH.toFixed(2)} km/h | Acc: ${accuracy.toFixed(0)}m | Lat: ${latitude.toFixed(4)} | Lon: ${longitude.toFixed(4)}`);
                } else {
                    currentSpeedKmH = 0; // If speed is null or negative, assume 0
                    localStorage.setItem('currentSpeedKmH', currentSpeedKmH);
                    updateMileageDisplay();
                    updateDebugInfo(`GPS: No speed detected (stationary or invalid data) | Acc: ${accuracy.toFixed(0)}m | Lat: ${latitude.toFixed(4)} | Lon: ${longitude.toFixed(4)}`);
                }
            },
            (error) => {
                console.error('Error accessing GPS:', error);
                currentSpeedKmH = 0; // Reset speed on error
                localStorage.setItem('currentSpeedKmH', currentSpeedKmH);
                updateMileageDisplay();
                let errorMessage;
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "GPS Error: Permission Denied. Please enable location services.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "GPS Error: Position Unavailable. Try again later.";
                        break;
                    case error.TIMEOUT:
                        errorMessage = "GPS Error: Request timed out. Check your signal.";
                        break;
                    default:
                        errorMessage = `GPS Error: Unknown error (${error.code}).`;
                }
                updateDebugInfo(errorMessage);
            },
            { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
        );
    } else {
        updateDebugInfo('GPS: Geolocation not supported by this browser. Simulating speed.');
        console.error('Geolocation is not supported by this browser.');
        // Fallback to simulated speed if GPS is not supported
        setInterval(() => {
            currentSpeedKmH = 20; // Simulated speed if no GPS
            localStorage.setItem('currentSpeedKmH', currentSpeedKmH);
            updateMileageDisplay(); // Update mileage display from simulation
            updateDebugInfo(`GPS: Simulated speed ${currentSpeedKmH.toFixed(2)} km/h`);
        }, 1000);
    }
});
