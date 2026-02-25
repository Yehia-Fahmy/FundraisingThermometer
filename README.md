# Fundraising Night Display

A simple, no-build web app for a fundraising dinner: a **display view** to project at the front of the room and an **admin panel** to enter donations. Both sync in real time via the browser (open admin and display in two tabs on the same computer).

## How to run

1. Serve the folder over HTTP (required for localStorage to sync across tabs):
   ```bash
   cd FundraisingThermometer
   python3 -m http.server 8765
   ```
2. Open **http://localhost:8765/admin.html** in your browser.
3. Click **Open Display** to open the display view in a new tab (or open **http://localhost:8765/index.html** manually).
4. Put the display tab on the projector and use the admin tab to add donations as they come in.

## Usage

- **Admin:** Set event title and goal once, then add donations (amount only). Use preset buttons or type a number and press Enter. Remove mistaken entries with **Remove**. Export a CSV of all donations when done.
- **Display:** Shows total raised, goal progress, a progress bar, and recent donations. Flashes and animates when new donations arrive; confetti runs at 25%, 50%, 75%, and 100% of the goal.

No server backend or install step—just HTML, CSS, and JavaScript.
