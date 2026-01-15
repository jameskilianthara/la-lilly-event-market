#!/usr/bin/env python3
"""Quick test of venue search engine"""

import json
import sys
from pathlib import Path
from fuzzywuzzy import fuzz, process

# Simple venue search without complex imports
VENUES_DIR = Path(__file__).parent / "data" / "venues"

def load_venues():
    """Load all venue JSON files"""
    venues = []
    for venue_file in VENUES_DIR.glob("*.json"):
        with open(venue_file, 'r') as f:
            venues.append(json.load(f))
    return venues

def search_venues(query, venues, max_results=5):
    """Simple fuzzy search"""
    matches = []

    for venue in venues:
        # Get keywords
        keywords = venue.get('search_keywords', {}).get('primary_keywords', [])
        keywords.extend(venue.get('basic_info', {}).get('aliases', []))

        # Find best match score
        best_score = 0
        for keyword in keywords:
            score = fuzz.token_sort_ratio(query.lower(), keyword.lower())
            best_score = max(best_score, score)

        if best_score >= 60:  # Threshold
            matches.append({
                'venue': venue,
                'score': best_score
            })

    # Sort by score
    matches.sort(key=lambda x: x['score'], reverse=True)
    return matches[:max_results]

def main():
    print("\n" + "="*60)
    print("🔍 EVENTFOUNDRY VENUE SEARCH - TEST")
    print("="*60 + "\n")

    venues = load_venues()
    print(f"Loaded {len(venues)} venues\n")

    # Test searches
    test_queries = [
        "Casino Hotel",
        "Crowne Plaza",
        "5 star venue",
        "wedding venue kochi"
    ]

    for query in test_queries:
        print(f"\n{'='*60}")
        print(f"Query: '{query}'")
        print(f"{'='*60}")

        results = search_venues(query, venues)

        if results:
            for idx, match in enumerate(results, 1):
                venue = match['venue']
                print(f"\n{idx}. {venue['basic_info']['official_name']}")
                print(f"   Match Score: {match['score']}%")
                print(f"   Location: {venue['location']['address']}")

                spaces = venue.get('capacity', {}).get('event_spaces', [])
                if spaces:
                    space = spaces[0]
                    print(f"   Capacity: {space['min_guests']}-{space['max_guests']} guests")
        else:
            print("No results found")

    print("\n" + "="*60 + "\n")

if __name__ == "__main__":
    main()
