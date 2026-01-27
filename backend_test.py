#!/usr/bin/env python3
"""
Backend API Test for Founder Note - Tag and Folder Persistence
Tests the tag and folder functionality as requested in the review.
"""

import requests
import json
import uuid
import time
from typing import Dict, Any, List

# Configuration
BASE_URL = "https://remy-notes.preview.emergentagent.com/api"
TEST_USER_ID = "test-user-backend-123"

class FounderNoteAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.user_id = TEST_USER_ID
        self.created_notes = []  # Track created notes for cleanup
        
    def log(self, message: str, level: str = "INFO"):
        """Log test messages with timestamp"""
        timestamp = time.strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def make_request(self, method: str, endpoint: str, data: Dict = None, params: Dict = None) -> Dict:
        """Make HTTP request and return response"""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, params=params, timeout=30)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, timeout=30)
            elif method.upper() == "PUT":
                response = requests.put(url, json=data, timeout=30)
            elif method.upper() == "DELETE":
                response = requests.delete(url, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            self.log(f"{method} {url} -> {response.status_code}")
            
            if response.status_code >= 400:
                self.log(f"Error response: {response.text}", "ERROR")
                
            return {
                "status_code": response.status_code,
                "data": response.json() if response.content else {},
                "success": 200 <= response.status_code < 300
            }
            
        except requests.exceptions.RequestException as e:
            self.log(f"Request failed: {str(e)}", "ERROR")
            return {
                "status_code": 0,
                "data": {"error": str(e)},
                "success": False
            }
        except json.JSONDecodeError as e:
            self.log(f"JSON decode error: {str(e)}", "ERROR")
            return {
                "status_code": response.status_code,
                "data": {"error": "Invalid JSON response"},
                "success": False
            }
    
    def test_health_check(self) -> bool:
        """Test API health check"""
        self.log("Testing API health check...")
        
        response = self.make_request("GET", "health")
        
        if response["success"] and response["data"].get("status") == "ok":
            self.log("✅ Health check passed")
            return True
        else:
            self.log("❌ Health check failed", "ERROR")
            return False
    
    def create_test_note(self, title: str, transcription: str) -> str:
        """Create a test note and return its ID"""
        self.log(f"Creating test note: {title}")
        
        note_data = {
            "userId": self.user_id,
            "title": title,
            "transcription": transcription,
            "summary": f"Test summary for {title}",
            "keyPoints": [f"Key point 1 for {title}", f"Key point 2 for {title}"],
            "actionItems": [],
            "tags": [],
            "audioUrl": None,
            "smartifiedText": f"Smartified version of {transcription}"
        }
        
        response = self.make_request("POST", "notes", note_data)
        
        if response["success"] and response["data"].get("success"):
            note_id = response["data"]["note"]["id"]
            self.created_notes.append(note_id)
            self.log(f"✅ Created note with ID: {note_id}")
            return note_id
        else:
            self.log(f"❌ Failed to create note: {response['data']}", "ERROR")
            return None
    
    def test_tag_persistence(self) -> bool:
        """Test Scenario 1: Create note, add tags, verify persistence"""
        self.log("\n=== Testing Tag Persistence ===")
        
        # Step 1: Create a note
        note_id = self.create_test_note(
            "Tag Test Note", 
            "This is a test note for tag functionality. It contains important ideas and meeting notes."
        )
        
        if not note_id:
            return False
        
        # Step 2: Update note with tags
        self.log("Adding tags to note...")
        tags_to_add = ["important", "idea"]
        
        update_response = self.make_request("PUT", f"notes/{note_id}", {
            "tags": tags_to_add
        })
        
        if not update_response["success"]:
            self.log(f"❌ Failed to update note with tags: {update_response['data']}", "ERROR")
            return False
        
        # Step 3: Fetch note and verify tags
        self.log("Fetching note to verify tags...")
        fetch_response = self.make_request("GET", f"notes/{note_id}")
        
        if not fetch_response["success"]:
            self.log(f"❌ Failed to fetch note: {fetch_response['data']}", "ERROR")
            return False
        
        note_data = fetch_response["data"]["note"]
        stored_tags = note_data.get("tags", [])
        
        # Verify tags match exactly
        if set(stored_tags) == set(tags_to_add):
            self.log(f"✅ Tags persisted correctly: {stored_tags}")
            return True
        else:
            self.log(f"❌ Tag mismatch. Expected: {tags_to_add}, Got: {stored_tags}", "ERROR")
            return False
    
    def test_folder_persistence(self) -> bool:
        """Test Scenario 2: Create note, add folder, verify persistence"""
        self.log("\n=== Testing Folder Persistence ===")
        
        # Step 1: Create a note
        note_id = self.create_test_note(
            "Folder Test Note", 
            "This is a test note for folder functionality. It should be organized in the Projects folder."
        )
        
        if not note_id:
            return False
        
        # Step 2: Update note with folder
        self.log("Adding folder to note...")
        folder_name = "Projects"
        
        update_response = self.make_request("PUT", f"notes/{note_id}", {
            "folder": folder_name
        })
        
        if not update_response["success"]:
            self.log(f"❌ Failed to update note with folder: {update_response['data']}", "ERROR")
            return False
        
        # Step 3: Fetch note and verify folder
        self.log("Fetching note to verify folder...")
        fetch_response = self.make_request("GET", f"notes/{note_id}")
        
        if not fetch_response["success"]:
            self.log(f"❌ Failed to fetch note: {fetch_response['data']}", "ERROR")
            return False
        
        note_data = fetch_response["data"]["note"]
        stored_folder = note_data.get("folder")
        
        # Verify folder matches
        if stored_folder == folder_name:
            self.log(f"✅ Folder persisted correctly: {stored_folder}")
            return True
        else:
            self.log(f"❌ Folder mismatch. Expected: {folder_name}, Got: {stored_folder}", "ERROR")
            return False
    
    def test_tags_filter(self) -> bool:
        """Test Scenario 3: Create 2 notes, tag one, verify filter works"""
        self.log("\n=== Testing Tags Filter ===")
        
        # Step 1: Create two notes
        note1_id = self.create_test_note(
            "Meeting Note", 
            "This is a meeting note about quarterly planning and budget discussions."
        )
        
        note2_id = self.create_test_note(
            "Random Idea", 
            "This is just a random idea about product features and user experience."
        )
        
        if not note1_id or not note2_id:
            return False
        
        # Step 2: Tag the first note with "meeting"
        self.log("Tagging first note with 'meeting'...")
        update_response = self.make_request("PUT", f"notes/{note1_id}", {
            "tags": ["meeting"]
        })
        
        if not update_response["success"]:
            self.log(f"❌ Failed to tag note: {update_response['data']}", "ERROR")
            return False
        
        # Step 3: Fetch all notes for user
        self.log("Fetching all notes to verify tags...")
        fetch_response = self.make_request("GET", "notes", params={"userId": self.user_id})
        
        if not fetch_response["success"]:
            self.log(f"❌ Failed to fetch notes: {fetch_response['data']}", "ERROR")
            return False
        
        notes = fetch_response["data"]["notes"]
        
        # Find our test notes
        meeting_note = None
        random_note = None
        
        for note in notes:
            if note["id"] == note1_id:
                meeting_note = note
            elif note["id"] == note2_id:
                random_note = note
        
        # Verify the meeting note has the tag
        if meeting_note and "meeting" in meeting_note.get("tags", []):
            self.log("✅ Meeting note has correct tag")
        else:
            self.log(f"❌ Meeting note missing tag. Tags: {meeting_note.get('tags', []) if meeting_note else 'Note not found'}", "ERROR")
            return False
        
        # Verify the random note doesn't have the tag
        if random_note and "meeting" not in random_note.get("tags", []):
            self.log("✅ Random note correctly doesn't have meeting tag")
        else:
            self.log(f"❌ Random note incorrectly has meeting tag. Tags: {random_note.get('tags', []) if random_note else 'Note not found'}", "ERROR")
            return False
        
        return True
    
    def test_folder_assignment(self) -> bool:
        """Test Scenario 4: Create note, assign to folder, verify filtering"""
        self.log("\n=== Testing Folder Assignment ===")
        
        # Step 1: Create a note and assign to "Ideas" folder
        note_id = self.create_test_note(
            "Innovation Idea", 
            "This is an innovative idea about AI-powered note-taking and organization."
        )
        
        if not note_id:
            return False
        
        # Step 2: Assign to "Ideas" folder
        self.log("Assigning note to 'Ideas' folder...")
        folder_name = "Ideas"
        
        update_response = self.make_request("PUT", f"notes/{note_id}", {
            "folder": folder_name
        })
        
        if not update_response["success"]:
            self.log(f"❌ Failed to assign folder: {update_response['data']}", "ERROR")
            return False
        
        # Step 3: Fetch all notes and filter client-side by folder
        self.log("Fetching notes and filtering by folder...")
        fetch_response = self.make_request("GET", "notes", params={"userId": self.user_id})
        
        if not fetch_response["success"]:
            self.log(f"❌ Failed to fetch notes: {fetch_response['data']}", "ERROR")
            return False
        
        notes = fetch_response["data"]["notes"]
        ideas_notes = [note for note in notes if note.get("folder") == folder_name]
        
        # Verify our note appears in the Ideas folder
        found_note = None
        for note in ideas_notes:
            if note["id"] == note_id:
                found_note = note
                break
        
        if found_note:
            self.log(f"✅ Note correctly appears in '{folder_name}' folder")
            return True
        else:
            self.log(f"❌ Note not found in '{folder_name}' folder", "ERROR")
            return False
    
    def test_combined_tags_and_folders(self) -> bool:
        """Test combined tags and folders functionality"""
        self.log("\n=== Testing Combined Tags and Folders ===")
        
        # Create a note with both tags and folder
        note_id = self.create_test_note(
            "Project Planning Meeting", 
            "Discussion about Q1 project planning, budget allocation, and team assignments."
        )
        
        if not note_id:
            return False
        
        # Update with both tags and folder
        self.log("Adding both tags and folder...")
        update_response = self.make_request("PUT", f"notes/{note_id}", {
            "tags": ["meeting", "planning", "Q1"],
            "folder": "Work"
        })
        
        if not update_response["success"]:
            self.log(f"❌ Failed to update note: {update_response['data']}", "ERROR")
            return False
        
        # Verify both are persisted
        fetch_response = self.make_request("GET", f"notes/{note_id}")
        
        if not fetch_response["success"]:
            self.log(f"❌ Failed to fetch note: {fetch_response['data']}", "ERROR")
            return False
        
        note_data = fetch_response["data"]["note"]
        stored_tags = note_data.get("tags", [])
        stored_folder = note_data.get("folder")
        
        expected_tags = ["meeting", "planning", "Q1"]
        expected_folder = "Work"
        
        tags_match = set(stored_tags) == set(expected_tags)
        folder_match = stored_folder == expected_folder
        
        if tags_match and folder_match:
            self.log(f"✅ Both tags and folder persisted correctly")
            self.log(f"   Tags: {stored_tags}")
            self.log(f"   Folder: {stored_folder}")
            return True
        else:
            self.log(f"❌ Persistence failed", "ERROR")
            self.log(f"   Expected tags: {expected_tags}, Got: {stored_tags}")
            self.log(f"   Expected folder: {expected_folder}, Got: {stored_folder}")
            return False
    
    def cleanup_test_notes(self):
        """Clean up created test notes"""
        self.log(f"\n=== Cleaning up {len(self.created_notes)} test notes ===")
        
        for note_id in self.created_notes:
            try:
                response = self.make_request("DELETE", f"notes/{note_id}")
                if response["success"]:
                    self.log(f"✅ Deleted note {note_id}")
                else:
                    self.log(f"⚠️ Failed to delete note {note_id}", "WARN")
            except Exception as e:
                self.log(f"⚠️ Error deleting note {note_id}: {str(e)}", "WARN")
    
    def run_all_tests(self) -> Dict[str, bool]:
        """Run all tests and return results"""
        self.log("🚀 Starting Founder Note Backend API Tests")
        self.log(f"Base URL: {self.base_url}")
        self.log(f"Test User ID: {self.user_id}")
        
        results = {}
        
        try:
            # Test 1: Health Check
            results["health_check"] = self.test_health_check()
            
            # Test 2: Tag Persistence
            results["tag_persistence"] = self.test_tag_persistence()
            
            # Test 3: Folder Persistence  
            results["folder_persistence"] = self.test_folder_persistence()
            
            # Test 4: Tags Filter
            results["tags_filter"] = self.test_tags_filter()
            
            # Test 5: Folder Assignment
            results["folder_assignment"] = self.test_folder_assignment()
            
            # Test 6: Combined Tags and Folders
            results["combined_tags_folders"] = self.test_combined_tags_and_folders()
            
        except Exception as e:
            self.log(f"❌ Test suite failed with error: {str(e)}", "ERROR")
            results["error"] = str(e)
        
        finally:
            # Cleanup
            self.cleanup_test_notes()
        
        return results

def main():
    """Main test execution"""
    tester = FounderNoteAPITester()
    results = tester.run_all_tests()
    
    # Print summary
    print("\n" + "="*60)
    print("🏁 TEST RESULTS SUMMARY")
    print("="*60)
    
    passed = 0
    total = 0
    
    for test_name, result in results.items():
        if test_name == "error":
            continue
            
        total += 1
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
        
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if "error" in results:
        print(f"\n❌ Critical Error: {results['error']}")
        return False
    
    return passed == total

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)