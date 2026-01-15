"""
Base Crawler - Abstract class for all venue source crawlers
Provides common functionality: rate limiting, error handling, data validation
"""

import time
import json
from abc import ABC, abstractmethod
from typing import List, Dict, Optional
from pathlib import Path
from loguru import logger
import requests
from bs4 import BeautifulSoup
from ratelimit import limits, sleep_and_retry

import sys
sys.path.append(str(Path(__file__).parent.parent))

from config import (
    REQUESTS_PER_SECOND,
    REQUEST_TIMEOUT,
    MAX_RETRIES,
    USER_AGENT,
    VENUES_DIR,
    CACHE_DIR
)
from models.venue_schema import Venue


class BaseCrawler(ABC):
    """Abstract base crawler for venue data extraction"""

    def __init__(self, source_name: str, base_url: str):
        self.source_name = source_name
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': USER_AGENT,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
        })

        # Cache directory for this source
        self.cache_dir = CACHE_DIR / source_name
        self.cache_dir.mkdir(exist_ok=True, parents=True)

        logger.info(f"Initialized {source_name} crawler")

    @sleep_and_retry
    @limits(calls=REQUESTS_PER_SECOND, period=1)
    def _rate_limited_request(self, url: str, method: str = 'GET', **kwargs) -> Optional[requests.Response]:
        """Make rate-limited HTTP request with retries"""
        for attempt in range(MAX_RETRIES):
            try:
                logger.debug(f"Request attempt {attempt + 1}/{MAX_RETRIES}: {url}")

                if method.upper() == 'GET':
                    response = self.session.get(url, timeout=REQUEST_TIMEOUT, **kwargs)
                elif method.upper() == 'POST':
                    response = self.session.post(url, timeout=REQUEST_TIMEOUT, **kwargs)
                else:
                    raise ValueError(f"Unsupported HTTP method: {method}")

                response.raise_for_status()
                logger.info(f"✓ Successfully fetched: {url}")
                return response

            except requests.exceptions.HTTPError as e:
                if e.response.status_code == 429:  # Rate limited
                    wait_time = (attempt + 1) * 5
                    logger.warning(f"Rate limited. Waiting {wait_time}s before retry...")
                    time.sleep(wait_time)
                else:
                    logger.error(f"HTTP error {e.response.status_code}: {url}")
                    if attempt == MAX_RETRIES - 1:
                        return None

            except requests.exceptions.Timeout:
                logger.warning(f"Timeout on attempt {attempt + 1}: {url}")
                if attempt == MAX_RETRIES - 1:
                    return None

            except Exception as e:
                logger.error(f"Request failed: {str(e)}")
                if attempt == MAX_RETRIES - 1:
                    return None

        return None

    def _save_to_cache(self, filename: str, data: Dict):
        """Save data to cache directory"""
        cache_file = self.cache_dir / f"{filename}.json"
        with open(cache_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        logger.debug(f"Cached data to: {cache_file}")

    def _load_from_cache(self, filename: str) -> Optional[Dict]:
        """Load data from cache if exists"""
        cache_file = self.cache_dir / f"{filename}.json"
        if cache_file.exists():
            with open(cache_file, 'r', encoding='utf-8') as f:
                logger.debug(f"Loaded from cache: {cache_file}")
                return json.load(f)
        return None

    def _parse_html(self, html_content: str) -> BeautifulSoup:
        """Parse HTML content with BeautifulSoup"""
        return BeautifulSoup(html_content, 'lxml')

    @abstractmethod
    def get_venue_list(self, city: str = "Kochi") -> List[Dict]:
        """
        Extract list of venues for a city
        Returns: List of dictionaries with basic venue info and detail URLs
        """
        pass

    @abstractmethod
    def extract_venue_details(self, venue_url: str) -> Optional[Dict]:
        """
        Extract detailed information for a single venue
        Returns: Dictionary with complete venue data matching our schema
        """
        pass

    def validate_venue_data(self, venue_data: Dict) -> tuple[bool, Optional[Venue]]:
        """
        Validate extracted venue data against Pydantic schema
        Returns: (is_valid, venue_object or None)
        """
        try:
            venue = Venue(**venue_data)
            logger.success(f"✓ Validated venue: {venue.basic_info.official_name}")
            return True, venue
        except Exception as e:
            logger.error(f"✗ Validation failed: {str(e)}")
            logger.debug(f"Invalid data: {json.dumps(venue_data, indent=2)}")
            return False, None

    def save_venue(self, venue: Venue):
        """Save validated venue to JSON file"""
        output_file = VENUES_DIR / f"{venue.venue_id}.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(venue.model_dump(), f, indent=2, ensure_ascii=False, default=str)
        logger.success(f"✓ Saved venue: {output_file}")

    def crawl_all(self, city: str = "Kochi", max_venues: Optional[int] = None) -> List[Venue]:
        """
        Main crawling workflow:
        1. Get venue list
        2. Extract details for each venue
        3. Validate and save
        """
        logger.info(f"Starting crawl for {city} on {self.source_name}")

        # Step 1: Get venue list
        venue_list = self.get_venue_list(city)
        logger.info(f"Found {len(venue_list)} venues")

        if max_venues:
            venue_list = venue_list[:max_venues]
            logger.info(f"Limited to {max_venues} venues for this run")

        # Step 2 & 3: Extract, validate, save
        validated_venues = []
        for idx, venue_info in enumerate(venue_list, 1):
            logger.info(f"Processing venue {idx}/{len(venue_list)}: {venue_info.get('name', 'Unknown')}")

            # Extract details
            venue_data = self.extract_venue_details(venue_info['url'])
            if not venue_data:
                logger.warning(f"Failed to extract data for: {venue_info.get('name')}")
                continue

            # Validate
            is_valid, venue = self.validate_venue_data(venue_data)
            if is_valid and venue:
                self.save_venue(venue)
                validated_venues.append(venue)
            else:
                logger.warning(f"Validation failed for: {venue_info.get('name')}")

        logger.success(f"✓ Completed! Successfully crawled {len(validated_venues)}/{len(venue_list)} venues")
        return validated_venues
