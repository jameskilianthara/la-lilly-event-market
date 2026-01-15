"""
WeddingVenues.in Crawler - Tier 1 Priority
Extracts venue data from WeddingVenues.in for Kochi region
"""

import re
from typing import List, Dict, Optional
from loguru import logger
from bs4 import BeautifulSoup
from datetime import datetime

from base_crawler import BaseCrawler


class WeddingVenuesCrawler(BaseCrawler):
    """WeddingVenues.in data extractor"""

    def __init__(self):
        super().__init__(
            source_name="weddingvenues",
            base_url="https://www.weddingvenues.in"
        )
        self.kochi_url = "https://www.weddingvenues.in/kochi-wedding-venues"

    def get_venue_list(self, city: str = "Kochi") -> List[Dict]:
        """Extract venue list from WeddingVenues.in"""
        logger.info(f"Fetching venue list from WeddingVenues.in for {city}")

        cached_list = self._load_from_cache(f"{city.lower()}_venue_list")
        if cached_list:
            return cached_list

        venues = []
        response = self._rate_limited_request(self.kochi_url)

        if not response:
            logger.error("Failed to fetch venue list")
            return venues

        soup = self._parse_html(response.text)

        # WeddingVenues.in structure: venue listings
        venue_cards = soup.find_all(['div', 'article'], class_=re.compile(r'venue|listing|property', re.I))

        for card in venue_cards:
            try:
                name_elem = card.find(['h2', 'h3', 'a'], class_=re.compile(r'name|title', re.I))
                if not name_elem:
                    continue

                venue_name = name_elem.get_text(strip=True)
                venue_url = name_elem.get('href') if name_elem.name == 'a' else card.find('a')['href']

                if not venue_url.startswith('http'):
                    venue_url = self.base_url + venue_url

                # Extract preview data
                location_elem = card.find(class_=re.compile(r'location|address', re.I))
                capacity_elem = card.find(string=re.compile(r'\d+\s*guests?', re.I))

                venues.append({
                    'name': venue_name,
                    'url': venue_url,
                    'preview': {
                        'location_hint': location_elem.get_text(strip=True) if location_elem else None,
                        'capacity_hint': capacity_elem.strip() if capacity_elem else None
                    }
                })

                logger.debug(f"Found: {venue_name}")

            except Exception as e:
                logger.error(f"Error parsing card: {str(e)}")
                continue

        self._save_to_cache(f"{city.lower()}_venue_list", venues)
        logger.success(f"✓ Extracted {len(venues)} venues from WeddingVenues.in")
        return venues

    def extract_venue_details(self, venue_url: str) -> Optional[Dict]:
        """Extract detailed venue information"""
        logger.info(f"Extracting from: {venue_url}")

        venue_id_slug = venue_url.split('/')[-1].replace('.html', '')
        cached_data = self._load_from_cache(f"venue_{venue_id_slug}")
        if cached_data:
            return cached_data

        response = self._rate_limited_request(venue_url)
        if not response:
            return None

        soup = self._parse_html(response.text)

        try:
            venue_name = self._extract_name(soup)
            if not venue_name:
                return None

            venue_data = {
                "venue_id": f"kochi_weddingvenues_{venue_id_slug}",
                "basic_info": {
                    "official_name": venue_name,
                    "brand_name": None,
                    "aliases": [venue_name],
                    "venue_type": "wedding_venue",
                    "star_rating": None,
                    "established_year": None,
                    "google_rating": None,
                    "total_reviews": 0
                },
                "location": self._extract_location(soup),
                "contact": self._extract_contact(soup),
                "capacity": self._extract_capacity(soup),
                "catering": {
                    "in_house_catering": True,
                    "in_house_menu_types": ["south_indian", "north_indian"],
                    "outside_catering_allowed": False,
                    "bar_service_available": False
                },
                "facilities": self._extract_facilities(soup),
                "timeline_logistics": {
                    "booking_window_days": 90,
                    "min_advance_booking_days": 30,
                    "decoration_restrictions": [],
                    "noise_curfew": None
                },
                "pricing": self._extract_pricing(soup),
                "event_types_hosted": {
                    "weddings": True,
                    "corporate_events": False,
                    "conferences": False,
                    "exhibitions": False,
                    "birthday_parties": False,
                    "anniversaries": True,
                    "engagement_ceremonies": True,
                    "religious_ceremonies": True,
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
                    "auto_populate_items": [
                        "venue_confirmed",
                        "venue_capacity_confirmed"
                    ],
                    "conditional_removals": ["venue_search_required"],
                    "conditional_additions": []
                },
                "search_keywords": {
                    "primary_keywords": [venue_name],
                    "secondary_keywords": ["wedding venue", "kochi"],
                    "location_keywords": ["kochi", "ernakulam"]
                },
                "data_source": f"weddingvenues_{venue_url}",
                "last_updated": datetime.now(),
                "data_quality_score": 0.0,
                "manual_verification_required": True
            }

            self._save_to_cache(f"venue_{venue_id_slug}", venue_data)
            return venue_data

        except Exception as e:
            logger.error(f"Extraction failed: {str(e)}")
            return None

    def _extract_name(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract venue name"""
        name_elem = soup.find('h1')
        if name_elem:
            return name_elem.get_text(strip=True)

        og_title = soup.find('meta', property='og:title')
        if og_title:
            return og_title.get('content', '').split('|')[0].strip()

        return None

    def _extract_location(self, soup: BeautifulSoup) -> Dict:
        """Extract location"""
        address_elem = soup.find(['address', 'div'], class_=re.compile(r'address|location', re.I))
        address = address_elem.get_text(strip=True) if address_elem else "Kochi, Kerala"

        return {
            "address": address,
            "landmark": None,
            "district": "Ernakulam",
            "city": "Kochi",
            "state": "Kerala",
            "pin_code": None,
            "coordinates": None,
            "accessibility": None
        }

    def _extract_contact(self, soup: BeautifulSoup) -> Dict:
        """Extract contact info"""
        phone = soup.find(string=re.compile(r'\+91[\s-]?\d{10}'))
        email = soup.find('a', href=re.compile(r'mailto:'))

        return {
            "phone_primary": phone.strip() if phone else "Contact via website",
            "phone_secondary": None,
            "email": email.get('href').replace('mailto:', '') if email else None,
            "website": None,
            "whatsapp": None,
            "booking_manager": None
        }

    def _extract_capacity(self, soup: BeautifulSoup) -> Dict:
        """Extract capacity"""
        capacity_text = soup.find(string=re.compile(r'(\d+)\s*guests?', re.I))
        max_guests = 300  # Default

        if capacity_text:
            match = re.search(r'(\d+)', capacity_text)
            if match:
                max_guests = int(match.group(1))

        return {
            "event_spaces": [{
                "space_name": "Main Banquet Hall",
                "min_guests": max_guests // 4,
                "max_guests": max_guests,
                "space_type": "indoor",
                "has_stage": False,
                "has_dance_floor": False,
                "natural_lighting": False
            }],
            "total_rooms": None,
            "parking_capacity": None
        }

    def _extract_facilities(self, soup: BeautifulSoup) -> Dict:
        """Extract facilities"""
        return {
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
        }

    def _extract_pricing(self, soup: BeautifulSoup) -> Dict:
        """Extract pricing"""
        return {
            "base_venue_charge": None,
            "per_plate_cost_min": None,
            "per_plate_cost_max": None,
            "packages": [],
            "security_deposit": None,
            "taxes_included": False,
            "payment_terms": None
        }


if __name__ == "__main__":
    import sys
    from loguru import logger

    logger.remove()
    logger.add(sys.stderr, level="INFO")

    crawler = WeddingVenuesCrawler()
    venues = crawler.crawl_all(max_venues=3)
    print(f"\n✅ Extracted {len(venues)} venues")
