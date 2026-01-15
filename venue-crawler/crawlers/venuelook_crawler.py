"""
Venuelook.com Crawler - Tier 1 Priority
Extracts venue data from Venuelook for Kochi
"""

import re
from typing import List, Dict, Optional
from loguru import logger
from bs4 import BeautifulSoup
from datetime import datetime

from base_crawler import BaseCrawler


class VenuelookCrawler(BaseCrawler):
    """Venuelook.com data extractor"""

    def __init__(self):
        super().__init__(
            source_name="venuelook",
            base_url="https://www.venuelook.com"
        )
        self.kochi_url = "https://www.venuelook.com/kochi"

    def get_venue_list(self, city: str = "Kochi") -> List[Dict]:
        """Extract venue list from Venuelook"""
        logger.info(f"Fetching venue list from Venuelook for {city}")

        cached_list = self._load_from_cache(f"{city.lower()}_venue_list")
        if cached_list:
            return cached_list

        venues = []
        response = self._rate_limited_request(self.kochi_url)

        if not response:
            return venues

        soup = self._parse_html(response.text)
        venue_cards = soup.find_all(['div', 'li'], class_=re.compile(r'venue|property|listing', re.I))

        for card in venue_cards:
            try:
                name_elem = card.find(['a', 'h2', 'h3'], class_=re.compile(r'title|name', re.I))
                if not name_elem:
                    continue

                venue_name = name_elem.get_text(strip=True)
                venue_url = name_elem.get('href') if name_elem.name == 'a' else card.find('a')['href']

                if not venue_url.startswith('http'):
                    venue_url = self.base_url + venue_url

                venues.append({
                    'name': venue_name,
                    'url': venue_url,
                    'preview': {}
                })

                logger.debug(f"Found: {venue_name}")

            except Exception as e:
                logger.error(f"Error: {str(e)}")
                continue

        self._save_to_cache(f"{city.lower()}_venue_list", venues)
        logger.success(f"✓ Extracted {len(venues)} venues from Venuelook")
        return venues

    def extract_venue_details(self, venue_url: str) -> Optional[Dict]:
        """Extract venue details"""
        logger.info(f"Extracting from: {venue_url}")

        venue_id_slug = venue_url.split('/')[-1]
        cached_data = self._load_from_cache(f"venue_{venue_id_slug}")
        if cached_data:
            return cached_data

        response = self._rate_limited_request(venue_url)
        if not response:
            return None

        soup = self._parse_html(response.text)

        try:
            venue_name = soup.find('h1').get_text(strip=True) if soup.find('h1') else "Unknown Venue"

            venue_data = {
                "venue_id": f"kochi_venuelook_{venue_id_slug}",
                "basic_info": {
                    "official_name": venue_name,
                    "brand_name": None,
                    "aliases": [venue_name],
                    "venue_type": "event_venue",
                    "star_rating": None,
                    "established_year": None,
                    "google_rating": None,
                    "total_reviews": 0
                },
                "location": {
                    "address": "Kochi, Kerala",
                    "landmark": None,
                    "district": "Ernakulam",
                    "city": "Kochi",
                    "state": "Kerala",
                    "pin_code": None,
                    "coordinates": None,
                    "accessibility": None
                },
                "contact": {
                    "phone_primary": "Contact via website",
                    "phone_secondary": None,
                    "email": None,
                    "website": None,
                    "whatsapp": None,
                    "booking_manager": None
                },
                "capacity": {
                    "event_spaces": [{
                        "space_name": "Main Hall",
                        "min_guests": 100,
                        "max_guests": 400,
                        "space_type": "indoor",
                        "has_stage": False,
                        "has_dance_floor": False,
                        "natural_lighting": False
                    }],
                    "total_rooms": None,
                    "parking_capacity": None
                },
                "catering": {
                    "in_house_catering": True,
                    "in_house_menu_types": ["south_indian", "north_indian"],
                    "outside_catering_allowed": False,
                    "bar_service_available": False
                },
                "facilities": {
                    "ac_available": True,
                    "backup_power": False,
                    "wifi_available": False,
                    "projector_screen": False,
                    "sound_system": False,
                    "lighting_setup": False,
                    "green_rooms": 0,
                    "wheelchair_accessible": False,
                    "parking_type": None,
                    "accommodation_available": False,
                    "accommodation_rooms": 0
                },
                "timeline_logistics": {
                    "booking_window_days": 90,
                    "min_advance_booking_days": 30,
                    "decoration_restrictions": [],
                    "noise_curfew": None
                },
                "pricing": {
                    "base_venue_charge": None,
                    "per_plate_cost_min": None,
                    "per_plate_cost_max": None,
                    "packages": [],
                    "security_deposit": None,
                    "taxes_included": False,
                    "payment_terms": None
                },
                "event_types_hosted": {
                    "weddings": True,
                    "corporate_events": True,
                    "conferences": False,
                    "exhibitions": False,
                    "birthday_parties": True,
                    "anniversaries": True,
                    "engagement_ceremonies": True,
                    "religious_ceremonies": False,
                    "photo_shoots": False
                },
                "reviews_reputation": {
                    "overall_rating": 0.0,
                    "total_reviews_aggregated": 0,
                    "review_snapshots": [],
                    "awards_certifications": [],
                    "featured_events": []
                },
                "checklist_automation": {
                    "auto_populate_items": ["venue_confirmed"],
                    "conditional_removals": ["venue_search_required"],
                    "conditional_additions": []
                },
                "search_keywords": {
                    "primary_keywords": [venue_name],
                    "secondary_keywords": ["event venue", "kochi"],
                    "location_keywords": ["kochi", "kerala"]
                },
                "data_source": f"venuelook_{venue_url}",
                "last_updated": datetime.now(),
                "data_quality_score": 0.0,
                "manual_verification_required": True
            }

            self._save_to_cache(f"venue_{venue_id_slug}", venue_data)
            return venue_data

        except Exception as e:
            logger.error(f"Extraction failed: {str(e)}")
            return None


if __name__ == "__main__":
    import sys
    from loguru import logger

    logger.remove()
    logger.add(sys.stderr, level="INFO")

    crawler = VenuelookCrawler()
    venues = crawler.crawl_all(max_venues=3)
    print(f"\n✅ Extracted {len(venues)} venues")
