/**
 * Premium Standalone Configuration
 * 
 * Fill this out and place it in the same directory as the Arcade index.html 
 * to create a standalone deployment that doesn't need to fetch from a database.
 */

window.STANDALONE_CONFIG = {
  "id": "premium-gift", // ID for internal reference
  "recipient_name": "Luna",
  "message": "You are the center of my universe. ✦",
  "date": "2026-03-21",
  "password": null, // Optional password to lock the gift
  "audio": {
    "url": "https://example.com/your-music.mp3",
    "name": "Floating in Space",
    "artist": "The Astronauts"
  },
  "photos": [
    {
      "url": "https://example.com/photo1.jpg",
      "caption": "Where it all started."
    },
    {
      "url": "https://example.com/photo2.jpg",
      "caption": "Our favorite escape."
    }
  ],
  "active_apps": {
    "journey": true,
    "moments": true,
    "quiz": false,
    "bucket_list": true,
    "message": true
  }
};
