# 🏨 EventFoundry Venue Crawler

**Comprehensive Kochi venue database with intelligent search and checklist integration**

## 🎯 Features

- **Multi-Source Crawling**: Extract venue data from VenueMonk, WeddingVenues.in, Venuelook
- **Fuzzy Search Engine**: Intelligent keyword matching with aliases ("Casino Hotel" → "Casino Kochi")
- **Checklist Auto-Optimization**: Auto-populate 15+ checklist items based on venue selection
- **Data Validation**: Pydantic schema validation for data quality
- **Caching**: Built-in caching to avoid redundant crawls

## 📋 Quick Start

### 1. Installation

```bash
cd venue-crawler
pip install -r requirements.txt
```

### 2. Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
# Edit .env with your API keys
```

### 3. Run Crawlers

```bash
# Crawl all sources (5 venues per source for testing)
python main.py --crawl all --limit 5

# Crawl specific source
python main.py --crawl venuemonk --limit 10

# Full crawl (no limit)
python main.py --crawl all
```

### 4. Test Search Engine

```bash
python main.py --search
```

### 5. Test Checklist Optimization

```bash
python main.py --optimize
```

### 6. View Statistics

```bash
python main.py --stats
```

## 🗂️ Project Structure

```
venue-crawler/
├── config.py                      # Configuration & settings
├── requirements.txt               # Python dependencies
├── main.py                        # Main orchestrator
│
├── models/
│   ├── __init__.py
│   └── venue_schema.py           # Pydantic data models
│
├── crawlers/
│   ├── base_crawler.py           # Abstract base crawler
│   ├── venuemonk_crawler.py      # VenueMonk extractor
│   ├── weddingvenues_crawler.py  # WeddingVenues.in extractor
│   └── venuelook_crawler.py      # Venuelook extractor
│
├── search/
│   ├── __init__.py
│   └── venue_search.py           # Fuzzy search engine
│
├── integration/
│   ├── __init__.py
│   └── checklist_optimizer.py    # Checklist auto-optimization
│
├── data/
│   ├── venues/                   # Extracted venue JSON files
│   └── cache/                    # Crawler cache
│
└── logs/
    └── crawler.log               # Execution logs
```

## 🔍 Search Engine Usage

```python
from search.venue_search import VenueSearchEngine

search = VenueSearchEngine()

# Simple search
results = search.search("Casino Hotel")

# Search with filters
results = search.search(
    query="wedding venue",
    filters={
        "min_capacity": 300,
        "has_kitchen": True,
        "has_parking": True
    },
    max_results=5
)

# Location search
results = search.search_by_location("Marine Drive")
```

## 🔧 Checklist Optimization Usage

```python
from integration.checklist_optimizer import ChecklistOptimizer

optimizer = ChecklistOptimizer()

# Optimize checklist based on venue
optimized = optimizer.optimize_checklist(
    checklist_data=original_checklist,
    venue_data=selected_venue
)

# Generate report
report = optimizer.generate_optimization_report(optimized)
print(report)
```

## 📊 Venue Data Schema

Each venue includes 15 data categories:

1. **basic_info**: Name, type, rating
2. **location**: Address, coordinates, accessibility
3. **contact**: Phone, email, booking manager
4. **capacity**: Event spaces, parking
5. **catering**: In-house options, menu types
6. **facilities**: AC, WiFi, sound system, etc.
7. **timeline_logistics**: Booking windows, restrictions
8. **pricing**: Packages, per-plate costs
9. **event_types_hosted**: Weddings, corporate, etc.
10. **vendor_relationships**: Preferred vendors
11. **reviews_reputation**: Ratings, awards
12. **checklist_automation**: Auto-populate rules
13. **search_keywords**: Primary/secondary keywords
14. **data_source**: Crawl metadata
15. **data_quality_score**: Validation score

## 🎨 Checklist Auto-Optimization Rules

### Auto-Populate (15+ items):
- ✓ Venue name, address, contact
- ✓ Capacity confirmation
- ✓ AC/backup power availability
- ✓ Sound system/projector availability
- ✓ Parking capacity
- ✓ Catering options
- ✓ Menu types available
- ✓ Accommodation details

### Conditional Removals:
- ✗ Venue search (when venue confirmed)
- ✗ Parking arrangement (if venue has parking)
- ✗ External caterer search (if in-house only)
- ✗ Accommodation search (if venue has rooms)

### Conditional Additions:
- + External caterer coordination (if allowed)
- + Room block booking (if accommodation available)
- + Valet parking confirmation (if valet service)
- + Kitchen access coordination (for external caterers)
- + Noise curfew planning (if curfew exists)
- + Decoration restrictions review (if restrictions exist)

## 🚀 Integration with EventFoundry App

### Step 1: Copy Venue Data to App

```bash
# Copy venue JSON files to app
cp -r data/venues/ ../src/data/venues/
```

### Step 2: Create API Endpoint

```typescript
// src/app/api/venues/search/route.ts
import { VenueSearchEngine } from '@/lib/venue-search';

export async function POST(request: Request) {
  const { query, filters } = await request.json();
  const search = new VenueSearchEngine();
  const results = search.search(query, filters);
  return Response.json(results);
}
```

### Step 3: Integrate with Checklist Page

```typescript
// When user selects venue
const optimized = optimizeChecklist(currentChecklist, selectedVenue);
setChecklist(optimized);
```

## 📈 Crawling Progress & Metrics

Current status:
- ✅ Infrastructure complete
- ✅ 3 crawlers implemented
- ✅ Search engine ready
- ✅ Checklist optimizer ready
- ⏳ Data extraction pending (run crawlers)

Expected results:
- VenueMonk: ~80 venues
- WeddingVenues: ~50 venues
- Venuelook: ~40 venues
- **Total: 150+ Kochi venues**

## 🛠️ Development Commands

```bash
# Test individual crawler
python -m crawlers.venuemonk_crawler

# Test search engine
python -m search.venue_search

# Test checklist optimizer
python -m integration.checklist_optimizer

# Full pipeline
python main.py --crawl all --search --optimize --stats
```

## 🔒 Data Quality

Each venue includes:
- `data_quality_score`: 0-100 (based on field completeness)
- `manual_verification_required`: True/False flag
- `last_updated`: Timestamp

Low-quality venues flagged for manual enhancement.

## 📝 Next Steps

1. **Run Initial Crawl**: `python main.py --crawl all --limit 10`
2. **Review Data Quality**: Check extracted JSON files
3. **Manual Enhancement**: Top 20 venues with complete details
4. **Google Maps Integration**: Add geocoding, reviews
5. **Production Deployment**: Integrate with EventFoundry app

## 🎯 Implementation Timeline

- ✅ Week 1: Crawler infrastructure (COMPLETE)
- ⏳ Week 2: Data extraction & validation (IN PROGRESS)
- ⏳ Week 3: Manual enhancement & integration (PENDING)

## 📞 Support

For issues or questions:
- Check logs: `tail -f logs/crawler.log`
- Review cached data: `data/cache/`
- Manual verification: `data/venues/`

---

**Built for EventFoundry - Where extraordinary events are forged! 🔥⚒️**
