// Server image mapping
const SERVER_IMAGES = {
    // US West Region
    "USWest": "uswest.jpg",
    "USWest2": "uswest.jpg",
    "USWest3": "uswest.jpg",
    "USWest4": "uswest.jpg",

    // US South Region
    "USSouth": "ussouth.jpeg",
    "USSouth2": "ussouth.jpeg",
    "USSouth3": "ussouth.jpeg",
    "USSouthWest": "ussouth.jpeg",

    // US Northwest Region
    "USNorthWest": "usnw.jpeg",

    // US Midwest Region
    "USMidWest": "usmw.jpeg",
    "USMidWest2": "usmw.jpeg",

    // US East Region
    "USEast": "useast.jpeg",
    "USEast2": "useast.jpeg",

    // EU West Region
    "EUWest": "euwest.jpeg",
    "EUWest2": "euwest.jpeg",

    // EU East Region
    "EUEast": "eueast.jpeg",

    // EU North Region
    "EUNorth": "eunorth.jpeg",

    // EU Southwest Region
    "EUSouthWest": "eusw.jpeg",

    // Asia Region
    "Asia": "asia.jpeg",

    // Australia Region
    "Australia": "australia.jpeg"
};

// Known Ethereal Shrine event ID
const SHRINE_EVENT_ID = "20800";

document.addEventListener('DOMContentLoaded', function() {
    const shrineContainer = document.getElementById('shrineContainer');
    const template = document.getElementById('shrineTemplate');
    
    let shrineTimers = [];

    function formatTimeAgo(seconds) {
        if (seconds < 0) return 'just now';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        if (minutes > 0) {
            return `${minutes}m ${remainingSeconds}s ago`;
        }
        return `${remainingSeconds}s ago`;
    }

    function updateTimers() {
        shrineTimers.forEach(timer => {
            const timeElement = timer.element;
            timer.seconds++;
            timeElement.textContent = formatTimeAgo(timer.seconds);
        });
    }

    async function fetchShrineData() {
        try {
            console.log('Fetching shrine data...');
            const response = await fetch('https://realmstock.network/Notifier/EventHistory');
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.status}`);
            }

            const data = await response.json();
            console.log('Received data:', data);
            
            if (!data.success) {
                throw new Error('API returned unsuccessful response');
            }

            const eventsStr = data.value || '';
            console.log('Events string:', eventsStr.substring(0, 200) + '...');
            
            const shrineEvents = [];
            const utcNow = new Date();

            // Process each line in the response
            for (const line of eventsStr.trim().split('\n')) {
                if (!line) continue;

                // Parse pipe-separated values
                const parts = line.split('|');
                if (parts.length < 7) {
                    console.log('Skipping invalid line:', line);
                    continue;
                }

                const eventId = parts[0];
                if (eventId !== SHRINE_EVENT_ID) continue;

                // Extract event data
                const realm = parts[1];
                const server = parts[2];
                const players = parts[3];
                const timestamp = parts[6];

                // Convert timestamp to datetime
                try {
                    const [hour, minute] = timestamp.split(':').map(Number);
                    const today = new Date();
                    
                    // Create event time in UTC
                    const eventTime = new Date(Date.UTC(
                        today.getUTCFullYear(),
                        today.getUTCMonth(),
                        today.getUTCDate(),
                        hour,
                        minute
                    ));
                    
                    // If the event time is in the future (due to UTC conversion), subtract a day
                    if (eventTime > utcNow) {
                        eventTime.setUTCDate(eventTime.getUTCDate() - 1);
                    }
                    
                    const timeDiff = Math.floor((utcNow - eventTime) / 1000);

                    shrineEvents.push({
                        server,
                        realm,
                        players: `${players}/85`,
                        time_ago: timeDiff,
                        image: SERVER_IMAGES[server] || "default_server.jpg"
                    });
                } catch (error) {
                    console.error(`Invalid timestamp format: ${timestamp}`);
                    continue;
                }
            }

            console.log('Found shrine events:', shrineEvents);
            
            // Sort events by time_ago (most recent first)
            shrineEvents.sort((a, b) => a.time_ago - b.time_ago);
            return shrineEvents;

        } catch (error) {
            console.error('Error fetching shrine data:', error);
            return null;
        }
    }

    function updateShrines() {
        console.log('Updating shrines...');
        fetchShrineData()
            .then(shrines => {
                shrineContainer.innerHTML = ''; // Clear existing entries
                
                if (!shrines || shrines.length === 0) {
                    console.log('No shrine events found');
                    const message = document.createElement('div');
                    message.className = 'loading';
                    message.textContent = 'No active shrine events found';
                    shrineContainer.appendChild(message);
                    return;
                }

                // Clear existing timers
                shrineTimers = [];
                
                shrines.forEach(shrine => {
                    const clone = template.content.cloneNode(true);
                    
                    // Update image
                    const img = clone.querySelector('img');
                    img.src = `images/${shrine.image}`;
                    img.alt = shrine.server;
                    
                    // Update server and realm
                    clone.querySelector('.server').textContent = shrine.server;
                    clone.querySelector('.realm').textContent = shrine.realm;
                    
                    // Update players and time
                    clone.querySelector('.players').textContent = shrine.players;
                    const timeElement = clone.querySelector('.time');
                    timeElement.textContent = formatTimeAgo(shrine.time_ago);
                    
                    // Add to timers
                    shrineTimers.push({
                        element: timeElement,
                        seconds: shrine.time_ago
                    });
                    
                    shrineContainer.appendChild(clone);
                });
            })
            .catch(error => {
                console.error('Error updating shrines:', error);
                shrineContainer.innerHTML = `
                    <div class="error">
                        Failed to load shrine data. Please try again later.
                        <br>
                        Error: ${error.message}
                    </div>
                `;
            });
    }

    // Initial update
    updateShrines();
    
    // Update shrine data every 30 seconds
    setInterval(updateShrines, 30000);
    
    // Update timers every second
    setInterval(updateTimers, 1000);
}); 