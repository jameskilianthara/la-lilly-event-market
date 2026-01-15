"""
EventFoundry Venue Search Engine
Fuzzy keyword matching with filters for capacity, facilities, location
"""

import json
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from fuzzywuzzy import fuzz, process
from loguru import logger

import sys
sys.path.append(str(Path(__file__).parent.parent))

from config import VENUES_DIR, FUZZY_MATCH_THRESHOLD


class VenueSearchEngine:
    """Intelligent venue search with fuzzy matching and filters"""

    def __init__(self, venues_directory: Path = VENUES_DIR):
        self.venues_dir = venues_directory
        self.venues: List[Dict] = []
        self.venue_index: Dict[str, Dict] = {}
        self.keyword_map: Dict[str, List[str]] = {}  # keyword -> [venue_ids]

        self._load_venues()
        self._build_search_index()

    def _load_venues(self):
        """Load all venue JSON files from directory"""
        logger.info(f"Loading venues from: {self.venues_dir}")

        if not self.venues_dir.exists():
            logger.warning(f"Venues directory not found: {self.venues_dir}")
            return

        venue_files = list(self.venues_dir.glob("*.json"))
        logger.info(f"Found {len(venue_files)} venue files")

        for venue_file in venue_files:
            try:
                with open(venue_file, 'r', encoding='utf-8') as f:
                    venue_data = json.load(f)
                    self.venues.append(venue_data)
                    self.venue_index[venue_data['venue_id']] = venue_data

            except Exception as e:
                logger.error(f"Error loading {venue_file}: {str(e)}")

        logger.success(f"✓ Loaded {len(self.venues)} venues")

    def _build_search_index(self):
        """Build keyword index for fast searching"""
        logger.info("Building search index...")

        for venue in self.venues:
            venue_id = venue['venue_id']
            keywords = venue.get('search_keywords', {})

            # Index primary keywords
            for keyword in keywords.get('primary_keywords', []):
                keyword_lower = keyword.lower()
                if keyword_lower not in self.keyword_map:
                    self.keyword_map[keyword_lower] = []
                self.keyword_map[keyword_lower].append(venue_id)

            # Index secondary keywords
            for keyword in keywords.get('secondary_keywords', []):
                keyword_lower = keyword.lower()
                if keyword_lower not in self.keyword_map:
                    self.keyword_map[keyword_lower] = []
                if venue_id not in self.keyword_map[keyword_lower]:
                    self.keyword_map[keyword_lower].append(venue_id)

            # Index aliases
            for alias in venue.get('basic_info', {}).get('aliases', []):
                alias_lower = alias.lower()
                if alias_lower not in self.keyword_map:
                    self.keyword_map[alias_lower] = []
                if venue_id not in self.keyword_map[alias_lower]:
                    self.keyword_map[alias_lower].append(venue_id)

        logger.success(f"✓ Indexed {len(self.keyword_map)} unique keywords")

    def search(
        self,
        query: str,
        filters: Optional[Dict] = None,
        max_results: int = 10
    ) -> List[Dict]:
        """
        Search venues with fuzzy matching and optional filters

        Args:
            query: Search query (e.g., "Casino Hotel", "venue for 300 guests")
            filters: Optional filters:
                - min_capacity: int
                - max_capacity: int
                - has_kitchen: bool
                - has_parking: bool
                - has_accommodation: bool
                - venue_type: str
                - price_max: int (per plate)
            max_results: Maximum number of results to return

        Returns:
            List of venue dictionaries with match scores
        """
        logger.info(f"Searching for: '{query}' with filters: {filters}")

        if not query.strip():
            return []

        # Step 1: Fuzzy match against all keywords
        matched_venues = self._fuzzy_match(query)

        # Step 2: Apply filters
        if filters:
            matched_venues = self._apply_filters(matched_venues, filters)

        # Step 3: Sort by match score and limit
        matched_venues.sort(key=lambda x: x['match_score'], reverse=True)
        results = matched_venues[:max_results]

        logger.success(f"✓ Found {len(results)} matching venues")
        return results

    def _fuzzy_match(self, query: str) -> List[Dict]:
        """Fuzzy match query against venue keywords"""
        query_lower = query.lower()
        matched_venues = {}

        # Exact match first
        if query_lower in self.keyword_map:
            for venue_id in self.keyword_map[query_lower]:
                venue = self.venue_index[venue_id]
                matched_venues[venue_id] = {
                    **venue,
                    'match_score': 100,
                    'match_type': 'exact'
                }
            logger.debug(f"Exact match found: {len(matched_venues)} venues")

        # Fuzzy match against all keywords
        all_keywords = list(self.keyword_map.keys())
        fuzzy_matches = process.extract(
            query_lower,
            all_keywords,
            scorer=fuzz.token_sort_ratio,
            limit=20
        )

        for matched_keyword, score in fuzzy_matches:
            if score >= FUZZY_MATCH_THRESHOLD:
                for venue_id in self.keyword_map[matched_keyword]:
                    # Don't overwrite exact matches
                    if venue_id not in matched_venues:
                        venue = self.venue_index[venue_id]
                        matched_venues[venue_id] = {
                            **venue,
                            'match_score': score,
                            'match_type': 'fuzzy',
                            'matched_keyword': matched_keyword
                        }

        logger.debug(f"Fuzzy matching found {len(matched_venues)} total venues")
        return list(matched_venues.values())

    def _apply_filters(self, venues: List[Dict], filters: Dict) -> List[Dict]:
        """Apply capacity, facility, and price filters"""
        filtered = []

        for venue in venues:
            # Capacity filter
            if 'min_capacity' in filters or 'max_capacity' in filters:
                if not self._check_capacity(venue, filters):
                    continue

            # Facility filters
            if 'has_kitchen' in filters:
                if not venue.get('catering', {}).get('in_house_catering'):
                    continue

            if 'has_parking' in filters:
                parking_capacity = venue.get('capacity', {}).get('parking_capacity')
                if not parking_capacity or parking_capacity < 1:
                    continue

            if 'has_accommodation' in filters and filters['has_accommodation']:
                if not venue.get('facilities', {}).get('accommodation_available'):
                    continue

            # Venue type filter
            if 'venue_type' in filters:
                if venue.get('basic_info', {}).get('venue_type') != filters['venue_type']:
                    continue

            # Price filter
            if 'price_max' in filters:
                price_max_venue = venue.get('pricing', {}).get('per_plate_cost_max')
                if price_max_venue and price_max_venue > filters['price_max']:
                    continue

            filtered.append(venue)

        logger.debug(f"After filtering: {len(filtered)} venues")
        return filtered

    def _check_capacity(self, venue: Dict, filters: Dict) -> bool:
        """Check if venue meets capacity requirements"""
        event_spaces = venue.get('capacity', {}).get('event_spaces', [])
        if not event_spaces:
            return False

        min_required = filters.get('min_capacity', 0)
        max_required = filters.get('max_capacity', float('inf'))

        for space in event_spaces:
            max_guests = space.get('max_guests', 0)
            if min_required <= max_guests <= max_required:
                return True

        return False

    def get_venue_by_id(self, venue_id: str) -> Optional[Dict]:
        """Get venue by exact ID"""
        return self.venue_index.get(venue_id)

    def get_all_venues(self) -> List[Dict]:
        """Get all venues"""
        return self.venues

    def get_venue_count(self) -> int:
        """Get total number of venues"""
        return len(self.venues)

    def search_by_location(self, area: str, max_results: int = 10) -> List[Dict]:
        """Search venues by location/area"""
        results = []

        for venue in self.venues:
            location = venue.get('location', {})
            address = location.get('address', '').lower()
            landmark = location.get('landmark', '').lower()

            if area.lower() in address or area.lower() in landmark:
                results.append({
                    **venue,
                    'match_score': 90,
                    'match_type': 'location'
                })

        results.sort(key=lambda x: x['match_score'], reverse=True)
        return results[:max_results]


# ============================================
# EXAMPLE USAGE & TESTING
# ============================================

if __name__ == "__main__":
    from loguru import logger
    import sys

    logger.remove()
    logger.add(sys.stderr, level="INFO")

    print("\n🔍 EventFoundry Venue Search Engine - TEST\n")

    # Initialize search engine
    search_engine = VenueSearchEngine()

    if search_engine.get_venue_count() == 0:
        print("⚠️  No venues loaded. Please run crawlers first.\n")
        sys.exit(0)

    print(f"Loaded {search_engine.get_venue_count()} venues\n")

    # Test searches
    test_queries = [
        ("Casino Hotel", {}),
        ("wedding venue for 300 guests", {"min_capacity": 250}),
        ("venue with kitchen", {"has_kitchen": True}),
        ("Marine Drive banquet", {}),
    ]

    for query, filters in test_queries:
        print(f"\n{'='*60}")
        print(f"Query: {query}")
        print(f"Filters: {filters}")
        print(f"{'='*60}")

        results = search_engine.search(query, filters, max_results=3)

        if results:
            for idx, venue in enumerate(results, 1):
                print(f"\n{idx}. {venue['basic_info']['official_name']}")
                print(f"   Match Score: {venue['match_score']}%")
                print(f"   Location: {venue['location']['address']}")

                spaces = venue['capacity']['event_spaces']
                if spaces:
                    space = spaces[0]
                    print(f"   Capacity: {space['min_guests']}-{space['max_guests']} guests")
        else:
            print("No results found.")

    print("\n" + "="*60 + "\n")
