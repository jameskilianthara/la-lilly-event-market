#!/usr/bin/env python3
"""
EventFoundry Venue Crawler - Main Orchestrator
Run all crawlers, build search index, test optimization
"""

import sys
import argparse
from pathlib import Path
from loguru import logger

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

from config import LOG_FILE, LOG_LEVEL, VENUES_DIR
from crawlers.venuemonk_crawler import VenueMonkCrawler
from crawlers.weddingvenues_crawler import WeddingVenuesCrawler
from crawlers.venuelook_crawler import VenuelookCrawler
from search.venue_search import VenueSearchEngine
from integration.checklist_optimizer import ChecklistOptimizer


def setup_logging(verbose: bool = False):
    """Configure logging"""
    logger.remove()

    # Console logging
    log_level = "DEBUG" if verbose else "INFO"
    logger.add(sys.stderr, level=log_level, format="<level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> | <level>{message}</level>")

    # File logging
    logger.add(LOG_FILE, rotation="10 MB", level="DEBUG", format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function} | {message}")

    logger.info("EventFoundry Venue Crawler initialized")


def run_crawlers(sources: list, max_venues_per_source: int = None):
    """Run specified crawlers"""
    logger.info(f"Starting crawlers for sources: {sources}")

    crawlers = {
        'venuemonk': VenueMonkCrawler,
        'weddingvenues': WeddingVenuesCrawler,
        'venuelook': VenuelookCrawler
    }

    total_venues = 0

    for source in sources:
        if source not in crawlers:
            logger.warning(f"Unknown source: {source}")
            continue

        logger.info(f"\n{'='*60}")
        logger.info(f"Starting {source.upper()} crawler")
        logger.info(f"{'='*60}\n")

        try:
            crawler = crawlers[source]()
            venues = crawler.crawl_all(city="Kochi", max_venues=max_venues_per_source)
            total_venues += len(venues)
            logger.success(f"✓ {source}: Extracted {len(venues)} venues\n")

        except Exception as e:
            logger.error(f"✗ {source} failed: {str(e)}")
            logger.exception(e)

    logger.success(f"\n{'='*60}")
    logger.success(f"CRAWLING COMPLETE: {total_venues} total venues extracted")
    logger.success(f"{'='*60}\n")

    return total_venues


def test_search_engine():
    """Test the venue search engine"""
    logger.info("\n🔍 Testing Venue Search Engine\n")

    search_engine = VenueSearchEngine()

    if search_engine.get_venue_count() == 0:
        logger.warning("No venues in database. Run crawlers first.")
        return

    logger.info(f"Loaded {search_engine.get_venue_count()} venues")

    # Test queries
    test_cases = [
        {
            "query": "Casino Hotel",
            "filters": {},
            "description": "Exact name match"
        },
        {
            "query": "wedding venue for 300 guests",
            "filters": {"min_capacity": 250},
            "description": "Capacity filter"
        },
        {
            "query": "venue with kitchen",
            "filters": {"has_kitchen": True},
            "description": "Facility filter"
        },
        {
            "query": "banquet hall",
            "filters": {},
            "description": "Generic search"
        }
    ]

    for test in test_cases:
        logger.info(f"\n{'='*60}")
        logger.info(f"Test: {test['description']}")
        logger.info(f"Query: '{test['query']}'")
        logger.info(f"Filters: {test['filters']}")
        logger.info(f"{'='*60}")

        results = search_engine.search(test['query'], test['filters'], max_results=3)

        if results:
            for idx, venue in enumerate(results, 1):
                logger.info(f"\n{idx}. {venue['basic_info']['official_name']}")
                logger.info(f"   Match Score: {venue['match_score']}%")
                logger.info(f"   Location: {venue['location']['address']}")

                spaces = venue.get('capacity', {}).get('event_spaces', [])
                if spaces:
                    space = spaces[0]
                    logger.info(f"   Capacity: {space.get('min_guests', 'N/A')}-{space.get('max_guests', 'N/A')} guests")
        else:
            logger.warning("No results found")

    logger.info("\n" + "="*60 + "\n")


def test_checklist_optimization():
    """Test checklist auto-optimization"""
    logger.info("\n🔧 Testing Checklist Auto-Optimization\n")

    # Load a sample venue
    search_engine = VenueSearchEngine()

    if search_engine.get_venue_count() == 0:
        logger.warning("No venues available. Run crawlers first.")
        return

    # Get first venue
    sample_venue = search_engine.get_all_venues()[0]
    logger.info(f"Using sample venue: {sample_venue['basic_info']['official_name']}")

    # Sample checklist
    sample_checklist = {
        "eventType": "Wedding",
        "sections": [
            {
                "id": "venue_section",
                "title": "Venue Planning",
                "items": [
                    {"id": "venue_search_required", "label": "Search and shortlist venues"},
                    {"id": "venue_confirmed", "label": "Confirm final venue"},
                    {"id": "venue_capacity", "label": "Verify venue capacity"},
                    {"id": "parking_arrangement", "label": "Arrange parking"}
                ]
            },
            {
                "id": "catering_section",
                "title": "Catering",
                "items": [
                    {"id": "external_caterer_search", "label": "Search for caterers"},
                    {"id": "menu_types_available", "label": "Finalize menu types"}
                ]
            }
        ]
    }

    # Optimize
    optimizer = ChecklistOptimizer()
    optimized = optimizer.optimize_checklist(sample_checklist, sample_venue)

    # Generate report
    report = optimizer.generate_optimization_report(optimized)
    logger.info("\n" + report)


def show_statistics():
    """Show database statistics"""
    logger.info("\n📊 Venue Database Statistics\n")

    search_engine = VenueSearchEngine()

    if search_engine.get_venue_count() == 0:
        logger.warning("No venues in database.")
        return

    venues = search_engine.get_all_venues()

    # Count by source
    sources = {}
    venue_types = {}

    for venue in venues:
        source = venue.get('data_source', 'unknown').split('_')[0]
        sources[source] = sources.get(source, 0) + 1

        v_type = venue.get('basic_info', {}).get('venue_type', 'unknown')
        venue_types[v_type] = venue_types.get(v_type, 0) + 1

    logger.info(f"Total Venues: {len(venues)}")
    logger.info(f"\nBy Source:")
    for source, count in sorted(sources.items()):
        logger.info(f"  {source}: {count}")

    logger.info(f"\nBy Type:")
    for v_type, count in sorted(venue_types.items()):
        logger.info(f"  {v_type}: {count}")

    # Capacity stats
    capacities = []
    for venue in venues:
        spaces = venue.get('capacity', {}).get('event_spaces', [])
        if spaces:
            capacities.append(spaces[0].get('max_guests', 0))

    if capacities:
        logger.info(f"\nCapacity Range:")
        logger.info(f"  Min: {min(capacities)} guests")
        logger.info(f"  Max: {max(capacities)} guests")
        logger.info(f"  Average: {sum(capacities)//len(capacities)} guests")

    logger.info("\n" + "="*60 + "\n")


def main():
    """Main execution"""
    parser = argparse.ArgumentParser(
        description="EventFoundry Venue Crawler - Kochi Venue Database Builder"
    )

    parser.add_argument(
        '--crawl',
        nargs='+',
        choices=['venuemonk', 'weddingvenues', 'venuelook', 'all'],
        help='Run specific crawlers (or "all" for all sources)'
    )

    parser.add_argument(
        '--limit',
        type=int,
        help='Maximum venues per source (for testing)'
    )

    parser.add_argument(
        '--search',
        action='store_true',
        help='Test search engine'
    )

    parser.add_argument(
        '--optimize',
        action='store_true',
        help='Test checklist optimization'
    )

    parser.add_argument(
        '--stats',
        action='store_true',
        help='Show database statistics'
    )

    parser.add_argument(
        '--verbose',
        '-v',
        action='store_true',
        help='Verbose logging'
    )

    args = parser.parse_args()

    # Setup logging
    setup_logging(args.verbose)

    print("\n" + "="*60)
    print("🔥 EVENTFOUNDRY VENUE CRAWLER")
    print("="*60 + "\n")

    # Run crawlers
    if args.crawl:
        sources = ['venuemonk', 'weddingvenues', 'venuelook'] if 'all' in args.crawl else args.crawl
        run_crawlers(sources, args.limit)

    # Run search tests
    if args.search:
        test_search_engine()

    # Run optimization tests
    if args.optimize:
        test_checklist_optimization()

    # Show stats
    if args.stats:
        show_statistics()

    # If no arguments, show help
    if not any([args.crawl, args.search, args.optimize, args.stats]):
        parser.print_help()
        print("\n💡 Quick start examples:")
        print("  python main.py --crawl all --limit 5        # Crawl 5 venues from each source")
        print("  python main.py --search                      # Test search engine")
        print("  python main.py --optimize                    # Test checklist optimization")
        print("  python main.py --stats                       # Show database statistics")
        print()


if __name__ == "__main__":
    main()
