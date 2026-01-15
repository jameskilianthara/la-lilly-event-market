"""
EventFoundry Checklist Auto-Optimization
Auto-populate checklist items based on selected venue capabilities
"""

import json
from typing import Dict, List, Optional
from loguru import logger
from pathlib import Path


class ChecklistOptimizer:
    """
    Optimize event checklist based on venue selection

    Rules:
    1. Auto-populate items venue confirms (capacity, facilities)
    2. Remove items venue makes redundant (venue search, parking search if venue has parking)
    3. Add conditional items (hotel room blocks if venue has accommodation)
    """

    def __init__(self):
        self.optimization_rules = self._load_optimization_rules()

    def _load_optimization_rules(self) -> Dict:
        """Load optimization rules (can be from JSON config file)"""
        return {
            "auto_populate": {
                "venue_confirmed": {
                    "condition": lambda venue: True,  # Always true when venue selected
                    "value": lambda venue: venue['basic_info']['official_name']
                },
                "venue_capacity": {
                    "condition": lambda venue: len(venue.get('capacity', {}).get('event_spaces', [])) > 0,
                    "value": lambda venue: venue['capacity']['event_spaces'][0]['max_guests']
                },
                "venue_address": {
                    "condition": lambda venue: True,
                    "value": lambda venue: venue['location']['address']
                },
                "venue_contact": {
                    "condition": lambda venue: venue.get('contact', {}).get('phone_primary'),
                    "value": lambda venue: venue['contact']['phone_primary']
                },
                "ac_availability": {
                    "condition": lambda venue: venue.get('facilities', {}).get('ac_available'),
                    "value": lambda venue: "✓ Confirmed - Venue has AC"
                },
                "backup_power": {
                    "condition": lambda venue: venue.get('facilities', {}).get('backup_power'),
                    "value": lambda venue: "✓ Confirmed - Venue has backup power"
                },
                "sound_system": {
                    "condition": lambda venue: venue.get('facilities', {}).get('sound_system'),
                    "value": lambda venue: "✓ Venue provides sound system"
                },
                "projector_screen": {
                    "condition": lambda venue: venue.get('facilities', {}).get('projector_screen'),
                    "value": lambda venue: "✓ Venue provides projector/screen"
                },
                "parking_available": {
                    "condition": lambda venue: venue.get('capacity', {}).get('parking_capacity', 0) > 0,
                    "value": lambda venue: f"✓ Venue parking for {venue['capacity']['parking_capacity']} vehicles"
                },
                "catering_confirmed": {
                    "condition": lambda venue: venue.get('catering', {}).get('in_house_catering'),
                    "value": lambda venue: "✓ In-house catering available"
                },
                "menu_types_available": {
                    "condition": lambda venue: len(venue.get('catering', {}).get('in_house_menu_types', [])) > 0,
                    "value": lambda venue: ", ".join(venue['catering']['in_house_menu_types'])
                },
                "accommodation_available": {
                    "condition": lambda venue: venue.get('facilities', {}).get('accommodation_available'),
                    "value": lambda venue: f"✓ {venue['facilities']['accommodation_rooms']} rooms available"
                }
            },

            "conditional_removals": {
                "venue_search_required": {
                    "condition": lambda venue: True,  # Always remove when venue confirmed
                    "reason": "Venue already confirmed"
                },
                "venue_shortlisting": {
                    "condition": lambda venue: True,
                    "reason": "Venue selection complete"
                },
                "parking_arrangement": {
                    "condition": lambda venue: venue.get('capacity', {}).get('parking_capacity', 0) > 0,
                    "reason": "Venue has parking"
                },
                "external_caterer_search": {
                    "condition": lambda venue: (
                        venue.get('catering', {}).get('in_house_catering') and
                        not venue.get('catering', {}).get('outside_catering_allowed')
                    ),
                    "reason": "Venue requires in-house catering only"
                },
                "accommodation_search": {
                    "condition": lambda venue: (
                        venue.get('facilities', {}).get('accommodation_available') and
                        venue.get('facilities', {}).get('accommodation_rooms', 0) >= 20
                    ),
                    "reason": "Venue provides sufficient accommodation"
                }
            },

            "conditional_additions": {
                "external_caterer_coordination": {
                    "condition": lambda venue: (
                        not venue.get('catering', {}).get('in_house_catering') or
                        venue.get('catering', {}).get('outside_catering_allowed')
                    ),
                    "description": "Coordinate external caterer approval with venue",
                    "priority": "high"
                },
                "room_block_booking": {
                    "condition": lambda venue: venue.get('facilities', {}).get('accommodation_available'),
                    "description": "Book room blocks for guests",
                    "priority": "medium",
                    "details": lambda venue: f"{venue['facilities']['accommodation_rooms']} rooms available at venue"
                },
                "valet_parking_arrangement": {
                    "condition": lambda venue: venue.get('facilities', {}).get('parking_type') == 'valet',
                    "description": "Confirm valet parking service with venue",
                    "priority": "medium"
                },
                "kitchen_access_coordination": {
                    "condition": lambda venue: (
                        venue.get('catering', {}).get('kitchen_specifications') is not None and
                        venue.get('catering', {}).get('outside_catering_allowed')
                    ),
                    "description": "Coordinate kitchen access for external caterer",
                    "priority": "high"
                },
                "noise_curfew_planning": {
                    "condition": lambda venue: venue.get('timeline_logistics', {}).get('noise_curfew') is not None,
                    "description": "Plan event timeline around venue noise curfew",
                    "priority": "high",
                    "details": lambda venue: f"Curfew: {venue['timeline_logistics']['noise_curfew']}"
                },
                "decoration_restrictions_review": {
                    "condition": lambda venue: len(venue.get('timeline_logistics', {}).get('decoration_restrictions', [])) > 0,
                    "description": "Review venue decoration restrictions with decorator",
                    "priority": "high",
                    "details": lambda venue: "Restrictions: " + ", ".join(venue['timeline_logistics']['decoration_restrictions'])
                }
            }
        }

    def optimize_checklist(self, checklist_data: Dict, venue_data: Dict) -> Dict:
        """
        Optimize checklist based on venue selection

        Args:
            checklist_data: Original checklist JSON (from forge-blueprints)
            venue_data: Selected venue data from search

        Returns:
            Optimized checklist with auto-populated, removed, and added items
        """
        logger.info(f"Optimizing checklist for venue: {venue_data['basic_info']['official_name']}")

        optimized = {
            "original_checklist": checklist_data,
            "venue_id": venue_data['venue_id'],
            "venue_name": venue_data['basic_info']['official_name'],
            "sections": [],
            "auto_populated_count": 0,
            "removed_items_count": 0,
            "added_items_count": 0,
            "optimization_summary": []
        }

        # Process each section
        for section in checklist_data.get('sections', []):
            optimized_section = {
                "id": section['id'],
                "title": section['title'],
                "description": section.get('description', ''),
                "items": []
            }

            # Process each item
            for item in section.get('items', []):
                item_id = item['id']
                item_label = item['label']

                # Check for removal
                should_remove, removal_reason = self._check_removal(item_id, venue_data)
                if should_remove:
                    optimized['removed_items_count'] += 1
                    optimized['optimization_summary'].append({
                        "action": "removed",
                        "item": item_label,
                        "reason": removal_reason
                    })
                    continue  # Skip this item

                # Check for auto-population
                auto_value = self._get_auto_value(item_id, venue_data)
                if auto_value:
                    item['auto_populated'] = True
                    item['venue_value'] = auto_value
                    optimized['auto_populated_count'] += 1
                    optimized['optimization_summary'].append({
                        "action": "auto_populated",
                        "item": item_label,
                        "value": auto_value
                    })

                optimized_section['items'].append(item)

            optimized['sections'].append(optimized_section)

        # Add conditional items
        additional_items = self._get_additional_items(venue_data)
        if additional_items:
            # Add to "Venue Coordination" section or create new section
            venue_section = {
                "id": "venue_coordination",
                "title": "Venue-Specific Coordination",
                "description": "Additional tasks based on selected venue capabilities",
                "items": additional_items
            }
            optimized['sections'].append(venue_section)
            optimized['added_items_count'] = len(additional_items)

            for item in additional_items:
                optimized['optimization_summary'].append({
                    "action": "added",
                    "item": item['label'],
                    "reason": item.get('reason', 'Venue-specific requirement')
                })

        logger.success(
            f"✓ Optimized: {optimized['auto_populated_count']} auto-populated, "
            f"{optimized['removed_items_count']} removed, "
            f"{optimized['added_items_count']} added"
        )

        return optimized

    def _check_removal(self, item_id: str, venue_data: Dict) -> tuple[bool, Optional[str]]:
        """Check if item should be removed"""
        removals = self.optimization_rules['conditional_removals']

        if item_id in removals:
            rule = removals[item_id]
            if rule['condition'](venue_data):
                return True, rule['reason']

        return False, None

    def _get_auto_value(self, item_id: str, venue_data: Dict) -> Optional[str]:
        """Get auto-populated value for item"""
        auto_populate = self.optimization_rules['auto_populate']

        if item_id in auto_populate:
            rule = auto_populate[item_id]
            if rule['condition'](venue_data):
                return rule['value'](venue_data)

        return None

    def _get_additional_items(self, venue_data: Dict) -> List[Dict]:
        """Get additional items to add"""
        additions = self.optimization_rules['conditional_additions']
        items = []

        for item_id, rule in additions.items():
            if rule['condition'](venue_data):
                item = {
                    "id": item_id,
                    "label": rule['description'],
                    "priority": rule.get('priority', 'medium'),
                    "reason": f"Required based on venue: {venue_data['basic_info']['official_name']}"
                }

                # Add details if available
                if 'details' in rule and callable(rule['details']):
                    item['details'] = rule['details'](venue_data)

                items.append(item)

        return items

    def generate_optimization_report(self, optimized_checklist: Dict) -> str:
        """Generate human-readable optimization report"""
        report = []
        report.append("="*60)
        report.append("CHECKLIST OPTIMIZATION REPORT")
        report.append("="*60)
        report.append(f"\nVenue: {optimized_checklist['venue_name']}")
        report.append(f"Venue ID: {optimized_checklist['venue_id']}\n")

        report.append(f"Auto-Populated Items: {optimized_checklist['auto_populated_count']}")
        report.append(f"Removed Items: {optimized_checklist['removed_items_count']}")
        report.append(f"Added Items: {optimized_checklist['added_items_count']}\n")

        report.append("OPTIMIZATION DETAILS:")
        report.append("-"*60)

        for change in optimized_checklist['optimization_summary']:
            action = change['action'].upper()
            item = change['item']

            if action == "AUTO_POPULATED":
                report.append(f"\n✓ {action}: {item}")
                report.append(f"  Value: {change['value']}")
            elif action == "REMOVED":
                report.append(f"\n✗ {action}: {item}")
                report.append(f"  Reason: {change['reason']}")
            elif action == "ADDED":
                report.append(f"\n+ {action}: {item}")
                report.append(f"  Reason: {change['reason']}")

        report.append("\n" + "="*60)

        return "\n".join(report)


# ============================================
# EXAMPLE USAGE
# ============================================

if __name__ == "__main__":
    from loguru import logger
    import sys

    logger.remove()
    logger.add(sys.stderr, level="INFO")

    print("\n🔧 EventFoundry Checklist Optimizer - TEST\n")

    # Sample venue data
    sample_venue = {
        "venue_id": "kochi_casino_hotel_001",
        "basic_info": {
            "official_name": "Casino Hotel Kochi"
        },
        "location": {
            "address": "Willingdon Island, Kochi"
        },
        "contact": {
            "phone_primary": "+91-484-2668221"
        },
        "capacity": {
            "event_spaces": [{"max_guests": 500}],
            "parking_capacity": 100
        },
        "catering": {
            "in_house_catering": True,
            "in_house_menu_types": ["north_indian", "south_indian"],
            "outside_catering_allowed": False
        },
        "facilities": {
            "ac_available": True,
            "backup_power": True,
            "sound_system": True,
            "accommodation_available": True,
            "accommodation_rooms": 50,
            "parking_type": "valet"
        },
        "timeline_logistics": {
            "noise_curfew": "11:00 PM"
        }
    }

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
                    {"id": "venue_capacity", "label": "Confirm venue capacity"},
                    {"id": "parking_arrangement", "label": "Arrange parking facilities"}
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
    print(report)
