"""
EventFoundry Venue Crawler - Configuration
Centralized configuration for all crawling operations
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Base Directories
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
VENUES_DIR = DATA_DIR / "venues"
CACHE_DIR = DATA_DIR / "cache"
LOGS_DIR = BASE_DIR / "logs"

# Create directories if they don't exist
for directory in [DATA_DIR, VENUES_DIR, CACHE_DIR, LOGS_DIR]:
    directory.mkdir(exist_ok=True, parents=True)

# API Keys
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")

# Crawling Configuration
REQUESTS_PER_SECOND = int(os.getenv("REQUESTS_PER_SECOND", "2"))
CONCURRENT_REQUESTS = int(os.getenv("CONCURRENT_REQUESTS", "5"))
REQUEST_TIMEOUT = 30
MAX_RETRIES = 3

# User Agent
USER_AGENT = os.getenv(
    "USER_AGENT",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)

# Target Sources (Tier 1)
VENUE_SOURCES = {
    "venuemonk": {
        "base_url": "https://www.venuemonk.com/",
        "kochi_url": "https://www.venuemonk.com/kochi/wedding-venues",
        "priority": 1,
        "expected_venues": 80
    },
    "weddingvenues": {
        "base_url": "https://www.weddingvenues.in/",
        "kochi_url": "https://www.weddingvenues.in/kochi-wedding-venues",
        "priority": 1,
        "expected_venues": 50
    },
    "venuelook": {
        "base_url": "https://www.venuelook.com/",
        "kochi_url": "https://www.venuelook.com/kochi",
        "priority": 1,
        "expected_venues": 40
    }
}

# Kochi-specific Configuration
KOCHI_CONFIG = {
    "city": "Kochi",
    "state": "Kerala",
    "districts": ["Ernakulam"],
    "major_areas": [
        "Willingdon Island",
        "Marine Drive",
        "Edappally",
        "Kakkanad",
        "Kaloor",
        "Palarivattom",
        "Vyttila",
        "Aluva",
        "Thripunithura",
        "Fort Kochi"
    ]
}

# Venue Data Schema Version
SCHEMA_VERSION = "2025-01-02"

# Search Keywords Configuration
FUZZY_MATCH_THRESHOLD = 80  # Minimum similarity score (0-100)

# Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FILE = LOGS_DIR / "crawler.log"
