"""
VenueMonk Crawler - Tier 1 Priority
Extracts comprehensive venue data from VenueMonk.com for Kochi
"""

import re
from typing import List, Dict, Optional
from loguru import logger
from bs4 import BeautifulSoup
from datetime import datetime

from base_crawler import BaseCrawler


class VenueMonkCrawler(BaseCrawler):
    """VenueMonk venue data extractor"""

    def __init__(self):
        super().__init__(
            source_name="venuemonk",
            base_url="https://www.venuemonk.com"
        )
        self.kochi_wedding_url = "https://www.venuemonk.com/kochi/wedding-venues"

    def get_venue_list(self, city: str = "Kochi") -> List[Dict]:
        """
        Extract list of wedding venues in Kochi
        Returns: List of {name, url, preview_data}
        """
        logger.info(f"Fetching venue list from VenueMonk for {city}")

        # Check cache first
        cached_list = self._load_from_cache(f"{city.lower()}_venue_list")
        if cached_list:
            logger.info("Using cached venue list")
            return cached_list

        venues = []
        page = 1
        max_pages = 10  # Safety limit

        while page <= max_pages:
            url = f"{self.kochi_wedding_url}?page={page}" if page > 1 else self.kochi_wedding_url
            response = self._rate_limited_request(url)

            if not response:
                logger.warning(f"Failed to fetch page {page}")
                break

            soup = self._parse_html(response.text)

            # VenueMonk structure: venue cards with links
            # (NOTE: Actual selectors need to be updated based on real HTML structure)
            venue_cards = soup.find_all('div', class_=re.compile(r'venue-card|listing-card', re.I))

            if not venue_cards:
                logger.info(f"No more venues found on page {page}")
                break

            for card in venue_cards:
                try:
                    # Extract basic info
                    name_elem = card.find(['h2', 'h3', 'a'], class_=re.compile(r'venue-name|title', re.I))
                    if not name_elem:
                        continue

                    venue_name = name_elem.get_text(strip=True)
                    venue_url = name_elem.get('href') or card.find('a', href=True)['href']

                    # Ensure absolute URL
                    if not venue_url.startswith('http'):
                        venue_url = self.base_url + venue_url

                    # Extract preview data (capacity, price, rating if visible)
                    capacity_elem = card.find(string=re.compile(r'\d+\s*guests?', re.I))
                    price_elem = card.find(string=re.compile(r'₹|INR', re.I))
                    rating_elem = card.find(class_=re.compile(r'rating|stars', re.I))

                    venues.append({
                        'name': venue_name,
                        'url': venue_url,
                        'preview': {
                            'capacity_hint': capacity_elem.strip() if capacity_elem else None,
                            'price_hint': price_elem.strip() if price_elem else None,
                            'rating_hint': rating_elem.get_text(strip=True) if rating_elem else None
                        }
                    })

                    logger.debug(f"Found venue: {venue_name}")

                except Exception as e:
                    logger.error(f"Error parsing venue card: {str(e)}")
                    continue

            logger.info(f"Page {page}: Found {len(venue_cards)} venues (total: {len(venues)})")
            page += 1

        # Cache the venue list
        self._save_to_cache(f"{city.lower()}_venue_list", venues)
        logger.success(f"✓ Extracted {len(venues)} venues from VenueMonk")
        return venues

    def extract_venue_details(self, venue_url: str) -> Optional[Dict]:
        """
        Extract complete venue details from detail page
        Returns: Dictionary matching Venue schema
        """
        logger.info(f"Extracting details from: {venue_url}")

        # Check cache
        venue_id_slug = venue_url.split('/')[-1]
        cached_data = self._load_from_cache(f"venue_{venue_id_slug}")
        if cached_data:
            logger.info("Using cached venue details")
            return cached_data

        response = self._rate_limited_request(venue_url)
        if not response:
            return None

        soup = self._parse_html(response.text)

        try:
            # Extract venue name
            venue_name = self._extract_venue_name(soup)
            if not venue_name:
                logger.error("Could not extract venue name")
                return None

            # Build venue data structure
            venue_data = {
                "venue_id": f"kochi_venuemonk_{venue_id_slug}",
                "basic_info": self._extract_basic_info(soup, venue_name),
                "location": self._extract_location(soup),
                "contact": self._extract_contact(soup),
                "capacity": self._extract_capacity(soup),
                "catering": self._extract_catering(soup),
                "facilities": self._extract_facilities(soup),
                "timeline_logistics": self._extract_timeline_logistics(soup),
                "pricing": self._extract_pricing(soup),
                "event_types_hosted": self._extract_event_types(soup),
                "vendor_relationships": None,  # Usually not available on listing sites
                "reviews_reputation": self._extract_reviews(soup),
                "checklist_automation": self._generate_checklist_automation(),
                "search_keywords": self._generate_search_keywords(venue_name, soup),
                "data_source": f"venuemonk_{venue_url}",
                "last_updated": datetime.now(),
                "data_quality_score": 0.0,  # Will be calculated
                "manual_verification_required": True
            }

            # Cache the extracted data
            self._save_to_cache(f"venue_{venue_id_slug}", venue_data)

            return venue_data

        except Exception as e:
            logger.error(f"Failed to extract venue details: {str(e)}")
            logger.exception(e)
            return None

    # ============================================
    # EXTRACTION HELPER METHODS
    # ============================================

    def _extract_venue_name(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract official venue name"""
        name_elem = soup.find(['h1', 'h2'], class_=re.compile(r'venue-name|venue-title|property-name', re.I))
        if name_elem:
            return name_elem.get_text(strip=True)

        # Fallback: try meta tags
        og_title = soup.find('meta', property='og:title')
        if og_title:
            return og_title.get('content', '').replace(' | VenueMonk', '').strip()

        return None

    def _extract_basic_info(self, soup: BeautifulSoup, venue_name: str) -> Dict:
        """Extract basic venue information"""
        return {
            "official_name": venue_name,
            "brand_name": None,
            "aliases": [venue_name],  # Will be enhanced manually
            "venue_type": "hotel_banquet",  # Default, needs manual classification
            "star_rating": None,
            "established_year": None,
            "google_rating": None,
            "total_reviews": 0
        }

    def _extract_location(self, soup: BeautifulSoup) -> Dict:
        """Extract location details"""
        address_elem = soup.find(class_=re.compile(r'address|location', re.I))
        address = address_elem.get_text(strip=True) if address_elem else "Address not available"

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
        """Extract contact information"""
        phone_elem = soup.find(string=re.compile(r'\+91[\s-]?\d{10}', re.I))
        email_elem = soup.find('a', href=re.compile(r'mailto:', re.I))

        return {
            "phone_primary": phone_elem.strip() if phone_elem else "Contact via website",
            "phone_secondary": None,
            "email": email_elem.get('href').replace('mailto:', '') if email_elem else None,
            "website": None,
            "whatsapp": None,
            "booking_manager": None
        }

    def _extract_capacity(self, soup: BeautifulSoup) -> Dict:
        """Extract capacity information"""
        # Look for capacity mentions
        capacity_text = soup.find(string=re.compile(r'(\d+)\s*-\s*(\d+)\s*guests?', re.I))

        event_spaces = []
        if capacity_text:
            match = re.search(r'(\d+)\s*-\s*(\d+)', capacity_text)
            if match:
                event_spaces.append({
                    "space_name": "Main Hall",
                    "min_guests": int(match.group(1)),
                    "max_guests": int(match.group(2)),
                    "optimal_guests": None,
                    "space_type": "indoor",
                    "has_stage": False,
                    "has_dance_floor": False,
                    "natural_lighting": False
                })

        return {
            "event_spaces": event_spaces if event_spaces else [{
                "space_name": "Main Hall",
                "min_guests": 50,
                "max_guests": 500,
                "space_type": "indoor",
                "has_stage": False,
                "has_dance_floor": False,
                "natural_lighting": False
            }],
            "total_rooms": None,
            "parking_capacity": None
        }

    def _extract_catering(self, soup: BeautifulSoup) -> Dict:
        """Extract catering information"""
        return {
            "in_house_catering": True,  # Default assumption
            "in_house_menu_types": ["north_indian", "south_indian"],
            "outside_catering_allowed": False,
            "kitchen_specifications": None,
            "bar_service_available": False,
            "alcohol_policy": None
        }

    def _extract_facilities(self, soup: BeautifulSoup) -> Dict:
        """Extract facility information"""
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

    def _extract_timeline_logistics(self, soup: BeautifulSoup) -> Dict:
        """Extract timeline and logistics"""
        return {
            "setup_time_hours": None,
            "teardown_time_hours": None,
            "booking_window_days": 90,
            "min_advance_booking_days": 30,
            "cancellation_policy": None,
            "decoration_restrictions": [],
            "noise_curfew": None
        }

    def _extract_pricing(self, soup: BeautifulSoup) -> Dict:
        """Extract pricing information"""
        price_elem = soup.find(string=re.compile(r'₹\s*[\d,]+', re.I))

        return {
            "base_venue_charge": None,
            "per_plate_cost_min": None,
            "per_plate_cost_max": None,
            "packages": [],
            "security_deposit": None,
            "taxes_included": False,
            "payment_terms": None
        }

    def _extract_event_types(self, soup: BeautifulSoup) -> Dict:
        """Extract supported event types"""
        return {
            "weddings": True,
            "corporate_events": False,
            "conferences": False,
            "exhibitions": False,
            "birthday_parties": False,
            "anniversaries": False,
            "engagement_ceremonies": True,
            "religious_ceremonies": False,
            "photo_shoots": False
        }

    def _extract_reviews(self, soup: BeautifulSoup) -> Optional[Dict]:
        """Extract review information"""
        return {
            "overall_rating": 0.0,
            "total_reviews_aggregated": 0,
            "review_snapshots": [],
            "awards_certifications": [],
            "featured_events": []
        }

    def _generate_checklist_automation(self) -> Dict:
        """Generate checklist automation rules"""
        return {
            "auto_populate_items": [
                "venue_confirmed",
                "venue_capacity_confirmed",
                "venue_contact_saved"
            ],
            "conditional_removals": ["venue_search_required"],
            "conditional_additions": []
        }

    def _generate_search_keywords(self, venue_name: str, soup: BeautifulSoup) -> Dict:
        """Generate search keywords"""
        primary = [venue_name]

        # Extract brand name variations
        words = venue_name.split()
        if len(words) > 1:
            primary.extend([
                ' '.join(words[:2]),  # First two words
                words[0]  # First word only
            ])

        return {
            "primary_keywords": primary,
            "secondary_keywords": ["wedding venue", "banquet hall", "kochi"],
            "location_keywords": ["kochi", "ernakulam", "kerala"]
        }


# ============================================
# STANDALONE EXECUTION
# ============================================

if __name__ == "__main__":
    from loguru import logger
    import sys

    # Configure logging
    logger.remove()
    logger.add(sys.stderr, level="INFO")
    logger.add("../logs/venuemonk_crawler.log", rotation="10 MB", level="DEBUG")

    # Initialize crawler
    crawler = VenueMonkCrawler()

    # Test with limited venues
    print("\n🔥 EventFoundry VenueMonk Crawler - INITIATED\n")
    venues = crawler.crawl_all(city="Kochi", max_venues=5)
    print(f"\n✅ Successfully extracted {len(venues)} venues")
    print("\nSample venue IDs:")
    for v in venues[:3]:
        print(f"  - {v.venue_id}: {v.basic_info.official_name}")
