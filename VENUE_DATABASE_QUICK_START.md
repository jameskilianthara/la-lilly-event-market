# 🏨 VENUE DATABASE - QUICK START GUIDE

**Status**: ✅ Ready for data extraction
**Created**: 2026-01-02
**Files**: 13 Python files, 2,433 lines of code

---

## ⚡ 60-SECOND QUICK START

```bash
# 1. Install dependencies
cd venue-crawler
pip install -r requirements.txt

# 2. Test with 2 venues
python main.py --crawl venuemonk --limit 2

# 3. Test search
python main.py --search

# 4. Test optimization
python main.py --optimize
```

---

## 📊 WHAT'S INCLUDED

### ✅ Three Production Crawlers
- **VenueMonk** (~80 venues expected)
- **WeddingVenues.in** (~50 venues expected)
- **Venuelook** (~40 venues expected)

### ✅ Fuzzy Search Engine
```python
# Search: "Casino Hotel" → finds "Casino Kochi", "The Casino Willingdon Island"
results = search.search("Casino Hotel")

# Filter by capacity & facilities
results = search.search("wedding venue", {
    "min_capacity": 300,
    "has_kitchen": True,
    "has_parking": True
})
```

### ✅ Checklist Auto-Optimization
```python
# Auto-populate 15+ items when venue selected
optimized = optimizer.optimize_checklist(checklist, venue)

# Results:
# ✓ 8 items auto-populated (venue name, capacity, facilities)
# ✗ 3 items removed (venue search, parking arrangement)
# + 2 items added (valet parking, room blocks)
```

---

## 🎯 COMPLETE FEATURE LIST

### Data Extraction (15 Categories):
1. Basic info (name, type, rating)
2. Location (address, coordinates, accessibility)
3. Contact (phone, email, booking manager)
4. Capacity (event spaces, parking)
5. Catering (in-house, menu types, alcohol policy)
6. Facilities (AC, WiFi, sound, lighting, backup power)
7. Timeline logistics (booking windows, restrictions)
8. Pricing (packages, per-plate costs)
9. Event types (weddings, corporate, etc.)
10. Vendor relationships (preferred vendors)
11. Reviews & reputation (ratings, awards)
12. Checklist automation (auto-populate rules)
13. Search keywords (aliases, variations)
14. Data source (crawl metadata)
15. Quality score (validation metrics)

### Search Features:
- ✅ Fuzzy keyword matching (80%+ threshold)
- ✅ Alias support ("Casino" → "Casino Hotel Kochi")
- ✅ Multi-filter (capacity, facilities, price)
- ✅ Location search (area, landmark)
- ✅ Match scoring (0-100%)

### Checklist Optimization:
- ✅ Auto-populate 15+ items from venue data
- ✅ Remove redundant items (venue search when confirmed)
- ✅ Add conditional items (valet, room blocks, kitchen access)
- ✅ Generate optimization reports

---

## 🚀 USAGE EXAMPLES

### Crawl Venues
```bash
# Test with 5 venues per source
python main.py --crawl all --limit 5

# Full crawl (150+ venues)
python main.py --crawl all

# Single source
python main.py --crawl venuemonk
```

### Search Venues
```bash
# Test search engine
python main.py --search

# Programmatic usage
from search.venue_search import VenueSearchEngine
search = VenueSearchEngine()
results = search.search("Casino Hotel", {"min_capacity": 300})
```

### Optimize Checklist
```bash
# Test optimization
python main.py --optimize

# Programmatic usage
from integration.checklist_optimizer import ChecklistOptimizer
optimizer = ChecklistOptimizer()
optimized = optimizer.optimize_checklist(checklist, venue)
```

### View Statistics
```bash
python main.py --stats
```

---

## 📁 FILE STRUCTURE

```
venue-crawler/
├── main.py                        # CLI orchestrator
├── config.py                      # Settings
├── requirements.txt               # Dependencies
├── README.md                      # Full documentation
│
├── models/venue_schema.py         # Pydantic models (15 categories)
├── crawlers/
│   ├── base_crawler.py           # Abstract base
│   ├── venuemonk_crawler.py      # VenueMonk extractor
│   ├── weddingvenues_crawler.py  # WeddingVenues extractor
│   └── venuelook_crawler.py      # Venuelook extractor
├── search/venue_search.py         # Fuzzy search engine
└── integration/checklist_optimizer.py  # Auto-optimization
```

**Total**: 13 Python files, 2,433 lines

---

## ⚠️ IMPORTANT: HTML SELECTORS

Crawlers use **placeholder selectors** that need updating:

```python
# CURRENT (placeholder):
venue_cards = soup.find_all('div', class_=re.compile(r'venue-card'))

# TODO: Inspect actual HTML and update
```

**Before full crawl**:
1. Visit VenueMonk.com
2. Right-click → Inspect venue card
3. Update selectors in `crawlers/venuemonk_crawler.py`
4. Test: `python main.py --crawl venuemonk --limit 1`

---

## 🔗 INTEGRATION WITH EVENTFOUNDRY

### Option A: Python API (Recommended)
```bash
# Install FastAPI
pip install fastapi uvicorn

# Create API wrapper
# venue-crawler/api.py (example provided in docs)

# Run API server
uvicorn api:app --port 8001

# Call from Next.js
fetch('http://localhost:8001/api/venues/search', {
  method: 'POST',
  body: JSON.stringify({ query: "Casino Hotel", filters: {} })
})
```

### Option B: Direct JSON
```bash
# Copy venue data
cp -r venue-crawler/data/venues/ src/data/venues/

# Load in TypeScript
import venueData from '@/data/venues/kochi_casino_hotel_001.json';
```

### Option C: TypeScript Port
Port Python search engine to TypeScript (future).

---

## 📈 EXPECTED RESULTS

After full crawl:
- **~170 venues** extracted
- **65% data quality** (needs manual enhancement)
- **Top 20 venues**: Manually enhance with complete details
- **Search**: Fuzzy matching working for all venues
- **Optimization**: 15+ items auto-populated per venue

---

## 💰 COST SAVINGS

| Item | Original Estimate | Actual |
|------|------------------|--------|
| Development | ₹1,10,000 | ₹0 (in-house) |
| Google Maps API | ₹10,000 | ₹10,000 |
| Manual Enhancement | ₹25,000 | ₹25,000 |
| **TOTAL** | **₹1,55,000** | **₹35,000** |

**Savings**: ₹1,20,000 (77%)

---

## ⏱️ TIMELINE

- ✅ **Infrastructure**: Complete (2 hours)
- ⏳ **HTML Selectors**: 2-3 hours
- ⏳ **Data Extraction**: 2-3 hours (run crawlers)
- ⏳ **Manual Enhancement**: 1 week (top 20 venues)
- ⏳ **Integration**: 3-5 hours (API or JSON)

**Total**: 2-3 weeks (on track with original estimate)

---

## 🎯 NEXT ACTIONS

### Immediate (Today):
1. `cd venue-crawler`
2. `pip install -r requirements.txt`
3. `python main.py --crawl venuemonk --limit 2`
4. Review extracted JSON in `data/venues/`

### This Week:
1. Update HTML selectors for all 3 sources
2. Run test crawl (--limit 10)
3. Validate data quality
4. Run full crawl (all sources)

### Next Week:
1. Manually enhance top 20 venues
2. Add Google Maps coordinates
3. Integrate with EventFoundry app
4. User testing with real searches

---

## 📞 SUPPORT

- **Full docs**: `venue-crawler/README.md`
- **Implementation details**: `VENUE_CRAWLER_IMPLEMENTATION_COMPLETE.md`
- **Logs**: `venue-crawler/logs/crawler.log`

---

## ✅ COMPLETION CHECKLIST

**Phase 1: Infrastructure** ✅
- [x] Python environment setup
- [x] Pydantic schema (15 categories)
- [x] Base crawler with rate limiting
- [x] 3 source-specific crawlers
- [x] Fuzzy search engine
- [x] Checklist auto-optimization
- [x] CLI orchestrator
- [x] Complete documentation

**Phase 2: Data Extraction** ⏳
- [ ] Update HTML selectors
- [ ] Test crawl (--limit 5)
- [ ] Full crawl (150+ venues)
- [ ] Data quality validation
- [ ] Manual enhancement (top 20)

**Phase 3: Integration** ⏳
- [ ] Choose integration method (API/JSON/TypeScript)
- [ ] Implement integration
- [ ] Connect to checklist page
- [ ] User acceptance testing
- [ ] Production deployment

---

**🔥 Ready to forge extraordinary events with comprehensive venue data! ⚒️**
