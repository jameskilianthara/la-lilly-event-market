"""
EventFoundry Venue Schema - Pydantic Models
Complete data validation for venue extraction
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, HttpUrl, validator
from datetime import datetime


class Coordinates(BaseModel):
    latitude: float
    longitude: float


class Accessibility(BaseModel):
    airport_distance_km: Optional[float] = None
    airport_drive_time: Optional[str] = None
    railway_station_distance_km: Optional[float] = None
    metro_access: bool = False
    landmarks_nearby: List[str] = []


class Location(BaseModel):
    address: str
    landmark: Optional[str] = None
    district: str
    city: str = "Kochi"
    state: str = "Kerala"
    pin_code: Optional[str] = None
    coordinates: Optional[Coordinates] = None
    accessibility: Optional[Accessibility] = None


class BookingManager(BaseModel):
    name: Optional[str] = None
    designation: Optional[str] = None
    contact: Optional[str] = None


class Contact(BaseModel):
    phone_primary: str
    phone_secondary: Optional[str] = None
    email: Optional[str] = None
    website: Optional[HttpUrl] = None
    whatsapp: Optional[str] = None
    booking_manager: Optional[BookingManager] = None


class SeatingStyles(BaseModel):
    theater: Optional[int] = None
    classroom: Optional[int] = None
    banquet: Optional[int] = None
    cocktail: Optional[int] = None
    u_shape: Optional[int] = None
    boardroom: Optional[int] = None


class EventSpace(BaseModel):
    space_name: str
    min_guests: int
    max_guests: int
    optimal_guests: Optional[int] = None
    space_type: str  # indoor, outdoor, semi_outdoor, rooftop
    ceiling_height_ft: Optional[int] = None
    area_sqft: Optional[int] = None
    seating_styles: Optional[SeatingStyles] = None
    has_stage: bool = False
    has_dance_floor: bool = False
    natural_lighting: bool = False


class Capacity(BaseModel):
    event_spaces: List[EventSpace]
    total_rooms: Optional[int] = None
    parking_capacity: Optional[int] = None


class CateringOptions(BaseModel):
    in_house_catering: bool
    in_house_menu_types: List[str] = []  # north_indian, south_indian, continental, etc.
    outside_catering_allowed: bool = False
    kitchen_specifications: Optional[Dict[str, Any]] = None
    bar_service_available: bool = False
    alcohol_policy: Optional[str] = None


class Facilities(BaseModel):
    ac_available: bool = True
    backup_power: bool = False
    wifi_available: bool = False
    projector_screen: bool = False
    sound_system: bool = False
    lighting_setup: bool = False
    green_rooms: int = 0
    wheelchair_accessible: bool = False
    parking_type: Optional[str] = None  # valet, self, both
    accommodation_available: bool = False
    accommodation_rooms: int = 0


class TimelineLogistics(BaseModel):
    setup_time_hours: Optional[int] = None
    teardown_time_hours: Optional[int] = None
    booking_window_days: int = 90
    min_advance_booking_days: int = 30
    cancellation_policy: Optional[str] = None
    decoration_restrictions: List[str] = []
    noise_curfew: Optional[str] = None


class VenuePackage(BaseModel):
    package_name: str
    guest_count: int
    price_range_min: int
    price_range_max: int
    inclusions: List[str]
    duration_hours: int


class Pricing(BaseModel):
    base_venue_charge: Optional[Dict[str, int]] = None  # {weekday: X, weekend: Y}
    per_plate_cost_min: Optional[int] = None
    per_plate_cost_max: Optional[int] = None
    packages: List[VenuePackage] = []
    security_deposit: Optional[int] = None
    taxes_included: bool = False
    payment_terms: Optional[str] = None


class BasicInfo(BaseModel):
    official_name: str
    brand_name: Optional[str] = None
    aliases: List[str] = []
    venue_type: str  # hotel_banquet, standalone_hall, resort, outdoor_garden, etc.
    star_rating: Optional[int] = Field(None, ge=1, le=5)
    established_year: Optional[int] = None
    google_rating: Optional[float] = Field(None, ge=0, le=5)
    total_reviews: int = 0


class EventTypesHosted(BaseModel):
    weddings: bool = True
    corporate_events: bool = False
    conferences: bool = False
    exhibitions: bool = False
    birthday_parties: bool = False
    anniversaries: bool = False
    engagement_ceremonies: bool = False
    religious_ceremonies: bool = False
    photo_shoots: bool = False


class VendorRelationship(BaseModel):
    vendor_type: str  # caterer, decorator, photographer, etc.
    vendor_name: str
    partnership_type: str  # exclusive, preferred, allowed
    commission_available: bool = False


class VendorRelationships(BaseModel):
    preferred_vendors: List[VendorRelationship] = []
    outside_vendors_policy: str = "allowed_with_approval"


class ReviewSnapshot(BaseModel):
    source: str  # google, weddingwire, facebook
    rating: float
    total_reviews: int
    positive_highlights: List[str] = []
    negative_highlights: List[str] = []


class ReviewsReputation(BaseModel):
    overall_rating: float = 0.0
    total_reviews_aggregated: int = 0
    review_snapshots: List[ReviewSnapshot] = []
    awards_certifications: List[str] = []
    featured_events: List[str] = []


class ChecklistAutomation(BaseModel):
    auto_populate_items: List[str] = []
    conditional_removals: List[str] = []
    conditional_additions: List[str] = []


class SearchKeywords(BaseModel):
    primary_keywords: List[str]
    secondary_keywords: List[str] = []
    location_keywords: List[str] = []


class Venue(BaseModel):
    """Complete EventFoundry Venue Model"""

    venue_id: str
    basic_info: BasicInfo
    location: Location
    contact: Contact
    capacity: Capacity
    catering: CateringOptions
    facilities: Facilities
    timeline_logistics: TimelineLogistics
    pricing: Pricing
    event_types_hosted: EventTypesHosted
    vendor_relationships: Optional[VendorRelationships] = None
    reviews_reputation: Optional[ReviewsReputation] = None
    checklist_automation: Optional[ChecklistAutomation] = None
    search_keywords: SearchKeywords

    # Metadata
    data_source: str
    last_updated: datetime = Field(default_factory=datetime.now)
    data_quality_score: float = Field(default=0.0, ge=0, le=100)
    manual_verification_required: bool = False

    class Config:
        json_schema_extra = {
            "example": {
                "venue_id": "kochi_casino_hotel_001",
                "basic_info": {
                    "official_name": "Casino Hotel Kochi",
                    "aliases": ["Casino Hotel", "Casino Kochi"],
                    "venue_type": "hotel_banquet",
                    "star_rating": 4
                }
            }
        }
