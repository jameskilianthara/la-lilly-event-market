# 🏨 KOCHI VENUE DATABASE - COMPLETE IMPLEMENTATION PLAN

**Mission:** Build comprehensive Kochi venue database optimized for EventFoundry checklist integration

**Status:** ⏸️ AWAITING APPROVAL TO START

---

## 🎯 STRATEGIC OBJECTIVES

### **Primary Goals:**
1. **Keyword Search:** Client types "Casino Hotel" → System finds exact match + variations
2. **Checklist Auto-Optimization:** Venue selected → 15+ checklist items auto-populated
3. **Smart Recommendations:** "Need venue for 300 guests, indoor, full kitchen" → Top 5 matches
4. **Vendor Integration:** Venue confirmed → Match caterers who work with that venue

### **Business Impact:**
- ✅ **Reduce client effort:** 10 minutes → 2 minutes for venue selection
- ✅ **Increase accuracy:** Auto-populated venue data = fewer errors
- ✅ **Better vendor matches:** Caterers see venue kitchen specs immediately
- ✅ **Professional positioning:** "EventFoundry knows every venue in Kochi"

---

## 📋 VENUE DATA SCHEMA

### **Complete JSON Structure:**

```json
{
  "venue_id": "kochi_casino_hotel_001",
  "basic_info": {
    "official_name": "Casino Hotel Kochi",
    "brand_name": "Casino Group",
    "aliases": [
      "Casino Hotel",
      "Casino Kochi",
      "The Casino Willingdon Island",
      "Casino Hotel Willingdon"
    ],
    "venue_type": "hotel_banquet",
    "star_rating": 4,
    "established_year": 1970,
    "google_rating": 4.3,
    "total_reviews": 1250
  },

  "location": {
    "address": "Willingdon Island, Kochi, Kerala 682003",
    "landmark": "Near Cochin Port Trust",
    "district": "Ernakulam",
    "city": "Kochi",
    "state": "Kerala",
    "pin_code": "682003",
    "coordinates": {
      "latitude": 9.9674,
      "longitude": 76.2634
    },
    "accessibility": {
      "airport_distance_km": 28,
      "airport_drive_time": "45-60 min",
      "railway_station_distance_km": 4,
      "metro_access": false,
      "landmarks_nearby": ["Cochin Port", "Bolgatty Palace", "Marine Drive"]
    }
  },

  "contact": {
    "phone_primary": "+91-484-2668221",
    "phone_secondary": "+91-484-2668001",
    "email": "events@casinohotel.in",
    "website": "https://www.casinohotel.in",
    "whatsapp": "+91-9876543210",
    "booking_manager": {
      "name": "Rajesh Kumar",
      "designation": "Banquet Sales Manager",
      "contact": "+91-9876543210"
    }
  },

  "capacity": {
    "event_spaces": [
      {
        "space_name": "Grand Ballroom",
        "min_guests": 200,
        "max_guests": 500,
        "optimal_guests": 350,
        "space_type": "indoor",
        "ceiling_height_ft": 18,
        "area_sqft": 6000,
        "seating_styles": {
          "theater": 500,
          "classroom": 300,
          "banquet": 350,
          "cocktail": 600
        }
      },
      {
        "space_name": "Royal Hall",
        "min_guests": 50,
        "max_guests": 150,
        "optimal_guests": 100,
        "space_type": "indoor",
        "ceiling_height_ft": 12,
        "area_sqft": 2000
      },
      {
        "space_name": "Terrace Garden",
        "min_guests": 100,
        "max_guests": 300,
        "optimal_guests": 200,
        "space_type": "outdoor",
        "weather_backup": "Grand Ballroom available"
      }
    ],
    "total_capacity_range": {
      "min": 50,
      "max": 500,
      "recommended_range": "100-400"
    }
  },

  "catering": {
    "has_inhouse_kitchen": true,
    "kitchen_type": "full_commercial",
    "cuisine_specialties": ["Kerala", "Indian", "Continental", "Chinese"],
    "catering_policy": {
      "external_allowed": true,
      "external_restrictions": "Approved caterers only",
      "approved_caterers": [
        "Kerala Events Caterers",
        "Spice Kitchen Kochi",
        "Royal Caterers"
      ],
      "kitchen_rental_fee": "₹25,000 if external caterer",
      "minimum_food_spend": "₹1,500 per person"
    },
    "dietary_options": {
      "vegetarian_kitchen": true,
      "jain_food": true,
      "halal": true,
      "kosher": false,
      "vegan_options": true
    },
    "bar_license": {
      "has_bar": true,
      "alcohol_policy": "In-house only, no external alcohol",
      "bar_packages": ["₹500/person", "₹800/person premium"]
    },
    "service_style": ["buffet", "plated", "family_style", "cocktail"],
    "meal_times": {
      "breakfast": "7:00 AM - 11:00 AM",
      "lunch": "12:00 PM - 4:00 PM",
      "dinner": "7:00 PM - 11:00 PM"
    }
  },

  "facilities": {
    "event_amenities": {
      "stage": {
        "available": true,
        "dimensions": "20ft x 15ft",
        "built_in": true,
        "modular": false
      },
      "av_equipment": {
        "projector": true,
        "screens": 2,
        "sound_system": "Bose premium",
        "microphones": "4 wireless + 2 wired",
        "lighting": "LED stage lights + ambient"
      },
      "air_conditioning": true,
      "generator_backup": true,
      "wifi": {
        "available": true,
        "speed_mbps": 100,
        "guest_access": true
      },
      "green_room": {
        "available": true,
        "count": 2,
        "ac": true
      },
      "restrooms": {
        "male": 4,
        "female": 4,
        "wheelchair_accessible": 2
      }
    },

    "parking": {
      "available": true,
      "capacity_cars": 150,
      "capacity_buses": 5,
      "valet_service": true,
      "valet_cost": "₹100 per vehicle",
      "covered_parking": 50
    },

    "accommodation": {
      "hotel_rooms": 78,
      "room_types": ["Standard", "Deluxe", "Suite"],
      "room_block_discount": "20% for 10+ rooms",
      "guest_rates": {
        "standard": "₹4,500",
        "deluxe": "₹6,000",
        "suite": "₹10,000"
      },
      "complimentary_rooms": "1 complimentary per 20 paid rooms",
      "bridal_suite": {
        "available": true,
        "rate": "₹15,000",
        "complimentary_if": "100+ guests"
      }
    },

    "vendor_facilities": {
      "loading_dock": true,
      "service_elevator": true,
      "storage_room": true,
      "vendor_meal_area": true,
      "setup_restrictions": "No nails/drilling on walls",
      "decor_deposit": "₹10,000 refundable"
    }
  },

  "timeline_logistics": {
    "booking": {
      "advance_booking_required": "6-12 months for weddings",
      "minimum_notice": "2 weeks",
      "peak_season": "December-February, May-June",
      "blackout_dates": ["December 31", "Major festivals"]
    },
    "setup_access": {
      "setup_time_allowed": "2 days before event",
      "early_access_fee": "₹5,000 per additional day",
      "setup_hours": "9:00 AM - 6:00 PM",
      "decoration_restrictions": "No open flame, no confetti"
    },
    "event_timing": {
      "start_time_earliest": "10:00 AM",
      "end_time_latest": "11:00 PM",
      "extension_fee": "₹10,000 per hour after 11 PM",
      "noise_curfew": "11:00 PM"
    },
    "breakdown": {
      "cleanup_deadline": "Next morning 10:00 AM",
      "vendor_removal": "Within 24 hours",
      "damage_deposit": "₹25,000"
    }
  },

  "pricing": {
    "venue_rental": {
      "weekday": "₹75,000",
      "weekend": "₹1,25,000",
      "peak_season_surcharge": "20%",
      "off_season_discount": "15%"
    },
    "package_pricing": {
      "basic_package": {
        "cost_per_person": "₹1,800",
        "includes": ["Venue", "Basic decor", "Chairs/tables", "Basic AV"]
      },
      "premium_package": {
        "cost_per_person": "₹3,500",
        "includes": ["Venue", "Premium decor", "Full AV", "Stage", "Green room"]
      }
    },
    "payment_terms": {
      "booking_deposit": "25% at booking",
      "advance_payment": "50% 30 days before",
      "final_payment": "100% 7 days before event",
      "cancellation_policy": {
        "60_days_plus": "75% refund",
        "30_60_days": "50% refund",
        "under_30_days": "No refund"
      }
    },
    "taxes": {
      "gst": "18%",
      "service_charge": "10%",
      "inclusive_exclusive": "Prices exclusive of taxes"
    }
  },

  "event_types_hosted": {
    "weddings": {
      "experience": "500+ weddings hosted",
      "specialties": ["South Indian", "North Indian", "Christian", "Muslim"],
      "wedding_packages": true,
      "mehendi_sangeet_space": true
    },
    "corporate": {
      "experience": "200+ corporate events",
      "specialties": ["Conferences", "Product launches", "Team building"],
      "corporate_packages": true,
      "breakout_rooms": 3
    },
    "social": {
      "birthdays": true,
      "anniversaries": true,
      "receptions": true,
      "reunions": true
    }
  },

  "vendor_relationships": {
    "preferred_vendors": {
      "decorators": ["Kochi Decor Masters", "Event Styling Co"],
      "photographers": ["Kochi Wedding Shots", "Moments Photography"],
      "entertainers": ["DJ Rajesh", "Kochi Events Entertainment"],
      "florists": ["Blooms & Petals", "Rose Garden Florist"]
    },
    "vendor_commissions": {
      "policy": "Venue receives 10% from preferred vendors",
      "external_vendors_allowed": true,
      "coordination_fee": "₹15,000 for external vendors"
    }
  },

  "reviews_reputation": {
    "google_rating": 4.3,
    "google_reviews": 1250,
    "weddingwire_rating": 4.5,
    "venuelook_rating": 4.4,
    "key_strengths": [
      "Professional staff",
      "Prime location",
      "Excellent food quality",
      "Smooth coordination"
    ],
    "common_complaints": [
      "Parking can be tight for 400+ guests",
      "Premium pricing",
      "Limited outdoor space"
    ],
    "notable_events": [
      "Kerala Tourism Expo 2023",
      "Multiple celebrity weddings",
      "Corporate launches for major brands"
    ]
  },

  "checklist_automation": {
    "auto_populate_items": {
      "venue_section": {
        "venue_confirmed": true,
        "venue_name": "Casino Hotel Kochi",
        "venue_capacity": "50-500 guests",
        "indoor_outdoor": "Both available",
        "ac_available": true,
        "parking_confirmed": "150 cars + valet"
      },
      "catering_section": {
        "kitchen_available": true,
        "external_catering_allowed": "Yes (approved list)",
        "dietary_restrictions_supported": "All major diets",
        "bar_available": true,
        "alcohol_policy": "In-house only"
      },
      "technical_section": {
        "stage_available": "20x15 ft built-in",
        "av_equipment": "Full setup included",
        "sound_system": "Bose premium",
        "lighting": "LED stage + ambient",
        "power_backup": "Generator available"
      },
      "logistics_section": {
        "loading_dock": true,
        "service_elevator": true,
        "vendor_access": "2 days advance",
        "setup_time": "9 AM - 6 PM",
        "cleanup_deadline": "Next day 10 AM"
      },
      "accommodation_section": {
        "guest_rooms": "78 rooms available",
        "room_block_discount": "20% for 10+ rooms",
        "bridal_suite": "Available (₹15K or free 100+ guests)"
      }
    },

    "remove_items": [
      "venue_search_required",
      "venue_shortlisting",
      "venue_site_visits"
    ],

    "add_conditional_items": [
      {
        "item": "Confirm room block requirements",
        "condition": "guest_count > 100 && out_of_town_guests",
        "category": "accommodation"
      },
      {
        "item": "Book additional parking if needed",
        "condition": "guest_count > 300",
        "category": "logistics"
      },
      {
        "item": "Arrange external alcohol if preferred brands",
        "condition": "bar_required && specific_brands",
        "category": "catering",
        "note": "Venue policy: In-house bar only, discuss with management"
      }
    ],

    "vendor_matching_hints": {
      "caterers": {
        "preferred": ["Kerala Events Caterers", "Spice Kitchen Kochi"],
        "note": "Venue kitchen available, external allowed with ₹25K fee"
      },
      "decorators": {
        "preferred": ["Kochi Decor Masters", "Event Styling Co"],
        "restrictions": "No nails/drilling, ₹10K damage deposit"
      },
      "photographers": {
        "preferred": ["Kochi Wedding Shots", "Moments Photography"],
        "note": "Multiple indoor/outdoor spaces for photos"
      }
    }
  },

  "search_keywords": {
    "primary_keywords": [
      "casino hotel",
      "casino kochi",
      "willingdon island venue",
      "kochi luxury hotel wedding"
    ],
    "secondary_keywords": [
      "500 guests kochi",
      "ballroom kochi",
      "hotel wedding venue ernakulam",
      "full kitchen event venue"
    ],
    "location_keywords": [
      "willingdon island",
      "kochi port area",
      "marine drive nearby",
      "bolgatty area"
    ],
    "feature_keywords": [
      "outdoor terrace kochi",
      "ac banquet hall",
      "hotel with rooms",
      "valet parking venue"
    ]
  },

  "data_quality": {
    "last_updated": "2026-01-02",
    "data_sources": [
      "Official website",
      "Google Business",
      "VenueMonk listing",
      "Direct venue contact",
      "Client reviews"
    ],
    "verification_status": "verified",
    "completeness_score": 95,
    "photo_count": 45,
    "video_tour_available": true
  }
}
```

---

## 🕷️ CRAWLING IMPLEMENTATION

### **Phase 1: Source Identification (Day 1)**

#### **Target Websites:**

**Tier 1 - Structured Venue Directories:**
```python
sources_tier1 = {
    "venuemonk": {
        "url": "https://www.venuemonk.com/kochi",
        "data_quality": "High",
        "fields_available": ["name", "capacity", "pricing", "amenities", "photos"],
        "scraping_method": "BeautifulSoup",
        "estimated_venues": 150
    },
    "weddingvenues": {
        "url": "https://www.weddingvenues.in/kerala",
        "data_quality": "Medium",
        "fields_available": ["name", "type", "capacity", "contact"],
        "scraping_method": "Playwright (JS-heavy)",
        "estimated_venues": 80
    },
    "venuelook": {
        "url": "https://www.venuelook.com/venues/kochi",
        "data_quality": "High",
        "fields_available": ["full details", "pricing", "packages"],
        "scraping_method": "Scrapy",
        "estimated_venues": 120
    }
}
```

**Tier 2 - Hotel/Venue Direct Websites:**
```python
luxury_hotels = [
    "https://www.tajhotels.com/en-in/taj-malabar-kochi/",
    "https://www.hyatt.com/en-US/hotel/india/grand-hyatt-kochi/cokgh",
    "https://www.marriott.com/en-us/hotels/cokjw-jw-marriott-kochi",
    "https://www.lemeridien.com/hotels/travel/cokmd-le-meridien-kochi/"
]

mid_range_hotels = [
    "https://www.casinohotel.in",
    "https://www.ihg.com/crowneplaza/hotels/kochi",
    "https://www.holidayinn.com/hotels/kochi"
]

# Scrape: Banquets/Events pages for facility details
```

**Tier 3 - Google Business & Reviews:**
```python
google_business = {
    "method": "Google Places API",
    "fields": ["name", "rating", "reviews", "amenities", "photos"],
    "cost": "$200 for 40,000 queries (enough for 200 venues x 200 fields)"
}
```

---

## 🛠️ CRAWLING SCRIPT STRUCTURE

### **Main Crawler (`kochi_venue_crawler.py`):**

```python
import requests
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
import json
import time
from fuzzywuzzy import fuzz
import pandas as pd

class KochiVenueCrawler:
    def __init__(self):
        self.venues = []
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }

    def crawl_venuemonk(self):
        """Scrape VenueMonk Kochi listings"""
        url = "https://www.venuemonk.com/kochi"
        response = requests.get(url, headers=self.headers)
        soup = BeautifulSoup(response.content, 'html.parser')

        # Extract venue cards
        venue_cards = soup.find_all('div', class_='venue-card')

        for card in venue_cards:
            venue = {
                'source': 'venuemonk',
                'name': card.find('h3', class_='venue-name').text.strip(),
                'location': card.find('span', class_='location').text.strip(),
                'capacity': self.extract_capacity(card),
                'pricing': self.extract_pricing(card),
                'rating': card.find('span', class_='rating').text.strip(),
                'image_url': card.find('img')['src']
            }
            self.venues.append(venue)

        return self.venues

    def crawl_hotel_website(self, hotel_url):
        """Scrape individual hotel event pages"""
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()
            page.goto(hotel_url)

            # Look for banquet/events page
            events_link = page.locator("a:has-text('Events')").first
            if events_link:
                events_link.click()
                page.wait_for_load_state('networkidle')

                # Extract facility details
                content = page.content()
                soup = BeautifulSoup(content, 'html.parser')

                # Extract structured data
                venue_data = self.extract_hotel_facilities(soup)

            browser.close()
            return venue_data

    def generate_aliases(self, official_name):
        """Generate search aliases for venue name"""
        aliases = [official_name]

        # Remove common prefixes/suffixes
        variations = [
            official_name.replace('Hotel', '').strip(),
            official_name.replace('The', '').strip(),
            official_name.replace('Kochi', '').strip(),
            official_name.split()[0],  # First word
            ' '.join(official_name.split()[:2])  # First two words
        ]

        aliases.extend([v for v in variations if v and v != official_name])
        return list(set(aliases))

    def deduplicate_venues(self):
        """Merge duplicate venue entries from different sources"""
        # Use fuzzy matching to find duplicates
        # Keep entry with most complete data
        pass

    def export_database(self, filename='kochi_venues.json'):
        """Export to JSON with search optimization"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(self.venues, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    crawler = KochiVenueCrawler()
    crawler.crawl_venuemonk()
    crawler.crawl_weddingvenues()
    # ... crawl other sources
    crawler.deduplicate_venues()
    crawler.export_database()
```

---

## 🔍 SEARCH ENGINE IMPLEMENTATION

### **Keyword Matching Algorithm (`venue_search.py`):**

```python
from fuzzywuzzy import fuzz, process
import json

class VenueSearchEngine:
    def __init__(self, database_path='kochi_venues.json'):
        with open(database_path, 'r') as f:
            self.venues = json.load(f)

        # Build search index
        self.search_index = self.build_index()

    def build_index(self):
        """Create searchable index with aliases"""
        index = {}
        for venue in self.venues:
            # Index by official name and all aliases
            for alias in venue.get('search_keywords', {}).get('primary_keywords', []):
                index[alias.lower()] = venue['venue_id']
        return index

    def search(self, query, filters=None):
        """
        Search venues by keyword with optional filters

        Args:
            query (str): Search query (e.g., "casino hotel")
            filters (dict): Optional filters {
                'min_capacity': 200,
                'max_capacity': 500,
                'venue_type': 'hotel',
                'has_kitchen': True,
                'indoor_outdoor': 'indoor'
            }
        """
        # Fuzzy match against all venue names and aliases
        results = []

        for venue in self.venues:
            # Calculate match score
            name_score = fuzz.partial_ratio(
                query.lower(),
                venue['basic_info']['official_name'].lower()
            )

            alias_scores = [
                fuzz.partial_ratio(query.lower(), alias.lower())
                for alias in venue['basic_info']['aliases']
            ]

            best_score = max([name_score] + alias_scores)

            # Apply filters
            if filters and not self.matches_filters(venue, filters):
                continue

            if best_score > 60:  # Threshold
                results.append({
                    'venue': venue,
                    'match_score': best_score
                })

        # Sort by match score
        results.sort(key=lambda x: x['match_score'], reverse=True)
        return results

    def matches_filters(self, venue, filters):
        """Check if venue matches filter criteria"""
        capacity = venue['capacity']['total_capacity_range']

        if 'min_capacity' in filters:
            if capacity['max'] < filters['min_capacity']:
                return False

        if 'max_capacity' in filters:
            if capacity['min'] > filters['max_capacity']:
                return False

        if 'has_kitchen' in filters:
            if venue['catering']['has_inhouse_kitchen'] != filters['has_kitchen']:
                return False

        # ... more filter checks

        return True
```

---

## 🔗 CHECKLIST INTEGRATION

### **Auto-Optimization Logic (`checklist_optimizer.py`):**

```python
def optimize_checklist_for_venue(checklist_data, venue_data):
    """
    Auto-populate checklist items based on selected venue

    Args:
        checklist_data: Current checklist state
        venue_data: Selected venue information

    Returns:
        optimized_checklist: Updated checklist with auto-populated items
    """

    optimized = checklist_data.copy()
    auto_fill = venue_data['checklist_automation']['auto_populate_items']

    # Auto-populate venue section
    optimized['venue_section'] = {
        **optimized.get('venue_section', {}),
        **auto_fill['venue_section']
    }

    # Auto-populate catering based on venue kitchen
    if auto_fill['catering_section']['kitchen_available']:
        optimized['catering_section']['kitchen_confirmed'] = True
        optimized['catering_section']['kitchen_type'] = 'Full commercial kitchen'

        if auto_fill['catering_section']['external_catering_allowed']:
            optimized['catering_section']['note'] = (
                f"External catering allowed. "
                f"Preferred: {', '.join(venue_data['vendor_relationships']['preferred_vendors']['caterers'])}"
            )

    # Remove irrelevant items
    for remove_item in venue_data['checklist_automation']['remove_items']:
        if remove_item in optimized:
            del optimized[remove_item]

    # Add conditional items
    for conditional in venue_data['checklist_automation']['add_conditional_items']:
        if evaluate_condition(conditional['condition'], checklist_data):
            optimized[conditional['item']] = {
                'added_by': 'venue_automation',
                'note': conditional.get('note', '')
            }

    return optimized
```

---

## 📅 IMPLEMENTATION TIMELINE

### **Week 1: Data Collection**
- **Day 1-2:** Set up crawling infrastructure
- **Day 3-5:** Scrape Tier 1 sources (VenueMonk, WeddingVenues, Venuelook)
- **Day 6-7:** Scrape Tier 2 sources (Hotel websites)

**Deliverable:** `raw_venues_data.json` (150+ venues)

### **Week 2: Data Processing**
- **Day 1-2:** Clean and structure data
- **Day 3-4:** Generate aliases and search keywords
- **Day 5-6:** Create checklist automation rules
- **Day 7:** Build search engine

**Deliverable:** `kochi_venues.json` (structured database)

### **Week 3: Integration**
- **Day 1-3:** Integrate search into checklist page
- **Day 4-5:** Build auto-optimization logic
- **Day 6-7:** Testing and refinement

**Deliverable:** Working venue search + auto-optimization

---

## 💰 COST ESTIMATE

### **Development:**
- Crawling scripts: 20 hours @ ₹2,000/hr = ₹40,000
- Data processing: 15 hours @ ₹2,000/hr = ₹30,000
- Integration: 20 hours @ ₹2,000/hr = ₹40,000
**Total Dev:** ₹1,10,000

### **Services:**
- Google Places API: $200 (₹16,000)
- Proxy service (if needed): $50 (₹4,000)
**Total Services:** ₹20,000

### **Manual Data Entry:**
- Detailed data for top 50 venues: 50 hrs @ ₹500/hr = ₹25,000

**GRAND TOTAL:** ₹1,55,000

### **ROI Calculation:**
- Saves 10 min per client on venue selection
- 100 clients/month = 1,000 minutes saved
- Better venue matches = 5% increase in completion rate
- **Value:** Priceless competitive advantage

---

## ✅ SUCCESS CRITERIA

### **Quantitative:**
- ✅ 150+ venues in database
- ✅ 50+ venues with complete facility data
- ✅ 90%+ accuracy on keyword search
- ✅ <1 second search response time

### **Qualitative:**
- ✅ Client: "This saved me so much time!"
- ✅ Vendor: "Finally, clients know if venue has kitchen"
- ✅ Competitive: "No other platform does this"

---

## 🚀 NEXT STEPS

### **Option 1: Build In-House**
- Hire Python developer or use existing team
- 3 weeks timeline
- Full control over data quality

### **Option 2: Outsource Crawling**
- Hire freelance scraper on Upwork
- 1-2 weeks timeline
- Focus on integration yourself

### **Option 3: Manual First, Automate Later**
- Manually enter top 20 venues this week
- Build search/auto-optimization
- Crawl remaining venues in parallel

---

## ⏸️ AWAITING YOUR DECISION

I'm ready to start implementation once you approve:

1. Which option? (Build in-house / Outsource / Manual-first)
2. Budget approval? (₹1.5L total)
3. Priority level? (Start now / After Phase 1 fixes / Later)

**This is a game-changing feature.** Let me know how you want to proceed!
